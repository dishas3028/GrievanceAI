import pandas as pd
import numpy as np
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import accuracy_score, mean_squared_error
from sentence_transformers import SentenceTransformer
from sklearn.cluster import KMeans
from sklearn.preprocessing import LabelEncoder

# Set device
print(f"Starting GBM & Embedding Training...")

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

# Drop rows with missing values
df = df.dropna(subset=["text", "category", "priority", "department", "sentiment", "urgency_score"])

print(f"Dataset ready: {df.shape}")

# Encode labels
cat_encoder = LabelEncoder()
df["cat_label"] = cat_encoder.fit_transform(df["category"])

prio_encoder = LabelEncoder()
df["prio_label"] = prio_encoder.fit_transform(df["priority"])

dept_encoder = LabelEncoder()
df["dept_label"] = dept_encoder.fit_transform(df["department"])

sent_encoder = LabelEncoder()
df["sent_label"] = sent_encoder.fit_transform(df["sentiment"])

# Save Encoders
joblib.dump(cat_encoder, f"{MODEL_DIR}/category_encoder.pkl")
joblib.dump(prio_encoder, f"{MODEL_DIR}/priority_encoder.pkl")
joblib.dump(dept_encoder, f"{MODEL_DIR}/department_encoder.pkl")
joblib.dump(sent_encoder, f"{MODEL_DIR}/sentiment_encoder.pkl")

# Split Data
train_df, test_df = train_test_split(df, test_size=0.15, random_state=42)

# ================================
# 2️⃣ GENERATE EMBEDDINGS (Advanced Features)
# ================================
print("\n--- Generating Semantic Embeddings (SentenceTransformer) ---")
# Check if local model exists
if os.path.exists(f"{MODEL_DIR}/sentence_embedder"):
    print("Loading local embedder...")
    embedder = SentenceTransformer(f"{MODEL_DIR}/sentence_embedder")
else:
    print("Downloading embedder...")
    embedder = SentenceTransformer("all-MiniLM-L6-v2")
    embedder.save(f"{MODEL_DIR}/sentence_embedder")

X_train_emb = embedder.encode(train_df["text"].tolist(), show_progress_bar=True)
X_test_emb = embedder.encode(test_df["text"].tolist(), show_progress_bar=True)

# ================================
# 3️⃣ CATEGORY CLASSIFICATION (Random Forest with Balancing)
# ================================
print("\n--- Training Category Model (Random Forest) ---")
cat_model = RandomForestClassifier(n_estimators=200, class_weight='balanced', random_state=42)
cat_model.fit(X_train_emb, train_df["cat_label"])

y_cat_pred = cat_model.predict(X_test_emb)
print("Category Model Accuracy:", accuracy_score(test_df["cat_label"], y_cat_pred))
joblib.dump(cat_model, f"{MODEL_DIR}/category_model.pkl")

# ================================
# 4️⃣ PRIORITY CLASSIFICATION (Random Forest with Balancing)
# ================================
print("\n--- Training Priority Model (Random Forest) ---")
prio_model = RandomForestClassifier(n_estimators=200, class_weight='balanced', random_state=42)
prio_model.fit(X_train_emb, train_df["prio_label"])

y_pred = prio_model.predict(X_test_emb)
print("Priority Model Accuracy:", accuracy_score(test_df["prio_label"], y_pred))
joblib.dump(prio_model, f"{MODEL_DIR}/priority_model.pkl")

# ================================
# 5️⃣ DEPARTMENT CLASSIFICATION (Random Forest with Balancing)
# ================================
print("\n--- Training Department Model (Random Forest) ---")
dept_model = RandomForestClassifier(n_estimators=200, class_weight='balanced', random_state=42)
dept_model.fit(X_train_emb, train_df["dept_label"])

y_dept_pred = dept_model.predict(X_test_emb)
print("Department Model Accuracy:", accuracy_score(test_df["dept_label"], y_dept_pred))
joblib.dump(dept_model, f"{MODEL_DIR}/department_model.pkl")

# ================================
# 6️⃣ SENTIMENT CLASSIFICATION (Random Forest with Balancing)
# ================================
print("\n--- Training Sentiment Model (Random Forest) ---")
sent_model = RandomForestClassifier(n_estimators=200, class_weight='balanced', random_state=42)
sent_model.fit(X_train_emb, train_df["sent_label"])

y_sent_pred = sent_model.predict(X_test_emb)
print("Sentiment Model Accuracy:", accuracy_score(test_df["sent_label"], y_sent_pred))
joblib.dump(sent_model, f"{MODEL_DIR}/sentiment_model.pkl")

# ================================
# 7️⃣ URGENCY SCORE REGRESSION (Random Forest)
# ================================
print("\n--- Training Urgency Model (Random Forest Regressor) ---")
urgency_model = RandomForestRegressor(n_estimators=200, random_state=42)
urgency_model.fit(X_train_emb, train_df["urgency_score"])

y_urg_pred = urgency_model.predict(X_test_emb)
mse = mean_squared_error(test_df["urgency_score"], y_urg_pred)
print(f"Urgency Model MSE: {mse:.4f}")
joblib.dump(urgency_model, f"{MODEL_DIR}/urgency_model.pkl")

# ================================
# 8️⃣ CLUSTERING (KMeans on Embeddings)
# ================================
print("\n--- Training Clustering Model ---")
# Use all embeddings for better cluster centers
all_embeddings = np.vstack([X_train_emb, X_test_emb])
kmeans = KMeans(n_clusters=12, random_state=42, n_init=10)
kmeans.fit(all_embeddings)

joblib.dump(kmeans, f"{MODEL_DIR}/kmeans_model.pkl")
print("Clustering model saved.")

print("\n✅ GBM Training Complete.")
