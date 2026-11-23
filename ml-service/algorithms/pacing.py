from datetime import datetime, date
from typing import List, Dict, Any, Optional
from models.schemas import GoalProgressRequest, GoalProgressResponse, MilestoneItem

def calculate_goal_progress_and_pacing(req: GoalProgressRequest) -> GoalProgressResponse:
    # 1. Parse dates and calculate elapsed time
    try:
        start_dt = datetime.strptime(req.start_date[:10], "%Y-%m-%d").date()
        target_dt = datetime.strptime(req.target_date[:10], "%Y-%m-%d").date()
    except Exception:
        start_dt = date.today()
        target_dt = date.today()

    if req.current_date:
        try:
            curr_dt = datetime.strptime(req.current_date[:10], "%Y-%m-%d").date()
        except Exception:
            curr_dt = date.today()
    else:
        curr_dt = date.today()

    total_days = max(1, (target_dt - start_dt).days)
    days_elapsed = max(0, min(total_days, (curr_dt - start_dt).days))
    days_remaining = max(0, (target_dt - curr_dt).days)

    elapsed_time_pct = round(min(100.0, max(0.0, (days_elapsed / total_days) * 100.0)), 1)

    # 2. Calculate actual progress percentage
    actual_progress_pct = 0.0
    total_milestone_weight = 0.0
    completed_milestone_weight = 0.0
    completed_milestone_count = 0
    total_milestones_count = len(req.milestones) if req.milestones else 0

    if req.progress_type == "numerical" and req.target_quantity and req.target_quantity > 0:
        achieved = req.achieved_quantity or 0.0
        actual_progress_pct = round(min(100.0, max(0.0, (achieved / req.target_quantity) * 100.0)), 1)
    elif req.milestones and len(req.milestones) > 0:
        for m in req.milestones:
            w = float(m.weight if m.weight and m.weight > 0 else 1.0)
            total_milestone_weight += w

            # Partial progress calculation
            if m.is_completed:
                completed_milestone_weight += w
                completed_milestone_count += 1
            elif m.target_quantity and m.target_quantity > 0 and m.achieved_quantity:
                ratio = min(1.0, max(0.0, float(m.achieved_quantity) / float(m.target_quantity)))
                completed_milestone_weight += (w * ratio)

        if total_milestone_weight > 0:
            actual_progress_pct = round(min(100.0, max(0.0, (completed_milestone_weight / total_milestone_weight) * 100.0)), 1)
    else:
        # Fallback to achieved quantity if given
        if req.target_quantity and req.target_quantity > 0:
            actual_progress_pct = round(min(100.0, max(0.0, ((req.achieved_quantity or 0.0) / req.target_quantity) * 100.0)), 1)

    # 3. Calculate Progress Gap (pacing indicator, NOT a forecast)
    progress_gap_pct = round(actual_progress_pct - elapsed_time_pct, 1)

    # 4. Pacing status
    if progress_gap_pct >= 5.0:
        pacing_status = "ahead"
        pacing_label = f"+{progress_gap_pct}% (Ahead of Plan)"
        interpretation = f"You are currently pacing {progress_gap_pct} percentage points ahead of elapsed schedule time. Maintain current consistency."
    elif progress_gap_pct >= -5.0:
        pacing_status = "on_pace"
        pacing_label = f"{progress_gap_pct}% (On Pace)"
        interpretation = f"Actual progress ({actual_progress_pct}%) closely mirrors elapsed time ({elapsed_time_pct}%). You are tracking on schedule."
    elif progress_gap_pct >= -15.0:
        pacing_status = "mild_deficit"
        pacing_label = f"{progress_gap_pct}% (Mild Pacing Deficit)"
        interpretation = f"Actual progress ({actual_progress_pct}%) trails elapsed time ({elapsed_time_pct}%) by {abs(progress_gap_pct)} percentage points. Workflow optimization can help realign pacing."
    else:
        pacing_status = "critical_deficit"
        pacing_label = f"{progress_gap_pct}% (Significant Pacing Deficit)"
        interpretation = f"A pacing gap of {progress_gap_pct} percentage points detected. Consider breaking upcoming milestones into smaller weekly targets or scheduling dedicated focus blocks."

    # 5. Pacing rates
    avg_daily_progress = round(actual_progress_pct / max(1, days_elapsed), 2)
    remaining_progress = max(0.0, 100.0 - actual_progress_pct)
    required_daily_progress = round(remaining_progress / max(1, days_remaining), 2) if days_remaining > 0 else 0.0

    return GoalProgressResponse(
        status="success",
        actual_goal_progress_pct=actual_progress_pct,
        elapsed_time_pct=elapsed_time_pct,
        progress_gap_pct=progress_gap_pct,
        pacing_status=pacing_status,
        pacing_label=pacing_label,
        days_elapsed=days_elapsed,
        days_remaining=days_remaining,
        total_duration_days=total_days,
        milestones_total_weight=round(total_milestone_weight, 2),
        milestones_completed_weight=round(completed_milestone_weight, 2),
        milestones_completed_count=completed_milestone_count,
        milestones_total_count=total_milestones_count,
        average_daily_progress=avg_daily_progress,
        required_daily_progress_to_finish=required_daily_progress,
        pacing_interpretation=interpretation
    )
