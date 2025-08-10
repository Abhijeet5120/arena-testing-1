
import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Tournament, Game, GameMode, Participation, User, ReferralCode } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import {
  Trophy, Users, DollarSign, Clock, Calendar,
  Gamepad2, ArrowLeft, Hash, ShieldCheck, Info, Star, Loader2
} from 'lucide-react';
import { format, isPast } from 'date-fns';
import { useRegion } from '../components/context/RegionContext';

const CountdownTimer = ({ date }) => {
    const calculateTimeLeft = () => {
        const difference = +new Date(date) - +new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearTimeout(timer);
    });

    const timerComponents = [];
    Object.keys(timeLeft).forEach((interval) => {
        // Only render non-zero components, or if it's the last non-zero component (seconds)
        if (timeLeft[interval] === undefined) return; // Skip if calculation hasn't happened yet

        // Only show larger units if they are non-zero or if smaller units are also shown
        if (timeLeft[interval] > 0 || timerComponents.length > 0 || interval === 'seconds') {
            timerComponents.push(
                <div key={interval} className="flex flex-col items-center">
                    <span className="text-2xl sm:text-3xl font-bold">{String(timeLeft[interval]).padStart(2, '0')}</span>
                    <span className="text-xs sm:text-sm uppercase text-gray-500">{interval}</span>
                </div>
            );
        }
    });

    return (
        <div className="flex gap-4 justify-center">
            {timerComponents.length ? timerComponents : <span className="text-2xl font-bold text-gray-600">Event has started!</span>}
        </div>
    );
};

