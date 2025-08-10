import React, { useState, useEffect } from 'react';
import { User, Game } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';

export default function CreatorManagement({ selectedRegion }) {
    const [creators, setCreators] = useState([]);
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (selectedRegion) {
            loadData();
        }
    }, [selectedRegion]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [usersData, gamesData] = await Promise.all([
                User.filter({ app_role: 'creator', region_id: selectedRegion }),
                Game.filter({ region_id: selectedRegion })
            ]);
            setCreators(usersData);
            setGames(gamesData);
        } catch (error) {
            console.error("Failed to load creator data:", error);
        } finally {
            setLoading(false);
        }
    };

    const getGameName = (gameId) => {
        const game = games.find(g => g.id === gameId);
        return game ? game.name : 'Unassigned';
    };

    if (loading) return <p>Loading creators...</p>;

    return (
        <div className="space-y-6">
            <Card className="bg-blue-50 border-blue-200">
                 <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                    <AlertCircle className="w-5 h-5 text-blue-600" />
                    <div>
                        <CardTitle className="text-blue-800">Creator Management has moved!</CardTitle>
                        <CardDescription className="text-blue-700">
                           Assigning roles and games to creators is now handled in the 'Users & Roles' section for a more centralized experience. This page is for viewing purposes only.
                        </CardDescription>
                    </div>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {creators.map(creator => (
                    <Card key={creator.id} className="shadow-lg rounded-xl">
                        <CardHeader>
                            <CardTitle>{creator.full_name}</CardTitle>
                             <p className="text-sm text-slate-500">{creator.email}</p>
                        </CardHeader>
                        <CardContent>
                            <p className="font-semibold mb-2 text-sm">Assigned Game:</p>
                             <Badge variant="secondary">{getGameName(creator.assigned_games_creator?.[0])}</Badge>
                        </CardContent>
                    </Card>
                ))}
            </div>
            {creators.length === 0 && <p className="text-center text-slate-500 py-8">No creators found for this region.</p>}
        </div>
    );
}