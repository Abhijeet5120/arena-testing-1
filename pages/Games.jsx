
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Gamepad, Trophy } from "lucide-react";
import { Game, GameMode, Tournament } from "@/api/entities";
import { motion } from "framer-motion";
import { useRegion } from "../components/context/RegionContext";


export default function GamesPage() {
  const [games, setGames] = useState([]);
  const [gameStats, setGameStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { region } = useRegion();

  useEffect(() => {
    const loadData = async () => {
        if (!region) {
            setLoading(false);
            return;
        }
      try {
        const [gamesData, modesData, tournamentsData] = await Promise.all([
            Game.filter({ region_id: region.id },'-created_date'),
            GameMode.list(), // GameModes are global, but we filter based on games in the region
            Tournament.filter({ region_id: region.id })
        ]);
        
        const gamesInRegionIds = gamesData.map(g => g.id);
        
        setGames(gamesData);

        const stats = {};
        gamesData.forEach(game => {
            const modes = modesData.filter(m => m.game_id === game.id);
            const modeIds = modes.map(m => m.id);
            const activeTournaments = tournamentsData.filter(t => modeIds.includes(t.game_mode_id) && t.status === 'registration_open');
            stats[game.id] = {
                gameModeCount: modes.length,
                activeTournamentCount: activeTournaments.length,
            };
        });
        setGameStats(stats);

      } catch (error) {
        console.error("Error loading games data:", error);
      } finally {
        setLoading(false);
      }
    };
    if(region) {
        loadData();
    }
  }, [region]);

  const filteredGames = games.filter(game => {
    const matchesSearch = game.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || game.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "fps", label: "FPS" },
    { value: "moba", label: "MOBA" },
    { value: "battle_royale", label: "Battle Royale" },
    { value: "strategy", label: "Strategy" },
    { value: "sports", label: "Sports" },
    { value: "racing", label: "Racing" },
    { value: "fighting", label: "Fighting" }
  ];

  if (!region && !loading) {
      return (
          <div className="container mx-auto px-4 text-center py-20">
              <h2 className="text-2xl font-bold text-slate-700">Please Select a Region</h2>
              <p className="text-slate-500 mt-2">You need to select your region to see available games. If you haven't, please complete your onboarding.</p>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Choose Your Arena
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
              Select a game to view available tournaments and start competing with players worldwide.
            </p>
          </motion.div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-12 max-w-2xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="Search games..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200 py-3"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48 rounded-xl">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Games Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="bg-slate-200 animate-pulse h-96 rounded-2xl"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredGames.map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                whileHover={{ scale: 1.03, y: -5 }}
                className="h-full"
              >
                <Link to={createPageUrl(`Game?id=${game.id}`)} className="h-full flex">
                  <Card className="w-full rounded-2xl overflow-hidden group border-2 border-transparent hover:border-violet-300 hover:shadow-2xl hover:shadow-violet-200 transition-all duration-300 flex flex-col">
                    <CardContent className="p-0 flex-grow flex flex-col">
                      <div className="relative h-48">
                        <img
                          src={game.banner_url}
                          alt={game.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
                      </div>
                      <div className="p-4 flex-grow flex flex-col">
                          <div className="flex items-center gap-3 -mt-12 mb-3">
                              {game.logo_url && 
                                  <img src={game.logo_url} alt={`${game.name} logo`} className="w-16 h-16 rounded-xl border-4 border-white object-cover shadow-lg"/>
                              }
                              <h3 className="text-xl font-bold text-slate-800 pt-12">{game.name}</h3>
                          </div>
                        <p className="text-sm text-slate-600 line-clamp-2 flex-grow">{game.description || game.tagline}</p>
                        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-around text-center">
                            <div>
                                <p className="font-bold text-slate-700">{gameStats[game.id]?.gameModeCount || 0}</p>
                                <p className="text-xs text-slate-500">Gamemodes</p>
                            </div>
                            <div>
                                <p className="font-bold text-slate-700">{gameStats[game.id]?.activeTournamentCount || 0}</p>
                                <p className="text-xs text-slate-500">Active</p>
                            </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && filteredGames.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-2xl font-semibold text-slate-700 mb-2">No games found</h3>
            <p className="text-slate-500 mb-6">Try adjusting your search terms or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
