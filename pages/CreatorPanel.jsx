import React, { useState, useEffect } from 'react';
import { User, Game, Tournament, Region } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';

export default function CreatorPanel() {
    const [user, setUser] = useState(null);
    const [assignedGames, setAssignedGames] = useState([]);
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAccess = async () => {
            try {
                const currentUser = await User.me();
                if (currentUser.role !== 'creator') {
                    window.location.href = createPageUrl("Dashboard");
                    return;
                }
                setUser(currentUser);
                loadData(currentUser);
            } catch (error) {
                window.location.href = createPageUrl("Dashboard");
            }
        };
        checkAccess();
    }, []);

    const loadData = async (currentUser) => {
        setLoading(true);
        try {
            const [gamesData, tournamentsData] = await Promise.all([
                Game.list(),
                Tournament.filter({ region_id: currentUser.region_id, tournament_type: 'automated' }),
            ]);
            
            const creatorGames = gamesData.filter(g => (currentUser.assigned_games_creator || []).includes(g.id));
            const creatorGameIds = creatorGames.map(g => g.id);

            const relevantTournaments = tournamentsData.filter(t => {
                const game = gamesData.find(g => g.game_code === t.tournament_id_custom.substring(0, 3));
                return game && creatorGameIds.includes(game.id);
            });
            
            setAssignedGames(creatorGames);
            setTournaments(relevantTournaments);
        } catch (error) {
            console.error("Failed to load creator data:", error);
        } finally {
            setLoading(false);
        }
    };
    
    if (loading) return <div>Loading Creator Panel...</div>;

    return (
        <div className="container mx-auto p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <CardHeader className="px-0">
                    <CardTitle className="text-3xl font-bold">Creator Panel</CardTitle>
                    <p className="text-gray-500">Welcome, {user.full_name}! Here are the automated tournaments for your assigned games.</p>
                </CardHeader>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <Card>
                        <CardHeader><CardTitle>Your Assigned Games</CardTitle></CardHeader>
                        <CardContent className="flex flex-wrap gap-2">
                            {assignedGames.map(game => <Badge key={game.id} variant="secondary">{game.name}</Badge>)}
                            {assignedGames.length === 0 && <p>No games assigned.</p>}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Upcoming Automated Tournaments</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            {tournaments.map(t => (
                                <div key={t.id} className="border p-3 rounded-lg">
                                    <p className="font-bold">{t.title} <span className="font-mono text-xs bg-gray-100 p-1 rounded">{t.tournament_id_custom}</span></p>
                                    <p className="text-sm">{new Date(t.start_date).toLocaleString()}</p>
                                </div>
                            ))}
                            {tournaments.length === 0 && <p>No upcoming tournaments.</p>}
                        </CardContent>
                    </Card>
                </div>
            </motion.div>
        </div>
    );
}