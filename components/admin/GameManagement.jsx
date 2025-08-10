
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Settings, Trash2, Plus, Trophy, Users, Eye, Save, X, Gamepad, UploadCloud } from "lucide-react";
import { Game, Tournament, GameMode } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { motion, AnimatePresence } from "framer-motion";
import { useRegion } from "../context/RegionContext"; // Added per outline

export default function GameManagement({ selectedRegion }) {
  const [games, setGames] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [gameModes, setGameModes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { region } = useRegion(); // Added per outline - though 'selectedRegion' prop is still primary source for logic below

  const [newGame, setNewGame] = useState({
    name: "",
    description: "",
    logo_url: "",
    banner_url: "",
    category: "",
    min_players: 2,
    max_players: 100,
    is_active: true,
    game_code: "", // Added per outline
    region_id: selectedRegion
  });

  useEffect(() => {
    if (selectedRegion) {
      loadData();
      // This line from outline sets newGame's region_id and preserves existing game_code.
      // Generation of game_code happens when the dialog opens.
      setNewGame(prev => ({ ...prev, region_id: selectedRegion, game_code: prev.game_code }));
    }
  }, [selectedRegion]);

  const loadData = async () => {
    if (!selectedRegion) return;
    
    try {
      const [gamesData, tournamentsData, gameModesData] = await Promise.all([
        Game.filter({ region_id: selectedRegion }),
        Tournament.filter({ region_id: selectedRegion }),
        GameMode.list()
      ]);
      
      setGames(gamesData);
      setTournaments(tournamentsData);
      setGameModes(gameModesData);
    } catch (error) {
      console.error("Error loading games:", error);
    } finally {
      setLoading(false);
    }
  };

  // Renamed and modified existing generateUniqueGameCode function
  const generateAndSetUniqueGameCode = async () => {
    try {
      const allGames = await Game.list();
      const existingCodes = allGames.map(g => g.game_code).filter(Boolean);
      
      for (let i = 101; i <= 999; i++) {
        const code = i.toString().padStart(3, '0');
        if (!existingCodes.includes(code)) {
          setNewGame(prev => ({ ...prev, game_code: code })); // Set the generated code
          return;
        }
      }
      throw new Error('No available game codes');
    } catch (error) {
      console.error("Error generating game code:", error);
      alert("Failed to generate a unique game code. Please try again.");
      setNewGame(prev => ({ ...prev, game_code: "" })); // Clear if generation fails
    }
  };

  // New useEffect to generate game code when the dialog opens
  useEffect(() => {
    if (showCreateDialog) {
        generateAndSetUniqueGameCode();
    }
  }, [showCreateDialog]);


  const getGameTournamentCount = (gameId) => {
    const gameModesForGame = gameModes.filter(gm => gm.game_id === gameId);
    return tournaments.filter(t => gameModesForGame.some(gm => gm.id === t.game_mode_id)).length;
  };

  const getGameModeCount = (gameId) => {
    return gameModes.filter(gm => gm.game_id === gameId).length;
  };

  const handleFileChange = async (event, type) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setNewGame(prev => ({ ...prev, [type]: file_url }));
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Image upload failed.");
    } finally {
      setIsUploading(false);
      event.target.value = ''; 
    }
  };

  const createGame = async () => {
    try {
      // Check if game_code is present before creating
      if (!newGame.game_code) {
          alert("A unique game code is required. Please try opening the dialog again.");
          return;
      }

      await Game.create({
        ...newGame,
        region_id: selectedRegion
      });
      setShowCreateDialog(false);
      // Reset state for new game creation, including game_code
      setNewGame(prev => ({
          ...prev,
          name: "",
          description: "",
          logo_url: "",
          banner_url: "",
          category: "",
          min_players: 2,
          max_players: 100,
          is_active: true,
          game_code: "", // Reset game code for next creation
          region_id: selectedRegion
      }));
      loadData();
    } catch (error) {
      console.error("Error creating game:", error);
      alert("Failed to create game. Please try again.");
    }
  };

  const deleteGame = async (game) => {
    if (confirm('Are you sure you want to delete this game? This will also delete all associated game modes and tournaments.')) {
      try {
        await Game.delete(game.id);
        loadData();
      } catch (error) {
        console.error("Error deleting game:", error);
      }
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      fps: 'from-red-500 to-red-600',
      moba: 'from-blue-500 to-blue-600',
      battle_royale: 'from-orange-500 to-orange-600',
      strategy: 'from-purple-500 to-purple-600',
      sports: 'from-green-500 to-green-600',
      racing: 'from-yellow-500 to-yellow-600',
      fighting: 'from-pink-500 to-pink-600'
    };
    return colors[category] || 'from-gray-500 to-gray-600';
  };

  const filteredGames = games.filter(game =>
    game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    game.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!selectedRegion) {
    return (
      <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
        <div className="w-16 h-16 bg-gradient-to-r from-violet-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Gamepad className="w-8 h-8 text-violet-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Please select a region</h2>
        <p className="text-slate-600 mt-2">Select a region from the sidebar to manage games for that region.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-slate-700 mx-auto mb-4"></div>
        <p className="text-slate-600">Loading games...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
            Game Management
          </h1>
          <p className="text-slate-600 mt-1">Create and manage games for the selected region</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button className="bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-slate-900 text-white px-6 py-3 rounded-xl shadow-lg">
                <Plus className="w-5 h-5 mr-2" />
                Add New Game
              </Button>
            </motion.div>
          </DialogTrigger>
          <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Game</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* New Game Code Field */}
              <div>
                <Label htmlFor="game_code">Unique Game Code</Label>
                <Input
                  id="game_code"
                  value={newGame.game_code}
                  readOnly // Make it read-only as it's auto-generated
                  className="rounded-xl bg-slate-100 cursor-not-allowed"
                />
                 <p className="text-xs text-slate-500 mt-1">This 3-digit code is auto-generated and used for creating unique tournament IDs.</p>
              </div>

              <div>
                <Label htmlFor="name">Game Name</Label>
                <Input
                  id="name"
                  value={newGame.name}
                  onChange={(e) => setNewGame({...newGame, name: e.target.value})}
                  className="rounded-xl"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newGame.description}
                  onChange={(e) => setNewGame({...newGame, description: e.target.value})}
                  className="rounded-xl h-24"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="logo_url">Game Logo (Square/Icon)</Label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl">
                    <div className="space-y-1 text-center">
                      {newGame.logo_url ? (
                        <img src={newGame.logo_url} alt="Game logo" className="mx-auto h-20 w-20 rounded-lg object-cover" />
                      ) : (
                        <UploadCloud className="mx-auto h-12 w-12 text-slate-400" />
                      )}
                      <div className="flex text-sm text-slate-600">
                        <label htmlFor="logo-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-violet-600 hover:text-violet-500">
                          <span>{isUploading ? 'Uploading...' : 'Upload logo'}</span>
                          <input id="logo-upload" type="file" className="sr-only" onChange={(e) => handleFileChange(e, 'logo_url')} accept="image/*" disabled={isUploading}/>
                        </label>
                      </div>
                      <p className="text-xs text-slate-500">Square format recommended</p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="banner_url">Game Banner (Wide)</Label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl">
                    <div className="space-y-1 text-center">
                      {newGame.banner_url ? (
                        <img src={newGame.banner_url} alt="Game banner" className="mx-auto h-16 w-24 rounded-lg object-cover" />
                      ) : (
                        <UploadCloud className="mx-auto h-12 w-12 text-slate-400" />
                      )}
                      <div className="flex text-sm text-slate-600">
                        <label htmlFor="banner-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-violet-600 hover:text-violet-500">
                          <span>{isUploading ? 'Uploading...' : 'Upload banner'}</span>
                          <input id="banner-upload" type="file" className="sr-only" onChange={(e) => handleFileChange(e, 'banner_url')} accept="image/*" disabled={isUploading}/>
                        </label>
                      </div>
                      <p className="text-xs text-slate-500">Wide format recommended</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={newGame.category} onValueChange={(value) => setNewGame({...newGame, category: value})}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fps">FPS</SelectItem>
                    <SelectItem value="moba">MOBA</SelectItem>
                    <SelectItem value="battle_royale">Battle Royale</SelectItem>
                    <SelectItem value="strategy">Strategy</SelectItem>
                    <SelectItem value="sports">Sports</SelectItem>
                    <SelectItem value="racing">Racing</SelectItem>
                    <SelectItem value="fighting">Fighting</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min_players">Min Players</Label>
                  <Input
                    id="min_players"
                    type="number"
                    value={newGame.min_players}
                    onChange={(e) => setNewGame({...newGame, min_players: parseInt(e.target.value)})}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="max_players">Max Players</Label>
                  <Input
                    id="max_players"
                    type="number"
                    value={newGame.max_players}
                    onChange={(e) => setNewGame({...newGame, max_players: parseInt(e.target.value)})}
                    className="rounded-xl"
                  />
                </div>
              </div>
              
              <Button onClick={createGame} className="w-full bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-slate-900 text-white rounded-xl py-3">
                Create Game
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        <Input
          placeholder="Search games..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-12 rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200 py-3"
        />
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredGames.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
            >
              <Card className="rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
                <div className="relative h-48">
                  <img 
                    src={game.banner_url || game.image_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400'} 
                    alt={game.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-4 right-4 flex gap-2">
                    <Badge className={game.is_active ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'}>
                      {game.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge className="bg-black/50 text-white font-mono text-xs">
                      #{game.game_code}
                    </Badge>
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <Badge className={`bg-gradient-to-r ${getCategoryColor(game.category)} text-white font-medium`}>
                      {game.category?.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {game.logo_url && (
                      <img 
                        src={game.logo_url} 
                        alt={`${game.name} logo`}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <CardTitle className="text-xl font-bold text-slate-800">{game.name}</CardTitle>
                      <p className="text-slate-600 text-sm line-clamp-2">{game.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">{game.min_players}-{game.max_players}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      <span className="font-medium text-slate-700">{getGameTournamentCount(game.id)} Tournaments</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">{getGameModeCount(game.id)} modes</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Link to={createPageUrl(`GameConfiguration?id=${game.id}`)} className="flex-1">
                        <Button
                          size="sm"
                          className="w-full rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border-0"
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Configuration
                        </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteGame(game)}
                      className="rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredGames.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gamepad className="w-12 h-12 text-slate-400" />
          </div>
          <p className="text-xl font-medium text-slate-600 mb-2">No games found</p>
          <p className="text-slate-500">Try adjusting your search terms or create a new game</p>
        </div>
      )}
    </div>
  );
}
