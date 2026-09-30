import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, Shield, BarChart3, Zap, Globe2, Bell, Lock, Users, ArrowRight, Camera, Heart } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    description: "Our NLP engine automatically categorizes your complaint, detects urgency, and analyzes sentiment — processing complaints 10x faster than manual systems.",
    gradient: "from-teal-400 to-emerald-500",
    bgGlow: "bg-teal-500/10",
    stat: "< 2 sec",
    statLabel: "Analysis Time",
  },
  {
    icon: Zap,
    title: "Smart Auto-Routing",
    description: "Grievances are automatically routed to the appropriate department based on AI classification. No more lost complaints or wrong assignments.",
    gradient: "from-amber-400 to-orange-500",
    bgGlow: "bg-amber-500/10",
    stat: "99.2%",
    statLabel: "Accuracy Rate",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description: "Live dashboards with category breakdowns, sentiment heatmaps, department performance metrics, and trend analysis for data-driven governance.",
    gradient: "from-blue-400 to-indigo-500",
    bgGlow: "bg-blue-500/10",
    stat: "24/7",
    statLabel: "Live Monitoring",
  },
  {
    icon: Globe2,
    title: "Multi-District Coverage",
    description: "Covering 42+ districts with localized support. File complaints from anywhere, and our system routes them to your local authority.",
    gradient: "from-purple-400 to-pink-500",
    bgGlow: "bg-purple-500/10",
    stat: "42+",
    statLabel: "Districts",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description: "Get instant alerts on status changes, resolution updates, and important announcements. Never miss an update on your complaint.",
    gradient: "from-rose-400 to-red-500",
    bgGlow: "bg-rose-500/10",
    stat: "Instant",
    statLabel: "Notifications",
  },
  {
    icon: Lock,
    title: "Enterprise Security",
    description: "End-to-end encryption, role-based access control, and audit trails ensure your data and complaints are always protected.",
    gradient: "from-slate-400 to-slate-600",
    bgGlow: "bg-slate-500/10",
    stat: "256-bit",
    statLabel: "Encryption",
  },
  {
    icon: Camera,
    title: "AI Evidence Validation",
    description: "Deep-learning models verify authenticity of image evidence to prevent spam and speed up verification of physical civic issues.",
    gradient: "from-emerald-400 to-teal-500",
    bgGlow: "bg-emerald-500/10",
    stat: "Instant",
    statLabel: "Validation",
  },
  {
    icon: Heart,
    title: "Community Impact Score",
    description: "See the real-world positive change your feedback creates in your local neighborhood through impact metrics and community goals.",
    gradient: "from-pink-400 to-rose-500",
    bgGlow: "bg-pink-500/10",
    stat: "Live",
    statLabel: "Impact Tracking",
  },
];

const FeaturesSection = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section className="py-24 px-4 bg-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-20 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-20 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px]" />

      <div className="container mx-auto max-w-7xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
          >
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Why Choose GrievanceAI</span>
          </motion.div>

          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Powered by <span className="text-gradient-primary">Intelligence</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Every feature is designed to make civic engagement effortless, transparent, and effective.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="relative group"
            >
              <div className={`h-full bg-card border border-border rounded-2xl p-7 transition-all duration-500 ${hoveredIndex === i ? "border-primary/30 shadow-xl shadow-primary/5 -translate-y-2" : "hover:border-primary/10 hover:shadow-lg"
                }`}>
                {/* Glow effect on hover */}
                <div className={`absolute inset-0 rounded-2xl ${feature.bgGlow} opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl`} />

                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="font-display text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                    {feature.description}
                  </p>

                  {/* Stat */}
                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <div>
                      <p className={`font-display text-2xl font-bold bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`}>
                        {feature.stat}
                      </p>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">{feature.statLabel}</p>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
