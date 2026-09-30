import sys
import io

# Force UTF-8 encoding for standard output on Windows
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if sys.stderr and hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

import sklearn._loss._loss
sys.modules['_loss'] = sklearn._loss._loss

import torch
import joblib
import numpy as np
from sentence_transformers import SentenceTransformer
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional, List
import os
import base64
from io import BytesIO
from PIL import Image
from transformers import (
    DistilBertTokenizerFast, 
    DistilBertForSequenceClassification,
    ViTImageProcessor, 
    ViTForImageClassification
)

app = FastAPI(title="Grievance AI Engine")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "models")
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

PATHS = {
    # Advanced Model Folders (DistilBERT)
    "cat_bert": os.path.join(MODEL_DIR, "cat_model"),
    "prio_bert": os.path.join(MODEL_DIR, "prio_model"),
    "sent_bert": os.path.join(MODEL_DIR, "sent_model"),
    
    # Fast Model Files (GBM/Sklearn)
    "cat_model": os.path.join(MODEL_DIR, "category_model.pkl"),
    "prio_model": os.path.join(MODEL_DIR, "priority_model.pkl"),
    "dept_model": os.path.join(MODEL_DIR, "department_model.pkl"),
    "sent_model": os.path.join(MODEL_DIR, "sentiment_model.pkl"),
    "urg_model": os.path.join(MODEL_DIR, "urgency_model.pkl"),
    
    # Encoders & Embedders
    "cat_enc": os.path.join(MODEL_DIR, "category_encoder.pkl"),
    "prio_enc": os.path.join(MODEL_DIR, "priority_encoder.pkl"),
    "dept_enc": os.path.join(MODEL_DIR, "department_encoder.pkl"),
    "sent_enc": os.path.join(MODEL_DIR, "sentiment_encoder.pkl"),
    "embedder": os.path.join(MODEL_DIR, "sentence_embedder")
}

MODELS = {}

def load_system():
    print("Loading AI Models...")
    try:
        # 1. Load Common Embedder
        if os.path.exists(PATHS["embedder"]):
            MODELS["embedder"] = SentenceTransformer(PATHS["embedder"])
        else:
            MODELS["embedder"] = SentenceTransformer("all-MiniLM-L6-v2")

        # 2. Load Classifiers (Advanced BERT or Fast GBM)
        # Category
        if os.path.exists(PATHS["cat_bert"]):
            print("Using Advanced BERT for Category")
            MODELS["cat_tok"] = DistilBertTokenizerFast.from_pretrained(PATHS["cat_bert"])
            MODELS["cat"] = DistilBertForSequenceClassification.from_pretrained(PATHS["cat_bert"]).to(device)
            MODELS["cat_mode"] = "bert"
        else:
            print("Using Fast GBM for Category")
            MODELS["cat"] = joblib.load(PATHS["cat_model"])
            MODELS["cat_mode"] = "gbm"

        # Priority
        if os.path.exists(PATHS["prio_bert"]):
            print("Using Advanced BERT for Priority")
            MODELS["prio_tok"] = DistilBertTokenizerFast.from_pretrained(PATHS["prio_bert"])
            MODELS["prio"] = DistilBertForSequenceClassification.from_pretrained(PATHS["prio_bert"]).to(device)
            MODELS["prio_mode"] = "bert"
        else:
            print("Using Fast GBM for Priority")
            MODELS["prio"] = joblib.load(PATHS["prio_model"])
            MODELS["prio_mode"] = "gbm"

        # Sentiment
        if os.path.exists(PATHS["sent_bert"]):
            print("Using Advanced BERT for Sentiment")
            MODELS["sent_tok"] = DistilBertTokenizerFast.from_pretrained(PATHS["sent_bert"])
            MODELS["sent"] = DistilBertForSequenceClassification.from_pretrained(PATHS["sent_bert"]).to(device)
            MODELS["sent_mode"] = "bert"
        else:
            print("Using Fast GBM for Sentiment")
            MODELS["sent"] = joblib.load(PATHS["sent_model"])
            MODELS["sent_mode"] = "gbm"

        # Department & Urgency (Always GBM/Sklearn for now)
        MODELS["dept"] = joblib.load(PATHS["dept_model"])
        MODELS["urg"] = joblib.load(PATHS["urg_model"])

        # Encoders
        MODELS["cat_enc"] = joblib.load(PATHS["cat_enc"])
        MODELS["prio_enc"] = joblib.load(PATHS["prio_enc"])
        MODELS["dept_enc"] = joblib.load(PATHS["dept_enc"])
        MODELS["sent_enc"] = joblib.load(PATHS["sent_enc"])
        print("✅ Core ML models loaded.")
    except Exception as e:
        print(f"❌ Model load error: {e}")

    try:
        MODELS["vision_proc"] = ViTImageProcessor.from_pretrained("google/vit-base-patch16-224")
        MODELS["vision_model"] = ViTForImageClassification.from_pretrained("google/vit-base-patch16-224").to(device)
        print("✅ Vision model loaded.")
    except Exception as e:
        print(f"⚠️ Vision model error: {e}")


