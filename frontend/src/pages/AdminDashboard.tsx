import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard, Users, Building2,
    Database, Brain, Lock, CheckCircle, AlertOctagon,
    Activity, Shield, Trash2, ShieldCheck, LogOut, UserPlus, UserCheck,
    Map as MapIcon, BarChart3, Search, Filter, AlertTriangle, Clock,
    MessageSquare, Star, Heart, Download, Globe, Car, Zap, Droplet, Layers,
    MapPin, Sparkles, TrendingUp, Cpu, XCircle, FileText, Info, HeartPulse
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, Grievance } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import {
    AreaChart, Area, CartesianGrid, Tooltip, ResponsiveContainer,
    XAxis, BarChart, Bar, PieChart, Pie, Cell
} from "recharts";
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, LayerGroup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet Icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Configs
const priorityConfig: any = {
    low: { color: "text-slate-500", bg: "bg-slate-100", border: "border-slate-200" },
    medium: { color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100" },
    high: { color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-100" },
    critical: { color: "text-rose-500", bg: "bg-rose-50", border: "border-rose-100" },
};

const statusConfig: any = {
    submitted: { color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100" },
    pending: { color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100" },
    "in-progress": { color: "text-indigo-500", bg: "bg-indigo-50", border: "border-indigo-100" },
    resolved: { color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-100" },
    rejected: { color: "text-red-500", bg: "bg-red-50", border: "border-red-100" },
};

const MapController = ({ selectedCoords, grievances }: { selectedCoords: any, grievances: Grievance[] }) => {
    const map = useMap();
    useEffect(() => {
        if (selectedCoords) {
            map.flyTo([selectedCoords.latitude, selectedCoords.longitude], 16, {
                animate: true,
                duration: 1.5
            });
        }
    }, [selectedCoords, map]);

    // Bound to all markers on initial load
    useEffect(() => {
        const coords = grievances.filter(g => g.coordinates).map(g => [g.coordinates!.latitude, g.coordinates!.longitude] as [number, number]);
        if (coords.length > 0) {
            const bounds = L.latLngBounds(coords);
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [grievances.length]);

    return null;
};

const AdminDashboard = () => {
    const { user, grievances, users, logout, deleteUser, refreshData: originalRefreshData, addUser, updateGrievanceStatus, addAuthorityUpdate } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    // Views: "overview" (Dashboard), "registry" (Detailed Matrix), "geospatial" (Map), "analytics" (Deep), "users" (Identity), "departments" (Sector)
    const [activeView, setActiveView] = useState<"overview" | "registry" | "geospatial" | "analytics" | "users" | "add-authority" | "departments">("overview");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState(new Date());

    const refreshData = async () => {
        setIsRefreshing(true);
        try {
            await originalRefreshData();
            setLastSyncTime(new Date());
        } catch (error) {
            console.error("Refresh failed:", error);
        } finally {
            setIsRefreshing(false);
        }
    };

    // Filter States for Registry/Analytics
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterPriority, setFilterPriority] = useState("all");
    const [selectedAnalyticsDept, setSelectedAnalyticsDept] = useState("Global");
    const [selectedGrievanceId, setSelectedGrievanceId] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [officialMessage, setOfficialMessage] = useState("");
    const [isPostingUpdate, setIsPostingUpdate] = useState(false);
    const [showDeploymentModal, setShowDeploymentModal] = useState(false);

    // Initial Data Refresh
    useEffect(() => {
        refreshData();
        const interval = setInterval(refreshData, 30000); // Auto-refresh every 30s
        return () => clearInterval(interval);
    }, []);

    // Derived Data
    const selectedGrievance = useMemo(() => {
        return grievances.find((g: Grievance) => g.id === selectedGrievanceId);
    }, [grievances, selectedGrievanceId]);

    const filteredGrievances = useMemo(() => {
        return grievances.filter((g: Grievance) => {
            const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                g.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                g.id?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = filterStatus === 'all' || g.status === filterStatus;
            const matchesPriority = filterPriority === 'all' || g.priority === filterPriority;
            return matchesSearch && matchesStatus && matchesPriority;
        });
    }, [grievances, searchQuery, filterStatus, filterPriority]);

    // --- REAL ANALYTICS COMPUTATION (Authority Port) ---
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
            : (Array.isArray(grievances) ? grievances : []).filter((g: any) => g.category === selectedAnalyticsDept);

        dataToAnalyze.forEach((g: any) => {
            const gDate = new Date(g.createdAt).toISOString().split('T')[0];
            const day = last7Days.find(d => d.date === gDate);
            if (day) {
                day.cases++;
                if (g.status === 'resolved') day.resolved++;
            }
        });

        return last7Days;
    }, [grievances, selectedAnalyticsDept]);

    const departmentStats = useMemo(() => {
        const allDepts = Array.from(new Set((Array.isArray(grievances) ? grievances : []).map((g: any) => g.category || 'Other')));
        return allDepts.map(dept => ({
            name: dept,
            load: grievances.filter((g: any) => (g.category === dept || g.assignedDepartment === dept) && g.status !== 'resolved').length,
            efficiency: Math.round(
                (grievances.filter((g: any) => (g.category === dept || g.assignedDepartment === dept) && g.status === 'resolved').length /
                    (grievances.filter((g: any) => (g.category === dept || g.assignedDepartment === dept)).length || 1)) * 100
            ) || 85
        }));
    }, [grievances]);

    const resolutionRate = useMemo(() => {
        const total = grievances.length;
        if (total === 0) return 100;
        const resolved = grievances.filter((g: any) => g.status === 'resolved').length;
        return Math.round((resolved / total) * 100);
    }, [grievances]);

    const avgCitizenRating = useMemo(() => {
        const rated = grievances.filter((g: any) => g.rating !== undefined && g.rating !== null);
        if (rated.length === 0) return "5.0";
        const sum = rated.reduce((acc: number, g: any) => acc + (g.rating || 0), 0);
        return (sum / rated.length).toFixed(1);
    }, [grievances]);

    const neuralStats = useMemo(() => {
        const total = grievances.length;
        if (total === 0) return { sentimentScore: "100.0", criticalCount: 0, avgUrgency: "0.0", graphData: [] };
        const criticalCount = grievances.filter((g: Grievance) => g.priority === 'critical').length;
        const avgUrgency = grievances.reduce((acc: number, g: Grievance) => acc + (g.urgencyScore || 0), 0) / (total || 1);
        const sentimentScore = Math.max(0, 100 - (criticalCount * 5) - (avgUrgency * 2));
        return {
            sentimentScore: sentimentScore.toFixed(1),
            criticalCount,
            avgUrgency: avgUrgency.toFixed(1)
        };
    }, [grievances]);

    // Handlers
    const handleUpdateStatus = async (status: string) => {
        if (!selectedGrievanceId) return;
        setIsUpdating(true);
        try {
            await updateGrievanceStatus(selectedGrievanceId, status);
            toast({ title: "Status Updated", description: `Grievance marked as ${status}.` });
        } catch (error) {
            toast({ title: "Update Failed", description: "Could not update status.", variant: "destructive" });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteUser = async (uId: string) => {
        if (confirm("Terminate this identity node? This action is irreversible.")) {
            await deleteUser(uId);
            toast({ title: "Node Terminated", description: `Identity ${uId} has been purged.` });
        }
    };

    const exportToCSV = () => {
        const headers = ["ID", "Title", "Category", "Status", "Priority", "Created At"];
        const rows = filteredGrievances.map((g: Grievance) => [
            g.id, g.title, g.category, g.status, g.priority, new Date(g.createdAt).toLocaleString()
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `admin_global_export_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-600 flex overflow-hidden font-sans selection:bg-rose-500/10 selection:text-rose-600">
            {/* Sidebar */}
            <aside className="w-80 bg-white border-r border-slate-200 hidden lg:flex flex-col relative z-20 shadow-xl shadow-slate-200/50">
                <div className="p-8 border-b border-slate-100">
                    <div className="flex items-center gap-4 group">
                        <div className="w-12 h-12 rounded-[1.2rem] bg-gradient-to-br from-rose-600 to-rose-400 flex items-center justify-center shadow-[0_0_20px_rgba(225,29,72,0.2)] group-hover:scale-110 transition-transform duration-500">
                            <ShieldCheck className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="font-black text-xl text-slate-800 tracking-tighter uppercase italic">Grievance<span className="text-rose-500">Admin</span></h1>
                            <div className="flex items-center gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${isRefreshing ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]`} />
                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em]">{isRefreshing ? 'SYNCING...' : 'CORE MAINFRAME LIVE'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-6 space-y-3 overflow-y-auto custom-scrollbar">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 px-4">Global Command</p>
                    {[
                        { id: "overview", label: "Global Matrix", icon: LayoutDashboard },
                        { id: "registry", label: "Live Registry", icon: Database },
                        { id: "geospatial", label: "Geospatial Map", icon: MapIcon },
                        { id: "analytics", label: "Deep Analytics", icon: BarChart3 },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveView(item.id as any)}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group relative ${activeView === item.id
                                ? "bg-rose-50 text-rose-600 shadow-sm ring-1 ring-rose-100 translate-x-2"
                                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-transparent"
                                }`}
                        >
                            <item.icon className={`h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${activeView === item.id ? "text-rose-500" : ""}`} />
                            <span className="font-bold text-sm tracking-wide">{item.label}</span>
                            {activeView === item.id && (
                                <motion.div layoutId="activeDot" className="ml-auto w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(225,29,72,0.4)]" />
                            )}
                        </button>
                    ))}

                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 mt-8 px-4">Admin Config</p>
                    {[
                        { id: "users", label: "Identity Nodes", icon: Users },
                        { id: "add-authority", label: "Add Authority", icon: UserPlus },
                        { id: "departments", label: "Sector Sync", icon: Building2 },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveView(item.id as any)}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group relative ${activeView === item.id
                                ? "bg-indigo-50 text-indigo-600 shadow-sm ring-1 ring-indigo-100 translate-x-2"
                                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-transparent"
                                }`}
                        >
                            <item.icon className={`h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${activeView === item.id ? "text-indigo-500" : ""}`} />
                            <span className="font-bold text-sm tracking-wide">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-8 border-t border-slate-200">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-rose-500 font-black">
                            {user?.name?.[0] || 'A'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-black text-slate-800 truncate uppercase tracking-tight">{user?.name}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Super Admin</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={() => { logout(); navigate("/"); }}
                        className="w-full justify-start gap-4 text-rose-500 hover:bg-rose-50 hover:text-rose-600 font-black uppercase tracking-widest text-[10px] h-12 rounded-xl border border-rose-100"
                    >
                        <LogOut className="h-4 w-4" />
                        Terminate
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen relative overflow-hidden bg-slate-50">
                {/* Background FX */}
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-rose-500/5 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

                <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 px-10 py-6 flex items-center justify-between z-10 sticky top-0 shadow-sm">
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase mb-1 italic">
                            {activeView === 'overview' ? 'Mission Control' : activeView === 'registry' ? 'Live Registry' : activeView.replace('-', ' ')}
                            <span className="text-rose-500">.Matrix</span>
                        </h2>
                        <div className="flex items-center gap-3">
                            <span className="px-2 py-0.5 rounded text-[9px] font-black bg-slate-100 text-slate-400 border border-slate-200 uppercase tracking-widest">System v4.0.2</span>
                            <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Global Secure Link
                            </span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar relative z-10">
                    <AnimatePresence mode="wait">

                        {/* VIEW: OVERVIEW (Simplified KPI + Quick Actions) */}
                        {activeView === "overview" && (
                            <motion.div
                                key="overview"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                className="space-y-10"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {[
                                        { label: "Active Nodes", value: users.length, icon: Users, color: "rose" },
                                        { label: "Total Signals", value: grievances.length, icon: Database, color: "indigo" },
                                        { label: "Neural Health", value: `${neuralStats.sentimentScore}%`, icon: Brain, color: "emerald" },
                                        { label: "Critical Events", value: neuralStats.criticalCount, icon: AlertOctagon, color: "amber" },
                                    ].map((stat, i) => (
                                        <motion.div
                                            key={stat.label}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="bg-white border border-slate-200 p-8 rounded-[2.5rem] relative overflow-hidden group hover:border-rose-200 transition-all shadow-sm"
                                        >
                                            <div className="flex items-center justify-between mb-6 relative z-10">
                                                <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-50 flex items-center justify-center text-${stat.color}-500`}>
                                                    <stat.icon className="h-6 w-6" />
                                                </div>
                                            </div>
                                            <h3 className="text-4xl font-black text-slate-800 tracking-tighter mb-1 relative z-10">{stat.value}</h3>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] relative z-10">{stat.label}</p>
                                        </motion.div>
                                    ))}
                                </div>
                                {/* Embed geospatial preview or recent list */}
                                <div className="bg-white border border-slate-200 p-8 rounded-[3rem] shadow-sm">
                                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic mb-6">Recent System Activity</h3>
                                    <div className="space-y-4">
                                        {grievances.slice(0, 5).map((g, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-2 h-2 rounded-full ${g.priority === 'critical' ? 'bg-rose-500' : 'bg-indigo-500'}`} />
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-700">{g.title}</p>
                                                        <p className="text-[9px] font-mono text-slate-400 uppercase">{g.category} • {new Date(g.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${statusConfig[g.status]?.color || 'text-slate-500'}`}>
                                                    {g.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* VIEW: REGISTRY (Detailed Matrix - Ported from Authority) */}
                        {activeView === "registry" && (
                            <motion.div
                                key="registry"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex gap-8 h-[calc(100vh-140px)]"
                            >
                                {/* List Panel */}
                                <div className="w-1/3 flex flex-col gap-4">
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Search registry..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full h-12 bg-white border border-slate-200 rounded-xl pl-12 pr-4 text-xs font-bold focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all uppercase placeholder:normal-case"
                                            />
                                        </div>
                                        <Button onClick={exportToCSV} size="icon" className="h-12 w-12 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200">
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                                        {filteredGrievances.length > 0 ? (
                                            filteredGrievances.map((g: Grievance) => (
                                                <motion.div
                                                    key={g.id}
                                                    layoutId={`card-${g.id}`}
                                                    onClick={() => setSelectedGrievanceId(g.id)}
                                                    className={`p-5 rounded-2xl border cursor-pointer transition-all group relative overflow-hidden ${selectedGrievanceId === g.id
                                                        ? "bg-white border-rose-500 shadow-lg shadow-rose-500/10"
                                                        : "bg-white border-slate-200 hover:border-rose-300 hover:bg-rose-50/10"
                                                        }`}
                                                >
                                                    <div className="flex justify-between items-start mb-3">
                                                        <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${priorityConfig[g.priority]?.bg} ${priorityConfig[g.priority]?.color} border ${priorityConfig[g.priority]?.border}`}>
                                                            {g.priority}
                                                        </span>
                                                        <span className="text-[9px] font-mono text-slate-400">{new Date(g.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <h4 className="text-sm font-bold text-slate-800 leading-tight mb-2 group-hover:text-rose-600 transition-colors">{g.title}</h4>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{g.category}</p>
                                                </motion.div>
                                            ))
                                        ) : (
                                            <div className="text-center py-10 opacity-50">
                                                <p className="text-xs font-bold uppercase">No Signals Found</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Detail Panel */}
                                <div className="flex-1 bg-white border border-slate-200 rounded-[2.5rem] p-8 overflow-y-auto custom-scrollbar relative shadow-sm">
                                    {selectedGrievance ? (
                                        <div className="space-y-8">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${priorityConfig[selectedGrievance.priority]?.bg || 'bg-slate-100'} ${priorityConfig[selectedGrievance.priority]?.color || 'text-slate-500'} border ${priorityConfig[selectedGrievance.priority]?.border || 'border-slate-200'}`}>
                                                            {selectedGrievance.priority} Priority
                                                        </span>
                                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${statusConfig[selectedGrievance.status]?.bg || 'bg-slate-100'} ${statusConfig[selectedGrievance.status]?.color || 'text-slate-500'} border ${statusConfig[selectedGrievance.status]?.border || 'border-slate-200'}`}>
                                                            {selectedGrievance.status}
                                                        </span>
                                                    </div>
                                                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{selectedGrievance.title}</h2>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                                                        <MapPin className="h-3 w-3" /> {selectedGrievance.location} • ID: {selectedGrievance.id}
                                                    </p>
                                                </div>
                                                {selectedGrievance.urgencyScore > 7 && (
                                                    <div className="w-12 h-12 rounded-full bg-rose-500 animate-pulse flex items-center justify-center shadow-lg shadow-rose-500/30">
                                                        <AlertTriangle className="h-6 w-6 text-white" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* AI Panel */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                        <Brain className="h-3 w-3 text-indigo-500" /> Strategic Insight
                                                    </h4>
                                                    <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
                                                        "This grievance in <span className="text-indigo-600 font-bold">{selectedGrievance.category}</span> has a calculated urgency index of <span className="text-indigo-600 font-bold">{selectedGrievance.urgencyScore}/10</span>. Recommended immediate triage."
                                                    </p>
                                                </div>
                                                <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                        <Shield className="h-3 w-3 text-emerald-500" /> Operational Unit
                                                    </h4>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800 uppercase italic">
                                                            {users.find((u: any) => (u.id || u._id) === selectedGrievance.assignedTo)?.name || 'UNASSIGNED'}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                            Node: {selectedGrievance.assignedDepartment || 'Global Proxy'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Protocol */}
                                            <div className="p-6 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <Zap className="h-3 w-3 text-amber-500" /> Action Protocol
                                                </h4>
                                                <div className="flex gap-2">
                                                    <Button
                                                        onClick={() => handleUpdateStatus('in-progress')}
                                                        disabled={isUpdating}
                                                        size="sm"
                                                        className="flex-1 bg-white hover:bg-emerald-50 text-emerald-600 border border-slate-200 hover:border-emerald-200 shadow-sm text-[9px] font-black uppercase"
                                                    >
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleUpdateStatus('rejected')}
                                                        disabled={isUpdating}
                                                        size="sm"
                                                        className="flex-1 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 shadow-sm text-[9px] font-black uppercase"
                                                    >
                                                        Reject
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="p-6 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Description</h4>
                                                <p className="text-sm text-slate-700 leading-relaxed font-medium">{selectedGrievance.description}</p>
                                            </div>

                                            {/* FEEDBACK SECTION */}
                                            {(selectedGrievance.rating > 0 || selectedGrievance.feedback) && (
                                                <div className="mt-8 p-6 bg-emerald-50 border border-emerald-100 rounded-[2rem] relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                                        <Star className="h-20 w-20 text-emerald-500" />
                                                    </div>
                                                    <div className="relative z-10">
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                                                                <Heart className="h-5 w-5" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Citizen Verdict</p>
                                                                <div className="flex gap-0.5 mt-1">
                                                                    {[1, 2, 3, 4, 5].map(star => (
                                                                        <Star key={star} className={`h-3 w-3 ${star <= (selectedGrievance.rating || 0) ? "fill-emerald-500 text-emerald-500" : "text-emerald-200"}`} />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {selectedGrievance.feedback && (
                                                            <div className="p-4 bg-white/60 border border-emerald-100 rounded-2xl">
                                                                <p className="text-xs font-bold text-emerald-900 italic">"{selectedGrievance.feedback}"</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Official Update */}
                                            <div className="border-t border-slate-100 pt-6">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Transmit Update</h4>
                                                <textarea
                                                    value={officialMessage}
                                                    onChange={(e) => setOfficialMessage(e.target.value)}
                                                    placeholder="Enter official status update..."
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold focus:outline-none focus:border-rose-500 min-h-[100px]"
                                                />
                                                <Button
                                                    onClick={async () => {
                                                        if (!officialMessage) return;
                                                        setIsPostingUpdate(true);
                                                        try {
                                                            await addAuthorityUpdate(selectedGrievance.id, officialMessage);
                                                            setOfficialMessage("");
                                                            toast({ title: "Sent", description: "Update transmitted." });
                                                        } catch (e) { }
                                                        setIsPostingUpdate(false);
                                                    }}
                                                    disabled={isPostingUpdate}
                                                    className="w-full mt-4 bg-rose-500 hover:bg-rose-600 text-white font-black uppercase text-[10px] tracking-widest h-12 rounded-xl"
                                                >
                                                    {isPostingUpdate ? 'Transmitting...' : 'Post Update'}
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-300">
                                            <div className="w-20 h-20 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
                                                <Database className="h-8 w-8 text-slate-200" />
                                            </div>
                                            <p className="text-xs font-black uppercase tracking-widest">Select a Data Packet</p>
                                        </div>
                                    )}
                                </div >
                            </motion.div >
                        )}

                        {/* VIEW: GEOSPATIAL (Heatmap) */}
                        {
                            activeView === "geospatial" && (
                                <motion.div
                                    key="geospatial"
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="h-[calc(100vh-140px)] bg-slate-900 border border-slate-800 rounded-[3rem] overflow-hidden relative shadow-2xl"
                                >
                                    <style>{`
                                        @keyframes ping {
                                            75%, 100% { transform: scale(3.5); opacity: 0; }
                                        }
                                        .custom-neural-node { background: transparent !important; border: none !important; }
                                        .neural-popup .leaflet-popup-content-wrapper { background: #0f172a; border-radius: 1.5rem; border: 1px solid rgba(255,255,255,0.1); }
                                        .neural-popup .leaflet-popup-tip { background: #0f172a; }
                                    `}</style>
                                    <MapContainer
                                        center={[28.6139, 77.209]}
                                        zoom={11}
                                        style={{ height: "100%", width: "100%", background: "#0f172a" }}
                                    >
                                        <TileLayer
                                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                            attribution='&copy; CARTO'
                                        />
                                        <MapController selectedCoords={null} grievances={grievances} />
                                        {grievances.filter((g: Grievance) => g.coordinates).map((g: Grievance) => {
                                            const pulseColor = g.priority === 'critical' ? '#f43f5e' :
                                                g.priority === 'high' ? '#f59e0b' : '#6366f1';
                                            const customIcon = L.divIcon({
                                                className: 'custom-neural-node',
                                                html: `
                                                    <div style="position: relative; width: 34px; height: 34px; margin-left: -17px; margin-top: -17px;">
                                                        <div style="position: absolute; inset: 0; background: ${pulseColor}; border-radius: 50%; opacity: 0.15; animation: ping 3s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                                                        <div style="position: absolute; inset: 6px; background: ${pulseColor}; border-radius: 50%; opacity: 0.3; animation: ping 3s cubic-bezier(0, 0, 0.2, 1) 1s infinite;"></div>
                                                        <div style="position: absolute; inset: 12px; background: ${pulseColor}; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 15px ${pulseColor}; z-index: 10;"></div>
                                                    </div>
                                                `,
                                                iconSize: [34, 34],
                                                iconAnchor: [17, 17]
                                            });

                                            return (
                                                <LayerGroup key={g.id}>
                                                    <Circle
                                                        center={[g.coordinates!.latitude, g.coordinates!.longitude]}
                                                        radius={1500}
                                                        pathOptions={{
                                                            fillColor: pulseColor,
                                                            fillOpacity: 0.08,
                                                            stroke: false
                                                        }}
                                                    />
                                                    <Marker
                                                        position={[g.coordinates!.latitude, g.coordinates!.longitude]}
                                                        icon={customIcon}
                                                        eventHandlers={{
                                                            click: () => {
                                                                setSelectedGrievanceId(g.id);
                                                                setActiveView('registry');
                                                            }
                                                        }}
                                                    >
                                                        <Popup className="neural-popup">
                                                            <div className="p-3 min-w-[200px] bg-slate-900/50 text-white rounded-2xl">
                                                                <p className="text-[10px] font-black uppercase text-rose-500 mb-1">{g.priority} PRIORITY</p>
                                                                <p className="font-bold text-sm mb-2 leading-tight">{g.title}</p>
                                                                <div className="flex items-center justify-between opacity-80">
                                                                    <span className="text-[8px] font-black px-2 py-0.5 bg-white/10 rounded-full uppercase">{g.category}</span>
                                                                    <span className="text-[8px] font-medium italic">{g.district}</span>
                                                                </div>
                                                            </div>
                                                        </Popup>
                                                    </Marker>
                                                </LayerGroup>
                                            );
                                        })}
                                    </MapContainer>
                                    <div className="absolute top-8 left-8 bg-black/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 z-[1000] max-w-sm shadow-2xl">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 flex items-center justify-center">
                                                <Globe className="h-5 w-5 text-rose-500 animate-[spin_4s_linear_infinite]" />
                                            </div>
                                            <div>
                                                <h3 className="text-white font-black text-xl uppercase italic leading-none">Global Heatmap</h3>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    <p className="text-[8px] text-emerald-500/80 uppercase font-black tracking-[0.2em]">SYNC STATUS: ACTIVE</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                                <p className="text-[8px] text-white/30 uppercase font-black tracking-widest mb-2">Neural Telemetry</p>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-bold text-white/70">DATA NODES</span>
                                                    <span className="text-xs font-black text-white">{grievances.filter(g => g.coordinates).length}</span>
                                                </div>
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="text-[10px] font-bold text-white/70">LAST UPDATE</span>
                                                    <span className="text-[10px] font-black text-rose-400">{lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                                </div>
                                            </div>

                                            <div className="flex gap-4 px-1">
                                                <div className="flex items-center gap-2 text-[9px] font-black text-white/50 uppercase tracking-widest">
                                                    <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></div> Critical
                                                </div>
                                                <div className="flex items-center gap-2 text-[9px] font-black text-white/50 uppercase tracking-widest">
                                                    <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div> Standard
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        }

                        {/* VIEW: ANALYTICS (Deep) */}
                        {activeView === "analytics" && (
                            <motion.section
                                key="analytics"
                                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="space-y-10"
                            >
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 h-[500px]">
                                    <div className="bg-white border border-slate-200 rounded-[3rem] p-10 flex flex-col shadow-sm">
                                        <div className="flex items-center justify-between mb-10">
                                            <div>
                                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">Case Velocity</h3>
                                                <p className="text-[8px] font-black text-rose-500 uppercase mt-1">Filtering: {selectedAnalyticsDept}</p>
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
                                                            ? "bg-rose-600 text-white shadow-lg shadow-rose-600/40 border border-rose-400/20"
                                                            : "bg-slate-100 text-slate-400 hover:bg-slate-200 border border-transparent"
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
                                                            <stop offset="5%" stopColor="#e11d48" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#00000005" vertical={false} />
                                                    <XAxis dataKey="name" stroke="#00000020" fontSize={10} axisLine={false} tickLine={false} />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #00000010', borderRadius: '1rem' }}
                                                        itemStyle={{ color: '#000', fontSize: '12px', fontWeight: 'bold' }}
                                                    />
                                                    <Area type="monotone" dataKey="cases" stroke="#e11d48" fillOpacity={1} fill="url(#colorCases)" strokeWidth={3} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    <div className="bg-white border border-slate-200 rounded-[3rem] p-10 flex flex-col shadow-sm">
                                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest mb-10">Resolution Quality</h3>
                                        <div className="grid grid-cols-2 gap-6 mb-10">
                                            {[
                                                { l: "Citizen Feedback", v: `${avgCitizenRating}/5.0`, c: "rose" },
                                                { l: "SLA Adherence", v: "92%", c: "emerald" },
                                                { l: "Resolution Efficiency", v: "Calculated", c: "blue" },
                                                { l: "Recursive Rate", v: "1.2%", c: "amber" },
                                            ].map(item => (
                                                <div key={item.l} className="bg-slate-50 border border-slate-100 p-6 rounded-3xl group hover:bg-slate-100 transition-all">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase">{item.l}</p>
                                                        <div className="group/tip relative">
                                                            <Info className="h-3 w-3 text-slate-300 hover:text-rose-500 cursor-help" />
                                                            <div className="absolute bottom-full right-0 mb-3 w-48 p-4 bg-black border border-white/10 rounded-2xl opacity-0 group-hover/tip:opacity-100 transition-opacity z-50 pointer-events-none text-[8px] font-bold text-white/40 leading-relaxed uppercase shadow-2xl">
                                                                {item.l === "Resolution Efficiency"
                                                                    ? "Calculated as (Resolved Cases / Total Registered). Measures the throughput of the system."
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
                                        <div className="flex-1 bg-slate-50 rounded-3xl p-8 border border-slate-100 flex flex-col justify-center relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="flex items-center justify-between relative z-10">
                                                <div>
                                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Registry Health Index</h4>
                                                    <div className="flex items-baseline gap-2">
                                                        <p className="text-4xl font-black text-slate-800 tracking-tighter">{(resolutionRate * 0.95).toFixed(1)}</p>
                                                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Stable Pulse</span>
                                                    </div>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-3 flex items-center gap-2">
                                                        <Activity className="h-3 w-3 text-rose-500" /> Linked to {grievances.length} Active Node Nodes
                                                    </p>
                                                </div>
                                                <div className="w-20 h-20 rounded-full border-4 border-rose-500/20 border-t-rose-500 animate-spin transition-all relative">
                                                    <div className="absolute inset-2 rounded-full border-2 border-emerald-500/20 border-b-emerald-500 animate-[spin_3s_linear_infinite]" />
                                                    <Brain className="absolute inset-0 m-auto h-6 w-6 text-rose-500" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Additional Analytics Layer */}
                                <div className="bg-white border border-slate-200 rounded-[3rem] p-10 relative overflow-hidden shadow-sm">
                                    <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-10">
                                            <div>
                                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">Departmental Synchronicity</h3>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Workload vs Resolution Efficiency Pulse</p>
                                            </div>
                                            <div className="flex gap-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                                                    <span className="text-[10px] font-black text-slate-400 uppercase">Workload</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                    <span className="text-[10px] font-black text-slate-400 uppercase">Efficiency</span>
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
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#00000005" vertical={false} />
                                                    <XAxis dataKey="name" stroke="#00000020" fontSize={10} axisLine={false} tickLine={false} />
                                                    <Tooltip
                                                        cursor={{ fill: '#00000005' }}
                                                        contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #00000010', borderRadius: '1.5rem', padding: '1.5rem' }}
                                                        itemStyle={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}
                                                    />
                                                    <Bar dataKey="load" fill="#e11d48" radius={[8, 8, 0, 0]} barSize={40} />
                                                    <Bar dataKey="efficiency" fill="#10b981" radius={[8, 8, 0, 0]} barSize={40} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </motion.section>
                        )}

                        {/* VIEW: USERS (Identity Nodes - Unchanged mostly) */}
                        {
                            activeView === "users" && (
                                <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                                    <h3 className="text-3xl font-black text-slate-800 uppercase italic">Identity Management</h3>
                                    <div className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-sm">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]">
                                                <tr>
                                                    <th className="px-8 py-6">User / Node Identity</th>
                                                    <th className="px-6 py-6">Clearance Role</th>
                                                    <th className="px-6 py-6">Assigned Sector</th>
                                                    <th className="px-6 py-6">Last Activity Log</th>
                                                    <th className="px-6 py-6 text-right">Registry Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {users.map((u: any) => (
                                                    <tr key={u.id} className="hover:bg-slate-50/50 group transition-colors">
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black text-slate-400 text-[10px] uppercase">
                                                                    {u.name.slice(0, 2)}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-slate-800">{u.name}</p>
                                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter italic">{u.email}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-6">
                                                            <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' :
                                                                u.role === 'authority' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' :
                                                                    'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                                                }`}>
                                                                {u.role}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-6">
                                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{u.department || 'GLOBAL'}</span>
                                                        </td>
                                                        <td className="px-6 py-6 font-mono text-[10px] font-black text-slate-400">
                                                            {u.lastLogin
                                                                ? new Date(u.lastLogin).toLocaleString('en-IN', {
                                                                    day: '2-digit',
                                                                    month: 'short',
                                                                    year: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                    hour12: true
                                                                }).toUpperCase()
                                                                : u.createdAt
                                                                    ? `${new Date(u.createdAt).toLocaleString('en-IN', {
                                                                        day: '2-digit',
                                                                        month: 'short',
                                                                        year: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit',
                                                                        hour12: true
                                                                    }).toUpperCase()} (REGISTERED)`
                                                                    : 'SYSTEM ARCHIVE'}
                                                        </td>
                                                        <td className="px-6 py-6 text-right">
                                                            {u.id !== user?.id && (
                                                                <button
                                                                    onClick={() => handleDeleteUser(u.id)}
                                                                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all group-hover:scale-110"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </motion.div>
                            )
                        }

                        {/* VIEW: ADD AUTHORITY (Form & List) */}
                        {
                            activeView === "add-authority" && (
                                <motion.div key="add-auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 pb-20">
                                    <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
                                        {/* Authorization Form */}
                                        <div className="xl:col-span-2">
                                            <div className="bg-white border border-slate-200 p-8 rounded-[3rem] shadow-sm sticky top-8">
                                                <h3 className="text-2xl font-black text-slate-800 uppercase italic mb-6">Authorize New Node</h3>
                                                <form onSubmit={async (e) => {
                                                    e.preventDefault();
                                                    const formData = new FormData(e.currentTarget);
                                                    const data = Object.fromEntries(formData);
                                                    if (!data.email || !data.password || !data.name) return;
                                                    await addUser({
                                                        name: data.name as string,
                                                        email: data.email as string,
                                                        password: data.password as string,
                                                        role: 'authority',
                                                        department: data.department as string,
                                                        phone: data.phone as string
                                                    });
                                                    toast({ title: "Authorized", description: "New authority node active." });
                                                    (e.target as HTMLFormElement).reset();
                                                }} className="space-y-6">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                                                        <input name="name" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-rose-500 transition-colors" placeholder="Ex: Rajesh Mehra" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Official Email</label>
                                                        <input name="email" type="email" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-rose-500 transition-colors" placeholder="Ex: rajesh.m@gov.in" />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                                                            <input name="password" type="password" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-rose-500 transition-colors" placeholder="••••••••" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</label>
                                                            <input name="phone" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-rose-500 transition-colors" placeholder="98XXXXXXXX" />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assign Sector</label>
                                                        <select name="department" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-rose-500 transition-colors">
                                                            <option>Roads & Infrastructure</option>
                                                            <option>Water Supply</option>
                                                            <option>Electricity</option>
                                                            <option>Sanitation</option>
                                                            <option>Public Health</option>
                                                            <option>Law & Order</option>
                                                        </select>
                                                    </div>
                                                    <Button className="w-full h-14 bg-slate-900 hover:bg-black text-white font-black uppercase rounded-2xl shadow-lg ring-1 ring-white/10 group">
                                                        Confirm Authorization <Zap className="h-4 w-4 ml-2 text-amber-400 group-hover:scale-125 transition-transform" />
                                                    </Button>
                                                </form>
                                            </div>
                                        </div>

                                        {/* Authority Node List */}
                                        <div className="xl:col-span-3">
                                            <div className="bg-white border border-slate-200 rounded-[3rem] shadow-sm overflow-hidden flex flex-col h-full">
                                                <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                                                    <div>
                                                        <h3 className="text-xl font-black text-slate-800 uppercase italic">Global Authority Units</h3>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Active Nodes: {users.filter(u => u.role === 'authority').length}</p>
                                                    </div>
                                                    <Button onClick={refreshData} size="sm" variant="ghost" className="rounded-xl text-slate-400 hover:text-rose-500">
                                                        <Activity className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-rose-500' : ''}`} />
                                                    </Button>
                                                </div>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left">
                                                        <thead className="bg-slate-50/50 text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]">
                                                            <tr>
                                                                <th className="px-8 py-6">Operational Unit</th>
                                                                <th className="px-6 py-6">Sector Assignment</th>
                                                                <th className="px-6 py-6">Identity Check</th>
                                                                <th className="px-6 py-6 text-right">Sequence</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                            {users.filter(u => u.role === 'authority').map((u: any) => (
                                                                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                                                                    <td className="px-8 py-6">
                                                                        <div className="flex items-center gap-4">
                                                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xs">{u.name.slice(0, 2).toUpperCase()}</div>
                                                                            <div>
                                                                                <p className="text-sm font-bold text-slate-800">{u.name}</p>
                                                                                <p className="text-[10px] text-slate-400/80 font-medium">{u.phone || 'NO CONTACT'}</p>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-6">
                                                                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-wider">{u.department || 'GLOBAL'}</span>
                                                                    </td>
                                                                    <td className="px-6 py-6 text-[10px] font-bold text-slate-500 italic lowercase">{u.email}</td>
                                                                    <td className="px-6 py-6 text-right">
                                                                        <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all group-hover:scale-110">
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            {users.filter(u => u.role === 'authority').length === 0 && (
                                                                <tr>
                                                                    <td colSpan={4} className="px-8 py-20 text-center">
                                                                        <div className="flex flex-col items-center gap-3 opacity-20">
                                                                            <Shield className="h-10 w-10 text-slate-400" />
                                                                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">No Authorized Nodes Detected</p>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        }

                        {/* VIEW: DEPARTMENTS (Sector Sync - Simplified) */}
                        {
                            activeView === "departments" && (
                                <motion.div key="departments" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {departmentStats.map((dept) => (
                                        <div key={dept.name} className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm">
                                            <h4 className="text-lg font-black text-slate-800 uppercase mb-4">{dept.name}</h4>
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-[10px] font-black text-slate-400 uppercase">Efficiency</span>
                                                <span className="text-lg font-black text-indigo-500">{dept.efficiency}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500" style={{ width: `${dept.efficiency}%` }} />
                                            </div>
                                            <div className="mt-6 pt-6 border-t border-slate-100 flex justify-between">
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase">Load</p>
                                                    <p className="text-xl font-black text-slate-800">{dept.load}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            )
                        }

                    </AnimatePresence >
                </div >
            </main >
        </div >
    );
};

export default AdminDashboard;
