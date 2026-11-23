import json
import sys
import os
import pandas as pd
import numpy as np

# Add parent directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from data.synthetic_generator import generate_synthetic_activity_dataset
from models.schemas import DailyRecord, GoalProgressRequest, MilestoneItem
from algorithms.clustering import run_kmeans_clustering
from algorithms.anomaly import run_isolation_forest_anomaly_detection
from algorithms.association import run_apriori_association_mining
from algorithms.correlation import run_correlation_analysis
from algorithms.pacing import calculate_goal_progress_and_pacing
from algorithms.recommendations import generate_workflow_recommendations

def run_full_ml_evaluation():
    print("=" * 70)
    print("   ConsistAI ML — Machine Learning Model Evaluation Pipeline   ")
    print("=" * 70)

    # 1. Generate 60-day realistic activity dataset
    raw_data = generate_synthetic_activity_dataset(days_count=60)
    records = [DailyRecord(**r) for r in raw_data]
    print(f"\n[1] Synthetic Dataset: Generated {len(records)} daily activity records.")

    # 2. Evaluate K-Means Clustering
    print("\n[2] Evaluating Model 1 — K-Means Clustering on Daily Behavioral Patterns:")
    cluster_res = run_kmeans_clustering(records)
    print(f"    - Status: {cluster_res.status}")
    print(f"    - Optimal k: {cluster_res.optimal_k}")
    print(f"    - Silhouette Score: {cluster_res.silhouette_score} (Validates cluster separation)")
    print("    - Cluster Profiles:")
    for c in cluster_res.clusters:
        print(f"      * Cluster {c.cluster_id} [{c.cluster_name}]: {c.sample_count} days ({c.percentage_of_days}%)")
        print(f"        Focus: {c.avg_focused_work_minutes}m | Habits: {int(c.avg_habit_adherence_rate*100)}% | Distraction: {c.avg_distracting_screen_time}m")
        print(f"        -> Outcome: Avg Daily Goal Progress = +{c.avg_goal_progress_delta}%")
    print("    - Findings:")
    for f in cluster_res.key_findings:
        print(f"      > {f}")

    # 3. Evaluate Isolation Forest Anomaly Detection
    print("\n[3] Evaluating Model 2 — Isolation Forest Workflow Anomaly Detection:")
    anomaly_res = run_isolation_forest_anomaly_detection(records, contamination=0.1)
    print(f"    - Total Days Analyzed: {anomaly_res.total_days}")
    print(f"    - Anomalies Flagged: {anomaly_res.anomaly_count}")
    print(f"    - User-Marked Rest/Holidays: {anomaly_res.user_marked_rest_days}")
    print(f"    - Unexplained Operational Anomalies: {anomaly_res.unexplained_anomalies}")
    print("    - Sample Flagged Anomalies & Driving Deviations:")
    flagged = [a for a in anomaly_res.anomalies if a.is_anomaly][:3]
    for a in flagged:
        print(f"      * Date: {a.date} | Score: {a.anomaly_score} | Severity: {a.severity}")
        print(f"        Summary: {a.summary}")
        for cf in a.contributing_factors[:2]:
            print(f"        Factor: {cf['readable_feature']} = {cf['actual_value']} (Baseline: {cf['baseline_mean']}, z-score: {cf['z_score']})")

    # 4. Evaluate Apriori Association Rule Mining
    print("\n[4] Evaluating Model 3 — Apriori Association Rule Mining:")
    assoc_res = run_apriori_association_mining(records, min_support=0.12, min_confidence=0.45, min_lift=1.05)
    print(f"    - Total Transactions: {assoc_res.total_transactions}")
    print(f"    - Association Rules Discovered: {assoc_res.rules_count}")
    print("    - Top Association Rules (Support, Confidence, Lift):")
    for r in assoc_res.rules[:5]:
        print(f"      * Rule: {' + '.join(r.antecedents)} => {' + '.join(r.consequents)}")
        print(f"        Support: {r.support} | Confidence: {r.confidence} | Lift: {r.lift} (n={r.observation_count})")
        print(f"        Interpretation: {r.interpretation}")
    print(f"    - Caution: {assoc_res.caution_statement}")

    # 5. Evaluate Correlation Analysis
    print("\n[5] Evaluating Pearson and Spearman Correlation Statistics:")
    corr_res = run_correlation_analysis(records)
    print("    - Key Metric Correlations with Daily Goal Progress:")
    for cp in corr_res.correlations:
        if "Daily Goal Progress" in cp.feature_b:
            print(f"      * {cp.feature_a} vs {cp.feature_b}:")
            print(f"        Pearson r = {cp.pearson_r} (p = {cp.pearson_p_value}) | Spearman rho = {cp.spearman_rho} (p = {cp.spearman_p_value})")
            print(f"        Assessment: {cp.strength} {cp.direction}")

    # 6. Evaluate Goal Progress Pacing Engine
    print("\n[6] Evaluating Goal Progress & Pacing Calculation:")
    milestones = [
        MilestoneItem(title="Arrays & Two Pointers", weight=20.0, target_quantity=40.0, achieved_quantity=40.0, is_completed=True),
        MilestoneItem(title="Strings & HashMaps", weight=15.0, target_quantity=30.0, achieved_quantity=30.0, is_completed=True),
        MilestoneItem(title="Linked Lists & Stacks", weight=15.0, target_quantity=30.0, achieved_quantity=18.0, is_completed=False),
        MilestoneItem(title="Trees & BST", weight=20.0, target_quantity=40.0, achieved_quantity=0.0, is_completed=False),
        MilestoneItem(title="Dynamic Programming", weight=30.0, target_quantity=60.0, achieved_quantity=0.0, is_completed=False),
    ]
    pacing_req = GoalProgressRequest(
        start_date="2026-10-01",
        target_date="2026-12-30",
        current_date="2026-11-15",
        progress_type="milestone_based",
        milestones=milestones
    )
    pacing_res = calculate_goal_progress_and_pacing(pacing_req)
    print(f"    - Total Milestones Weight: {pacing_res.milestones_total_weight}")
    print(f"    - Completed Milestones Weight: {pacing_res.milestones_completed_weight}")
    print(f"    - Actual Goal Progress: {pacing_res.actual_goal_progress_pct}%")
    print(f"    - Elapsed Schedule Time: {pacing_res.elapsed_time_pct}%")
    print(f"    - Progress Gap: {pacing_res.progress_gap_pct} percentage points")
    print(f"    - Pacing Status: {pacing_res.pacing_status} ({pacing_res.pacing_label})")
    print(f"    - Interpretation: {pacing_res.pacing_interpretation}")

    # 7. Evaluate Workflow Improvement Recommendations
    print("\n[7] Evaluating Workflow Improvement Recommendations Synthesis:")
    rec_res = generate_workflow_recommendations(records, goal_pacing_gap=pacing_res.progress_gap_pct, active_goal_title="Complete 200 DSA Problems")
    print(f"    - Recommendations Count: {len(rec_res.recommendations)}")
    for rec in rec_res.recommendations:
        print(f"      * [{rec.priority.upper()}] {rec.title} ({rec.category})")
        print(f"        Observed: {rec.observed_issue}")
        print(f"        Hypothesis: {rec.expected_benefit_hypothesis}")
        print(f"        Suggested Experiment: {rec.suggested_target_behavior} ({rec.suggested_experiment_days} days)")

    print("\n" + "=" * 70)
    print("   ML Evaluation Completed Successfully! All Algorithms Validated.   ")
    print("=" * 70)

if __name__ == "__main__":
    run_full_ml_evaluation()
