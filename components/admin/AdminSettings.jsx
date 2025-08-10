import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings, Save, Globe, Bell, Shield, Palette } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    siteName: "GameArena",
    siteDescription: "Premier tournament platform for competitive gaming",
    allowRegistrations: true,
    emailNotifications: true,
    maintenanceMode: false,
    autoApprove: false,
    maxTournaments: 50,
    defaultPrizePool: 1000
  });

  const handleSave = () => {
    // Save settings logic here
    console.log("Saving settings:", settings);
  };

  const settingSections = [
    {
      title: "General Settings",
      icon: Globe,
      color: "from-blue-400 to-cyan-500",
      items: [
        {
          key: "siteName",
          label: "Site Name",
          type: "input",
          value: settings.siteName
        },
        {
          key: "siteDescription",
          label: "Site Description",
          type: "input",
          value: settings.siteDescription
        }
      ]
    },
    {
      title: "Tournament Settings",
      icon: Shield,
      color: "from-violet-400 to-purple-500",
      items: [
        {
          key: "allowRegistrations",
          label: "Allow New Registrations",
          type: "switch",
          value: settings.allowRegistrations
        },
        {
          key: "autoApprove",
          label: "Auto-approve Tournaments",
          type: "switch",
          value: settings.autoApprove
        },
        {
          key: "maxTournaments",
          label: "Max Tournaments per Game",
          type: "number",
          value: settings.maxTournaments
        },
        {
          key: "defaultPrizePool",
          label: "Default Prize Pool ($)",
          type: "number",
          value: settings.defaultPrizePool
        }
      ]
    },
    {
      title: "Notifications",
      icon: Bell,
      color: "from-green-400 to-emerald-500",
      items: [
        {
          key: "emailNotifications",
          label: "Email Notifications",
          type: "switch",
          value: settings.emailNotifications
        }
      ]
    },
    {
      title: "System",
      icon: Settings,
      color: "from-red-400 to-pink-500",
      items: [
        {
          key: "maintenanceMode",
          label: "Maintenance Mode",
          type: "switch",
          value: settings.maintenanceMode
        }
      ]
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-slate-600 mt-1">Configure your platform settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {settingSections.map((section, index) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="rounded-2xl shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-gradient-to-r ${section.color} rounded-xl flex items-center justify-center`}>
                    <section.icon className="w-5 h-5 text-white" />
                  </div>
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {section.items.map((item) => (
                  <div key={item.key} className="space-y-2">
                    <Label htmlFor={item.key} className="text-sm font-medium text-slate-700">
                      {item.label}
                    </Label>
                    {item.type === 'input' && (
                      <Input
                        id={item.key}
                        value={item.value}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          [item.key]: e.target.value
                        }))}
                        className="rounded-xl"
                      />
                    )}
                    {item.type === 'number' && (
                      <Input
                        id={item.key}
                        type="number"
                        value={item.value}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          [item.key]: parseInt(e.target.value) || 0
                        }))}
                        className="rounded-xl"
                      />
                    )}
                    {item.type === 'switch' && (
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={item.key}
                          checked={item.value}
                          onCheckedChange={(checked) => setSettings(prev => ({
                            ...prev,
                            [item.key]: checked
                          }))}
                        />
                        <Label htmlFor={item.key} className="text-sm text-slate-600">
                          {item.value ? 'Enabled' : 'Disabled'}
                        </Label>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-end">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={handleSave}
            className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg"
          >
            <Save className="w-5 h-5 mr-2" />
            Save All Settings
          </Button>
        </motion.div>
      </div>
    </div>
  );
}