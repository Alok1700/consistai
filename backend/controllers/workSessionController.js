import WorkSession from '../models/WorkSession.js';
import Task from '../models/Task.js';
import { syncDailyAnalytics } from '../services/dailyAnalyticsAggregator.js';

export const logWorkSession = async (req, res, next) => {
  try {
    const {
      goal,
      task,
      category,
      startTime,
      endTime,
      durationMinutes,
      sessionType,
      date,
      notes
    } = req.body;

    const sessionDate = date || new Date().toISOString().slice(0, 10);
    const start = startTime ? new Date(startTime) : new Date(Date.now() - durationMinutes * 60000);
    const end = endTime ? new Date(endTime) : new Date();

    const session = await WorkSession.create({
      user: req.user.id,
      goal: goal || null,
      task: task || null,
      category: category || 'Problem Solving',
      startTime: start,
      endTime: end,
      durationMinutes: Number(durationMinutes),
      sessionType: sessionType || 'manual',
      date: sessionDate,
      notes: notes || ''
    });

    if (task) {
      await Task.findByIdAndUpdate(task, {
        $inc: { actualMinutes: Number(durationMinutes) }
      });
    }

    await syncDailyAnalytics(req.user.id, sessionDate);

    res.status(201).json({ success: true, session });
  } catch (err) {
    next(err);
  }
};

export const getWorkSessions = async (req, res, next) => {
  try {
    const { goal, startDate, endDate, date } = req.query;
    const query = { user: req.user.id };

    if (goal) query.goal = goal;
    if (date) query.date = date;
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    const sessions = await WorkSession.find(query)
      .populate('goal', 'title category')
      .populate('task', 'title')
      .sort({ startTime: -1 });

    const totalMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    const goalSpecificMinutes = sessions.filter(s => s.goal).reduce((sum, s) => sum + s.durationMinutes, 0);

    // Group by category
    const categoryBreakdown = {};
    sessions.forEach(s => {
      categoryBreakdown[s.category] = (categoryBreakdown[s.category] || 0) + s.durationMinutes;
    });

    res.json({
      success: true,
      count: sessions.length,
      summary: {
        totalHours: Number((totalMinutes / 60).toFixed(2)),
        goalSpecificHours: Number((goalSpecificMinutes / 60).toFixed(2)),
        averageSessionMinutes: sessions.length > 0 ? Math.round(totalMinutes / sessions.length) : 0,
        categoryBreakdown
      },
      sessions
    });
  } catch (err) {
    next(err);
  }
};

export const deleteWorkSession = async (req, res, next) => {
  try {
    const session = await WorkSession.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    await syncDailyAnalytics(req.user.id, session.date);

    res.json({ success: true, message: 'Session deleted.' });
  } catch (err) {
    next(err);
  }
};
