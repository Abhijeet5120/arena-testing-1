import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowDown, Gamepad2, Users, Trophy, Target, ChevronRight } from "lucide-react";
import { User, Tournament, Game } from "@/api/entities";
import { motion } from "framer-motion";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTournaments: 0,
    totalGames: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [users, tournaments, games] = await Promise.all([
          User.list(),
          Tournament.list(),
          Game.list()
        ]);
        
        setStats({
          totalUsers: users.length,
          totalTournaments: tournaments.length,
          totalGames: games.length
        });
      } catch (error) {
        console.error("Error loading stats:", error);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  const partners = [
    { name: "Epic Games", logo: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=200&h=100&fit=crop" },
    { name: "Steam", logo: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=200&h=100&fit=crop" },
    { name: "Discord", logo: "https://images.unsplash.com/photo-1611605698335-8b1569810432?w=200&h=100&fit=crop" },
    { name: "Twitch", logo: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=200&h=100&fit=crop" }
  ];

  return (
    <div>
      {/* Hero Section */}
      <div className="relative h-[80vh] min-h-[600px] flex items-center justify-center text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-100 via-white to-teal-100 -z-10"></div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="container mx-auto px-4 z-10"
        >
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-800 mb-6 leading-tight">
            Compete. Conquer.
            <br />
            <span className="bg-gradient-to-r from-violet-600 to-teal-500 bg-clip-text text-transparent">
              Claim Glory.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto mb-10">
            Welcome to GameArena, the premier destination for competitive gaming tournaments.
            Find your game, join the fight, and rise to the top.
          </p>
          <div className="flex flex-col items-center gap-4">
            <Link to={createPageUrl("Games")}>
              <Button 
                size="lg" 
                className="bg-violet-600 hover:bg-violet-700 text-white px-10 py-6 text-lg rounded-full shadow-lg hover:shadow-violet-300 transition-all duration-300"
              >
                <Gamepad2 className="w-6 h-6 mr-3" />
                Explore All Games
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex items-center gap-2 text-slate-500 mt-4"
            >
              <ArrowDown className="w-4 h-4 animate-bounce" />
              <span>Scroll down to learn more</span>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Platform Achievements */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">Platform Achievements</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Join thousands of players competing across multiple gaming categories with real-time statistics.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { 
                icon: Users, 
                value: loading ? "..." : stats.totalUsers.toLocaleString(), 
                label: "Registered Players",
                color: "from-blue-500 to-cyan-500"
              },
              { 
                icon: Trophy, 
                value: loading ? "..." : stats.totalTournaments.toLocaleString(), 
                label: "Tournaments Hosted",
                color: "from-yellow-500 to-orange-500"
              },
              { 
                icon: Gamepad2, 
                value: loading ? "..." : stats.totalGames.toLocaleString(), 
                label: "Games Available",
                color: "from-green-500 to-emerald-500"
              }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="text-center p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50">
                  <CardContent className="space-y-4">
                    <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-r ${stat.color} flex items-center justify-center shadow-lg`}>
                      <stat.icon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className="text-3xl md:text-4xl font-bold text-slate-800">{stat.value}</p>
                      <p className="text-slate-600 font-medium">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="py-20 bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-8">About GameArena</h2>
              <Card className="p-8 md:p-12 rounded-2xl shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="space-y-6">
                  <p className="text-lg text-slate-700 leading-relaxed">
                    Founded with a vision to revolutionize competitive gaming, GameArena brings together players from around the world to compete in structured tournaments across multiple gaming platforms. Our mission is to create a fair, transparent, and exciting environment where skill meets opportunity.
                  </p>
                  <p className="text-lg text-slate-700 leading-relaxed">
                    Whether you're a casual player looking to test your skills or a professional gamer seeking serious competition, GameArena provides the platform, tools, and community to help you achieve your gaming goals.
                  </p>
                  <div className="pt-4">
                    <Link to={createPageUrl("Games")}>
                      <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-8 py-3 rounded-full shadow-lg">
                        Start Your Journey
                        <ChevronRight className="w-5 h-5 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Partners Section */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">Our Partners</h2>
            <p className="text-lg text-slate-600">
              Trusted by leading gaming platforms and communities worldwide.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {partners.map((partner, index) => (
              <motion.div
                key={partner.name}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <Card className="p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50">
                  <CardContent className="flex items-center justify-center">
                    <img 
                      src={partner.logo} 
                      alt={partner.name}
                      className="w-full h-16 object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
                    />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}