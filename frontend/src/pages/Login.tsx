import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { User, Building2, ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight, Shield, Sparkles, Brain, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

const roleConfig = {
    citizen: {
        icon: User,
        label: "Citizen",
        desc: "File & track complaints",
        gradient: "from-teal-400 to-emerald-500",
        bg: "bg-teal-50",
        border: "border-teal-200",
        ring: "ring-teal-300",
    },
    authority: {
        icon: Building2,
        label: "Authority",
        desc: "Manage & resolve grievances",
        gradient: "from-blue-400 to-indigo-500",
        bg: "bg-blue-50",
        border: "border-blue-200",
        ring: "ring-blue-300",
    },
    admin: {
        icon: ShieldCheck,
        label: "Super Admin",
        desc: "System-wide control",
        gradient: "from-purple-400 to-pink-500",
        bg: "bg-purple-50",
        border: "border-purple-200",
        ring: "ring-purple-300",
    },
};

const Login = () => {
    const [selectedRole, setSelectedRole] = useState<UserRole>("citizen");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const config = roleConfig[selectedRole];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            toast({ title: "Please fill in all fields", variant: "destructive" });
            return;
        }
        setIsLoading(true);
        const result = await login(email.toLowerCase().trim(), password, selectedRole);
        setIsLoading(false);

        if (result.success) {
            toast({ title: "Welcome back! 🎉", description: "Redirecting to your dashboard..." });
            const routes = { citizen: "/citizen-dashboard", authority: "/authority-dashboard", admin: "/admin-dashboard" };
            navigate(routes[selectedRole]);
        } else {
            toast({ title: "Login failed", description: result.message, variant: "destructive" });
        }
    };


    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Visual */}
            <div className="hidden lg:flex lg:w-1/2 hero-gradient relative overflow-hidden items-center justify-center p-12">
                {/* Background effects */}
                <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-primary/10 blur-[100px] animate-float-slow" />
                <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-blue-500/8 blur-[80px] animate-float" />

                <div className="relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center mx-auto mb-8 shadow-xl shadow-primary/30">
                            <Shield className="h-10 w-10 text-white" />
                        </div>
                        <h2 className="font-display text-4xl font-bold text-hero-foreground mb-4">
                            Welcome to<br /><span className="text-gradient-vivid">GrievanceAI</span>
                        </h2>
                        <p className="text-hero-muted text-lg max-w-md mx-auto leading-relaxed">
                            India's first AI-powered civic grievance platform. Your voice matters.
                        </p>

                        <div className="mt-12 space-y-4 max-w-sm mx-auto">
                            {[
                                { icon: Brain, text: "AI Auto-Classification" },
                                { icon: Sparkles, text: "Smart Priority Detection" },
                                { icon: ChevronRight, text: "Real-Time Tracking" },
                            ].map((item, i) => (
                                <motion.div
                                    key={item.text}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 + i * 0.15 }}
                                    className="flex items-center gap-3 glass-dark rounded-xl px-4 py-3"
                                >
                                    <item.icon className="h-5 w-5 text-primary" />
                                    <span className="text-sm text-hero-muted font-medium">{item.text}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-background bg-mesh-gradient">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    <div className="text-center mb-8">
                        <Link to="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-6">
                            <Shield className="h-5 w-5" />
                            <span className="font-display font-bold">GrievanceAI</span>
                        </Link>
                        <h1 className="font-display text-3xl font-bold text-foreground mt-4">Sign In</h1>
                        <p className="text-muted-foreground mt-1">Choose your role and enter credentials</p>
                    </div>

                    {/* Role Selection */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        {(Object.keys(roleConfig) as UserRole[]).map(role => {
                            const rc = roleConfig[role];
                            const isActive = selectedRole === role;
                            return (
                                <button
                                    key={role}
                                    onClick={() => setSelectedRole(role)}
                                    className={`relative p-3 rounded-xl border-2 text-center transition-all duration-300 ${isActive
                                        ? `${rc.border} ${rc.bg} ring-2 ${rc.ring} shadow-lg -translate-y-1`
                                        : "border-border bg-card hover:border-muted-foreground/20"
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center ${isActive ? `bg-gradient-to-br ${rc.gradient} text-white shadow-md` : "bg-muted text-muted-foreground"
                                        }`}>
                                        <rc.icon className="h-5 w-5" />
                                    </div>
                                    <p className={`text-xs font-semibold ${isActive ? "text-foreground" : "text-muted-foreground"}`}>{rc.label}</p>
                                    <p className="text-[9px] text-muted-foreground mt-0.5 hidden sm:block">{rc.desc}</p>
                                </button>
                            );
                        })}
                    </div>


                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    autoComplete="email"
                                    className="pl-10 h-12"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                    className="pl-10 pr-10 h-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full h-12 bg-gradient-to-r ${config.gradient} text-white shadow-lg hover:shadow-xl transition-all duration-300 font-semibold text-sm gap-2`}
                        >
                            {isLoading ? (
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <config.icon className="h-4 w-4" />
                            )}
                            {isLoading ? "Signing in..." : `Sign in as ${config.label}`}
                        </Button>
                    </form>

                    {selectedRole === 'citizen' && (
                        <p className="text-center text-sm text-muted-foreground mt-6">
                            Don't have an account?{" "}
                            <Link to="/signup" className="text-primary font-semibold hover:underline">
                                Create one
                            </Link>
                        </p>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
