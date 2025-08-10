import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Region } from "@/api/entities";
import { Globe, Plus, Edit, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

export default function RegionManagement() {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingRegion, setEditingRegion] = useState(null);
  const [formData, setFormData] = useState({ name: "", currency_code: "", currency_symbol: "" });

  useEffect(() => {
    loadAndSeedRegions();
  }, []);

  const loadAndSeedRegions = async () => {
    setLoading(true);
    try {
      let data = await Region.list('-created_date');
      
      // If no regions exist, create default ones
      if (data.length === 0) {
        await Region.bulkCreate([
          { name: 'India', currency_code: 'INR', currency_symbol: '₹' },
          { name: 'USA', currency_code: 'USD', currency_symbol: '$' }
        ]);
        // Fetch again after creating
        data = await Region.list('-created_date');
      }
      
      setRegions(data);
    } catch (error) {
      console.error("Error loading or seeding regions:", error);
    }
    setLoading(false);
  };

  const loadRegions = async () => {
    setLoading(true);
    try {
      const data = await Region.list('-created_date');
      setRegions(data);
    } catch (error) {
      console.error("Error loading regions:", error);
    }
    setLoading(false);
  };

  const handleEdit = (region) => {
    setEditingRegion(region);
    setFormData({ name: region.name, currency_code: region.currency_code, currency_symbol: region.currency_symbol });
    setShowDialog(true);
  };

  const handleCreate = () => {
    setEditingRegion(null);
    setFormData({ name: "", currency_code: "", currency_symbol: "" });
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this region?")) {
      try {
        await Region.delete(id);
        loadRegions();
      } catch (error) {
        console.error("Error deleting region:", error);
        alert("Failed to delete region.");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRegion) {
        await Region.update(editingRegion.id, formData);
      } else {
        await Region.create(formData);
      }
      setShowDialog(false);
      loadRegions();
    } catch (error) {
      console.error("Error saving region:", error);
      alert("Failed to save region.");
    }
  };

  if (loading) return <p>Loading regions...</p>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
            Region Management
          </h1>
          <p className="text-slate-600 mt-1">Manage currency and regions for your platform</p>
        </div>
        <Button onClick={handleCreate} className="bg-gradient-to-r from-slate-700 to-slate-900 text-white rounded-xl shadow-lg">
          <Plus className="w-5 h-5 mr-2" /> Add Region
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {regions.map((region) => (
          <motion.div key={region.id} whileHover={{ scale: 1.03 }}>
            <Card className="rounded-2xl shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl flex items-center justify-center font-bold text-2xl text-slate-700">
                    {region.currency_symbol}
                  </div>
                  <div>
                    <span className="text-xl font-bold text-slate-800">{region.name}</span>
                    <p className="text-sm text-slate-500">{region.currency_code}</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(region)} className="rounded-lg">
                  <Edit className="w-4 h-4 mr-1" /> Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(region.id)} className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg">
                  <Trash2 className="w-4 h-4 mr-1" /> Delete
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingRegion ? "Edit" : "Create"} Region</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Region Name</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="rounded-xl" />
            </div>
            <div>
              <Label htmlFor="currency_code">Currency Code</Label>
              <Input id="currency_code" value={formData.currency_code} onChange={(e) => setFormData({ ...formData, currency_code: e.target.value })} required className="rounded-xl" />
            </div>
            <div>
              <Label htmlFor="currency_symbol">Currency Symbol</Label>
              <Input id="currency_symbol" value={formData.currency_symbol} onChange={(e) => setFormData({ ...formData, currency_symbol: e.target.value })} required className="rounded-xl" />
            </div>
            <Button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white rounded-xl">Save Region</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}