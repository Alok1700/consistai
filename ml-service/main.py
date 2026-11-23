from fastapi import FastAPI, HTTPException, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any
import uvicorn
import os

from models.schemas import (
    DailyRecord,
    ClusterAnalysisResponse,
    AnomalyAnalysisResponse,
    AssociationAnalysisResponse,
    CorrelationAnalysisResponse,
    GoalProgressRequest,
    GoalProgressResponse,
    RecommendationAnalysisResponse
)
from algorithms.clustering import run_kmeans_clustering
from algorithms.anomaly import run_isolation_forest_anomaly_detection
from algorithms.association import run_apriori_association_mining
from algorithms.correlation import run_correlation_analysis
from algorithms.pacing import calculate_goal_progress_and_pacing
from algorithms.recommendations import generate_workflow_recommendations
from data.synthetic_generator import generate_synthetic_activity_dataset

app = FastAPI(
    title="ConsistAI ML Analytics Service",
    description="Intelligent Goal Progress Analysis and Workflow Improvement ML Microservice",
    version="1.0.0"
)

# Allow CORS for backend and dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

INTERNAL_API_SECRET = os.getenv("ML_SERVICE_SECRET", "consistai_ml_secure_secret_2026")

def verify_authorization(x_ml_service_key: Optional[str] = Header(None)):
    # If a secret key is configured and passed, verify it; allow permissive in development
    if os.getenv("REQUIRE_AUTH", "false").lower() == "true":
        if x_ml_service_key != INTERNAL_API_SECRET:
            raise HTTPException(status_code=401, detail="Unauthorized: Invalid ML Service Key")

@app.get("/health")
def health_check():
    return {
        "status": "online",
        "service": "ConsistAI ML Engine",
        "version": "1.0.0",
        "supported_algorithms": [
            "K-Means Clustering",
            "Isolation Forest Anomaly Detection",
            "Apriori Association Rule Mining",
            "Pearson and Spearman Correlation",
            "Non-linear Goal Progress Pacing Engine",
            "Evidence-based Workflow Recommendation Engine"
        ]
    }

class ClusterRequest(FastAPI):
    records: List[DailyRecord]
    n_clusters: Optional[int] = None

@app.post("/analysis/clusters", response_model=ClusterAnalysisResponse)
def analyze_clusters(payload: Dict[str, Any]):
    records_raw = payload.get("records", [])
    n_clusters = payload.get("n_clusters", None)
    parsed_records = [DailyRecord(**r) for r in records_raw]
    return run_kmeans_clustering(parsed_records, n_clusters)

@app.post("/analysis/anomalies", response_model=AnomalyAnalysisResponse)
def analyze_anomalies(payload: Dict[str, Any]):
    records_raw = payload.get("records", [])
    contamination = payload.get("contamination", 0.1)
    parsed_records = [DailyRecord(**r) for r in records_raw]
    return run_isolation_forest_anomaly_detection(parsed_records, contamination)

@app.post("/analysis/associations", response_model=AssociationAnalysisResponse)
def analyze_associations(payload: Dict[str, Any]):
    records_raw = payload.get("records", [])
    min_support = payload.get("min_support", 0.15)
    min_confidence = payload.get("min_confidence", 0.45)
    min_lift = payload.get("min_lift", 1.05)
    parsed_records = [DailyRecord(**r) for r in records_raw]
    return run_apriori_association_mining(parsed_records, min_support, min_confidence, min_lift)

@app.post("/analysis/correlations", response_model=CorrelationAnalysisResponse)
def analyze_correlations(payload: Dict[str, Any]):
    records_raw = payload.get("records", [])
    parsed_records = [DailyRecord(**r) for r in records_raw]
    return run_correlation_analysis(parsed_records)

@app.post("/analysis/goal-progress", response_model=GoalProgressResponse)
def analyze_goal_progress(payload: GoalProgressRequest):
    return calculate_goal_progress_and_pacing(payload)

@app.post("/analysis/recommendations", response_model=RecommendationAnalysisResponse)
def analyze_recommendations(payload: Dict[str, Any]):
    records_raw = payload.get("records", [])
    goal_pacing_gap = payload.get("goal_pacing_gap", None)
    active_goal_title = payload.get("active_goal_title", "Primary Goal")
    parsed_records = [DailyRecord(**r) for r in records_raw]
    return generate_workflow_recommendations(parsed_records, goal_pacing_gap, active_goal_title)

@app.post("/analysis/generate-synthetic")
def get_synthetic_dataset(payload: Optional[Dict[str, Any]] = None):
    days = 60
    user_id = "demo_student_user"
    goal_id = "goal_dsa_200"
    if payload:
        days = payload.get("days", 60)
        user_id = payload.get("user_id", "demo_student_user")
        goal_id = payload.get("goal_id", "goal_dsa_200")
    dataset = generate_synthetic_activity_dataset(days_count=days, user_id=user_id, goal_id=goal_id)
    return {
        "status": "success",
        "count": len(dataset),
        "data": dataset
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
