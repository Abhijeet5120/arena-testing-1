
import React, { useState, useEffect, useCallback } from "react";
import { User, Game, Tournament, GameMode, Participation } from "@/api/entities";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trophy, Play, Users, Settings, GamepadIcon as Gamepad, BarChart3, DollarSign, Menu, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRegion } from "../components/context/RegionContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { processWinnerSelection } from "@/api/functions";

const ModeratorStats = ({ user }) => (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Statistics Overview</h2>
        <p className="text-slate-600">Welcome back, {user?.full_name}. Here's your performance summary.</p>
      </div>
      <Card className="rounded-2xl shadow-xl border-0">
        <CardHeader><CardTitle>Performance</CardTitle></CardHeader>
        <CardContent>
          <p className="text-center py-12 text-slate-500">Statistics and performance metrics will be available here in a future update.</p>
        </CardContent>
      </Card>
    </div>
);

const ModeratorTournaments = ({ user, assignedGames, onHostTournament, onSelectWinner }) => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { region, currencySymbol } = useRegion();

  const loadTournamentData = useCallback(async () => {
        if (!region || !assignedGames || assignedGames.length === 0) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const allGameModes = await GameMode.list();
            const assignedGameIds = assignedGames.map(g => g.id);
            const relevantGameModes = allGameModes.filter(gm => assignedGameIds.includes(gm.game_id));
            const relevantGameModeIds = relevantGameModes.map(gm => gm.id);

            if (relevantGameModeIds.length === 0) {
                setTournaments([]);
                setLoading(false);
                return;
            }
            
            const readyTournaments = await Tournament.filter({
                region_id: region.id,
                game_mode_id: { $in: relevantGameModeIds },
                hosted_by: { $in: [user.id, null] }, // Can be hosted by this mod, or unassigned
                status: { $in: ['preparing', 'ongoing', 'completed'] } // Fetch preparing, ongoing, AND completed
            }, '-created_date');

            const enrichedTournaments = await Promise.all(readyTournaments.map(async (t) => {
                const gameMode = allGameModes.find(gm => gm.id === t.game_mode_id);
                const game = assignedGames.find(g => g.id === gameMode?.game_id);
                let winnerName = null;
                if (t.status === 'completed' && t.winner_id) {
                    try {
                        const winnerData = await User.get(t.winner_id);
                        winnerName = winnerData.full_name;
                    } catch (e) {
                        winnerName = "N/A";
                    }
                }
                return { ...t, gameName: game?.name || 'N/A', gameModeName: gameMode?.name || 'N/A', winnerName };
            }));

            setTournaments(enrichedTournaments);
        } catch (error) {
            console.error("Error loading tournaments for moderator:", error);
        } finally {
            setLoading(false);
        }
    }, [region, assignedGames, user.id]);

  useEffect(() => {
    loadTournamentData();
    const interval = setInterval(loadTournamentData, 30000); // Poll for new tournaments every 30 seconds
    return () => clearInterval(interval); // Cleanup on unmount
  }, [loadTournamentData]);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-slate-500"/></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Tournament Management</h2>
        <p className="text-slate-600">Host tournaments and manage completed events.</p>
      </div>

      <Card className="rounded-2xl shadow-xl border-0">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-slate-800">Managed Tournaments</CardTitle>
        </CardHeader>
        <CardContent>
          {tournaments.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg">No tournaments are ready to host yet.</p>
              <p className="text-slate-400 text-sm">Tournaments for your assigned game will appear here once they have enough players.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tournaments.map((tournament) => (
                <Card key={tournament.id} className="rounded-xl border border-slate-200">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-800 text-lg mb-2">{tournament.title}</h3>
                        <p className="text-slate-600 mb-2 text-sm">{tournament.gameName} - {tournament.gameModeName}</p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                          <span className="flex items-center gap-1.5"><Users className="w-4 h-4"/>{tournament.current_participants} participants</span>
                          <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4"/>{currencySymbol}{tournament.prize_pool?.toLocaleString()} prize pool</span>
                          {tournament.tournament_id_custom && (
                            <Badge variant="secondary" className="font-mono text-xs">
                              ID: {tournament.tournament_id_custom}
                            </Badge>
                          )}
                           {tournament.status === 'ongoing' && (
                            <Badge variant="default" className="bg-purple-100 text-purple-800 border border-purple-300">
                               Ongoing (Code: {tournament.room_code})
                            </Badge>
                           )}
                           {tournament.status === 'preparing' && (
                            <Badge variant="default" className="bg-yellow-100 text-yellow-800 border border-yellow-300">
                               Ready to Host
                            </Badge>
                           )}
                           {tournament.status === 'completed' && (
                            <Badge variant="default" className="bg-green-100 text-green-800 border border-green-300">
                               Winner: {tournament.winnerName || 'N/A'}
                            </Badge>
                           )}
                        </div>
                      </div>
                      {tournament.status === 'preparing' && (
                        <Button
                          onClick={() => onHostTournament(tournament)}
                          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl px-6 py-3 w-full sm:w-auto"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Host Now
                        </Button>
                      )}
                      {tournament.status === 'ongoing' && (
                        <Button
                          onClick={() => onSelectWinner(tournament)}
                          className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-xl px-6 py-3 w-full sm:w-auto"
                        >
                          <Trophy className="w-4 h-4 mr-2" />
                          Select Winner
                        </Button>
                      )}
                      {tournament.status === 'completed' && (
                         <Button
                          disabled
                          variant="outline"
                          className="rounded-xl px-6 py-3 w-full sm:w-auto"
                        >
                          <Trophy className="w-4 h-4 mr-2" />
                          Finished
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const ModeratorPayments = ({ user }) => (
     <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Payment History</h2>
        <p className="text-slate-600">Track your moderator earnings and payment history.</p>
      </div>

      <Card className="rounded-2xl shadow-xl border-0">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-slate-800">Earnings Overview</CardTitle>
        </CardHeader>
        <CardContent>
           <div className="text-center py-12">
            <DollarSign className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">No payment history available.</p>
            <p className="text-slate-400 text-sm">Your moderator earnings will appear here once tournaments are completed.</p>
          </div>
        </CardContent>
      </Card>
    </div>
);

export default function ModeratorDashboard() {
  const [user, setUser] = useState(null);
  const [assignedGames, setAssignedGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('statistics');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [showHostDialog, setShowHostDialog] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [hostingData, setHostingData] = useState({ room_code: "", room_password: "" });

  const [showWinnerDialog, setShowWinnerDialog] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [selectedWinner, setSelectedWinner] = useState("");
  
  const { region } = useRegion();

  const loadInitialData = useCallback(async () => {
      try {
        const userData = await User.me();
        if (userData.app_role !== 'moderator') {
          window.location.href = createPageUrl("Dashboard");
          return;
        }
        if (!userData.onboarding_completed) {
          window.location.href = createPageUrl("ModeratorOnboarding");
          return;
        }
        setUser(userData);
        
        if (userData.assigned_games && userData.assigned_games.length > 0) {
            const gamesData = await Game.filter({ id: { $in: userData.assigned_games }});
            setAssignedGames(gamesData);
        }

      } catch (error) {
        console.error("Error checking user:", error);
         window.location.href = createPageUrl("Dashboard");
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleHostTournament = (tournament) => {
    setSelectedTournament(tournament);
    setHostingData({ room_code: "", room_password: "" });
    setShowHostDialog(true);
  };

  const handleConfirmHost = async () => {
    if (!selectedTournament || !hostingData.room_code) {
      alert("Please enter a room code.");
      return;
    }

    try {
      await Tournament.update(selectedTournament.id, {
        status: 'ongoing',
        room_code: hostingData.room_code,
        room_password: hostingData.room_password,
        hosted_by: user.id
      });
      
      setShowHostDialog(false);
      setHostingData({ room_code: "", room_password: ""});
      setSelectedTournament(null);
      // Refresh tournament list
      setActiveSection(''); 
      setTimeout(() => setActiveSection('tournaments'), 0);
      
    } catch (error) {
      console.error("Error hosting tournament:", error);
      alert("Failed to host tournament. Please try again.");
    }
  };

  const handleSelectWinner = async (tournament) => {
    // Fetch participants for the selected tournament
    // Assuming Participation entity has player_id and player_name / in_game_name
    try {
        const participantData = await Participation.filter({ tournament_id: tournament.id });
        setParticipants(participantData);
        setSelectedTournament(tournament);
        setShowWinnerDialog(true);
    } catch (error) {
        console.error("Error fetching participants:", error);
        alert("Failed to load participants. Please try again.");
    }
  };

  const handleConfirmWinner = async () => {
    if (!selectedTournament || !selectedWinner) {
        alert("Please select a winner.");
        return;
    }
    try {
        await processWinnerSelection({
            tournament_id: selectedTournament.id,
            winner_id: selectedWinner
        });
        setShowWinnerDialog(false);
        setSelectedWinner("");
        setSelectedTournament(null);
        // Refresh tournament list
        setActiveSection(''); 
        setTimeout(() => setActiveSection('tournaments'), 0);
    } catch (error) {
        console.error("Error selecting winner:", error);
        alert("Failed to process winner. Please try again.");
    }
  };


  const sidebarItems = [
    { id: 'statistics', title: 'Statistics', icon: BarChart3 },
    { id: 'tournaments', title: 'Tournaments', icon: Trophy },
    { id: 'payments', title: 'Payments', icon: DollarSign },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'statistics':
        return <ModeratorStats user={user} />;
      case 'tournaments':
        return <ModeratorTournaments user={user} assignedGames={assignedGames} onHostTournament={handleHostTournament} onSelectWinner={handleSelectWinner} />;
      case 'payments':
        return <ModeratorPayments user={user} />;
      default:
        return <ModeratorStats user={user} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-slate-500 animate-spin mx-auto mb-4"/>
          <p className="text-lg text-slate-600">Loading moderator dashboard...</p>
        </div>
      </div>
    );
  }

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-800">Moderator Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">{user?.full_name}</p>
      </div>
      <nav className="p-4 space-y-2">
        {sidebarItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveSection(item.id);
              if (sidebarOpen) setSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${
              activeSection === item.id
                ? 'bg-slate-800 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <item.icon className="w-5 h-5" />
            {item.title}
          </button>
        ))}
      </nav>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-100">
      <div className="lg:hidden sticky top-0 bg-white/80 backdrop-blur-sm border-b border-slate-200 p-4 z-40">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
            Moderator
          </h1>
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-white">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="flex">
        <aside className="hidden lg:block w-72 bg-white shadow-lg h-screen sticky top-0">
          <SidebarContent />
        </aside>

        <main className="flex-1 p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <Dialog open={showHostDialog} onOpenChange={setShowHostDialog}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Host Tournament: {selectedTournament?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="room_code">Room Code *</Label>
              <Input
                id="room_code"
                value={hostingData.room_code}
                onChange={(e) => setHostingData(prev => ({...prev, room_code: e.target.value}))}
                className="rounded-xl mt-1"
                placeholder="Enter in-game room code"
                required
              />
            </div>
            <div>
              <Label htmlFor="room_password">Room Password (Optional)</Label>
              <Input
                id="room_password"
                type="password"
                value={hostingData.room_password}
                onChange={(e) => setHostingData(prev => ({...prev, room_password: e.target.value}))}
                className="rounded-xl mt-1"
                placeholder="Enter in-game room password (if any)"
              />
            </div>
            <Button 
              onClick={handleConfirmHost}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl py-3"
            >
              Start Tournament
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Winner Selection Dialog */}
      <Dialog open={showWinnerDialog} onOpenChange={setShowWinnerDialog}>
          <DialogContent className="max-w-md rounded-2xl">
              <DialogHeader>
                  <DialogTitle>Select Winner for: {selectedTournament?.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                  <div>
                      <Label htmlFor="winner_id">Select Winner *</Label>
                      <Select value={selectedWinner} onValueChange={setSelectedWinner}>
                          <SelectTrigger className="rounded-xl mt-1">
                              <SelectValue placeholder="Choose a participant" />
                          </SelectTrigger>
                          <SelectContent>
                              {participants.map(p => (
                                  <SelectItem key={p.player_id} value={p.player_id}>
                                      {p.player_name} ({p.in_game_name})
                                  </SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>
                  <Button 
                      onClick={handleConfirmWinner}
                      className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-xl py-3"
                  >
                      Confirm Winner & Distribute Prize
                  </Button>
              </div>
          </DialogContent>
      </Dialog>
    </div>
  );
}
