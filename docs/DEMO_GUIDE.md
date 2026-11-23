# ConsistAI ML — Live Demonstration & Viva Defense Guide
## Intelligent Goal Progress Analysis and Workflow Improvement System

---

## 1. Project Overview & Elevator Pitch (For the External Examiner)
> "Good morning, respected examiners. Our minor project is **ConsistAI ML — Intelligent Goal Progress Analysis and Workflow Improvement System**.
>
> Most productivity systems fail because they either treat all tasks identically, assume more hours automatically equals more progress, or make speculative forecasts of future success that have no scientific basis.
>
> ConsistAI ML solves this by combining verifiable milestone progress with empirical Machine Learning. We track goals, tasks, habits, working sessions, and screen distraction. Then, using **K-Means Clustering**, **Isolation Forest**, **Apriori Association Rules**, and **Correlation Statistics**, our system identifies historical workflow patterns and anomalies. Finally, we turn those discoveries into structured, hypothesis-based workflow improvement experiments where users measure whether a proposed behavioral change actually helped."

---

## 2. Step-by-Step Live Demonstration Script

### Step 1: Authentication & Demo Data Setup
1. Open `http://localhost:5173/login`.
2. Click **"Instant 1-Click Demo Login"**.
   - *Key Talking Point*: "The system features secure JWT authentication with HttpOnly cookies. We have included a pre-seeded evaluator account so professors can review the platform instantly."
3. In the left sidebar, click the **"Load 60-Day Demo"** button.
   - *Key Talking Point*: "This seeds 60 days of authentic student behavioral logs: 88 DSA problems solved, daily focus sessions, real habits, screen distraction, and precomputes the ML pipeline."

---

### Step 2: Goal Manager & Milestone Pacing (`/goals`)
1. Click **Goal Manager** in the sidebar.
2. Review the primary goal: *"Complete 200 DSA Problems"*.
3. Click **"Milestone Plan"** to enter the Goal Detail Page (`/goals/:id`).
   - *Key Talking Point*: "Notice our progress pacing formulation:
     $$\text{Progress Gap} = \text{Actual Progress} (44\%) - \text{Elapsed Schedule Time} (50\%) = -6\%$$
     We label this strictly as a pacing indicator, not a forecast. Progress is calculated from weighted milestones: Arrays 20%, Strings 15%, Linked Lists 15%, Trees 20%, Graphs 15%, DP 15%."
4. Demonstrate updating milestone progress:
   - Click the `+` button on *"Linked Lists & Stacks"* to advance problems solved.
   - Notice that parent goal progress, pacing gap, and historical progress events update instantly!

---

### Step 3: Daily Tasks & Habit Tracking (`/tasks` & `/habits`)
1. Go to **Daily Tasks**:
   - Highlight the distinction between **All Tasks** and **Goal-Relevant Tasks**.
   - *Key Talking Point*: "We never inflate goal progress with unrelated errands. Only tasks explicitly tied to enrolled goals contribute to goal-specific metrics."
2. Go to **Habit Tracker**:
   - Click **"Check In Today"** on *"Practice DSA Problems"*.
   - Notice the streak increment, weekly adherence meter, and automatic sync to the user's daily consistency score.

---

### Step 4: Working Hours & Screen Time (`/timer` & `/screentime`)
1. Go to **Focus Timer & Hours**:
   - Show the Pomodoro/Focus timer. Click **"Start 25-Min Focus Block"**.
   - Notice the floating focus timer widget that persists in the bottom-right corner as you navigate between pages!
   - Highlight the disclaimer: *"Do not assume that more working hours automatically means better progress."*
2. Go to **Screen Time**:
   - Show the distribution bar chart comparing Productive minutes (VS Code, LeetCode) vs Distracting minutes (Instagram, YouTube Shorts).
   - Point out the **Privacy Notice**: Web browsers cannot automatically spy on device apps; we support manual logging and CSV file imports.

---

### Step 5: Monthly Consistency Calendar (`/calendar`)
1. Go to **Consistency Calendar**:
   - Show how days with **Meaningful Progress** (green dots) are highlighted separately from days with **High Consistency** (indigo).
   - Click on any day to open the detailed activity drawer showing exact tasks, check-ins, focus time, and screen time.
   - Show the **"Mark as Rest Day / Holiday"** button: intentional rest does not penalize consistency or trigger false anomaly alerts.

