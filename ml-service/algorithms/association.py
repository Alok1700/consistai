import pandas as pd
from typing import List, Dict, Any, Set, Tuple
from itertools import combinations
from models.schemas import DailyRecord, AssociationRuleItem, AssociationAnalysisResponse

def _native_apriori(transactions: List[List[str]], min_support: float = 0.15, min_confidence: float = 0.45, min_lift: float = 1.05) -> List[Dict[str, Any]]:
    N = len(transactions)
    if N == 0:
        return []

    # Represent transactions as frozensets
    tx_sets = [frozenset(t) for t in transactions]

    # Count single items
    item_counts: Dict[frozenset, int] = {}
    for tx in tx_sets:
        for item in tx:
            f_item = frozenset([item])
            item_counts[f_item] = item_counts.get(f_item, 0) + 1

    # Filter frequent 1-itemsets
    frequent_itemsets: Dict[frozenset, float] = {}
    for item, cnt in item_counts.items():
        sup = cnt / N
        if sup >= min_support:
            frequent_itemsets[item] = sup

    current_frequent = list(frequent_itemsets.keys())
    k = 2

    # Generate higher-order frequent itemsets up to size 3
    while current_frequent and k <= 3:
        # Generate candidates of size k
        candidate_set: Set[frozenset] = set()
        for i in range(len(current_frequent)):
            for j in range(i + 1, len(current_frequent)):
                union = current_frequent[i] | current_frequent[j]
                if len(union) == k:
                    candidate_set.add(union)

        # Count support for candidates
        cand_counts: Dict[frozenset, int] = {}
        for cand in candidate_set:
            for tx in tx_sets:
                if cand.issubset(tx):
                    cand_counts[cand] = cand_counts.get(cand, 0) + 1

        next_frequent = []
        for cand, cnt in cand_counts.items():
            sup = cnt / N
            if sup >= min_support:
                frequent_itemsets[cand] = sup
                next_frequent.append(cand)

        current_frequent = next_frequent
        k += 1

    # Generate association rules from frequent itemsets of length >= 2
    rules: List[Dict[str, Any]] = []
    for itemset, sup_AB in frequent_itemsets.items():
        if len(itemset) < 2:
            continue

        # Generate non-empty proper subsets as antecedents
        item_list = list(itemset)
        for r in range(1, len(item_list)):
            for ant_tuple in combinations(item_list, r):
                A = frozenset(ant_tuple)
                B = itemset - A

                sup_A = frequent_itemsets.get(A, 0.0)
                if sup_A == 0:
                    cnt_A = sum(1 for tx in tx_sets if A.issubset(tx))
                    sup_A = cnt_A / N
                    frequent_itemsets[A] = sup_A

                if sup_A > 0:
                    conf = sup_AB / sup_A
                    if conf >= min_confidence:
                        sup_B = frequent_itemsets.get(B, 0.0)
                        if sup_B == 0:
                            cnt_B = sum(1 for tx in tx_sets if B.issubset(tx))
                            sup_B = cnt_B / N
                            frequent_itemsets[B] = sup_B

                        if sup_B > 0:
                            lift = conf / sup_B
                            if lift >= min_lift:
                                rules.append({
                                    "antecedents": sorted(list(A)),
                                    "consequents": sorted(list(B)),
                                    "support": round(sup_AB, 3),
                                    "confidence": round(conf, 3),
                                    "lift": round(lift, 3),
                                    "count": int(round(sup_AB * N))
                                })

    # Sort rules: highest lift first, then confidence
    rules.sort(key=lambda r: (r['lift'], r['confidence']), reverse=True)
    return rules

