import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User, Region } from "@/api/entities";
import { 
  CreditCard, 
  Wallet, 
  TrendingUp, 
  Send, 
  Download,
  Plus,
  AlertCircle,
  DollarSign,
  Users,
  Trophy
} from "lucide-react";
import { motion } from "framer-motion";

export default function PaymentsManagement({ selectedRegion }) {
  const [users, setUsers] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTopUpDialog, setShowTopUpDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, regionsData] = await Promise.all([
        User.list(),
        Region.list()
      ]);
      setUsers(usersData);
      setRegions(regionsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedRegionCurrency = () => {
    if (!selectedRegion) return "$";
    const region = regions.find(r => r.id === selectedRegion);
    return region ? region.currency_symbol : "$";
  };

  const getSelectedRegionName = () => {
    if (!selectedRegion) return "All Regions";
    const region = regions.find(r => r.id === selectedRegion);
    return region ? region.name : "All Regions";
  };

  const filteredUsers = selectedRegion 
    ? users.filter(user => user.region_id === selectedRegion)
    : users;

  const totalWalletBalance = filteredUsers.reduce((sum, user) => sum + (user.wallet_balance || 0), 0);
  const currencySymbol = getSelectedRegionCurrency();

  const statCards = [
    {
      title: "Total Wallet Balance",
      value: `${currencySymbol}${totalWalletBalance.toLocaleString()}`,
      icon: Wallet,
      color: "from-green-500 to-emerald-600",
      bgColor: "from-green-50 to-emerald-50"
    },
    {
      title: "Active Users",
      value: filteredUsers.length,
      icon: Users,
      color: "from-blue-500 to-cyan-600",
      bgColor: "from-blue-50 to-cyan-50"
    },
    {
      title: "Pending Payouts",
      value: "0",
      icon: Send,
      color: "from-orange-500 to-red-600",
      bgColor: "from-orange-50 to-red-50"
    },
    {
      title: "Tournament Fees",
      value: `${currencySymbol}0`,
      icon: Trophy,
      color: "from-purple-500 to-pink-600",
      bgColor: "from-purple-50 to-pink-50"
    }
  ];

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-slate-700 mx-auto mb-4"></div>
        <p className="text-slate-600">Loading payments data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
          Payments Management
        </h1>
        <p className="text-slate-600 mt-1">
          Manage wallets, transactions, and payouts
          {selectedRegion && ` • ${getSelectedRegionName()}`}
        </p>
      </div>

      {/* Setup Notice */}
      <Card className="rounded-2xl border-2 border-amber-200 bg-amber-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-amber-900 mb-2">Payment System Setup Required</h3>
              <p className="text-amber-700 mb-4">
                This section is prepared for future payment gateway integration. Currently showing wallet balances and user data.
              </p>
              <div className="space-y-2 text-amber-700 text-sm">
                <p>• Configure payment gateway (Stripe, Razorpay, etc.)</p>
                <p>• Set up automated payout schedules</p>
                <p>• Implement transaction logging</p>
                <p>• Add manual top-up functionality</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card className={`rounded-2xl border-0 bg-gradient-to-br ${stat.bgColor} shadow-lg hover:shadow-xl transition-all duration-300`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-2">{stat.title}</p>
                    <div className="text-3xl font-bold text-slate-800">{stat.value}</div>
                  </div>
                  <div className={`w-16 h-16 bg-gradient-to-r ${stat.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                    <stat.icon className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="rounded-2xl shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-green-600" />
              Manual Top-up
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">Add funds to user wallets manually</p>
            <Button 
              className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl"
              disabled
            >
              Coming Soon
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-600" />
              Process Payouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">Send tournament winnings to players</p>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
              disabled
            >
              Coming Soon
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-purple-600" />
              Export Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">Download transaction and payout reports</p>
            <Button 
              className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
              disabled
            >
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* User Wallets */}
      <Card className="rounded-2xl shadow-xl border-0">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-800">User Wallet Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredUsers.length > 0 ? (
              filteredUsers
                .sort((a, b) => (b.wallet_balance || 0) - (a.wallet_balance || 0))
                .slice(0, 20)
                .map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-slate-600 to-slate-800 rounded-full flex items-center justify-center font-bold text-white text-sm">
                        {user.full_name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{user.full_name || 'Unknown User'}</p>
                        <p className="text-sm text-slate-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-800">{currencySymbol}{(user.wallet_balance || 0).toFixed(2)}</p>
                      <Badge variant="outline" className="text-xs">
                        {user.role}
                      </Badge>
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-slate-500 text-center py-8">No users found in selected region</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}