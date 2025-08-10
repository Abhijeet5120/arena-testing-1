
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Participation, Tournament, Region, Notification, Game } from "@/api/entities";
import { Users, Search, Trophy, Crown, DollarSign, User as UserIcon, Hash, Edit, Trash2, ShieldCheck, Star, Gamepad } from "lucide-react";
import { motion } from "framer-motion";

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
  const uid = '10' + Math.abs(hash).toString().slice(0, 9);
  return uid.padEnd(11, '0');
};

export default function UserManagement({ selectedRegion: adminSelectedRegion }) {
  const [users, setUsers] = useState([]);
  const [participations, setParticipations] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [regions, setRegions] = useState([]);
  const [games, setGames] = useState([]); // State for games
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("name");

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ app_role: 'player', assigned_game_id: '' });

  useEffect(() => {
    loadData();
  }, [adminSelectedRegion]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, participationsData, tournamentsData, regionsData, gamesData] = await Promise.all([
        User.list(),
        Participation.list(),
        Tournament.list(),
        Region.list(),
        Game.list() // Fetch all games for the dropdown
      ]);
      setUsers(usersData);
      setParticipations(participationsData);
      setTournaments(tournamentsData);
      setRegions(regionsData);
      setGames(gamesData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getUserStats = (userId) => {
    const userParticipations = participations.filter(p => p.player_id === userId);
    const wins = userParticipations.filter(p => p.status === 'winner').length;
    const totalPrize = userParticipations.reduce((sum, p) => sum + (p.prize_won || 0), 0);
    
    return {
      tournaments: userParticipations.length,
      wins,
      totalPrize
    };
  };
  
  const getCurrencySymbol = (regionId) => {
    if (!regionId) return "$";
    const region = regions.find(r => r.id === regionId);
    return region ? region.currency_symbol : "$";
  };

  const getRegionName = (regionId) => {
    if (!regionId) return "No Region";
    const region = regions.find(r => r.id === regionId);
    return region ? region.name : "Unknown Region";
  };
  
  const handleEditClick = (user) => {
    setEditingUser(user);
    const assignedModGame = user.assigned_games?.[0] || '';
    const assignedCreatorGame = user.assigned_games_creator?.[0] || '';

    setFormData({
      app_role: user.app_role || 'player',
      assigned_game_id: user.app_role === 'moderator' ? assignedModGame : (user.app_role === 'creator' ? assignedCreatorGame : ''),
    });
    setShowEditDialog(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const payload = { app_role: formData.app_role };
      
      if (formData.app_role === 'moderator') {
          payload.assigned_games = formData.assigned_game_id ? [formData.assigned_game_id] : [];
          payload.assigned_games_creator = []; // Clear other role's games
      } else if (formData.app_role === 'creator') {
          payload.assigned_games_creator = formData.assigned_game_id ? [formData.assigned_game_id] : [];
          payload.assigned_games = []; // Clear other role's games
      } else {
          payload.assigned_games = [];
          payload.assigned_games_creator = [];
      }

      await User.update(editingUser.id, payload);
      
      await Notification.create({
        user_id: editingUser.id,
        title: "Your Role Has Been Updated",
        message: `An administrator has changed your role to: ${formData.app_role}.`,
      });

      setShowEditDialog(false);
      setEditingUser(null);
      loadData();
    } catch (error) {
      console.error("Error updating user role:", error);
      alert("Failed to update user role. Your plan may not support this feature or there was a server error.");
    }
  };
  
  const handleDeleteUser = async (userId) => {
    if (confirm("Are you sure? This will permanently delete the user. This action cannot be undone.")) {
      try {
        await User.delete(userId);
        loadData(); // Reload data to reflect changes
      } catch (error)
{
        console.error("Error deleting user:", error);
        alert("Failed to delete user. There was a server error.");
      }
    }
  };

  const filteredUsers = users.filter(user => {
    // First filter by region if selected
    const regionMatch = !adminSelectedRegion || user.region_id === adminSelectedRegion;
    
    if (!regionMatch) return false;

    // Then filter by search term
    if (!searchTerm) return true;

    if (searchType === "name") {
      return user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    } else {
      // Search by user ID
      const userIdFormatted = formatUserId(user.id);
      return userIdFormatted.includes(searchTerm);
    }
  });

  const getRoleBadge = (user) => {
    const role = user.role === 'admin' ? 'admin' : user.app_role || 'player';
    const roleStyles = {
      admin: { icon: Crown, className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
      moderator: { icon: ShieldCheck, className: "bg-purple-100 text-purple-800 border-purple-200" },
      creator: { icon: Star, className: "bg-blue-100 text-blue-800 border-blue-200" },
      player: { icon: UserIcon, className: "bg-slate-100 text-slate-800 border-slate-200" }
    };
    const { icon: Icon, className } = roleStyles[role] || roleStyles['player'];
    return (
      <Badge variant="outline" className={`capitalize ${className}`}>
        <Icon className="w-3 h-3 mr-1.5" />
        {role}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-violet-500 mx-auto mb-4"></div>
        <p className="text-slate-600">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
          Users & Roles
        </h1>
        <p className="text-slate-600 mt-1">
          Monitor and manage all players and their roles on the platform.
        </p>
      </div>

      {/* Search Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input
            placeholder={searchType === "name" ? "Search users by name or email..." : "Search by User ID (e.g., 10123456789)..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 rounded-xl bg-white border border-slate-200 py-3 h-11"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {setSearchType("name"); setSearchTerm("");}}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors h-11 ${
              searchType === "name" 
                ? 'bg-slate-800 text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Name/Email
          </button>
          <button
            onClick={() => {setSearchType("id"); setSearchTerm("");}}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors h-11 ${
              searchType === "id" 
                ? 'bg-slate-800 text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Hash className="w-4 h-4 inline mr-2" />
            User ID
          </button>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredUsers.map((user, index) => {
          const stats = getUserStats(user.id);
          const currencySymbol = getCurrencySymbol(user.region_id);
          return (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className={`rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-0 h-full flex flex-col bg-white ${
                searchType === "id" && searchTerm && formatUserId(user.id).includes(searchTerm) 
                  ? 'ring-2 ring-violet-500 ring-opacity-70' 
                  : ''
              }`}>
                <CardContent className="p-5 flex-grow flex flex-col">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600 text-lg">
                      {user.full_name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="font-bold text-slate-800 truncate" title={user.full_name}>
                        {user.full_name || 'Unknown User'}
                      </p>
                      <p className="text-xs text-slate-500 truncate" title={user.email}>{user.email}</p>
                      <div className="mt-2">{getRoleBadge(user)}</div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <Badge variant="secondary" className="text-xs">
                      {getRegionName(user.region_id)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-3 text-center my-auto py-3">
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <p className="text-lg font-bold text-slate-700">{stats.tournaments}</p>
                      <p className="text-xs text-slate-500">Played</p>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <p className="text-lg font-bold text-slate-700">{stats.wins}</p>
                      <p className="text-xs text-slate-500">Wins</p>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <p className="text-lg font-bold text-slate-700">{currencySymbol}{stats.totalPrize.toFixed(2)}</p>
                      <p className="text-xs text-slate-500">Prize</p>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <p className="text-lg font-bold text-slate-700">{currencySymbol}{(user.wallet_balance || 0).toFixed(2)}</p>
                      <p className="text-xs text-slate-500">Wallet</p>
                    </div>
                  </div>
                </CardContent>
                <div className="px-5 pb-5 mt-auto flex gap-2">
                   <Button size="sm" variant="outline" className="flex-1 rounded-lg" onClick={() => handleEditClick(user)}>
                     <Edit className="w-3 h-3 mr-2" />
                     Manage
                   </Button>
                   <Button size="sm" variant="outline" className="rounded-lg border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleDeleteUser(user.id)}>
                     <Trash2 className="w-3 h-3" />
                   </Button>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gradient-to-r from-violet-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-12 h-12 text-violet-400" />
          </div>
          <p className="text-xl font-medium text-slate-600 mb-2">No users found</p>
          <p className="text-slate-500">
            {searchTerm ? "Try adjusting your search terms" : "No users in the selected region"}
          </p>
        </div>
      )}
      
      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Manage User: {editingUser?.full_name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div>
              <Label htmlFor="app_role">Assign Role</Label>
              <Select
                value={formData.app_role}
                onValueChange={(value) => setFormData(prev => ({...prev, app_role: value, assigned_game_id: ''}))}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="player">Player</SelectItem>
                  <SelectItem value="creator">Creator</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-2">Admins must be assigned at the platform level.</p>
            </div>
            
            {(formData.app_role === 'moderator' || formData.app_role === 'creator') && (
              <div>
                <Label htmlFor="assigned_game_id">Assign Game</Label>
                 <Select
                    value={formData.assigned_game_id}
                    onValueChange={(value) => setFormData(prev => ({...prev, assigned_game_id: value}))}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select a game to assign" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={null}>None</SelectItem> {/* Use empty string for 'None' */}
                        {games.filter(g => editingUser && g.region_id === editingUser.region_id).map(game => (
                            <SelectItem key={game.id} value={game.id}>{game.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500 mt-2">Assign one game for this role. Only games in the user's region are shown.</p>
              </div>
            )}
            
            <Button type="submit" className="w-full bg-slate-800 text-white hover:bg-slate-900 rounded-xl">
              Save Changes
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
