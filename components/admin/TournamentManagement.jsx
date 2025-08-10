
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tournament, GameMode, Game } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { Trophy, Plus, Edit, Trash2, Users, Calendar, DollarSign, Search, UploadCloud } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { useRegion } from "../context/RegionContext";

export default function TournamentManagement({ selectedRegion }) {
  const [tournaments, setTournaments] = useState([]);
  const [gameModes, setGameModes] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGame, setSelectedGame] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { currencySymbol } = useRegion(selectedRegion); // Pass admin region to context hook

  const [newTournament, setNewTournament] = useState({
    title: "",
    description: "",
    game_mode_id: "",
    image_url: "",
    start_date: "",
    end_date: "",
    registration_deadline: "",
    prize_pool: "",
    entry_fee: "0",
    max_participants: "",
    tournament_type: "single_elimination",
    rules: "",
    is_featured: false,
    region_id: selectedRegion || "" // Added region_id
  });

  // useEffect now depends on selectedRegion to load data
  useEffect(() => {
    if (selectedRegion) {
        loadData();
        setNewTournament(prev => ({ ...prev, region_id: selectedRegion }));
    }
  }, [selectedRegion]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tournamentsData, modesData, gamesData] = await Promise.all([
        Tournament.filter({ region_id: selectedRegion }), // Filter by region
        GameMode.list(), // Game modes are listed globally as per outline
        Game.filter({ region_id: selectedRegion }) // Filter by region
      ]);
      setTournaments(tournamentsData);
      setGameModes(modesData);
      setGames(gamesData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  };

  const getTournamentContext = (gameModeId) => {
    const mode = gameModes.find(m => m.id === gameModeId);
    if (!mode) return { gameName: 'Unknown', modeName: 'Unknown' };
    const game = games.find(g => g.id === mode.game_id);
    return {
      gameName: game ? game.name : 'Unknown Game',
      modeName: mode.name,
    };
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setNewTournament(prev => ({ ...prev, image_url: file_url }));
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Image upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const createTournament = async () => {
    try {
        // Logic to generate custom tournament ID
        const allTournaments = await Tournament.list(); // Fetch ALL tournaments to ensure unique global ID
        const lastId = allTournaments
            .map(t => t.tournament_id_custom)
            .filter(Boolean)
            .map(id => {
                const numPart = id.slice(3);
                return /^\d+$/.test(numPart) ? parseInt(numPart, 10) : 0;
            })
            .sort((a, b) => b - a)[0] || 0;
        
        const mode = gameModes.find(m => m.id === newTournament.game_mode_id);
        const game = games.find(g => g.id === mode.game_id); // This game should be from the regional 'games' state
        const gameCode = game ? game.game_code : '000'; // Assuming game entity has 'game_code'
        
        const customId = `${gameCode}${(lastId + 1).toString().padStart(7, '0')}`;

      await Tournament.create({
        ...newTournament,
        tournament_id_custom: customId, // Add the generated custom ID
        region_id: selectedRegion, // Ensure region_id is set
        prize_pool: parseFloat(newTournament.prize_pool) || 0,
        entry_fee: parseFloat(newTournament.entry_fee) || 0,
        max_participants: parseInt(newTournament.max_participants) || 0,
        tournament_type: 'single_elimination', // Explicitly set for manual creation
        status: 'registration_open'
      });
      setShowCreateDialog(false);
      setNewTournament({
        title: "",
        description: "",
        game_mode_id: "",
        image_url: "",
        start_date: "",
        end_date: "",
        registration_deadline: "",
        prize_pool: "",
        entry_fee: "0",
        max_participants: "",
        tournament_type: "single_elimination",
        rules: "",
        is_featured: false,
        region_id: selectedRegion // Reset with selected region
      });
      setSelectedGame("");
      loadData();
    } catch (error) {
      console.error("Error creating tournament:", error);
    }
  };

  const deleteTournament = async (id) => {
    if (confirm("Are you sure? This will delete the tournament.")) {
      await Tournament.delete(id);
      loadData();
    }
  };

  const getStatusColor = (status) => ({
    'upcoming': 'from-blue-500 to-blue-600',
    'registration_open': 'from-green-500 to-green-600',
    'registration_closed': 'from-yellow-500 to-yellow-600',
    'ongoing': 'from-purple-500 to-purple-600',
    'completed': 'from-gray-500 to-gray-600',
    'cancelled': 'from-red-500 to-red-600',
  }[status] || 'from-gray-500 to-gray-600');

  const filteredTournaments = tournaments.filter(tournament => {
    const { gameName, modeName } = getTournamentContext(tournament.game_mode_id);
    const matchesSearch = tournament.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         gameName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         modeName.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedGame) {
      const mode = gameModes.find(m => m.id === tournament.game_mode_id);
      return matchesSearch && mode && mode.game_id === selectedGame;
    }
    
    return matchesSearch;
  });

  const availableGameModes = selectedGame 
    ? gameModes.filter(mode => mode.game_id === selectedGame)
    : [];
    
    // Display message if no region is selected
    if (!selectedRegion) {
        return (
          <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
            <Trophy className="mx-auto h-12 w-12 text-violet-500 mb-4" />
            <h2 className="text-2xl font-bold text-slate-800">Please select a region</h2>
            <p className="text-slate-600 mt-2">Select a region to manage its tournaments.</p>
          </div>
        );
      }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-slate-700 mx-auto mb-4"></div>
        <p className="text-slate-600">Loading tournaments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
            Tournament Management
          </h1>
          <p className="text-slate-600 mt-1">Create and manage tournaments across all games</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button className="bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-slate-900 text-white px-6 py-3 rounded-xl shadow-lg">
                <Plus className="w-5 h-5 mr-2" />
                Create Tournament
              </Button>
            </motion.div>
          </DialogTrigger>
          <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Tournament</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="game">Game</Label>
                  <Select value={selectedGame} onValueChange={id => {
                      setSelectedGame(id);
                      setNewTournament(prev => ({...prev, game_mode_id: ''}));
                  }}>
                    <SelectTrigger className="rounded-xl">
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
                  <Label htmlFor="game_mode_id">Game Mode</Label>
                  <Select
                    value={newTournament.game_mode_id}
                    onValueChange={(value) => setNewTournament({...newTournament, game_mode_id: value})}
                    disabled={!selectedGame || availableGameModes.length === 0}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder={!selectedGame ? "Select a game first" : (availableGameModes.length === 0 ? "No modes available" : "Select a game mode")} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableGameModes.map(mode => (
                        <SelectItem key={mode.id} value={mode.id}>{mode.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="title">Tournament Title</Label>
                <Input
                  id="title"
                  value={newTournament.title}
                  onChange={(e) => setNewTournament({...newTournament, title: e.target.value})}
                  className="rounded-xl"
                  required
                />
              </div>

              <div>
                  <Label htmlFor="image_url">Cover Image</Label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl">
                      <div className="space-y-1 text-center">
                           {newTournament.image_url ? (
                               <img src={newTournament.image_url} alt="Uploaded cover" className="mx-auto h-24 w-auto rounded-lg object-cover" />
                           ) : (
                               <UploadCloud className="mx-auto h-12 w-12 text-slate-400" />
                           )}
                           <div className="flex text-sm text-slate-600">
                               <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-violet-600 hover:text-violet-500 focus-within:outline-none">
                                   <span>{isUploading ? 'Uploading...' : 'Upload an image'}</span>
                                   <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" disabled={isUploading}/>
                               </label>
                           </div>
                           <p className="text-xs text-slate-500">PNG, JPG, GIF up to 10MB</p>
                      </div>
                  </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newTournament.description}
                  onChange={(e) => setNewTournament({...newTournament, description: e.target.value})}
                  className="rounded-xl h-24"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="prize_pool">Prize Pool ({currencySymbol})</Label>
                  <Input
                    id="prize_pool"
                    type="number"
                    value={newTournament.prize_pool}
                    onChange={(e) => setNewTournament({...newTournament, prize_pool: e.target.value})}
                    className="rounded-xl"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="max_participants">Max Participants</Label>
                  <Input
                    id="max_participants"
                    type="number"
                    value={newTournament.max_participants}
                    onChange={(e) => setNewTournament({...newTournament, max_participants: e.target.value})}
                    className="rounded-xl"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date & Time</Label>
                  <Input
                    id="start_date"
                    type="datetime-local"
                    value={newTournament.start_date}
                    onChange={(e) => setNewTournament({...newTournament, start_date: e.target.value})}
                    className="rounded-xl"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="registration_deadline">Registration Deadline</Label>
                  <Input
                    id="registration_deadline"
                    type="datetime-local"
                    value={newTournament.registration_deadline}
                    onChange={(e) => setNewTournament({...newTournament, registration_deadline: e.target.value})}
                    className="rounded-xl"
                    required
                  />
                </div>
              </div>
              
              <Button onClick={createTournament} className="w-full bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-slate-900 text-white rounded-xl py-3">
                Create Tournament
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input
            placeholder="Search tournaments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 rounded-xl bg-white/80 backdrop-blur-sm border border-slate-200 py-3"
          />
        </div>
        <Select value={selectedGame} onValueChange={setSelectedGame}>
          <SelectTrigger className="w-full sm:w-48 rounded-xl">
            <SelectValue placeholder="Filter by game" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All Games</SelectItem>
            {games.map(game => (
              <SelectItem key={game.id} value={game.id}>{game.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tournaments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatePresence>
          {filteredTournaments.map((tournament, index) => {
            const { gameName, modeName } = getTournamentContext(tournament.game_mode_id);
            return (
              <motion.div
                key={tournament.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                           <p className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">#{tournament.tournament_id_custom}</p>
                        </div>
                        <CardTitle className="text-xl font-bold text-slate-800 mb-2">
                          {tournament.title}
                        </CardTitle>
                        <p className="text-sm text-slate-500">{gameName} • {modeName}</p>
                      </div>
                      <Badge className={`bg-gradient-to-r ${getStatusColor(tournament.status)} text-white px-3 py-1 rounded-full`}>
                        {tournament.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl">
                        <DollarSign className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
                        <p className="text-xs text-slate-600">Prize Pool</p>
                        <p className="font-bold text-slate-800">{currencySymbol}{tournament.prize_pool?.toLocaleString()}</p>
                      </div>
                      <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl">
                        <Users className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                        <p className="text-xs text-slate-600">Players</p>
                        <p className="font-bold text-slate-800">{tournament.current_participants || 0}/{tournament.max_participants}</p>
                      </div>
                      <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                        <Calendar className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                        <p className="text-xs text-slate-600">Starts</p>
                        <p className="font-bold text-slate-800 text-xs">
                          {format(new Date(tournament.start_date), 'MMM d')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteTournament(tournament.id)}
                        className="rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredTournaments.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-12 h-12 text-slate-400" />
          </div>
          <p className="text-xl font-medium text-slate-600 mb-2">No tournaments found</p>
          <p className="text-slate-500">Try adjusting your search terms or create a new tournament</p>
        </div>
      )}
    </div>
  );
}
