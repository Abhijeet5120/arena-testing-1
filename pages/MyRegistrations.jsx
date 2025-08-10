import React, { useState, useEffect, useCallback } from 'react';
import { User, Participation, Tournament, Game, GameMode, TournamentTemplate } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Gamepad2, Hash, Trophy, Clock, ListChecks, Eye, Loader2, Hourglass } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useRegion } from "../components/context/RegionContext";
import { Link } from 'react-router-dom';

export default function MyRegistrationsPage() {
    const [enrichedParticipations, setEnrichedParticipations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');
    const { region } = useRegion();

    const fetchData = useCallback(async () => {
        if (!region) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const user = await User.me();
            // Fetch all data in parallel
            const [
                userParticipations,
                allTournaments,
                allGames,
                allGameModes,
                allTemplates,
            ] = await Promise.all([
                Participation.filter({ player_id: user.id }, '-created_date'),
                Tournament.filter({ region_id: region.id }),
                Game.filter({ region_id: region.id }),
                GameMode.list(),
                TournamentTemplate.filter({ region_id: region.id }),
            ]);

            const tournamentsById = allTournaments.reduce((acc, t) => ({ ...acc, [t.id]: t }), {});
            const gamesById = allGames.reduce((acc, g) => ({ ...acc, [g.id]: g }), {});
            const gameModesById = allGameModes.reduce((acc, gm) => ({ ...acc, [gm.id]: gm }), {});
            const templatesById = allTemplates.reduce((acc, t) => ({ ...acc, [t.id]: t }), {});

            const enrichedData = userParticipations.map(p => {
                // Case 1: Participation is linked to a created Tournament
                if (p.tournament_id) {
                    const tournament = tournamentsById[p.tournament_id];
                    if (!tournament) return null; // Tournament might be in another region or deleted
                    const gameMode = gameModesById[tournament.game_mode_id];
                    const game = gamesById[gameMode?.game_id];
                    return {
                        ...p,
                        type: 'tournament',
                        title: tournament.title,
                        status: tournament.status,
                        tournament,
                        game,
                        gameMode,
                    };
                }
                // Case 2: Participation is for a template (i.e., in a queue)
                else if (p.template_id) {
                    const template = templatesById[p.template_id];
                    if (!template) return null;
                    const gameMode = gameModesById[template.game_mode_id];
                    const game = gamesById[gameMode?.game_id];
                    return {
                        ...p,
                        type: 'template',
                        title: template.name,
                        status: 'waiting_for_players',
                        template,
                        game,
                        gameMode,
                    };
                }
                return null;
            }).filter(Boolean); // Filter out any null entries

            setEnrichedParticipations(enrichedData);

        } catch (error) {
            console.error("Failed to fetch registrations", error);
        } finally {
            setLoading(false);
        }
    }, [region]);

    useEffect(() => {
        const interval = setInterval(fetchData, 15000); // Poll every 15 seconds for status updates
        fetchData();
        return () => clearInterval(interval);
    }, [fetchData]);
    
    const getStatusInfo = (participation) => {
        const status = participation.status;
        const statusMap = {
            upcoming: { label: "Upcoming", color: "bg-blue-100 text-blue-800" },
            registration_open: { label: "Waiting for Players", color: "bg-green-100 text-green-800" },
            waiting_for_players: { label: "Waiting for Players", color: "bg-green-100 text-green-800", icon: Hourglass },
            registration_closed: { label: "Preparing Match", color: "bg-yellow-100 text-yellow-800" },
            ongoing: { label: "In Progress", color: "bg-purple-100 text-purple-800" },
            completed: { 
                label: participation.placement ? `Finished #${participation.placement}` : "Completed", 
                color: participation.placement === 1 ? "bg-yellow-400 text-yellow-900" : "bg-gray-200 text-gray-800" 
            },
            cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" },
        };
        return statusMap[status] || { label: status.replace(/_/g, ' '), color: "bg-gray-100 text-gray-800" };
    };

    const filteredRegistrations = enrichedParticipations.filter(p => {
        const tournamentStatus = p.status;
        if (activeFilter === 'all') return true;
        if (activeFilter === 'ongoing') return ['registration_closed', 'ongoing'].includes(tournamentStatus);
        if (activeFilter === 'completed') return tournamentStatus === 'completed';
        if (activeFilter === 'upcoming') return ['upcoming', 'registration_open', 'waiting_for_players'].includes(tournamentStatus);
        if (activeFilter === 'cancelled') return tournamentStatus === 'cancelled';
        return false;
    });

    if (loading && enrichedParticipations.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Loader2 className="animate-spin text-violet-500 w-16 h-16" />
            </div>
        );
    }
    
    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-6xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <CardTitle className="text-4xl font-bold flex items-center gap-3">
                        <ListChecks className="w-10 h-10 text-violet-600" />
                        <span>My Registrations</span>
                    </CardTitle>
                    <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-full">
                        {['all', 'upcoming', 'ongoing', 'completed'].map(filter => (
                             <Button 
                                key={filter}
                                onClick={() => setActiveFilter(filter)} 
                                variant={activeFilter === filter ? 'default' : 'ghost'} 
                                className="rounded-full px-4 py-2 text-sm capitalize"
                            >
                                {filter}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <AnimatePresence>
                        {filteredRegistrations.length > 0 ? filteredRegistrations.map(p => {
                            const statusInfo = getStatusInfo(p);
                            const isClickable = p.type === 'tournament';
                            const Wrapper = isClickable ? Link : 'div';
                            const wrapperProps = isClickable ? { to: createPageUrl(`TournamentDetail?id=${p.tournament.id}`) } : {};

                            return (
                                <motion.div 
                                    key={p.id} 
                                    layout
                                    initial={{ opacity: 0, y: 20 }} 
                                    animate={{ opacity: 1, y: 0 }} 
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Wrapper {...wrapperProps}>
                                        <Card className={`rounded-2xl shadow-lg border-0 transition-all ${isClickable ? 'hover:shadow-xl hover:border-violet-300' : 'cursor-default'}`}>
                                            <CardContent className="p-6">
                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                                                    <div className="md:col-span-2 flex items-center gap-4">
                                                        <img 
                                                            src={p.game?.logo_url || p.tournament?.image_url} 
                                                            alt={p.game?.name} 
                                                            className="w-16 h-16 rounded-xl object-cover hidden sm:block" 
                                                        />
                                                        <div className="flex-1">
                                                            <h3 className="font-bold text-xl text-slate-800 mb-1">
                                                                {p.title}
                                                            </h3>
                                                            <p className="text-slate-600 mb-2">
                                                                {p.game?.name} • {p.gameMode?.name}
                                                            </p>
                                                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                                                <span className="flex items-center gap-1.5">
                                                                    <Calendar className="w-4 h-4"/>
                                                                    Registered {formatDistanceToNow(new Date(p.registration_date))} ago
                                                                </span>
                                                                {p.tournament?.tournament_id_custom && (
                                                                    <span className="flex items-center gap-1.5">
                                                                        <Hash className="w-4 h-4"/>
                                                                        {p.tournament.tournament_id_custom}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col gap-2">
                                                        <Badge className={`${statusInfo.color} capitalize px-3 py-1 w-fit flex items-center gap-1.5`}>
                                                            {statusInfo.icon && <statusInfo.icon className="w-4 h-4" />}
                                                            {statusInfo.label}
                                                        </Badge>
                                                    </div>

                                                    <div className="flex justify-end">
                                                        {isClickable && (
                                                            <Button variant="outline" className="rounded-xl">
                                                                <Eye className="w-4 h-4 mr-2" />
                                                                View Details
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Wrapper>
                                </motion.div>
                            );
                        }) : (
                            <div className="text-center py-16">
                                <ListChecks className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-slate-600 mb-2">
                                    {activeFilter === 'all' ? 'No registrations yet' : `No ${activeFilter} registrations`}
                                </h3>
                                <p className="text-slate-500 mb-6">
                                    {activeFilter === 'all' 
                                        ? 'Start by joining a tournament from the games section!'
                                        : `You don't have any ${activeFilter} tournament registrations.`
                                    }
                                </p>
                                <Link to={createPageUrl('Games')}>
                                    <Button className="bg-violet-600 hover:bg-violet-700">
                                        <Gamepad2 className="w-4 h-4 mr-2" />
                                        Browse Games
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}