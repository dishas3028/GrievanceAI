import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, FileText, Clock, AlertCircle, CheckCircle2, Plus, Search,
  Bell, LogOut, User, MapPin, Calendar, TrendingUp, Filter,
  ChevronRight, XCircle, AlertTriangle, Star, Award, Sparkles,
  Shield, Zap, Eye, MessageSquare, ThumbsUp, ArrowUpRight,
  BarChart3, Sun, Moon, CloudSun, Sunrise, Activity, Target, CircleDot,
  Heart, Users, Brain
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth, Grievance } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import AIChatWidget from "@/components/AIChatWidget";

const tabs = ["All", "Submitted", "In Progress", "Resolved", "Rejected"];

const priorityConfig: Record<string, { color: string; bg: string; border: string; glow: string }> = {
  low: { color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200", glow: "" },
  medium: { color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", glow: "" },
  high: { color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200", glow: "shadow-orange-100" },
  critical: { color: "text-red-600", bg: "bg-red-50", border: "border-red-200", glow: "shadow-red-100" },
};

const statusConfig: Record<string, { color: string; bg: string; icon: typeof FileText; gradient: string }> = {
  submitted: { color: "text-blue-600", bg: "bg-blue-50", icon: FileText, gradient: "from-blue-500 to-blue-600" },
  pending: { color: "text-amber-600", bg: "bg-amber-50", icon: Clock, gradient: "from-amber-500 to-amber-600" },
  "in-progress": { color: "text-indigo-600", bg: "bg-indigo-50", icon: AlertCircle, gradient: "from-indigo-500 to-indigo-600" },
  resolved: { color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle2, gradient: "from-emerald-500 to-emerald-600" },
  rejected: { color: "text-red-600", bg: "bg-red-50", icon: XCircle, gradient: "from-red-500 to-red-600" },
};

const quickComplaintTypes = [
  { icon: "🛣️", label: "Road Issue", category: "Roads & Infrastructure" },
  { icon: "💧", label: "Water Problem", category: "Water Supply" },
  { icon: "⚡", label: "Power Outage", category: "Electricity" },
  { icon: "🗑️", label: "Sanitation", category: "Sanitation" },
  { icon: "🚌", label: "Transport", category: "Public Transport" },
  { icon: "🏥", label: "Healthcare", category: "Healthcare" },
  { icon: "🎓", label: "Education", category: "Education" },
  { icon: "👮", label: "Law/Order", category: "Law & Order" },
  { icon: "📋", label: "Other", category: "Other" },
];

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 6) return { text: "Good Night", icon: Moon, emoji: "🌙" };
  if (hour < 12) return { text: "Good Morning", icon: Sunrise, emoji: "☀️" };
  if (hour < 17) return { text: "Good Afternoon", icon: Sun, emoji: "🌤️" };
  if (hour < 21) return { text: "Good Evening", icon: CloudSun, emoji: "🌆" };
  return { text: "Good Night", icon: Moon, emoji: "🌙" };
};

// Animated counter hook
const useCounter = (target: number, duration: number = 1000) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
};

