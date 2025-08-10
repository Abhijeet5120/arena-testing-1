
import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

export default function CreatorOnboarding() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await User.me();
        if (userData.app_role !== 'creator') {
          window.location.href = createPageUrl("Dashboard");
          return;
        }
        if (userData.onboarding_completed) {
          window.location.href = createPageUrl("CreatorDashboard");
          return;
        }
        setUser(userData);
        setFormData(prev => ({
          ...prev,
          full_name: userData.full_name || ""
        }));
      } catch (error) {
        console.error("Error loading user:", error);
        window.location.href = createPageUrl("Dashboard");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await User.updateMyUserData({
        ...formData,
        onboarding_completed: true
      });
      window.location.href = createPageUrl("CreatorDashboard");
    } catch (error) {
      console.error("Error saving onboarding data:", error);
      alert("Failed to save information. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card className="rounded-2xl shadow-xl">
          <CardContent className="p-8 md:p-12">
            <div className="text-center mb-8">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 10 }}
                className="w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
              >
                <Star className="w-10 h-10 text-white" />
              </motion.div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">Complete Your Creator Profile</h1>
              <p className="text-slate-600 max-w-xl mx-auto">
                Please complete your profile to access the creator dashboard and start promoting tournaments.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({...prev, full_name: e.target.value}))}
                  className="rounded-xl"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone_number">Phone Number *</Label>
                <Input
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => setFormData(prev => ({...prev, phone_number: e.target.value}))}
                  className="rounded-xl"
                  placeholder="+1 (555) 123-4567"
                  required
                />
              </div>

              <div className="bg-slate-50 rounded-xl p-4">
                <h3 className="font-semibold text-slate-700 mb-2">Assignments</h3>
                <p className="text-slate-600 text-sm">
                  Your region and game assignments have been pre-assigned by the administrator.
                </p>
              </div>

              <Button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-10 py-6 text-lg rounded-xl shadow-lg hover:shadow-blue-200 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Complete Setup"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
