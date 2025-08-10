
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Game, GameMode, Tournament, TournamentTemplate } from "@/api/entities";
import { motion } from "framer-motion";
import { ChevronRight, Gamepad2, Settings, Users, Zap } from 'lucide-react';
import { useRegion } from '../components/context/RegionContext';

export default function GamePage() {
  const [game, setGame] = useState(null);
  const [gameModes, setGameModes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { region } = useRegion();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const gameId = params.get("id");

    if (gameId && region) {
      const loadData = async () => {
        setLoading(true);
        try {
          const gameData = await Game.get(gameId);
          
          if (!gameData || gameData.region_id !== region.id) {
            throw new Error("Game not found in your region.");
          }

          setGame(gameData);
          const modesData = await GameMode.filter({ game_id: gameId });
          setGameModes(modesData);
        } catch (error) {
          console.error("Error loading game data:", error);
          setGame(null); // Set game to null if not found or not in region
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [location.search, region]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  if (!game) {
    return <div className="text-center py-12">Game not found or is not available in your region.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="relative h-96">
        <img src={game.banner_url} alt={game.name} className="w-full h-full object-cover"/>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-0 left-0 p-8 md:p-12">
           <div className="flex items-end gap-6">
                <img src={game.logo_url} alt={`${game.name} logo`} className="w-32 h-32 rounded-2xl border-4 border-white object-cover shadow-lg"/>
                <div>
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-2">{game.name}</h1>
                    <p className="text-lg text-slate-200">{game.tagline}</p>
                </div>
           </div>
        </div>
      </div>
      
      {/* Gamemodes Section */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-slate-800 mb-8 text-center">Available Game Modes</h2>
        {gameModes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {gameModes.map(mode => (
                    <motion.div key={mode.id} whileHover={{ y: -5 }}>
                        <Link to={createPageUrl(`GameMode?id=${mode.id}`)}>
                            <Card className="rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-0 overflow-hidden">
                                <CardHeader>
                                    <CardTitle className="text-xl font-bold text-slate-800">{mode.name}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-slate-600 mb-4">{mode.description || "Join the action in this exciting mode."}</p>
                                    <div className="flex justify-between items-center">
                                        <Badge variant="secondary">{mode.team_size}v{mode.team_size}</Badge>
                                        <div className="text-violet-600 font-semibold flex items-center gap-1">
                                            View Tournaments <ChevronRight className="w-4 h-4"/>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    </motion.div>
                ))}
            </div>
        ) : (
            <p className="text-center text-slate-500">No game modes are currently available for this game.</p>
        )}
      </div>
    </div>
  );
}
