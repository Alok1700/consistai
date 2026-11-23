import sys
import os
import unittest
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from models.schemas import DailyRecord, GoalProgressRequest, MilestoneItem
from algorithms.clustering import run_kmeans_clustering
from algorithms.anomaly import run_isolation_forest_anomaly_detection
from algorithms.association import run_apriori_association_mining
from algorithms.correlation import run_correlation_analysis
from algorithms.pacing import calculate_goal_progress_and_pacing
from algorithms.recommendations import generate_workflow_recommendations
from data.synthetic_generator import generate_synthetic_activity_dataset

class TestMLEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.raw_data = generate_synthetic_activity_dataset(days_count=30)
        cls.records = [DailyRecord(**r) for r in cls.raw_data]

    def test_clustering_success(self):
        res = run_kmeans_clustering(self.records)
        self.assertEqual(res.status, "success")
        self.assertGreaterEqual(res.optimal_k, 2)
        self.assertGreater(len(res.clusters), 0)
        self.assertIsInstance(res.silhouette_score, float)

    def test_anomaly_detection(self):
        res = run_isolation_forest_anomaly_detection(self.records, contamination=0.1)
        self.assertEqual(res.status, "success")
        self.assertEqual(res.total_days, 30)
        self.assertGreaterEqual(res.anomaly_count, 0)
        self.assertEqual(len(res.anomalies), 30)

    def test_association_mining(self):
        res = run_apriori_association_mining(self.records, min_support=0.10, min_confidence=0.40)
        self.assertIn(res.status, ["success", "no_rules"])
        self.assertEqual(res.total_transactions, 30)
        self.assertIn("Scientific Note", res.caution_statement)

    def test_correlation_analysis(self):
        res = run_correlation_analysis(self.records)
        self.assertEqual(res.status, "success")
        self.assertGreater(len(res.correlations), 0)

    def test_goal_progress_pacing(self):
        milestones = [
            MilestoneItem(title="Phase 1", weight=40.0, achieved_quantity=40.0, target_quantity=40.0, is_completed=True),
            MilestoneItem(title="Phase 2", weight=60.0, achieved_quantity=30.0, target_quantity=60.0, is_completed=False)
        ]
        req = GoalProgressRequest(
            start_date="2026-10-01",
            target_date="2026-12-31",
            current_date="2026-11-15",
            progress_type="milestone_based",
            milestones=milestones
        )
        res = calculate_goal_progress_and_pacing(req)
        self.assertEqual(res.status, "success")
        self.assertEqual(res.milestones_completed_weight, 70.0) # 40 + (60 * 30/60) = 70
        self.assertEqual(res.actual_goal_progress_pct, 70.0)
        self.assertIn(res.pacing_status, ["ahead", "on_pace", "mild_deficit", "critical_deficit"])

    def test_recommendation_synthesis(self):
        res = generate_workflow_recommendations(self.records, goal_pacing_gap=-10.0, active_goal_title="Test Goal")
        self.assertEqual(res.status, "success")
        self.assertGreater(len(res.recommendations), 0)
        first = res.recommendations[0]
        self.assertTrue(hasattr(first, "expected_benefit_hypothesis"))
        self.assertTrue(hasattr(first, "suggested_experiment_days"))

if __name__ == "__main__":
    unittest.main()
