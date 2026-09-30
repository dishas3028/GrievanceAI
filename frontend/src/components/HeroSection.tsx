import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, ArrowRight, Sparkles, Brain, Zap, Globe2, CheckCircle2, Target, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

const floatingIcons = [
  { icon: "📋", top: "15%", left: "8%", delay: 0, size: "text-3xl" },
  { icon: "🛡️", top: "25%", right: "12%", delay: 1, size: "text-2xl" },
  { icon: "⚡", bottom: "30%", left: "5%", delay: 2, size: "text-2xl" },
  { icon: "🎯", top: "60%", right: "8%", delay: 0.5, size: "text-3xl" },
];

const projectFeatures = [
  { label: "Neural Classification", value: "AI engine auto-categorizes every report with 95% accuracy.", icon: Brain, gradient: "from-blue-400 to-indigo-600" },
  { label: "Sentiment Pulse", value: "Detects emotional urgency to prioritize critical safety issues.", icon: Zap, gradient: "from-amber-400 to-orange-600" },
  { label: "Smart Routing", value: "Automatically directs cases to the relevant local authority.", icon: Globe2, gradient: "from-teal-400 to-emerald-600" },
  { label: "Live Transparency", value: "Citizens track every step of resolution in real-time.", icon: Shield, gradient: "from-purple-400 to-pink-600" },
  { label: "Predictive Analytics", value: "Anticipates civic issues before they escalate into crises.", icon: Target, gradient: "from-rose-400 to-red-600" },
  { label: "Cross-Unit Sync", value: "Multi-department collaboration for complex city problems.", icon: Activity, gradient: "from-cyan-400 to-blue-600" },
  { label: "Semantic Integrity", value: "Advanced verification of submitted data for maximum reliability.", icon: Sparkles, gradient: "from-indigo-400 to-purple-600" },
  { label: "Dynamic Triage", value: "Real-time resource allocation based on incident severity.", icon: Zap, gradient: "from-emerald-400 to-teal-600" },
];

const HeroSection = () => {
  return (
    <section className="relative min-h-[100vh] hero-gradient overflow-hidden flex items-center">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px"
        }} />

        {/* Glowing Orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px] animate-float-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-blue-500/8 blur-[100px] animate-float-delay" />
        <div className="absolute top-1/2 right-1/3 w-[300px] h-[300px] rounded-full bg-purple-500/5 blur-[80px] animate-float" />

        {/* Floating Icons */}
        {floatingIcons.map((item, i) => (
          <motion.div
            key={i}
            className={`absolute ${item.size} opacity-20`}
            style={{ top: item.top, left: item.left, right: item.right, bottom: item.bottom }}
            animate={{ y: [0, -20, 0], rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 5 + i, delay: item.delay, ease: "easeInOut" }}
          >
            {item.icon}
          </motion.div>
        ))}

        {/* Particle dots */}
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary/20 rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10 pt-24 pb-16">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
          >
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">AI-Powered Civic Engagement Platform</span>
            <ArrowRight className="h-3.5 w-3.5 text-primary" />
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="font-display text-5xl md:text-7xl font-bold text-hero-foreground leading-tight mb-6"
          >
            Your Voice,{" "}
            <span className="relative inline-block">
              <span className="text-gradient-vivid">Amplified</span>
              <motion.span
                className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary to-teal-400 rounded-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              />
            </span>
            <br />
            By{" "}
            <span className="relative inline-block">
              <span className="text-gradient-vivid">Intelligence</span>
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-lg md:text-xl text-hero-muted max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            India's first AI-powered grievance resolution system. File complaints, track progress in real-time,
            and let our intelligent system ensure your voice reaches the right authority — <span className="text-primary font-medium">instantly</span>.
          </motion.p>

          {/* CTA Buttons - Widened as requested */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col items-center justify-center max-w-4xl mx-auto mb-16 px-4"
          >
            <Link to="/signup" className="w-full">
              <Button className="w-full h-24 bg-gradient-to-r from-primary via-indigo-600 to-teal-500 text-white px-10 text-3xl font-black shadow-[0_20px_50px_rgba(79,70,229,0.4)] hover:shadow-[0_20px_60px_rgba(79,70,229,0.6)] transition-all duration-500 hover:scale-[1.01] rounded-[2rem] gap-6 group border-none">
                Get Started Free
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <ArrowRight className="h-6 w-6 group-hover:translate-x-1.5 transition-transform" />
                </div>
              </Button>
            </Link>
          </motion.div>

          {/* Feature Pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-wrap justify-center gap-3 mb-16"
          >
            {[
              { icon: Brain, text: "AI Auto-Categorization" },
              { icon: Zap, text: "Instant Priority Detection" },
              { icon: Globe2, text: "Multi-District Coverage" },
              { icon: CheckCircle2, text: "Real-Time Tracking" },
            ].map((feature, i) => (
              <motion.div
                key={feature.text}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full glass-dark hover:bg-white/10 transition-colors border border-white/5"
              >
                <feature.icon className="h-4 w-4 text-primary" />
                <span className="text-sm text-hero-muted font-medium">{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* New Project Features Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto"
          >
            {projectFeatures.map((feat, i) => (
              <motion.div
                key={feat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + i * 0.1 }}
                className="glass-dark rounded-[2rem] p-6 text-left group hover:bg-white/10 transition-all duration-500 hover:-translate-y-2 border border-white/5"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feat.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <feat.icon className="h-6 w-6 text-white" />
                </div>
                <p className="font-display text-lg font-bold text-white mb-2">{feat.label}</p>
                <p className="text-xs text-hero-muted font-medium leading-relaxed">{feat.value}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>


      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" className="w-full">
          <path d="M0 120L60 105C120 90 240 60 360 50C480 40 600 50 720 55C840 60 960 60 1080 55C1200 50 1320 40 1380 35L1440 30V120H0Z" fill="hsl(200 20% 97%)" />
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
