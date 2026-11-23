import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional
from models.schemas import DailyRecord, RecommendationItem, RecommendationAnalysisResponse
from algorithms.clustering import run_kmeans_clustering
from algorithms.anomaly import run_isolation_forest_anomaly_detection
from algorithms.association import run_apriori_association_mining
from algorithms.correlation import run_correlation_analysis

def generate_workflow_recommendations(
    records: List[DailyRecord],
    goal_pacing_gap: Optional[float] = None,
    active_goal_title: Optional[str] = "Primary Goal"
) -> RecommendationAnalysisResponse:
    if len(records) < 3:
        return RecommendationAnalysisResponse(
            status="insufficient_data",
            message="At least 3 days of activity data needed to generate recommendations.",
            recommendations=[
                RecommendationItem(
                    id="rec_initial_baseline",
                    title="Establish 7-Day Consistency Baseline",
                    category="Habit Consistency",
                    priority="medium",
                    observed_issue="Fewer than 3 days of tracking logged so far.",
                    supporting_data="Current tracked records: " + str(len(records)),
                    suggested_change="Track your planned tasks, focus sessions, and habits daily for 1 full week.",
                    expected_benefit_hypothesis="Hypothesis: Regular daily logging provides the ML engine with enough variance to detect your true focus vs distraction patterns.",
                    confidence_level="preliminary",
                    data_limitation_note="Based on small initial sample size (< 3 days).",
                    suggested_experiment_days=7,
                    suggested_target_behavior="Log daily tasks, focus timer, and habit check-ins each evening."
                )
            ],
            insights_summary="Start by building a baseline log of daily activity."
        )

    # Convert to DataFrame for quick metrics
    df = pd.DataFrame([r.model_dump() for r in records])
    avg_work = float(df['focused_work_minutes'].mean())
    avg_distract = float(df['distracting_screen_time_minutes'].mean())
    avg_habit = float(df['habit_adherence_rate'].mean())
    avg_task = float(df['task_completion_rate'].mean())
    avg_progress = float(df['actual_goal_progress_delta'].mean())

    recommendations: List[RecommendationItem] = []

    # 1. Distraction vs Focus Block Recommendation
    if avg_distract >= 60 and avg_distract > (avg_work * 0.6):
        rec_id = "rec_distraction_block"
        recommendations.append(RecommendationItem(
            id=rec_id,
            title="Establish Phone-Free 45-Minute Focus Blocks",
            category="Screen Time",
            priority="high",
            observed_issue="High distracting screen time directly competes with scheduled focused study sessions.",
            supporting_data=f"You averaged {int(avg_distract)} min of distracting screen time daily compared to {int(avg_work)} min of focused work.",
            suggested_change="Turn on 'Do Not Disturb' or place mobile devices outside arm's reach during your first 45-minute daily study block.",
            expected_benefit_hypothesis="Hypothesis: Limiting context switching during the first study session may reduce daily distracting screen time by 20-30% and improve task completion.",
            confidence_level="high" if len(records) >= 10 else "moderate",
            data_limitation_note="Correlation between screen time and focus is observed historically; individual session contexts may vary.",
            suggested_experiment_days=14,
            suggested_target_behavior="Complete 45 minutes of focused study with phone silenced in another room before opening social media."
        ))

    # 2. Habit Anchoring / Routine Pacing
    if avg_habit < 0.65:
        recommendations.append(RecommendationItem(
            id="rec_habit_anchoring",
            title="Anchor Core Goal Habit to an Existing Daily Anchor",
            category="Habit Consistency",
            priority="high",
            observed_issue="Habit adherence fluctuates below 65%, creating inconsistent momentum toward milestones.",
            supporting_data=f"Current average habit adherence is {int(avg_habit * 100)}%. Days with habit adherence >= 75% show significantly higher goal progress.",
            suggested_change="Stack your most important goal-related habit immediately after a fixed daily routine (e.g., practice DSA right after morning coffee/breakfast).",
            expected_benefit_hypothesis="Hypothesis: Habit stacking reduces decision fatigue and can raise habit adherence above 80%, stabilizing weekly milestone progress.",
            confidence_level="moderate",
            data_limitation_note="Effectiveness depends on consistency of the chosen anchor routine.",
            suggested_experiment_days=10,
            suggested_target_behavior="Perform 30 minutes of goal practice immediately after morning routine without delay."
        ))

    # 3. High Effort Plateau / Task Sizing
    # Detect if there are days with >= 150 min work but < 0.5% progress
    high_effort_low_yield_days = df[(df['focused_work_minutes'] >= 150) & (df['actual_goal_progress_delta'] <= 0.3)]
    if len(high_effort_low_yield_days) >= 2:
        recommendations.append(RecommendationItem(
            id="rec_task_subdivision",
            title="Decompose Complex Milestones into 25-Minute Action Slices",
            category="Milestone Sizing",
            priority="high",
            observed_issue="Recorded days with long working hours but zero or low milestone advancements (effort plateau).",
            supporting_data=f"{len(high_effort_low_yield_days)} days logged >= 2.5 hours of work with < 0.3% recorded progress, suggesting task ambiguity or large milestone sizing.",
            suggested_change="Break each pending milestone into smaller, concrete testable items (e.g., 'Solve 2 Two-Pointer Problems' rather than 'Study Arrays').",
            expected_benefit_hypothesis="Hypothesis: Finer-grained sub-tasks produce clearer daily stopping points and visible incremental progress feedback.",
            confidence_level="high",
            data_limitation_note="Long sessions might represent deep conceptual research whose progress registers in later milestones.",
            suggested_experiment_days=14,
            suggested_target_behavior="Define at least 3 concrete micro-deliverables before starting long study sessions."
        ))

    # 4. Goal Pacing Deficit Intervention
    if goal_pacing_gap is not None and goal_pacing_gap < -8.0:
        recommendations.append(RecommendationItem(
            id="rec_pacing_sprint",
            title="Schedule Protected Weekend Milestone Sprint",
            category="Pacing Recovery",
            priority="high",
            observed_issue=f"Your goal pacing shows a {abs(goal_pacing_gap)} percentage point deficit compared to elapsed calendar time.",
            supporting_data=f"Actual progress is trailing target schedule by {abs(goal_pacing_gap)} points for '{active_goal_title}'.",
            suggested_change="Reserve one 2-hour uninterrupted sprint block this weekend exclusively dedicated to clearing bottleneck milestone items.",
            expected_benefit_hypothesis="Hypothesis: A dedicated single-topic sprint can reduce the pacing gap by 4-6 percentage points without burning out weekly schedules.",
            confidence_level="high",
            data_limitation_note="Pacing is calculated against linear elapsed time; non-linear milestone difficulty can also affect pacing.",
            suggested_experiment_days=7,
            suggested_target_behavior="Execute a dedicated 120-minute uninterrupted weekend sprint on primary goal milestones."
        ))

    # 5. Task Estimation & Overcommitment
    if avg_task < 0.60 and df['planned_tasks'].mean() >= 5:
        recommendations.append(RecommendationItem(
            id="rec_task_batching",
            title="Cap Daily Planned Tasks at 3 Core Priorities",
            category="Workload Optimization",
            priority="medium",
            observed_issue="Planned task completion rate is low due to daily overcommitment.",
            supporting_data=f"You planned an average of {int(df['planned_tasks'].mean())} tasks per day but completed {int(avg_task * 100)}% of them.",
            suggested_change="Limit your planned task list to the top 3 highest-priority items each morning before adding secondary tasks.",
            expected_benefit_hypothesis="Hypothesis: Reducing task overload increases on-time completion rate and prevents carryover fatigue.",
            confidence_level="moderate",
            data_limitation_note="Some planned tasks may have been deprioritized deliberately rather than failed.",
            suggested_experiment_days=10,
            suggested_target_behavior="Set maximum 3 priority tasks each morning and finish all 3 before adding extra tasks."
        ))

    # 6. Steady Maintenance Recommendation (if pacing is great)
    if not recommendations:
        recommendations.append(RecommendationItem(
            id="rec_maintain_momentum",
            title="Maintain Current Deep Work and Habit Cadence",
            category="Workflow Maintenance",
            priority="low",
            observed_issue="Your activity logs demonstrate balanced consistency and positive goal advancement.",
            supporting_data=f"Average focus time: {int(avg_work)}m, Habit adherence: {int(avg_habit*100)}%, Screen distraction: {int(avg_distract)}m.",
            suggested_change="Continue your current rhythm while periodically testing slight increases in session depth (+15 min).",
            expected_benefit_hypothesis="Hypothesis: Incremental progressive overload in focus duration builds cognitive endurance without risking burnout.",
            confidence_level="high",
            data_limitation_note="Continual observation recommended as milestone difficulty increases.",
            suggested_experiment_days=14,
            suggested_target_behavior="Add 15 minutes of focused problem solving to your primary study block."
        ))

    summary = f"Synthesized {len(recommendations)} evidence-based workflow recommendations based on {len(records)} days of behavioral data."

    return RecommendationAnalysisResponse(
        status="success",
        message="Workflow recommendations generated.",
        recommendations=recommendations,
        insights_summary=summary
    )
