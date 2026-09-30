import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { User, Building2, ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight, Shield, Sparkles, UserPlus, Phone, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

const Signup = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
    });

    const update = (field: string, value: string) =>
        setFormData(prev => ({ ...prev, [field]: value }));

    const [step, setStep] = useState<"signup" | "otp">("signup");
    const [otp, setOtp] = useState("");
    const [userId, setUserId] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (step === "signup") {
            // Basic required check
            if (!formData.name || !formData.email || !formData.password || !formData.phone) {
                toast({ title: "Please fill all required fields", variant: "destructive" });
                return;
            }

            // Name Validation: Only alphabets and spaces
            if (!/^[a-zA-Z\s]+$/.test(formData.name)) {
                toast({ title: "Invalid Name", description: "Name must contain only letters and spaces", variant: "destructive" });
                return;
            }

            // Phone Validation: Exactly 10 digits
            const phoneClean = formData.phone.replace(/^\+91\s?/, '').replace(/\D/g, '');
            if (!/^\d{10}$/.test(phoneClean)) {
                toast({ title: "Invalid Phone", description: "Phone number must be exactly 10 digits", variant: "destructive" });
                return;
            }

            // Password Validation: Strong combination
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
            if (!passwordRegex.test(formData.password)) {
                toast({
                    title: "Weak Password",
                    description: "Password must have at least 8 chars, 1 uppercase, 1 lowercase, 1 number, and 1 special char.",
                    variant: "destructive"
                });
                return;
            }

            setIsLoading(true);
            try {
                // Call Signup API directly or via context? 
                // Context usually auto-logs in, but we need OTP now.
                // Assuming useAuth().signup is updated or we call fetch here.
                // Let's modify the useAuth().signup later if needed, but for now let's use direct fetch or assume signup returns specific structure.

                // Since I can't easily see AuthContext implementation right now, I'll use direct fetch for signup to separate the flow
                // OR I can use the existing signup function if it returns the raw response. 
                // Let's assume `signup` in AuthContext might try to set user state. 
                // Safer to do a direct fetch here to control the flow.

                const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5002/api"}/auth/signup`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: formData.name,
                        email: formData.email.toLowerCase().trim(),
                        password: formData.password,
                        phone: formData.phone,
                        role: "citizen"
                    })
                });

                const data = await res.json();

                if (data.success && data.otpRequired) {
                    setUserId(data.userId);
                    setStep("otp");
                    toast({ title: "OTP Sent! 📧", description: data.msg || `Please check ${formData.email} for your code.` });
                } else {
                    toast({ title: "Signup Failed", description: data.message, variant: "destructive" });
                }
            } catch (err) {
                toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        } else {
            // Verify OTP Step
            if (!otp || otp.length !== 6) {
                toast({ title: "Invalid OTP", description: "Please enter a 6-digit code.", variant: "destructive" });
                return;
            }

            setIsLoading(true);
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5002/api"}/auth/verify-otp`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId, otp })
                });
                const data = await res.json();

                if (data.success) {
                    // Manually trigger login in context (assuming there's a way, or just save token)
                    // The best way is to use the `signup` function from context if it handled this, 
                    // but since we did manual fetch, we need to save token and state manually or reload.
                    // Let's rely on localStorage + window.location or see if we can use a context method.
                    localStorage.setItem("grievanceai_token", data.token);
                    localStorage.setItem("grievanceai_user", JSON.stringify(data.user));

                    // Force context reload or simple redirect
                    // window.location.href = "/citizen-dashboard"; // excessive force

                    toast({ title: "Verified! 🎉", description: data.msg || "Welcome to GrievanceAI." });
                    navigate("/citizen-dashboard");
                    // Refresh page to sync context if needed
                    window.location.reload();
                } else {
                    toast({ title: "Verification Failed", description: data.message, variant: "destructive" });
                }
            } catch (err) {
                toast({ title: "Error", description: "Verification failed.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Visual */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-between hero-gradient p-12 relative overflow-hidden">
                {/* Visual content identifying the platform */}
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    {Array.from({ length: 20 }).map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-2 h-2 bg-white rounded-full"
                            animate={{
                                y: [0, -500],
                                x: [Math.random() * 800, Math.random() * 800],
                                opacity: [0, 1, 0],
                            }}
                            transition={{
                                duration: 5 + Math.random() * 5,
                                repeat: Infinity,
                                delay: Math.random() * 5,
                            }}
                        />
                    ))}
                </div>

                <Link to="/" className="flex items-center gap-2 relative z-10 transition-transform hover:scale-105 w-fit">
                    <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">
                        <Shield className="h-8 w-8 text-primary" />
                    </div>
                    <span className="font-display text-2xl font-bold text-white tracking-tight">GrievanceAI</span>
                </Link>

                <div className="relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h2 className="font-display text-5xl font-bold text-white leading-tight mb-6">
                            {step === "otp" ? "Verify Your Identity" : "Empowering Citizens Through Technology"}
                        </h2>
                        <p className="text-white/70 text-lg max-w-md leading-relaxed mb-8">
                            {step === "otp" ? "We sent a code to your email. Enter it to activate your account." : "Join the evolution of digital governance. Our AI ensures your concerns are heard and acted upon."}
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="glass-dark p-5 rounded-2xl border border-white/10">
                                <p className="text-3xl font-bold text-white mb-1">24k+</p>
                                <p className="text-xs text-white/50 uppercase tracking-widest font-semibold">Active Users</p>
                            </div>
                            <div className="glass-dark p-5 rounded-2xl border border-white/10">
                                <p className="text-3xl font-bold text-white mb-1">92%</p>
                                <p className="text-xs text-white/50 uppercase tracking-widest font-semibold">Resolution Rate</p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <div className="relative z-10 flex items-center gap-2 text-white/40 text-sm">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>India's smartest public grievance system</span>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-background bg-mesh-gradient">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full max-w-md"
                >
                    <div className="lg:hidden text-center mb-8">
                        <Shield className="h-10 w-10 text-primary mx-auto mb-2" />
                        <h1 className="font-display text-2xl font-bold">GrievanceAI</h1>
                    </div>

                    <div className="mb-8">
                        <h2 className="font-display text-3xl font-bold text-foreground">{step === "otp" ? "Enter OTP" : "Create Account"}</h2>
                        <p className="text-muted-foreground mt-1">{step === "otp" ? `Code sent to ${formData.email}` : "Join the community of proactive citizens"}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {step === "signup" ? (
                            <>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name</Label>
                                    <div className="relative">
                                        <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Enter your name"
                                            value={formData.name}
                                            onChange={e => update("name", e.target.value)}
                                            autoComplete="name"
                                            className="pl-10 h-12 focus:ring-primary/20"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="email"
                                            placeholder="mail@example.com"
                                            value={formData.email}
                                            onChange={e => update("email", e.target.value)}
                                            autoComplete="email"
                                            className="pl-10 h-12 focus:ring-primary/20"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Phone</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="+91 XXXXX XXXXX"
                                            value={formData.phone}
                                            onChange={e => update("phone", e.target.value)}
                                            autoComplete="tel"
                                            className="pl-10 h-12 focus:ring-primary/20"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Min. 8 characters"
                                            value={formData.password}
                                            onChange={e => update("password", e.target.value)}
                                            autoComplete="new-password"
                                            className="pl-10 pr-10 h-12 focus:ring-primary/20"
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
                            </>
                        ) : (
                            <div className="space-y-4">
                                <FormInput
                                    label="One-Time Password"
                                    placeholder="XXXXXX"
                                    value={otp}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                        setOtp(val);
                                    }}
                                    icon={<ShieldCheck className="w-4 h-4 text-muted-foreground" />}
                                    className="text-center text-2xl tracking-[0.5em] font-mono h-16"
                                />
                                <div className="text-center">
                                    <button
                                        type="button"
                                        className="text-sm text-primary hover:underline"
                                        onClick={async () => {
                                            toast({ title: "Resending Code...", description: "Please wait." });
                                            try {
                                                // Resend Endpoint Call here
                                                await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5002/api"}/auth/resend-otp`, {
                                                    method: "POST",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({ userId })
                                                });
                                                toast({ title: "Code Resent", description: "Check your email." });
                                            } catch (e) {
                                                toast({ title: "Error", description: "Failed to resend." });
                                            }
                                        }}
                                    >
                                        Resend Code
                                    </button>
                                </div>
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full h-12 mt-6 bg-gradient-to-r from-teal-400 to-emerald-500 text-white shadow-xl hover:shadow-2xl transition-all duration-300 font-bold group`}
                        >
                            {isLoading ? (
                                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <span className="flex items-center gap-2">
                                    {step === "signup" ? "Create Account" : "Verify & Login"} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </span>
                            )}
                        </Button>
                    </form>

                    {step === "signup" && (
                        <p className="mt-8 text-center text-sm text-muted-foreground">
                            Already have an account?{" "}
                            <Link to="/login" className="text-primary font-bold hover:underline">
                                Log in here
                            </Link>
                        </p>
                    )}

                    {step === "otp" && (
                        <p className="mt-8 text-center text-sm text-muted-foreground">
                            Wrong email?{" "}
                            <button onClick={() => setStep("signup")} className="text-primary font-bold hover:underline">
                                Go Back
                            </button>
                        </p>
                    )}

                    <div className="mt-10 pt-6 border-t border-border flex items-center justify-center gap-6 opacity-30">
                        <Shield className="h-5 w-5" />
                        <Sparkles className="h-5 w-5" />
                        <Building2 className="h-5 w-5" />
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

// Helper component for cleaner code
const FormInput = ({ label, icon, className, ...props }: any) => (
    <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</Label>
        <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground">
                {icon}
            </div>
            <Input {...props} className={`pl-10 h-12 focus:ring-primary/20 ${className}`} />
        </div>
    </div>
);

export default Signup;
