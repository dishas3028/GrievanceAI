import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, FileText, Brain, Upload, Send, Sparkles,
  CheckCircle2, AlertTriangle, Tag, MapPin, User, Phone,
  Camera, ChevronRight, CircleDot, Lightbulb, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import LocationPicker from "@/components/LocationPicker";

const categories = [
  { value: "Roads & Infrastructure", emoji: "🛣️", color: "border-orange-200 bg-orange-50 text-orange-700" },
  { value: "Water Supply", emoji: "💧", color: "border-blue-200 bg-blue-50 text-blue-700" },
  { value: "Electricity", emoji: "⚡", color: "border-yellow-200 bg-yellow-50 text-yellow-700" },
  { value: "Sanitation", emoji: "🗑️", color: "border-green-200 bg-green-50 text-green-700" },
  { value: "Public Transport", emoji: "🚌", color: "border-purple-200 bg-purple-50 text-purple-700" },
  { value: "Healthcare", emoji: "🏥", color: "border-red-200 bg-red-50 text-red-700" },
  { value: "Education", emoji: "🎓", color: "border-indigo-200 bg-indigo-50 text-indigo-700" },
  { value: "Law & Order", emoji: "👮", color: "border-slate-200 bg-slate-50 text-slate-700" },
  { value: "Other", emoji: "📋", color: "border-muted bg-muted text-muted-foreground" },
];

const wizardSteps = [
  { num: 1, label: "Details", icon: FileText },
  { num: 2, label: "Category & Location", icon: MapPin },
  { num: 3, label: "AI Analysis", icon: Brain },
  { num: 4, label: "Review & Submit", icon: Send },
];

