from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class DailyRecord(BaseModel):
    date: str
    planned_tasks: int = 0
    completed_tasks: int = 0
    goal_relevant_tasks_completed: int = 0
    task_completion_rate: float = 0.0
    scheduled_habits: int = 0
    completed_habits: int = 0
    habit_adherence_rate: float = 0.0
    completed_habit_names: List[str] = Field(default_factory=list)
    focused_work_minutes: float = 0.0
    goal_specific_work_minutes: float = 0.0
    total_screen_time_minutes: float = 0.0
    distracting_screen_time_minutes: float = 0.0
    productive_screen_time_minutes: float = 0.0
    actual_goal_progress_delta: float = 0.0
    milestones_completed_count: int = 0
    consistency_score: float = 0.0
    is_holiday_or_rest_day: bool = False
    rest_day_note: Optional[str] = None

class ClusterItem(BaseModel):
    cluster_id: int
    cluster_name: str
    description: str
    sample_count: int
    percentage_of_days: float
    # Feature profiles
    avg_focused_work_minutes: float
    avg_habit_adherence_rate: float
    avg_task_completion_rate: float
    avg_distracting_screen_time: float
    avg_goal_specific_work_minutes: float
    avg_planned_tasks: float
    # Target outcome comparison
    avg_goal_progress_delta: float
    is_high_progress_cluster: bool

class ClusterAnalysisResponse(BaseModel):
    status: str
    message: str
    data_points: int
    optimal_k: int
    silhouette_score: float
    clusters: List[ClusterItem]
    assigned_clusters: List[Dict[str, Any]]
    key_findings: List[str]
    methodology_note: str

class AnomalyItem(BaseModel):
    date: str
    anomaly_score: float
    is_anomaly: bool
    is_holiday_or_rest_day: bool
    rest_day_note: Optional[str] = None
    severity: str  # 'mild', 'moderate', 'severe'
    contributing_factors: List[Dict[str, Any]]
    summary: str

class AnomalyAnalysisResponse(BaseModel):
    status: str
    message: str
    total_days: int
    anomaly_count: int
    user_marked_rest_days: int
    unexplained_anomalies: int
    anomalies: List[AnomalyItem]
    methodology_note: str

class AssociationRuleItem(BaseModel):
    antecedents: List[str]
    consequents: List[str]
    support: float
    confidence: float
    lift: float
    observation_count: int
    interpretation: str

class AssociationAnalysisResponse(BaseModel):
    status: str
    message: str
    total_transactions: int
    rules_count: int
    rules: List[AssociationRuleItem]
    top_habit_influences: List[str]
    caution_statement: str

class CorrelationPair(BaseModel):
    feature_a: str
    feature_b: str
    pearson_r: float
    pearson_p_value: float
    spearman_rho: float
    spearman_p_value: float
    direction: str
    strength: str
    interpretation: str

class CorrelationAnalysisResponse(BaseModel):
    status: str
    message: str
    total_samples: int
    correlations: List[CorrelationPair]
    key_takeaways: List[str]
    scientific_disclaimer: str

class MilestoneItem(BaseModel):
    id: Optional[str] = None
    title: str
    weight: float = 1.0
    target_quantity: Optional[float] = 1.0
    achieved_quantity: Optional[float] = 0.0
    is_completed: bool = False
    progress_percentage: float = 0.0

class GoalProgressRequest(BaseModel):
    start_date: str
    target_date: str
    current_date: Optional[str] = None
    target_quantity: Optional[float] = None
    achieved_quantity: Optional[float] = None
    progress_type: str = "milestone_based"  # 'numerical' or 'milestone_based'
    milestones: Optional[List[MilestoneItem]] = Field(default_factory=list)
    daily_progress_events: Optional[List[Dict[str, Any]]] = Field(default_factory=list)

class GoalProgressResponse(BaseModel):
    status: str
    actual_goal_progress_pct: float
    elapsed_time_pct: float
    progress_gap_pct: float
    pacing_status: str  # 'ahead', 'on_pace', 'mild_deficit', 'critical_deficit'
    pacing_label: str
    days_elapsed: int
    days_remaining: int
    total_duration_days: int
    milestones_total_weight: float
    milestones_completed_weight: float
    milestones_completed_count: int
    milestones_total_count: int
    average_daily_progress: float
    required_daily_progress_to_finish: float
    pacing_interpretation: str

class RecommendationItem(BaseModel):
    id: str
    title: str
    category: str
    priority: str  # 'high', 'medium', 'low'
    observed_issue: str
    supporting_data: str
    suggested_change: str
    expected_benefit_hypothesis: str
    confidence_level: str  # 'high', 'moderate', 'preliminary'
    data_limitation_note: str
    suggested_experiment_days: int
    suggested_target_behavior: str

class RecommendationAnalysisResponse(BaseModel):
    status: str
    message: str
    recommendations: List[RecommendationItem]
    insights_summary: str
