import React, { useState, useEffect } from 'react';
import { User, Transaction } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Wallet as WalletIcon, Plus, Download, ArrowUp, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';
import { useRegion } from '../components/context/RegionContext';

export default function WalletPage() {
    const [user, setUser] = useState(null);
    const [transactions, setTransactions] =useState([]);
    const [loading, setLoading] = useState(true);
    const { currencySymbol } = useRegion();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userData = await User.me();
                setUser(userData);
                const userTransactions = await Transaction.filter({ user_id: userData.id }, '-created_date', 50);
                setTransactions(userTransactions);
            } catch (error) {
                // Not logged in, redirect
                window.location.href = createPageUrl('Dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getTransactionIcon = (type) => {
        const icons = {
            deposit: <ArrowDown className="w-5 h-5 text-green-500" />,
            entry_fee: <ArrowUp className="w-5 h-5 text-red-500" />,
            prize_won: <ArrowDown className="w-5 h-5 text-yellow-500" />,
            withdrawal: <ArrowUp className="w-5 h-5 text-blue-500" />,
        };
        return icons[type] || null;
    };
    
    const getTransactionColor = (type) => {
      const colors = {
        deposit: 'text-green-600',
        entry_fee: 'text-red-600',
        prize_won: 'text-yellow-600',
        withdrawal: 'text-blue-600',
      };
      return colors[type] || 'text-slate-600';
    }


    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-violet-500"></div>
            </div>
        );
    }
    
    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <CardHeader className="px-0">
                    <CardTitle className="text-4xl font-bold flex items-center gap-3">
                        <WalletIcon className="w-10 h-10 text-violet-600" />
                        <span>My Wallet</span>
                    </CardTitle>
                </CardHeader>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="md:col-span-2 rounded-2xl shadow-lg border-0 bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                        <CardContent className="p-8 flex flex-col justify-between h-full">
                            <div>
                                <p className="text-lg opacity-80">Total Balance</p>
                                <p className="text-5xl font-bold tracking-tighter">
                                    {currencySymbol}{(user?.wallet_balance || 0).toFixed(2)}
                                </p>
                            </div>
                            <p className="text-sm opacity-60 mt-4">Available for tournament entries and withdrawals.</p>
                        </CardContent>
                    </Card>
                    <div className="space-y-4">
                        <Button className="w-full h-24 text-lg bg-green-500 hover:bg-green-600 rounded-2xl shadow-lg">
                            <Plus className="w-6 h-6 mr-2" /> Add Funds
                        </Button>
                        <Button className="w-full h-24 text-lg bg-blue-500 hover:bg-blue-600 rounded-2xl shadow-lg">
                            <Download className="w-6 h-6 mr-2" /> Withdraw
                        </Button>
                    </div>
                </div>

                <Card className="rounded-2xl shadow-lg border-0">
                    <CardHeader>
                        <CardTitle>Transaction History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {transactions.length > 0 ? transactions.map(tx => (
                                <div key={tx.id} className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                                            {getTransactionIcon(tx.type)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800">{tx.description}</p>
                                            <p className="text-sm text-slate-500">{format(new Date(tx.created_date), 'PPp')}</p>
                                        </div>
                                    </div>
                                    <p className={`text-lg font-bold ${getTransactionColor(tx.type)}`}>
                                        {tx.type === 'deposit' || tx.type === 'prize_won' ? '+' : '-'}{currencySymbol}{Math.abs(tx.amount).toFixed(2)}
                                    </p>
                                </div>
                            )) : (
                                <p className="text-center text-slate-500 py-8">No transactions yet.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}