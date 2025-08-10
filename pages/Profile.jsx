
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User, Region, Participation, LinkedAccount, Game } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Shield, DollarSign, Edit, User as UserIcon, Mail, Globe, Gamepad2, Plus, Trash2, ArrowRight, Star, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useRegion } from "../components/context/RegionContext";

// Helper function to format the user ID
const formatUserId = (id) => {
  if (!id) return '';
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Create an 11-digit UID string
  // Ensure the hash is positive, convert to string, take up to 9 digits, pad to 11
  const uid = '10' + Math.abs(hash).toString().slice(0, 9);
  return uid.padEnd(11, '0');
};

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [regionName, setRegionName] = useState("N/A");
  const [stats, setStats] = useState({ tournaments: 0, wins: 0, earnings: 0 });
  const [loading, setLoading] = useState(true);
  const { currencySymbol } = useRegion();

  const [games, setGames] = useState([]);
  const [linkedAccounts, setLinkedAccounts] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({ game_id: "", in_game_name: "", in_game_uid: "" });
  const [isSaving, setIsSaving] = useState(false);

  const loadProfileData = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      
      const [regions, participations, allGames, userAccounts] = await Promise.all([
        Region.list(),
        Participation.filter({ player_id: userData.id }),
        Game.list(),
        LinkedAccount.filter({ user_id: userData.id })
      ]);

      const userRegion = regions.find(r => r.id === userData.region_id);
      if (userRegion) setRegionName(userRegion.name);

      const wins = participations.filter(p => p.status === 'winner').length;
      const earnings = participations.reduce((acc, p) => acc + (p.prize_won || 0), 0);
      setStats({ tournaments: participations.length, wins, earnings });
      
      setGames(allGames);
      setLinkedAccounts(userAccounts);

    } catch (error) {
      console.error("Error fetching profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  const handleOpenDialog = (account = null) => {
    setEditingAccount(account);
    if (account) {
      setFormData({ game_id: account.game_id, in_game_name: account.in_game_name, in_game_uid: account.in_game_uid });
    } else {
      setFormData({ game_id: "", in_game_name: "", in_game_uid: "" });
    }
    setShowDialog(true);
  };

  const handleSubmitAccount = async () => {
    if (!formData.game_id || !formData.in_game_name) {
      alert("Please fill out all required fields.");
      return;
    }
    setIsSaving(true);
    try {
      if (editingAccount) {
        await LinkedAccount.update(editingAccount.id, formData);
      } else {
        await LinkedAccount.create({ ...formData, user_id: user.id });
      }
      setShowDialog(false);
      await loadProfileData(); // Reload all data to ensure consistency
    } catch (error) {
      console.error("Error saving linked account:", error);
      alert("Failed to save account. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async (accountId) => {
    if (confirm("Are you sure you want to delete this linked account?")) {
      try {
        await LinkedAccount.delete(accountId);
        await loadProfileData();
      } catch (error) {
        console.error("Error deleting account:", error);
      }
    }
  };
  
  const getGameById = (gameId) => games.find(g => g.id === gameId);
  
  const RoleDashboardLink = () => {
    const roleLinks = {
      moderator: {
        href: createPageUrl("ModeratorDashboard"),
        text: "Moderator Dashboard",
        icon: Shield,
        className: "from-purple-500 to-violet-600"
      },
      creator: {
        href: createPageUrl("CreatorDashboard"),
        text: "Creator Dashboard",
        icon: Star,
        className: "from-blue-500 to-cyan-600"
      }
    };
    
    const roleInfo = roleLinks[user.app_role];

    if (!roleInfo) return null;

    return (
      <Link to={roleInfo.href}>
        <motion.div
          whileHover={{ scale: 1.03, y: -3 }}
          className={`p-4 rounded-xl bg-gradient-to-r ${roleInfo.className} text-white shadow-lg flex items-center justify-between`}
        >
          <div className="flex items-center gap-3">
            <roleInfo.icon className="w-6 h-6" />
            <span className="font-semibold">{roleInfo.text}</span>
          </div>
          <ArrowRight className="w-5 h-5" />
        </motion.div>
      </Link>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-violet-500"></div>
      </div>
    );
  }

  if (!user) {
    return <div className="text-center py-12 text-slate-600">Could not load user profile. Please try again.</div>;
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-8">
            <Card className="rounded-2xl shadow-lg border-0">
              <CardContent className="p-6 text-center">
                <Avatar className="w-28 h-28 border-4 border-white shadow-lg mx-auto -mt-16">
                  <AvatarImage src={user.avatar_url} alt={user.full_name} />
                  <AvatarFallback className="text-4xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                    {user.full_name?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h1 className="text-2xl font-bold text-slate-800 mt-4">{user.full_name}</h1>
                <p className="text-slate-500">{user.email}</p>
                <Badge variant="outline" className="mt-3 capitalize border-violet-200 bg-violet-50 text-violet-700 font-medium">
                  {user.app_role || 'Player'}
                </Badge>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-lg">Account Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 flex items-center gap-2"><UserIcon className="w-4 h-4" /> User ID</span>
                  <span className="font-mono text-slate-700">{formatUserId(user.id)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Wallet</span>
                  <span className="font-semibold text-emerald-600">{currencySymbol}{(user.wallet_balance || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 flex items-center gap-2"><Globe className="w-4 h-4" /> Region</span>
                  <span className="font-semibold text-slate-700">{regionName}</span>
                </div>
              </CardContent>
            </Card>
            
            {(user.app_role === 'moderator' || user.app_role === 'creator') && (
              <RoleDashboardLink />
            )}
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <Card className="rounded-2xl shadow-lg border-0 p-4">
                  <Trophy className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
                  <p className="text-2xl font-bold text-slate-700">{stats.tournaments}</p>
                  <p className="text-sm text-slate-500">Tournaments</p>
                </Card>
                <Card className="rounded-2xl shadow-lg border-0 p-4">
                  <Shield className="w-8 h-8 mx-auto text-green-500 mb-2" />
                  <p className="text-2xl font-bold text-slate-700">{stats.wins}</p>
                  <p className="text-sm text-slate-500">Wins</p>
                </Card>
                <Card className="rounded-2xl shadow-lg border-0 p-4">
                  <DollarSign className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                  <p className="text-2xl font-bold text-slate-700">{currencySymbol}{stats.earnings.toFixed(2)}</p>
                  <p className="text-sm text-slate-500">Earnings</p>
                </Card>
            </div>

            <Card className="rounded-2xl shadow-lg border-0">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Linked Game Accounts</CardTitle>
                <Button size="sm" onClick={() => handleOpenDialog()} className="bg-slate-800 hover:bg-slate-900 rounded-lg">
                  <Plus className="w-4 h-4 mr-2"/>
                  Add Account
                </Button>
              </CardHeader>
              <CardContent>
                {linkedAccounts.length > 0 ? (
                  <div className="space-y-4">
                    {linkedAccounts.map(account => {
                      const game = getGameById(account.game_id);
                      return (
                        <div key={account.id} className="flex items-center justify-between p-3 bg-slate-100 rounded-lg">
                          <div className="flex items-center gap-3">
                            {game?.logo_url ? (
                              <img src={game.logo_url} alt={game.name} className="w-10 h-10 rounded-md object-cover"/>
                            ) : (
                              <div className="w-10 h-10 rounded-md bg-slate-200 flex items-center justify-center">
                                <Gamepad2 className="w-5 h-5 text-slate-500" />
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-slate-800">{account.in_game_name}</p>
                              <p className="text-xs text-slate-500">{game?.name || 'Unknown Game'} - UID: {account.in_game_uid || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="icon" variant="ghost" className="text-slate-500 hover:text-slate-800" onClick={() => handleOpenDialog(account)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => handleDeleteAccount(account.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500">No game accounts linked yet.</p>
                    <p className="text-sm text-slate-400">Link your accounts to join tournaments.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAccount ? 'Edit Linked Account' : 'Add New Game Account'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="game_id">Game</Label>
              <Select value={formData.game_id} onValueChange={(value) => setFormData({...formData, game_id: value})}>
                  <SelectTrigger>
                      <SelectValue placeholder="Select a game" />
                  </SelectTrigger>
                  <SelectContent>
                      {games.map(game => (
                          <SelectItem key={game.id} value={game.id}>{game.name}</SelectItem>
                      ))}
                  </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="in_game_name">In-Game Name</Label>
              <Input id="in_game_name" value={formData.in_game_name} onChange={(e) => setFormData({...formData, in_game_name: e.target.value})} />
            </div>
            <div>
              <Label htmlFor="in_game_uid">In-Game UID (Optional)</Label>
              <Input id="in_game_uid" value={formData.in_game_uid} onChange={(e) => setFormData({...formData, in_game_uid: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmitAccount} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
