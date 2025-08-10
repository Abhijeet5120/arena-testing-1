
import React, { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Region } from "@/api/entities";
import { Globe } from "lucide-react";

export default function RegionSwitcher({ selectedRegion, onRegionChange, enforceSelection = false }) {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRegions = async () => {
      try {
        const regionData = await Region.list();
        setRegions(regionData);
        if (enforceSelection && !selectedRegion && regionData.length > 0) {
          // Default to the first region if selection is enforced and none is selected
          onRegionChange(regionData[0].id);
        }
      } catch (error) {
        console.error("Error loading regions:", error);
      } finally {
        setLoading(false);
      }
    };
    loadRegions();
  }, [enforceSelection, selectedRegion, onRegionChange]); // Added enforceSelection, selectedRegion, and onRegionChange to dependencies

  const getSelectedRegionName = () => {
    if (!selectedRegion) return enforceSelection ? "Select a Region" : "All Regions";
    const region = regions.find(r => r.id === selectedRegion);
    // If a selected region ID exists but is not found in the loaded regions,
    // or if enforceSelection is true and no region is selected, display "Select a Region".
    // Otherwise, display the found region's name.
    return region ? region.name : "Select a Region";
  };

  const getSelectedRegionSymbol = () => {
    if (!selectedRegion) return "🌍";
    const region = regions.find(r => r.id === selectedRegion);
    return region ? region.currency_symbol : "🌍";
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-white/10 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-slate-300">
        <Globe className="w-4 h-4" />
        <span>Region Filter</span>
      </div>
      {/* Changed default value for Select when no region is selected to "" */}
      <Select value={selectedRegion || ""} onValueChange={(value) => onRegionChange(value === "all" ? null : value)}>
        <SelectTrigger className="bg-white/10 backdrop-blur-sm border-white/20 text-white rounded-lg">
          <SelectValue>
            <div className="flex items-center gap-2">
              <span className="text-lg">{getSelectedRegionSymbol()}</span>
              <span>{getSelectedRegionName()}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {/* Conditionally render "All Regions" option based on enforceSelection prop */}
          {!enforceSelection && (
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <span className="text-lg">🌍</span>
                <span>All Regions</span>
              </div>
            </SelectItem>
          )}
          {regions.map(region => (
            <SelectItem key={region.id} value={region.id}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{region.currency_symbol}</span>
                <span>{region.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedRegion && (
        <Badge variant="outline" className="text-xs text-slate-300 border-white/20">
          Showing data for {getSelectedRegionName()} only
        </Badge>
      )}
    </div>
  );
}
