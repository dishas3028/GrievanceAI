import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup, Circle, LayerGroup, useMap, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet + Vite
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;
import {
    LayoutDashboard, FileText, CheckCircle2, Clock, AlertTriangle,
    Search, Filter, ChevronRight, LogOut, Settings,
    MessageSquare, User, MapPin, Calendar, ArrowUpRight,
    TrendingUp, Download, PieChart, Users, Building2,
    Trash2, Send, ExternalLink, ShieldCheck, Zap, MoreVertical,
    Target, Activity, Globe, Cpu, Hash, Sparkles,
    Layers, Map, UserPlus, FileSearch, ShieldAlert,
    BarChart4, ClipboardList, Share2, PlusCircle,
    TrendingDown, Info, Star, Brain, Heart, XCircle, Award,
    Car, Droplet, HeartPulse, BrainCircuit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, Grievance } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, AreaChart, Area, Cell, Pie
} from "recharts";

const MapController = ({ selectedCoords }: { selectedCoords: { latitude: number; longitude: number } | undefined }) => {
    const map = useMap();
    useEffect(() => {
        if (selectedCoords) {
            map.flyTo([selectedCoords.latitude, selectedCoords.longitude], 16, {
                duration: 2,
                easeLinearity: 0.25
            });
        }
    }, [selectedCoords, map]);
    return null;
};

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any; glow: string }> = {
    submitted: { label: "New", color: "text-blue-500", bg: "bg-blue-500/10", icon: FileText, glow: "shadow-blue-500/20" },
    pending: { label: "Pending", color: "text-amber-500", bg: "bg-amber-500/10", icon: Clock, glow: "shadow-amber-500/20" },
    "in-progress": { label: "Solving", color: "text-indigo-500", bg: "bg-indigo-500/10", icon: Zap, glow: "shadow-indigo-500/20" },
    resolved: { label: "Resolved", color: "text-emerald-500", bg: "bg-emerald-500/10", icon: CheckCircle2, glow: "shadow-emerald-500/20" },
    rejected: { label: "Closed", color: "text-rose-500", bg: "bg-rose-500/10", icon: Trash2, glow: "shadow-rose-500/20" },
};

const priorityConfig: Record<string, { label: string; color: string; bg: string; dot: string; pulse: string }> = {
    low: { label: "Low", color: "text-slate-400", bg: "bg-slate-400/10", dot: "bg-slate-400", pulse: "" },
    medium: { label: "Medium", color: "text-amber-400", bg: "bg-amber-400/10", dot: "bg-amber-400", pulse: "animate-pulse" },
    high: { label: "High", color: "text-orange-500", bg: "bg-orange-500/10", dot: "bg-orange-500", pulse: "animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.5)]" },
    critical: { label: "Critical", color: "text-rose-600", bg: "bg-rose-600/10", dot: "bg-rose-600", pulse: "animate-ping shadow-[0_0_12px_rgba(225,29,72,0.8)]" },
};

