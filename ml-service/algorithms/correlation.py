import numpy as np
import pandas as pd
from typing import List, Dict, Any
from scipy.stats import pearsonr, spearmanr
from models.schemas import DailyRecord, CorrelationPair, CorrelationAnalysisResponse

def run_correlation_analysis(records: List[DailyRecord]) -> CorrelationAnalysisResponse:
    if len(records) < 5:
        return CorrelationAnalysisResponse(
            status="insufficient_data",
            message=f"Correlation analysis requires at least 5 records (received {len(records)}).",
            total_samples=len(records),
            correlations=[],
            key_takeaways=["Log at least 5 days of data to compute statistical correlations."],
            scientific_disclaimer="Correlation indicates linear or monotonic relationship strength; it does not establish causation."
        )

    data = []
    for r in records:
        data.append({
            'focused_work_minutes': float(r.focused_work_minutes),
            'goal_specific_work_minutes': float(r.goal_specific_work_minutes),
            'habit_adherence_rate': float(r.habit_adherence_rate),
            'task_completion_rate': float(r.task_completion_rate),
            'distracting_screen_time_minutes': float(r.distracting_screen_time_minutes),
            'productive_screen_time_minutes': float(r.productive_screen_time_minutes),
            'goal_progress_delta': float(r.actual_goal_progress_delta)
        })
    df = pd.DataFrame(data).fillna(0.0)

    # Pairs to evaluate against goal_progress_delta, and among work/distraction
    eval_pairs = [
        ('focused_work_minutes', 'goal_progress_delta', 'Focused Work (min)', 'Daily Goal Progress (%)'),
        ('goal_specific_work_minutes', 'goal_progress_delta', 'Goal Work (min)', 'Daily Goal Progress (%)'),
        ('habit_adherence_rate', 'goal_progress_delta', 'Habit Adherence', 'Daily Goal Progress (%)'),
        ('distracting_screen_time_minutes', 'goal_progress_delta', 'Distracting Screen Time (min)', 'Daily Goal Progress (%)'),
        ('task_completion_rate', 'goal_progress_delta', 'Task Completion Rate', 'Daily Goal Progress (%)'),
        ('distracting_screen_time_minutes', 'focused_work_minutes', 'Distracting Screen Time (min)', 'Focused Work (min)'),
        ('productive_screen_time_minutes', 'goal_progress_delta', 'Productive Screen Time (min)', 'Daily Goal Progress (%)')
    ]

    correlation_items: List[CorrelationPair] = []
    takeaways: List[str] = []

    for f_a, f_b, name_a, name_b in eval_pairs:
        series_a = df[f_a].values
        series_b = df[f_b].values

        # If variance is 0, correlation is undefined
        if np.std(series_a) == 0 or np.std(series_b) == 0:
            continue

        try:
            p_r, p_p = pearsonr(series_a, series_b)
            s_rho, s_p = spearmanr(series_a, series_b)

            p_r = round(float(p_r), 3)
            p_p = round(float(p_p), 4)
            s_rho = round(float(s_rho), 3)
            s_p = round(float(s_p), 4)

            # Determine direction & strength
            abs_r = abs(p_r)
            direction = "positive" if p_r > 0 else ("negative" if p_r < 0 else "neutral")
            
            if abs_r >= 0.7:
                strength = "strong"
            elif abs_r >= 0.4:
                strength = "moderate"
            elif abs_r >= 0.2:
                strength = "weak"
            else:
                strength = "negligible"

            interp = explain_correlation(name_a, name_b, p_r, p_p, direction, strength)

            correlation_items.append(CorrelationPair(
                feature_a=name_a,
                feature_b=name_b,
                pearson_r=p_r,
                pearson_p_value=p_p,
                spearman_rho=s_rho,
                spearman_p_value=s_p,
                direction=direction,
                strength=strength,
                interpretation=interp
            ))

            if p_p < 0.05 and strength in ['moderate', 'strong']:
                takeaways.append(interp)

        except Exception:
            continue

    if not takeaways:
        takeaways.append("Current data shows weak or mixed correlations. As more varied days are logged, clearer relationships will emerge.")

    return CorrelationAnalysisResponse(
        status="success",
        message="Pearson and Spearman correlation analysis completed.",
        total_samples=len(records),
        correlations=correlation_items,
        key_takeaways=takeaways[:4],
        scientific_disclaimer="Remember: Correlation reflects statistical association between observed variables, not that one directly caused the other."
    )

def explain_correlation(name_a: str, name_b: str, r: float, p: float, direction: str, strength: str) -> str:
    sig_str = "statistically significant (p < 0.05)" if p < 0.05 else "not statistically significant (p >= 0.05)"
    if direction == "positive":
        return f"{name_a} shows a {strength} positive correlation (r = {r}) with {name_b} ({sig_str}). Increases in {name_a} generally accompany higher {name_b}."
    elif direction == "negative":
        return f"{name_a} shows a {strength} negative correlation (r = {r}) with {name_b} ({sig_str}). Days with higher {name_a} consistently coincide with lower {name_b}."
    else:
        return f"No discernible linear relationship observed between {name_a} and {name_b} (r = {r})."
