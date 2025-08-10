import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, GamepadIcon as Gamepad, DollarSign, TrendingUp, Calendar, Link as LinkIcon } from "lucide-react";
import { Tournament, Game, GameMode, Participation, User, Region } from "@/api/entities";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AdminDashboard({ selectedRegion }) {
  const [stats, setStats] = useState({
    totalTournaments: 0,
    totalGames: 0,
    totalGameModes: 0,
    totalParticipants: 0,
    totalPrizePool: 0,
    activeTournaments: 0,
    totalUsers: 0,
    totalWalletBalance: 0,
  });
  const [recentTournaments, setRecentTournaments] = useState([]);
  const [recentPlayers, setRecentPlayers] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedRegion]);

  const loadData = async () => {
    try {
      const [tournaments, games, gameModes, participations, users, regionsData] = await Promise.all([
        Tournament.list('-created_date'),
        Game.list(),
        GameMode.list(),
        Participation.list(),
        User.list('-created_date', 5),
        Region.list()
      ]);
      
      setRegions(regionsData);
      
      // Filter data by selected region if applicable
      let filteredUsers = users;
      let filteredTournaments = tournaments;
      let filteredParticipations = participations;
      
      if (selectedRegion) {
        filteredUsers = users.filter(user => user.region_id === selectedRegion);
        // For tournaments, we need to check if participants are from the selected region
        const userIdsInRegion = filteredUsers.map(u => u.id);
        filteredParticipations = participations.filter(p => userIdsInRegion.includes(p.player_id));
        const tournamentIdsWithRegionParticipants = [...new Set(filteredParticipations.map(p => p.tournament_id))];
        filteredTournaments = tournaments.filter(t => tournamentIdsWithRegionParticipants.includes(t.id));
      }
      
      const totalPrizePool = filteredTournaments.reduce((sum, t) => sum + (t.prize_pool || 0), 0);
      const activeTournaments = filteredTournaments.filter(t => t.status === 'registration_open' || t.status === 'ongoing').length;
      const totalWalletBalance = filteredUsers.reduce((sum, u) => sum + (u.wallet_balance || 0), 0);
      
      setStats({
        totalTournaments: filteredTournaments.length,
        totalGames: games.length,
        totalGameModes: gameModes.length,
        totalParticipants: filteredParticipations.length,
        totalPrizePool,
        activeTournaments,
        totalUsers: filteredUsers.length,
        totalWalletBalance,
      });

      setRecentTournaments(filteredTournaments.slice(0, 3));
      setRecentPlayers(filteredUsers.slice(0, 3));

    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrencySymbol = () => {
    if (!selectedRegion) return "$";
    const region = regions.find(r => r.id === selectedRegion);
    return region ? region.currency_symbol : "$";
  };

  const getRegionName = () => {
    if (!selectedRegion) return "All Regions";
    const region = regions.find(r => r.id === selectedRegion);
    return region ? region.name : "All Regions";
  };
  
  const statItems = [
    { 
      title: "Total Users", 
      value: stats.totalUsers, 
      icon: Users, 
      color: "from-blue-400 to-cyan-500",
      bgColor: "from-blue-50 to-cyan-50",
    },
    { 
      title: "Total Tournaments", 
      value: stats.totalTournaments, 
      icon: Trophy, 
      color: "from-yellow-400 to-orange-500",
      bgColor: "from-yellow-50 to-orange-50",
    },
    { 
      title: "Active Games", 
      value: stats.totalGames, 
      icon: Gamepad, 
      color: "from-violet-400 to-purple-500",
      bgColor: "from-violet-50 to-purple-50",
    },
    { 
      title: "Total Participants", 
      value: stats.totalParticipants, 
      icon: Users, 
      color: "from-green-400 to-emerald-500",
      bgColor: "from-green-50 to-emerald-50",
    },
    { 
      title: "Total Prize Pool", 
      value: `${getCurrencySymbol()}${stats.totalPrizePool.toLocaleString()}`, 
      icon: DollarSign, 
      color: "from-pink-400 to-rose-500",
      bgColor: "from-pink-50 to-rose-50",
    },
    { 
      title: "Wallet Balance", 
      value: `${getCurrencySymbol()}${stats.totalWalletBalance.toLocaleString()}`, 
      icon: TrendingUp, 
      color: "from-indigo-400 to-blue-500",
      bgColor: "from-indigo-50 to-blue-50",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array(6).fill(0).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
            <div className="h-16 bg-slate-200 rounded-xl mb-4"></div>
            <div className="h-8 bg-slate-200 rounded-lg mb-2"></div>
            <div className="h-4 bg-slate-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Dashboard Overview
        </h1>
        <p className="text-slate-600">
          Monitor your platform's performance and key metrics • {getRegionName()}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statItems.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card className={`rounded-2xl border-0 bg-gradient-to-br ${item.bgColor} shadow-lg hover:shadow-xl transition-all duration-300`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-sm font-medium text-slate-600 mb-2">{item.title}</CardTitle>
                  <div className="text-3xl font-bold text-slate-800">{item.value}</div>
                </div>
                <div className={`w-16 h-16 bg-gradient-to-r ${item.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                  <item.icon className="h-8 w-8 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <LinkIcon className="w-4 h-4"/>
                  <span>Live data from platform</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Recent Tournaments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTournaments.length > 0 ? recentTournaments.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-medium text-slate-800">{t.title}</p>
                    <p className="text-sm text-slate-500">{t.status.replace(/_/g, ' ')} • {t.current_participants || 0} participants</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{getCurrencySymbol()}{t.prize_pool?.toLocaleString()}</p>
                    <p className="text-xs text-slate-500">Prize Pool</p>
                  </div>
                </div>
              )) : <p className="text-slate-500 text-center py-4">No tournaments found for selected region.</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Latest Players
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPlayers.length > 0 ? recentPlayers.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-violet-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {p.full_name?.[0]?.toUpperCase() || 'P'}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{p.full_name}</p>
                      <p className="text-sm text-slate-500">{p.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{getCurrencySymbol()}{(p.wallet_balance || 0).toFixed(2)}</p>
                    <p className="text-xs text-slate-500">Wallet</p>
                  </div>
                </div>
              )) : <p className="text-slate-500 text-center py-4">No players found for selected region.</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}