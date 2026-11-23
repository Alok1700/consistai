import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional
from models.schemas import DailyRecord, AnomalyItem, AnomalyAnalysisResponse

ANOMALY_FEATURES = [
    'focused_work_minutes',
    'distracting_screen_time_minutes',
    'habit_adherence_rate',
    'task_completion_rate',
    'goal_specific_work_minutes',
    'actual_goal_progress_delta'
]

# --- Native Isolation Forest Implementation ---
class _NativeITreeNode:
    def __init__(self, left=None, right=None, split_feature=None, split_value=None, size=0):
        self.left = left
        self.right = right
        self.split_feature = split_feature
        self.split_value = split_value
        self.size = size

def _c_factor(n: int) -> float:
    if n <= 1:
        return 1.0
    if n == 2:
        return 1.0
    return 2.0 * (np.log(n - 1) + 0.5772156649) - (2.0 * (n - 1) / n)

def _build_itree(X: np.ndarray, current_depth: int, max_depth: int, rng: np.random.RandomState) -> _NativeITreeNode:
    n_samples, n_features = X.shape
    if current_depth >= max_depth or n_samples <= 1:
        return _NativeITreeNode(size=n_samples)

    feat = rng.randint(0, n_features)
    f_min = np.min(X[:, feat])
    f_max = np.max(X[:, feat])

    if f_min == f_max:
        return _NativeITreeNode(size=n_samples)

    split_val = rng.uniform(f_min, f_max)
    left_mask = X[:, feat] < split_val
    right_mask = ~left_mask

    if np.sum(left_mask) == 0 or np.sum(right_mask) == 0:
        return _NativeITreeNode(size=n_samples)

    left_child = _build_itree(X[left_mask], current_depth + 1, max_depth, rng)
    right_child = _build_itree(X[right_mask], current_depth + 1, max_depth, rng)

    return _NativeITreeNode(
        left=left_child,
        right=right_child,
        split_feature=feat,
        split_value=split_val,
        size=n_samples
    )

def _path_length(x: np.ndarray, node: _NativeITreeNode, current_depth: int) -> float:
    if node.left is None or node.right is None:
        return current_depth + _c_factor(node.size)
    if x[node.split_feature] < node.split_value:
        return _path_length(x, node.left, current_depth + 1)
    else:
        return _path_length(x, node.right, current_depth + 1)

def _native_isolation_forest(X: np.ndarray, n_trees: int = 100, seed: int = 42) -> np.ndarray:
    n_samples = len(X)
    max_depth = int(np.ceil(np.log2(max(n_samples, 2))))
    rng = np.random.RandomState(seed)

    trees = []
    for _ in range(n_trees):
        tree = _build_itree(X, current_depth=0, max_depth=max_depth, rng=rng)
        trees.append(tree)

    paths = np.zeros((n_samples, n_trees))
    for t_idx, tree in enumerate(trees):
        for i in range(n_samples):
            paths[i, t_idx] = _path_length(X[i], tree, 0)

    mean_paths = np.mean(paths, axis=1)
    c_n = _c_factor(n_samples)
    scores = 2.0 ** (- (mean_paths / c_n)) # Ranges ~0 to 1, higher = more anomalous
    return scores

