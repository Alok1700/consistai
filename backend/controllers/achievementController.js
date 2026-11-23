import Achievement from '../models/Achievement.js';

export const getGoalAchievements = async (req, res, next) => {
  try {
    const achievements = await Achievement.find({
      user: req.user.id,
      goal: req.params.goalId
    }).sort({ earnedAt: -1 });

    res.json({
      success: true,
      count: achievements.length,
      achievements
    });
  } catch (err) {
    next(err);
  }
};

export const getLatestAchievements = async (req, res, next) => {
  try {
    const { uncelebratedOnly } = req.query;
    const query = { user: req.user.id };
    if (uncelebratedOnly === 'true') {
      query.celebrated = false;
    }

    const achievements = await Achievement.find(query)
      .populate('goal', 'title category icon')
      .sort({ earnedAt: -1 })
      .limit(10);

    res.json({
      success: true,
      count: achievements.length,
      achievements
    });
  } catch (err) {
    next(err);
  }
};

export const markAchievementCelebrated = async (req, res, next) => {
  try {
    const achievement = await Achievement.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { celebrated: true },
      { new: true }
    );

    if (!achievement) {
      return res.status(404).json({ success: false, message: 'Achievement not found.' });
    }

    res.json({ success: true, achievement });
  } catch (err) {
    next(err);
  }
};
