import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { TournamentTemplate, GameMode, Region } from "@/api/entities";
import { Plus, Edit, Trash2, Zap } from "lucide-react";
import { motion } from "framer-motion";

const TournamentTemplateManagement = ({ gameId }) => {
    const [templates, setTemplates] = useState([]);
    const [gameModes, setGameModes] = useState([]);
    const [regions, setRegions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        game_id: gameId,
        game_mode_id: "",
        region_id: "",
        rules: "",
        prize_pool: 0,
        entry_fee: 0,
        team_size: 1,
        participants_to_start: 2,
        waiting_time_minutes: 5,
        is_active: true,
    });

    useEffect(() => {
        loadData();
    }, [gameId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [templateData, modeData, regionData] = await Promise.all([
                TournamentTemplate.filter({ game_id: gameId }),
                GameMode.filter({ game_id: gameId }),
                Region.list()
            ]);
            setTemplates(templateData);
            setGameModes(modeData);
            setRegions(regionData);
        } catch (error) {
            console.error("Error loading template data:", error);
        }
        setLoading(false);
    };

    const handleCreate = () => {
        setEditingTemplate(null);
        setFormData({
            name: "",
            game_id: gameId,
            game_mode_id: "",
            region_id: "",
            rules: "",
            prize_pool: 0,
            entry_fee: 0,
            team_size: 1,
            participants_to_start: 2,
            waiting_time_minutes: 5,
            is_active: true,
        });
        setShowDialog(true);
    };

    const handleEdit = (template) => {
        setEditingTemplate(template);
        setFormData({ ...template });
        setShowDialog(true);
    };

    const handleDelete = async (id) => {
        if (confirm("Are you sure you want to delete this template?")) {
            try {
                await TournamentTemplate.delete(id);
                loadData();
            } catch (error) {
                console.error("Error deleting template:", error);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const dataToSave = {
                ...formData,
                prize_pool: Number(formData.prize_pool),
                entry_fee: Number(formData.entry_fee),
                team_size: Number(formData.team_size),
                participants_to_start: Number(formData.participants_to_start),
                waiting_time_minutes: Number(formData.waiting_time_minutes),
            };

            if (editingTemplate) {
                await TournamentTemplate.update(editingTemplate.id, dataToSave);
            } else {
                await TournamentTemplate.create(dataToSave);
            }
            setShowDialog(false);
            loadData();
        } catch (error) {
            console.error("Error saving template:", error);
            alert("Failed to save template.");
        }
    };

    if (loading) {
        return <p>Loading templates...</p>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Automation Templates</h3>
                <Button onClick={handleCreate}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Template
                </Button>
            </div>

            <div className="space-y-4">
                {templates.map(template => (
                    <Card key={template.id} className="rounded-xl">
                        <CardContent className="p-4 flex justify-between items-center">
                            <div>
                                <p className="font-bold">{template.name}</p>
                                <p className="text-sm text-slate-500">
                                    {gameModes.find(m => m.id === template.game_mode_id)?.name || 'Unknown Mode'} • {regions.find(r => r.id === template.region_id)?.name || 'Unknown Region'}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant={template.is_active ? "default" : "secondary"}>
                                    {template.is_active ? "Active" : "Paused"}
                                </Badge>
                                <Button size="icon" variant="ghost" onClick={() => handleEdit(template)}><Edit className="w-4 h-4" /></Button>
                                <Button size="icon" variant="ghost" onClick={() => handleDelete(template.id)}><Trash2 className="w-4 h-4" /></Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {templates.length === 0 && <p className="text-center text-slate-500 py-4">No templates created for this game yet.</p>}

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingTemplate ? "Edit" : "Create"} Automation Template</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto pr-2">
                        <div>
                            <Label htmlFor="name">Template Name</Label>
                            <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="game_mode_id">Game Mode</Label>
                                <Select value={formData.game_mode_id} onValueChange={value => setFormData({...formData, game_mode_id: value})} required>
                                    <SelectTrigger><SelectValue placeholder="Select mode" /></SelectTrigger>
                                    <SelectContent>
                                        {gameModes.map(mode => <SelectItem key={mode.id} value={mode.id}>{mode.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div>
                                <Label htmlFor="region_id">Region</Label>
                                <Select value={formData.region_id} onValueChange={value => setFormData({...formData, region_id: value})} required>
                                    <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                                    <SelectContent>
                                        {regions.map(region => <SelectItem key={region.id} value={region.id}>{region.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="prize_pool">Prize Pool</Label>
                                <Input id="prize_pool" type="number" value={formData.prize_pool} onChange={e => setFormData({...formData, prize_pool: e.target.value})} />
                            </div>
                            <div>
                                <Label htmlFor="entry_fee">Entry Fee</Label>
                                <Input id="entry_fee" type="number" value={formData.entry_fee} onChange={e => setFormData({...formData, entry_fee: e.target.value})} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="team_size">Team Size</Label>
                                <Input id="team_size" type="number" value={formData.team_size} onChange={e => setFormData({...formData, team_size: e.target.value})} required />
                            </div>
                             <div>
                                <Label htmlFor="participants_to_start">Participants to Start</Label>
                                <Input id="participants_to_start" type="number" value={formData.participants_to_start} onChange={e => setFormData({...formData, participants_to_start: e.target.value})} required />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="waiting_time_minutes">Wait Time (minutes)</Label>
                            <Input id="waiting_time_minutes" type="number" value={formData.waiting_time_minutes} onChange={e => setFormData({...formData, waiting_time_minutes: e.target.value})} required />
                        </div>
                        <div>
                            <Label htmlFor="rules">Rules</Label>
                            <Textarea id="rules" value={formData.rules} onChange={e => setFormData({...formData, rules: e.target.value})} />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch id="is_active" checked={formData.is_active} onCheckedChange={checked => setFormData({...formData, is_active: checked})} />
                            <Label htmlFor="is_active">Template is Active</Label>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
                            <Button type="submit">Save Template</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default TournamentTemplateManagement;