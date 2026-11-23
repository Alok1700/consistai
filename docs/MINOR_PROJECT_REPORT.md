# MINOR PROJECT REPORT OUTLINE
## ConsistAI ML: Intelligent Goal Progress Analysis and Workflow Improvement System
**Department of Computer Science and Engineering**

---

### CANDIDATE DETAILS
- **Project Title:** ConsistAI ML — Intelligent Goal Progress Analysis and Workflow Improvement System
- **Degree:** Bachelor of Technology (B.Tech) in Computer Science and Engineering
- **Academic Semester:** 6th / 7th Semester Minor Project
- **Domain:** Full-Stack Web Development, Applied Machine Learning, Human-Computer Interaction (HCI)

---

### ABSTRACT
Modern digital productivity applications frequently suffer from two fundamental flaws: superficial habit tracking that fails to correlate routine actions with measurable milestones, and speculative machine learning forecasting that generates unreliable predictions of future goal completion. This project presents **ConsistAI ML**, an intelligent web-based goal progress analysis and workflow improvement system. The application tracks verifiable quantitative goals, milestone weights, daily tasks, habit execution, focused work sessions, and digital screen distraction. Rather than predicting future success, ConsistAI applies **K-Means Clustering** to discover operational activity profiles, evaluating them against held-out goal progress outcomes; **Isolation Forest** to identify atypical operational anomalies and explain their driving feature deviations; **Apriori Association Rule Mining** to uncover co-occurring habit sets; and **Pearson and Spearman Correlation Analysis** to evaluate monotonic workflow relationships. Identified bottlenecks are transformed into actionable, hypothesis-driven workflow improvement recommendations, which users empirically validate through structured 14-day before-and-after experiments. The system is implemented using a decoupled microservices architecture with a React-TypeScript frontend, Express-MongoDB backend, and Python-FastAPI machine learning engine.

---

### TABLE OF CONTENTS

#### 1. INTRODUCTION
- 1.1 Motivation & Background
- 1.2 The Failure of Speculative Forecasting in Productivity Software
- 1.3 Purpose and Scope of the Proposed System
- 1.4 Key Questions Addressed by ConsistAI ML
- 1.5 Organization of the Report

#### 2. PROBLEM FORMULATION & OBJECTIVES
- 2.1 Problem Statement
- 2.2 Functional Objectives:
  - Verifiable Goal & Milestone Tracking
  - Distinguishing General Tasks from Goal-Relevant Work
  - Quantitative Focus Session Duration & Screen Time Tracking
  - Non-Linear Progress Pacing Gap Calculation
  - Retrospective Machine Learning Analytics
  - Structured Workflow Improvement Experimentation
- 2.3 Non-Functional Objectives:
  - Academic Integrity & Non-Causal Scientific Transparency
  - Responsive, Sub-second API Latency
  - User Data Privacy and Browser Sandbox Security

