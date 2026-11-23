import express from 'express';
import {
  getOverviewStats,
  getConsistencyAnalytics,
  getTimeFocusAnalytics,
  getGoalPortfolioAnalytics,
  getScreenTimeAnalytics,
  getDayPerformanceDetail,
  getMonthlyReport,
  saveMonthlyReflection,
  recordInsightFeedback,
  exportAnalyticsData
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/overview', getOverviewStats);
router.get('/consistency', getConsistencyAnalytics);
router.get('/time-focus', getTimeFocusAnalytics);
router.get('/goals', getGoalPortfolioAnalytics);
router.get('/screen-time', getScreenTimeAnalytics);
router.get('/day/:date', getDayPerformanceDetail);
router.get('/monthly-report', getMonthlyReport);
router.post('/monthly-reflection', saveMonthlyReflection);
router.post('/insights/:id/feedback', recordInsightFeedback);
router.get('/export', exportAnalyticsData);

export default router;
