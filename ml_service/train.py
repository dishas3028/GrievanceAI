import pandas as pd
import numpy as np
import torch
import joblib
import os
from transformers import (
    DistilBertTokenizerFast,
    DistilBertForSequenceClassification,
    Trainer,
    TrainingArguments
)
from datasets import Dataset
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, mean_squared_error
from sentence_transformers import SentenceTransformer

# Set device
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {device}")

# ================================
# 1️⃣ DATA LOADING & PREPROCESSING
# ================================
DATA_PATH = "data/fine_tuning_grievances.csv"
MODEL_DIR = "models"
os.makedirs(MODEL_DIR, exist_ok=True)

if not os.path.exists(DATA_PATH):
    print(f"Dataset not found at {DATA_PATH}. Please generate it first.")
    exit(1)

print(f"Loading dataset from {DATA_PATH}...")
df = pd.read_csv(DATA_PATH)

# Standardize Categories for Frontend if needed
# The new dataset already uses standard names, but we keep the logic for safety
cat_map = {
    "Road Damage": "Roads & Infrastructure",
    "Waste Management": "Sanitation"
}
df["category"] = df["category"].map(lambda x: cat_map.get(x, x))
df["priority"] = df["priority"].str.lower()
df["sentiment"] = df["sentiment"].str.lower()

# Drop rows with missing values
df = df.dropna(subset=["text", "category", "priority", "sentiment", "urgency_score"])

print(f"Dataset prepared. Unique Categories: {df['category'].unique()}")

# Encode labels
cat_encoder = LabelEncoder()
df["cat_label"] = cat_encoder.fit_transform(df["category"])

prio_encoder = LabelEncoder()
df["prio_label"] = prio_encoder.fit_transform(df["priority"])

sent_encoder = LabelEncoder()
df["sent_label"] = sent_encoder.fit_transform(df["sentiment"])

# Urgency Score Mapping (Target for Regression)
# Use a more sophisticated mapping based on data
prio_score_map = {"critical": 10, "high": 8, "medium": 5, "low": 3}
df["urgency_score"] = df["priority"].map(lambda x: prio_score_map.get(x, 5))
# Boost score for negative sentiment
df.loc[df['sentiment'] == 'negative', 'urgency_score'] += 1
df["urgency_score"] = df["urgency_score"].clip(1, 10).astype(int)

# Save Encoders
joblib.dump(cat_encoder, f"{MODEL_DIR}/category_encoder.pkl")
joblib.dump(prio_encoder, f"{MODEL_DIR}/priority_encoder.pkl")
joblib.dump(sent_encoder, f"{MODEL_DIR}/sentiment_encoder.pkl")

# Split Data
train_df, test_df = train_test_split(df, test_size=0.15, random_state=42)

# ================================
# 2️⃣ MULTI-MODAL TRAINING (DistilBERT)
# ================================
tokenizer = DistilBertTokenizerFast.from_pretrained("distilbert-base-uncased")

def tokenize_function(texts):
    return tokenizer(list(texts), truncation=True, padding=True, max_length=128)

def train_classifier(target_col, label_encoder, model_name):
    print(f"\n--- Training {model_name} (DistilBERT) ---")
    num_labels = len(label_encoder.classes_)
    
    train_encodings = tokenize_function(train_df["text"])
    val_encodings = tokenize_function(test_df["text"])
    
    train_dataset = Dataset.from_dict({**train_encodings, "labels": train_df[f"{target_col}_label"].tolist()})
    val_dataset = Dataset.from_dict({**val_encodings, "labels": test_df[f"{target_col}_label"].tolist()})
    
    model = DistilBertForSequenceClassification.from_pretrained(
        "distilbert-base-uncased", 
        num_labels=num_labels
    ).to(device)
    
    training_args = TrainingArguments(
        output_dir=f"./results_{target_col}",
        num_train_epochs=3,
        per_device_train_batch_size=16,
        per_device_eval_batch_size=16,
        warmup_steps=100,
        weight_decay=0.01,
        eval_strategy="epoch",
        save_strategy="epoch",
        load_best_model_at_end=True,
        report_to="none"
    )
    
    def compute_metrics(pred):
        labels = pred.label_ids
        preds = pred.predictions.argmax(-1)
        acc = accuracy_score(labels, preds)
        return {"accuracy": acc}
    
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        compute_metrics=compute_metrics
    )
    
    trainer.train()
    
    # Save
    save_path = f"{MODEL_DIR}/{target_col}_model"
    model.save_pretrained(save_path)
    tokenizer.save_pretrained(save_path)
    print(f"{model_name} saved to {save_path}.")

# Train all three main targets with BERT for maximum accuracy
train_classifier("cat", cat_encoder, "Category Classification")
train_classifier("prio", prio_encoder, "Priority Classification")
train_classifier("sent", sent_encoder, "Sentiment Analysis")

# ================================
# 3️⃣ URGENCY SCORE REGRESSION (Embeddings)
# ================================
print("\n--- Training Urgency Model (GBM Regressor) ---")
embedder = SentenceTransformer("all-MiniLM-L6-v2")
X_train_emb = embedder.encode(train_df["text"].tolist(), show_progress_bar=True)
X_test_emb = embedder.encode(test_df["text"].tolist(), show_progress_bar=True)

from sklearn.ensemble import GradientBoostingRegressor
urgency_model = GradientBoostingRegressor(n_estimators=200, learning_rate=0.05, max_depth=6, random_state=42)
urgency_model.fit(X_train_emb, train_df["urgency_score"])

y_urg_pred = urgency_model.predict(X_test_emb)
mse = mean_squared_error(test_df["urgency_score"], y_urg_pred)
print(f"Urgency Model MSE: {mse:.4f}")
joblib.dump(urgency_model, f"{MODEL_DIR}/urgency_model.pkl")
embedder.save(f"{MODEL_DIR}/sentence_embedder")

print("\n✅ Advanced Neural Training Phase Complete. All aspects upgraded.")