# --- REQUEST / RESPONSE ---
class GrievanceRequest(BaseModel):
    description: Optional[str] = None
    text: Optional[str] = None
    image: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None

class GrievanceResponse(BaseModel):
    category: str
    priority: str
    department: str
    urgencyScore: int
    sentiment: str
    clusterId: int
    keywords: List[str]
    detectedObjects: Optional[List[str]] = None


@app.on_event("startup")
def startup():
    load_system()

@app.post("/reload")
def reload():
    load_system()
    return {"status": "Reloaded"}


# --- CATEGORY KEYWORDS (comprehensive) ---
CAT_KEYWORDS = {
    "Electricity": [
        "power", "light", "voltage", "wire", "pole", "electric", "current", "outage",
        "blackout", "shock", "transformer", "meter", "bulb", "fuse", "spark", "grid",
        "inverter", "generator", "mcb", "wiring", "short circuit", "electricity"
    ],
    "Water Supply": [
        "water", "pipe", "leak", "tap", "supply", "dry", "drinking", "sewer",
        "drainage", "pump", "tank", "faucet", "pressure", "overflow", "borewell",
        "contaminated", "dirty water", "pipeline", "waterlogging"
    ],
    "Sanitation": [
        "garbage", "trash", "waste", "smell", "dirty", "sewage", "cleaning", "dustbin",
        "dump", "filth", "rubbish", "debris", "litter", "hygiene", "sanitary", "foul",
        "stinking", "compost", "sweeping", "drain clogged"
    ],
    "Roads & Infrastructure": [
        "road", "pothole", "street", "pavement", "bridge", "traffic", "signal",
        "asphalt", "repair", "construction", "highway", "footpath", "lane", "divider",
        "crossing", "streetlight", "flyover", "speed breaker", "crater", "manhole"
    ],
    "Law & Order": [
        "theft", "crime", "police", "fight", "noise", "loud", "harassment", "drunk",
        "robbery", "assault", "security", "illegal", "threat", "brawl", "trespassing",
        "vandalism", "eve teasing", "stalking", "kidnapping", "murder"
    ],
    "Public Transport": [
        "bus", "train", "metro", "station", "stop", "driver", "ticket", "delay",
        "route", "conductor", "platform", "schedule", "transport", "auto", "rickshaw",
        "cab", "fare", "overcrowding"
    ],
    "Healthcare": [
        "hospital", "doctor", "medicine", "ambulance", "sick", "clinic", "health",
        "patient", "nurse", "treatment", "ward", "medical", "disease", "infection",
        "vaccination", "pharmacy", "dispensary", "icu", "surgery"
    ],
    "Education": [
        "school", "teacher", "student", "class", "book", "college", "exam",
        "university", "syllabus", "fees", "admission", "playground", "library",
        "scholarship", "tuition", "principal", "hostel", "lab"
    ],
    "Health & Safety": [
        "fire", "flame", "smoke", "burning", "explosion", "gas leak", "collapsed",
        "trapped", "danger", "dangerous", "hazard", "hazardous", "toxic",
        "chemical", "radiation", "electrocuted", "drowning", "accident", "crash",
        "injured", "injury", "ambulance", "rescue", "unsafe", "emergency",
        "building collapse", "structural damage", "landslide"
    ]
}

# --- VISION OBJECT LISTS ---
CRITICAL_OBJECTS = [
    "fire", "flame", "smoke", "blood", "weapon", "gun", "knife", "crash",
    "bomb", "explosion", "chainsaw", "torch"
]
HIGH_OBJECTS = [
    "garbage", "trash", "waste", "pothole", "crack", "damage", "broken",
    "sewage", "leak", "debris", "rubble", "ruin", "wreck", "accident", "disaster", "volcano"
]