export default function TournamentDetailPage() {
  const [tournament, setTournament] = useState(null);
  const [game, setGame] = useState(null);
  const [gameMode, setGameMode] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [userParticipation, setUserParticipation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const location = useLocation();
  const { region, currencySymbol } = useRegion();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tournamentId = params.get('id');

    if (!tournamentId || !region) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const [userData, tournamentData] = await Promise.all([
          User.me().catch(() => null),
          Tournament.get(tournamentId)
        ]);

        if (!tournamentData) {
          throw new Error("Tournament not found.");
        }

        if (tournamentData.region_id !== region.id) {
          throw new Error("Tournament not available in your region.");
        }

        setUser(userData);
        setTournament(tournamentData);

        const [gameModeData, participantsData] = await Promise.all([
            GameMode.get(tournamentData.game_mode_id),
            Participation.filter({ tournament_id: tournamentData.id })
        ]);

        setGameMode(gameModeData);
        setParticipants(participantsData);

        if (gameModeData) {
          // FIX: Corrected Game.get call to use gameModeData.game_id
          const gameData = await Game.get(gameModeData.game_id);
          setGame(gameData);
        }

        if (userData) {
          const userPart = participantsData.find(p => p.player_id === userData.id);
          setUserParticipation(userPart);
        }

      } catch (error) {
        console.error("Error loading tournament data:", error);
        setTournament(null); // Explicitly set to null on any error or not found
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [location.search, region]);

  const getStatusInfo = (status) => {
    const statusMap = {
      upcoming: { label: 'Upcoming', color: 'bg-blue-100 text-blue-800', icon: Calendar },
      registration_open: { label: 'Registration Open', color: 'bg-green-100 text-green-800', icon: Users },
      registration_closed: { label: 'Preparing Match', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      ongoing: { label: 'In Progress', color: 'bg-purple-100 text-purple-800', icon: Gamepad2 },
      completed: { label: 'Completed', color: 'bg-gray-100 text-gray-800', icon: Trophy },
      cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: ShieldCheck } // Changed icon to ShieldCheck
    };
    return statusMap[status] || { label: status.replace(/_/g, ' '), ...statusMap.upcoming };
  };

  const statusInfo = tournament ? getStatusInfo(tournament.status) : null;
  const registrationEnded = tournament && isPast(new Date(tournament.registration_deadline));

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="container mx-auto text-center py-20">
        <Trophy className="mx-auto h-24 w-24 text-slate-300 mb-6" />
        <h1 className="text-4xl font-bold text-slate-700">Tournament Not Found</h1>
        <p className="text-slate-500 mt-4">The tournament you are looking for does not exist or may have been moved.</p>
        <Link to={createPageUrl("Games")}>
          <Button className="mt-8">Back to Games</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="relative h-80">
        <img src={tournament.image_url || game?.banner_url} alt={tournament.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 bg-gradient-to-t from-black/70 to-transparent text-white">
            <h1 className="text-4xl font-bold">{tournament.title}</h1>
            <p className="text-lg mt-1">{game?.name} • {gameMode?.name}</p>
            {statusInfo && (
                <Badge className={`absolute top-6 right-6 px-4 py-2 text-base capitalize ${statusInfo.color}`}>
                    <statusInfo.icon className="w-5 h-5 mr-2" />
                    {statusInfo.label}
                </Badge>
            )}
            <Link to={game ? createPageUrl(`Game?id=${game.id}`) : createPageUrl('Games')} className="absolute top-6 left-6 text-white text-lg z-10 flex items-center hover:text-violet-200 transition-colors">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to {game?.name || 'Games'}
            </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-5xl -mt-24">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Room Details Card - Conditional */}
            {tournament.status === 'ongoing' && userParticipation && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-8"
                >
                    <Card className="rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-2xl">
                        <CardHeader>
                            <CardTitle className="text-2xl text-center">Match Room Details</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center space-y-4">
                            <div>
                                <p className="text-slate-400 text-sm">Room ID</p>
                                <p className="text-3xl font-bold tracking-widest">{tournament.room_code || 'Not Available'}</p>
                            </div>
                            <div>
                                <p className="text-slate-400 text-sm">Room Password</p>
                                <p className="text-3xl font-bold tracking-widest">{tournament.room_password || 'Not Available'}</p>
                            </div>
                            <p className="text-xs text-slate-500 pt-4">These details are only visible to participants. Join the room in-game now!</p>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            <div
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-8">
                <Card className="rounded-2xl shadow-lg border-0">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-3">
                      {statusInfo && <statusInfo.icon className="w-6 h-6" />}
                      <span>Status</span>
                    </CardTitle>
                    {statusInfo && (
                        <Badge className={`${statusInfo.color} capitalize px-4 py-2 text-sm`}>
                            {statusInfo.label}
                        </Badge>
                    )}
                  </CardHeader>
                  {(['upcoming', 'registration_open'].includes(tournament.status) && new Date(tournament.start_date) > new Date()) && (
                    <CardContent>
                      <CountdownTimer date={tournament.start_date} />
                    </CardContent>
                  )}
                </Card>

                <Card className="rounded-2xl shadow-lg border-0">
                  <CardHeader><CardTitle>Participants ({participants.length}/{tournament.max_participants})</CardTitle></CardHeader>
                  <CardContent>
                    {participants.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {participants.map(p => (
                          <div key={p.id} className="flex flex-col items-center text-center gap-2">
                            <Avatar>
                              <AvatarImage src={p.player_avatar_url} />
                              <AvatarFallback>{p.player_name?.[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium truncate w-full">{p.player_name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-center py-4">No participants have registered yet.</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column */}
              <div className="lg:col-span-1 space-y-8">
                <Card className="rounded-2xl shadow-lg border-0">
                  <CardHeader>
                    <CardTitle>Tournament Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="flex items-center gap-3">
                        <DollarSign className="w-5 h-5 text-green-500"/>
                        <div>
                            <p className="text-slate-500">Prize Pool</p>
                            <p className="font-bold text-slate-800">{currencySymbol}{tournament.prize_pool?.toLocaleString()}</p>
                        </div>
                      </div>
                       <div className="flex items-center gap-3">
                        <DollarSign className="w-5 h-5 text-red-500"/>
                        <div>
                            <p className="text-slate-500">Entry Fee</p>
                            <p className="font-bold text-slate-800">{tournament.entry_fee > 0 ? `${currencySymbol}${tournament.entry_fee}`: 'Free'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-blue-500"/>
                        <div>
                            <p className="text-slate-500">Players</p>
                            <p className="font-bold text-slate-800">{tournament.current_participants} / {tournament.max_participants}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-violet-500"/>
                        <div>
                            <p className="text-slate-500">Start Date</p>
                            <p className="font-bold text-slate-800">{format(new Date(tournament.start_date), 'PP')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-orange-500"/>
                        <div>
                            <p className="text-slate-500">Start Time</p>
                            <p className="font-bold text-slate-800">{format(new Date(tournament.start_date), 'p')}</p>
                        </div>
                      </div>
                      {tournament.tournament_id_custom &&
                        <div className="flex items-center gap-3">
                          <Hash className="w-5 h-5 text-slate-500"/>
                          <div>
                              <p className="text-slate-500">Event ID</p>
                              <p className="font-bold text-slate-800">{tournament.tournament_id_custom}</p>
                          </div>
                        </div>
                      }
                      {tournament.registration_deadline && (
                         <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-slate-400"/>
                            <div>
                                <p className="text-slate-500">Registration Closes</p>
                                <p className="font-bold text-slate-800">{format(new Date(tournament.registration_deadline), 'PPp')}</p>
                            </div>
                        </div>
                      )}
                  </CardContent>
                  <CardContent>
                    <Button
                        className="w-full"
                        disabled={userParticipation || registrationEnded || !['upcoming', 'registration_open'].includes(tournament.status)}
                    >
                        {userParticipation ? "You are Registered" : (registrationEnded ? "Registration Closed" : "Register Now")}
                    </Button>
                    {userParticipation && userParticipation.used_referral_code && (
                        <p className="text-xs text-center text-gray-500 mt-2 flex items-center justify-center">
                            <Star className="w-3 h-3 inline-block mr-1"/>Referred by: {userParticipation.used_referral_code}
                        </p>
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-lg border-0">
                  <CardHeader><CardTitle>Rules</CardTitle></CardHeader>
                  <CardContent className="text-sm text-slate-600 prose prose-sm max-w-none">
                    <p>{tournament.rules || "No specific rules provided for this tournament."}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
        </motion.div>
      </div>
    </div>
  );
}