def run_isolation_forest_anomaly_detection(records: List[DailyRecord], contamination: float = 0.1) -> AnomalyAnalysisResponse:
    if len(records) < 7:
        return AnomalyAnalysisResponse(
            status="insufficient_data",
            message=f"Isolation Forest requires at least 7 days of historical logs (received {len(records)}).",
            total_days=len(records),
            anomaly_count=0,
            user_marked_rest_days=sum(1 for r in records if r.is_holiday_or_rest_day),
            unexplained_anomalies=0,
            anomalies=[],
            methodology_note="Isolation Forest builds randomized trees to isolate data points that deviate from historical baselines."
        )

    # Convert to DataFrame
    data = []
    for r in records:
        data.append({
            'date': r.date,
            'focused_work_minutes': float(r.focused_work_minutes),
            'distracting_screen_time_minutes': float(r.distracting_screen_time_minutes),
            'habit_adherence_rate': float(r.habit_adherence_rate),
            'task_completion_rate': float(r.task_completion_rate),
            'goal_specific_work_minutes': float(r.goal_specific_work_minutes),
            'actual_goal_progress_delta': float(r.actual_goal_progress_delta),
            'is_holiday_or_rest_day': bool(r.is_holiday_or_rest_day),
            'rest_day_note': r.rest_day_note
        })
    df = pd.DataFrame(data)

    for col in ANOMALY_FEATURES:
        df[col] = df[col].fillna(df[col].median() if not df[col].isna().all() else 0.0)

    active_baseline = df[~df['is_holiday_or_rest_day']]
    if len(active_baseline) < 3:
        active_baseline = df

    baseline_means = active_baseline[ANOMALY_FEATURES].mean().to_dict()
    baseline_stds = active_baseline[ANOMALY_FEATURES].std().replace(0, 1e-6).to_dict()

    X = df[ANOMALY_FEATURES].values
    actual_contamination = max(0.05, min(0.25, contamination if contamination else 0.1))

    # Try sklearn or use native Isolation Forest
    use_sklearn = False
    try:
        from sklearn.ensemble import IsolationForest
        use_sklearn = True
    except Exception:
        use_sklearn = False

    if use_sklearn:
        iso_forest = IsolationForest(
            n_estimators=100,
            contamination=actual_contamination,
            random_state=42
        )
        preds = iso_forest.fit_predict(X)  # -1 = anomaly, 1 = normal
        scores_raw = iso_forest.score_samples(X)
        normalized_scores = [round(max(0.0, min(1.0, float((-s - 0.3) / 0.4))), 2) for s in scores_raw]
        is_anom_list = [(p == -1) for p in preds]
    else:
        native_scores = _native_isolation_forest(X, n_trees=100)
        # Threshold by percentile corresponding to contamination
        threshold = np.percentile(native_scores, 100.0 * (1.0 - actual_contamination))
        is_anom_list = [(s >= threshold) for s in native_scores]
        normalized_scores = [round(float(s), 2) for s in native_scores]

    anomaly_items: List[AnomalyItem] = []
    anomaly_count = 0
    rest_days_count = 0
    unexplained_count = 0

    for i, row in df.iterrows():
        is_anom = is_anom_list[i]
        score = normalized_scores[i]
        is_rest = bool(row['is_holiday_or_rest_day'])

        if is_rest:
            rest_days_count += 1

        if is_anom:
            anomaly_count += 1
            if not is_rest:
                unexplained_count += 1

        # Calculate contributing factors via z-scores
        contributions = []
        for feat in ANOMALY_FEATURES:
            val = float(row[feat])
            mean_val = float(baseline_means.get(feat, 0.0))
            std_val = float(baseline_stds.get(feat, 1.0))
            z_score = round((val - mean_val) / std_val, 2)

            if abs(z_score) >= 1.2:
                direction = "significantly higher" if z_score > 0 else "significantly lower"
                contributions.append({
                    "feature": feat,
                    "readable_feature": feat.replace('_', ' ').capitalize(),
                    "actual_value": round(val, 2),
                    "baseline_mean": round(mean_val, 2),
                    "z_score": z_score,
                    "direction": direction,
                    "deviation_pct": round(((val - mean_val) / (mean_val + 1e-5)) * 100, 1)
                })

        contributions.sort(key=lambda c: abs(c['z_score']), reverse=True)
        severity = "severe" if score >= 0.70 else ("moderate" if score >= 0.50 else "mild")
        summary = generate_anomaly_summary(row, is_anom, is_rest, contributions)

        rest_note_val = str(row['rest_day_note']) if pd.notna(row['rest_day_note']) else None
        anomaly_items.append(AnomalyItem(
            date=str(row['date']),
            anomaly_score=score,
            is_anomaly=is_anom,
            is_holiday_or_rest_day=is_rest,
            rest_day_note=rest_note_val,
            severity=severity,
            contributing_factors=contributions[:4],
            summary=summary
        ))

    return AnomalyAnalysisResponse(
        status="success",
        message="Isolation Forest anomaly analysis completed.",
        total_days=len(records),
        anomaly_count=anomaly_count,
        user_marked_rest_days=rest_days_count,
        unexplained_anomalies=unexplained_count,
        anomalies=anomaly_items,
        methodology_note="Isolation Forest builds randomized trees to isolate data points that deviate from historical baselines. Outliers are explained via multivariate z-score deviations."
    )

def generate_anomaly_summary(row: pd.Series, is_anom: bool, is_rest: bool, contributions: List[Dict[str, Any]]) -> str:
    if is_rest:
        note = f" (Note: {row['rest_day_note']})" if row['rest_day_note'] else ""
        return f"User-marked holiday or rest day{note}. Deviations from typical routine are deliberate."

    if not is_anom:
        return "Routine day conforming to normal activity bounds."

    reasons = []
    for c in contributions[:2]:
        reasons.append(f"{c['readable_feature']} was {c['direction']} ({c['actual_value']})")

    if row['focused_work_minutes'] >= 180 and row['actual_goal_progress_delta'] <= 0.3:
        return f"High effort plateau: {int(row['focused_work_minutes'])}m focused work logged with minimal milestone progress recorded ({row['actual_goal_progress_delta']}%)."

    if row['distracting_screen_time_minutes'] >= 140:
        return f"Spike in distraction: {int(row['distracting_screen_time_minutes'])}m distracting screen time exceeded baseline."

    if row['habit_adherence_rate'] <= 0.2 and row['focused_work_minutes'] < 30:
        return f"Sudden drop in routine: habit completion dropped to {int(row['habit_adherence_rate']*100)}% with minimal work."

    if reasons:
        return f"Unusual combination: {', '.join(reasons)} compared to your baseline."

    return "Multivariate behavioral outlier detected by isolation tree depth."
