import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Game, GameMode as GameModeEntity, Tournament, TournamentTemplate, User, Participation, Transaction, LinkedAccount } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Zap, Users, Trophy, ChevronRight, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useRegion } from '../components/context/RegionContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { processTournamentQueue } from '@/api/functions';

const TemplateCard = ({ template, game, gameMode, onRegister, currencySymbol }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            className="w-full"
        >
            <Card className="rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-0 overflow-hidden">
                <CardHeader className="p-0">
                    <img src={game.banner_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800'} alt={template.name} className="w-full h-40 object-cover"/>
                </CardHeader>
                <CardContent className="p-6">
                    <CardTitle className="text-xl font-bold text-slate-800 mb-2">{template.name || template.title}</CardTitle>
                    <p className="text-sm text-slate-600 mb-4">{game.name}</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                        <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-yellow-500" />
                            <span className="font-medium text-slate-700">{currencySymbol}{template.prize_pool} Prize</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-500" />
                            <span className="font-medium text-slate-700">{gameMode?.team_size || 1}v{gameMode?.team_size || 1}</span>
                        </div>
                    </div>
                    
                    <Button 
                        onClick={() => onRegister(template, template.participants_to_start ? 'template' : 'tournament')} 
                        className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-violet-300"
                    >
                        Join Now ({currencySymbol}{template.entry_fee} Entry)
                    </Button>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default function GameModePage() {
    const [gameMode, setGameMode] = useState(null);
    const [game, setGame] = useState(null);
    const [template, setTemplate] = useState(null);
    const [manualTournaments, setManualTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [registrationError, setRegistrationError] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [selectedTournament, setSelectedTournament] = useState(null);
    const [registrationData, setRegistrationData] = useState({ in_game_name: '', in_game_uid: '', referral_code: '' });
    const [linkedAccounts, setLinkedAccounts] = useState([]);
    const { region, currencySymbol } = useRegion();
    const [user, setUser] = useState(null);

    const location = useLocation();

    const loadData = useCallback(async () => {
        const params = new URLSearchParams(location.search);
        const gameModeId = params.get("id");

        if (gameModeId && region) {
            setLoading(true);
            try {
                // Step 1: Fetch the GameMode using its ID from the URL parameter
                const modeData = await GameModeEntity.get(gameModeId);
                if (!modeData) {
                    throw new Error(`GameMode with ID ${gameModeId} not found.`);
                }
                setGameMode(modeData);
                
                // Step 2: Use the game_id from GameMode to fetch the parent Game
                if (!modeData.game_id) {
                    throw new Error(`Game ID not found on GameMode object ${gameModeId}.`);
                }
                const gameData = await Game.get(modeData.game_id);
                if (!gameData) {
                    throw new Error(`Parent Game with ID ${modeData.game_id} not found.`);
                }
                
                // Step 3: Check if game is in the current region
                if (gameData.region_id !== region.id) {
                    throw new Error("Game or Game Mode not available in your region.");
                }
                setGame(gameData);
                
                // Step 4: Fetch related data in parallel, filtered by region
                const [templateData, tournamentsData] = await Promise.all([
                    TournamentTemplate.filter({ game_mode_id: gameModeId, is_active: true, region_id: region.id }),
                    Tournament.filter({ game_mode_id: gameModeId, tournament_type: { $ne: 'automated' }, region_id: region.id }),
                ]);
                setTemplate(templateData.length > 0 ? templateData[0] : null);
                setManualTournaments(tournamentsData);

                // Fetch linked accounts for the current user and game
                const currentUser = await User.me().catch(() => null);
                if (currentUser) {
                    setUser(currentUser); // Store user in state
                    const userAccounts = await LinkedAccount.filter({ user_id: currentUser.id, game_id: gameData.id });
                    setLinkedAccounts(userAccounts);
                }

            } catch (error) {
                console.error("Error loading game mode data:", error);
                setGame(null);
                setGameMode(null);
            } finally {
                setLoading(false);
            }
        }
    }, [location.search, region]);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    const handleRegister = async (item, type) => {
        setRegistrationError('');
        
        // Check if user is logged in
        if (!user) { 
            setRegistrationError('You must be logged in to register for a tournament.');
            setShowConfirmDialog(true); // Open dialog to show error, perhaps with login prompt
            return;
        }

        setSelectedTemplate(null);
        setSelectedTournament(null);

        if (type === 'template') { 
            setSelectedTemplate(item);
        } else { // type is 'tournament'
            setSelectedTournament(item);
        }
        
        // Reset registration data and then pre-fill if a linked account exists
        setRegistrationData({ in_game_name: '', in_game_uid: '', referral_code: '' });
        if (game) { // Ensure game is loaded to find linked accounts
            const prefillAccount = linkedAccounts.find(acc => acc.game_id === game.id);
            if (prefillAccount) {
                setRegistrationData(prev => ({
                    ...prev,
                    in_game_name: prefillAccount.in_game_name || '',
                    in_game_uid: prefillAccount.in_game_uid || ''
                }));
            }
        }

        setShowConfirmDialog(true);
    };

    const confirmRegistration = async () => {
        setIsRegistering(true);
        setRegistrationError('');

        try {
            const item = selectedTemplate || selectedTournament; 
            const entryFee = item.entry_fee || 0;

            if (!item) {
                setRegistrationError('No tournament or template selected.');
                setIsRegistering(false);
                return;
            }

            if (!registrationData.in_game_name) {
                setRegistrationError('In-Game Name is required.');
                setIsRegistering(false);
                return;
            }

            // Step 1: Get the latest user data for wallet balance
            const latestUser = await User.me(); 
            const currentBalance = latestUser.wallet_balance || 0;

            // Step 2: Check for sufficient balance
            if (currentBalance < entryFee) {
                setRegistrationError(`Insufficient wallet balance. Required: ${currencySymbol}${entryFee}. Current: ${currencySymbol}${currentBalance}`);
                setIsRegistering(false);
                return;
            }

            // Prevent duplicate registration for template-based events
            if (selectedTemplate) {
                const existingParticipation = await Participation.filter({ 
                    player_id: latestUser.id, 
                    template_id: item.id,
                    tournament_id: null // Ensure it's explicitly for template queue
                });

                // NOTE: This check allows multiple registrations. To prevent it, uncomment the following block.
                // if (existingParticipation.length > 0) {
                //     setRegistrationError("You are already in the queue for this event.");
                //     setIsRegistering(false);
                //     return;
                // }
            }

            // Step 3: Deduct fee and create transaction record (if fee exists)
            if (entryFee > 0) {
                const newBalance = currentBalance - entryFee;
                await User.updateMyUserData({ wallet_balance: newBalance }); // Use updateMyUserData for current user
                await Transaction.create({
                    user_id: latestUser.id,
                    amount: -entryFee,
                    type: 'entry_fee',
                    description: `Entry fee for ${item.name || item.title}`,
                    related_tournament_id: selectedTournament ? item.id : null // Link transaction to specific tournament if manual
                });
            }
            
            // Step 4: Create the participation record
            const participationPayload = {
                player_id: latestUser.id,
                player_name: latestUser.full_name,
                player_email: latestUser.email,
                registration_date: new Date().toISOString(),
                status: 'registered', 
                in_game_name: registrationData.in_game_name,
                in_game_uid: registrationData.in_game_uid || null,
                used_referral_code: registrationData.referral_code || null,
            };

            if (selectedTemplate) {
                participationPayload.template_id = item.id;
            } else { // Manual tournament
                participationPayload.tournament_id = item.id;
                // Increment participants for manual tournament
                const tournament = await Tournament.get(item.id); // Fetch latest participant count
                await Tournament.update(item.id, { current_participants: (tournament.current_participants || 0) + 1 });
            }

            await Participation.create(participationPayload);

            // Step 5: Trigger backend function for templates or update manual tournament
            if (selectedTemplate) {
                await processTournamentQueue({ template_id: item.id });
            } 

            setShowConfirmDialog(false);
            loadData(); // Refresh data on page (e.g., to update participant counts or user balance display)

        } catch (error) {
            console.error("Registration failed:", error);
            setRegistrationError(error.message || "An unexpected error occurred. Please try again.");
            // A more robust system would involve transactions or rollbacks for balance deduction.
        } finally {
            setIsRegistering(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-16 w-16 animate-spin text-violet-500" /></div>;
    }

    if (!gameMode || !game) {
        return <div className="text-center py-12 text-red-600">Game mode not found or could not be loaded for your region. Please check if the game and gamemode exist and are available in '{region?.name || 'your selected region'}'.</div>;
    }

    return (
        <div>
            {/* Hero Section */}
            <div className="relative h-72">
                <img src={game.banner_url} alt={game.name} className="w-full h-full object-cover"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 p-8">
                    <h1 className="text-4xl font-bold text-white">{game.name}</h1>
                    <h2 className="text-2xl text-slate-200">{gameMode.name}</h2>
                </div>
            </div>

            <main className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {template && (
                        <TemplateCard 
                            template={template} 
                            game={game} 
                            gameMode={gameMode}
                            onRegister={handleRegister} 
                            currencySymbol={currencySymbol}
                        />
                    )}
                    {manualTournaments.map(tournament => (
                        <TemplateCard 
                            key={tournament.id}
                            template={tournament} 
                            game={game}
                            gameMode={gameMode}
                            onRegister={handleRegister}
                            currencySymbol={currencySymbol}
                        />
                    ))}
                    {!template && manualTournaments.length === 0 && (
                        <div className="col-span-full text-center text-slate-500 text-lg py-8">
                            No active tournaments or templates found for this game mode in your region.
                        </div>
                    )}
                </div>
            </main>

            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Confirm Registration</DialogTitle>
                        <DialogDescription>
                            Confirm your details for "
                            {selectedTemplate?.name || selectedTournament?.title}". 
                            The entry fee of {currencySymbol}
                            {(selectedTemplate?.entry_fee || selectedTournament?.entry_fee || 0) > 0 ? 
                                `${selectedTemplate?.entry_fee || selectedTournament?.entry_fee} will be deducted from your wallet.` : 
                                'This is a free-to-enter tournament.'
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="in_game_name" className="text-sm font-medium">In-Game Name <span className="text-red-500">*</span></Label>
                            <Input 
                                id="in_game_name" 
                                value={registrationData.in_game_name} 
                                onChange={e => setRegistrationData(prev => ({...prev, in_game_name: e.target.value}))} 
                                className="mt-1 block w-full"
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="in_game_uid" className="text-sm font-medium">In-Game UID (Optional)</Label>
                            <Input 
                                id="in_game_uid" 
                                value={registrationData.in_game_uid} 
                                onChange={e => setRegistrationData(prev => ({...prev, in_game_uid: e.target.value}))} 
                                className="mt-1 block w-full"
                            />
                        </div>
                        <div>
                            <Label htmlFor="referral_code" className="text-sm font-medium">Referral Code (Optional)</Label>
                            <Input 
                                id="referral_code" 
                                value={registrationData.referral_code} 
                                onChange={e => setRegistrationData(prev => ({...prev, referral_code: e.target.value}))} 
                                className="mt-1 block w-full"
                            />
                        </div>
                    </div>
                    {registrationError && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-4" role="alert">
                            <p className="font-bold">Registration Failed</p>
                            <p>{registrationError}</p>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={isRegistering}>Cancel</Button>
                        <Button 
                            onClick={confirmRegistration} 
                            disabled={isRegistering || !registrationData.in_game_name}
                        >
                            {isRegistering ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                            ) : 
                                `Confirm & Pay ${currencySymbol}${(selectedTemplate?.entry_fee || selectedTournament?.entry_fee || 0)}`
                            }
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}