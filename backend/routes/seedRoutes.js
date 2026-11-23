import express from 'express';
import { seedDemoUserData } from '../controllers/seedController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/demo-data', seedDemoUserData);

export default router;