#### 3. LITERATURE REVIEW & THEORETICAL FOUNDATION
- 3.1 Review of Existing Productivity Tools (Todoist, Forest, Habitica, Notion)
- 3.2 Limitations of Time-Tracking vs Milestone-Tracking Paradigms
- 3.3 Machine Learning in Behavioral Analytics:
  - Unsupervised Clustering (Lloyd's Algorithm and Silhouette Analysis)
  - Unsupervised Anomaly Isolation (Liu et al. Isolation Forest Trees)
  - Frequent Itemset and Association Mining (Agrawal et al. Apriori)
  - Non-Linear Progress Pacing Indices

#### 4. SYSTEM ARCHITECTURE & DESIGN
- 4.1 System Overview & Microservices Decoupling
- 4.2 Architectural Block Diagram
- 4.3 Data Flow and Request-Response Pipeline
- 4.4 Data Aggregation Engine (Daily Composite Consistency Scoring)
- 4.5 Security Architecture: HttpOnly JWT Authentication & Route Guards

#### 5. MATHEMATICAL FORMULATION & ML MODELS
- 5.1 Numerical and Weighted Milestone Progress Formulations:
  $$\text{Milestone Progress} = \min\left(100\%, \frac{\sum w_i \times p_i}{\sum w_i} \times 100\right)$$
- 5.2 Non-Linear Progress Pacing Gap:
  $$\text{Progress Gap} = \text{Actual Progress \%} - \text{Elapsed Schedule Time \%}$$
- 5.3 Composite Daily Consistency Formulation:
  $$S = 0.35 H + 0.30 T + 0.25 W + 0.10 D$$
- 5.4 ML Model 1: K-Means Activity Pattern Clustering:
  - Input Features (6 behavioral dimensions)
  - Standardization via Z-score scaling
  - Optimal $k$ Selection via Silhouette Score ($s(i) \approx 0.539$)
  - Held-out Evaluation against Daily Goal Progress Delta ($\Delta_{\text{prog}}$)
- 5.5 ML Model 2: Isolation Forest Anomaly Detection:
  - Randomized Split Trees and Path Length Scoring ($s(x, n)$)
  - Multivariate Anomaly Explanation via Standardized Z-Score Deviations
  - Deliberate Rest-Day and Holiday Mitigation
- 5.6 ML Model 3: Apriori Association Rule Mining:
  - Categorical Transaction Transformation
  - Support, Confidence, and Lift Formulations
  - Scientific Co-occurrence Disclaimer
- 5.7 ML Model 4: Pearson & Spearman Correlation Statistics:
  - Linear ($r$) and Monotonic Rank ($\rho$) Relationships

#### 6. DATABASE DESIGN & SCHEMA SPECIFICATIONS
- 6.1 Database Choice (MongoDB NoSQL Schema Design)
- 6.2 Entity-Relationship (ER) Schema Specifications:
  - `User`, `Goal`, `Milestone`, `Task`, `Habit`, `HabitCheckIn`
  - `WorkSession`, `ScreenTimeRecord`, `DailyAnalytics`, `GoalProgressEvent`
  - `MLAnalysisRun`, `WorkflowRecommendation`, `WorkflowExperiment`
- 6.3 Historical Progress Event Sourcing Strategy

#### 7. IMPLEMENTATION DETAILS
- 7.1 Frontend Implementation:
  - React 18, Vite, TypeScript, Tailwind CSS
  - State Architecture: Zustand (Auth Store & Floating Focus Timer)
  - Data Synchronization: TanStack Query (React Query)
  - Visual Analytics: Recharts & Lucide React
- 7.2 Backend Implementation:
  - Node.js & Express.js REST API with ES Modules
  - Daily Analytics Aggregator Pipeline
  - CSV Import Parser for Screen Time Logs
- 7.3 Python Machine Learning Service Implementation:
  - FastAPI Microservice Architecture
  - Pydantic Type Validation Schemas
  - Dual-Engine Fallback for Zero-Dependency Enterprise Deployment

#### 8. EXPERIMENTAL RESULTS & MODEL EVALUATION
- 8.1 Synthetic Dataset Generation & Parameter Distribution
- 8.2 Clustering Evaluation: Silhouette Scores and Cluster Characterization
  - Cluster 1: Deep Flow & Routine (+1.87% daily progress)
  - Cluster 2: High Distraction & Fragmented (+0.21% daily progress)
  - Cluster 3: Low Activity / Rest (+0.0% daily progress)
- 8.3 Anomaly Detection Validation & Driver Factor Breakdown
- 8.4 Association Rules Discovered (Lift up to 4.09x)
- 8.5 Correlation Analysis Findings ($r_{\text{focus}} = +0.728$, $r_{\text{distract}} = -0.626$)

#### 9. WORKFLOW IMPROVEMENT EXPERIMENTS CASE STUDY
- 9.1 Formulation of Evidence-Based Recommendations
- 9.2 Controlled 14-Day Observation Window Case Study:
  - Hypothesis: "Practice DSA for 45 min phone-free before social media"
  - Baseline Activity: 95m focus, 135m distraction, +0.85% daily progress
  - Experiment Results: 165m focus (+70m), 52m distraction (-83m), +1.62% daily progress (+0.77%)
  - Evaluation: Significant improvement without uncontrolled causal claim

#### 10. CONCLUSION & FUTURE SCOPE
- 10.1 Summary of Contributions
- 10.2 Academic Takeaways
- 10.3 Future Work: Wearable Bio-Feedback Integration, Distributed Microservices, Multi-User Team Sprints

#### REFERENCES
1. Agrawal, R., & Srikant, R. (1994). Fast algorithms for mining association rules. *Proc. 20th Int. Conf. Very Large Data Bases (VLDB)*.
2. Liu, F. T., Ting, K. M., & Zhou, Z. H. (2008). Isolation forest. *Eighth IEEE International Conference on Data Mining*, 413-422.
3. Rousseeuw, P. J. (1987). Silhouettes: a graphical aid to the interpretation and validation of cluster analysis. *Journal of Computational and Applied Mathematics*, 20, 53-65.
4. Clear, J. (2018). *Atomic Habits: An Easy & Proven Way to Build Good Habits & Break Bad Ones*. Penguin.
5. Newport, C. (2016). *Deep Work: Rules for Focused Success in a Distracted World*. Grand Central Publishing.
