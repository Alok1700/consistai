import WorkflowRecommendation from '../models/WorkflowRecommendation.js';

export const getRecommendations = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { user: req.user.id };
    if (status) query.status = status;

    const recommendations = await WorkflowRecommendation.find(query)
      .populate('linkedGoal', 'title category')
      .populate('linkedExperiment')
      .sort({ priority: -1, createdAt: -1 });

    res.json({
      success: true,
      count: recommendations.length,
      recommendations
    });
  } catch (err) {
    next(err);
  }
};

export const updateRecommendationStatus = async (req, res, next) => {
  try {
    const { status } = req.body; // 'active', 'dismissed', 'testing', 'completed'
    const rec = await WorkflowRecommendation.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { status },
      { new: true }
    );

    if (!rec) {
      return res.status(404).json({ success: false, message: 'Recommendation not found.' });
    }

    res.json({ success: true, recommendation: rec });
  } catch (err) {
    next(err);
  }
};
