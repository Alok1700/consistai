import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import authRoutes from './routes/authRoutes.js';
import goalRoutes from './routes/goalRoutes.js';
import milestoneRoutes from './routes/milestoneRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import todoRoutes from './routes/todoRoutes.js';
import habitRoutes from './routes/habitRoutes.js';
import workSessionRoutes from './routes/workSessionRoutes.js';
import screenTimeRoutes from './routes/screenTimeRoutes.js';
import calendarRoutes from './routes/calendarRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import mlRoutes from './routes/mlRoutes.js';
import recommendationRoutes from './routes/recommendationRoutes.js';
import experimentRoutes from './routes/experimentRoutes.js';
import seedRoutes from './routes/seedRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import achievementRoutes from './routes/achievementRoutes.js';
import goalFolderRoutes from './routes/goalFolderRoutes.js';
import moduleRoutes from './routes/moduleRoutes.js';
import goalMilestoneRoutes from './routes/goalMilestoneRoutes.js';
import goalModuleRoutes from './routes/goalModuleRoutes.js';
import assistantRoutes from './routes/assistantRoutes.js';
import { startReminderScheduler } from './services/reminderScheduler.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/consistai_ml';

// Allowed origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

if (process.env.CLIENT_URL) {
  const clientUrl = process.env.CLIENT_URL.trim().replace(/\/+$/, '');
  allowedOrigins.push(clientUrl);
  if (!clientUrl.startsWith('http://') && !clientUrl.startsWith('https://')) {
    allowedOrigins.push(`https://${clientUrl}`);
    allowedOrigins.push(`http://${clientUrl}`);
  }
}

app.use(cors({
  origin: function (origin, callback) {
    if (
      !origin ||
      allowedOrigins.indexOf(origin) !== -1 ||
      process.env.NODE_ENV !== 'production' ||
      (typeof origin === 'string' && origin.endsWith('.onrender.com'))
    ) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Base health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'ConsistAI ML Backend Server',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/sessions', workSessionRoutes);
app.use('/api/screentime', screenTimeRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ml', mlRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/experiments', experimentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/folders', goalFolderRoutes);
app.use('/api/goal-folders', goalFolderRoutes); // Alias for unified goal-folders API
app.use('/api/goals/folders', goalFolderRoutes); // Alias for legacy goals/folders subpath
app.use('/api/modules', milestoneRoutes); // Unified Level 2 Module routes
app.use('/api/seed', seedRoutes);

app.use('/api/goal-milestones', goalMilestoneRoutes);
app.use('/api/goal-modules', goalModuleRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/reminders', assistantRoutes);
app.use('/api/journal', assistantRoutes);

// Serve built frontend if dist directory exists
const frontendDist = path.resolve(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Error Handler
app.use(errorHandler);

// Connect to MongoDB and start server
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log(`[ConsistAI MongoDB] Connected successfully to ${MONGODB_URI}`);
    app.listen(PORT, () => {
      console.log(`[ConsistAI Backend Server] Running on http://127.0.0.1:${PORT}`);
      // Launch continuous background reminder & overdue follow-up scheduler
      try {
        startReminderScheduler();
      } catch (err) {
        console.error('[ConsistAI Reminder Scheduler] Failed to initialize:', err.message);
      }
    });
  })
  .catch((err) => {
    console.error('[ConsistAI MongoDB] Connection failure:', err.message);
    process.exit(1);
  });