def run_apriori_association_mining(
    records: List[DailyRecord],
    min_support: float = 0.15,
    min_confidence: float = 0.45,
    min_lift: float = 1.05
) -> AssociationAnalysisResponse:
    if len(records) < 5:
        return AssociationAnalysisResponse(
            status="insufficient_data",
            message=f"Apriori Association Mining requires at least 5 daily activity transactions (received {len(records)}).",
            total_transactions=len(records),
            rules_count=0,
            rules=[],
            top_habit_influences=[],
            caution_statement="Association rules identify co-occurring habits and states. They do NOT prove that an activity caused progress."
        )

    # 1. Convert daily records to categorical transactions
    transactions: List[List[str]] = []

    for r in records:
        tx: List[str] = []

        # Focused work category
        work = r.focused_work_minutes
        if work >= 160:
            tx.append("Work: Deep Focus (>= 2.5h)")
        elif work >= 80:
            tx.append("Work: Moderate Focus (1.5-2.5h)")
        elif work > 0:
            tx.append("Work: Light Focus (< 1.5h)")
        else:
            tx.append("Work: Zero Sessions")

        # Distracting screen time category
        distract = r.distracting_screen_time_minutes
        if distract <= 45:
            tx.append("Screen: Low Distraction (<= 45m)")
        elif distract <= 90:
            tx.append("Screen: Moderate Distraction (45-90m)")
        else:
            tx.append("Screen: High Distraction (> 90m)")

        # Habit adherence category
        h_rate = r.habit_adherence_rate
        if h_rate >= 0.70:
            tx.append("Habits: High Adherence (>= 70%)")
        elif h_rate >= 0.40:
            tx.append("Habits: Moderate Adherence (40-70%)")
        else:
            tx.append("Habits: Low Adherence (< 40%)")

        # Specific completed habits
        if r.completed_habit_names:
            for habit_name in r.completed_habit_names:
                clean_name = habit_name.strip()
                if clean_name:
                    tx.append(f"Habit: {clean_name}")

        # Task completion category
        t_rate = r.task_completion_rate
        if t_rate >= 0.75:
            tx.append("Tasks: High Completion (>= 75%)")

        # Goal progress outcome
        delta = r.actual_goal_progress_delta
        if delta >= 1.5:
            tx.append("Progress: Significant Advance (>= 1.5%)")
        elif delta > 0.0:
            tx.append("Progress: Progress Recorded (> 0%)")
        else:
            tx.append("Progress: Zero Milestone Advance")

        transactions.append(list(set(tx)))

    # Run native Apriori algorithm
    adaptive_support = max(0.08, min_support)
    raw_rules = _native_apriori(
        transactions,
        min_support=adaptive_support,
        min_confidence=min_confidence,
        min_lift=min_lift
    )

    rule_items: List[AssociationRuleItem] = []
    top_influences: List[str] = []

    for r in raw_rules[:15]:
        ant = r['antecedents']
        con = r['consequents']
        sup = r['support']
        conf = r['confidence']
        lift = r['lift']
        cnt = r['count']

        ant_str = " + ".join([a.replace("Habit: ", "").replace("Work: ", "").replace("Screen: ", "") for a in ant])
        con_str = " + ".join([c.replace("Progress: ", "").replace("Tasks: ", "") for c in con])
        interp = f"When [{ant_str}] occurred, [{con_str}] occurred {int(conf * 100)}% of the time ({lift}x higher than baseline rate)."

        rule_items.append(AssociationRuleItem(
            antecedents=ant,
            consequents=con,
            support=sup,
            confidence=conf,
            lift=lift,
            observation_count=cnt,
            interpretation=interp
        ))

        # Check for meaningful goal progress consequents
        if any("Progress:" in c for c in con):
            for a in ant:
                if "Habit:" in a or "Work:" in a or "Screen:" in a:
                    desc = f"{a} frequently co-occurs with {con_str} (Confidence: {int(conf*100)}%, Lift: {lift})"
                    if desc not in top_influences:
                        top_influences.append(desc)

    return AssociationAnalysisResponse(
        status="success",
        message=f"Discovered {len(rule_items)} association rules from {len(records)} daily transactions.",
        total_transactions=len(records),
        rules_count=len(rule_items),
        rules=rule_items,
        top_habit_influences=top_influences[:5],
        caution_statement="Scientific Note: Association rule mining uncovers statistical co-occurrences in your past workflow. A high lift indicates that two events frequently happen together, but does NOT mathematically prove that one caused the other."
    )