const AuthorityDashboard = () => {
    const { user, grievances, updateGrievanceStatus, logout, getDepartmentGrievances, addAuthorityUpdate, awardPoints } = useAuth();
    const deptGrievances = getDepartmentGrievances();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [activeTab, setActiveTab] = useState<Grievance["status"] | "all">("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All Categories");
    const [sortByCluster, setSortByCluster] = useState(false);
    const [selectedGrievanceId, setSelectedGrievanceId] = useState<string | null>(null);
    const [resolutionNote, setResolutionNote] = useState("");
    const [officialMessage, setOfficialMessage] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);
    const [isPostingUpdate, setIsPostingUpdate] = useState(false);
    const [liveLogs, setLiveLogs] = useState<{ id: string; msg: string; time: string }[]>([]);
    const [currentView, setCurrentView] = useState<"matrix" | "resources" | "geospatial" | "analytics" | "insights">("matrix");
    const [collabRequest, setCollabRequest] = useState(false);
    const [showArchiveModal, setShowArchiveModal] = useState(false);
    const [showDeploymentModal, setShowDeploymentModal] = useState(false);
    const [isDeploying, setIsDeploying] = useState(false);
    const [deployedUnits, setDeployedUnits] = useState<any[]>([]);
    const [newUnitData, setNewUnitData] = useState({ designation: "", category: "Personnel" });
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState(new Date().toLocaleTimeString());
    const [selectedAnalyticsDept, setSelectedAnalyticsDept] = useState("Global");

    useEffect(() => {
        const interval = setInterval(() => {
            setIsAutoSaving(true);
            setTimeout(() => {
                setIsAutoSaving(false);
                setLastSyncTime(new Date().toLocaleTimeString());
            }, 800);
        }, 15000); // Auto-sync every 15s
        return () => clearInterval(interval);
    }, []);

    // Export Logic
    const exportToCSV = () => {
        const headers = ["ID", "Title", "Citizen", "Category", "Status", "Priority", "Created At", "Resolution Notes", "Rating", "Feedback"];
        const rows = deptGrievances.map(g => [
            `"${g.id}"`,
            `"${g.title.replace(/"/g, '""')}"`,
            `"${g.citizenName}"`,
            `"${g.category}"`,
            `"${g.status}"`,
            `"${g.priority}"`,
            `"${new Date(g.createdAt).toLocaleString()}"`,
            `"${(g.resolutionNotes || "N/A").replace(/"/g, '""')}"`,
            `"${g.rating || "N/A"}"`,
            `"${(g.feedback || "N/A").replace(/"/g, '""')}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `registry_audit_${(user?.department || 'Registry').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
            title: "Archive sequence generated",
            description: "CSV registry exported successfully.",
        });
    };

    // --- REAL ANALYTICS COMPUTATION ---
    const analyticsData = useMemo(() => {
        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return {
                name: d.toLocaleDateString([], { weekday: 'short' }),
                date: d.toISOString().split('T')[0],
                cases: 0,
                resolved: 0
            };
        }).reverse();

        const dataToAnalyze = selectedAnalyticsDept === "Global"
            ? (Array.isArray(grievances) ? grievances : [])
            : (Array.isArray(grievances) ? grievances : []).filter(g => g.category === selectedAnalyticsDept);

        dataToAnalyze.forEach(g => {
            const gDate = new Date(g.createdAt).toISOString().split('T')[0];
            const day = last7Days.find(d => d.date === gDate);
            if (day) {
                day.cases++;
                if (g.status === 'resolved') day.resolved++;
            }
        });

        return last7Days;
    }, [grievances, selectedAnalyticsDept]);

    // Resource computation based on real department distribution
    const departmentStats = useMemo(() => {
        const allDepts = Array.from(new Set((Array.isArray(grievances) ? grievances : []).map(g => g.category)));
        return allDepts.map(dept => ({
            name: dept,
            load: grievances.filter(g => g.category === dept && g.status !== 'resolved').length,
            efficiency: Math.round(
                (grievances.filter(g => g.category === dept && g.status === 'resolved').length /
                    (grievances.filter(g => g.category === dept).length || 1)) * 100
            ) || 85
        }));
    }, [grievances]);

    const activeResources = useMemo(() => {
        const baseResources = departmentStats.map((dept, i) => ({
            id: `base-${i}`,
            name: `${dept.name.split(' ')[0]} Response Team`,
            type: 'unit',
            status: dept.load > 3 ? 'deployed' : 'available',
            load: Math.min(dept.load * 15, 100),
            efficiency: dept.efficiency,
            task: dept.load > 0 ? `Processing ${dept.load} active reports` : "Monitoring District Hub",
            location: `${user?.department || 'Registry'} District`,
            contact: "VHF-Active"
        }));

        const customResources = deployedUnits.map((unit, i) => ({
            id: `custom-${i}`,
            name: unit.designation,
            type: unit.category.toLowerCase() === 'personnel' ? 'unit' : unit.category.toLowerCase() === 'tactical' ? 'tech' : 'vehicle',
            status: 'deployed',
            load: 0,
            efficiency: 100,
            task: "Awaiting Assignment",
            location: "Transit Node",
            contact: "Inbound"
        }));

        return [...baseResources, ...customResources];
    }, [departmentStats, user?.department, deployedUnits]);

    // Simulation of live neural logs - mixed with real events
    useEffect(() => {
        const logs = [
            `AI categorizing entry from ${user?.department || 'Registry'}...`,
            "Sentiment pulse detected: CRITICAL activity",
            "Auto-router connected to Revenue Dept.",
            "Neural logic weighing current grievance load",
            `Authority '${user?.name || 'Unit'}' synchronized with central node`,
        ];

        const interval = setInterval(() => {
            const latestG = Array.isArray(grievances) ? grievances[0] : null;
            const dynamicMsg = latestG ? `New activity: ${latestG.title.slice(0, 20)}...` : logs[Math.floor(Math.random() * logs.length)];

            setLiveLogs(prev => [
                { id: Math.random().toString(), msg: dynamicMsg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
                ...prev.slice(0, 4)
            ]);
        }, 5000);
        return () => clearInterval(interval);
    }, [grievances, user?.name, user?.department]);

    if (!user || user.role !== "authority") {
        return null;
    }



    const filteredGrievances = useMemo(() => {
        const allG = Array.isArray(grievances) ? grievances : [];
        return allG // Using all grievances now
            .filter(g => activeTab === "all" || g.status === activeTab)
            .filter(g => selectedCategory === "All Categories" || g.category === selectedCategory)
            .filter(g =>
                g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                g.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (g.citizenName && g.citizenName.toLowerCase().includes(searchQuery.toLowerCase()))
            )
            .sort((a, b) => {
                if (sortByCluster) {
                    return (a.clusterId || 0) - (b.clusterId || 0);
                }
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
    }, [grievances, activeTab, selectedCategory, searchQuery, sortByCluster]);

    const stats = useMemo(() => ({
        total: deptGrievances.length,
        pending: deptGrievances.filter(g => g.status === "pending" || g.status === "submitted").length,
        inProgress: deptGrievances.filter(g => g.status === "in-progress").length,
        resolved: deptGrievances.filter(g => g.status === "resolved").length,
        critical: deptGrievances.filter(g => g.priority === "critical" && g.status !== "resolved").length,
    }), [deptGrievances]);

    const resolutionRate = useMemo(() => {
        if (stats.total === 0) return 100;
        return Math.round((stats.resolved / stats.total) * 100);
    }, [stats]);

    const avgCitizenRating = useMemo(() => {
        const rated = deptGrievances.filter(g => g.rating !== undefined && g.rating !== null);
        if (rated.length === 0) return "5.0";
        const sum = rated.reduce((acc, g) => acc + (g.rating || 0), 0);
        return (sum / rated.length).toFixed(1);
    }, [deptGrievances]);

    // Fix: Search in ALL grievances so authorities can view/update any case visible in the registry
    const selectedGrievance = (Array.isArray(grievances) ? grievances : []).find(g => g.id === selectedGrievanceId);

    const handleUpdateStatus = async (status: Grievance["status"]) => {
        if (!selectedGrievanceId) return;
        setIsUpdating(true);
        try {
            await updateGrievanceStatus(selectedGrievanceId, status, resolutionNote);
            toast({
                title: `Status: ${status.toUpperCase()}`,
                description: `Action recorded in the registry sequence.`,
            });
            setResolutionNote("");
        } catch (err) {
            toast({
                title: "Sync Failed",
                description: "Could not update grievance status.",
                variant: "destructive"
            });
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-600 flex overflow-hidden font-sans">
            {/* Neural Sidebar */}
            <aside className="w-80 bg-white border-r border-slate-200 hidden lg:flex flex-col relative z-50 shadow-sm">
                <div className="p-8 border-b border-white/5 mb-4">
                    <div className="flex items-center gap-4 group">
                        <div className="w-12 h-12 rounded-[1.2rem] bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.3)] group-hover:scale-110 transition-transform duration-500">
                            <Building2 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="font-display font-black text-xl text-slate-900 tracking-widest uppercase">GrievanceAI</h1>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Authority Unit</span>
                            </div>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-4">Command Center</div>
                    {[
                        { id: "matrix", label: "Registry", icon: ClipboardList },
                        { id: "insights", label: "Dept Insight", icon: PieChart },
                        { id: "resources", label: "Tactical Hub", icon: Users },
                        { id: "geospatial", label: "Heat Map", icon: Map },
                        { id: "analytics", label: "Analytics", icon: BarChart4 },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => setCurrentView(item.id as any)}
                            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${currentView === item.id
                                ? "bg-indigo-50 text-indigo-600 border border-indigo-200 shadow-sm ring-1 ring-indigo-200"
                                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                }`}
                        >
                            <item.icon className={`h-5 w-5 transition-transform duration-500 group-hover:scale-110 ${currentView === item.id ? "text-indigo-400" : ""}`} />
                            <span className="font-bold text-sm tracking-wide">{item.label}</span>
                            {currentView === item.id && (
                                <motion.div layoutId="activeDot" className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                            )}
                        </button>
                    ))}

                    <div className="pt-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-4">Registry Phases</div>
                    {[
                        { id: "all", label: "Global Registry", icon: Globe },
                        { id: "submitted", label: "Pending Feed", icon: FileSearch },
                        { id: "in-progress", label: "Active Sequence", icon: Activity },
                        { id: "resolved", label: "Resolved Cases", icon: ShieldCheck },
                        { id: "rejected", label: "Voided Nodes", icon: Trash2 },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => { setActiveTab(item.id as any); setCurrentView("matrix"); }}
                            className={`w-full flex items-center gap-4 px-5 py-3 rounded-xl transition-all duration-300 group ${activeTab === item.id && currentView === "matrix"
                                ? "bg-slate-100 text-slate-900 shadow-sm"
                                : "text-slate-400 hover:text-slate-600"
                                }`}
                        >
                            <item.icon className="h-4 w-4" />
                            <span className="font-bold text-xs tracking-wide">{item.label}</span>
                        </button>
                    ))}

                    <div className="mt-8 p-6 bg-slate-900 rounded-3xl border border-white/5 space-y-4 shadow-xl">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Neural Link</span>
                            <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Inference Node</span>
                            <span className="flex h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Persistence</span>
                            <span className="flex h-2 w-2 rounded-full bg-blue-500" />
                        </div>
                    </div>

                    <div className="pt-8 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4 px-4">System Activity</div>
                    <div className="px-4 space-y-3 pb-8">
                        <AnimatePresence>
                            {liveLogs.slice(0, 5).map(log => (
                                <motion.div
                                    key={log.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="text-[10px] font-mono border-l-2 border-indigo-500/30 pl-3 py-1 bg-indigo-500/5 rounded-r-md text-slate-500"
                                >
                                    <span className="text-indigo-400">[{log.time}]</span> {log.msg}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </nav>

                <div className="p-8 mt-auto border-t border-slate-100 bg-slate-50/50">
                    <div className="bg-white rounded-3xl p-5 border border-slate-200 group relative overflow-hidden shadow-sm">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl -translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-700" />
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                                <User className="h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-black text-slate-900 text-sm truncate">{user?.name}</p>
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest truncate">{user?.department || 'Registry'}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => { logout(); navigate("/"); }}
                            className="mt-5 w-full flex items-center justify-center gap-3 py-3 rounded-2xl bg-slate-100 hover:bg-rose-500/10 hover:text-rose-600 text-xs font-black uppercase tracking-widest transition-all duration-300 border border-transparent hover:border-rose-200"
                        >
                            <LogOut className="h-4 w-4" /> Disconnect
                        </button>
                    </div>
                </div>
            </aside>

            {/* Neural Interface Main Display */}
            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
                {/* Top Neural Header */}
                <header className="bg-white/80 backdrop-blur-3xl border-b border-slate-200 px-10 py-6 flex items-center justify-between z-20 sticky top-0">
                    <div className="flex items-center gap-10">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-0.5">Authority <span className="text-indigo-600">Console</span></h2>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Node: <span className="text-indigo-600">{user?.department || 'Registry'}</span></span>
                                <div className="w-px h-3 bg-slate-200" />
                                <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase flex items-center gap-2">
                                    <Globe className="h-3 w-3 text-indigo-500" /> Global Registry
                                </span>
                                <div className="w-px h-3 bg-slate-200" />
                                <span className="text-[10px] font-black text-emerald-600 tracking-widest uppercase flex items-center gap-2">
                                    <Activity className="h-3 w-3 animate-pulse" /> Efficiency: {resolutionRate || 0}%
                                </span>
                                <div className="w-px h-3 bg-slate-200" />
                                <span className="text-[10px] font-black text-slate-300 tracking-widest uppercase flex items-center gap-2">
                                    <Clock className="h-3 w-3 text-slate-300" /> Last Sync: Just Now
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <AnimatePresence>
                            {(currentView === "matrix" || currentView === "geospatial") && (
                                <motion.div
                                    initial={{ opacity: 0, width: 0, x: 20 }}
                                    animate={{ opacity: 1, width: "auto", x: 0 }}
                                    exit={{ opacity: 0, width: 0, x: 20 }}
                                    className="relative group overflow-hidden"
                                >
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
                                    <Input
                                        className="bg-slate-50 border-slate-200 w-80 pl-12 h-14 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 text-slate-900 text-sm font-bold placeholder:text-slate-400 shadow-inner outline-none transition-all"
                                        placeholder="Search case files..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery("")}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 transition-colors"
                                        >
                                            <XCircle className="h-4 w-4" />
                                        </button>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </header>

                {/* Dashboard Content */}
                <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.05),transparent_100%)]">
                    {/* Stats Bar - Futuristic Tiles */}
                    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { label: "Total Cases", value: stats.total, icon: ClipboardList, color: "text-blue-400", trend: "TOTAL", colorClass: "blue" },
                            { label: "Under Review", value: stats.inProgress, icon: Zap, color: "text-indigo-400", trend: "ACTIVE", colorClass: "indigo" },
                            { label: "Urgent Priority", value: stats.critical, icon: ShieldAlert, color: "text-rose-500", trend: "HIGH", colorClass: "rose" },
                            { label: "Resolved Cases", value: stats.resolved, icon: CheckCircle2, color: "text-emerald-400", trend: "CLOSED", colorClass: "emerald" },
                        ].map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="relative group cursor-pointer"
                            >
                                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 flex items-center justify-between hover:border-indigo-300 transition-all duration-500 hover:-translate-y-2 shadow-sm">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-slate-400">{stat.label}</p>
                                        <div className="flex items-baseline gap-3">
                                            <p className="text-5xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
                                            <span className={`text-[10px] font-black ${stat.trend.startsWith('+') ? 'text-emerald-500' : 'text-slate-400'} tracking-widest`}>
                                                {stat.trend}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={`w-16 h-16 rounded-[1.5rem] bg-${stat.colorClass}-500/10 flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform duration-500 shadow-xl border border-${stat.colorClass}-500/10`}>
                                        <stat.icon className="h-8 w-8" />
                                    </div>
                                </div>
                                {/* Decorative bottom bar */}
                                <div className={`absolute bottom-0 left-10 right-10 h-1 bg-${stat.colorClass}-500/40 rounded-full blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity`} />
                            </motion.div>
                        ))}
                    </section>

                    {/* Dynamic View Content */}
                    <AnimatePresence mode="wait">
                        {currentView === "matrix" && (
                            <motion.section
                                key="matrix"
                                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="grid grid-cols-1 lg:grid-cols-12 gap-10"
                            >
                                {/* Feed Display */}
                                <div className="lg:col-span-8 space-y-6">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Case Registry</h3>
                                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Live grievance distribution sequence</p>
                                        </div>
                                        <div className="flex gap-4">

                                            <div className="flex p-1 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto no-scrollbar max-w-[500px]">
                                                {["all", "submitted", "in-progress", "resolved", "rejected"].map((tab) => (
                                                    <button
                                                        key={tab}
                                                        onClick={() => setActiveTab(tab as any)}
                                                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab
                                                            ? "bg-slate-900 text-white shadow-lg"
                                                            : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                                            }`}
                                                    >
                                                        {tab === "all" ? "GLOBAL" : tab === "submitted" ? "PENDING" : tab === "in-progress" ? "PROGRESS" : tab === "resolved" ? "RESOLVED" : "VOIDED"}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar mb-8">
                                        {["All Categories", "Roads & Infrastructure", "Sanitation", "Water Supply", "Electricity", "Public Health", "Other"].map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setSelectedCategory(cat)}
                                                className={`px-6 py-3 whitespace-nowrap rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${selectedCategory === cat
                                                    ? "bg-slate-950 text-white border-slate-900 shadow-lg"
                                                    : "bg-white text-slate-400 border-slate-100 hover:border-indigo-200"
                                                    }`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="space-y-4">
                                        <AnimatePresence>
                                            {filteredGrievances.length === 0 ? (
                                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-32 text-center bg-slate-50 rounded-[3rem] border border-slate-200 border-dashed">
                                                    <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 transform rotate-12 shadow-sm">
                                                        <Cpu className="h-10 w-10 text-slate-200" />
                                                    </div>
                                                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-widest">No Matches Found</h4>
                                                    <p className="text-sm font-medium text-slate-400 mt-2">The registry is currently clear of this specific node category.</p>
                                                </motion.div>
                                            ) : (
                                                filteredGrievances.map((g, i) => {
                                                    const s = statusConfig[g.status];
                                                    const p = priorityConfig[g.priority];
                                                    return (
                                                        <motion.div
                                                            key={g.id}
                                                            layout
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: i * 0.05 }}
                                                            onClick={() => setSelectedGrievanceId(g.id)}
                                                            className={`group p-8 rounded-[2.5rem] border bg-white cursor-pointer transition-all duration-500 hover:scale-[1.01] flex items-center gap-8 ${selectedGrievanceId === g.id ? "border-indigo-400 bg-indigo-50 ring-1 ring-indigo-100" : "border-slate-200 hover:border-slate-300"
                                                                }`}
                                                        >
                                                            <div className={`w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-indigo-500/10 to-blue-500/10 flex items-center justify-center ${s.glow} group-hover:scale-110 transition-transform duration-500`}>
                                                                <s.icon className={`h-8 w-8 ${s.color}`} />
                                                            </div>

                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-4 mb-2">
                                                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{g.id}</span>
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(g.createdAt).toLocaleDateString()}</span>
                                                                </div>
                                                                <h4 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors truncate uppercase tracking-tighter">{g.title}</h4>
                                                                <div className="flex items-center gap-6 mt-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <User className="h-3.5 w-3.5 text-slate-300" />
                                                                        <span className="text-xs font-bold text-slate-500">{g.citizenName}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Building2 className="h-3.5 w-3.5 text-indigo-400" />
                                                                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{g.category}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <MapPin className="h-3.5 w-3.5 text-slate-300" />
                                                                        <span className="text-xs font-bold text-slate-500">{g.district}</span>
                                                                    </div>

                                                                </div>
                                                            </div>

                                                            <div className="flex flex-col items-end gap-3">
                                                                <div className={`px-4 py-1.5 rounded-xl ${p.bg} flex items-center gap-2 border border-${p.color.split('-')[1]}-500/20`}>
                                                                    <div className={`w-2 h-2 rounded-full ${p.dot} ${p.pulse}`} />
                                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${p.color}`}>{p.label}</span>
                                                                </div>
                                                                <div className={`px-4 py-1.5 rounded-xl ${s.bg} border border-${s.color.split('-')[1]}-500/20`}>
                                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${s.color}`}>{s.label}</span>
                                                                </div>
                                                            </div>

                                                            <div
                                                                className="pl-4 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedGrievanceId(g.id);
                                                                }}
                                                            >
                                                                <div className="w-10 h-10 rounded-full bg-indigo-500 hover:bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/40 transition-colors">
                                                                    <ChevronRight className="h-5 w-5" />
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* AI Control & Visual Panels */}
                                <div className="lg:col-span-4 space-y-10 max-h-[calc(100vh-280px)] overflow-y-auto no-scrollbar sticky top-0">
                                    {/* Similar Cases AI Panel */}
                                    <div className="bg-white border border-slate-200 rounded-[3rem] p-8 shadow-sm relative group">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-30" />
                                        <div className="flex items-center gap-4 mb-10">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-indigo-600 border border-indigo-500/20">
                                                <Brain className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">Strategic Insight</h3>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI-Generated Response Vectors</p>
                                            </div>
                                        </div>

                                        {selectedGrievance ? (
                                            <div className="space-y-6">
                                                <div className="p-6 bg-indigo-600/5 rounded-3xl border border-indigo-500/10 border-dashed">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Sparkles className="h-4 w-4 text-indigo-400" />
                                                        <span className="text-[11px] font-black text-indigo-400 uppercase tracking-widest">Diagnostic Verdict</span>
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-700 leading-relaxed italic mb-4">
                                                        {selectedGrievance.status === 'resolved'
                                                            ? 'Resolution sequence verified. Optimization metrics logged to historical archives.'
                                                            : selectedGrievance.status === 'rejected'
                                                                ? 'Node termination complete. System has voided the entry from the global registry.'
                                                                : `This ${selectedGrievance.category} report indicates ${selectedGrievance.urgencyScore > 7 ? 'Critical' : 'Moderate'} urgency. Based on historical data, resolution takes ~${selectedGrievance.priority === 'critical' ? '24h' : '3-5 days'} for this sector.`}
                                                    </p>

                                                    <div className="space-y-3 mb-6">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[9px] font-black text-slate-400 uppercase">Resolution Forecast</span>
                                                            <span className="text-[10px] font-black text-indigo-600 uppercase">92% Confidence</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-indigo-500/10 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: "92%" }}
                                                                className="h-full bg-indigo-500"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between text-[9px] font-black text-indigo-400/60 uppercase">
                                                            <span>Action Strategy Matrix</span>
                                                        </div>
                                                        <ul className="space-y-1.5">
                                                            {((selectedGrievance.priority === 'critical' || selectedGrievance.urgencyScore > 7)
                                                                ? [
                                                                    "Dispatch immediate field inspection unit",
                                                                    "Initialize multi-dept coordination",
                                                                    "Broadcast emergency status to district",
                                                                    "Seal resolution within 12-hour cycle"
                                                                ] : [
                                                                    "Verify registry node signatures",
                                                                    "Assign to standard maintenance queue",
                                                                    "Synchronize citizen feedback loops",
                                                                    "Finalize terminal resolution status"
                                                                ]
                                                            ).map((step, idx) => (
                                                                <li key={idx} className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                                                                    <div className="w-4 h-4 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[7px] text-indigo-600 font-black">{idx + 1}</div>
                                                                    {step}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-indigo-500/10">
                                                        <div>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Risk Factor</p>
                                                            <p className={`text-xl font-black ${selectedGrievance.urgencyScore > 7 ? 'text-rose-600' : 'text-slate-900'}`}>{selectedGrievance.urgencyScore > 7 ? 'High' : 'Nominal'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">SLA Deadline</p>
                                                            <p className="text-xl font-black text-indigo-600">{selectedGrievance.priority === 'critical' ? '12h' : '72h'}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* CIVIC POINTS ALLOCATION */}
                                                <div className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-3xl group relative overflow-hidden">
                                                    <div className="absolute -top-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                        <Star className="h-16 w-16 text-amber-500" />
                                                    </div>
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <Award className="h-4 w-4 text-amber-500" />
                                                        <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Civic Recognition Points</span>
                                                    </div>

                                                    {selectedGrievance.pointsAwarded ? (
                                                        <div className="py-4 px-6 bg-amber-500 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-amber-500/20">
                                                            <CheckCircle2 className="h-5 w-5 text-white" />
                                                            <span className="text-white text-[10px] font-black uppercase tracking-widest">Points Awarded</span>
                                                        </div>
                                                    ) : (
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <Button
                                                                onClick={async () => {
                                                                    if (!selectedGrievance?.id) return;
                                                                    const success = await awardPoints(selectedGrievance.id, 10);
                                                                    if (success) toast({ title: "Points Transmitted", description: "10 Civic Points added to citizen profile." });
                                                                }}
                                                                className="h-12 bg-white hover:bg-amber-50 text-amber-600 border border-amber-200 font-black text-[10px] rounded-xl shadow-sm transition-all"
                                                            >
                                                                +10 POINTS
                                                            </Button>
                                                            <Button
                                                                onClick={async () => {
                                                                    if (!selectedGrievance?.id) return;
                                                                    const success = await awardPoints(selectedGrievance.id, 25);
                                                                    if (success) toast({ title: "Points Transmitted", description: "25 Civic Points added to citizen profile." });
                                                                }}
                                                                className="h-12 bg-amber-500 hover:bg-amber-600 text-white font-black text-[10px] rounded-xl shadow-lg shadow-amber-500/20 transition-all border-none"
                                                            >
                                                                +25 POINTS
                                                            </Button>
                                                        </div>
                                                    )}
                                                    <p className="text-[8px] font-bold text-amber-600/40 uppercase tracking-widest mt-3 text-center">{selectedGrievance.pointsAwarded ? 'This citizen has been recognized for this case.' : 'Incentivize high-quality civic participation'}</p>
                                                </div>

                                                <div className="space-y-4">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Dept Consensus</p>
                                                    {filteredGrievances
                                                        .filter(g => g.category === selectedGrievance.category && g.id !== selectedGrievance.id)
                                                        .slice(0, 3)
                                                        .map(item => (
                                                            <div key={item.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-colors cursor-pointer" onClick={() => setSelectedGrievanceId(item.id)}>
                                                                <div className="flex flex-col gap-0.5">
                                                                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight truncate max-w-[150px]">{item.title}</span>
                                                                    <span className="text-[9px] font-bold text-slate-400 uppercase">Status: {item.status}</span>
                                                                </div>
                                                                <ChevronRight className="h-4 w-4 text-slate-300" />
                                                            </div>
                                                        ))}
                                                    {filteredGrievances.filter(g => g.category === selectedGrievance.category && g.id !== selectedGrievance.id).length === 0 && (
                                                        <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50 text-center">
                                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No related nodes found</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="space-y-4">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Control Interface</p>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <Button
                                                            onClick={() => handleUpdateStatus('pending')}
                                                            disabled={isUpdating}
                                                            className={`py-4 font-black uppercase tracking-widest rounded-xl shadow-lg text-[9px] transition-all relative ${selectedGrievance.status === 'pending'
                                                                ? 'bg-amber-500 ring-4 ring-amber-500/30 shadow-amber-500/20'
                                                                : 'bg-amber-600/80 hover:bg-amber-500 text-white shadow-amber-500/10'
                                                                }`}
                                                        >
                                                            {isUpdating ? 'Wait...' : (selectedGrievance.status === 'rejected' ? 'Restore to Pending' : 'Set Pending')}
                                                            {selectedGrievance.status === 'pending' && <div className="absolute -top-2 -right-1 px-1.5 py-0.5 bg-white text-amber-600 text-[6px] rounded-full border border-amber-200 shadow-sm z-10">ACTIVE</div>}
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleUpdateStatus('in-progress')}
                                                            disabled={isUpdating}
                                                            className={`py-4 font-black uppercase tracking-widest rounded-xl shadow-lg text-[9px] transition-all relative ${selectedGrievance.status === 'in-progress'
                                                                ? 'bg-indigo-600 ring-4 ring-indigo-500/30 shadow-indigo-500/20'
                                                                : 'bg-indigo-700/80 hover:bg-indigo-600 text-white shadow-indigo-500/10'
                                                                }`}
                                                        >
                                                            {isUpdating ? 'Wait...' : 'In Progress'}
                                                            {selectedGrievance.status === 'in-progress' && <div className="absolute -top-2 -right-1 px-1.5 py-0.5 bg-white text-indigo-600 text-[6px] rounded-full border border-indigo-200 shadow-sm z-10">ACTIVE</div>}
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleUpdateStatus('resolved')}
                                                            disabled={isUpdating}
                                                            className={`py-4 font-black uppercase tracking-widest rounded-xl shadow-lg text-[9px] transition-all relative ${selectedGrievance.status === 'resolved'
                                                                ? 'bg-emerald-600 ring-4 ring-emerald-500/30 shadow-emerald-500/20'
                                                                : 'bg-emerald-700/80 hover:bg-emerald-600 text-white shadow-emerald-500/10'
                                                                }`}
                                                        >
                                                            {isUpdating ? 'Wait...' : (selectedGrievance.status === 'rejected' ? 'Restore & Resolve' : 'Finalize')}
                                                            {selectedGrievance.status === 'resolved' && <div className="absolute -top-2 -right-1 px-1.5 py-0.5 bg-white text-emerald-600 text-[6px] rounded-full border border-emerald-200 shadow-sm z-10">ACTIVE</div>}
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleUpdateStatus('rejected')}
                                                            disabled={isUpdating}
                                                            className={`py-4 font-black uppercase tracking-widest rounded-xl shadow-lg text-[9px] transition-all relative ${selectedGrievance.status === 'rejected'
                                                                ? 'bg-rose-600 ring-4 ring-rose-500/30 shadow-rose-500/20'
                                                                : 'bg-rose-700/80 hover:bg-rose-600 text-white shadow-rose-500/10'
                                                                }`}
                                                        >
                                                            {isUpdating ? 'Wait...' : 'Void Signal'}
                                                            {selectedGrievance.status === 'rejected' && <div className="absolute -top-2 -right-1 px-1.5 py-0.5 bg-white text-rose-600 text-[6px] rounded-full border border-rose-200 shadow-sm z-10">ACTIVE</div>}
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="space-y-4 pt-6 border-t border-slate-100">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <MessageSquare className="h-4 w-4 text-indigo-500" />
                                                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Post Official Update</span>
                                                    </div>
                                                    <textarea
                                                        value={officialMessage}
                                                        onChange={(e) => setOfficialMessage(e.target.value)}
                                                        placeholder="Transmit a message to the citizen..."
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 transition-all min-h-[100px] resize-none outline-none"
                                                    />
                                                    <Button
                                                        onClick={async () => {
                                                            if (!officialMessage || !selectedGrievanceId) return;
                                                            setIsPostingUpdate(true);
                                                            try {
                                                                await addAuthorityUpdate(selectedGrievanceId, officialMessage);
                                                                setOfficialMessage("");
                                                                toast({ title: "Update Transmitted", description: "Message logged in neural feed." });
                                                            } catch (err) {
                                                                toast({ title: "Failed", description: "Could not send update.", variant: "destructive" });
                                                            } finally {
                                                                setIsPostingUpdate(false);
                                                            }
                                                        }}
                                                        disabled={isPostingUpdate || !officialMessage}
                                                        variant="outline"
                                                        className="w-full h-12 border-indigo-200 text-indigo-600 hover:bg-indigo-50 text-[10px] font-black uppercase tracking-widest rounded-xl"
                                                    >
                                                        {isPostingUpdate ? 'Transmitting...' : 'Post Update to Citizen'}
                                                    </Button>
                                                </div>

                                                {/* REACTIONS FEED */}
                                                <div className="space-y-4 pt-6">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Broadcast History</p>
                                                    {selectedGrievance.authorityUpdates && selectedGrievance.authorityUpdates.length > 0 ? (
                                                        <div className="space-y-3">
                                                            {selectedGrievance.authorityUpdates.map((upd, idx) => (
                                                                <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                                                    <p className="text-xs font-semibold text-slate-700 leading-relaxed mb-2">"{upd.message}"</p>
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-[8px] font-bold text-slate-400">
                                                                            {new Date(upd.timestamp).toLocaleTimeString()}
                                                                        </span>
                                                                        <div className="flex gap-1">
                                                                            {upd.reactions && upd.reactions.length > 0 ? (
                                                                                Object.entries(
                                                                                    upd.reactions.reduce((acc: any, r) => {
                                                                                        acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                                                                                        return acc;
                                                                                    }, {})
                                                                                ).map(([emoji, count]: [string, any]) => (
                                                                                    <span key={emoji} className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[9px] font-bold">
                                                                                        {emoji} {count}
                                                                                    </span>
                                                                                ))
                                                                            ) : (
                                                                                <span className="text-[8px] text-slate-300 uppercase font-bold italic">No feedback</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-3xl opacity-30">
                                                            <p className="text-[8px] font-black uppercase tracking-widest">No history</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* CITIZEN FEEDBACK SECTION */}
                                                {(selectedGrievance.rating > 0 || selectedGrievance.feedback) && (
                                                    <div className="mt-8 p-6 bg-emerald-50 border border-emerald-100 rounded-[2rem] relative overflow-hidden group">
                                                        <div className="absolute top-0 right-0 p-4 opacity-5">
                                                            <Star className="h-20 w-20 text-emerald-500" />
                                                        </div>
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg">
                                                                    <Heart className="h-5 w-5" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">Citizen Satisfaction</p>
                                                                    <div className="flex gap-0.5 mt-1">
                                                                        {[1, 2, 3, 4, 5].map(star => (
                                                                            <Star key={star} className={`h-3 w-3 ${star <= selectedGrievance.rating ? "fill-emerald-500 text-emerald-500" : "text-emerald-200"}`} />
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-[18px] font-black text-emerald-700 leading-none">{selectedGrievance.rating}/5</p>
                                                            </div>
                                                        </div>
                                                        {selectedGrievance.feedback && (
                                                            <div className="p-4 bg-white border border-emerald-100 rounded-2xl shadow-sm">
                                                                <p className="text-xs font-bold text-emerald-900 leading-relaxed italic">"{selectedGrievance.feedback}"</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="py-20 text-center opacity-20">
                                                <Cpu className="h-16 w-16 mx-auto mb-4 animate-pulse" />
                                                <p className="text-xs font-black uppercase tracking-[0.2em]">Select node for analysis</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Department Efficiency Visual */}
                                    <div className="bg-[#0c101b] border border-white/5 rounded-[3rem] p-8 shadow-2xl">
                                        <h3 className="text-lg font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3">
                                            <TrendingUp className="h-5 w-5 text-indigo-400" /> Resolution Performance
                                        </h3>
                                        <div className="space-y-8">
                                            {departmentStats.slice(0, 3).map(item => (
                                                <div key={item.name}>
                                                    <div className="flex justify-between items-center mb-3">
                                                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{item.name}</span>
                                                        <span className="text-[10px] font-black text-white">{item.efficiency}%</span>
                                                    </div>
                                                    <div className="w-full bg-[#060810] h-3 rounded-full border border-white/5 overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            whileInView={{ width: `${item.efficiency}%` }}
                                                            className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.5)]"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.section>
                        )}

                        {currentView === "resources" && (
                            <motion.section
                                key="resources"
                                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="space-y-10"
                            >
                                {/* AI CLUSTERING - TACTICAL HUB ENHANCEMENT */}
                                <div className="p-8 bg-[#0c101b] border border-white/5 rounded-[3rem] relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity duration-1000">
                                        <BrainCircuit className="h-64 w-64 text-indigo-500" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                                                <BrainCircuit className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-white uppercase tracking-widest">Neural Cluster Matrix</h3>
                                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mt-1">AI-driven criticality grouping & pattern recognition</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                            {[
                                                { id: 'critical', label: 'CRITICAL', color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20', icon: ShieldAlert },
                                                { id: 'high', label: 'HIGH', color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: AlertTriangle },
                                                { id: 'medium', label: 'MEDIUM', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', icon: Activity },
                                                { id: 'low', label: 'LOW', color: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/20', icon: Clock }
                                            ].map(level => {
                                                const cluster = (Array.isArray(grievances) ? grievances : []).filter(g => g.priority === level.id && g.status !== 'resolved' && g.status !== 'rejected');
                                                return (
                                                    <div key={level.id} className={`p-6 bg-black/20 backdrop-blur-sm border ${level.border} rounded-[2rem] hover:bg-white/5 transition-all group/card relative overflow-hidden`}>
                                                        <div className={`absolute top-0 right-0 w-24 h-24 ${level.bg} rounded-full blur-2xl -translate-y-10 translate-x-10 group-hover/card:scale-150 transition-transform`} />

                                                        <div className="flex items-center justify-between mb-6 relative z-10">
                                                            <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${level.bg} border ${level.border}`}>
                                                                <level.icon className={`h-3 w-3 ${level.color}`} />
                                                                <span className={`text-[9px] font-black ${level.color} uppercase tracking-widest`}>{level.label}</span>
                                                            </div>
                                                            <span className={`text-2xl font-black ${level.color}`}>{cluster.length}</span>
                                                        </div>

                                                        {cluster.length > 0 ? (
                                                            <div className="space-y-3 relative z-10 min-h-[140px]">
                                                                {cluster.slice(0, 3).map(g => (
                                                                    <div key={g.id} className="p-3 bg-[#060810]/50 border border-white/5 rounded-xl hover:border-white/10 transition-colors cursor-pointer group/item">
                                                                        <div className="flex justify-between items-start mb-1">
                                                                            <span className="text-[8px] font-black text-white/30 uppercase tracking-wider">{g.id}</span>
                                                                            <span className={`w-1.5 h-1.5 rounded-full ${level.id === 'critical' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-ping' : level.id === 'high' ? 'bg-orange-500' : level.id === 'medium' ? 'bg-amber-400' : 'bg-slate-400'}`} />
                                                                        </div>
                                                                        <p className="text-[10px] font-bold text-white/70 line-clamp-2 leading-relaxed group-hover/item:text-white transition-colors">
                                                                            {g.title}
                                                                        </p>
                                                                    </div>
                                                                ))}
                                                                {cluster.length > 3 && (
                                                                    <div className="flex items-center justify-center pt-2">
                                                                        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest group-hover/card:text-white/40 transition-colors">
                                                                            + {cluster.length - 3} Hidden Nodes
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="min-h-[140px] flex flex-col items-center justify-center text-center opacity-30 relative z-10">
                                                                <level.icon className="h-8 w-8 mb-2" />
                                                                <span className="text-[9px] font-black uppercase tracking-widest">No signals</span>
                                                            </div>
                                                        )}

                                                        <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2 relative z-10">
                                                            <Sparkles className={`h-3 w-3 ${level.color} opacity-50`} />
                                                            <span className="text-[8px] font-bold text-white/30 uppercase tracking-wider truncate">
                                                                {level.id === 'critical' ? 'Immediate escalation protocols active' :
                                                                    level.id === 'high' ? 'Resource density localized' :
                                                                        level.id === 'medium' ? 'Standard routing engaged' : 'Passive monitoring'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic">Tactical Command Center</h3>
                                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] mt-2">Deploy and track Departmental Response Teams to resolve civic nodes</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="group relative">
                                            <div className="flex flex-col gap-2">
                                                <Button
                                                    onClick={exportToCSV}
                                                    className="h-14 bg-[#0c101b] hover:bg-white/10 text-white/80 text-[10px] font-black uppercase tracking-widest rounded-2xl px-8 border border-white/5 transition-all flex items-center gap-3 relative overflow-hidden"
                                                >
                                                    <Download className="h-4 w-4" /> System Archive
                                                    <span className="ml-2 px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-md text-[8px]">
                                                        {deptGrievances.length} NODES
                                                    </span>
                                                </Button>
                                                <div className="flex items-center justify-end gap-2 px-2">
                                                    <div className="flex gap-0.5">
                                                        {[1, 2, 3].map(i => (
                                                            <motion.div
                                                                key={i}
                                                                animate={{ opacity: [0.2, 1, 0.2] }}
                                                                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                                                                className="w-1 h-1 rounded-full bg-emerald-500"
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className="text-[7px] font-black text-white/20 uppercase tracking-widest">Live Auto-Sync Active</span>
                                                </div>
                                            </div>
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 p-4 bg-black border border-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none text-[8px] font-black text-white/40 leading-relaxed uppercase shadow-2xl">
                                                Package all telemetry logs, node transits, and mission reports into a secure immutable export. Automatically synchronized with new registry entries.
                                            </div>
                                        </div>
                                        <div className="group relative">
                                            <Button
                                                onClick={() => setShowDeploymentModal(true)}
                                                className="h-14 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl px-8 shadow-lg shadow-indigo-600/30 border border-indigo-400/20 flex items-center gap-3"
                                            >
                                                <PlusCircle className="h-5 w-5" /> Unit Deployment
                                            </Button>
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 p-4 bg-black border border-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none text-[8px] font-black text-white/40 leading-relaxed uppercase shadow-2xl">
                                                Initialize a multi-node personnel team or autonomous asset unit into the active deployment queue.
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                                    {activeResources.map((res, idx) => (
                                        <motion.div
                                            key={res.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="bg-[#0c101b] border border-white/5 rounded-[2.5rem] p-8 group hover:border-indigo-500/30 transition-all duration-500 relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full blur-3xl -translate-y-10 translate-x-10 group-hover:bg-indigo-600/10 transition-colors" />
                                            {res.status === 'deployed' && (
                                                <div className="absolute top-4 left-4 flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                                </div>
                                            )}

                                            <div className="flex items-start justify-between relative z-10 mb-8">
                                                <div className="flex items-center gap-5">
                                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border border-white/5 flex items-center justify-center text-indigo-400 shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                                                        {res.type === 'unit' ? <Users className="h-7 w-7" /> : res.type === 'tech' ? <Cpu className="h-7 w-7" /> : <Building2 className="h-7 w-7" />}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xl font-black text-white uppercase tracking-tight">{res.name}</h4>
                                                        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mt-0.5">{res.type} sequence</p>
                                                    </div>
                                                </div>
                                                <div className={`px-4 py-1.5 rounded-xl border ${res.status === 'available' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                                                    res.status === 'deployed' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' :
                                                        'bg-amber-500/10 border-amber-500/20 text-amber-500'
                                                    } text-[9px] font-black uppercase tracking-widest`}>
                                                    {res.status}
                                                </div>
                                            </div>

                                            <div className="space-y-6 relative z-10">
                                                <div className="p-5 bg-[#060810]/50 rounded-[1.5rem] border border-white/5 space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <MapPin className="h-4 w-4 text-white/20" />
                                                            <span className="text-[10px] font-black text-white/60 uppercase">{res.location}</span>
                                                        </div>
                                                        <span className="text-[9px] font-bold text-white/20 uppercase">{res.contact}</span>
                                                    </div>
                                                    <p className="text-xs font-bold text-white/80 leading-relaxed border-t border-white/5 pt-4">
                                                        <span className="text-indigo-400 uppercase text-[9px] font-black mr-2">Assigned:</span>
                                                        {res.task}
                                                    </p>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-3">
                                                        <div className="flex justify-between items-center px-1">
                                                            <span className="text-[9px] font-black uppercase text-white/20">Operational Load</span>
                                                            <span className={`text-[10px] font-black ${res.load > 90 ? 'text-rose-500' : 'text-indigo-400'}`}>{res.load}%</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-[#060810] rounded-full overflow-hidden p-0.5 border border-white/5">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${res.load}%` }}
                                                                className={`h-full rounded-full ${res.load > 90 ? 'bg-rose-600' : 'bg-indigo-500'} shadow-[0_0_8px_rgba(99,102,241,0.3)]`}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div className="flex justify-between items-center px-1">
                                                            <span className="text-[9px] font-black uppercase text-white/20">Efficiency</span>
                                                            <span className="text-[10px] font-black text-emerald-400">{res.efficiency}%</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-[#060810] rounded-full overflow-hidden p-0.5 border border-white/5">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${res.efficiency}%` }}
                                                                className="h-full rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-end">
                                                <button className="text-[10px] font-black text-white/20 uppercase tracking-widest hover:text-white transition-colors">Modify Assignment</button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.section>
                        )}

                        {currentView === "geospatial" && (
                            <motion.section
                                key="geospatial"
                                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="bg-[#0c101b] border border-white/5 rounded-[4rem] p-10 h-[750px] relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(79,70,229,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.1)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
                                <div className="relative z-10 h-full flex flex-col">
                                    <div className="flex justify-between items-start mb-10">
                                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic">Strategic Incident Heatmap</h3>
                                        <p className="text-xs font-bold text-white/20 uppercase tracking-[0.3em] mt-2">Active grievance density analysis across sectors</p>
                                        <div className="flex gap-4">
                                            <div className="flex flex-col gap-2">
                                                <Button
                                                    onClick={exportToCSV}
                                                    className="h-14 bg-indigo-600 hover:bg-indigo-500 rounded-2xl px-8 flex items-center gap-3 shadow-lg shadow-indigo-600/30 border border-indigo-400/20 group relative overflow-hidden"
                                                >
                                                    {isAutoSaving && (
                                                        <motion.div
                                                            initial={{ x: "-100%" }}
                                                            animate={{ x: "100%" }}
                                                            transition={{ duration: 0.8, repeat: Infinity }}
                                                            className="absolute inset-0 bg-white/20 skew-x-12"
                                                        />
                                                    )}
                                                    <span className="text-[10px] font-black uppercase tracking-widest relative z-10">Export Activity Log</span>
                                                    <Download className="h-4 w-4 group-hover:translate-y-0.5 transition-transform relative z-10" />
                                                </Button>
                                                <div className="flex items-center justify-end gap-2 px-2">
                                                    <span className={`w-1 h-1 rounded-full ${isAutoSaving ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                                                    <span className="text-[7px] font-black text-white/30 uppercase tracking-widest">
                                                        {isAutoSaving ? 'Syncing...' : `Registry Synced: ${lastSyncTime}`}
                                                    </span>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                onClick={() => setShowDeploymentModal(true)}
                                                className="h-14 bg-white/5 hover:bg-white/10 px-6 rounded-2xl flex items-center gap-3 border border-white/5 transition-all"
                                            >
                                                <PlusCircle className="h-5 w-5 text-indigo-400" />
                                                <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Deploy New Unit</span>
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="flex-1 relative flex gap-8">
                                        <div className="flex-1 relative bg-[#060810] border border-indigo-500/20 rounded-[4rem] overflow-hidden shadow-[0_0_100px_rgba(79,70,229,0.1)]">
                                            <MapContainer
                                                center={[28.6139, 77.209]}
                                                zoom={11}
                                                style={{ height: "100%", width: "100%", background: "#060810", zIndex: 1 }}
                                            >
                                                <TileLayer
                                                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                                                />
                                                <MapController selectedCoords={selectedGrievance?.coordinates} />

                                                {/* Neural Density Heatmap Layer */}
                                                {(Array.isArray(grievances) ? grievances : []).filter(g => g.coordinates).map((g, i) => (
                                                    <Circle
                                                        key={`heat-${g.id}`}
                                                        center={[g.coordinates!.latitude, g.coordinates!.longitude]}
                                                        radius={1000}
                                                        pathOptions={{
                                                            fillColor: g.priority === 'critical' ? '#f43f5e' : '#6366f1',
                                                            fillOpacity: 0.08,
                                                            stroke: false,
                                                            className: 'blur-[20px]'
                                                        }}
                                                    />
                                                ))}

                                                {/* Active Strategic Markers */}
                                                {(Array.isArray(grievances) ? grievances : []).filter(g => g.coordinates).map((g) => (
                                                    <LayerGroup key={g.id}>
                                                        <Marker
                                                            position={[g.coordinates!.latitude, g.coordinates!.longitude]}
                                                            icon={L.divIcon({
                                                                className: 'custom-div-icon',
                                                                html: `
                                                                    <div class="relative flex items-center justify-center">
                                                                        <div class="absolute w-12 h-12 rounded-full border border-indigo-500/20 animate-ping opacity-20"></div>
                                                                        <div class="absolute w-8 h-8 rounded-full border border-indigo-400/30 animate-pulse"></div>
                                                                        <div class="absolute w-[100px] h-px bg-indigo-500/10 rotate-45"></div>
                                                                        <div class="absolute w-[100px] h-px bg-indigo-500/10 -rotate-45"></div>
                                                                        <div class="w-6 h-6 rounded-full border-[3px] border-[#060810] shadow-[0_0_20px_rgba(79,70,221,0.4)] ${g.priority === 'critical' ? 'bg-rose-500' : 'bg-indigo-500'} relative z-10">
                                                                            <div class="absolute inset-0 rounded-full animate-pulse bg-white/20"></div>
                                                                        </div>
                                                                    </div>
                                                                `,
                                                                iconSize: [24, 24],
                                                                iconAnchor: [12, 12]
                                                            })}
                                                        >
                                                            <Popup className="auth-map-popup">
                                                                <div className="p-2 min-w-[150px]">
                                                                    <p className="text-[10px] font-black text-indigo-400 uppercase mb-1">{g.category}</p>
                                                                    <p className="text-sm font-bold text-slate-800 leading-tight mb-2">{g.title}</p>
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${priorityConfig[g.priority].bg} ${priorityConfig[g.priority].color}`}>
                                                                            {g.priority}
                                                                        </span>
                                                                        <span className="text-[8px] text-slate-500 font-bold">{g.district}</span>
                                                                    </div>
                                                                    <Button
                                                                        size="sm"
                                                                        className="w-full h-8 text-[9px] font-black uppercase tracking-widest bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-lg shadow-indigo-600/20"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setSelectedGrievanceId(g.id);
                                                                            // Instead of switching view, we now show a details overlay
                                                                            // which is globally accessible
                                                                        }}
                                                                    >
                                                                        Inspect Signal
                                                                    </Button>
                                                                </div>
                                                            </Popup>
                                                        </Marker>

                                                        {g.accuracy && (
                                                            <>
                                                                <Circle
                                                                    center={[g.coordinates!.latitude, g.coordinates!.longitude]}
                                                                    radius={g.accuracy}
                                                                    pathOptions={{
                                                                        color: g.priority === 'critical' ? '#f43f5e' : '#6366f1',
                                                                        fillColor: g.priority === 'critical' ? '#f43f5e' : '#6366f1',
                                                                        fillOpacity: 0.05,
                                                                        weight: 1,
                                                                        dashArray: '5, 10'
                                                                    }}
                                                                />
                                                                {/* Precision Detailing Lines */}
                                                                <Polyline
                                                                    positions={[
                                                                        [g.coordinates!.latitude - 0.002, g.coordinates!.longitude],
                                                                        [g.coordinates!.latitude + 0.002, g.coordinates!.longitude]
                                                                    ]}
                                                                    pathOptions={{ color: '#6366f1', weight: 0.5, opacity: 0.2 }}
                                                                />
                                                                <Polyline
                                                                    positions={[
                                                                        [g.coordinates!.latitude, g.coordinates!.longitude - 0.004],
                                                                        [g.coordinates!.latitude, g.coordinates!.longitude + 0.004]
                                                                    ]}
                                                                    pathOptions={{ color: '#6366f1', weight: 0.5, opacity: 0.2 }}
                                                                />
                                                            </>
                                                        )}
                                                    </LayerGroup>
                                                ))}
                                            </MapContainer>

                                            <div className="absolute top-10 right-10 z-[1000] flex flex-col gap-4">
                                                <div className="bg-[#0c101b]/80 backdrop-blur-xl border border-white/10 p-5 rounded-3xl shadow-2xl">
                                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-3">Sync Status</p>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
                                                        <span className="text-[11px] font-black text-white uppercase tracking-tighter italic">Live Telemetry</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <motion.div
                                                animate={{ top: ['0%', '100%', '0%'] }}
                                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                                className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent z-10"
                                            />
                                        </div>

                                        {/* DISTRICT INTENSITY SIDEBAR */}
                                        <div className="w-80 bg-[#0c101b] border border-white/5 rounded-[3rem] p-8 space-y-8 flex flex-col">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">District Intensity</h4>
                                                <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[8px] font-black text-indigo-400 uppercase">Total View</span>
                                            </div>
                                            <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
                                                {Array.from(new Set((Array.isArray(grievances) ? grievances : []).filter(g => g.district).map(g => g.district)))
                                                    .map(district => {
                                                        const allG = Array.isArray(grievances) ? grievances : [];
                                                        const count = allG.filter(g => g.district === district).length;
                                                        const criticalCount = allG.filter(g => g.district === district && g.priority === 'critical').length;
                                                        const resolvedCount = allG.filter(g => g.district === district && g.status === 'resolved').length;
                                                        const intensity = (count / (allG.length || 1)) * 100;

                                                        return (
                                                            <div key={district} className="p-5 bg-white/2 border border-white/5 rounded-2xl hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => {
                                                                const firstInDist = allG.find(g => g.district === district);
                                                                if (firstInDist) setSelectedGrievanceId(firstInDist.id);
                                                            }}>
                                                                <div className="flex justify-between items-start mb-3">
                                                                    <div>
                                                                        <p className="text-xs font-black text-white uppercase group-hover:text-indigo-400 transition-colors">{district}</p>
                                                                        <p className="text-[8px] font-bold text-white/20 uppercase mt-0.5">{criticalCount} Critical • {resolvedCount} Resolved</p>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <span className="text-[10px] font-black text-indigo-400 block">{count}</span>
                                                                        <span className="text-[8px] font-black text-white/10 uppercase tracking-tighter">Nodes</span>
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-1.5">
                                                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                                        <motion.div
                                                                            initial={{ width: 0 }}
                                                                            animate={{ width: `${Math.max(10, intensity * 2)}%` }}
                                                                            className={`h-full ${criticalCount > 0 ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]'}`}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                            <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl text-[9px] font-bold text-white/40 leading-relaxed">
                                                Visualizing real-time coordinate approximations based on district-level intensity data.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.section>
                        )}


                        {currentView === "analytics" && (
                            <motion.section
                                key="analytics"
                                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="space-y-10"
                            >
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 h-[500px]">
                                    <div className="bg-[#0c101b] border border-white/5 rounded-[3rem] p-10 flex flex-col">
                                        <div className="flex items-center justify-between mb-10">
                                            <div>
                                                <h3 className="text-xl font-black text-white uppercase tracking-widest">Case Velocity</h3>
                                                <p className="text-[8px] font-black text-indigo-400 uppercase mt-1">Filtering: {selectedAnalyticsDept}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                {[
                                                    { id: "Global", icon: Globe, label: "Global" },
                                                    { id: "Roads & Infrastructure", icon: Car, label: "Infrastructure" },
                                                    { id: "Sanitation", icon: Trash2, label: "Sanitation" },
                                                    { id: "Water Supply", icon: Droplet, label: "Water" },
                                                    { id: "Electricity", icon: Zap, label: "Power" },
                                                    { id: "Public Health", icon: HeartPulse, label: "Health" },
                                                    { id: "Other", icon: Layers, label: "Other" },
                                                ].map(dept => (
                                                    <button
                                                        key={dept.id}
                                                        onClick={() => setSelectedAnalyticsDept(dept.id)}
                                                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all group relative ${selectedAnalyticsDept === dept.id
                                                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 border border-indigo-400/20"
                                                            : "bg-white/5 text-white/30 hover:bg-white/10 border border-transparent"
                                                            }`}
                                                    >
                                                        <dept.icon className="h-5 w-5" />
                                                        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black border border-white/10 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                                            <span className="text-[7px] font-black uppercase text-white whitespace-nowrap">{dept.label}</span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex-1 w-full min-h-0">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={analyticsData}>
                                                    <defs>
                                                        <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                                    <XAxis dataKey="name" stroke="#ffffff20" fontSize={10} axisLine={false} tickLine={false} />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: '#0c101b', border: '1px solid #ffffff10', borderRadius: '1rem' }}
                                                        itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                                    />
                                                    <Area type="monotone" dataKey="cases" stroke="#6366f1" fillOpacity={1} fill="url(#colorCases)" strokeWidth={3} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    <div className="bg-[#0c101b] border border-white/5 rounded-[3rem] p-10 flex flex-col">
                                        <h3 className="text-xl font-black text-white uppercase tracking-widest mb-10">Resolution Quality</h3>
                                        <div className="grid grid-cols-2 gap-6 mb-10">
                                            {[
                                                { l: "Citizen Feedback", v: `${avgCitizenRating}/5.0`, c: "indigo" },
                                                { l: "SLA Adherence", v: "92%", c: "emerald" },
                                                { l: "Resolution Efficiency", v: "Calculated", c: "blue" },
                                                { l: "Recursive Rate", v: "1.2%", c: "rose" },
                                            ].map(item => (
                                                <div key={item.l} className="bg-white/2 border border-white/5 p-6 rounded-3xl group hover:bg-white/5 transition-all">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <p className="text-[10px] font-black text-white/20 uppercase">{item.l}</p>
                                                        <div className="group/tip relative">
                                                            <Info className="h-3 w-3 text-white/10 hover:text-indigo-400 cursor-help" />
                                                            <div className="absolute bottom-full right-0 mb-3 w-48 p-4 bg-black border border-white/10 rounded-2xl opacity-0 group-hover/tip:opacity-100 transition-opacity z-50 pointer-events-none text-[8px] font-bold text-white/40 leading-relaxed uppercase shadow-2xl">
                                                                {item.l === "Resolution Efficiency"
                                                                    ? "Calculated as (Resolved Cases / Total Registered). Measures the throughput of the current department."
                                                                    : item.l === "Citizen Feedback"
                                                                        ? "Live average score synced from verified citizen feedback ratings across all resolved cases."
                                                                        : "Internal telemetry metric monitoring system synchronicity and node stability factors."}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <p className={`text-2xl font-black text-${item.c}-500 tracking-tighter`}>{item.v === "Calculated" ? `${resolutionRate}%` : item.v}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex-1 bg-white/5 rounded-3xl p-8 border border-white/5 flex flex-col justify-center relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="flex items-center justify-between relative z-10">
                                                <div>
                                                    <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2">Registry Health Index</h4>
                                                    <div className="flex items-baseline gap-2">
                                                        <p className="text-4xl font-black text-white tracking-tighter">{(resolutionRate * 0.95).toFixed(1)}</p>
                                                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Stable Pulse</span>
                                                    </div>
                                                    <p className="text-[10px] font-bold text-white/20 mt-3 flex items-center gap-2">
                                                        <Activity className="h-3 w-3 text-indigo-400" /> Linked to {deptGrievances.length} Active Node Nodes
                                                    </p>
                                                </div>
                                                <div className="w-20 h-20 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin transition-all relative">
                                                    <div className="absolute inset-2 rounded-full border-2 border-emerald-500/20 border-b-emerald-500 animate-[spin_3s_linear_infinite]" />
                                                    <Brain className="absolute inset-0 m-auto h-6 w-6 text-indigo-400" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Additional Analytics Layer */}
                                <div className="bg-[#0c101b] border border-white/5 rounded-[3rem] p-10 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-10">
                                            <div>
                                                <h3 className="text-xl font-black text-white uppercase tracking-widest">Departmental Synchronicity</h3>
                                                <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mt-2">Workload vs Resolution Efficiency Pulse</p>
                                            </div>
                                            <div className="flex gap-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                                    <span className="text-[10px] font-black text-white/40 uppercase">Workload</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                    <span className="text-[10px] font-black text-white/40 uppercase">Efficiency</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="h-[350px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={departmentStats.slice(0, 5).map(d => ({
                                                    name: d.name.slice(0, 8),
                                                    load: d.load,
                                                    efficiency: d.efficiency
                                                }))}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                                    <XAxis dataKey="name" stroke="#ffffff20" fontSize={10} axisLine={false} tickLine={false} fontVariant="black" />
                                                    <Tooltip
                                                        cursor={{ fill: '#ffffff05' }}
                                                        contentStyle={{ backgroundColor: '#0c101b', border: '1px solid #ffffff10', borderRadius: '1.5rem', padding: '1.5rem' }}
                                                        itemStyle={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}
                                                    />
                                                    <Bar dataKey="load" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={40} />
                                                    <Bar dataKey="efficiency" fill="#10b981" radius={[8, 8, 0, 0]} barSize={40} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </motion.section>
                        )}

                        {currentView === "insights" && (
                            <motion.section
                                key="insights"
                                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="space-y-10"
                            >
                                {/* Section Header */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
                                            <span className="text-indigo-600">{user.department || 'Department'}</span> Insight
                                        </h3>
                                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Comprehensive departmental performance analysis</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Live Data</span>
                                        </div>
                                    </div>
                                </div>

                                {/* KPI Summary Cards */}
                                {(() => {
                                    const myDept = user.department || '';
                                    const myGrievances = deptGrievances;
                                    const totalDept = myGrievances.length;
                                    const resolvedDept = myGrievances.filter(g => g.status === 'resolved').length;
                                    const pendingDept = myGrievances.filter(g => g.status === 'pending' || g.status === 'submitted').length;
                                    const inProgressDept = myGrievances.filter(g => g.status === 'in-progress').length;
                                    const criticalDept = myGrievances.filter(g => g.priority === 'critical' && g.status !== 'resolved').length;
                                    const highDept = myGrievances.filter(g => g.priority === 'high' && g.status !== 'resolved').length;
                                    const deptResRate = totalDept > 0 ? Math.round((resolvedDept / totalDept) * 100) : 0;

                                    // Avg resolution time
                                    const resolvedWithTime = myGrievances.filter(g => g.resolvedAt && g.createdAt);
                                    const avgResDays = resolvedWithTime.length > 0
                                        ? (resolvedWithTime.reduce((sum, g) => sum + (new Date(g.resolvedAt!).getTime() - new Date(g.createdAt).getTime()), 0) / resolvedWithTime.length / (1000 * 60 * 60 * 24)).toFixed(1)
                                        : 'N/A';

                                    // Citizen satisfaction
                                    const ratedGrievances = myGrievances.filter(g => g.rating !== undefined && g.rating !== null && g.rating > 0);
                                    const avgRating = ratedGrievances.length > 0
                                        ? (ratedGrievances.reduce((sum, g) => sum + (g.rating || 0), 0) / ratedGrievances.length).toFixed(1)
                                        : 'N/A';

                                    // Sentiment breakdown
                                    const sentiments = { positive: 0, neutral: 0, negative: 0, critical: 0 };
                                    myGrievances.forEach(g => { if (g.sentiment && sentiments.hasOwnProperty(g.sentiment)) sentiments[g.sentiment as keyof typeof sentiments]++; });
                                    const sentimentTotal = Object.values(sentiments).reduce((a, b) => a + b, 0) || 1;

                                    // Priority breakdown
                                    const priorities = { low: 0, medium: 0, high: 0, critical: 0 };
                                    myGrievances.forEach(g => { if (g.priority && priorities.hasOwnProperty(g.priority)) priorities[g.priority as keyof typeof priorities]++; });

                                    // Weekly trend for this department
                                    const weeklyTrend = [...Array(7)].map((_, i) => {
                                        const d = new Date(); d.setDate(d.getDate() - i);
                                        const dateStr = d.toISOString().split('T')[0];
                                        return {
                                            name: d.toLocaleDateString([], { weekday: 'short' }),
                                            date: dateStr,
                                            incoming: myGrievances.filter(g => new Date(g.createdAt).toISOString().split('T')[0] === dateStr).length,
                                            resolved: myGrievances.filter(g => g.resolvedAt && new Date(g.resolvedAt).toISOString().split('T')[0] === dateStr).length
                                        };
                                    }).reverse();

                                    // Top categories within department
                                    const catMap: Record<string, number> = {};
                                    myGrievances.forEach(g => { catMap[g.category] = (catMap[g.category] || 0) + 1; });
                                    const topCategories = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

                                    // Districts served
                                    const districts = Array.from(new Set(myGrievances.filter(g => g.district).map(g => g.district)));

                                    return (
                                        <>
                                            {/* Top KPI Row */}
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                                {[
                                                    { label: 'Total Cases', value: totalDept, sub: 'Department Load', icon: ClipboardList, color: 'indigo', glow: 'shadow-indigo-500/10' },
                                                    { label: 'Resolution Rate', value: `${deptResRate}%`, sub: `${resolvedDept} of ${totalDept} resolved`, icon: CheckCircle2, color: 'emerald', glow: 'shadow-emerald-500/10' },
                                                    { label: 'Avg Resolution', value: avgResDays === 'N/A' ? 'N/A' : `${avgResDays}d`, sub: 'Average days to close', icon: Clock, color: 'blue', glow: 'shadow-blue-500/10' },
                                                    { label: 'Citizen Rating', value: avgRating === 'N/A' ? 'N/A' : `${avgRating}/5`, sub: `${ratedGrievances.length} ratings received`, icon: Star, color: 'amber', glow: 'shadow-amber-500/10' },
                                                ].map((kpi, i) => (
                                                    <motion.div
                                                        key={kpi.label}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: i * 0.1 }}
                                                        className={`bg-white p-8 rounded-[2.5rem] border border-slate-200 hover:border-${kpi.color}-300 transition-all duration-500 hover:-translate-y-1 ${kpi.glow} group`}
                                                    >
                                                        <div className="flex items-center justify-between mb-4">
                                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{kpi.label}</p>
                                                            <div className={`w-10 h-10 rounded-xl bg-${kpi.color}-500/10 flex items-center justify-center text-${kpi.color}-500 group-hover:scale-110 transition-transform`}>
                                                                <kpi.icon className="h-5 w-5" />
                                                            </div>
                                                        </div>
                                                        <p className={`text-4xl font-black text-slate-900 tracking-tighter`}>{kpi.value}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider">{kpi.sub}</p>
                                                    </motion.div>
                                                ))}
                                            </div>

                                            {/* Status Breakdown + Active Alerts */}
                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                                <div className="lg:col-span-1 bg-white border border-slate-200 rounded-[2.5rem] p-8">
                                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-3">
                                                        <Activity className="h-4 w-4 text-indigo-500" /> Status Breakdown
                                                    </h4>
                                                    <div className="space-y-5">
                                                        {[
                                                            { label: 'Pending / New', count: pendingDept, color: 'amber', pct: totalDept > 0 ? Math.round((pendingDept / totalDept) * 100) : 0 },
                                                            { label: 'In Progress', count: inProgressDept, color: 'indigo', pct: totalDept > 0 ? Math.round((inProgressDept / totalDept) * 100) : 0 },
                                                            { label: 'Resolved', count: resolvedDept, color: 'emerald', pct: totalDept > 0 ? Math.round((resolvedDept / totalDept) * 100) : 0 },
                                                            { label: 'Rejected', count: myGrievances.filter(g => g.status === 'rejected').length, color: 'rose', pct: totalDept > 0 ? Math.round((myGrievances.filter(g => g.status === 'rejected').length / totalDept) * 100) : 0 },
                                                        ].map(item => (
                                                            <div key={item.label}>
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <span className="text-xs font-bold text-slate-600">{item.label}</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`text-xs font-black text-${item.color}-600`}>{item.count}</span>
                                                                        <span className="text-[9px] font-bold text-slate-400">({item.pct}%)</span>
                                                                    </div>
                                                                </div>
                                                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                                    <motion.div
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: `${item.pct}%` }}
                                                                        transition={{ duration: 1, delay: 0.2 }}
                                                                        className={`h-full bg-${item.color}-500 rounded-full`}
                                                                    />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Active Alerts */}
                                                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[2.5rem] p-8">
                                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-3">
                                                        <ShieldAlert className="h-4 w-4 text-rose-500" /> Active Alerts
                                                    </h4>
                                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                                        <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl">
                                                            <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Critical Open</p>
                                                            <p className="text-3xl font-black text-rose-600">{criticalDept}</p>
                                                            <p className="text-[9px] font-bold text-rose-400 mt-1">Require immediate attention</p>
                                                        </div>
                                                        <div className="p-5 bg-orange-50 border border-orange-200 rounded-2xl">
                                                            <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">High Priority</p>
                                                            <p className="text-3xl font-black text-orange-600">{highDept}</p>
                                                            <p className="text-[9px] font-bold text-orange-400 mt-1">Escalation candidates</p>
                                                        </div>
                                                    </div>
                                                    {/* List urgent cases */}
                                                    <div className="space-y-3 max-h-[200px] overflow-y-auto custom-scrollbar">
                                                        {myGrievances
                                                            .filter(g => (g.priority === 'critical' || g.priority === 'high') && g.status !== 'resolved' && g.status !== 'rejected')
                                                            .slice(0, 5)
                                                            .map(g => (
                                                                <div key={g.id} className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-200 transition-colors cursor-pointer" onClick={() => { setSelectedGrievanceId(g.id); setCurrentView('matrix'); }}>
                                                                    <div className={`w-3 h-3 rounded-full ${g.priority === 'critical' ? 'bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'bg-orange-500'}`} />
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-xs font-black text-slate-800 truncate uppercase">{g.title}</p>
                                                                        <p className="text-[9px] font-bold text-slate-400">{g.id} • {new Date(g.createdAt).toLocaleDateString()}</p>
                                                                    </div>
                                                                    <ChevronRight className="h-4 w-4 text-slate-300" />
                                                                </div>
                                                            ))}
                                                        {myGrievances.filter(g => (g.priority === 'critical' || g.priority === 'high') && g.status !== 'resolved' && g.status !== 'rejected').length === 0 && (
                                                            <div className="py-8 text-center opacity-40">
                                                                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                                                                <p className="text-xs font-black uppercase tracking-widest text-slate-500">All clear — No urgent alerts</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Weekly Trend Chart */}
                                            <div className="bg-[#0c101b] border border-white/5 rounded-[3rem] p-10">
                                                <div className="flex items-center justify-between mb-8">
                                                    <div>
                                                        <h4 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                                                            <TrendingUp className="h-5 w-5 text-indigo-400" /> Weekly Case Flow
                                                        </h4>
                                                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mt-1">Incoming vs Resolved — {myDept}</p>
                                                    </div>
                                                    <div className="flex gap-6">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-3 h-1.5 rounded-full bg-indigo-500" />
                                                            <span className="text-[10px] font-black text-white/40 uppercase">Incoming</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-3 h-1.5 rounded-full bg-emerald-500" />
                                                            <span className="text-[10px] font-black text-white/40 uppercase">Resolved</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="h-[280px] w-full">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <AreaChart data={weeklyTrend}>
                                                            <defs>
                                                                <linearGradient id="deptIncoming" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                                </linearGradient>
                                                                <linearGradient id="deptResolved" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                                </linearGradient>
                                                            </defs>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                                            <XAxis dataKey="name" stroke="#ffffff20" fontSize={10} axisLine={false} tickLine={false} />
                                                            <YAxis stroke="#ffffff20" fontSize={10} axisLine={false} tickLine={false} allowDecimals={false} />
                                                            <Tooltip
                                                                contentStyle={{ backgroundColor: '#0c101b', border: '1px solid #ffffff10', borderRadius: '1rem' }}
                                                                itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                                            />
                                                            <Area type="monotone" dataKey="incoming" stroke="#6366f1" fillOpacity={1} fill="url(#deptIncoming)" strokeWidth={3} />
                                                            <Area type="monotone" dataKey="resolved" stroke="#10b981" fillOpacity={1} fill="url(#deptResolved)" strokeWidth={3} />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>

                                            {/* Sentiment + Priority + Districts Grid */}
                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                                {/* Sentiment Analysis */}
                                                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8">
                                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-3">
                                                        <Heart className="h-4 w-4 text-rose-500" /> Sentiment Analysis
                                                    </h4>
                                                    <div className="space-y-4">
                                                        {[
                                                            { key: 'positive', label: 'Positive', color: 'emerald', icon: '😊' },
                                                            { key: 'neutral', label: 'Neutral', color: 'slate', icon: '😐' },
                                                            { key: 'negative', label: 'Negative', color: 'amber', icon: '😟' },
                                                            { key: 'critical', label: 'Critical', color: 'rose', icon: '🚨' },
                                                        ].map(s => {
                                                            const count = sentiments[s.key as keyof typeof sentiments];
                                                            const pct = Math.round((count / sentimentTotal) * 100);
                                                            return (
                                                                <div key={s.key}>
                                                                    <div className="flex items-center justify-between mb-1.5">
                                                                        <span className="text-xs font-bold text-slate-600 flex items-center gap-2">
                                                                            <span>{s.icon}</span> {s.label}
                                                                        </span>
                                                                        <span className={`text-xs font-black text-${s.color}-600`}>{count} ({pct}%)</span>
                                                                    </div>
                                                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                                        <motion.div
                                                                            initial={{ width: 0 }}
                                                                            animate={{ width: `${pct}%` }}
                                                                            transition={{ duration: 1, delay: 0.3 }}
                                                                            className={`h-full bg-${s.color}-500 rounded-full`}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Priority Distribution */}
                                                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8">
                                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-3">
                                                        <Target className="h-4 w-4 text-indigo-500" /> Priority Distribution
                                                    </h4>
                                                    <div className="space-y-5">
                                                        {[
                                                            { key: 'critical', label: 'Critical', color: 'rose' },
                                                            { key: 'high', label: 'High', color: 'orange' },
                                                            { key: 'medium', label: 'Medium', color: 'amber' },
                                                            { key: 'low', label: 'Low', color: 'slate' },
                                                        ].map(p => {
                                                            const count = priorities[p.key as keyof typeof priorities];
                                                            const pct = totalDept > 0 ? Math.round((count / totalDept) * 100) : 0;
                                                            return (
                                                                <div key={p.key} className="flex items-center gap-4">
                                                                    <div className={`w-10 h-10 rounded-xl bg-${p.color}-500/10 flex items-center justify-center`}>
                                                                        <span className={`text-lg font-black text-${p.color}-500`}>{count}</span>
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <div className="flex justify-between mb-1">
                                                                            <span className="text-xs font-bold text-slate-600">{p.label}</span>
                                                                            <span className="text-[10px] font-black text-slate-400">{pct}%</span>
                                                                        </div>
                                                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                                            <motion.div
                                                                                initial={{ width: 0 }}
                                                                                animate={{ width: `${pct}%` }}
                                                                                className={`h-full bg-${p.color}-500 rounded-full`}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Districts Served & Hot Zones */}
                                                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8">
                                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-3">
                                                        <MapPin className="h-4 w-4 text-blue-500" /> Districts Served
                                                    </h4>
                                                    <div className="space-y-3 max-h-[280px] overflow-y-auto custom-scrollbar">
                                                        {districts.length > 0 ? districts.map(dist => {
                                                            const distCount = myGrievances.filter(g => g.district === dist).length;
                                                            const distCrit = myGrievances.filter(g => g.district === dist && g.priority === 'critical').length;
                                                            return (
                                                                <div key={dist} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-blue-200 transition-all group">
                                                                    <div className="flex items-center justify-between">
                                                                        <div>
                                                                            <p className="text-xs font-black text-slate-800 uppercase group-hover:text-indigo-600 transition-colors">{dist}</p>
                                                                            <p className="text-[9px] font-bold text-slate-400 mt-0.5">{distCount} cases{distCrit > 0 ? ` • ${distCrit} critical` : ''}</p>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            {distCrit > 0 && <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
                                                                            <span className="text-sm font-black text-indigo-600">{distCount}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }) : (
                                                            <div className="py-8 text-center opacity-40">
                                                                <Globe className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                                                                <p className="text-xs font-black uppercase tracking-widest text-slate-500">No district data available</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Top Recurring Categories + Performance Summary */}
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                <div className="bg-[#0c101b] border border-white/5 rounded-[3rem] p-10">
                                                    <h4 className="text-lg font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3">
                                                        <Layers className="h-5 w-5 text-indigo-400" /> Top Case Categories
                                                    </h4>
                                                    <div className="space-y-6">
                                                        {topCategories.length > 0 ? topCategories.map(([cat, count], i) => {
                                                            const pct = totalDept > 0 ? Math.round((count / totalDept) * 100) : 0;
                                                            return (
                                                                <div key={cat}>
                                                                    <div className="flex justify-between items-center mb-2">
                                                                        <span className="text-[10px] font-black text-white/50 uppercase tracking-widest flex items-center gap-2">
                                                                            <span className="text-indigo-400 text-xs">#{i + 1}</span> {cat}
                                                                        </span>
                                                                        <span className="text-[10px] font-black text-white">{count} ({pct}%)</span>
                                                                    </div>
                                                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                                                        <motion.div
                                                                            initial={{ width: 0 }}
                                                                            whileInView={{ width: `${pct}%` }}
                                                                            className="h-full bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.4)]"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            );
                                                        }) : (
                                                            <div className="py-8 text-center opacity-30">
                                                                <p className="text-xs font-black text-white uppercase tracking-widest">No category data</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Performance Summary */}
                                                <div className="bg-[#0c101b] border border-white/5 rounded-[3rem] p-10 relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                                                    <h4 className="text-lg font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3 relative z-10">
                                                        <Brain className="h-5 w-5 text-indigo-400" /> Performance Summary
                                                    </h4>
                                                    <div className="space-y-8 relative z-10">
                                                        {/* Resolution Gauge */}
                                                        <div className="flex items-center gap-8">
                                                            <div className="relative w-28 h-28">
                                                                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                                                    <circle cx="50" cy="50" r="40" fill="none" stroke="#ffffff08" strokeWidth="8" />
                                                                    <circle cx="50" cy="50" r="40" fill="none" stroke={deptResRate >= 70 ? '#10b981' : deptResRate >= 40 ? '#f59e0b' : '#ef4444'} strokeWidth="8" strokeLinecap="round"
                                                                        strokeDasharray={`${deptResRate * 2.51} 251`}
                                                                    />
                                                                </svg>
                                                                <div className="absolute inset-0 flex items-center justify-center">
                                                                    <span className="text-2xl font-black text-white">{deptResRate}%</span>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Resolution Health</p>
                                                                <p className={`text-xl font-black ${deptResRate >= 70 ? 'text-emerald-400' : deptResRate >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>
                                                                    {deptResRate >= 70 ? 'Excellent' : deptResRate >= 40 ? 'Needs Improvement' : 'Critical'}
                                                                </p>
                                                                <p className="text-[9px] font-bold text-white/20 mt-1">Target: ≥ 70% resolution rate</p>
                                                            </div>
                                                        </div>

                                                        {/* Quick Stats */}
                                                        <div className="grid grid-cols-2 gap-4">
                                                            {[
                                                                { label: 'Backlog', value: pendingDept + inProgressDept, health: (pendingDept + inProgressDept) < 5 ? 'emerald' : 'amber' },
                                                                { label: 'Feedback Rate', value: ratedGrievances.length > 0 ? `${Math.round((ratedGrievances.length / Math.max(resolvedDept, 1)) * 100)}%` : '0%', health: 'indigo' },
                                                                { label: 'Active Districts', value: districts.length, health: 'blue' },
                                                                { label: 'Avg Urgency', value: totalDept > 0 ? (myGrievances.reduce((s, g) => s + (g.urgencyScore || 0), 0) / totalDept).toFixed(1) : '0', health: 'slate' },
                                                            ].map(qs => (
                                                                <div key={qs.label} className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                                                                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">{qs.label}</p>
                                                                    <p className={`text-2xl font-black text-${qs.health}-400`}>{qs.value}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </motion.section>
                        )}

                    </AnimatePresence>
                </div >
            </main >

            {/* Case Detail Slide-over Overhaul */}
            <AnimatePresence>
                {
                    selectedGrievance && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSelectedGrievanceId(null)}
                                className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
                            />
                            <motion.div
                                initial={{ x: "100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "100%" }}
                                transition={{ type: "spring", damping: 30, stiffness: 200 }}
                                className="fixed top-0 right-0 w-full max-w-2xl h-screen bg-[#0c101b] z-[101] shadow-2xl flex flex-col border-l border-white/10"
                            >
                                <div className="p-10 border-b border-white/5 bg-[#0e1425] flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className={`w-16 h-16 rounded-[1.5rem] bg-indigo-600/10 flex items-center justify-center border border-indigo-500/20`}>
                                            <Cpu className="h-8 w-8 text-indigo-400" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1.5">
                                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{selectedGrievance.id}</span>
                                                <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${statusConfig[selectedGrievance.status].bg} ${statusConfig[selectedGrievance.status].color} border border-indigo-500/20`}>
                                                    {selectedGrievance.status}
                                                </span>
                                            </div>
                                            <h3 className="text-3xl font-black text-white tracking-tighter uppercase">{selectedGrievance.title.slice(0, 30)}...</h3>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedGrievanceId(null)}
                                        className="w-14 h-14 rounded-2xl bg-white/5 text-white/40 hover:text-white hover:bg-rose-500/20 transition-all flex items-center justify-center border border-white/5"
                                    >
                                        <LogOut className="h-6 w-6 rotate-180" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-12 space-y-12 bg-[radial-gradient(circle_at_100%_0%,rgba(79,70,229,0.05),transparent_50%)]">
                                    {/* Visual Identity Section */}
                                    <div className="grid grid-cols-2 gap-8">
                                        {[
                                            { l: "SENDER NODE", v: selectedGrievance.citizenName, i: User },
                                            { l: "DETECTION TIME", v: new Date(selectedGrievance.createdAt).toLocaleTimeString(), i: Clock },
                                            { l: "GEO COORDINATES", v: `${selectedGrievance.location}, ${selectedGrievance.district}`, i: MapPin },
                                            { l: "SENTIMENT PULSE", v: selectedGrievance.sentiment.toUpperCase(), i: Activity },
                                        ].map(stat => (
                                            <div key={stat.l} className="space-y-3">
                                                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.25em]">{stat.l}</p>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-indigo-400 border border-white/5">
                                                        <stat.i className="h-4 w-4" />
                                                    </div>
                                                    <p className="text-sm font-black text-white uppercase tracking-tight">{stat.v}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.25em]">Packet Contents</p>
                                        <div className="p-10 bg-[#060810] border border-white/5 rounded-[3rem] text-sm text-white/60 leading-relaxed font-bold tracking-tight italic">
                                            "{selectedGrievance.description}"
                                        </div>
                                    </div>

                                    {/* AI Keyword Cloud */}
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.25em] mb-4">Neural Extraction</p>
                                        <div className="flex flex-wrap gap-3">
                                            {selectedGrievance.keywords.map(k => (
                                                <span key={k} className="px-5 py-2.5 bg-indigo-600/5 hover:bg-indigo-600/10 transition-colors border border-indigo-500/10 rounded-2xl text-[11px] font-black text-indigo-400 uppercase tracking-widest cursor-default">
                                                    #{k}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* CONTROL INTERFACE — Full Status Management */}
                                    <div className="p-10 bg-[#0e1425] border border-indigo-500/20 rounded-[3.5rem] space-y-8 shadow-2xl shadow-indigo-500/10 ring-1 ring-indigo-500/10">
                                        <Label className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em] flex items-center gap-3">
                                            <Zap className="h-5 w-5 text-indigo-500" /> Control Interface
                                        </Label>

                                        <div className="grid grid-cols-2 gap-3">
                                            <Button
                                                onClick={() => handleUpdateStatus('pending')}
                                                disabled={isUpdating}
                                                className={`py-6 font-black uppercase tracking-widest rounded-2xl shadow-lg text-[10px] transition-all relative ${selectedGrievance.status === 'pending' || selectedGrievance.status === 'submitted'
                                                    ? 'bg-amber-500 ring-4 ring-amber-500/30 shadow-amber-500/20 text-white'
                                                    : 'bg-amber-600/20 hover:bg-amber-500 text-amber-400 hover:text-white border border-amber-500/20'
                                                    }`}
                                            >
                                                {isUpdating ? 'Wait...' : (selectedGrievance.status === 'rejected' ? 'Restore to Pending' : 'Set Pending')}
                                                {(selectedGrievance.status === 'pending' || selectedGrievance.status === 'submitted') && <div className="absolute -top-2 -right-1 px-1.5 py-0.5 bg-amber-400 text-black text-[6px] rounded-full font-black shadow-sm z-10">ACTIVE</div>}
                                            </Button>
                                            <Button
                                                onClick={() => handleUpdateStatus('in-progress')}
                                                disabled={isUpdating}
                                                className={`py-6 font-black uppercase tracking-widest rounded-2xl shadow-lg text-[10px] transition-all relative ${selectedGrievance.status === 'in-progress'
                                                    ? 'bg-indigo-600 ring-4 ring-indigo-500/30 shadow-indigo-500/20 text-white'
                                                    : 'bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20'
                                                    }`}
                                            >
                                                {isUpdating ? 'Wait...' : 'In Progress'}
                                                {selectedGrievance.status === 'in-progress' && <div className="absolute -top-2 -right-1 px-1.5 py-0.5 bg-indigo-400 text-black text-[6px] rounded-full font-black shadow-sm z-10">ACTIVE</div>}
                                            </Button>
                                            <Button
                                                onClick={() => handleUpdateStatus('resolved')}
                                                disabled={isUpdating}
                                                className={`py-6 font-black uppercase tracking-widest rounded-2xl shadow-lg text-[10px] transition-all relative ${selectedGrievance.status === 'resolved'
                                                    ? 'bg-emerald-600 ring-4 ring-emerald-500/30 shadow-emerald-500/20 text-white'
                                                    : 'bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20'
                                                    }`}
                                            >
                                                {isUpdating ? 'Wait...' : (selectedGrievance.status === 'rejected' ? 'Restore & Resolve' : 'Finalize')}
                                                {selectedGrievance.status === 'resolved' && <div className="absolute -top-2 -right-1 px-1.5 py-0.5 bg-emerald-400 text-black text-[6px] rounded-full font-black shadow-sm z-10">ACTIVE</div>}
                                            </Button>
                                            <Button
                                                onClick={() => handleUpdateStatus('rejected')}
                                                disabled={isUpdating}
                                                className={`py-6 font-black uppercase tracking-widest rounded-2xl shadow-lg text-[10px] transition-all relative ${selectedGrievance.status === 'rejected'
                                                    ? 'bg-rose-600 ring-4 ring-rose-500/30 shadow-rose-500/20 text-white'
                                                    : 'bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20'
                                                    }`}
                                            >
                                                {isUpdating ? 'Wait...' : 'Void Signal'}
                                                {selectedGrievance.status === 'rejected' && <div className="absolute -top-2 -right-1 px-1.5 py-0.5 bg-rose-400 text-black text-[6px] rounded-full font-black shadow-sm z-10">ACTIVE</div>}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* RESOLUTION NOTES */}
                                    <div className="p-10 bg-[#0e1425] border border-white/5 rounded-[3.5rem] space-y-6">
                                        <Label className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em] flex items-center gap-3">
                                            <MessageSquare className="h-5 w-5 text-indigo-500" /> Resolution Script
                                        </Label>
                                        <textarea
                                            className="w-full min-h-[120px] p-8 bg-[#060810] border border-white/5 rounded-[2.5rem] text-sm font-bold text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all outline-none resize-none placeholder:text-white/10 shadow-inner"
                                            placeholder="AUTHENTICATE ACTION PLAN..."
                                            value={resolutionNote}
                                            onChange={(e) => setResolutionNote(e.target.value)}
                                        />
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-white/2 border border-white/5 rounded-2xl">
                                                <p className="text-[9px] font-black text-white/20 uppercase mb-2">Assign Team</p>
                                                <select className="bg-transparent text-xs font-bold text-indigo-400 outline-none w-full">
                                                    {[
                                                        'Roads & Infrastructure Response Team',
                                                        'Sanitation Response Team',
                                                        'Water Supply Response Team',
                                                        'Electricity Response Team',
                                                        'Public Health Response Team',
                                                        'Public Transport Response Team',
                                                        'Education Response Team',
                                                        'Revenue & Taxation Response Team',
                                                        'Housing Response Team',
                                                        'Environment Response Team',
                                                        'Law & Order Response Team',
                                                        'General Administration Team',
                                                    ].map(t => <option key={t}>{t}</option>)}
                                                </select>
                                            </div>
                                            <div className="p-4 bg-white/2 border border-white/5 rounded-2xl">
                                                <p className="text-[9px] font-black text-white/20 uppercase mb-2">Priority Override</p>
                                                <select className="bg-transparent text-xs font-bold text-rose-400 outline-none w-full">
                                                    {['Keep Original', 'Critical', 'High', 'Medium', 'Low'].map(p => <option key={p}>{p}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* POST OFFICIAL UPDATE */}
                                    <div className="p-10 bg-[#0e1425] border border-indigo-500/10 rounded-[3.5rem] space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center border border-indigo-500/20">
                                                <MessageSquare className="h-5 w-5 text-indigo-400" />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black text-white/80 uppercase tracking-widest">Post Official Update</p>
                                                <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Visible to citizen on their dashboard</p>
                                            </div>
                                        </div>
                                        <textarea
                                            value={officialMessage}
                                            onChange={(e) => setOfficialMessage(e.target.value)}
                                            placeholder="Transmit a message to the citizen..."
                                            className="w-full min-h-[120px] p-8 bg-[#060810] border border-white/5 rounded-[2.5rem] text-sm font-bold text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all outline-none resize-none placeholder:text-white/10 shadow-inner"
                                        />
                                        <Button
                                            onClick={async () => {
                                                if (!officialMessage || !selectedGrievanceId) return;
                                                setIsPostingUpdate(true);
                                                try {
                                                    await addAuthorityUpdate(selectedGrievanceId, officialMessage);
                                                    setOfficialMessage("");
                                                    toast({ title: "Update Transmitted", description: "Message logged and sent to citizen." });
                                                } catch (err) {
                                                    toast({ title: "Failed", description: "Could not send update.", variant: "destructive" });
                                                } finally {
                                                    setIsPostingUpdate(false);
                                                }
                                            }}
                                            disabled={isPostingUpdate || !officialMessage}
                                            className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-indigo-600/20 border border-indigo-400/20 transition-all"
                                        >
                                            {isPostingUpdate ? 'Transmitting...' : 'Post Update to Citizen'}
                                        </Button>
                                    </div>

                                    {/* BROADCAST HISTORY */}
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] px-2">Broadcast History</p>
                                        {selectedGrievance.authorityUpdates && selectedGrievance.authorityUpdates.length > 0 ? (
                                            <div className="space-y-3">
                                                {selectedGrievance.authorityUpdates.map((upd, idx) => (
                                                    <div key={idx} className="p-6 bg-[#0e1425] border border-white/5 rounded-2xl">
                                                        <p className="text-xs font-semibold text-white/70 leading-relaxed mb-3">"{upd.message}"</p>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[8px] font-bold text-white/20">
                                                                {new Date(upd.timestamp).toLocaleString()}
                                                            </span>
                                                            <div className="flex gap-1">
                                                                {upd.reactions && upd.reactions.length > 0 ? (
                                                                    Object.entries(
                                                                        upd.reactions.reduce((acc: any, r) => {
                                                                            acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                                                                            return acc;
                                                                        }, {})
                                                                    ).map(([emoji, count]: [string, any]) => (
                                                                        <span key={emoji} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-[9px] font-bold text-white/60">
                                                                            {emoji} {count}
                                                                        </span>
                                                                    ))
                                                                ) : (
                                                                    <span className="text-[8px] text-white/20 uppercase font-bold italic">No reactions yet</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-6 border-2 border-dashed border-white/5 rounded-3xl">
                                                <p className="text-[8px] font-black uppercase tracking-widest text-white/15">No broadcasts sent</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* RESOLVED ARCHIVE */}
                                    {selectedGrievance.status === "resolved" && (
                                        <div className="bg-emerald-500/5 p-10 rounded-[3rem] border border-emerald-500/20 relative group">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
                                            <div className="relative z-10">
                                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-4">Archive Transcript</p>
                                                <p className="text-sm text-emerald-500/80 font-bold leading-relaxed tracking-tight">
                                                    "{selectedGrievance.resolutionNotes || "Action completed by authority."}"
                                                </p>
                                                <div className="mt-8 flex items-center justify-between border-t border-emerald-500/10 pt-6">
                                                    <div className="flex items-center gap-3">
                                                        <ShieldCheck className="h-5 w-5 text-emerald-500" />
                                                        <span className="text-[10px] font-black text-emerald-500/40 uppercase tracking-widest">Seal Verified</span>
                                                    </div>
                                                    <span className="text-[10px] font-black text-emerald-500/40 uppercase tracking-widest">{new Date(selectedGrievance.updatedAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* CITIZEN FEEDBACK */}
                                    {selectedGrievance.feedback && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm"
                                        >
                                            <div className="flex items-center justify-between mb-6">
                                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Citizen Response</p>
                                                <div className="flex gap-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={`h-4 w-4 ${i < (selectedGrievance.rating || 0) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-sm text-slate-600 font-bold leading-relaxed italic">
                                                "{selectedGrievance.feedback}"
                                            </p>
                                            <div className="mt-6 pt-6 border-t border-slate-100 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-400">
                                                    {selectedGrievance.citizenName?.charAt(0) || "C"}
                                                </div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedGrievance.citizenName || "Verified Citizen"}</p>
                                            </div>
                                        </motion.div>
                                    )}

                                </div>
                            </motion.div>
                        </>
                    )
                }
            </AnimatePresence >

            {/* SYSTEM ARCHIVE MODAL */}
            <AnimatePresence>
                {
                    showArchiveModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowArchiveModal(false)}
                                className="absolute inset-0 bg-[#060810]/95 backdrop-blur-2xl"
                            />
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="w-full max-w-2xl bg-[#0c101b] border border-indigo-500/20 rounded-[4rem] p-12 relative overflow-hidden shadow-[0_0_100px_rgba(79,70,229,0.1)]"
                            >
                                <div className="relative z-10">
                                    <h3 className="text-4xl font-black text-white uppercase tracking-tighter italic mb-2">System Audit Data</h3>
                                    <p className="text-[11px] font-black text-white/20 uppercase tracking-[0.3em] mb-10">Historical telemetry and node resolution logs</p>

                                    <div className="space-y-6 mb-12">
                                        {[
                                            { label: "Total Data Volume", value: "1.42 GB", sub: "Grievance media + telemetry" },
                                            { label: "Sequence Continuity", value: "99.98%", sub: "Verified via department nodes" },
                                            { label: "Last Archival", value: "12 Hours Ago", sub: "Automatic local snapshot" },
                                        ].map(item => (
                                            <div key={item.label} className="flex items-center justify-between p-6 bg-white/2 border border-white/5 rounded-3xl group hover:bg-white/5 transition-all">
                                                <div>
                                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">{item.label}</p>
                                                    <p className="text-xs font-bold text-white/40 mt-1">{item.sub}</p>
                                                </div>
                                                <p className="text-2xl font-black text-indigo-400">{item.value}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex gap-4">
                                        <Button
                                            onClick={exportToCSV}
                                            className="flex-1 h-16 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em]"
                                        >
                                            Export CSV Archive
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                toast({ title: "Detailed Report", description: "PDF resolution report generated." });
                                                setShowArchiveModal(false);
                                            }}
                                            variant="outline"
                                            className="flex-1 h-16 bg-white/5 border-white/10 hover:bg-white/10 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-white"
                                        >
                                            Generate PDF Report
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )
                }
            </AnimatePresence >

            {/* UNIT DEPLOYMENT MODAL */}
            <AnimatePresence>
                {
                    showDeploymentModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => !isDeploying && setShowDeploymentModal(false)}
                                className="absolute inset-0 bg-[#060810]/95 backdrop-blur-2xl"
                            />
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="w-full max-w-xl bg-[#0c101b] border border-indigo-500/20 rounded-[4rem] p-12 relative overflow-hidden shadow-[0_0_100px_rgba(79,70,229,0.1)]"
                            >
                                {isDeploying ? (
                                    <div className="py-20 flex flex-col items-center justify-center text-center">
                                        <div className="relative mb-10">
                                            <div className="w-24 h-24 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Zap className="h-8 w-8 text-indigo-400 animate-pulse" />
                                            </div>
                                        </div>
                                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Initializing Unit</h3>
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Node Connection Established</p>
                                    </div>
                                ) : (
                                    <div className="relative z-10">
                                        <h3 className="text-4xl font-black text-white uppercase tracking-tighter italic mb-2">Deploy New Unit</h3>
                                        <p className="text-[11px] font-black text-white/20 uppercase tracking-[0.3em] mb-10">New Personnel or Tactical Asset Assignment</p>

                                        <div className="space-y-8 mb-12">
                                            <div className="space-y-4">
                                                <Label className="text-[10px] font-black text-white/20 uppercase tracking-widest px-1 text-slate-400">Unit Designation</Label>
                                                <Input
                                                    value={newUnitData.designation}
                                                    onChange={(e) => setNewUnitData(prev => ({ ...prev, designation: e.target.value }))}
                                                    placeholder="ALPHA-7 / DISTRICT-UNIT-1..."
                                                    className="h-16 bg-white/5 border-white/10 rounded-2xl text-xs font-bold text-white uppercase tracking-widest placeholder:text-white/5 focus:ring-indigo-500/30"
                                                />
                                            </div>
                                            <div className="space-y-4">
                                                <Label className="text-[10px] font-black text-white/20 uppercase tracking-widest px-1 text-slate-400">Asset Category</Label>
                                                <div className="grid grid-cols-3 gap-4">
                                                    {['Personnel', 'Tactical', 'Vehicle'].map(type => (
                                                        <button
                                                            key={type}
                                                            onClick={() => setNewUnitData(prev => ({ ...prev, category: type }))}
                                                            className={`h-14 border rounded-2xl text-[9px] font-black uppercase transition-all ${newUnitData.category === type
                                                                ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/20'
                                                                : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'
                                                                }`}
                                                        >
                                                            {type}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            <Button
                                                onClick={() => {
                                                    if (!newUnitData.designation) {
                                                        toast({ title: "Designation Required", variant: "destructive" });
                                                        return;
                                                    }
                                                    setIsDeploying(true);
                                                    setTimeout(() => {
                                                        const unit = { ...newUnitData };
                                                        setDeployedUnits(prev => [...prev, unit]);
                                                        setIsDeploying(false);
                                                        setShowDeploymentModal(false);
                                                        setNewUnitData({ designation: "", category: "Personnel" });
                                                        toast({ title: "Unit Deployed", description: `${unit.designation} is now active in the response queue.` });
                                                        setLiveLogs(prev => [{ id: Date.now().toString(), msg: `RESPONSE UNIT INITIALIZED: ${unit.designation} (${unit.category})`, time: "NOW" }, ...prev.slice(0, 19)]);
                                                    }, 2000);
                                                }}
                                                className="flex-1 h-16 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em]"
                                            >
                                                Confirm Deployment
                                            </Button>
                                            <Button
                                                onClick={() => setShowDeploymentModal(false)}
                                                variant="ghost"
                                                className="h-16 px-8 bg-white/5 hover:bg-white/10 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white"
                                            >
                                                Abort
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    )
                }
            </AnimatePresence >


        </div>
    );
};

export default AuthorityDashboard;

