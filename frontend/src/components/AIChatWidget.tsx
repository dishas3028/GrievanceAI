import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User, Sparkles, Loader2, Database, ArrowRight } from "lucide-react";

interface Message {
    id: string;
    text: string;
    sender: "user" | "bot";
    timestamp: Date;
    actionLink?: string;
    actionLabel?: string;
}

const quickActions = [
    "How do I file a complaint?",
    "Track my grievance status",
    "Report a pothole",
    "No water supply",
    "Emergency contacts",
];

import { chatbotDataset, defaultResponse } from "@/data/chatbotKnowledge";

const AIChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            text: "Neural Link Established. I am Sathi AI. 🤖\n\nI have been trained on 5000+ civic scenarios including Roads, Water, Electricity, and Sanitation protocols.\n\nHow can I assist you today?",
            sender: "bot",
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate(); // For programmatic navigation

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (isOpen) inputRef.current?.focus();
    }, [isOpen]);

    const getBotResponse = (userMsg: string): { text: string; actionLink?: string; actionLabel?: string } => {
        const lower = userMsg.toLowerCase().trim();

        // 1. Direct Pattern Matching (Best Match)
        for (const intent of chatbotDataset) {
            for (const pattern of intent.patterns) {
                if (lower.includes(pattern)) {
                    return { text: intent.response, actionLink: intent.actionLink, actionLabel: intent.actionLabel };
                }
            }
        }

        // 2. Keyword Scoring Fallback (Fuzzy Logic)
        let bestMatch = { score: 0, response: defaultResponse, actionLink: undefined as string | undefined, actionLabel: undefined as string | undefined };
        const words = lower.split(" ");

        chatbotDataset.forEach(intent => {
            let score = 0;
            intent.patterns.forEach(pattern => {
                const patternWords = pattern.split(" ");
                // Check how many words from the user query appear in this pattern
                const matches = patternWords.filter(pw => words.includes(pw));
                if (matches.length > 0) {
                    score += matches.length;
                }
            });

            if (score > bestMatch.score) {
                bestMatch = { score, response: intent.response, actionLink: intent.actionLink, actionLabel: intent.actionLabel };
            }
        });

        if (bestMatch.score > 0) return { text: bestMatch.response, actionLink: bestMatch.actionLink, actionLabel: bestMatch.actionLabel };

        return { text: defaultResponse };
    };

    const handleSend = (text?: string) => {
        const msgText = text || input.trim();
        if (!msgText) return;

        const userMsg: Message = {
            id: `user-${Date.now()}`,
            text: msgText,
            sender: "user",
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        // Simulate Neural Processing Time
        setTimeout(() => {
            const response = getBotResponse(msgText);
            const botMsg: Message = {
                id: `bot-${Date.now()}`,
                text: response.text,
                sender: "bot",
                timestamp: new Date(),
                actionLink: response.actionLink,
                actionLabel: response.actionLabel
            };
            setMessages(prev => [...prev, botMsg]);
            setIsTyping(false);
        }, 1000 + Math.random() * 500);
    };

    return (
        <>
            {/* Floating Button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-teal-600 text-white shadow-xl shadow-primary/30 flex items-center justify-center hover:shadow-primary/50 transition-shadow"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={!isOpen ? { y: [0, -6, 0] } : {}}
                transition={!isOpen ? { repeat: Infinity, duration: 3, ease: "easeInOut" } : {}}
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                            <X className="h-5 w-5" />
                        </motion.div>
                    ) : (
                        <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} className="relative">
                            <MessageCircle className="h-5 w-5" />
                            <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed bottom-24 right-6 z-50 w-[380px] h-[520px] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-primary/10 via-teal-500/5 to-primary/10 p-4 border-b border-border">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center">
                                        <Bot className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-card rounded-full" />
                                </div>
                                <div>
                                    <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-1.5">
                                        Sathi AI
                                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                                    </h3>
                                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider flex items-center gap-1">
                                        <Database className="h-3 w-3" /> 5k+ Nodes Active
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-mesh-gradient">
                            {messages.map(msg => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className={`flex gap-2 ${msg.sender === "user" ? "flex-row-reverse" : ""}`}
                                >
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${msg.sender === "bot"
                                        ? "bg-gradient-to-br from-primary/20 to-teal-500/20"
                                        : "bg-primary/10"
                                        }`}>
                                        {msg.sender === "bot" ? <Bot className="h-3.5 w-3.5 text-primary" /> : <User className="h-3.5 w-3.5 text-primary" />}
                                    </div>
                                    <div className={`max-w-[75%] space-y-2`}>
                                        <div className={`rounded-xl px-3.5 py-2.5 ${msg.sender === "user"
                                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                                            : "bg-card border border-border shadow-sm rounded-tl-sm"
                                            }`}>
                                            <p className={`text-xs leading-relaxed whitespace-pre-line ${msg.sender === "user" ? "" : "text-foreground"}`}>
                                                {msg.text}
                                            </p>
                                            <p className={`text-[9px] mt-1.5 ${msg.sender === "user" ? "text-primary-foreground/60" : "text-muted-foreground/60"}`}>
                                                {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </p>
                                        </div>
                                        {msg.actionLink && (
                                            <motion.button
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                onClick={() => {
                                                    setIsOpen(false);
                                                    navigate(msg.actionLink!);
                                                }}
                                                className="text-xs font-bold w-full text-center bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                                            >
                                                {msg.actionLabel || "Proceed"} <ArrowRight className="h-3 w-3" />
                                            </motion.button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}

                            {isTyping && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex gap-2"
                                >
                                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/20 to-teal-500/20 flex items-center justify-center">
                                        <Bot className="h-3.5 w-3.5 text-primary" />
                                    </div>
                                    <div className="bg-card border border-border rounded-xl rounded-tl-sm px-4 py-3 shadow-sm">
                                        <div className="flex gap-1.5">
                                            <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                                            <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                                            <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Actions */}
                        <div className="px-3 py-2 border-t border-border/50 bg-muted/30">
                            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                                {quickActions.map(action => (
                                    <button
                                        key={action}
                                        onClick={() => handleSend(action)}
                                        className="flex-shrink-0 text-[10px] px-2.5 py-1 rounded-full border border-primary/20 text-primary bg-primary/5 hover:bg-primary/10 transition-colors font-medium whitespace-nowrap"
                                    >
                                        {action}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Input */}
                        <div className="p-3 border-t border-border bg-card">
                            <form
                                onSubmit={e => { e.preventDefault(); handleSend(); }}
                                className="flex items-center gap-2"
                            >
                                <input
                                    ref={inputRef}
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    placeholder="Ask about roads, water, etc..."
                                    className="flex-1 text-sm bg-muted/50 border border-border rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all placeholder:text-muted-foreground/50"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim()}
                                    className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AIChatWidget;
