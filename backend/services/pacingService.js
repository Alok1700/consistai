/**
 * PacingService — Deterministic Mathematical Schedule & Workload Engine
 * 
 * Rules:
 * - Expected Progress = (Elapsed Eligible Working Days / Total Eligible Working Days) * 100
 * - Pacing Gap = Actual Progress - Expected Progress
 * - Thresholds:
 *   - Ahead: > +5 percentage points
 *   - On Pace: -5 to +5 percentage points
 *   - Needs Attention: -15 to < -5 percentage points
 *   - Behind Schedule: < -15 percentage points
 * - Uses customizable user/goal working days (e.g. ['Mon','Tue','Wed','Thu','Fri','Sat']).
 * - Calculates actual eligible calendar days matching the working days schedule.
 * - Buffer calculation based on estimated workload and available time.
 * - Plain language human recommendations.
 */

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const pacingService = {
  /**
   * Count how many dates between start and end match the active workdays list
   */
  countEligibleDays(startDate, endDate, workingDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']) {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) return 0;

    let count = 0;
    const current = new Date(start);
    // Normalize to midnight UTC/local
    current.setHours(0, 0, 0, 0);
    const targetEnd = new Date(end);
    targetEnd.setHours(23, 59, 59, 999);

    const safeDays = Array.isArray(workingDays) && workingDays.length > 0 
      ? workingDays 
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    while (current <= targetEnd) {
      const dayName = DAY_NAMES[current.getDay()];
      if (safeDays.includes(dayName)) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return Math.max(1, count);
  },

  /**
   * Calculate comprehensive pacing and workload metrics for a goal
   */
  calculateGoalPacing(goal, milestones = [], userPreferences = {}) {
    const now = new Date();
    const startDate = new Date(goal.startDate || now);
    const targetDate = goal.targetDate ? new Date(goal.targetDate) : null;
    const progress = Math.min(100, Math.max(0, goal.currentProgressPercentage || 0));
    const status = goal.status || 'active';

    const workingDays = goal.scheduleSettings?.preferredWorkingDays || 
      userPreferences?.workingDays || 
      ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const availableMinutesPerDay = goal.scheduleSettings?.dailyAvailableMinutes || 
      (userPreferences?.dailyWorkHourTarget ? userPreferences.dailyWorkHourTarget * 60 : 120);

    // Completed or Paused goals
    if (status === 'completed') {
      return {
        pacing_status: 'ahead',
        pacing_label: 'Goal Completed',
        progress_gap_pct: 0,
        actual_goal_progress_pct: 100,
        elapsed_time_pct: 100,
        days_elapsed: 0,
        days_remaining: 0,
        total_duration_days: 0,
        required_daily_progress_to_finish: 0,
        suggested_daily_workload: 'All goals completed! Great work.',
        actionable_recommendation: 'Goal achieved successfully.',
        buffer_days: 0,
        buffer_explanation: 'Goal has been achieved.',
        is_overdue: false,
        overdue_days: 0,
        working_days: workingDays
      };
    }

    // No target deadline specified
    if (!targetDate) {
      const incompleteCount = milestones.filter(m => m.status !== 'completed' && m.status !== 'skipped' && !m.isCompleted).length;
      return {
        pacing_status: 'on_pace',
        pacing_label: 'Flexible Schedule (No Deadline)',
        progress_gap_pct: 0,
        actual_goal_progress_pct: progress,
        elapsed_time_pct: 0,
        days_elapsed: Math.max(0, Math.round((now - startDate) / 86400000)),
        days_remaining: null,
        total_duration_days: null,
        required_daily_progress_to_finish: null,
        suggested_daily_workload: incompleteCount > 0 ? `Work on 1 module at your own pace (${incompleteCount} pending)` : 'All modules completed',
        actionable_recommendation: 'Set a target completion date whenever you want intelligent schedule forecasting.',
        buffer_days: null,
        buffer_explanation: 'Open-ended goal without fixed deadline.',
        is_overdue: false,
        overdue_days: 0,
        working_days: workingDays
      };
    }

    // Calendar Days
    const totalCalendarDays = Math.max(1, Math.round((targetDate - startDate) / 86400000));
    const elapsedCalendarDays = Math.max(0, Math.round((now - startDate) / 86400000));
    const remainingCalendarDays = Math.max(0, Math.ceil((targetDate - now) / 86400000));
    const isOverdue = targetDate < now;
    const overdueDays = isOverdue ? Math.ceil((now - targetDate) / 86400000) : 0;

    // Eligible Work Days according to schedule
    const totalEligibleDays = this.countEligibleDays(startDate, targetDate, workingDays);
    const elapsedEligibleDays = now < startDate 
      ? 0 
      : Math.min(totalEligibleDays, this.countEligibleDays(startDate, Math.min(now, targetDate), workingDays));
    const remainingEligibleDays = isOverdue ? 0 : Math.max(0, totalEligibleDays - elapsedEligibleDays);

    // Expected Progress & Pacing Gap
    const expectedProgressPct = Number(Math.min(100, Math.max(0, (elapsedEligibleDays / totalEligibleDays) * 100)).toFixed(1));
    const pacingGap = Number((progress - expectedProgressPct).toFixed(1));

    // Thresholds:
    // Ahead: > +5
    // On Pace: -5 to +5
    // Needs Attention: -15 to < -5
    // Behind Schedule: < -15
    let pacingStatus = 'on_pace';
    if (pacingGap > 5) pacingStatus = 'ahead';
    else if (pacingGap >= -5) pacingStatus = 'on_pace';
    else if (pacingGap >= -15) pacingStatus = 'needs_attention';
    else pacingStatus = 'behind_schedule';

    // Workload Calculations
    const incompleteModules = milestones.filter(m => m.status !== 'completed' && m.status !== 'skipped' && !m.isCompleted);
    const numIncomplete = incompleteModules.length;

    let suggestedDailyWorkload = 'All modules completed!';
    let actionableRecommendation = 'Keep steady consistency.';
    let bufferExplanation = 'No pending modules.';
    let daysPerModule = 0;
    let bufferDays = 0;
    const requiredDailyProgress = remainingCalendarDays > 0 
      ? Number(((100 - progress) / remainingCalendarDays).toFixed(2)) 
      : (100 - progress);

    if (numIncomplete > 0 && remainingEligibleDays > 0) {
      daysPerModule = Number((remainingEligibleDays / numIncomplete).toFixed(1));
      bufferDays = Math.max(0, remainingEligibleDays - numIncomplete);

      if (daysPerModule >= 1.0) {
        suggestedDailyWorkload = `1 module every ${daysPerModule} study days (${bufferDays} flexible buffer days)`;
        bufferExplanation = `Assuming 1 module per active study day, you have ${bufferDays} buffer days before your deadline.`;
        if (pacingStatus === 'ahead') {
          actionableRecommendation = `You're pacing ahead of schedule (+${pacingGap}%). Maintain 1 module every ${daysPerModule} study days.`;
        } else if (pacingStatus === 'on_pace') {
          actionableRecommendation = `You're on track. Complete 1 module every ${daysPerModule} study days to finish on time.`;
        } else {
          actionableRecommendation = `You have a minor deficit (${pacingGap}%). Complete an extra module this week or start a focus session.`;
        }
      } else {
        const modulesPerDay = (numIncomplete / remainingEligibleDays).toFixed(1);
        suggestedDailyWorkload = `Pace deficit: ${modulesPerDay} modules per study day needed (0 buffer days remaining)`;
        bufferExplanation = 'You have fewer remaining eligible study days than incomplete modules.';
        actionableRecommendation = `You need ${modulesPerDay} modules per study day. Consider extending your deadline by 7–14 days for a sustainable schedule.`;
      }
    } else if (isOverdue && numIncomplete > 0) {
      suggestedDailyWorkload = `Target deadline passed with ${numIncomplete} incomplete modules.`;
      actionableRecommendation = `Target deadline passed ${overdueDays} days ago. Extend deadline by 14 days to regenerate a fresh schedule.`;
      bufferExplanation = 'Target deadline has passed.';
    }

    return {
      pacing_status: pacingStatus,
      pacing_label: `${pacingGap >= 0 ? '+' : ''}${pacingGap}% pacing gap`,
      progress_gap_pct: pacingGap,
      actual_goal_progress_pct: progress,
      elapsed_time_pct: expectedProgressPct,
      days_elapsed: elapsedCalendarDays,
      days_remaining: remainingCalendarDays,
      total_duration_days: totalCalendarDays,
      total_eligible_days: totalEligibleDays,
      elapsed_eligible_days: elapsedEligibleDays,
      remaining_eligible_days: remainingEligibleDays,
      days_per_module: daysPerModule,
      buffer_days: bufferDays,
      buffer_explanation: bufferExplanation,
      incomplete_modules_count: numIncomplete,
      required_daily_progress_to_finish: requiredDailyProgress,
      suggested_daily_workload: suggestedDailyWorkload,
      actionable_recommendation: actionableRecommendation,
      is_overdue: isOverdue,
      overdue_days: overdueDays,
      working_days: workingDays,
      work_schedule_policy: `Calculated using ${workingDays.length} active study days per week (${workingDays.join(', ')}).`
    };
  }
};
