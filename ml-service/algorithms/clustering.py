import numpy as np
import pandas as pd
from typing import List, Dict, Any, Tuple
from models.schemas import DailyRecord, ClusterItem, ClusterAnalysisResponse

FEATURE_COLUMNS = [
    'focused_work_minutes',
    'habit_adherence_rate',
    'task_completion_rate',
    'distracting_screen_time_minutes',
    'goal_specific_work_minutes',
    'planned_tasks'
]

OUTCOME_COLUMN = 'actual_goal_progress_delta'

def _native_standard_scaler(X: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    means = np.mean(X, axis=0)
    stds = np.std(X, axis=0)
    stds[stds == 0] = 1.0
    return (X - means) / stds, means, stds

def _native_kmeans(X: np.ndarray, k: int, max_iter: int = 100, seed: int = 42) -> Tuple[np.ndarray, np.ndarray]:
    """Native Lloyd's K-Means with k-means++ initialization"""
    rng = np.random.RandomState(seed)
    n_samples, n_features = X.shape

    # K-means++ initialization
    centroids = [X[rng.choice(n_samples)]]
    for _ in range(1, k):
        dists = np.min([np.sum((X - c) ** 2, axis=1) for c in centroids], axis=0)
        probs = dists / (np.sum(dists) + 1e-9)
        next_idx = rng.choice(n_samples, p=probs)
        centroids.append(X[next_idx])
    centroids = np.array(centroids)

    labels = np.zeros(n_samples, dtype=int)
    for _ in range(max_iter):
        # Assign points to closest centroid
        distances = np.linalg.norm(X[:, None, :] - centroids[None, :, :], axis=2)
        new_labels = np.argmin(distances, axis=1)

        if np.array_equal(labels, new_labels):
            break
        labels = new_labels

        # Recompute centroids
        for i in range(k):
            members = X[labels == i]
            if len(members) > 0:
                centroids[i] = np.mean(members, axis=0)

    return labels, centroids

def _native_silhouette_score(X: np.ndarray, labels: np.ndarray) -> float:
    """Exact formula for silhouette score"""
    unique_labels = np.unique(labels)
    if len(unique_labels) < 2 or len(unique_labels) >= len(X):
        return 0.0

    n_samples = len(X)
    s_scores = np.zeros(n_samples)

    # Pairwise euclidean distance matrix
    dist_matrix = np.linalg.norm(X[:, None, :] - X[None, :, :], axis=2)

    for i in range(n_samples):
        own_cluster = labels[i]
        own_mask = (labels == own_cluster)
        
        if np.sum(own_mask) > 1:
            # Mean distance to other points in the same cluster
            a_i = np.sum(dist_matrix[i, own_mask]) / (np.sum(own_mask) - 1)
        else:
            a_i = 0.0

        # Mean distance to points in the closest other cluster
        b_i = float('inf')
        for other_cluster in unique_labels:
            if other_cluster == own_cluster:
                continue
            other_mask = (labels == other_cluster)
            if np.any(other_mask):
                d_to_other = np.mean(dist_matrix[i, other_mask])
                if d_to_other < b_i:
                    b_i = d_to_other

        if b_i == float('inf'):
            s_scores[i] = 0.0
        else:
            denom = max(a_i, b_i)
            s_scores[i] = (b_i - a_i) / denom if denom > 0 else 0.0

    return float(np.mean(s_scores))

def run_kmeans_clustering(records: List[DailyRecord], n_clusters: int = None) -> ClusterAnalysisResponse:
    if len(records) < 5:
        return ClusterAnalysisResponse(
            status="insufficient_data",
            message=f"K-Means clustering requires at least 5 daily records (received {len(records)}). Showing descriptive summary.",
            data_points=len(records),
            optimal_k=0,
            silhouette_score=0.0,
            clusters=[],
            assigned_clusters=[],
            key_findings=["Collect at least 5 to 7 days of daily tracking to discover recurring workflow clusters."],
            methodology_note="K-Means standardizes 6 behavioral features and evaluates clusters against recorded goal progress outcomes."
        )

    # Convert to DataFrame
    data = []
    for r in records:
        data.append({
            'date': r.date,
            'focused_work_minutes': float(r.focused_work_minutes),
            'habit_adherence_rate': float(r.habit_adherence_rate),
            'task_completion_rate': float(r.task_completion_rate),
            'distracting_screen_time_minutes': float(r.distracting_screen_time_minutes),
            'goal_specific_work_minutes': float(r.goal_specific_work_minutes),
            'planned_tasks': float(r.planned_tasks),
            'actual_goal_progress_delta': float(r.actual_goal_progress_delta),
            'is_holiday_or_rest_day': bool(r.is_holiday_or_rest_day)
        })
    df = pd.DataFrame(data)

    for col in FEATURE_COLUMNS + [OUTCOME_COLUMN]:
        df[col] = df[col].fillna(df[col].median() if not df[col].isna().all() else 0.0)

    X = df[FEATURE_COLUMNS].values
    X_scaled, _, _ = _native_standard_scaler(X)

    # Search optimal k
    max_k = min(4, len(records) - 1)
    
    use_sklearn = False
    try:
        from sklearn.cluster import KMeans
        from sklearn.metrics import silhouette_score
        use_sklearn = True
    except Exception:
        use_sklearn = False

    if n_clusters and 2 <= n_clusters <= max_k:
        best_k = n_clusters
        if use_sklearn:
            km = KMeans(n_clusters=best_k, random_state=42, n_init=10)
            labels = km.fit_predict(X_scaled)
            sil_score = float(silhouette_score(X_scaled, labels))
        else:
            labels, _ = _native_kmeans(X_scaled, best_k)
            sil_score = _native_silhouette_score(X_scaled, labels)
    else:
        best_k = 2
        best_sil = -1.0
        best_labels = None

        candidate_k = range(2, max_k + 1)
        for k in candidate_k:
            if use_sklearn:
                km = KMeans(n_clusters=k, random_state=42, n_init=10)
                cand_labels = km.fit_predict(X_scaled)
                score = float(silhouette_score(X_scaled, cand_labels))
            else:
                cand_labels, _ = _native_kmeans(X_scaled, k)
                score = _native_silhouette_score(X_scaled, cand_labels)

            if score > best_sil:
                best_sil = score
                best_k = k
                best_labels = cand_labels

        labels = best_labels if best_labels is not None else np.zeros(len(X), dtype=int)
        sil_score = round(max(0.0, float(best_sil)), 3)

    df['cluster'] = labels

    overall_mean_progress = float(df[OUTCOME_COLUMN].mean())

    clusters: List[ClusterItem] = []
    for cid in range(best_k):
        sub_df = df[df['cluster'] == cid]
        count = int(len(sub_df))
        if count == 0:
            continue
        pct = round((count / len(df)) * 100, 1)

        c_work = round(float(sub_df['focused_work_minutes'].mean()), 1)
        c_habit = round(float(sub_df['habit_adherence_rate'].mean()), 2)
        c_task = round(float(sub_df['task_completion_rate'].mean()), 2)
        c_distract = round(float(sub_df['distracting_screen_time_minutes'].mean()), 1)
        c_goal_work = round(float(sub_df['goal_specific_work_minutes'].mean()), 1)
        c_planned = round(float(sub_df['planned_tasks'].mean()), 1)
        c_prog = round(float(sub_df[OUTCOME_COLUMN].mean()), 2)

        name, desc = describe_cluster_profile(c_work, c_habit, c_distract, c_task, c_prog, overall_mean_progress)

        clusters.append(ClusterItem(
            cluster_id=cid,
            cluster_name=name,
            description=desc,
            sample_count=count,
            percentage_of_days=pct,
            avg_focused_work_minutes=c_work,
            avg_habit_adherence_rate=c_habit,
            avg_task_completion_rate=c_task,
            avg_distracting_screen_time=c_distract,
            avg_goal_specific_work_minutes=c_goal_work,
            avg_planned_tasks=c_planned,
            avg_goal_progress_delta=c_prog,
            is_high_progress_cluster=(c_prog > overall_mean_progress)
        ))

    clusters.sort(key=lambda c: c.avg_goal_progress_delta, reverse=True)

    assigned_clusters = []
    for _, row in df.iterrows():
        assigned_clusters.append({
            "date": row['date'],
            "cluster_id": int(row['cluster']),
            "focused_work_minutes": float(row['focused_work_minutes']),
            "habit_adherence_rate": float(row['habit_adherence_rate']),
            "distracting_screen_time_minutes": float(row['distracting_screen_time_minutes']),
            "actual_goal_progress_delta": float(row['actual_goal_progress_delta'])
        })

    findings = []
    if clusters:
        best_cluster = clusters[0]
        worst_cluster = clusters[-1]

        findings.append(
            f"Your highest progress occurred in '{best_cluster.cluster_name}' days (avg +{best_cluster.avg_goal_progress_delta}% goal progress), characterized by {int(best_cluster.avg_focused_work_minutes)}m focus work and {int(best_cluster.avg_habit_adherence_rate * 100)}% habit adherence."
        )
        if len(clusters) > 1 and worst_cluster.avg_distracting_screen_time > best_cluster.avg_distracting_screen_time:
            findings.append(
                f"Days in '{worst_cluster.cluster_name}' had {int(worst_cluster.avg_distracting_screen_time)}m distracting screen time and yielded only +{worst_cluster.avg_goal_progress_delta}% average daily progress."
            )
        findings.append(
            f"K-Means clustering separated {len(records)} days into {best_k} distinct operational patterns with a Silhouette Score of {sil_score}."
        )

    return ClusterAnalysisResponse(
        status="success",
        message="Cluster pattern analysis completed successfully.",
        data_points=len(records),
        optimal_k=best_k,
        silhouette_score=sil_score,
        clusters=clusters,
        assigned_clusters=assigned_clusters,
        key_findings=findings,
        methodology_note="K-Means groups days using behavioral inputs (work, habits, distraction, tasks). Actual goal progress delta was held out purely as an evaluation outcome to test which patterns yield meaningful results."
    )

def describe_cluster_profile(work: float, habit: float, distract: float, task: float, prog: float, overall_prog: float) -> Tuple[str, str]:
    if work >= 140 and habit >= 0.70 and distract <= 60:
        return (
            "Deep Flow & Routine",
            f"High focus ({int(work)} min), strong habit execution ({int(habit*100)}%), and controlled screen distraction ({int(distract)} min). Accompanied by strong progress (+{prog}%/day)."
        )
    elif distract >= 90 and work < 120:
        return (
            "High Distraction & Fragmented",
            f"Screen distraction peaked at {int(distract)} min with fragmented focus ({int(work)} min). Associated with below-average progress (+{prog}%/day)."
        )
    elif work >= 170 and prog <= (overall_prog * 0.75):
        return (
            "High Effort / Low Yield (Plateau)",
            f"High work hours ({int(work)} min) but relatively low milestone progress (+{prog}%/day), indicating potential friction, fatigue, or task sizing challenges."
        )
    elif habit >= 0.70 and work >= 80:
        return (
            "Steady Habit-Driven Consistency",
            f"Reliable habit completion ({int(habit*100)}%) with balanced work blocks ({int(work)} min) maintaining positive pacing (+{prog}%/day)."
        )
    elif work < 60 and habit < 0.40:
        return (
            "Low Activity / Rest Phase",
            f"Minimal work sessions ({int(work)} min) and reduced habit check-ins ({int(habit*100)}%). Typical of recovery, weekends, or disruptions."
        )
    else:
        return (
            "Moderate Adaptive Workflow",
            f"Balanced daily routine averaging {int(work)} min focused work, {int(distract)} min distraction, with +{prog}% daily progress."
        )
