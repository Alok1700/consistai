import axios from 'axios';

const getMlUrl = () => {
  const raw = (process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000').trim().replace(/\/+$/, '');
  if (!raw.startsWith('http://') && !raw.startsWith('https://')) {
    return `https://${raw}`;
  }
  return raw;
};

const ML_SERVICE_URL = getMlUrl();
const ML_SERVICE_KEY = process.env.ML_SERVICE_SECRET || 'consistai_ml_secure_secret_2026';

const client = axios.create({
  baseURL: ML_SERVICE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'X-ML-Service-Key': ML_SERVICE_KEY
  }
});

export const mlClient = {
  async checkHealth() {
    try {
      const res = await client.get('/health');
      return res.data;
    } catch (err) {
      console.warn('ML Service offline or unreachable:', err.message);
      return { status: 'offline', error: err.message };
    }
  },

  async runClusters(records, nClusters = null) {
    try {
      const res = await client.post('/analysis/clusters', { records, n_clusters: nClusters });
      return res.data;
    } catch (err) {
      console.error('ML clusters error:', err.response?.data || err.message);
      throw new Error(`ML Cluster Analysis failed: ${err.response?.data?.detail || err.message}`);
    }
  },

  async runAnomalies(records, contamination = 0.1) {
    try {
      const res = await client.post('/analysis/anomalies', { records, contamination });
      return res.data;
    } catch (err) {
      console.error('ML anomalies error:', err.response?.data || err.message);
      throw new Error(`ML Anomaly Detection failed: ${err.response?.data?.detail || err.message}`);
    }
  },

  async runAssociations(records, minSupport = 0.12, minConfidence = 0.45, minLift = 1.05) {
    try {
      const res = await client.post('/analysis/associations', {
        records,
        min_support: minSupport,
        min_confidence: minConfidence,
        min_lift: minLift
      });
      return res.data;
    } catch (err) {
      console.error('ML associations error:', err.response?.data || err.message);
      throw new Error(`ML Association Mining failed: ${err.response?.data?.detail || err.message}`);
    }
  },

  async runCorrelations(records) {
    try {
      const res = await client.post('/analysis/correlations', { records });
      return res.data;
    } catch (err) {
      console.error('ML correlations error:', err.response?.data || err.message);
      throw new Error(`ML Correlation Analysis failed: ${err.response?.data?.detail || err.message}`);
    }
  },

  async runGoalProgress(goalPayload) {
    try {
      const res = await client.post('/analysis/goal-progress', goalPayload);
      return res.data;
    } catch (err) {
      console.error('ML goal progress error:', err.response?.data || err.message);
      throw new Error(`ML Goal Progress calculation failed: ${err.response?.data?.detail || err.message}`);
    }
  },

  async runRecommendations(records, goalPacingGap = null, activeGoalTitle = 'Primary Goal') {
    try {
      const res = await client.post('/analysis/recommendations', {
        records,
        goal_pacing_gap: goalPacingGap,
        active_goal_title: activeGoalTitle
      });
      return res.data;
    } catch (err) {
      console.error('ML recommendations error:', err.response?.data || err.message);
      throw new Error(`ML Recommendation Generation failed: ${err.response?.data?.detail || err.message}`);
    }
  },

  async getSyntheticData(days = 60, userId = 'demo_user', goalId = 'goal_1') {
    try {
      const res = await client.post('/analysis/generate-synthetic', { days, user_id: userId, goal_id: goalId });
      return res.data;
    } catch (err) {
      console.error('ML synthetic generator error:', err.response?.data || err.message);
      throw new Error(`Synthetic data generation failed: ${err.response?.data?.detail || err.message}`);
    }
  }
};
