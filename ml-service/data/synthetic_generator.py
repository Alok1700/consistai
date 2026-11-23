import random
from datetime import datetime, timedelta
from typing import List, Dict, Any

HABIT_CATALOG = [
    "Practice DSA Problems",
    "Study System Design",
    "Review Tech Documentation",
    "Morning Physical Exercise",
    "Commit Code to GitHub"
]

APP_CATALOG = [
    {"name": "VS Code", "category": "Development", "is_distracting": False},
    {"name": "LeetCode / GitHub", "category": "Learning", "is_distracting": False},
    {"name": "Chrome Docs", "category": "Research", "is_distracting": False},
    {"name": "Instagram", "category": "Social Media", "is_distracting": True},
    {"name": "YouTube Shorts", "category": "Entertainment", "is_distracting": True},
    {"name": "Reddit", "category": "Social Media", "is_distracting": True}
]

def generate_synthetic_activity_dataset(days_count: int = 60, user_id: str = "demo_student_user", goal_id: str = "goal_dsa_200") -> List[Dict[str, Any]]:
    """
    Generates a realistic synthetic 60-day behavioral dataset for demonstration
    and model evaluation. Contains genuine patterns:
    1. 'Deep Work & Habit Routine' (approx 45% of days): high focus (150-240m), low distraction (20-45m), high habits (80-100%), good progress (+1.5-3.0%).
    2. 'Distracted & Fragmented' (approx 25% of days): low focus (30-80m), high distraction (110-180m), low habits (20-40%), low progress (0-0.5%).
    3. 'High Effort Plateau' (approx 15% of days): high focus (180-260m), low distraction, but difficult milestones yield lower progress (0-0.4%).
    4. 'Rest / Holiday / Recovery' (approx 15% of days): deliberately marked as rest days or weekends with minimal work.
    """
    random.seed(42)  # Deterministic seed for reproducible evaluation
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=days_count)

    records = []

    cumulative_progress = 0.0
    day_types = ["deep_flow", "distracted", "plateau", "rest_day", "moderate"]
    weights = [0.40, 0.22, 0.13, 0.12, 0.13]

    for d in range(days_count):
        curr_date = start_date + timedelta(days=d)
        date_str = curr_date.strftime("%Y-%m-%d")
        is_weekend = (curr_date.weekday() >= 5)

        # Pick day profile
        if is_weekend and random.random() < 0.5:
            day_type = "rest_day"
        else:
            day_type = random.choices(day_types, weights=weights)[0]

        is_rest = (day_type == "rest_day")
        rest_note = "Scheduled Weekend Rest" if (is_rest and is_weekend) else ("Rest / College Festival Day" if is_rest else None)

        if day_type == "deep_flow":
            focused_work = random.randint(150, 240)
            goal_work = int(focused_work * random.uniform(0.75, 0.95))
            distracting_screen = random.randint(20, 50)
            productive_screen = random.randint(120, 210)
            planned_tasks = random.randint(3, 5)
            completed_tasks = planned_tasks
            goal_relevant_tasks = random.randint(2, completed_tasks)

            # Habit completion
            completed_habits_list = [h for h in HABIT_CATALOG if random.random() < 0.85]
            scheduled_habits = len(HABIT_CATALOG)
            completed_habits = len(completed_habits_list)

            progress_delta = round(random.uniform(1.8, 3.5), 2)
            milestones_completed = 1 if (d % 8 == 0 or random.random() < 0.15) else 0

        elif day_type == "distracted":
            focused_work = random.randint(20, 75)
            goal_work = int(focused_work * random.uniform(0.4, 0.7))
            distracting_screen = random.randint(110, 190)
            productive_screen = random.randint(30, 80)
            planned_tasks = random.randint(4, 6)
            completed_tasks = random.randint(1, 2)
            goal_relevant_tasks = random.randint(0, 1)

            completed_habits_list = [h for h in HABIT_CATALOG if random.random() < 0.35]
            scheduled_habits = len(HABIT_CATALOG)
            completed_habits = len(completed_habits_list)

            progress_delta = round(random.uniform(0.0, 0.4), 2)
            milestones_completed = 0

        elif day_type == "plateau":
            # High effort, but stuck on hard topics (DP, Graphs) -> anomaly candidate
            focused_work = random.randint(180, 270)
            goal_work = int(focused_work * random.uniform(0.85, 0.95))
            distracting_screen = random.randint(30, 65)
            productive_screen = random.randint(160, 240)
            planned_tasks = random.randint(3, 5)
            completed_tasks = random.randint(2, 3)
            goal_relevant_tasks = completed_tasks

            completed_habits_list = [h for h in HABIT_CATALOG if random.random() < 0.75]
            scheduled_habits = len(HABIT_CATALOG)
            completed_habits = len(completed_habits_list)

            progress_delta = round(random.uniform(0.1, 0.5), 2) # Low yield despite effort
            milestones_completed = 0

        elif day_type == "rest_day":
            focused_work = random.randint(0, 30)
            goal_work = 0
            distracting_screen = random.randint(60, 140)
            productive_screen = random.randint(10, 40)
            planned_tasks = 1
            completed_tasks = 0
            goal_relevant_tasks = 0

            completed_habits_list = ["Morning Physical Exercise"] if random.random() < 0.5 else []
            scheduled_habits = 2
            completed_habits = len(completed_habits_list)

            progress_delta = 0.0
            milestones_completed = 0

        else: # moderate
            focused_work = random.randint(80, 140)
            goal_work = int(focused_work * random.uniform(0.65, 0.85))
            distracting_screen = random.randint(50, 90)
            productive_screen = random.randint(80, 130)
            planned_tasks = random.randint(3, 4)
            completed_tasks = random.randint(2, 3)
            goal_relevant_tasks = random.randint(1, 2)

            completed_habits_list = [h for h in HABIT_CATALOG if random.random() < 0.65]
            scheduled_habits = len(HABIT_CATALOG)
            completed_habits = len(completed_habits_list)

            progress_delta = round(random.uniform(0.8, 1.8), 2)
            milestones_completed = 0

        total_screen = distracting_screen + productive_screen
        task_rate = round(completed_tasks / max(1, planned_tasks), 2)
        habit_rate = round(completed_habits / max(1, scheduled_habits), 2)

        # Consistency score (0-100): composite formula
        # 35% habit adherence + 30% task completion + 25% focus time ratio + 10% distraction control
        work_norm = min(1.0, focused_work / 180.0)
        distract_control = max(0.0, 1.0 - (distracting_screen / 150.0))
        consistency = round(
            (habit_rate * 35.0) +
            (task_rate * 30.0) +
            (work_norm * 25.0) +
            (distract_control * 10.0),
            1
        )
        if is_rest:
            consistency = 75.0 # Deliberate rest shouldn't penalize unfairly

        cumulative_progress = round(min(100.0, cumulative_progress + progress_delta), 1)

        records.append({
            "date": date_str,
            "user_id": user_id,
            "goal_id": goal_id,
            "planned_tasks": planned_tasks,
            "completed_tasks": completed_tasks,
            "goal_relevant_tasks_completed": goal_relevant_tasks,
            "task_completion_rate": task_rate,
            "scheduled_habits": scheduled_habits,
            "completed_habits": completed_habits,
            "habit_adherence_rate": habit_rate,
            "completed_habit_names": completed_habits_list,
            "focused_work_minutes": focused_work,
            "goal_specific_work_minutes": goal_work,
            "total_screen_time_minutes": total_screen,
            "distracting_screen_time_minutes": distracting_screen,
            "productive_screen_time_minutes": productive_screen,
            "actual_goal_progress_delta": progress_delta,
            "cumulative_goal_progress": cumulative_progress,
            "milestones_completed_count": milestones_completed,
            "consistency_score": consistency,
            "is_holiday_or_rest_day": is_rest,
            "rest_day_note": rest_note
        })

    return records
