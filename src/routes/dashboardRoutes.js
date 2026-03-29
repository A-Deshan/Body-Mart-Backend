import { Router } from 'express';
import { getOverview } from '../controllers/dashboardController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/overview', requireAuth, getOverview);

export default router;
