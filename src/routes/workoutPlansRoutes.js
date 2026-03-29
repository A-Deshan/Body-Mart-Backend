import { Router } from 'express';
import { listWorkoutPlanRequests, updateWorkoutPlanRequest } from '../controllers/workoutPlansController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../utils/roles.js';

const router = Router();

router.use(requireAuth, requireRole(ROLES.ADMIN));
router.get('/', listWorkoutPlanRequests);
router.put('/:id', updateWorkoutPlanRequest);

export default router;
