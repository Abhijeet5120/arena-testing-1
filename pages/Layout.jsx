

import React, { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from 'react-router-dom';
import { User, Notification as NotificationEntity } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Bell, Menu, Gamepad2, Settings, Star, User as UserIcon, LogOut, Wallet, ListChecks, HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { RegionProvider } from './components/context/RegionContext';
import { useRegion } from './components/context/RegionContext';
import { Badge } from "@/components/ui/badge";

const WalletDisplay = ({ user }) => {
    const { currencySymbol } = useRegion();
    return (
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Wallet className="w-5 h-5 text-slate-500" />
            <span>{currencySymbol}{(user?.wallet_balance || 0).toFixed(2)}</span>
        </div>
    );
};

const NotificationsDropdown = ({ user }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (user) {
            loadNotifications();
        }
    }, [user]);

    const loadNotifications = async () => {
        const notifs = await NotificationEntity.filter({ user_id: user.id }, '-created_date', 10);
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.is_read).length);
    };

    const handleMarkAsRead = async (id) => {
        await NotificationEntity.update(id, { is_read: true });
        loadNotifications();
    };
    
    const handleClearAll = async () => {
        const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
        await Promise.all(unreadIds.map(id => NotificationEntity.update(id, { is_read: true })));
        loadNotifications();
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative rounded-full">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0">{unreadCount}</Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex justify-between items-center">
                    <span>Notifications</span>
                    {notifications.length > 0 && <Button variant="link" size="sm" onClick={handleClearAll}>Clear all</Button>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length > 0 ? (
                    notifications.map(notif => (
                        <DropdownMenuItem key={notif.id} onSelect={(e) => e.preventDefault()} onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}>
                           <div className="flex items-start gap-3">
                                {!notif.is_read && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"/>}
                                <div className={notif.is_read ? 'ml-5' : ''}>
                                    <p className="font-semibold">{notif.title}</p>
                                    <p className="text-sm text-slate-600">{notif.message}</p>
                                </div>
                            </div>
                        </DropdownMenuItem>
                    ))
                ) : (
                    <p className="p-4 text-center text-sm text-slate-500">No new notifications.</p>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const location = useLocation();

  useEffect(() => {
    // --- Anti-Copying Logic ---
    const handleContextmenu = (e) => e.preventDefault();
    const handleKeyDown = (e) => {
      // Block F12, Ctrl+Shift+I, Ctrl+U, Ctrl+C
      if (e.keyCode === 123 || 
          (e.ctrlKey && e.shiftKey && e.keyCode === 73) || 
          (e.ctrlKey && e.keyCode === 85) ||
          (e.ctrlKey && e.keyCode === 67) ||
          (e.metaKey && e.keyCode === 67) // Cmd+C for Mac
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextmenu);
    document.addEventListener('keydown', handleKeyDown);

    // --- User Check Logic ---
    const checkUser = async () => {
      try {
        const userData = await User.me();
        setUser(userData);
        
        // --- Redirection Logic ---
        const isModeratorPage = ['ModeratorDashboard', 'ModeratorOnboarding', 'Profile', 'Wallet', 'MyRegistrations', 'TournamentDetail'].includes(currentPageName);
        const isCreatorPage = ['CreatorDashboard', 'CreatorOnboarding', 'Profile', 'Wallet', 'MyRegistrations', 'TournamentDetail'].includes(currentPageName);

        if (userData.app_role === 'moderator' && !isModeratorPage) {
            window.location.href = createPageUrl('ModeratorDashboard');
        } else if (userData.app_role === 'creator' && !isCreatorPage) {
            window.location.href = createPageUrl('CreatorDashboard');
        } else if (!userData.region_id && !['Onboarding', 'Admin'].includes(currentPageName) && !userData.app_role) {
          window.location.href = createPageUrl('Onboarding');
        }

      } catch (error) {
        // Not logged in
      } finally {
        setCheckingUser(false);
      }
    };
    checkUser();

    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    
    // Cleanup listeners
    return () => {
        document.removeEventListener('contextmenu', handleContextmenu);
        document.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener("scroll", handleScroll);
    };
  }, [currentPageName]);

  const getNavItems = () => {
    let items = [];
    if (!user) {
        items.push({ title: "Games", url: createPageUrl("Games"), icon: Gamepad2 });
        return items;
    }
    
    if (user.role === 'admin') {
      items.push({ title: "Admin Panel", url: createPageUrl("Admin"), icon: Settings });
    }
    
    // Player-specific navigation
    if (!user.app_role || user.app_role === 'player') {
       items.unshift({ title: "Games", url: createPageUrl("Games"), icon: Gamepad2 });
       items.push({ title: "My Registrations", url: createPageUrl("MyRegistrations"), icon: ListChecks });
    }
    
    // Add Wallet for all logged-in users except admin in main nav
    if (user.role !== 'admin') {
        items.push({ title: "Wallet", url: createPageUrl("Wallet"), icon: Wallet });
    }
    
    return items;
  };
  
  const navItems = getNavItems();
  
  // The specific layout for Moderator Dashboard page has been removed.
  // Moderator Dashboard will now render within the main Layout structure.

  return (
    <RegionProvider>
      <style>{`body { -webkit-user-select: none; -ms-user-select: none; user-select: none; }`}</style>
      <div className="min-h-screen flex flex-col bg-slate-50">
        <header className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-sm shadow-md' : 'bg-transparent'}`}>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link to={user?.app_role === 'creator' ? createPageUrl('CreatorDashboard') : user?.app_role === 'moderator' ? createPageUrl('ModeratorDashboard') : createPageUrl("Dashboard")} className="flex items-center gap-2 font-bold text-xl">
                            <Gamepad2 className="w-7 h-7 text-violet-600" />
                            <span>ARENA CLASH</span>
                        </Link>
                        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
                           {navItems.map((item) => (
                                <NavLink
                                    key={item.title}
                                    to={item.url}
                                    className={({ isActive }) =>
                                        `transition-colors hover:text-violet-600 ${
                                        isActive ? 'text-violet-700 font-semibold' : 'text-slate-600'
                                        }`
                                    }
                                >
                                    {item.title}
                                </NavLink>
                            ))}
                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        {user ? (
                            <>
                                <Link to={createPageUrl("Wallet")} className="hidden sm:block cursor-pointer">
                                    <WalletDisplay user={user}/>
                                </Link>
                                <NotificationsDropdown user={user} />
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                            <Avatar>
                                                <AvatarImage src={user.avatar_url} alt={user.full_name} />
                                                <AvatarFallback>{user.full_name?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>{user.full_name}</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild><Link to={createPageUrl("Profile")}><UserIcon className="mr-2 h-4 w-4" /> Profile</Link></DropdownMenuItem>
                                        {user.app_role === 'creator' && <DropdownMenuItem asChild><Link to={createPageUrl("CreatorDashboard")}><Star className="mr-2 h-4 w-4" /> Creator Dashboard</Link></DropdownMenuItem>}
                                        {user.app_role === 'moderator' && <DropdownMenuItem asChild><Link to={createPageUrl("ModeratorDashboard")}><Settings className="mr-2 h-4 w-4" /> Moderator Dashboard</Link></DropdownMenuItem>}
                                        <DropdownMenuItem asChild><Link to={createPageUrl("MyRegistrations")}><ListChecks className="mr-2 h-4 w-4" /> My Registrations</Link></DropdownMenuItem>
                                        <DropdownMenuItem asChild><Link to={createPageUrl("Wallet")}><Wallet className="mr-2 h-4 w-4" /> Wallet</Link></DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => User.logout()}><LogOut className="mr-2 h-4 w-4" /> Log out</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </>
                        ) : (
                            !checkingUser && <Button onClick={() => User.login()}>Login / Sign Up</Button>
                        )}
                         <div className="lg:hidden">
                            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="outline" size="icon"><Menu className="h-5 w-5" /></Button>
                                </SheetTrigger>
                                <SheetContent side="left">
                                <div className="p-4 flex flex-col h-full"> {/* Added flex-col and h-full */}
                                     <Link to="/" className="flex items-center gap-2 font-bold text-xl mb-8">
                                        <Gamepad2 className="w-7 h-7 text-violet-600" />
                                        <span>ARENA CLASH</span>
                                    </Link>
                                    <nav className="grid gap-6 text-lg font-medium flex-grow"> {/* Added flex-grow */}
                                       {navItems.map((item) => (
                                            <NavLink
                                                key={item.title}
                                                to={item.url}
                                                onClick={() => setMobileMenuOpen(false)}
                                                className={({ isActive }) =>
                                                    `flex items-center gap-4 px-2.5 transition-colors hover:text-violet-600 ${
                                                    isActive ? 'text-violet-700 font-semibold' : 'text-slate-600'
                                                    }`
                                                }
                                            >
                                                <item.icon className="w-5 h-5" />
                                                {item.title}
                                            </NavLink>
                                        ))}
                                        {user && user.app_role === 'creator' && (
                                            <NavLink
                                                to={createPageUrl('CreatorDashboard')}
                                                onClick={() => setMobileMenuOpen(false)}
                                                className={({ isActive }) =>
                                                    `flex items-center gap-4 px-2.5 transition-colors hover:text-violet-600 ${
                                                    isActive ? 'text-violet-700 font-semibold' : 'text-slate-600'
                                                    }`
                                                }
                                            >
                                                <Star className="w-5 h-5" />
                                                Creator Dashboard
                                            </NavLink>
                                        )}
                                        {user && user.app_role === 'moderator' && (
                                            <NavLink
                                                to={createPageUrl('ModeratorDashboard')}
                                                onClick={() => setMobileMenuOpen(false)}
                                                className={({ isActive }) =>
                                                    `flex items-center gap-4 px-2.5 transition-colors hover:text-violet-600 ${
                                                    isActive ? 'text-violet-700 font-semibold' : 'text-slate-600'
                                                    }`
                                                }
                                            >
                                                <Settings className="w-5 h-5" />
                                                Moderator Dashboard
                                            </NavLink>
                                        )}
                                    </nav>
                                    {user && (
                                      <div className="mt-auto pt-4"> {/* Used mt-auto to push to bottom */}
                                        <Link to={createPageUrl("Wallet")} onClick={() => setMobileMenuOpen(false)} className="block w-full">
                                           <div className="p-3 bg-slate-100 rounded-lg">
                                              <WalletDisplay user={user} />
                                           </div>
                                        </Link>
                                      </div>
                                    )}
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                </div>
            </div>
        </header>

        <main className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
        
        <footer className="bg-white border-t">
          <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} ARENA CLASH. All rights reserved.
          </div>
        </footer>
      </div>
    </RegionProvider>
  );
}

