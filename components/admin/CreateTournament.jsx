import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tournament, Game, GameMode } from "@/api/entities";

export default function CreateTournament() {
  const [games, setGames] = useState([]);
  const [gameModes, setGameModes] = useState([]);
  const [selectedGame, setSelectedGame] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    game_mode_id: "",
    start_date: "",
    end_date: "",
    registration_deadline: "",
    prize_pool: "",
    entry_fee: "0",
    max_participants: "",
    tournament_type: "single_elimination",
    rules: "",
    is_featured: false
  });

  useEffect(() => {
    const loadGames = async () => {
      const gamesData = await Game.filter({ is_active: true });
      setGames(gamesData);
    };
    loadGames();
  }, []);

  useEffect(() => {
    const loadGameModes = async () => {
      if (selectedGame) {
        const modesData = await GameMode.filter({ game_id: selectedGame });
        setGameModes(modesData);
        setFormData(prev => ({ ...prev, game_mode_id: "" })); // Reset game mode selection
      } else {
        setGameModes([]);
      }
    };
    loadGameModes();
  }, [selectedGame]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await Tournament.create({
        ...formData,
        prize_pool: parseFloat(formData.prize_pool) || 0,
        entry_fee: parseFloat(formData.entry_fee) || 0,
        max_participants: parseInt(formData.max_participants) || 0,
      });
      alert("Tournament created successfully!");
      // Optionally reset form here
    } catch (error) {
      console.error("Error creating tournament:", error);
      alert("Failed to create tournament.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Tournament</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="game">Game</Label>
              <Select value={selectedGame} onValueChange={setSelectedGame}>
                <SelectTrigger><SelectValue placeholder="Select a game" /></SelectTrigger>
                <SelectContent>
                  {games.map(game => <SelectItem key={game.id} value={game.id}>{game.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
             <div>
              <Label htmlFor="game_mode_id">Game Mode</Label>
              <Select
                value={formData.game_mode_id}
                onValueChange={(value) => handleInputChange('game_mode_id', value)}
                disabled={!selectedGame || gameModes.length === 0}
              >
                <SelectTrigger><SelectValue placeholder="Select a game mode" /></SelectTrigger>
                <SelectContent>
                  {gameModes.map(mode => <SelectItem key={mode.id} value={mode.id}>{mode.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
             <div>
              <Label htmlFor="title">Tournament Title</Label>
              <Input id="title" value={formData.title} onChange={e => handleInputChange('title', e.target.value)} required />
            </div>
            {/* Add other form fields here, similar to the original component, but simplified for brevity */}
             <div>
              <Label htmlFor="prize_pool">Prize Pool ($)</Label>
              <Input id="prize_pool" type="number" value={formData.prize_pool} onChange={e => handleInputChange('prize_pool', e.target.value)} required />
            </div>
             <div>
              <Label htmlFor="max_participants">Max Participants</Label>
              <Input id="max_participants" type="number" value={formData.max_participants} onChange={e => handleInputChange('max_participants', e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <Input id="start_date" type="datetime-local" value={formData.start_date} onChange={e => handleInputChange('start_date', e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="registration_deadline">Registration Deadline</Label>
              <Input id="registration_deadline" type="datetime-local" value={formData.registration_deadline} onChange={e => handleInputChange('registration_deadline', e.target.value)} required />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating..." : "Create Tournament"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}