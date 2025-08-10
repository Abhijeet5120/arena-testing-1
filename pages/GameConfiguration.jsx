
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Game } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card"; // Removed CardHeader, CardTitle as they are not used in the new structure
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch"; // Still needed for is_active
import { motion, AnimatePresence } from "framer-motion"; // AnimatePresence added for tab transitions
import { Save, UploadCloud, Gamepad2, Settings, Zap, Plus, Trash2 } from "lucide-react"; // Updated icons, keeping existing ones for child components
import GameModeManagement from "../components/admin/GameModeManagement";
import TournamentTemplateManagement from "../components/admin/TournamentTemplateManagement";
import { UploadFile } from "@/api/integrations";


export default function GameConfiguration() { // Renamed from GameConfigurationPage as per outline
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const gameId = urlParams.get("id");

  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("settings"); // New state for managing active tab
  const [saving, setSaving] = useState(false); // New state for save button loading indicator

  useEffect(() => {
    if (gameId) {
      loadGame(); // Renamed from loadGameData
    }
  }, [gameId]); // Dependency array remains [gameId] as logic depends on it

  const loadGame = async () => { // Renamed from loadGameData
    setLoading(true);
    try {
      const gameData = await Game.get(gameId);
      setGame(gameData);
    } catch (error) {
      console.error("Failed to load game data:", error);
    } finally {
      setLoading(false);
    }
  };

  // generateUniqueGameCode function from outline was not in original, and no implementation provided, so not added.

  // handleInputChange and handleSwitchChange functions are replaced by inline state updates as per outline.

  const handleFileChange = async (event, type) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setGame(prev => ({ ...prev, [type]: file_url }));
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Image upload failed.");
    } finally {
      setIsUploading(false);
      event.target.value = ''; // Clear the file input
    }
  };

  const handleSave = async () => {
    setSaving(true); // Set saving state to true
    try {
      await Game.update(gameId, game); // Assuming gameId is the correct identifier for update
      alert("Game details saved successfully!");
    } catch (error) {
      console.error("Failed to save game details:", error);
      alert("Error saving game details.");
    } finally {
      setSaving(false); // Reset saving state
    }
  };

  if (loading || !game) { // Combined loading and game not found checks
    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 flex justify-center items-center h-screen">
            {loading ? <div>Loading game configuration...</div> : <div>Game not found.</div>}
        </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "settings":
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="name">Game Name</Label>
              <Input
                id="name"
                value={game.name || ""}
                onChange={(e) => setGame({ ...game, name: e.target.value })}
                className="rounded-xl" // Preserving original styling
              />
            </div>
             <div>
                <Label htmlFor="game_code">Game Code (3 digits)</Label>
                <Input
                    id="game_code"
                    value={game.game_code || ""}
                    onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, ''); // Allow only digits
                        if (val.length <= 3) { // Limit to 3 digits
                            setGame({ ...game, game_code: val });
                        }
                    }}
                    maxLength={3}
                    className="rounded-xl" // Preserving original styling
                />
            </div>
            <div>
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={game.tagline || ""}
                onChange={(e) => setGame({ ...game, tagline: e.target.value })}
                className="rounded-xl" // Preserving original styling
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={game.description || ""}
                onChange={(e) => setGame({ ...game, description: e.target.value })}
                className="h-24 rounded-xl" // Preserving original styling and height
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Game Logo</Label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-xl border-slate-300"> {/* Added border-slate-300 for clarity */}
                  <div className="space-y-1 text-center">
                    {game.logo_url ? (
                      <img src={game.logo_url} alt="Game Logo" className="mx-auto h-20 w-20 rounded-lg object-cover" />
                    ) : (
                      <UploadCloud className="mx-auto h-12 w-12 text-slate-400" />
                    )}
                    <div className="flex text-sm text-slate-600">
                      <label htmlFor="logo-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-violet-600 hover:text-violet-500">
                        <span>{isUploading ? "Uploading..." : "Upload logo"}</span>
                        <input id="logo-upload" type="file" className="sr-only" onChange={(e) => handleFileChange(e, 'logo_url')} disabled={isUploading} />
                      </label>
                    </div>
                    <p className="text-xs text-slate-500">Square format</p>
                  </div>
                </div>
              </div>
              <div>
                <Label>Game Banner</Label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-xl border-slate-300"> {/* Added border-slate-300 for clarity */}
                  <div className="space-y-1 text-center">
                    {game.banner_url ? (
                      <img src={game.banner_url} alt="Game Banner" className="mx-auto h-20 w-auto rounded-lg object-cover" />
                    ) : (
                      <UploadCloud className="mx-auto h-12 w-12 text-slate-400" />
                    )}
                    <div className="flex text-sm text-slate-600">
                      <label htmlFor="banner-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-violet-600 hover:text-violet-500">
                        <span>{isUploading ? "Uploading..." : "Upload banner"}</span>
                        <input id="banner-upload" type="file" className="sr-only" onChange={(e) => handleFileChange(e, 'banner_url')} disabled={isUploading} />
                      </label>
                    </div>
                    <p className="text-xs text-slate-500">Wide format</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Preserving 'is_active' switch functionality as per requirements */}
            <div className="flex items-center space-x-2 pt-4">
                <Switch 
                  id="is_active" 
                  checked={game.is_active} 
                  onCheckedChange={(checked) => setGame(prev => ({ ...prev, is_active: checked }))} 
                />
                <Label htmlFor="is_active">Game is Active</Label>
            </div>
          </div>
        );
      case "gamemodes":
        return <GameModeManagement gameId={game.id} />; // Pass game.id as per outline
      case "automation":
        return <TournamentTemplateManagement gameId={game.id} />; // Pass game.id as per outline
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-6xl">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4"> {/* Preserving original header structure */}
          <div className="flex items-center gap-4">
            {game.logo_url && <img src={game.logo_url} alt={game.name} className="w-16 h-16 rounded-2xl object-cover shadow-lg" />} {/* Preserving game logo in header */}
            <div>
              <h1 className="text-3xl font-bold text-slate-800">{game.name}</h1>
              <p className="text-slate-500">Game Configuration Panel</p> {/* Preserving original text */}
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="bg-slate-800 hover:bg-slate-900 text-white rounded-xl shadow-lg"> {/* Preserving original styling */}
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save All Changes'} {/* Updated text for saving state */}
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <aside className="md:w-1/4">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab("settings")}
                className={`w-full text-left flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  activeTab === "settings" ? "bg-slate-800 text-white" : "hover:bg-slate-100"
                }`}
              >
                <Settings className="w-5 h-5" />
                <span>General Settings</span>
              </button>
              <button
                onClick={() => setActiveTab("gamemodes")}
                className={`w-full text-left flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  activeTab === "gamemodes" ? "bg-slate-800 text-white" : "hover:bg-slate-100"
                }`}
              >
                <Gamepad2 className="w-5 h-5" />
                <span>Game Modes</span>
              </button>
              <button
                onClick={() => setActiveTab("automation")}
                className={`w-full text-left flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  activeTab === "automation" ? "bg-slate-800 text-white" : "hover:bg-slate-100"
                }`}
              >
                <Zap className="w-5 h-5" />
                <span>Automation</span>
              </button>
            </nav>
          </aside>

          <main className="flex-1">
            <Card className="rounded-2xl shadow-lg border-0">
              <CardContent className="p-6">
                <AnimatePresence mode="wait"> {/* AnimatePresence for tab content transitions */}
                  <motion.div
                    key={activeTab} // Key changes to trigger animation on tab switch
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {renderContent()} {/* Render current tab content */}
                  </motion.div>
                </AnimatePresence>
              </CardContent>
            </Card>
          </main>
        </div>
      </motion.div>
    </div>
  );
}
