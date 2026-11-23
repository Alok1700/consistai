import express from 'express';
import { getSystemModules, toggleModuleComplete } from '../controllers/moduleController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getSystemModules);
router.post('/:moduleNumber/toggle-complete', toggleModuleComplete);

export default router;

