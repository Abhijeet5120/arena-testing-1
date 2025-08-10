import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { GameMode } from "@/api/entities";
import { Plus, Edit, Trash2, Users } from "lucide-react";
import { motion } from "framer-motion";

export default function GameModeManagement({ gameId, gameName }) {
  const [gameModes, setGameModes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingMode, setEditingMode] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    team_size: 1,
    icon_url: ""
  });

  useEffect(() => {
    if (gameId) {
      loadGameModes();
    }
  }, [gameId]);

  const loadGameModes = async () => {
    setLoading(true);
    try {
      const modes = await GameMode.filter({ game_id: gameId });
      setGameModes(modes);
    } catch (error) {
      console.error("Error loading game modes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingMode(null);
    setFormData({
      name: "",
      description: "",
      team_size: 1,
      icon_url: ""
    });
    setShowDialog(true);
  };

  const handleEdit = (mode) => {
    setEditingMode(mode);
    setFormData({
      name: mode.name,
      description: mode.description || "",
      team_size: mode.team_size,
      icon_url: mode.icon_url || ""
    });
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this game mode?")) {
      try {
        await GameMode.delete(id);
        loadGameModes();
      } catch (error) {
        console.error("Error deleting game mode:", error);
        alert("Failed to delete game mode.");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMode) {
        await GameMode.update(editingMode.id, formData);
      } else {
        await GameMode.create({
          ...formData,
          game_id: gameId
        });
      }
      setShowDialog(false);
      loadGameModes();
    } catch (error) {
      console.error("Error saving game mode:", error);
      alert("Failed to save game mode.");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mx-auto mb-4"></div>
        <p className="text-slate-600">Loading game modes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Game Modes</h3>
          <p className="text-slate-600">Manage game modes for {gameName}</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={handleCreate} className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Add Game Mode
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle>{editingMode ? 'Edit Game Mode' : 'Create Game Mode'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Mode Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                  placeholder="e.g., 1v1 Classic, 4v4 Squad"
                  className="rounded-xl"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                  placeholder="Brief description of this game mode"
                  className="rounded-xl h-20"
                />
              </div>
              
              <div>
                <Label htmlFor="team_size">Team Size</Label>
                <Input
                  id="team_size"
                  type="number"
                  min="1"
                  max="50"
                  value={formData.team_size}
                  onChange={(e) => setFormData(prev => ({...prev, team_size: parseInt(e.target.value)}))}
                  className="rounded-xl"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="icon_url">Icon URL (Optional)</Label>
                <Input
                  id="icon_url"
                  value={formData.icon_url}
                  onChange={(e) => setFormData(prev => ({...prev, icon_url: e.target.value}))}
                  placeholder="https://example.com/icon.png"
                  className="rounded-xl"
                />
              </div>
              
              <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl">
                {editingMode ? 'Update Mode' : 'Create Mode'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {gameModes.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl">
          <div className="w-16 h-16 bg-gradient-to-r from-violet-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-violet-400" />
          </div>
          <p className="text-lg font-medium text-slate-600 mb-2">No game modes yet</p>
          <p className="text-slate-500 mb-4">Create game modes to enable tournament templates</p>
          <Button onClick={handleCreate} className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl">
            <Plus className="w-4 h-4 mr-2" />
            Create First Mode
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gameModes.map((mode, index) => (
            <motion.div
              key={mode.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="rounded-xl border border-slate-200 hover:shadow-md transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {mode.icon_url && (
                        <img src={mode.icon_url} alt={mode.name} className="w-8 h-8 rounded-lg object-cover" />
                      )}
                      <div>
                        <CardTitle className="text-lg font-bold text-slate-800">{mode.name}</CardTitle>
                        {mode.description && (
                          <p className="text-sm text-slate-600 mt-1">{mode.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm bg-slate-100 px-3 py-1 rounded-full">
                      <Users className="w-4 h-4 text-slate-500" />
                      <span className="font-medium text-slate-700">{mode.team_size}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(mode)}
                      className="flex-1 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(mode.id)}
                      className="rounded-lg border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}