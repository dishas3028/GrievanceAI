import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Star, Users, MessageSquare, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const testimonials = [
  {
    name: "Priya Mehta",
    role: "Citizen, South Delhi",
    text: "Filed a water supply complaint at 8 AM, and by evening it was resolved. The AI routing is incredibly fast!",
    rating: 5,
    avatar: "PM",
  },
  {
    name: "Suresh Patel",
    role: "Citizen, Dwarka",
    text: "Finally a system where I can track my complaints in real-time. No more visiting government offices!",
    rating: 5,
    avatar: "SP",
  },
  {
    name: "Aanya Rao",
    role: "Citizen, East Delhi",
    text: "The AI correctly identified my road safety complaint as critical and it was prioritized immediately.",
    rating: 5,
    avatar: "AR",
  },
];

const CTASection = () => {
  return (
    <section className="relative py-24 px-4 overflow-hidden">
      {/* Testimonials */}
      <div className="container mx-auto max-w-7xl mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">What Citizens Say</span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Trusted by <span className="text-gradient-primary">Thousands</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="bg-card border border-border rounded-2xl p-6 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, si) => (
                  <Star key={si} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5 italic">"{t.text}"</p>
              <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-teal-500/20 flex items-center justify-center text-sm font-bold text-primary">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA Card */}
      <div className="container mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden"
        >
          <div className="hero-gradient p-12 md:p-16 text-center relative">
            {/* Background elements */}
            <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-primary/10 blur-[60px]" />
            <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full bg-blue-500/10 blur-[80px]" />

            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/30"
              >
                <Shield className="h-8 w-8 text-white" />
              </motion.div>

              <h2 className="font-display text-3xl md:text-5xl font-bold text-hero-foreground mb-4">
                Ready to Make Your<br /><span className="text-gradient-vivid">Voice Heard?</span>
              </h2>
              <p className="text-hero-muted text-lg max-w-xl mx-auto mb-8">
                Join thousands of citizens who have already experienced faster, smarter, and transparent grievance resolution.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {/* Buttons removed as requested */}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 text-left">
                {[
                  { icon: Shield, title: "Secure Neural Line", desc: "Military-grade encryption for all reports." },
                  { icon: Zap, title: "Zero Latency Triage", desc: "Instant classification via edge AI." },
                  { icon: Users, title: "Unit Synchronization", desc: "Cross-departmental collaborative routing." },
                ].map((item, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-2xl flex items-start gap-4 hover:bg-white/10 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-widest mb-1">{item.title}</h4>
                      <p className="text-[10px] text-hero-muted font-bold uppercase tracking-tight">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
