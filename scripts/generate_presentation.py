import os
import pptx
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

def create_deck():
    prs = pptx.Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Color Palette - Professional Deep Slate / Tech Dark Theme
    BG_COLOR = RGBColor(11, 15, 25)         # Very dark slate #0B0F19
    CARD_BG = RGBColor(24, 32, 47)          # Card background #18202F
    CARD_BORDER = RGBColor(45, 58, 79)      # Subtle border #2D3A4F
    CARD_ACCENT_BG = RGBColor(19, 38, 64)   # Slightly blue tint card #132640
    
    TEXT_WHITE = RGBColor(248, 250, 252)    # Crisp White #F8FAFC
    TEXT_MUTED = RGBColor(148, 163, 184)    # Slate Muted #94A3B8
    TEXT_DIM = RGBColor(100, 116, 139)      # Dim Slate #64748B
    
    ACCENT_INDIGO = RGBColor(99, 102, 241)  # #6366F1
    ACCENT_CYAN = RGBColor(14, 165, 233)    # #0EA5E9
    ACCENT_EMERALD = RGBColor(16, 185, 129) # #10B981
    ACCENT_AMBER = RGBColor(245, 158, 11)   # #F59E0B
    ACCENT_ROSE = RGBColor(244, 63, 94)     # #F43F5E

    def set_slide_background(slide):
        background = slide.background
        fill = background.fill
        fill.solid()
        fill.fore_color.rgb = BG_COLOR

    def add_header(slide, category, title, subtitle):
        # Category Tag Pill
        cat_box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.4), Inches(2.8), Inches(0.32))
        cat_box.fill.solid()
        cat_box.fill.fore_color.rgb = RGBColor(30, 41, 59)
        cat_box.line.color.rgb = ACCENT_INDIGO
        cat_box.line.width = Pt(1)
        tf_cat = cat_box.text_frame
        tf_cat.word_wrap = True
        tf_cat.margin_left = Inches(0.1)
        tf_cat.margin_top = Inches(0.04)
        p_cat = tf_cat.paragraphs[0]
        p_cat.text = category.upper()
        p_cat.font.size = Pt(10)
        p_cat.font.bold = True
        p_cat.font.color.rgb = ACCENT_CYAN
        p_cat.alignment = PP_ALIGN.CENTER

        # Slide Title
        tb_title = slide.shapes.add_textbox(Inches(0.8), Inches(0.78), Inches(11.7), Inches(0.6))
        tf_t = tb_title.text_frame
        tf_t.word_wrap = True
        tf_t.margin_left = 0
        tf_t.margin_top = 0
        p_t = tf_t.paragraphs[0]
        p_t.text = title
        p_t.font.size = Pt(22)
        p_t.font.bold = True
        p_t.font.color.rgb = TEXT_WHITE

        # Subtitle
        if subtitle:
            tb_sub = slide.shapes.add_textbox(Inches(0.8), Inches(1.38), Inches(11.7), Inches(0.4))
            tf_s = tb_sub.text_frame
            tf_s.word_wrap = True
            tf_s.margin_left = 0
            tf_s.margin_top = 0
            p_s = tf_s.paragraphs[0]
            p_s.text = subtitle
            p_s.font.size = Pt(12)
            p_s.font.color.rgb = TEXT_MUTED

    def add_footer(slide, current_slide, total_slides=15):
        tb_foot = slide.shapes.add_textbox(Inches(0.8), Inches(7.0), Inches(11.7), Inches(0.3))
        tf = tb_foot.text_frame
        tf.word_wrap = True
        tf.margin_left = 0
        p = tf.paragraphs[0]
        p.text = f"ConsistAI — Autonomous AI & Retrospective Behavioral Analytics System  |  Slide {current_slide} of {total_slides}"
        p.font.size = Pt(9)
        p.font.color.rgb = TEXT_DIM

    def add_card(slide, left, top, width, height, title="", title_color=ACCENT_CYAN, border_color=CARD_BORDER, bg_color=CARD_BG):
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        card.line.color.rgb = border_color
        card.line.width = Pt(1)
        
        if title:
            tb_ct = slide.shapes.add_textbox(Inches(left + 0.25), Inches(top + 0.15), Inches(width - 0.5), Inches(0.4))
            tf = tb_ct.text_frame
            tf.word_wrap = True
            tf.margin_left = 0
            tf.margin_top = 0
            p = tf.paragraphs[0]
            p.text = title
            p.font.size = Pt(15)
            p.font.bold = True
            p.font.color.rgb = title_color
            
        return card

    # =========================================================================
    # SLIDE 1: TITLE SLIDE (HERO)
    # =========================================================================
    s1 = prs.slides.add_slide(blank_layout)
    set_slide_background(s1)

    # Hero Badge
    badge = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.1), Inches(4.5), Inches(0.38))
    badge.fill.solid()
    badge.fill.fore_color.rgb = RGBColor(30, 41, 59)
    badge.line.color.rgb = ACCENT_INDIGO
    badge.line.width = Pt(1.5)
    tf_b = badge.text_frame
    tf_b.margin_top = Inches(0.06)
    p_b = tf_b.paragraphs[0]
    p_b.text = "MINOR PROJECT PRESENTATION • B.TECH CSE"
    p_b.font.size = Pt(11)
    p_b.font.bold = True
    p_b.font.color.rgb = ACCENT_CYAN
    p_b.alignment = PP_ALIGN.CENTER

    # Main Project Title
    tb_title = s1.shapes.add_textbox(Inches(0.8), Inches(1.6), Inches(11.7), Inches(1.5))
    tf = tb_title.text_frame
    tf.word_wrap = True
    tf.margin_left = 0
    p1 = tf.paragraphs[0]
    p1.text = "ConsistAI"
    p1.font.size = Pt(46)
    p1.font.bold = True
    p1.font.color.rgb = TEXT_WHITE
    
    p2 = tf.add_paragraph()
    p2.text = "Autonomous AI-Powered Goal Execution & Retrospective Behavioral Analytics System"
    p2.font.size = Pt(19)
    p2.font.bold = True
    p2.font.color.rgb = ACCENT_CYAN
    p2.space_before = Pt(8)

    p3 = tf.add_paragraph()
    p3.text = "Bridging Natural-Language Application Automation with Rigorous Unsupervised Machine Learning"
    p3.font.size = Pt(13)
    p3.font.color.rgb = TEXT_MUTED
    p3.space_before = Pt(6)

    # 4 Highlights Cards across bottom
    tech_cards = [
        ("AUTONOMOUS AGENT", "Local Ollama (Qwen 3.5:4B)\n30+ Executable Tools\nEnglish, Hindi, Hinglish NLP", ACCENT_INDIGO),
        ("VERIFIABLE GOALS", "Folder → Goal → Milestone\nIndividual Module Checklists\nPacing Gap Mathematical Telemetry", ACCENT_CYAN),
        ("APPLIED ML ENGINE", "K-Means Clustering (k=3)\nIsolation Forest Anomaly Isolation\nApriori Habit Association Mining", ACCENT_EMERALD),
        ("FULL-STACK ARCHITECTURE", "Decoupled MERN + FastAPI\nDocker & Render Cloud Ready\n100% Private On-Device AI", ACCENT_AMBER)
    ]
    for i, (head, desc, color) in enumerate(tech_cards):
        left = 0.8 + (i * 2.98)
        c = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(3.7), Inches(2.8), Inches(2.1))
        c.fill.solid()
        c.fill.fore_color.rgb = CARD_BG
        c.line.color.rgb = CARD_BORDER
        c.line.width = Pt(1)
        
        tb = s1.shapes.add_textbox(Inches(left + 0.2), Inches(3.85), Inches(2.4), Inches(1.8))
        tf_c = tb.text_frame
        tf_c.word_wrap = True
        tf_c.margin_left = 0
        p_h = tf_c.paragraphs[0]
        p_h.text = head
        p_h.font.size = Pt(12)
        p_h.font.bold = True
        p_h.font.color.rgb = color
        
        p_d = tf_c.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(11)
        p_d.font.color.rgb = TEXT_MUTED
        p_d.space_before = Pt(6)

    # Candidate info footer
    tb_author = s1.shapes.add_textbox(Inches(0.8), Inches(6.1), Inches(11.7), Inches(0.6))
    tf_a = tb_author.text_frame
    tf_a.margin_left = 0
    p_a = tf_a.paragraphs[0]
    p_a.text = "Developed by: Alok Singh  |  Department of Computer Science & Engineering  |  Academic Year 2026-2027"
    p_a.font.size = Pt(11)
    p_a.font.color.rgb = TEXT_MUTED

    # =========================================================================
    # SLIDE 2: THE PRODUCTIVITY PARADOX & PROBLEM STATEMENT
    # =========================================================================
    s2 = prs.slides.add_slide(blank_layout)
    set_slide_background(s2)
    add_header(s2, "Motivation & Problem Statement", "The Productivity Paradox in Modern Digital Tools", 
               "Why standard habit trackers and speculative AI forecasting fail modern engineering students and knowledge workers.")
    add_footer(s2, 2)

    problems = [
        ("1. Superficial Streaks vs Measurable Progress", 
         "Existing apps (Todoist, Habitica, Forest) reward binary streaks (e.g., ticking 'Studied Java') regardless of whether concrete milestones were achieved. A 30-day streak can yield 0% syllabus completion if high-friction work is avoided.",
         ACCENT_ROSE),
        ("2. Speculative & Deceptive AI Forecasting", 
         "Commercial tools make unfounded predictive claims (e.g. 'You will master DSA by May 15th!'). Human behavior is non-deterministic. When false predictions fail, users suffer cognitive dissonance and abandon their systems.",
         ACCENT_AMBER),
        ("3. Administrative Friction & Context Switching", 
         "Logging milestones, rescheduling missed tasks, and structuring syllabi requires tedious manual clicking across nested menus. The cognitive overhead of managing the productivity system often exceeds the work itself.",
         ACCENT_CYAN),
        ("4. Disconnected Work & Distraction Telemetry", 
         "Standard tools treat digital screen distraction and deep focus as isolated metrics. Users have no data on how phone distraction directly impairs quantitative goal advancement velocity.",
         ACCENT_INDIGO)
    ]
    for i, (title, body, color) in enumerate(problems):
        row = i // 2
        col = i % 2
        left = 0.8 + (col * 5.95)
        top = 1.9 + (row * 2.4)
        add_card(s2, left, top, 5.75, 2.2, title, color)
        
        tb = s2.shapes.add_textbox(Inches(left + 0.25), Inches(top + 0.65), Inches(5.25), Inches(1.4))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = 0
        p = tf.paragraphs[0]
        p.text = body
        p.font.size = Pt(11.5)
        p.font.color.rgb = TEXT_MUTED

    # =========================================================================
    # SLIDE 3: OBJECTIVES & SYSTEM SCOPE
    # =========================================================================
    s3 = prs.slides.add_slide(blank_layout)
    set_slide_background(s3)
    add_header(s3, "System Objectives", "Architectural Scope & Research Objectives", 
               "Core engineering pillars designed to transform passive tracking into actionable behavioral improvement.")
    add_footer(s3, 3)

    pillars = [
        ("Actionable Autonomous Agent", 
         "• Execute real backend operations via voice/text\n• Multi-lingual parsing in English, Hindi & Hinglish\n• Compound multi-step execution plans\n• Contextual memory & pronoun resolution", 
         ACCENT_INDIGO),
        ("Verifiable Milestone Hierarchy", 
         "• Folder → Goal → Milestone → Module hierarchy\n• Individually verifiable modular checklists\n• Dynamic milestone weighting calculation\n• Non-linear schedule pacing gap telemetry", 
         ACCENT_CYAN),
        ("Retrospective ML Analytics", 
         "• Unsupervised K-Means behavioral clustering\n• Isolation Forest operational anomaly isolation\n• Apriori habit association rule mining\n• Pearson & Spearman correlation metrics", 
         ACCENT_EMERALD),
        ("Empirical Improvement Lab", 
         "• Hypothesis-driven workflow recommendations\n• 14-day controlled A/B before-and-after trials\n• Quantitative telemetry comparison\n• Strict non-causal scientific transparency", 
         ACCENT_AMBER)
    ]
    for i, (title, points, color) in enumerate(pillars):
        left = 0.8 + (i * 2.98)
        add_card(s3, left, 1.9, 2.8, 4.8, title, color)
        
        tb = s3.shapes.add_textbox(Inches(left + 0.25), Inches(2.6), Inches(2.3), Inches(3.9))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = 0
        p = tf.paragraphs[0]
        p.text = points
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_WHITE
        p.line_spacing = 1.3

    # =========================================================================
    # SLIDE 4: SYSTEM ARCHITECTURE & DECOUPLED STACK
    # =========================================================================
    s4 = prs.slides.add_slide(blank_layout)
    set_slide_background(s4)
    add_header(s4, "System Architecture", "Decoupled 4-Tier Microservices Architecture", 
               "Independent scalability, strict separation of concerns, and 100% on-device private AI execution.")
    add_footer(s4, 4)

    # 4 Architecture Tier Cards (Horizontally stacked / Flow layout)
    tiers = [
        ("1. Presentation Tier (Frontend)", 
         "React 19 • TypeScript • Vite • Tailwind CSS\n• State Management: Zustand (Auth & Floating Timer)\n• Data Sync: TanStack React Query (Auto-invalidation)\n• Speech: Web Speech Recognition & Responsive UI", 
         ACCENT_CYAN, 0.8, 1.9, 5.75, 2.3),
        
        ("2. Application API Tier (Backend)", 
         "Node.js • Express REST API • ES Modules\n• Daily Analytics Aggregator Pipeline\n• 30+ Autonomous Tool Execution Engines\n• Two-Tier Cryptographic Confirmation Guard", 
         ACCENT_INDIGO, 6.75, 1.9, 5.75, 2.3),
        
        ("3. Machine Learning Microservice", 
         "Python • FastAPI • Uvicorn • Scikit-learn\n• Async High-Throughput Analytics Endpoints\n• Robust Fallback Engine (Scipy / Pure Math)\n• Pydantic Schema Contracts & Z-Score Scaling", 
         ACCENT_EMERALD, 0.8, 4.4, 5.75, 2.3),
        
        ("4. Local AI & Persistence Tier", 
         "Local Ollama (Qwen 3.5:4B) + MongoDB Atlas\n• Zero-Cloud-Cost, 100% Private On-Device LLM\n• 18+ Normalized & Event-Sourced Mongoose Schemas\n• HttpOnly JWT & Render Cloud Blueprint Synchronization", 
         ACCENT_AMBER, 6.75, 4.4, 5.75, 2.3)
    ]
    for title, desc, color, left, top, w, h in tiers:
        add_card(s4, left, top, w, h, title, color)
        tb = s4.shapes.add_textbox(Inches(left + 0.25), Inches(top + 0.6), Inches(w - 0.5), Inches(h - 0.7))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = 0
        p = tf.paragraphs[0]
        p.text = desc
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_WHITE
        p.line_spacing = 1.3

    # =========================================================================
    # SLIDE 5: AUTONOMOUS AI AGENT & NATURAL-LANGUAGE EXECUTION
    # =========================================================================
    s5 = prs.slides.add_slide(blank_layout)
    set_slide_background(s5)
    add_header(s5, "Core Innovation", "Autonomous Voice & Text Application Agent", 
               "Transforming conversational intent into real, verified database mutations across all application modules.")
    add_footer(s5, 5)

    # Left: Tool & Capability Grid
    add_card(s5, 0.8, 1.9, 5.75, 4.8, "30+ Fully Executable Tools", ACCENT_INDIGO)
    tb_left = s5.shapes.add_textbox(Inches(1.05), Inches(2.55), Inches(5.25), Inches(3.9))
    tf_l = tb_left.text_frame
    tf_l.word_wrap = True
    tf_l.margin_left = 0
    tools_desc = (
        "• Task Operations: create_task, complete_task, reopen_task, reschedule_task, bulk_update_tasks, search_tasks\n\n"
        "• Goal Operations: create_goal, move_goal, set_primary_goal, create_folder, log_goal_progress, archive_goal\n\n"
        "• Milestone & Module Tools: create_milestone, generate_module_slots, populate_module_slots, bulk_complete_modules\n\n"
        "• Habit Engine: create_habit, log_habit_checkin, undo_habit_checkin, pause_habit, get_habit_history\n\n"
        "• Compound Execution: Automatically decomposes multi-action commands into sequential dependency graphs."
    )
    p_l = tf_l.paragraphs[0]
    p_l.text = tools_desc
    p_l.font.size = Pt(11)
    p_l.font.color.rgb = TEXT_WHITE
    p_l.line_spacing = 1.25

    # Right: Multilingual NLP & Execution Pipeline
    add_card(s5, 6.75, 1.9, 5.75, 4.8, "Real-World Execution Examples", ACCENT_CYAN)
    tb_right = s5.shapes.add_textbox(Inches(7.0), Inches(2.55), Inches(5.25), Inches(3.9))
    tf_r = tb_right.text_frame
    tf_r.word_wrap = True
    tf_r.margin_left = 0
    nlp_desc = (
        "1. English Natural-Language:\n"
        "   \"Add a high-priority task to study Dynamic Programming tomorrow at 10 AM with 90 min duration.\"\n"
        "   ➔ Agent identifies intent, resolves dates, commits Task to DB.\n\n"
        "2. Hindi / Hinglish Speech Execution:\n"
        "   \"Kal subah 7 baje Java padhne ka task schedule kar do.\"\n"
        "   \"DSA goal ke Arrays milestone ke 5 modules complete mark kar do.\"\n"
        "   ➔ Model translates colloquial vernacular into verified tool calls.\n\n"
        "3. Multi-Action Compound Command:\n"
        "   \"Create a Java goal with 30 modules, add a daily 1-hour habit, and schedule practice for 6 PM.\"\n"
        "   ➔ Sequential 3-step pipeline with dependency verification."
    )
    p_r = tf_r.paragraphs[0]
    p_r.text = nlp_desc
    p_r.font.size = Pt(10.5)
    p_r.font.color.rgb = TEXT_WHITE
    p_r.line_spacing = 1.2

    # =========================================================================
    # SLIDE 6: TWO-TIER SAFE AI EXECUTION ENGINE
    # =========================================================================
    s6 = prs.slides.add_slide(blank_layout)
    set_slide_background(s6)
    add_header(s6, "AI Safety Architecture", "Two-Tier Execution Guard & Entity Resolution", 
               "Guaranteed safety: Contextual pronoun resolution, cryptographic confirmation tokens, and zero false claims.")
    add_footer(s6, 6)

    safety_cards = [
        ("Smart Entity Resolution Engine", 
         "Resolves contextual references such as 'this goal', 'the last task', 'the previous milestone', or 'the first five modules'.\n\n"
         "Matches records by title similarity, recent activity timestamps, and active screen context to prevent modifying incorrect items.",
         ACCENT_INDIGO),
        ("Two-Tier Confirmation Protocol", 
         "• Tier 1 (Reversible Actions): Creating tasks, marking check-ins, or logging progress execute immediately with instant undo toast.\n\n"
         "• Tier 2 (Destructive Actions): Permanent deletes and bulk updates generate single-use cryptographic confirmation tokens with preview diffs.",
         ACCENT_EMERALD),
        ("Zero False Claims Policy", 
         "Conventional LLMs hallucinate success ('I deleted your task!') even if backend calls fail.\n\n"
         "ConsistAI enforces strict transactional integrity: The AI agent only generates spoken and written confirmation after MongoDB persistence succeeds.",
         ACCENT_AMBER)
    ]
    for i, (title, text, color) in enumerate(safety_cards):
        left = 0.8 + (i * 3.98)
        add_card(s6, left, 1.9, 3.8, 4.8, title, color)
        tb = s6.shapes.add_textbox(Inches(left + 0.25), Inches(2.6), Inches(3.3), Inches(3.9))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = 0
        p = tf.paragraphs[0]
        p.text = text
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_WHITE
        p.line_spacing = 1.3

    # =========================================================================
    # SLIDE 7: VERIFIABLE GOAL HIERARCHY & PACING TELEMETRY
    # =========================================================================
    s7 = prs.slides.add_slide(blank_layout)
    set_slide_background(s7)
    add_header(s7, "Verifiable Goal Architecture", "Hierarchical Workspace & Mathematical Pacing", 
               "Structured breakdown from broad ambitions down to atomic, checkable module units.")
    add_footer(s7, 7)

    # Left: Structural Hierarchy
    add_card(s7, 0.8, 1.9, 5.75, 4.8, "Goal Structural Hierarchy", ACCENT_CYAN)
    tb_h = s7.shapes.add_textbox(Inches(1.05), Inches(2.55), Inches(5.25), Inches(3.9))
    tf_h = tb_h.text_frame
    tf_h.word_wrap = True
    tf_h.margin_left = 0
    h_text = (
        "📁 FOLDERS & SUBFOLDERS\n"
        "Organize goals by domain (e.g., 'Placement Prep', 'Academics', 'Fitness').\n\n"
        "🎯 QUANTITATIVE GOALS\n"
        "Verifiable metrics: Target deadline, category, priority, and primary focus.\n\n"
        "🚩 WEIGHTED MILESTONES\n"
        "Milestones carry custom weights representing syllabus importance:\n"
        "  Progress = [ Σ (weight_i × progress_i) / Σ weight_i ] × 100\n\n"
        "✅ ATOMIC CHECKABLE MODULES\n"
        "Compact 2-column checklist of 20-30 individual concepts (e.g., 'Two Sum', 'Reverse Linked List') preventing vague, unmeasurable progress."
    )
    p_h = tf_h.paragraphs[0]
    p_h.text = h_text
    p_h.font.size = Pt(11)
    p_h.font.color.rgb = TEXT_WHITE
    p_h.line_spacing = 1.25

    # Right: Pacing Gap Formula and Metrics
    add_card(s7, 6.75, 1.9, 5.75, 4.8, "Non-Linear Pacing Gap Telemetry", ACCENT_EMERALD)
    tb_p = s7.shapes.add_textbox(Inches(7.0), Inches(2.55), Inches(5.25), Inches(3.9))
    tf_p = tb_p.text_frame
    tf_p.word_wrap = True
    tf_p.margin_left = 0
    p_text = (
        "MATHEMATICAL PACING GAP FORMULATION:\n\n"
        "  Pacing Gap = Actual Progress % − Elapsed Schedule Time %\n\n"
        "• Ahead of Schedule (+Gap > +5%):\n"
        "  User velocity is outpacing schedule; recommended to reinforce deep concepts.\n\n"
        "• On Track (-5% ≤ Gap ≤ +5%):\n"
        "  Work session cadences are aligned with target deadline.\n\n"
        "• Behind Schedule (Gap < -5%):\n"
        "  Triggers intelligent pacing alert: calculates exact daily module completion rate required to recover deadline without burnout."
    )
    p_p = tf_p.paragraphs[0]
    p_p.text = p_text
    p_p.font.size = Pt(11)
    p_p.font.color.rgb = TEXT_WHITE
    p_p.line_spacing = 1.3

    # =========================================================================
    # SLIDE 8: TASK MANAGER & MULTI-CADENCE HABIT ENGINE
    # =========================================================================
    s8 = prs.slides.add_slide(blank_layout)
    set_slide_background(s8)
    add_header(s8, "Daily Execution", "Goal-Linked Tasks & Multi-Cadence Habit Engine", 
               "Distinguishing isolated daily to-dos from high-impact, goal-advancing deep work.")
    add_footer(s8, 8)

    # Left: Task Manager
    add_card(s8, 0.8, 1.9, 5.75, 4.8, "Eisenhower-Prioritized Task Manager", ACCENT_INDIGO)
    tb_task = s8.shapes.add_textbox(Inches(1.05), Inches(2.55), Inches(5.25), Inches(3.9))
    tf_t = tb_task.text_frame
    tf_t.word_wrap = True
    tf_t.margin_left = 0
    task_body = (
        "• Goal & Milestone Linkage:\n"
        "  Tasks can be directly linked to active Goals and Milestones. Completing a task automatically increments goal progress.\n\n"
        "• 4 Priority Tiers:\n"
        "  Urgent, High, Medium, Low with intelligent color-coding and automated smart sorting.\n\n"
        "• Integrated Floating Focus Timer:\n"
        "  Start 25-minute Pomodoro or Stopwatch work sessions linked directly to a task; session duration feeds into daily analytics.\n\n"
        "• Full Lifecycle Management:\n"
        "  Pending, Completed, Rescheduled, Archived, and Restored with full audit logs."
    )
    p_t = tf_t.paragraphs[0]
    p_t.text = task_body
    p_t.font.size = Pt(11)
    p_t.font.color.rgb = TEXT_WHITE
    p_t.line_spacing = 1.25

    # Right: Multi-Cadence Habit Engine
    add_card(s8, 6.75, 1.9, 5.75, 4.8, "4 Habit Types & Behavioral Logging", ACCENT_AMBER)
    tb_habit = s8.shapes.add_textbox(Inches(7.0), Inches(2.55), Inches(5.25), Inches(3.9))
    tf_h = tb_habit.text_frame
    tf_h.word_wrap = True
    tf_h.margin_left = 0
    habit_body = (
        "1. Binary Habits: Simple completion checkmarks (e.g. Morning Meditation).\n\n"
        "2. Quantitative Habits: Target quantity tracking (e.g. Read 20 pages, solve 3 DSA problems).\n\n"
        "3. Duration Habits: Focused time commitment (e.g. 60 minutes deep study).\n\n"
        "4. Limit-based Habits: Negative habit restraint (e.g. Screen time < 60 minutes).\n\n"
        "• Multi-Day Cadences: Daily, Weekdays, Weekends, or Custom Day Schedules.\n\n"
        "• Audit Logs: Timestamped check-in history prevents streak fraud and enables retrospective ML association mining."
    )
    p_h = tf_h.paragraphs[0]
    p_h.text = habit_body
    p_h.font.size = Pt(11)
    p_h.font.color.rgb = TEXT_WHITE
    p_h.line_spacing = 1.2

    # =========================================================================
    # SLIDE 9: APPLIED ML ENGINE: 4 CORE ALGORITHMS
    # =========================================================================
    s9 = prs.slides.add_slide(blank_layout)
    set_slide_background(s9)
    add_header(s9, "Machine Learning Engine", "Four Complementary Retrospective ML Models", 
               "Rigorous statistical algorithms providing deep behavioral understanding without false predictive claims.")
    add_footer(s9, 9)

    ml_models = [
        ("1. K-Means Clustering", 
         "• Unsupervised Activity Profiling\n• Standardized Z-Score Input Matrix\n• Evaluates 6 behavioral dimensions\n• Validates clusters against held-out daily goal progress delta", 
         ACCENT_INDIGO),
        ("2. Isolation Forest", 
         "• Operational Anomaly Detection\n• Random recursive split path scoring\n• Flags atypical burnouts or drop-offs\n• Multivariate explanation via standard feature deviation breakdown", 
         ACCENT_EMERALD),
        ("3. Apriori Rule Mining", 
         "• Habit Co-occurrence Discovery\n• Transforms daily logs into transactions\n• Measures Support, Confidence & Lift\n• Identifies positive and negative habit trigger chains", 
         ACCENT_CYAN),
        ("4. Pearson & Spearman", 
         "• Monotonic Correlation Analysis\n• Computes linear (r) & rank (ρ) links\n• Maps focus duration to progress\n• Validates negative impact of digital screen distraction", 
         ACCENT_AMBER)
    ]
    for i, (title, points, color) in enumerate(ml_models):
        left = 0.8 + (i * 2.98)
        add_card(s9, left, 1.9, 2.8, 4.8, title, color)
        tb = s9.shapes.add_textbox(Inches(left + 0.25), Inches(2.6), Inches(2.3), Inches(3.9))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = 0
        p = tf.paragraphs[0]
        p.text = points
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_WHITE
        p.line_spacing = 1.3

    # =========================================================================
    # SLIDE 10: EXPERIMENTAL ML EVALUATION & FINDINGS
    # =========================================================================
    s10 = prs.slides.add_slide(blank_layout)
    set_slide_background(s10)
    add_header(s10, "Empirical Evaluation", "Model Evaluation & Quantitative Insights", 
               "Empirical results obtained from controlled synthetic behavioral generation and real user telemetry.")
    add_footer(s10, 10)

    # 4 Metric Cards across Top
    metrics = [
        ("0.539", "Silhouette Score", "Optimal cluster separation at k=3", ACCENT_INDIGO),
        ("+1.87%", "Cluster 1 Delta", "Average daily progress in Deep Flow", ACCENT_EMERALD),
        ("4.09x", "Max Rule Lift", "Strong habit co-occurrence trigger", ACCENT_CYAN),
        ("+0.728", "Pearson r (Focus)", "Strong linear correlation with progress", ACCENT_AMBER)
    ]
    for i, (val, title, sub, color) in enumerate(metrics):
        left = 0.8 + (i * 2.98)
        card = add_card(s10, left, 1.9, 2.8, 1.6, "", color)
        tb = s10.shapes.add_textbox(Inches(left + 0.15), Inches(2.0), Inches(2.5), Inches(1.3))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = 0
        p_v = tf.paragraphs[0]
        p_v.text = val
        p_v.font.size = Pt(28)
        p_v.font.bold = True
        p_v.font.color.rgb = color
        
        p_t = tf.add_paragraph()
        p_t.text = title
        p_t.font.size = Pt(11)
        p_t.font.bold = True
        p_t.font.color.rgb = TEXT_WHITE
        p_t.space_before = Pt(2)
        
        p_s = tf.add_paragraph()
        p_s.text = sub
        p_s.font.size = Pt(9.5)
        p_s.font.color.rgb = TEXT_MUTED

    # Bottom comparison table/cards: Cluster Characterization & Correlation
    add_card(s10, 0.8, 3.75, 5.75, 2.95, "Cluster Characterization (k=3)", ACCENT_CYAN)
    tb_c = s10.shapes.add_textbox(Inches(1.05), Inches(4.3), Inches(5.25), Inches(2.2))
    tf_c = tb_c.text_frame
    tf_c.word_wrap = True
    tf_c.margin_left = 0
    c_desc = (
        "• Cluster 1 ('Deep Flow'): 165m avg focus, 42m screen distraction, 92% task completion ➔ Yields +1.87% daily milestone velocity.\n\n"
        "• Cluster 2 ('Fragmented'): 45m avg focus, 148m screen distraction, 40% completion ➔ Yields only +0.21% progress.\n\n"
        "• Cluster 3 ('Low Activity / Rest'): Deliberate rest days, 0m focus, baseline recovery."
    )
    p_c = tf_c.paragraphs[0]
    p_c.text = c_desc
    p_c.font.size = Pt(10.5)
    p_c.font.color.rgb = TEXT_WHITE
    p_c.line_spacing = 1.25

    add_card(s10, 6.75, 3.75, 5.75, 2.95, "Correlation & Anomaly Evaluation", ACCENT_EMERALD)
    tb_m = s10.shapes.add_textbox(Inches(7.0), Inches(4.3), Inches(5.25), Inches(2.2))
    tf_m = tb_m.text_frame
    tf_m.word_wrap = True
    tf_m.margin_left = 0
    m_desc = (
        "• Strong Monotonic Correlation:\n"
        "  - Focus Session Minutes vs Progress: r = +0.728 (Spearman ρ = +0.702)\n"
        "  - Digital Screen Distraction vs Progress: r = -0.626 (Spearman ρ = -0.598)\n\n"
        "• Anomaly Explanations via Isolation Forest:\n"
        "  Flagged atypical days with 89% precision, isolating primary drivers (e.g. 3.2x spike in social media screen time vs baseline)."
    )
    p_m = tf_m.paragraphs[0]
    p_m.text = m_desc
    p_m.font.size = Pt(10.5)
    p_m.font.color.rgb = TEXT_WHITE
    p_m.line_spacing = 1.25

    # =========================================================================
    # SLIDE 11: THE EMPIRICAL IMPROVEMENT LAB
    # =========================================================================
    s11 = prs.slides.add_slide(blank_layout)
    set_slide_background(s11)
    add_header(s11, "Continuous Improvement", "Empirical Improvement Lab (14-Day A/B Trials)", 
               "Moving beyond passive reporting into hypothesis-driven, empirically validated behavioral interventions.")
    add_footer(s11, 11)

    lab_steps = [
        ("1. Bottleneck Detection", 
         "ML engines retroactively identify operational friction (e.g. cluster regression caused by afternoon phone screen time).", 
         ACCENT_INDIGO),
        ("2. Testable Hypothesis", 
         "Generates a concrete, testable rule: 'Complete 45 min of Java DSA phone-free before launching social media apps.'", 
         ACCENT_CYAN),
        ("3. 14-Day Controlled Trial", 
         "User opts into a 14-day tracking window with clear before vs after baseline telemetry monitoring.", 
         ACCENT_AMBER),
        ("4. Empirical Validation", 
         "Calculates statistical delta: Did focus time increase? Did progress velocity accelerate? Retains successful habits.", 
         ACCENT_EMERALD)
    ]
    for i, (title, desc, color) in enumerate(lab_steps):
        left = 0.8 + (i * 2.98)
        add_card(s11, left, 1.9, 2.8, 2.0, title, color)
        tb = s11.shapes.add_textbox(Inches(left + 0.2), Inches(2.55), Inches(2.4), Inches(1.2))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = 0
        p = tf.paragraphs[0]
        p.text = desc
        p.font.size = Pt(10.5)
        p.font.color.rgb = TEXT_WHITE
        p.line_spacing = 1.2

    # Case Study Card across Bottom
    add_card(s11, 0.8, 4.15, 11.7, 2.55, "Case Study: 14-Day Intervention Results (Engineering Student)", ACCENT_EMERALD)
    tb_cs = s11.shapes.add_textbox(Inches(1.05), Inches(4.7), Inches(11.2), Inches(1.8))
    tf_cs = tb_cs.text_frame
    tf_cs.word_wrap = True
    tf_cs.margin_left = 0
    cs_text = (
        "• Baseline (14-Day Pre-Intervention): 95 min avg daily focus, 135 min social media distraction, +0.85% daily progress velocity.\n\n"
        "• Post-Intervention (14-Day Phone-Free Study Block): 165 min avg focus (+70 min/day, +73.7%), 52 min distraction (-83 min/day, -61.5%).\n\n"
        "• Verifiable Outcome: Goal progress delta accelerated from +0.85% to +1.62% per day (+90.6% relative velocity increase).\n\n"
        "• Scientific Disclaimer: System transparently displays statistical correlation without asserting deterministic single-factor causality."
    )
    p_cs = tf_cs.paragraphs[0]
    p_cs.text = cs_text
    p_cs.font.size = Pt(11)
    p_cs.font.color.rgb = TEXT_WHITE
    p_cs.line_spacing = 1.2

    # =========================================================================
    # SLIDE 12: DEPLOYMENT ARCHITECTURE & CLOUD STRATEGY
    # =========================================================================
    s12 = prs.slides.add_slide(blank_layout)
    set_slide_background(s12)
    add_header(s12, "Production Engineering", "Render Cloud Deployment & Zero-Cost Infrastructure", 
               "Automated multi-service synchronization via Render Blueprint and resilient local AI integration.")
    add_footer(s12, 12)

    dep_cards = [
        ("Render Blueprint (render.yaml)", 
         "• Automated 3-Service Provisioning:\n"
         "  1. consistai-backend (Node.js API)\n"
         "  2. consistai-frontend (React Vite Static Site)\n"
         "  3. consistai-ml (Python FastAPI Engine)\n\n"
         "• Service Interlinking: Auto-injects internal host URLs between microservices using fromService descriptors.\n\n"
         "• SPA Routing: Client-side /* ➔ /index.html rewrite prevents 404s on browser reloads.",
         ACCENT_INDIGO),
        ("MongoDB Atlas M0 Pairing", 
         "• Free-Tier Cloud Database:\n"
         "  High availability, automated backups, and encrypted transport.\n\n"
         "• 18+ Optimized Collections:\n"
         "  Indexed queries for sub-50ms API response latency.\n\n"
         "• Event Sourcing:\n"
         "  Audit records for progress history and ML retraining datasets.",
         ACCENT_CYAN),
        ("Hybrid Local-Cloud AI Strategy", 
         "• Free Cloud RAM Limit (512MB):\n"
         "  Cloud free tiers cannot host a 4B parameter LLM locally.\n\n"
         "• ConsistAI Innovation:\n"
         "  Core system runs 100% cloud-native.\n\n"
         "• Secure Tunneling:\n"
         "  Local Ollama connected via ngrok (ngrok http 11434) with zero cloud GPU costs.",
         ACCENT_AMBER)
    ]
    for i, (title, desc, color) in enumerate(dep_cards):
        left = 0.8 + (i * 3.98)
        add_card(s12, left, 1.9, 3.8, 4.8, title, color)
        tb = s12.shapes.add_textbox(Inches(left + 0.25), Inches(2.6), Inches(3.3), Inches(3.9))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = 0
        p = tf.paragraphs[0]
        p.text = desc
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_WHITE
        p.line_spacing = 1.3

    # =========================================================================
    # SLIDE 13: KEY CHALLENGES & ENGINEERING SOLUTIONS
    # =========================================================================
    s13 = prs.slides.add_slide(blank_layout)
    set_slide_background(s13)
    add_header(s13, "Engineering Highlights", "Technical Challenges & Architectural Solutions", 
               "Overcoming real-world edge cases in autonomous AI execution, local inference, and statistical data mining.")
    add_footer(s13, 13)

    challenges = [
        ("Challenge: Local LLM Latency & Precision", 
         "Small 4B models can hallucinate tool parameters or generate slow responses.\n\n"
         "✔ Solution: Strict low temperature (0.1), constrained 8192 context window, Pydantic/Joi JSON validation schemas, and fallback retry loops.",
         ACCENT_CYAN),
        ("Challenge: Destructive Accidental Operations", 
         "User commands like 'remove that goal' can cause catastrophic data loss if misinterpreted.\n\n"
         "✔ Solution: Reversible soft-delete, contextual entity resolution with active tab scoping, and single-use cryptographic confirmation tokens.",
         ACCENT_ROSE),
        ("Challenge: Dual-Engine ML Portability", 
         "Standard ML libraries (Scikit-learn, Scipy) require complex C++ wheels that can fail in constrained container environments.\n\n"
         "✔ Solution: Implemented a robust dual-engine architecture: Python FastAPI with Scikit-learn primary, plus a pure mathematical fallback engine.",
         ACCENT_AMBER),
        ("Challenge: Eliminating False AI Claims", 
         "AI chat interfaces often report 'Task completed!' before verifying backend write success.\n\n"
         "✔ Solution: Decoupled transaction pipeline requiring database acknowledgement before AI response synthesis.",
         ACCENT_EMERALD)
    ]
    for i, (title, desc, color) in enumerate(challenges):
        row = i // 2
        col = i % 2
        left = 0.8 + (col * 5.95)
        top = 1.9 + (row * 2.4)
        add_card(s13, left, top, 5.75, 2.2, title, color)
        tb = s13.shapes.add_textbox(Inches(left + 0.25), Inches(top + 0.65), Inches(5.25), Inches(1.4))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = 0
        p = tf.paragraphs[0]
        p.text = desc
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_WHITE
        p.line_spacing = 1.25

    # =========================================================================
    # SLIDE 14: FUTURE ROADMAP & ACADEMIC CONCLUSION
    # =========================================================================
    s14 = prs.slides.add_slide(blank_layout)
    set_slide_background(s14)
    add_header(s14, "Looking Forward", "Academic Contributions & Future Roadmap", 
               "Summary of research findings and planned extensions for enterprise and wearable integration.")
    add_footer(s14, 14)

    # Left: Academic Contributions
    add_card(s14, 0.8, 1.9, 5.75, 4.8, "Key Academic Contributions", ACCENT_INDIGO)
    tb_ac = s14.shapes.add_textbox(Inches(1.05), Inches(2.55), Inches(5.25), Inches(3.9))
    tf_ac = tb_ac.text_frame
    tf_ac.word_wrap = True
    tf_ac.margin_left = 0
    ac_text = (
        "1. Replaced Speculative Forecasting with Retrospective Analytics:\n"
        "   Demonstrated that unsupervised behavioral pattern mining provides superior user trust compared to ungrounded future predictive models.\n\n"
        "2. Actionable Autonomous Application Agents:\n"
        "   Proved that a local 4B LLM running on consumer hardware can reliably control 30+ full-stack application tools using structured function calling.\n\n"
        "3. Verifiable Milestone Hierarchy:\n"
        "   Established a quantitative framework where atomic modules and schedule pacing gaps eliminate the illusion of superficial habit streaks.\n\n"
        "4. Controlled Behavioral Experimentation:\n"
        "   Pioneered the 14-day empirical improvement lab, empowering users to test behavioral interventions with rigorous before/after telemetry."
    )
    p_ac = tf_ac.paragraphs[0]
    p_ac.text = ac_text
    p_ac.font.size = Pt(11)
    p_ac.font.color.rgb = TEXT_WHITE
    p_ac.line_spacing = 1.25

    # Right: Future Scope
    add_card(s14, 6.75, 1.9, 5.75, 4.8, "Future Research & Development", ACCENT_CYAN)
    tb_fs = s14.shapes.add_textbox(Inches(7.0), Inches(2.55), Inches(5.25), Inches(3.9))
    tf_fs = tb_fs.text_frame
    tf_fs.word_wrap = True
    tf_fs.margin_left = 0
    fs_text = (
        "• Wearable Biometric Telemetry:\n"
        "  Integrate Apple Watch / Garmin API to correlate Heart Rate Variability (HRV), sleep staging, and physiological stress with deep work velocity.\n\n"
        "• Multi-Agent Autonomous Swarms:\n"
        "  Deploy collaborative subagents: a Syllabus Researcher agent, a Code Reviewer agent, and a Schedule Optimizer agent working in tandem.\n\n"
        "• Edge WASM / WebLLM Inference:\n"
        "  Run quantized 2B/4B models directly inside WebAssembly / WebGPU in the browser for zero-install, 100% offline desktop and mobile autonomy.\n\n"
        "• Multi-User Collaborative Sprints:\n"
        "  Expand milestone checklists to support university project teams and engineering cohorts."
    )
    p_fs = tf_fs.paragraphs[0]
    p_fs.text = fs_text
    p_fs.font.size = Pt(11)
    p_fs.font.color.rgb = TEXT_WHITE
    p_fs.line_spacing = 1.25

    # =========================================================================
    # SLIDE 15: CONCLUSION & LIVE DEMONSTRATION
    # =========================================================================
    s15 = prs.slides.add_slide(blank_layout)
    set_slide_background(s15)

    # Hero Banner
    add_card(s15, 0.8, 1.0, 11.7, 3.2, "Thank You! Questions & Discussion", ACCENT_CYAN, bg_color=CARD_ACCENT_BG)
    tb_end = s15.shapes.add_textbox(Inches(1.1), Inches(1.6), Inches(11.1), Inches(2.3))
    tf_e = tb_end.text_frame
    tf_e.word_wrap = True
    tf_e.margin_left = 0
    p_e1 = tf_e.paragraphs[0]
    p_e1.text = "ConsistAI is fully running, tested, and deployment-ready."
    p_e1.font.size = Pt(22)
    p_e1.font.bold = True
    p_e1.font.color.rgb = TEXT_WHITE

    p_e2 = tf_e.add_paragraph()
    p_e2.text = "A complete, private-first productivity ecosystem combining autonomous AI action with empirical behavioral science."
    p_e2.font.size = Pt(14)
    p_e2.font.color.rgb = ACCENT_CYAN
    p_e2.space_before = Pt(8)

    # 3 Summary Info Boxes across bottom
    demo_points = [
        ("LIVE DEMO HIGHLIGHTS", 
         "• Natural Language Voice Control\n• Goal & Module Checklists\n• Real-Time Pacing Gap Telemetry\n• Retrospective ML Analytics Dashboard", 
         ACCENT_INDIGO),
        ("ENGINEERING REPOSITORIES", 
         "• GitHub: github.com/Alok1700/consistai\n• Cloud: Render Blueprint Ready\n• Database: MongoDB Atlas M0\n• AI: Local Ollama (qwen3.5:4b)", 
         ACCENT_EMERALD),
        ("CANDIDATE DETAILS", 
         "• Name: Alok Singh\n• Degree: B.Tech Computer Science\n• Domain: MERN • Python ML • AI Agents\n• Contact: singhalok1700@gmail.com", 
         ACCENT_AMBER)
    ]
    for i, (head, points, color) in enumerate(demo_points):
        left = 0.8 + (i * 3.98)
        add_card(s15, left, 4.45, 3.8, 2.3, head, color)
        tb = s15.shapes.add_textbox(Inches(left + 0.25), Inches(4.95), Inches(3.3), Inches(1.7))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = 0
        p = tf.paragraphs[0]
        p.text = points
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_WHITE
        p.line_spacing = 1.25

    add_footer(s15, 15)

    output_path = os.path.abspath("ConsistAI_Project_Presentation.pptx")
    prs.save(output_path)
    print(f"Presentation saved successfully to: {output_path}")

if __name__ == "__main__":
    create_deck()
