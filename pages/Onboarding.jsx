import React, { useState, useEffect } from "react";
import { Region, User } from "@/api/entities";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Globe } from "lucide-react";

export default function Onboarding() {
  const [regions, setRegions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await User.me();
        if (user.region_id) {
          window.location.href = createPageUrl("Dashboard");
          return;
        }
        const regionsData = await Region.list();
        setRegions(regionsData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSelectRegion = async () => {
    if (!selectedRegion) {
      alert("Please select a region.");
      return;
    }
    try {
      await User.updateMyUserData({ region_id: selectedRegion });
      window.location.href = createPageUrl("Dashboard");
    } catch (error) {
      console.error("Error saving region:", error);
      alert("Could not save your region. Please try again.");
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-violet-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl"
      >
        <Card className="rounded-2xl shadow-xl">
          <CardContent className="p-8 md:p-12 text-center">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 10 }}
              className="w-20 h-20 bg-gradient-to-r from-violet-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
            >
              <Globe className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">Select Your Region</h1>
            <p className="text-slate-600 mb-8 max-w-xl mx-auto">
              This helps us personalize your experience, including showing prize pools in your local currency. This selection is permanent.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
              {regions.map((region) => (
                <motion.div
                  key={region.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <button
                    onClick={() => setSelectedRegion(region.id)}
                    className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedRegion === region.id
                        ? 'border-violet-500 bg-violet-50 shadow-lg'
                        : 'border-slate-200 bg-white hover:border-violet-300'
                    }`}
                  >
                    <div className="text-4xl mb-2">{region.currency_symbol}</div>
                    <div className="font-semibold text-slate-700">{region.name}</div>
                    <div className="text-sm text-slate-500">{region.currency_code}</div>
                  </button>
                </motion.div>
              ))}
            </div>

            <Button
              size="lg"
              disabled={!selectedRegion}
              onClick={handleSelectRegion}
              className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-10 py-6 text-lg rounded-full shadow-lg hover:shadow-violet-300 disabled:opacity-50"
            >
              Confirm and Continue
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}