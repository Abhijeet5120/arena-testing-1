
import React, { useState, useEffect } from "react";
import { User, ReferralCode, Participation, Transaction, Tournament } from "@/api/entities";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from "framer-motion";
import { Star, Link as LinkIcon, DollarSign, Users, Trophy, BarChart2, ShieldCheck } from "lucide-react";
import { useRegion } from "../components/context/RegionContext";

export default function CreatorDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState(null);
  const [newCode, setNewCode] = useState('');
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ referrals: 0, earnings: 0, chartData: [] });
  const [transactions, setTransactions] = useState([]);
  const { region, currencySymbol } = useRegion();
  const [activeTab, setActiveTab] = useState('statistics');

  const loadData = async (userData, creatorCode) => {
    try {
      if (!region) return;

      // Fetch all participations in the region that used this creator's code
      const participations = await Participation.filter({
        used_referral_code: creatorCode.code
      });

      // To ensure we only count participations in the creator's region, we need to get tournament data
      const tournamentIds = [...new Set(participations.map(p => p.tournament_id))];
      const tournamentsInRegion = await Tournament.filter({
        id: { $in: tournamentIds },
        region_id: region.id
      });
      const tournamentIdsInRegionSet = new Set(tournamentsInRegion.map(t => t.id));

      const regionFilteredParticipations = participations.filter(p => tournamentIdsInRegionSet.has(p.tournament_id));

      // Fetch creator's earnings from transactions
      const userTransactions = await Transaction.filter({ user_id: userData.id, type: "prize_won" });
      const totalEarnings = userTransactions.reduce((acc, tx) => acc + tx.amount, 0);

      // Process chart data
      const signupsByDay = regionFilteredParticipations.reduce((acc, p) => {
        const date = new Date(p.registration_date).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      const chartData = Object.entries(signupsByDay).map(([date, count]) => ({
        name: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        signups: count
      })).sort((a, b) => new Date(a.name) - new Date(b.name));


      setStats({ referrals: regionFilteredParticipations.length, earnings: totalEarnings, chartData });
      setTransactions(userTransactions.slice(0, 10));

    } catch (err) {
      console.error("Error loading creator data:", err);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      try {
        const userData = await User.me();
        if (userData.app_role !== 'creator') {
          window.location.href = createPageUrl("Dashboard");
          return;
        }
        setUser(userData);

        const existingCode = await ReferralCode.filter({ creator_id: userData.id });
        if (existingCode.length > 0) {
          setReferralCode(existingCode[0]);
          if (region) { // Load data only when region is available
            await loadData(userData, existingCode[0]);
          }
        }
      } catch (error) {
        window.location.href = createPageUrl("Dashboard");
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, [region]); // Add region as a dependency to re-run when region changes

  const handleCreateCode = async () => {
    setError('');
    if (!newCode || newCode.length > 10 || !/^[a-zA-Z0-9]+$/.test(newCode)) {
      setError("Code must be 1-10 alphanumeric characters.");
      return;
    }
    try {
      // Check for uniqueness
      const existing = await ReferralCode.filter({ code: newCode });
      if (existing.length > 0) {
        setError("This code is already taken. Please choose another.");
        return;
      }
      const created = await ReferralCode.create({ creator_id: user.id, code: newCode });
      setReferralCode(created);
      setNewCode('');
      // After creating a new code, reload data to reflect current stats
      if (user && region) {
        await loadData(user, created);
      }
    } catch (err) {
      setError("Failed to create code. Please try again.");
      console.error(err);
    }
  };

  const Sidebar = () => (
    <aside className="w-full md:w-64 space-y-2">
      <div className="p-4 bg-slate-800 text-white rounded-2xl mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center font-bold text-white shadow-lg text-lg">
            {user?.full_name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-white">{user?.full_name}</p>
            <p className="text-xs text-slate-300">Content Creator</p>
          </div>
        </div>
      </div>
      {[
        { id: 'statistics', label: 'Statistics', icon: BarChart2 },
        { id: 'referral', label: 'Referral Code', icon: LinkIcon },
        { id: 'payments', label: 'Payments', icon: DollarSign },
      ].map(item => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          className={`w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all duration-200 ${
            activeTab === item.id
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <item.icon className="w-5 h-5" />
          <span className="font-semibold">{item.label}</span>
        </button>
      ))}
    </aside>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'statistics':
        return <StatisticsContent />;
      case 'referral':
        return <ReferralContent />;
      case 'payments':
        return <PaymentsContent />;
      default:
        return <StatisticsContent />;
    }
  };

  const StatisticsContent = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg"><Users className="w-7 h-7 text-white" /></div>
            <div><p className="text-2xl font-bold text-slate-800">{stats.referrals}</p><p className="text-slate-600 font-medium">Total Referrals</p></div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg"><DollarSign className="w-7 h-7 text-white" /></div>
            <div><p className="text-2xl font-bold text-slate-800">{currencySymbol}{stats.earnings.toFixed(2)}</p><p className="text-slate-600 font-medium">Total Earnings</p></div>
          </CardContent>
        </Card>
      </div>
      <Card className="rounded-2xl shadow-xl border-0">
        <CardHeader><CardTitle>Weekly Referral Signups</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="signups" fill="#3b82f6" name="Referral Signups" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );

  const ReferralContent = () => (
    <Card className="rounded-2xl shadow-xl border-0">
      <CardHeader><CardTitle>Your Referral Code</CardTitle></CardHeader>
      <CardContent>
        {referralCode ? (
          <div className="text-center p-8 bg-slate-50 rounded-xl">
            <p className="text-slate-600 mb-2">Share your unique code:</p>
            <p className="text-4xl font-bold text-slate-800 tracking-widest bg-white inline-block px-6 py-2 rounded-lg border">{referralCode.code}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-slate-600">You haven't set a referral code yet. Create one now!</p>
            <div className="flex gap-2">
              <Input
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="Enter your desired code"
                maxLength={10}
              />
              <Button onClick={handleCreateCode}>Create Code</Button>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const PaymentsContent = () => (
    <Card className="rounded-2xl shadow-xl border-0">
      <CardHeader><CardTitle>Recent Payouts</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transactions.length > 0 ? transactions.map(tx => (
            <div key={tx.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-700">{tx.description}</p>
                <p className="text-xs text-slate-500">{new Date(tx.created_date).toLocaleString()}</p>
              </div>
              <p className="font-bold text-green-600">+ {currencySymbol}{tx.amount.toFixed(2)}</p>
            </div>
          )) : (
            <p className="text-center text-slate-500 py-8">No payment history found.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );


  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Star className="w-8 h-8 text-white" />
          </div>
          <p className="text-lg text-slate-600">Loading Creator Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Creator Dashboard</h1>
          <p className="text-slate-600">Welcome, {user?.full_name}. Here's your content overview.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          <Sidebar />
          <main className="flex-1">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderContent()}
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}