# --- TEXT KEYWORD LISTS ---
CRIT_TEXT = [
    "fire", "blood", "dying", "trapped", "explosion", "urgent",
    "immediate", "unsafe", "collapsed", "danger", "emergency"
]
HIGH_TEXT = [
    "delayed", "blocked", "overflowing", "broken", "damage", "leak",
    "exposed", "hazard", "flooded", "cracked"
]
LOW_TEXT = [
    "minor", "request", "suggestion", "feedback", "inquiry", "question",
    "small", "general"
]

STOP_WORDS = {
    "about", "again", "all", "almost", "also", "and", "are", "been", "but",
    "can", "for", "from", "had", "has", "have", "here", "how", "into",
    "issue", "its", "just", "more", "not", "our", "out", "over", "own",
    "please", "problem", "some", "than", "that", "the", "them", "then",
    "there", "these", "they", "this", "very", "was", "were", "what",
    "when", "where", "which", "while", "who", "will", "with", "would",
    "your", "help", "need", "area", "near", "since", "many", "being"
}


@app.post("/analyze", response_model=GrievanceResponse)
def analyze_grievance(request: GrievanceRequest):
    text = request.description or request.text or ""
    image_b64 = request.image
    print(f"\n{'='*60}")
    print(f"--- NEW ANALYSIS REQUEST ---")
    print(f"Text: {text[:120]}...")
    print(f"Tags: {request.tags}")
    print(f"Image: {'YES' if image_b64 else 'NO'}")

    if not MODELS.get("embedder"):
        load_system()

    text_l = text.lower()

    # ========== 1. DYNAMIC TEXT SCORING ==========
    # Every keyword found adds to a weighted score - this makes EVERY word matter
    SEVERITY_WEIGHTS = {
        # Tier 1: Life-threatening (each adds +4 to score)
        "death": 4, "dying": 4, "dead": 4, "killed": 4, "murder": 4,
        "fire": 4, "flame": 4, "burning": 4, "explosion": 4, "exploded": 4,
        "trapped": 4, "collapsed": 4, "drowning": 4, "electrocuted": 4,
        "blood": 3.5, "bleeding": 3.5, "unconscious": 3.5,
        
        # Tier 2: Immediate danger (each adds +3)
        "accident": 3, "crash": 3, "injured": 3, "injury": 3,
        "dangerous": 3, "hazardous": 3, "toxic": 3, "poisonous": 3,
        "emergency": 3, "urgent": 2.5, "immediate": 2.5,
        "harassed": 3, "assault": 3, "attacked": 3, "violence": 3,
        
        # Tier 3: Health hazards (each adds +2)
        "disease": 2, "infection": 2, "infectious": 2, "epidemic": 3,
        "outbreak": 3, "contaminated": 2, "unhygienic": 1.5,
        "sick": 1.5, "illness": 1.5, "health": 1, "medical": 1,
        "spreading": 1.5, "affecting": 1, "suffering": 1.5,
        
        # Tier 4: Significant issues (each adds +1.5)
        "overflowing": 1.5, "flooded": 1.5, "flooding": 1.5,
        "blocked": 1.5, "broken": 1.5, "damaged": 1.5, "destroyed": 2,
        "exposed": 1.5, "hanging": 1.5, "leaning": 1.5,
        "clogged": 1.5, "burst": 2, "cracked": 1.5,
        "stinking": 1.5, "stench": 1.5, "foul": 1.5, "unbearable": 1.5,
        
        # Tier 5: Standard complaints (each adds +1)
        "delayed": 1, "ignored": 1, "complaint": 0.5, "problem": 0.5,
        "irregular": 1, "uneven": 1, "rough": 0.5,
        "dirty": 1, "filthy": 1.5, "messy": 0.5,
        "missing": 1, "absent": 1, "unavailable": 1,
        "rude": 1, "misbehaving": 1, "corrupt": 1.5,
        "overcrowded": 1, "overloaded": 1, "rash": 1.5,
        "theft": 2, "robbery": 2.5, "stolen": 2,
        
        # Tier 6: Contextual modifiers (small boost)
        "days": 0.5, "weeks": 1, "months": 1.5, "years": 2,
        "nobody": 0.5, "listening": 0.5, "ignored": 1,
        "repeatedly": 1, "multiple": 0.5, "daily": 0.5,
        "affecting": 0.5, "people": 0.5, "public": 0.5, "children": 1,
        "elderly": 1, "women": 0.5, "students": 0.5,
        
        # Tier 7: Low severity / requests
        "request": -0.5, "suggestion": -1, "feedback": -1,
        "inquiry": -1, "question": -1, "general": -0.5,
        "minor": -1, "small": -0.5,
    }
    
    # Calculate dynamic text score
    text_score = 0
    matched_kws = []
    words_in_text = text_l.split()
    for word in words_in_text:
        clean_word = word.strip(".,!?:;\"'()[]")
        if clean_word in SEVERITY_WEIGHTS:
            text_score += SEVERITY_WEIGHTS[clean_word]
            matched_kws.append(clean_word)
    
    # Also check multi-word phrases
    PHRASES = {
        "immediate danger": 4, "no water": 2, "no electricity": 2,
        "no supply": 2, "not working": 1, "out of stock": 1.5,
        "not available": 1, "daily life": 0.5, "public risk": 2,
        "speed breaker": 0.5, "short circuit": 3, "chain snatching": 3,
        "eve teasing": 3, "drug peddling": 2.5, "illegal construction": 1.5,
        "open drain": 2, "open manhole": 3, "dead animal": 1.5,
        "stagnant water": 1.5, "drinking water": 1, "foul smell": 1.5,
    }
    for phrase, weight in PHRASES.items():
        if phrase in text_l:
            text_score += weight
            matched_kws.append(phrase)
    
    print(f"Text Score: {text_score:.1f} (from: {matched_kws})")
    
    # ========== 2. CATEGORY DETECTION ==========
    if request.category and request.category.strip() not in ["", "Other", "Select", "Auto-detect"]:
        category = request.category.strip()
    else:
        best_cat = "Other"
        best_score = 0
        for cat_name, kws in CAT_KEYWORDS.items():
            score = sum(1 for kw in kws if kw in text_l)
            if score > best_score:
                best_score = score
                best_cat = cat_name
        category = best_cat if best_score > 0 else "Other"
        
        # Fallback to ML model if keyword match failed
        if category == "Other":
            try:
                embedding = MODELS["embedder"].encode([text])
                if MODELS.get("cat_mode") == "bert":
                    inputs = MODELS["cat_tok"](text, return_tensors="pt", truncation=True, padding=True, max_length=128).to(device)
                    with torch.no_grad():
                        logits = MODELS["cat"](**inputs).logits
                    cat_idx = torch.argmax(logits, dim=1).item()
                else:
                    cat_idx = MODELS["cat"].predict(embedding)[0]
                category = MODELS["cat_enc"].inverse_transform([cat_idx])[0]
            except Exception:
                category = "Other"
    
    # ========== 3. DEPARTMENT MAPPING ==========
    DEPT_MAP = {
        "Electricity": "Electricity Dept",
        "Water Supply": "Water Board",
        "Sanitation": "Municipal Corp",
        "Roads & Infrastructure": "Public Works Dept",
        "Law & Order": "Police Dept",
        "Public Transport": "Transport Authority",
        "Healthcare": "Health Dept",
        "Education": "Education Dept",
        "Health & Safety": "Emergency Services",
    }
    department = DEPT_MAP.get(category, "General Administration")
    
    # ========== 4. VISION ANALYSIS ==========
    detected_objects = []
    vision_score = 0  # Vision adds to the total score
    
    if image_b64 and MODELS.get("vision_model"):
        try:
            image_data = base64.b64decode(image_b64)
            image = Image.open(BytesIO(image_data)).convert("RGB")
            inputs = MODELS["vision_proc"](images=image, return_tensors="pt").to(device)
            with torch.no_grad():
                outputs = MODELS["vision_model"](**inputs)
            idxs = outputs.logits.topk(5).indices.squeeze().tolist()
            detected_objects = [MODELS["vision_model"].config.id2label[idx] for idx in idxs]
            print(f"Vision detected: {detected_objects}")
            
            for obj in detected_objects:
                obj_l = obj.lower()
                # Critical visual signals
                if any(c in obj_l for c in CRITICAL_OBJECTS):
                    vision_score += 5
                    print(f"  CRITICAL object: {obj} (+5)")
                # High visual signals
                elif any(h in obj_l for h in HIGH_OBJECTS):
                    vision_score += 2.5
                    print(f"  HIGH object: {obj} (+2.5)")
                # Infrastructure signals (manhole, street sign, traffic light, etc.)
                elif any(inf in obj_l for inf in ["manhole", "street", "gutter", "sewer", "pole", "barrier", "fence"]):
                    vision_score += 1.5
                    print(f"  Infrastructure object: {obj} (+1.5)")
                else:
                    # Any detected object from a photo means the user took effort = slight boost
                    vision_score += 0.5
                    print(f"  General object: {obj} (+0.5)")
            
            # Category override from vision if text was vague
            if category == "Other":
                for obj in detected_objects:
                    obj_l = obj.lower()
                    if any(k in obj_l for k in ["garbage", "trash", "waste", "ashcan", "dustbin"]):
                        category = "Sanitation"
                        department = "Municipal Corp"
                        break
                    elif any(k in obj_l for k in ["manhole", "pothole", "street", "bridge", "barrier"]):
                        category = "Roads & Infrastructure"
                        department = "Public Works Dept"
                        break
                    elif any(k in obj_l for k in ["fire", "smoke", "flame", "ambulance"]):
                        category = "Health & Safety"
                        department = "Emergency Services"
                        break
        except Exception as e:
            print(f"Vision error: {e}")
    else:
        print("No image provided - vision score = 0")
    
    print(f"Vision Score: {vision_score:.1f}")
    
    # ========== 5. TAG SCORING ==========
    tag_score = 0
    if request.tags:
        TAG_WEIGHTS = {
            "emergency": 4, "danger": 3, "public risk": 2.5,
            "persistent": 1.5, "delayed": 1, "small issue": -1.5,
            "request": -1,
        }
        for tag in request.tags:
            t = tag.lower().strip()
            weight = TAG_WEIGHTS.get(t, 0.5)  # Unknown tags get small boost
            tag_score += weight
            print(f"  Tag '{t}' -> +{weight}")
    else:
        print("No tags selected - tag score = 0")
    
    print(f"Tag Score: {tag_score:.1f}")
    
    # ========== 6. COMBINE ALL SIGNALS INTO FINAL SCORE ==========
    total_score = text_score + vision_score + tag_score
    print(f"\nTOTAL COMBINED SCORE: {total_score:.1f} (text={text_score:.1f} + vision={vision_score:.1f} + tags={tag_score:.1f})")
    
    # Map total score to urgency (1-10) and priority
    if total_score >= 10:
        final_urgency = 10
        final_priority = "critical"
        sentiment = "critical"
    elif total_score >= 8:
        final_urgency = 9
        final_priority = "critical"
        sentiment = "critical"
    elif total_score >= 6:
        final_urgency = 8
        final_priority = "high"
        sentiment = "negative"
    elif total_score >= 4.5:
        final_urgency = 7
        final_priority = "high"
        sentiment = "negative"
    elif total_score >= 3:
        final_urgency = 6
        final_priority = "medium"
        sentiment = "negative"
    elif total_score >= 2:
        final_urgency = 5
        final_priority = "medium"
        sentiment = "negative"
    elif total_score >= 1:
        final_urgency = 4
        final_priority = "medium"
        sentiment = "neutral"
    elif total_score >= 0:
        final_urgency = 3
        final_priority = "low"
        sentiment = "neutral"
    else:
        final_urgency = 2
        final_priority = "low"
        sentiment = "neutral"
    
    # ========== 7. KEYWORDS EXTRACTION ==========
    words = [w.strip(".,!?:;\"'()[]") for w in text.split() if w.lower() not in STOP_WORDS and len(w) > 3]
    # Add vision objects to keywords (cleaned)
    if detected_objects:
        for obj in detected_objects[:3]:
            clean_obj = obj.split(",")[0].strip()
            if clean_obj and clean_obj not in words:
                words.append(clean_obj)
    keywords = list(dict.fromkeys(words))[:10]
    
    print(f"\n>>> FINAL DECISION: Cat={category}, Pri={final_priority}, Urg={final_urgency}/10, Sent={sentiment}")
    print(f">>> Keywords: {keywords}")
    print(f">>> Vision objects: {detected_objects}")
    print(f"{'='*60}\n")

    return {
        "category": category,
        "priority": final_priority,
        "department": department,
        "urgencyScore": final_urgency,
        "sentiment": sentiment,
        "clusterId": 101,
        "keywords": keywords,
        "detectedObjects": detected_objects
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
