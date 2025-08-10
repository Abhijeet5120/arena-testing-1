
import React, { useState, useEffect } from "react";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart3, 
  Trophy, 
  GamepadIcon as Gamepad, 
  Users, 
  Settings,
  Globe,
  ShieldCheck,
  CreditCard,
  UserCheck, 
  ChevronRight,
  Menu,
  X
} from "lucide-react";

import AdminDashboard from "../components/admin/AdminDashboard";
import GameManagement from "../components/admin/GameManagement";
import TournamentManagement from "../components/admin/TournamentManagement";
import UserManagement from "../components/admin/UserManagement";
import AdminSettings from "../components/admin/AdminSettings";
import RegionManagement from "../components/admin/RegionManagement";
import ModeratorManagement from "../components/admin/ModeratorManagement";
import CreatorManagement from "../components/admin/CreatorManagement";
import PaymentsManagement from "../components/admin/PaymentsManagement";
import RegionSwitcher from "../components/admin/RegionSwitcher";

export default function Admin() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(null);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const userData = await User.me();
        if (userData.role !== 'admin') {
          window.location.href = createPageUrl("Dashboard");
          return;
        }
        setUser(userData);
      } catch (error) {
        window.location.href = createPageUrl("Dashboard");
      } finally {
        setLoading(false);
      }
    };
    checkAdminAccess();
  }, []);

  const sidebarItems = [
    { id: 'dashboard', title: 'Dashboard', icon: BarChart3 },
    { id: 'games', title: 'Games', icon: Gamepad },
    { id: 'tournaments', title: 'Tournaments', icon: Trophy },
    { id: 'users', title: 'Users & Roles', icon: Users },
    { id: 'moderators', title: 'Moderator Data', icon: ShieldCheck },
    { id: 'creators', title: 'Creator Data', icon: UserCheck },
    { id: 'payments', title: 'Payments', icon: CreditCard },
    { id: 'regions', title: 'Regions', icon: Globe },
    { id: 'settings', title: 'Settings', icon: Settings },
  ];

  const renderContent = () => {
    if (!selectedRegion && !['regions', 'settings', 'users'].includes(activeSection)) {
        return (
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
                <Globe className="mx-auto h-12 w-12 text-violet-500 mb-4" />
                <h2 className="text-2xl font-bold text-slate-800">Please select a region</h2>
                <p className="text-slate-600 mt-2">Select a region from the sidebar to manage its data. Region-specific data cannot be displayed without a selection.</p>
            </div>
        );
    }
      
    const components = {
      dashboard: <AdminDashboard selectedRegion={selectedRegion} />,
      games: <GameManagement selectedRegion={selectedRegion} />,
      tournaments: <TournamentManagement selectedRegion={selectedRegion} />,
      users: <UserManagement selectedRegion={selectedRegion} />,
      moderators: <ModeratorManagement selectedRegion={selectedRegion} />,
      creators: <CreatorManagement selectedRegion={selectedRegion} />,
      payments: <PaymentsManagement selectedRegion={selectedRegion} />,
      regions: <RegionManagement />,
      settings: <AdminSettings />,
    };
    return components[activeSection];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-slate-700 to-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <p className="text-lg text-slate-600">Verifying admin access...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-100">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 bg-white/80 backdrop-blur-sm border-b border-slate-200 p-4 z-40">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
            Admin Panel
          </h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl bg-gradient-to-r from-slate-700 to-slate-900 text-white shadow-lg"
          >
            <Menu className="w-6 h-6" />
          </motion.button>
        </div>
      </header>

      <div className="flex">
        {/* Premium Sidebar */}
        <AnimatePresence>
          {(sidebarOpen || window.innerWidth >= 1024) && (
            <motion.aside
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`${
                sidebarOpen ? 'fixed inset-0 z-50 lg:relative lg:inset-auto' : 'hidden lg:block'
              } w-72 bg-slate-900 text-slate-200 flex flex-col h-screen lg:sticky top-0`}
            >
              {/* Sidebar Header */}
              <div className="p-4 border-b border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                      <Settings className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Admin Panel</h2>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSidebarOpen(false)}
                    className="lg:hidden p-2 rounded-lg bg-white/10 backdrop-blur-sm text-white border border-white/20"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              {/* Region Switcher */}
              <div className="p-4 border-b border-slate-700/50">
                <RegionSwitcher 
                  selectedRegion={selectedRegion} 
                  onRegionChange={setSelectedRegion}
                  enforceSelection={true}
                />
              </div>

              {/* Premium Sidebar Navigation */}
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {sidebarItems.map((item) => (
                  <motion.button
                    key={item.id}
                    whileHover={{ scale: 1.02, x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setActiveSection(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-sm font-medium ${
                      activeSection === item.id
                        ? 'bg-violet-500/20 text-white'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${activeSection === item.id ? 'text-violet-300' : 'text-slate-400'}`} />
                    <span>{item.title}</span>
                  </motion.button>
                ))}
              </nav>

              {/* Premium User Info */}
              <div className="p-4 bg-slate-900 border-t border-slate-700/50">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-white/20 to-white/10 rounded-full flex items-center justify-center font-bold text-white shadow-lg border border-white/20">
                      {user?.full_name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{user?.full_name}</p>
                      <p className="text-xs text-slate-300 font-medium">Administrator</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 min-h-screen w-full lg:w-0">
          <div className="p-4 sm:p-6 lg:p-8">
            <motion.div
              key={`${activeSection}-${selectedRegion}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {renderContent()}
            </motion.div>
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        />
      )}
    </div>
  );
}