const SubmitGrievance = () => {
  const navigate = useNavigate();
  const { user, submitGrievance, analyzeGrievancePreview } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    category: string;
    priority: string;
    urgency: number;
    sentiment: string;
    keywords: string[];
    detectedObjects?: string[];
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
    district: "",
    locationArea: "",
    accuracy: 0,
    coordinates: { latitude: 0, longitude: 0 } as { latitude: number; longitude: number } | undefined,
    name: user?.name || "",
    phone: user?.phone || "",
  });

  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const urgencyTags = [
    { label: "Emergency", value: "emergency", type: "critical" },
    { label: "Danger", value: "danger", type: "critical" },
    { label: "Delayed", value: "delayed", type: "high" },
    { label: "Persistent", value: "persistent", type: "medium" },
    { label: "Public Risk", value: "public risk", type: "high" },
    { label: "Small Issue", value: "minor", type: "low" },
    { label: "Request", value: "request", type: "low" },
  ];

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const update = (field: string, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleLocationSelect = useCallback((data: any) => {
    setForm(prev => ({
      ...prev,
      location: data.address,
      district: data.district,
      locationArea: data.area,
      coordinates: data.coordinates,
      accuracy: Math.round(data.accuracy)
    }));
    toast({
      title: "Location Verified",
      description: `Synced to ${data.area || data.district}. Precision: ${Math.round(data.accuracy)}m`,
    });
  }, [toast]);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      toast({ title: "Image Added", description: "AI will analyze this image." });
    }
  };

  const runAnalysis = async () => {
    if (!form.title && !form.description && !imageFile) {
      toast({ title: "Please add details or an image first", variant: "destructive" });
      return;
    }
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      // Combine description with selected tags for richer context
      const fullContext = `${form.title}\n${form.description}${selectedTags.length > 0 ? `\nKeywords: ${selectedTags.join(", ")}` : ""}`;
      formData.append("description", fullContext);
      if (form.category) formData.append("category", form.category);
      if (selectedTags.length > 0) formData.append("tags", JSON.stringify(selectedTags));
      if (imageFile) formData.append("image", imageFile);

      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5002/api"}/grievances/analyze-preview`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem("grievanceai_token")}` },
        body: formData
      });

      if (res.ok) {
        const result = await res.json();

        setAnalysisResult({
          category: result.category,
          priority: result.priority.toLowerCase(),
          urgency: result.urgencyScore,
          sentiment: result.sentiment,
          keywords: result.keywords || [],
          detectedObjects: result.detectedObjects
        });
        if (!form.category) update("category", result.category);

        const desc = result.detectedObjects && result.detectedObjects.length > 0
          ? `Detected: ${result.detectedObjects.slice(0, 3).join(", ")}. Category: ${result.category}`
          : `Identified as ${result.category} with ${result.priority} priority.`;

        toast({
          title: "AI Analysis Complete",
          description: desc
        });
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Server Error (${res.status})`);
      }
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Analysis Failed",
        description: e.message || "Could not reach AI service.",
        variant: "destructive"
      });
    }
    setIsAnalyzing(false);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.description) {
      toast({ title: "Title and description are required", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append('title', form.title);
      // Include tags in the final description stored in DB
      const finalDescription = `${form.description}${selectedTags.length > 0 ? `\n\n[Tags: ${selectedTags.join(", ")}]` : ""}`;
      submitData.append('description', finalDescription);
      submitData.append('category', form.category || analysisResult?.category || "Other");
      submitData.append('location', form.location || "");
      submitData.append('district', form.district || "");
      submitData.append('locationArea', form.locationArea || "");
      submitData.append('accuracy', String(form.accuracy || 0));
      if (form.coordinates) {
        submitData.append('coordinates', JSON.stringify(form.coordinates));
      }
      submitData.append('assignedDepartment', form.category || analysisResult?.category || "Other");

      submitData.append('citizenName', user?.name || "");
      submitData.append('citizenPhone', user?.phone || "");

      if (analysisResult) {
        submitData.append('priority', analysisResult.priority.toLowerCase());
        submitData.append('urgencyScore', String(analysisResult.urgency));
        submitData.append('sentiment', analysisResult.sentiment);
        const allKeywords = [...(analysisResult.keywords || []), ...selectedTags];
        submitData.append('keywords', JSON.stringify(Array.from(new Set(allKeywords))));
      }

      if (imageFile) {
        submitData.append('image', imageFile);
      }

      await submitGrievance(submitData);

      toast({
        title: "🎉 Grievance Submitted!",
        description: "Your complaint has been filed. Stay tuned for updates!"
      });
      navigate("/citizen-dashboard");
    } catch (e: any) {
      console.error("Submission Error:", e);
      toast({
        title: "Submission Failed",
        description: e.message || "Failed to submit grievance. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 1 && (!form.title || !form.description)) {
      toast({ title: "Please fill in the title and description", variant: "destructive" });
      return;
    }
    if (currentStep === 3 && !analysisResult) {
      runAnalysis();
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));



  return (
    <div className="min-h-screen bg-background bg-mesh-gradient">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <Link to="/citizen-dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>

          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">Submit a Grievance</h1>
              <p className="text-muted-foreground mt-1">Follow the steps below — our AI will help process your complaint</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-primary/10 to-teal-500/10 text-primary px-3 py-1.5 rounded-full text-xs font-medium border border-primary/20">
              <Sparkles className="h-3.5 w-3.5" />
              AI-Powered
            </div>
          </div>

          {/* Wizard Steps */}
          <div className="flex items-center gap-2 mb-10">
            {wizardSteps.map((step, i) => {
              const isActive = currentStep === step.num;
              const isDone = currentStep > step.num;
              return (
                <div key={step.num} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${isActive ? "bg-gradient-to-br from-primary to-teal-500 text-white shadow-lg shadow-primary/30 scale-110" :
                      isDone ? "bg-primary/20 text-primary" :
                        "bg-muted text-muted-foreground"
                      }`}>
                      {isDone ? <CheckCircle2 className="h-5 w-5" /> : <step.icon className="h-5 w-5" />}
                    </div>
                    <span className={`text-[10px] mt-1.5 font-medium ${isActive ? "text-primary" : isDone ? "text-foreground" : "text-muted-foreground"}`}>
                      {step.label}
                    </span>
                  </div>
                  {i < wizardSteps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all duration-700 ${isDone ? "bg-primary" : "bg-muted"}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Form Steps */}
          <AnimatePresence mode="wait">
            {/* Step 1: Details */}
            {currentStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="bg-card border border-border rounded-2xl p-6 space-y-5 shadow-sm">
                  <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Describe Your Complaint
                  </h2>

                  <div className="space-y-2">
                    <Label className="font-medium">Title <span className="text-destructive">*</span></Label>
                    <Input
                      placeholder="Brief title of your grievance (e.g., 'Pothole on Main Street')"
                      value={form.title}
                      onChange={(e) => update("title", e.target.value)}
                      className="h-12 text-base"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-medium">Description <span className="text-destructive">*</span></Label>
                    <Textarea
                      placeholder="Provide detailed description. Include dates, exact location, who is affected, and the impact..."
                      value={form.description}
                      onChange={(e) => update("description", e.target.value)}
                      className="min-h-[150px] text-base leading-relaxed"
                      required
                    />
                    <div className="flex flex-wrap gap-2 mt-3">
                      {urgencyTags.map(tag => (
                        <button
                          key={tag.value}
                          type="button"
                          onClick={() => toggleTag(tag.value)}
                          className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${selectedTags.includes(tag.value)
                            ? "bg-primary text-white border-primary shadow-md shadow-primary/20 scale-105"
                            : "bg-muted/50 text-muted-foreground border-border hover:border-primary/30"
                            }`}
                        >
                          {tag.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {form.description.length} characters • Select tags to highlight key points for AI
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Label className="font-medium">Evidence / Photo (Optional)</Label>
                    <div className="border-2 border-dashed border-border rounded-2xl p-6 bg-muted/5 transition-all hover:bg-muted/10">
                      {!imagePreview ? (
                        <div className="flex flex-col items-center justify-center py-4 space-y-3">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Camera className="h-6 w-6 text-primary" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-foreground">Click to upload or drag and drop</p>
                            <p className="text-xs text-muted-foreground mt-1">PNG, JPG or JPEG (max 10MB)</p>
                          </div>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                            id="image-upload"
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => document.getElementById('image-upload')?.click()}
                          >
                            Select File
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-4">
                          <div className="relative group">
                            <div className="h-40 w-full max-w-sm rounded-xl overflow-hidden border border-border shadow-sm">
                              <img src={imagePreview} alt="Evidence Preview" className="h-full w-full object-cover" />
                            </div>
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => { setImageFile(null); setImagePreview(null); }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-foreground truncate max-w-xs">{imageFile?.name}</p>
                            <Button
                              type="button"
                              variant="link"
                              className="h-auto p-0 text-xs text-primary"
                              onClick={() => document.getElementById('image-upload')?.click()}
                            >
                              Change Photo
                            </Button>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              className="hidden"
                              id="image-upload"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tip */}
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <Lightbulb className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-amber-800">Pro Tip</p>
                    <p className="text-xs text-amber-700 mt-0.5">Include specific details like road names, ward numbers, and how many people are affected. This helps authorities resolve faster!</p>
                  </div>
                </div>


              </motion.div>
            )}

            {/* Step 2: Category & Location */}
            {
              currentStep === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div className="bg-card border border-border rounded-2xl p-6 space-y-5 shadow-sm">
                    <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Category & Location
                    </h2>

                    <div className="space-y-3">
                      <Label className="font-medium">Select Category</Label>
                      <div className="grid grid-cols-3 gap-3">
                        {categories.map(cat => (
                          <button
                            key={cat.value}
                            type="button"
                            onClick={() => update("category", cat.value)}
                            className={`p-3 rounded-xl border-2 text-center transition-all duration-300 hover:-translate-y-0.5 ${form.category === cat.value
                              ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-md"
                              : `${cat.color} hover:shadow-md`
                              }`}
                          >
                            <span className="text-2xl block mb-1">{cat.emoji}</span>
                            <span className="text-xs font-medium">{cat.value.replace(" & ", "\n& ")}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-medium flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          District
                        </Label>
                        <Input
                          placeholder="e.g., Central Delhi"
                          value={form.district}
                          onChange={(e) => update("district", e.target.value)}
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-medium">Identified Area</Label>
                        <Input
                          placeholder="e.g., Sector 12"
                          value={form.locationArea}
                          onChange={(e) => update("locationArea", e.target.value)}
                          className="h-11"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-medium">Detailed Address</Label>
                      <Input
                        placeholder="Automatic location tracing recommended..."
                        value={form.location}
                        onChange={(e) => update("location", e.target.value)}
                        className="h-11"
                      />
                    </div>

                    <div className="pt-4 border-t border-border/50">
                      <LocationPicker
                        onLocationSelect={handleLocationSelect}
                        searchQuery={form.location}
                      />
                    </div>
                  </div>

                  {/* Contact  */}
                  <div className="bg-card border border-border rounded-2xl p-6 space-y-5 shadow-sm">
                    <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      Contact Info
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-medium">Your Name</Label>
                        <Input value={form.name} onChange={(e) => update("name", e.target.value)} className="h-11" />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-medium">Phone</Label>
                        <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} className="h-11" placeholder="+91 XXXXX XXXXX" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            }

            {/* Step 3: AI Analysis */}
            {
              currentStep === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2 mb-6">
                      <Brain className="h-5 w-5 text-primary" />
                      AI Analysis
                    </h2>

                    {!analysisResult && !isAnalyzing && (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/10 to-teal-500/10 flex items-center justify-center mx-auto mb-5">
                          <Brain className="h-10 w-10 text-primary/40" />
                        </div>
                        <h3 className="font-display text-lg font-bold text-foreground mb-2">Ready to Analyze</h3>
                        <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                          Our AI will analyze your complaint to determine category, urgency, sentiment, and priority level.
                        </p>

                        {imageFile && imagePreview && (
                          <div className="flex flex-col items-center mb-6">
                            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Analyzing Evidence</p>
                            <div className="h-40 w-full max-w-xs rounded-xl overflow-hidden border border-border/50 shadow-inner">
                              <img src={imagePreview} alt="To Analyze" className="h-full w-full object-cover" />
                            </div>
                          </div>
                        )}

                        <Button onClick={runAnalysis} className="gap-2 bg-gradient-to-r from-primary to-teal-500 text-white shadow-lg shadow-primary/20 px-8">
                          <Sparkles className="h-4 w-4" />
                          Run AI Analysis
                        </Button>
                      </div>
                    )}

                    {isAnalyzing && (
                      <div className="text-center py-12">
                        <div className="relative w-20 h-20 mx-auto mb-5">
                          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary to-teal-500 animate-pulse" />
                          <div className="absolute inset-1 rounded-[20px] bg-card flex items-center justify-center">
                            <Brain className="h-8 w-8 text-primary animate-pulse" />
                          </div>
                        </div>
                        <h3 className="font-display text-lg font-bold text-foreground mb-2">Analyzing...</h3>
                        <div className="space-y-2 max-w-xs mx-auto">
                          {["Extracting keywords", "Detecting sentiment", "Calculating urgency", "Assigning priority"].map((step, i) => (
                            <motion.div
                              key={step}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.4 }}
                              className="flex items-center gap-2 text-sm text-muted-foreground"
                            >
                              <div className="w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                              {step}...
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysisResult && !isAnalyzing && (
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5">
                        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl">
                          <CheckCircle2 className="h-5 w-5" />
                          <span className="text-sm font-medium">Analysis Complete</span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[
                            { label: "Category", value: analysisResult.category, emoji: categories.find(c => c.value === analysisResult.category)?.emoji || "📋" },
                            { label: "Priority", value: analysisResult.priority, emoji: analysisResult.priority === "critical" ? "🔴" : analysisResult.priority === "high" ? "🟠" : analysisResult.priority === "medium" ? "🟡" : "🟢" },
                            { label: "Urgency", value: `${analysisResult.urgency}/10`, emoji: "📊" },
                            { label: "Sentiment", value: analysisResult.sentiment, emoji: analysisResult.sentiment === "critical" ? "😡" : analysisResult.sentiment === "negative" ? "😞" : "😐" },
                          ].map(item => (
                            <div key={item.label} className="bg-muted/50 rounded-xl p-4 text-center border border-border/30">
                              <span className="text-2xl">{item.emoji}</span>
                              <p className="text-xs text-muted-foreground mt-2 uppercase tracking-wider font-medium">{item.label}</p>
                              <p className="text-sm font-bold text-foreground mt-0.5 capitalize">{item.value}</p>
                            </div>
                          ))}
                        </div>

                        {analysisResult.keywords.length > 0 && (
                          <div className="bg-muted/30 rounded-xl p-4 border border-border/20">
                            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5 font-medium uppercase tracking-wider">
                              <Tag className="h-3.5 w-3.5 text-primary" />
                              Detected Keywords
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {analysisResult.keywords.map(k => (
                                <span key={k} className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium">{k}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {analysisResult.priority === "critical" && (
                          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-semibold text-red-700">Critical Alert</p>
                              <p className="text-xs text-red-600 mt-0.5">This grievance has been flagged as <strong>CRITICAL</strong> and will be prioritized for immediate attention.</p>
                            </div>
                          </div>
                        )}

                        <Button onClick={runAnalysis} variant="outline" className="gap-2 text-sm">
                          <Brain className="h-4 w-4" />
                          Re-analyze
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )
            }

            {/* Step 4: Review */}
            {
              currentStep === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
                    <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      Review Your Grievance
                    </h2>

                    <div className="space-y-4">
                      {[
                        { label: "Title", value: form.title },
                        { label: "Description", value: form.description },
                        { label: "Category", value: form.category || "Auto-detect" },
                        { label: "Location", value: form.location || "Not specified" },
                        { label: "District", value: form.district || "Not specified" },
                        { label: "Area", value: form.locationArea || "Not specified" },
                        { label: "Tracking Accuracy", value: form.accuracy ? `${form.accuracy}m Precision` : "Manual Selection" },
                        { label: "Contact", value: `${form.name} • ${form.phone}` },
                      ].map(item => (
                        <div key={item.label} className="bg-muted/30 rounded-xl p-4 border border-border/20">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{item.label}</p>
                          <p className="text-sm text-foreground mt-1 whitespace-pre-line">{item.value}</p>
                        </div>
                      ))}

                      {analysisResult && (
                        <div className="bg-gradient-to-r from-primary/5 to-teal-500/5 rounded-xl p-4 border border-primary/10">
                          <p className="text-xs font-semibold text-primary mb-2 flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5" />
                            AI Assessment
                          </p>
                          <div className="flex flex-wrap gap-3">
                            <span className="text-xs bg-card px-3 py-1 rounded-full border border-border font-medium">Priority: <strong className="capitalize">{analysisResult.priority}</strong></span>
                            <span className="text-xs bg-card px-3 py-1 rounded-full border border-border font-medium">Urgency: <strong>{analysisResult.urgency}/10</strong></span>
                            <span className="text-xs bg-card px-3 py-1 rounded-full border border-border font-medium">Sentiment: <strong className="capitalize">{analysisResult.sentiment}</strong></span>
                          </div>
                        </div>
                      )}

                      {imagePreview && (
                        <div className="bg-muted/30 rounded-xl p-4 border border-border/20">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Attached Evidence</p>
                          <div className="h-32 w-32 rounded-lg overflow-hidden border border-border">
                            <img src={imagePreview} alt="Attached Evidence" className="h-full w-full object-cover" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            }
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 gap-4">
            {currentStep > 1 ? (
              <Button variant="outline" onClick={prevStep} className="gap-2 px-6">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            ) : (
              <div />
            )}

            {
              currentStep < 4 ? (
                <Button
                  onClick={nextStep}
                  className="gap-2 bg-gradient-to-r from-primary to-teal-500 text-white shadow-lg shadow-primary/20 px-6"
                >
                  {currentStep === 3 && !analysisResult ? "Analyze" : "Next"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  className="gap-2 bg-gradient-to-r from-primary to-teal-500 text-white shadow-xl shadow-primary/20 px-8"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {isSubmitting ? "Submitting..." : "Submit Grievance"}
                </Button>
              )
            }
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SubmitGrievance;