// Progress steps component
const SmallProgressTracker = ({ status }: { status: Grievance["status"] }) => {
  const statusOrder = ["submitted", "pending", "in-progress", "resolved"];
  const currentIndex = statusOrder.indexOf(status);
  const isRejected = status === "rejected";

  if (isRejected) {
    return (
      <div className="flex items-center gap-2 mt-2 py-1.5 px-3 bg-red-500/5 border border-red-500/20 rounded-full w-fit">
        <XCircle className="h-3 w-3 text-red-500" />
        <span className="text-[10px] font-black uppercase text-red-500 tracking-widest">Case Voided / Rejected</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 mt-3">
      <div className="flex justify-between items-center px-0.5">
        <span className="text-[9px] font-black text-primary/60 uppercase tracking-widest">Neural Progress</span>
        <span className="text-[9px] font-black text-primary uppercase tracking-widest">
          {status === 'resolved' ? '100%' : status === 'in-progress' ? '65%' : status === 'pending' ? '30%' : '10%'}
        </span>
      </div>
      <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden p-0.5 border border-border/20">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${status === 'resolved' ? 100 : status === 'in-progress' ? 65 : status === 'pending' ? 30 : 10}%` }}
          className={`h-full rounded-full bg-gradient-to-r ${status === 'resolved' ? 'from-emerald-400 to-emerald-600' : 'from-primary to-indigo-600'} shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]`}
        />
      </div>
    </div>
  );
};

// Progress steps component
const ProgressStepper = ({ status }: { status: Grievance["status"] }) => {
  const steps = [
    { label: "Submitted", key: "submitted" },
    { label: "Under Review", key: "pending" },
    { label: "In Progress", key: "in-progress" },
    { label: "Resolved", key: "resolved" },
  ];
  const statusOrder = ["submitted", "pending", "in-progress", "resolved"];
  const currentIndex = statusOrder.indexOf(status);
  const isRejected = status === "rejected";

  return (
    <div className="flex items-center gap-1 w-full">
      {steps.map((step, i) => {
        const isActive = i <= currentIndex && !isRejected;
        const isCurrent = i === currentIndex && !isRejected;
        return (
          <div key={step.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-500 ${isRejected ? "bg-red-100 text-red-500 border-2 border-red-200" :
                isCurrent ? "bg-primary text-white shadow-lg shadow-primary/30 scale-110" :
                  isActive ? "bg-primary/20 text-primary" :
                    "bg-muted text-muted-foreground"
                }`}>
                {isRejected && i === currentIndex ? "✕" : isActive ? "✓" : i + 1}
              </div>
              <span className={`text-[9px] mt-1 font-medium ${isCurrent ? "text-primary" : isActive ? "text-foreground" : "text-muted-foreground"}`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 rounded-full transition-all duration-700 ${isActive && i < currentIndex ? "bg-primary" : "bg-muted"
                }`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

const OfficialUpdates = ({ grievance }: { grievance: Grievance }) => {
  const { reactToUpdate, user } = useAuth();
  const updates = grievance.authorityUpdates || [];

  const handleEmojiClick = async (updateId: string, emoji: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await reactToUpdate(grievance.id, updateId, emoji);
    } catch (err) {
      console.error("Failed to react:", err);
    }
  };

  const emojiList = ["👍", "❤️", "🙏", "😮", "🤔", "👎"];

  return (
    <div className="space-y-4 mt-6" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center ring-1 ring-indigo-500/20">
          <MessageSquare className="w-4 h-4 text-indigo-500" />
        </div>
        <div>
          <h4 className="text-sm font-black uppercase tracking-widest text-foreground">Updates from Authority</h4>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter italic">Official Intelligence Sync</p>
        </div>
      </div>

      {updates.length === 0 ? (
        <div className="p-8 border border-dashed border-border/50 rounded-2xl flex flex-col items-center justify-center text-center bg-muted/5 group hover:bg-muted/10 transition-colors">
          <Activity className="w-5 h-5 text-muted-foreground/30 mb-2 animate-pulse" />
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest italic opacity-40 leading-tight">
            Neural link active. Awaiting transmission from district command.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {updates.slice().reverse().map((update) => (
            <motion.div
              key={update._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 bg-indigo-500/[0.03] border border-indigo-500/10 rounded-2xl relative overflow-hidden group shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-[9px] font-black uppercase text-indigo-500 tracking-widest px-2 py-0.5 bg-indigo-500/10 rounded-full border border-indigo-500/20">Official Transmission</span>
                <span className="text-[9px] text-muted-foreground font-mono">{new Date(update.timestamp).toLocaleString()}</span>
              </div>
              <p className="text-sm text-foreground/90 font-medium leading-relaxed mb-4">
                {update.message}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                {emojiList.map(emoji => {
                  const count = update.reactions?.filter(r => r.emoji === emoji).length || 0;
                  const hasReacted = update.reactions?.some(r => r.emoji === emoji && r.userId === user?.id);
                  return (
                    <button
                      key={emoji}
                      onClick={(e) => handleEmojiClick(update._id, emoji, e)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all border ${hasReacted
                        ? "bg-primary/10 border-primary/30 text-primary shadow-sm scale-110"
                        : "bg-muted/30 border-transparent hover:border-border text-muted-foreground hover:scale-110"
                        }`}
                    >
                      <span className="text-lg">{emoji}</span>
                      {count > 0 && <span className="font-bold text-[10px]">{count}</span>}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
// Satisfaction component
const SatisfactionRating = ({ grievance }: { grievance: Grievance }) => {
  const [rating, setRating] = useState(grievance.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitted, setSubmitted] = useState(!!grievance.rating);
  const [feedback, setFeedback] = useState(grievance.feedback || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateGrievanceFeedback } = useAuth();
  const { toast } = useToast();

  const handleSubmitFeedback = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!rating) return;
    setIsSubmitting(true);
    try {
      await updateGrievanceFeedback(grievance.id, rating, feedback);
      setSubmitted(true);
      toast({
        title: "Feedback Synced",
        description: "Your review has been successfully transmitted to the district node.",
      });
    } catch (err) {
      console.error("Feedback submission failed:", err);
      toast({
        title: "Sync Failed",
        description: "Could not transmit feedback. Please check your connection.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col gap-5 p-10 bg-emerald-500/[0.03] border border-emerald-500/20 rounded-[3rem] relative overflow-hidden group mt-6 shadow-2xl"
      >
        <div className="absolute -top-10 -right-10 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <CheckCircle2 className="h-40 w-40 text-emerald-500" />
        </div>
        <div className="flex items-center gap-5 text-emerald-600 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-500/30">
            <ThumbsUp className="h-7 w-7 text-white" />
          </div>
          <div>
            <h4 className="text-xl font-black uppercase tracking-tighter italic">Transmission Confirmed</h4>
            <div className="flex gap-1 mt-1.5">
              {[1, 2, 3, 4, 5].map(star => (
                <Star key={star} className={`h-4 w-4 ${star <= rating ? "fill-emerald-500 text-emerald-500" : "text-emerald-200"}`} />
              ))}
            </div>
          </div>
        </div>
        <div className="p-6 bg-white border border-emerald-100/50 rounded-2xl shadow-sm relative z-10">
          <p className="text-sm text-emerald-900 font-bold leading-relaxed italic">"{feedback || "Performance metrics logged into the district registry."}"</p>
        </div>
        <div className="flex items-center gap-2 relative z-10">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-[10px] text-emerald-600 font-black uppercase tracking-[0.2em]">Archived on District Node: {new Date().toLocaleDateString()}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="space-y-8 p-10 bg-card border border-border/50 rounded-[3.5rem] shadow-2xl relative overflow-hidden group mt-6"
    >
      {/* Background Decor */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-[100px] group-hover:bg-primary/10 transition-colors" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h4 className="text-2xl font-black text-foreground uppercase tracking-tighter italic">Mission Review</h4>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em] mt-1.5 opacity-60">Quantify resolution efficiency</p>
        </div>
        <div className="flex gap-2.5 p-3 bg-muted/30 rounded-[2rem] border border-border/50 shadow-inner">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={(e) => { e.stopPropagation(); setRating(star); }}
              className="group transition-all hover:scale-125 active:scale-90"
            >
              <Star className={`h-8 w-8 transition-all duration-300 ${star <= (hoverRating || rating)
                ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]"
                : "text-muted-foreground/10 group-hover:text-amber-200"
                }`} />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <label className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground opacity-50">Pulse Commentary</label>
          <span className="text-[10px] font-black text-muted-foreground/30">{feedback.length}/500</span>
        </div>
        <textarea
          value={feedback}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => { e.stopPropagation(); setFeedback(e.target.value); }}
          placeholder="Describe the final outcome & efficiency..."
          className="w-full min-h-[160px] bg-muted/20 border border-border/50 rounded-[2.5rem] p-8 text-sm font-bold text-foreground focus:ring-8 focus:ring-primary/5 focus:border-primary/20 transition-all resize-none placeholder:text-muted-foreground/20 shadow-inner outline-none"
          maxLength={500}
        />
      </div>

      <Button
        size="lg"
        onClick={handleSubmitFeedback}
        disabled={!rating || isSubmitting}
        className="w-full h-20 bg-[#0f111a] hover:bg-black text-white text-xs font-black uppercase tracking-[0.4em] rounded-[2rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] transition-all active:scale-[0.98] group overflow-hidden relative"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-teal-500 opacity-0 group-hover:opacity-20 transition-opacity" />
        <span className="flex items-center gap-4 relative z-10">
          {isSubmitting ? (
            <>
              <div className="w-6 h-6 border-4 border-white/10 border-t-white rounded-full animate-spin" />
              TRANSMITTING TO NODE...
            </>
          ) : (
            <>
              SEAL FEEDBACK LOOP <Sparkles className="h-6 w-6 group-hover:rotate-12 transition-transform" />
            </>
          )}
        </span>
      </Button>
    </div>
  );
};

const CitizenDashboard = () => {
  const { user, grievances, notifications, logout, getUnreadNotifications, markNotificationRead, refreshData } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedGrievance, setSelectedGrievance] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "compact">("cards");
  const [feedTab, setFeedTab] = useState<"Updates" | "District">("Updates");

  const [publicGrievances, setPublicGrievances] = useState<any[]>([]);
  const [isLiveLoading, setIsLiveLoading] = useState(true);

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5002/api"}/grievances/public`, {
          headers: { "Authorization": `Bearer ${localStorage.getItem("grievanceai_token")}` }
        });
        if (res.ok) {
          const data = await res.json();
          setPublicGrievances(data);
        }
      } catch (err) {
        console.error("Failed to fetch public pulse:", err);
        setPublicGrievances([]);
      } finally {
        setIsLiveLoading(false);
      }
    };
    fetchPublicData();
    const interval = setInterval(fetchPublicData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!user || user.role !== "citizen") return null;

  const greeting = getGreeting();
  // Ensure grievances is an array
  const myGrievances = Array.isArray(grievances)
    ? grievances.filter(g => g.citizenId?.toString() === user.id?.toString())
    : [];
  const unreadNotifs = getUnreadNotifications();
  const myNotifications = Array.isArray(notifications)
    ? notifications.filter(n => n.userId === user.id)
    : [];

  // Dynamic Community Impact Calculation - ensure publicGrievances is an array
  const validPublic = Array.isArray(publicGrievances) ? publicGrievances : [];
  const healthScore = 70 + (validPublic.filter(g => g.category === "Healthcare" && g.status === "resolved").length * 5);
  const safetyIndex = 85 - (validPublic.filter(g => g.priority === "critical").length * 2) + (validPublic.filter(g => g.category === "Law & Order" && g.status === "resolved").length * 3);
  const resourceScore = 60 + (validPublic.filter(g => g.status === "resolved").length * 2);

  // Civic Score (gamification) - Now integrates persistent authority-awarded points
  const civicPoints = (user.points || 0) + (myGrievances.length * 10) + (myGrievances.filter(g => g.status === "resolved").length * 25);
  const civicLevel = civicPoints >= 500 ? "Diamond" : civicPoints >= 250 ? "Gold" : civicPoints >= 100 ? "Silver" : "Bronze";
  const civicColor = civicLevel === "Diamond" ? "text-cyan-400" : civicLevel === "Gold" ? "text-amber-500" : civicLevel === "Silver" ? "text-slate-400" : "text-orange-600";

  const totalCount = useCounter(myGrievances.length);
  const pendingCount = useCounter(myGrievances.filter(g => g.status === "pending" || g.status === "submitted").length);
  const progressCount = useCounter(myGrievances.filter(g => g.status === "in-progress").length);
  const resolvedCount = useCounter(myGrievances.filter(g => g.status === "resolved").length);

  const avgResolutionTime = useMemo(() => {
    const resolved = validPublic.filter(g => g.status === "resolved" && g.resolvedAt && g.createdAt);
    if (resolved.length === 0) return 2.4;
    const totalTime = resolved.reduce((acc, g) => {
      const start = new Date(g.createdAt).getTime();
      const end = new Date(g.resolvedAt).getTime();
      return acc + (end - start);
    }, 0);
    return Math.max(0.5, Number((totalTime / resolved.length / (1000 * 60 * 60 * 24)).toFixed(1)));
  }, [validPublic]);

  const impactLevel = useMemo(() => {
    const last24h = validPublic.filter(g => (Date.now() - new Date(g.createdAt).getTime()) < 24 * 60 * 60 * 1000);
    const resolvedLast24h = last24h.filter(g => g.status === "resolved").length;
    if (resolvedLast24h > 5) return "Rapid Scaling";
    if (resolvedLast24h > 2) return "Growing Fast";
    return "Stable Pulse";
  }, [validPublic]);

  const civicRanking = useMemo(() => {
    if (civicPoints > 500) return "Top 1%";
    if (civicPoints > 200) return "Top 5%";
    if (civicPoints > 100) return "Top 15%";
    if (civicPoints > 50) return "Top 30%";
    return "Rising Star";
  }, [civicPoints]);

  const resolutionRate = myGrievances.length > 0
    ? Math.round((myGrievances.filter(g => g.status === "resolved").length / myGrievances.length) * 100)
    : 0;

  const districtPulse = Math.round((healthScore + safetyIndex) / 2);

  const stats = [
    { label: "Total Filed", value: totalCount, icon: FileText, gradient: "from-primary/80 to-teal-500/80", textColor: "text-white", iconBg: "bg-white/20" },
    { label: "Pending", value: pendingCount, icon: Clock, gradient: "from-amber-400/80 to-orange-500/80", textColor: "text-white", iconBg: "bg-white/20" },
    { label: "In Progress", value: progressCount, icon: Activity, gradient: "from-blue-400/80 to-indigo-500/80", textColor: "text-white", iconBg: "bg-white/20" },
    { label: "Resolved", value: resolvedCount, icon: CheckCircle2, gradient: "from-emerald-400/80 to-green-500/80", textColor: "text-white", iconBg: "bg-white/20" },
  ];

  const filteredGrievances = useMemo(() => {
    return myGrievances
      .filter(g => {
        if (activeTab === "All") return true;
        if (activeTab === "Submitted") return g.status === "submitted" || g.status === "pending";
        if (activeTab === "In Progress") return g.status === "in-progress";
        if (activeTab === "Resolved") return g.status === "resolved";
        if (activeTab === "Rejected") return g.status === "rejected";
        return true;
      })
      .filter(g =>
        search === "" ||
        g.title.toLowerCase().includes(search.toLowerCase()) ||
        g.category.toLowerCase().includes(search.toLowerCase()) ||
        (g.id && g.id.toLowerCase().includes(search.toLowerCase()))
      );
  }, [myGrievances, activeTab, search]);

  return (
    <div className="min-h-screen bg-background bg-mesh-gradient">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-7xl">
          <div className="flex items-center gap-4">
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <div className="h-5 w-px bg-border" />
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-teal-500/20 flex items-center justify-center ring-2 ring-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{user.name}</p>
                <div className="flex items-center gap-1.5">
                  <Award className={`h-3 w-3 ${civicColor}`} />
                  <span className="text-[10px] font-medium text-muted-foreground">{civicLevel} Citizen • {civicPoints} pts</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="hover:bg-red-50 hover:text-red-500" onClick={() => { logout(); navigate("/"); }}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Greeting & Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{greeting.emoji}</span>
                <h1 className="font-display text-3xl font-bold text-foreground">{greeting.text}, {user.name.split(" ")[0]}!</h1>
              </div>
              <p className="text-muted-foreground">Here's your civic engagement overview</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Resolution Rate Badge */}
              <div className="hidden md:flex items-center gap-2.5 bg-card border border-border rounded-xl px-4 py-2.5 shadow-sm">
                <div className="relative w-10 h-10">
                  <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--primary))" strokeWidth="3"
                      strokeDasharray={`${resolutionRate * 0.94} 100`}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground">{resolutionRate}%</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Resolution Rate</p>
                  <p className="text-[10px] text-muted-foreground">Your complaints</p>
                </div>
              </div>

              <Link to="/submit-grievance">
                <Button className="bg-gradient-to-r from-primary to-teal-500 text-white gap-2 shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 hover:scale-[1.02] px-5">
                  <Plus className="h-4 w-4" />
                  New Grievance
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${stat.gradient} p-5 shadow-lg cursor-default group`}
            >
              {/* Decorative circles */}
              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10 group-hover:scale-150 transition-transform duration-700" />
              <div className="absolute -bottom-2 -left-2 w-12 h-12 rounded-full bg-white/5" />

              <div className="relative z-10">
                <div className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center mb-3`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/70 mt-1 font-medium">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h3 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Quick File Complaint
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar">
            <AnimatePresence>
              {quickComplaintTypes.map((type, i) => (
                <motion.div
                  key={type.label}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  whileHover={{ y: -8, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                    delay: i * 0.05
                  }}
                  className="flex-shrink-0"
                >
                  <Link to="/submit-grievance">
                    <button className="flex flex-col items-center gap-4 p-6 rounded-[2.5rem] bg-card/40 backdrop-blur-xl border border-white/10 hover:border-primary/50 hover:shadow-[0_0_40px_-10px_rgba(var(--primary-rgb),0.3)] transition-all duration-500 group min-w-[130px] relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-background/80 to-muted/80 flex items-center justify-center text-4xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl border border-white/5 relative z-10">
                        {type.icon}
                        <div className="absolute -inset-1 bg-primary/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="text-xs font-bold text-foreground/90 tracking-tight relative z-10 group-hover:text-primary transition-colors">{type.label}</span>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary/40 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform origin-center" />
                    </button>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* WHOLLY WORKING FEATURE: Civic Roadmap / Mission Board */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <div className="glass-card rounded-[2rem] p-8 bg-gradient-to-br from-indigo-500/[0.04] to-transparent border-indigo-500/10 relative overflow-hidden">
            <div className="absolute right-0 top-0 p-8 opacity-5">
              <Target className="w-48 h-48 text-indigo-500" />
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div>
                <h3 className="text-2xl font-black flex items-center gap-3 uppercase tracking-tighter italic">
                  <Zap className="w-6 h-6 text-indigo-500" />
                  Active Civic Missions
                </h3>
                <p className="text-sm text-muted-foreground mt-1">Complete objectives to ascend the district hierarchy</p>
              </div>
              <div className="flex items-center gap-3 bg-indigo-500/5 px-4 py-2 rounded-2xl border border-indigo-500/10">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Current Standing:</span>
                <span className={`text-xs font-black uppercase tracking-widest ${civicColor}`}>{civicLevel}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: "Neighborhood Sentinel", desc: "Submit 5 high-priority grievances in your district.", progress: myGrievances.length, total: 5, reward: "100 pts", icon: Shield },
                { title: "Civic Closer", desc: "Help resolve 3 active cases with detailed feedback.", progress: myGrievances.filter(g => g.status === 'resolved' && g.feedback).length, total: 3, reward: "250 pts", icon: CheckCircle2 },
                { title: "Community Pillar", desc: "Earn 5 satisfaction stars from district authorities.", progress: myGrievances.filter(g => g.rating && g.rating >= 4).length, total: 5, reward: "500 pts", icon: Award }
              ].map((mission, idx) => (
                <div key={idx} className="p-6 rounded-3xl bg-white/40 backdrop-blur-md border border-border/50 hover:border-indigo-500/30 transition-all group relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                    <mission.icon className="w-24 h-24 text-indigo-500" />
                  </div>
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                      <mission.icon className="w-5 h-5" />
                    </div>
                    <Badge className="bg-indigo-500/10 text-indigo-600 text-[10px] font-black">{mission.reward}</Badge>
                  </div>
                  <div className="relative z-10">
                    <p className="font-black text-foreground uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{mission.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{mission.desc}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-6 relative z-10">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden p-0.5 border border-border/20">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (mission.progress / mission.total) * 100)}%` }}
                        className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.4)]"
                      />
                    </div>
                    <span className="text-[10px] font-black text-indigo-600">{mission.progress}/{mission.total}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* UNIQUE FEATURE: Neighborhood Health Radar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-8 glass-card rounded-[2rem] p-6 border-primary/20 bg-gradient-to-br from-primary/[0.03] to-transparent overflow-hidden relative"
        >
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-[80px]" />
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative w-40 h-40 flex-shrink-0">
              <svg className="w-full h-full -rotate-90">
                <circle cx="80" cy="80" r="70" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/20" />
                <motion.circle
                  cx="80" cy="80" r="70" fill="none" stroke="currentColor" strokeWidth="8"
                  strokeDasharray="440"
                  initial={{ strokeDashoffset: 440 }}
                  animate={{ strokeDashoffset: 440 - (440 * ((healthScore + safetyIndex) / 2)) / 100 }}
                  transition={{ duration: 2, ease: "easeOut" }}
                  className="text-primary"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-3xl font-black text-foreground">{districtPulse}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">District Pulse</p>
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h4 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  AI Resolution Forecast
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Based on local activity, grievances in your area are currently being resolved in an average of <span className="text-primary font-bold">{avgResolutionTime} days</span>.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                  <p className="text-[10px] uppercase font-bold text-emerald-600 mb-1">Impact Level</p>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <span className="font-bold text-foreground">{impactLevel}</span>
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-primary/5 border border-primary/10">
                  <p className="text-[10px] uppercase font-bold text-primary mb-1">Civic Ranking</p>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-primary" />
                    <span className="font-bold text-foreground">{civicRanking}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Community Impact & Intelligence Hub */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Impact Score Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 glass-card rounded-3xl p-6 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Heart className="w-32 h-32 text-primary" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl text-foreground">Community Social Impact</h3>
                  <p className="text-sm text-muted-foreground">Your contribution to neighborhood wellbeing</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: "Community Health", score: Math.round(healthScore), icon: Activity, color: "text-emerald-500" },
                  { label: "Safety Index", score: Math.round(safetyIndex), icon: Shield, color: "text-blue-500" },
                  { label: "Efficiency", score: Math.round(resourceScore), icon: Zap, color: "text-amber-500" },
                ].map((item, i) => (
                  <div key={item.label} className="bg-background/40 backdrop-blur-sm border border-border/50 rounded-2xl p-4 hover:border-primary/20 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                      <span className="text-lg font-bold text-foreground">{item.score}%</span>
                    </div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">{item.label}</p>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.score}%` }}
                        transition={{ delay: 0.5 + i * 0.1, duration: 1 }}
                        className={`h-full bg-gradient-to-r ${item.color.replace('text', 'bg')} to-transparent opacity-80`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-500/10 via-background to-emerald-500/5 border border-primary/10 p-8 group">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors" />

                <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                  <div className="flex sm:flex-row flex-col items-center gap-6">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                        <Award className="w-8 h-8 text-white" />
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center">
                        <Star className="w-3 h-3 text-white fill-white" />
                      </div>
                    </div>
                    <div className="text-center sm:text-left">
                      <h4 className="text-xl font-black text-foreground uppercase tracking-tight italic">
                        Next Rank: <span className="text-primary">Civic Guardian</span>
                      </h4>
                      <p className="text-sm font-medium text-muted-foreground mt-1">
                        You're <span className="text-foreground font-bold">{Math.max(0, 5 - myGrievances.filter(g => g.status === 'resolved').length)} resolutions</span> away from the elite tier.
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 max-w-md w-full">
                    <div className="flex justify-between items-end mb-3">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Progression Matrix</span>
                      <span className="text-sm font-black text-primary italic">
                        {Math.min(100, Math.round((myGrievances.filter(g => g.status === 'resolved').length / 5) * 100))}%
                      </span>
                    </div>
                    <div className="h-3 w-full bg-muted/50 rounded-full overflow-hidden p-0.5 border border-border/50">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (myGrievances.filter(g => g.status === 'resolved').length / 5) * 100)}%` }}
                        transition={{ duration: 1.5, ease: "circOut" }}
                        className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]"
                      />
                    </div>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="border-primary/20 hover:bg-primary hover:text-white rounded-2xl px-8 h-12 font-black uppercase tracking-widest text-[10px] transition-all group/btn"
                      >
                        Executive Perks <ArrowUpRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#0f111a] border-white/10 rounded-[2.5rem] max-w-2xl p-8">
                      <DialogHeader>
                        <DialogTitle className="text-3xl font-black text-white uppercase tracking-tighter italic flex items-center gap-3">
                          <Award className="h-8 w-8 text-amber-500" />
                          Civic rank benefits
                        </DialogTitle>
                        <DialogDescription className="text-white/40 font-bold uppercase tracking-[0.2em] text-[10px]">
                          Unlock executive system overrides as you ascend the matrix
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                        {[
                          { title: "AI Priority Lane", desc: "Your grievances bypass standard triage queues", icon: Zap, color: "text-amber-500", rank: "Gold" },
                          { title: "Neural Feedback", desc: "Direct override access to authority feedback loops", icon: Brain, color: "text-indigo-400", rank: "Platinum" },
                          { title: "Private Archive", desc: "Unlimited packet storage and deep analytics", icon: FileText, color: "text-emerald-400", rank: "Silver" },
                          { title: "Global Sync", desc: "Instant synchronization across all district nodes", icon: Activity, color: "text-rose-500", rank: "Diamond" },
                        ].map((perk, i) => {
                          const isActive =
                            (perk.rank === "Silver" && (civicLevel === "Silver" || civicLevel === "Gold" || civicLevel === "Diamond")) ||
                            (perk.rank === "Gold" && (civicLevel === "Gold" || civicLevel === "Diamond")) ||
                            (perk.rank === "Diamond" && civicLevel === "Diamond") ||
                            (perk.rank === "Platinum" && civicLevel === "Diamond"); // Assuming Platinum is part of Diamond or higher

                          return (
                            <div key={perk.title} className={`p-6 rounded-3xl group/perk transition-all border ${isActive ? 'bg-primary/5 border-primary/20 hover:bg-primary/10' : 'bg-white/[0.03] border-white/5 opacity-50'}`}>
                              <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 rounded-2xl bg-[#0f111a] flex items-center justify-center border border-white/5 ${perk.color} ${isActive ? 'shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]' : ''}`}>
                                  <perk.icon className="h-6 w-6" />
                                </div>
                                <div className="flex flex-col items-end">
                                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${isActive ? 'bg-primary/20 text-primary' : 'bg-white/5 text-white/40'}`}>
                                    {perk.rank}
                                  </span>
                                  {isActive && <span className="text-[8px] font-black text-emerald-500 uppercase mt-1">● Activated</span>}
                                </div>
                              </div>
                              <h5 className="font-black text-white uppercase tracking-tight mb-2">{perk.title}</h5>
                              <p className="text-xs text-white/40 leading-relaxed font-medium">{perk.desc}</p>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-8 p-6 bg-primary/10 border border-primary/20 rounded-3xl flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Next Unlock</p>
                          <p className="text-white font-bold text-sm mt-1 tracking-tight">AI Priority Lane Dispatcher</p>
                        </div>
                        <Button className="bg-primary hover:bg-primary/80 text-white font-black uppercase tracking-widest text-[9px] rounded-xl px-6">
                          Track Progress
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Smart Multi-Feed Hub */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-3xl p-0 border-primary/10 overflow-hidden flex flex-col h-[500px]"
          >
            <div className="p-6 bg-gradient-to-br from-primary/10 via-background to-transparent border-b border-border/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-primary animate-pulse" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-foreground">Intelligent Feed</h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] font-black tracking-widest text-primary">LIVE</span>
                </div>
              </div>

              <div className="flex gap-2 p-1 bg-muted/30 rounded-xl">
                {["Updates", "District"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFeedTab(tab as any)}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all relative ${feedTab === tab
                      ? "bg-card text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    {tab === "Updates" ? (
                      <div className="flex items-center justify-center gap-1.5">
                        Personal
                        {unreadNotifs.length > 0 && (
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                        )}
                        <span className="opacity-40">({unreadNotifs.length})</span>
                      </div>
                    ) : (
                      "District Pulse"
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4">
              <AnimatePresence mode="popLayout">
                {feedTab === "Updates" ? (
                  <>
                    {myNotifications.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground"
                      >
                        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                          <Bell className="w-8 h-8 opacity-20" />
                        </div>
                        <p className="text-sm font-bold">No active alerts</p>
                      </motion.div>
                    ) : (
                      myNotifications.map((n, i) => (
                        <motion.div
                          key={n.id}
                          initial={{ opacity: 0, x: -20, scale: 0.95 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => markNotificationRead(n.id)}
                          className={`group p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${!n.read
                            ? "bg-primary/[0.03] border-primary/20 shadow-lg shadow-primary/5"
                            : "bg-background border-border hover:border-primary/20"
                            }`}
                        >
                          {!n.read && (
                            <div className="absolute top-0 right-0 p-2">
                              <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                            </div>
                          )}
                          <div className="flex gap-3">
                            <div className={`mt-1 w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${n.type === "success" ? "bg-emerald-500/10 text-emerald-500" :
                              n.type === "warning" ? "bg-amber-500/10 text-amber-500" :
                                "bg-blue-500/10 text-blue-500"
                              }`}>
                              {n.type === "success" ? <CheckCircle2 className="w-4 h-4" /> :
                                n.type === "warning" ? <AlertTriangle className="w-4 h-4" /> :
                                  <Bell className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black text-foreground group-hover:text-primary transition-colors">{n.title}</p>
                              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed line-clamp-2">{n.message}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </>
                ) : (
                  <>
                    {/* Live District Outlook Summary */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 bg-primary/5 border border-primary/10 rounded-2xl mb-4"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">AI District Summary</span>
                      </div>
                      <p className="text-[11px] text-primary/80 font-bold italic leading-tight">
                        "High resolution efficiency in Sanitation node. Critical activity detected in Road Infrastructure (Sector 12). Overall district stability: 88%."
                      </p>
                    </motion.div>

                    {isLiveLoading ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                      </div>
                    ) : publicGrievances.length === 0 ? (
                      <p className="text-center text-xs text-muted-foreground py-10 italic">Quiet in the district.</p>
                    ) : (
                      publicGrievances.slice(0, 10).map((g, i) => {
                        const sConfig = statusConfig[g.status] || statusConfig.submitted;
                        return (
                          <motion.div
                            key={g.id || i}
                            initial={{ opacity: 0, x: 20, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex gap-4 items-center p-4 rounded-3xl bg-background border border-border/50 hover:border-primary/40 hover:shadow-xl transition-all group relative overflow-hidden"
                          >
                            <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${sConfig.gradient} opacity-20`} />

                            <div className="w-12 h-12 rounded-2xl bg-muted/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-sm border border-white/10 shrink-0">
                              {quickComplaintTypes.find(t => t.category === g.category)?.icon || "📝"}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs font-black text-foreground line-clamp-1 uppercase tracking-tight italic group-hover:text-primary transition-colors">{g.title}</p>
                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${sConfig.color} ${sConfig.bg} uppercase tracking-widest`}>
                                  {g.status}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-2.5 w-2.5 text-muted-foreground" />
                                  <span className="text-[9px] text-muted-foreground font-bold">{g.location}</span>
                                </div>
                                <div className="w-1 h-1 rounded-full bg-border" />
                                <span className="text-[9px] text-primary/60 font-black uppercase tracking-tighter">{g.category}</span>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <div className={`w-2 h-2 rounded-full ${g.priority === 'critical' ? 'bg-red-500 animate-pulse' : 'bg-muted'} shadow-[0_0_8px_rgba(239,68,68,0.3)]`} title={`${g.priority} priority`} />
                              <span className="text-[8px] text-muted-foreground font-mono">{new Date(g.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="p-4 bg-muted/10 border-t border-border/50">
              <Button
                onClick={async () => {
                  try {
                    await refreshData();
                    toast({
                      title: "Neural Sync Complete",
                      description: "Your district feed has been synchronized with the central node.",
                    });
                  } catch (err) {
                    toast({
                      title: "Sync Failed",
                      description: "Could not establish a stable connection to the node.",
                      variant: "destructive",
                    });
                  }
                }}
                variant="ghost"
                className="w-full h-10 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-primary/5 transition-all text-primary"
              >
                <Activity className="w-3.5 h-3.5 mr-2 animate-pulse" />
                Synchronize Neural Feed
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Main Grievances Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-4">
            <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              My Grievances
              <span className="ml-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/10 animate-pulse">
                <Activity className="h-2.5 w-2.5" /> Live Sync
              </span>
            </h2>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search grievances..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-card/80 border-border/50"
                />
              </div>
              <div className="flex gap-1 bg-muted/50 rounded-lg p-0.5">
                <button onClick={() => setViewMode("cards")} className={`p-1.5 rounded-md transition-colors ${viewMode === "cards" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
                  <BarChart3 className="h-4 w-4" />
                </button>
                <button onClick={() => setViewMode("compact")} className={`p-1.5 rounded-md transition-colors ${viewMode === "compact" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
                  <Filter className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 overflow-x-auto pb-2 bg-muted/30 rounded-xl p-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-4 py-2.5 text-sm font-medium transition-all duration-300 rounded-lg whitespace-nowrap ${activeTab === tab ? "text-white" : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-primary to-teal-500 rounded-lg shadow-lg shadow-primary/20"
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  />
                )}
                <span className="relative z-10">{tab}</span>
              </button>
            ))}
          </div>

          {/* Grievance Cards or Empty State */}
          {filteredGrievances.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center glass-card rounded-2xl"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/10 to-teal-500/10 flex items-center justify-center mb-5"
              >
                <FileText className="h-10 w-10 text-primary/30" />
              </motion.div>
              <h3 className="text-lg font-display font-bold text-foreground">No grievances found</h3>
              <p className="text-muted-foreground mt-1 mb-6 max-w-sm">
                {activeTab === "All"
                  ? "You haven't submitted any grievances yet. Your voice matters — file your first complaint!"
                  : `No ${activeTab.toLowerCase()} grievances at the moment.`
                }
              </p>
              <Link to="/submit-grievance">
                <Button className="bg-gradient-to-r from-primary to-teal-500 text-white gap-2 shadow-lg shadow-primary/20 px-6">
                  <Sparkles className="h-4 w-4" />
                  File Your First Complaint
                </Button>
              </Link>
            </motion.div>
          ) : (
            <div className={viewMode === "cards" ? "grid gap-4" : "space-y-2"}>
              <AnimatePresence>
                {filteredGrievances.map((g, i) => {
                  const sConfig = statusConfig[g.status] || statusConfig.submitted;
                  const pConfig = priorityConfig[g.priority] || priorityConfig.low;
                  const StatusIcon = sConfig.icon;
                  const isExpanded = selectedGrievance === g.id;

                  if (viewMode === "compact") {
                    return (
                      <motion.div
                        key={g.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => setSelectedGrievance(isExpanded ? null : g.id)}
                        className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-4 cursor-pointer hover:border-primary/20 hover:shadow-md transition-all"
                      >
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${sConfig.gradient} flex items-center justify-center flex-shrink-0`}>
                          <StatusIcon className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{g.title}</p>
                          <p className="text-xs text-muted-foreground">{g.category} • {new Date(g.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${pConfig.bg} ${pConfig.color}`}>{g.priority}</span>
                        <span className="text-xs font-mono text-muted-foreground">{g.id}</span>
                      </motion.div>
                    );
                  }

                  return (
                    <motion.div
                      key={g.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      layout
                      onClick={() => setSelectedGrievance(isExpanded ? null : g.id)}
                      className={`bg-card/80 backdrop-blur-sm border rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 group ${isExpanded ? "border-primary/30 shadow-xl shadow-primary/5" : "border-border hover:border-primary/15 hover:shadow-lg"
                        }`}
                    >
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            {/* Tags row */}
                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                              <span className="text-[11px] font-mono text-muted-foreground bg-muted/80 px-2.5 py-0.5 rounded-md tracking-tight">{g.id}</span>
                              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md ${sConfig.bg} ${sConfig.color}`}>
                                {g.status.replace("-", " ").replace(/^./, c => c.toUpperCase())}
                              </span>
                              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md ${pConfig.bg} ${pConfig.color} ${pConfig.glow ? `shadow-sm ${pConfig.glow}` : ""}`}>
                                {g.priority === "critical" && "🔴 "}
                                {g.priority.charAt(0).toUpperCase() + g.priority.slice(1)} Priority
                              </span>

                              {/* Perks Indicators */}
                              {(civicLevel === "Gold" || civicLevel === "Diamond") && (
                                <span className="text-[9px] font-black bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-md border border-amber-500/10 flex items-center gap-1 shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                                  <Zap className="w-2.5 h-2.5" /> AI PRIORITY LANE
                                </span>
                              )}
                              {(civicLevel === "Diamond") && (
                                <span className="text-[9px] font-black bg-rose-500/10 text-rose-600 px-2 py-0.5 rounded-md border border-rose-500/10 flex items-center gap-1">
                                  <Activity className="w-2.5 h-2.5" /> GLOBAL SYNC
                                </span>
                              )}
                            </div>

                            <h3 className="font-display font-semibold text-foreground mb-1.5 text-base group-hover:text-primary transition-colors">{g.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{g.description}</p>

                            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                                <MapPin className="h-3 w-3 text-primary/60" />
                                {g.location}
                              </span>
                              <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                                <Calendar className="h-3 w-3 text-primary/60" />
                                {new Date(g.createdAt).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                                <User className="h-3 w-3 text-primary/60" />
                                {g.citizenName}
                              </span>
                              <span className="hidden sm:flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                                <Target className="h-3 w-3 text-primary/60" />
                                Urgency: {g.urgencyScore}/10
                              </span>
                            </div>

                            {/* ALWAYS VISIBLE PROGRESS TRACKER */}
                            <SmallProgressTracker status={g.status} />
                          </div>

                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${sConfig.gradient} flex items-center justify-center shadow-lg`}>
                              <StatusIcon className="h-5 w-5 text-white" />
                            </div>
                            <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${isExpanded ? "rotate-90" : ""}`} />
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-5 space-y-5">
                              {/* Progress Stepper */}
                              <div className="bg-muted/30 rounded-xl p-4 border border-border/30">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                  <CircleDot className="h-3.5 w-3.5 text-primary" />
                                  Progress Tracker
                                </p>
                                <ProgressStepper status={g.status} />
                              </div>

                              {/* Details Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                  {[
                                    { l: "Category", v: g.category },
                                    { l: "District", v: g.district },
                                    { l: "Assigned To", v: g.assignedDepartment || "Pending assignment" },
                                  ].map(item => (
                                    <div key={item.l} className="bg-muted/30 rounded-lg p-3 border border-border/20">
                                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{item.l}</p>
                                      <p className="text-sm font-medium text-foreground mt-0.5">{item.v}</p>
                                    </div>
                                  ))}
                                </div>
                                <div className="space-y-3">
                                  <div className="bg-muted/30 rounded-lg p-3 border border-border/20">
                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                      <Sparkles className="h-3 w-3 text-primary" />
                                      AI Sentiment
                                    </p>
                                    <p className="text-sm font-medium text-foreground mt-0.5 capitalize">{g.sentiment}</p>
                                  </div>
                                  <div className="bg-muted/30 rounded-lg p-3 border border-border/20">
                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">AI Keywords & Cluster</p>
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                      <span className="text-[10px] bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-full font-bold border border-indigo-500/20">
                                        Group #{g.clusterId || "N/A"}
                                      </span>
                                      {g.keywords.length > 0 ? g.keywords.map(k => (
                                        <span key={k} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{k}</span>
                                      )) : <span className="text-xs text-muted-foreground">None detected</span>}
                                    </div>
                                  </div>
                                  {g.resolutionNotes && (
                                    <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200/50">
                                      <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Resolution Notes</p>
                                      <p className="text-sm text-emerald-800 mt-0.5">{g.resolutionNotes}</p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Timeline */}
                              <div className="bg-muted/30 rounded-xl p-4 border border-border/20">
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">System Timeline</p>
                                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-1.5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-border before:via-border/50 before:to-transparent">

                                  {g.timeline && g.timeline.length > 0 ? (
                                    g.timeline.map((item, idx) => (
                                      <div key={idx} className="relative flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${item.status === 'resolved' ? 'bg-emerald-500 ring-emerald-500/20' :
                                          item.status === 'rejected' ? 'bg-rose-500 ring-rose-500/20' :
                                            item.status === 'in-progress' ? 'bg-indigo-500 ring-indigo-500/20 animate-pulse' :
                                              'bg-blue-500 ring-blue-500/20'
                                          } ring-4 z-10`} />
                                        <div className="flex-1 flex flex-col">
                                          <div className="flex items-center justify-between">
                                            <span className={`text-xs font-extrabold ${item.status === 'resolved' ? 'text-emerald-600' :
                                              item.status === 'rejected' ? 'text-rose-500' :
                                                item.status === 'in-progress' ? 'text-indigo-400' :
                                                  'text-foreground'
                                              } uppercase`}>{item.status}</span>
                                            <span className="text-[9px] text-muted-foreground font-mono">{new Date(item.timestamp).toLocaleString()}</span>
                                          </div>
                                          <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight font-medium">
                                            {item.message}
                                          </p>
                                          {item.status === 'resolved' && g.resolutionNotes && (
                                            <div className="mt-2 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                                              <p className="text-[9px] uppercase font-black text-emerald-600 mb-1">Officer Remarks</p>
                                              <p className="text-[11px] text-emerald-800/80 italic font-medium">"{g.resolutionNotes}"</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="relative flex items-center gap-3">
                                      <div className="w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-500/20 z-10" />
                                      <div className="flex flex-col">
                                        <span className="text-xs font-bold text-foreground">Submission Received</span>
                                        <span className="text-[10px] text-muted-foreground">{new Date(g.createdAt).toLocaleString()}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* SILVER PERK: Neural Analytics */}
                            {(civicLevel === "Silver" || civicLevel === "Gold" || civicLevel === "Diamond") && (
                              <div className="mt-2 p-4 rounded-2xl bg-gradient-to-br from-indigo-500/[0.08] to-emerald-500/[0.04] border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center">
                                      <Brain className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Deep Neural Analytics</span>
                                  </div>
                                  <Badge variant="outline" className="text-[8px] border-emerald-500/20 text-emerald-600 bg-emerald-500/5 uppercase font-black">Rank Verified</Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="bg-white/60 backdrop-blur-sm p-3 rounded-xl border border-indigo-500/10">
                                    <p className="text-[8px] uppercase font-bold text-muted-foreground mb-1">Sentiment Velocity</p>
                                    <p className="text-xs font-black text-indigo-700">{g.sentiment === 'positive' ? 'OPTIMISTIC' : g.sentiment === 'negative' ? 'CRITICAL' : 'STABLE'} • AI DETECTED</p>
                                  </div>
                                  <div className="bg-white/60 backdrop-blur-sm p-3 rounded-xl border border-indigo-500/10">
                                    <p className="text-[8px] uppercase font-bold text-muted-foreground mb-1">Resolution Forecast</p>
                                    <p className="text-xs font-black text-indigo-700">{avgResolutionTime} DAYS EXP.</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* OFFICIAL UPDATES FEATURE */}
                            <OfficialUpdates grievance={g} />

                            {/* Satisfaction Rating - only for resolved */}
                            {g.status === "resolved" && (
                              <div className="bg-gradient-to-r from-primary/5 to-teal-500/5 rounded-xl p-4 border border-primary/10">
                                <SatisfactionRating grievance={g} />
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
      <AIChatWidget />
    </div>
  );
};

export default CitizenDashboard;
