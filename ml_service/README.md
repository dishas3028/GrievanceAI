# Grievance AI Analysis Service

This service provides automated categorization, priority assessment, sentiment analysis, and clustering for grievances using NLP models.

## Components
1. **`train.py`**: Generates synthetic data and trains the models (DistilBERT for Category, TF-IDF + Logistic Regression for Priority, KMeans for Clustering).
2. **`predictor.py`**: A FastAPI service that loads the trained models and provides an endpoint for real-time analysis.

## Setup & Installation

1. **Install Python Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Train the Models**:
   Run the training script to generate models. This will save them in the `models/` directory.
   ```bash
   python train.py
   ```

3. **Start the Inference Service**:
   Run the FastAPI server. It will listen on `http://localhost:8000`.
   ```bash
   python predictor.py
   ```

## Integration with Web App
The Node.js backend (`backend/routes/grievances.js`) is already configured to call this service at `http://localhost:8000/analyze` whenever a new grievance is submitted.

### Response Format
The service returns:
- `category`: e.g., "Water", "Electricity"
- `priority`: "low", "medium", "high", or "critical"
- `urgencyScore`: 1-10
- `sentiment`: "positive", "neutral", "negative", or "critical"
- `clusterId`: Numeric ID for similarity grouping
- `keywords`: Array of important words from the description