---

### Step 6: ML Pattern Discovery Dashboard (`/ml-patterns`)
This is the core academic centerpiece of the evaluation:
1. **Model 1: K-Means Clustering**:
   - Show the **Silhouette Score: 0.539** and optimal $k=3$.
   - Point out the key finding: *Deep Flow & Routine* days yielded $+1.87\%$ daily progress, while *High Distraction* days yielded only $+0.21\%$ progress.
   - Emphasize: *"Actual daily goal progress delta was held out purely as an outcome metric, not used as an input feature."*
2. **Model 2: Isolation Forest Anomaly Detection**:
   - Show the flagged unusual days.
   - Expand an anomaly to show the **multivariate z-score factor breakdown**: explains *why* the day was anomalous (e.g. 180 min work with only 0.2% progress = effort plateau).
3. **Model 3: Apriori Association Rules**:
   - Show the frequent rule table: Antecedent $\to$ Consequent with Support, Confidence, and Lift up to $4.09\times$.
   - Read the scientific disclaimer: Association rules indicate statistical co-occurrence, not causal proof.
4. **Model 4: Correlation Statistics**:
   - Show Pearson $r$ and Spearman $\rho$: Focus minutes has $r = +0.728$ with goal progress, while distracting screen time has $r = -0.626$.

---

### Step 7: Workflow Recommendations & Experiments (`/recommendations` & `/experiments`)
1. Go to **Workflow Suggestions**:
   - Show the evidence-based recommendation cards: Title, Observed Issue, Supporting Data, Suggested Change, and Expected Benefit (expressed as an empirical hypothesis).
2. Go to **Improvement Experiments**:
   - Show the active 14-day experiment: *"Practice DSA for 45 Minutes Before Checking Social Media"*.
   - Point out the **Before vs After Baseline Comparison**:
     - Baseline: 95m focus, 135m distraction, $+0.85\%$ daily progress.
     - Experiment Period: 165m focus ($+70$m), 52m distraction ($-83$m), $+1.62\%$ daily progress ($+0.77\%$).
   - Click **"Log Today's Adherence"** to show daily experimental tracking!

---

## 3. Frequently Asked Viva Questions & Model Answers

### Q1: Why did you not use regression or LSTM to predict when the user will achieve the goal?
> **Answer**: "Predicting future human cognitive performance or goal success using regression or deep learning produces pseudo-scientific, unreliable forecasts because daily motivation, milestone difficulty, exams, and personal events are non-stationary and uncontrolled. Instead, following sound empirical research, our system applies Machine Learning for **retrospective pattern discovery**—helping the user understand *what habits accompanied their past progress* and testing changes through structured before-and-after experiments."

### Q2: Why did you hold out the goal progress delta during K-Means clustering?
> **Answer**: "If goal progress delta were included in the input feature vector, K-Means would trivially group days by progress amount, creating circular reasoning. By using only behavioral inputs (focused work, habits, distraction, tasks) for clustering, we can independently compare the held-out average goal progress across clusters to discover which operational patterns truly accompany high progress."

### Q3: How do you explain anomalies detected by Isolation Forest?
> **Answer**: "Standard Isolation Forest only outputs an anomaly score based on average tree path length. To make our system explainable, we compute the standardized z-score deviation for each feature against the user's active baseline:
> $$z_j = \frac{x_j - \mu_j}{\sigma_j}$$
> Any feature with $|z| \ge 1.2$ is reported as a primary contributing factor, allowing users to see exactly whether an effort plateau, distraction spike, or habit disruption triggered the flag."

### Q4: How does your system compute goal progress for non-linear milestones?
> **Answer**: "We calculate:
> $$\text{Goal Progress} = \frac{\sum w_i \times \text{MilestonePct}_i}{\sum w_i} \times 100$$
> where each milestone carries a distinct difficulty weight (e.g. Dynamic Programming is weighted 30%, whereas Arrays is 20%). This reflects non-linear academic learning curves."
