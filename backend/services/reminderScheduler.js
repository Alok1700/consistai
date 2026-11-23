import Reminder from '../models/Reminder.js';
import Task from '../models/Task.js';
import User from '../models/User.js';

let schedulerInterval = null;

export const startReminderScheduler = () => {
  if (schedulerInterval) return;

  console.log('[ConsistAI Voice] Background Reminder Engine initialized.');

  // Run initial scan
  checkAndDispatchReminders();

  // Run periodic worker every 30 seconds
  schedulerInterval = setInterval(() => {
    checkAndDispatchReminders();
  }, 30000);
};

export const stopReminderScheduler = () => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
};

/**
 * Helper to check if current time is within user quiet hours (Default: 10 PM - 7 AM)
 */
export const isWithinQuietHours = (timezone = 'UTC') => {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone || 'UTC',
      hour: 'numeric',
      hour12: false
    });
    const hour = parseInt(formatter.format(new Date()), 10);
    return hour >= 22 || hour < 7;
  } catch (e) {
    return false;
  }
};

/**
 * Continuous reminder dispatcher
 */
export const checkAndDispatchReminders = async () => {
  try {
    const now = new Date();

    // 1. Find due reminders
    const dueReminders = await Reminder.find({
      status: 'scheduled',
      scheduledAt: { $lte: now }
    }).populate('taskId').populate('user');

    for (const reminder of dueReminders) {
      // Respect notification permissions and quiet hours
      const user = reminder.user;
      if (user?.preferences?.notificationsEnabled === false) {
        reminder.status = 'dismissed';
        await reminder.save();
        continue;
      }

      if (isWithinQuietHours(user?.preferences?.timezone)) {
        // Postpone delivery past quiet hours (7 AM)
        const postponed = new Date(now.getTime() + 60 * 60000);
        reminder.scheduledAt = postponed;
        await reminder.save();
        continue;
      }

      // Verify task status if linked
      if (reminder.taskId) {
        const task = reminder.taskId;
        if (task.status === 'completed' || task.status === 'cancelled') {
          reminder.status = 'dismissed';
          await reminder.save();
          continue;
        }
      }

      // Mark as sent
      reminder.status = 'sent';
      reminder.sentAt = new Date();
      await reminder.save();

      console.log(`[Reminder Alert] Dispatched reminder to user ${user?._id || reminder.user}: "${reminder.message}"`);
    }

    // 2. Upcoming Task Start Reminders (Tasks due to start in the next 15 minutes)
    const upcomingTasks = await Task.find({
      dueDate: { $gte: now, $lte: new Date(now.getTime() + 15 * 60000) },
      status: 'pending'
    }).populate('user').limit(5);

    for (const ut of upcomingTasks) {
      if (ut.user?.preferences?.notificationsEnabled === false) continue;
      if (isWithinQuietHours(ut.user?.preferences?.timezone)) continue;

      const existingStartReminder = await Reminder.findOne({
        taskId: ut._id,
        reminderType: 'task_start'
      });

      if (!existingStartReminder) {
        await Reminder.create({
          user: ut.user?._id || ut.user,
          taskId: ut._id,
          reminderType: 'task_start',
          scheduledAt: ut.dueDate,
          status: 'sent',
          sentAt: new Date(),
          message: `Heads up: Your task "${ut.title}" is starting soon.`
        });
      }
    }

    // 3. Overdue task detection & follow-up scheduler
    const overdueTasksWithoutReminders = await Task.find({
      dueDate: { $lt: new Date(now.getTime() - 20 * 60000) }, // 20+ mins past deadline
      status: 'pending'
    }).populate('user').limit(5);

    for (const ot of overdueTasksWithoutReminders) {
      if (ot.user?.preferences?.notificationsEnabled === false) continue;
      if (isWithinQuietHours(ot.user?.preferences?.timezone)) continue;

      const existingOverdueReminder = await Reminder.findOne({
        taskId: ot._id,
        reminderType: 'overdue_check'
      });

      if (!existingOverdueReminder) {
        const timeStr = new Date(ot.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        await Reminder.create({
          user: ot.user?._id || ot.user,
          taskId: ot._id,
          reminderType: 'overdue_check',
          scheduledAt: new Date(),
          status: 'sent',
          sentAt: new Date(),
          message: `Your task "${ot.title}" was scheduled to finish at ${timeStr}, but hasn't been marked complete. Did you finish it?`
        });
      }
    }
  } catch (err) {
    console.error('[Reminder Engine Error]:', err.message);
  }
};
