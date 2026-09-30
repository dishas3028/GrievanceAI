import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Brain, Route, CheckCircle2, ArrowRight } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: Send,
    title: "Submit Your Complaint",
    description: "File your grievance through our intuitive form. Add photos, location, and details. It takes less than 2 minutes.",
    gradient: "from-primary to-teal-500",
    details: ["Smart form with auto-fill", "Photo & document upload", "Semantic Intelligence", "Neural Priority Routing"],
  },
  {
    num: "02",
    icon: Brain,
    title: "AI Analyzes Instantly",
    description: "Our AI engine processes your complaint within seconds — categorizing, detecting urgency, and assigning priority levels.",
    gradient: "from-blue-500 to-indigo-500",
    details: ["NLP text analysis", "Sentiment detection", "Priority scoring", "Keyword extraction"],
  },
  {
    num: "03",
    icon: Route,
    title: "Smart Auto-Routing",
    description: "Your complaint is automatically routed to the right department and authority based on AI classification results.",
    gradient: "from-purple-500 to-pink-500",
    details: ["Department matching", "Authority assignment", "District routing", "Escalation rules"],
  },
  {
    num: "04",
    icon: CheckCircle2,
    title: "Track & Resolve",
    description: "Monitor progress in real-time on your dashboard. Get instant notifications at every step until resolution.",
    gradient: "from-emerald-500 to-green-500",
    details: ["Real-time tracking", "Status notifications", "Resolution feedback", "Satisfaction rating"],
  },
];

const HowItWorksSection = () => {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section className="py-24 px-4 bg-muted/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-mesh-gradient opacity-50" />

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
            <Route className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Simple 4-Step Process</span>
          </motion.div>

          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            How It <span className="text-gradient-primary">Works</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From complaint to resolution — transparent, trackable, and powered by AI at every step.
          </p>
        </motion.div>

        {/* Desktop View */}
        <div className="hidden lg:block">
          {/* Step Indicators */}
          <div className="flex items-center justify-between max-w-4xl mx-auto mb-16 px-8">
            {steps.map((step, i) => (
              <div key={step.num} className="flex items-center flex-1">
                <motion.button
                  onClick={() => setActiveStep(i)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 flex-shrink-0 ${i === activeStep
                    ? `bg-gradient-to-br ${step.gradient} text-white shadow-xl scale-110`
                    : i < activeStep
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                >
                  <step.icon className="h-7 w-7" />
                  {i === activeStep && (
                    <motion.div
                      layoutId="activeStepRing"
                      className="absolute inset-0 rounded-2xl ring-4 ring-primary/20"
                      transition={{ type: "spring", damping: 20 }}
                    />
                  )}
                  <span className={`absolute -top-3 -right-3 w-7 h-7 rounded-full text-[11px] font-bold flex items-center justify-center ${i <= activeStep ? "bg-foreground text-background" : "bg-muted-foreground/20 text-muted-foreground"
                    }`}>
                    {step.num}
                  </span>
                </motion.button>
                {i < steps.length - 1 && (
                  <div className="flex-1 h-1 mx-4 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className={`h-full bg-gradient-to-r ${step.gradient} rounded-full`}
                      initial={{ width: "0%" }}
                      animate={{ width: i < activeStep ? "100%" : "0%" }}
                      transition={{ duration: 0.7, ease: "easeInOut" }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Active Step Content */}
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-card border border-border rounded-3xl p-8 md:p-12 shadow-xl relative overflow-hidden">
              {/* Background glow */}
              <div className={`absolute -top-20 -right-20 w-60 h-60 rounded-full bg-gradient-to-br ${steps[activeStep].gradient} opacity-5 blur-3xl`} />

              <div className="flex flex-col md:flex-row items-start gap-8 relative z-10">
                <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${steps[activeStep].gradient} flex items-center justify-center shadow-xl flex-shrink-0`}>
                  {(() => { const Icon = steps[activeStep].icon; return <Icon className="h-10 w-10 text-white" />; })()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-bold bg-foreground text-background px-2.5 py-1 rounded-full">Step {steps[activeStep].num}</span>
                    <h3 className="font-display text-2xl font-bold text-foreground">{steps[activeStep].title}</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed mb-6 text-lg">{steps[activeStep].description}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {steps[activeStep].details.map((detail, di) => (
                      <motion.div
                        key={detail}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: di * 0.1 }}
                        className="flex items-center gap-2.5 bg-muted/50 rounded-lg px-3 py-2"
                      >
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm font-medium text-foreground">{detail}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Mobile View - Cards */}
        <div className="lg:hidden space-y-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-border rounded-2xl p-6 shadow-lg relative overflow-hidden"
            >
              <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${step.gradient}`} />
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
                  <step.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <span className="text-xs font-bold text-muted-foreground">Step {step.num}</span>
                  <h3 className="font-display text-lg font-bold text-foreground mt-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{step.description}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {step.details.map(d => (
                      <span key={d} className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">{d}</span>
                    ))}
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

export default HowItWorksSection;
