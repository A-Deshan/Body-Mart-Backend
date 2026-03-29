import { Router } from 'express';
import { loginStoreAccount, registerStoreAccount } from '../controllers/authController.js';
import {
  createStoreOrder,
  getStoreHighlights,
  listStoreMembershipPlans,
  listStoreProducts,
  purchaseMembership
} from '../controllers/storeController.js';
import { createWorkoutPlanRequest } from '../controllers/workoutPlansController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../utils/roles.js';

const router = Router();

router.post('/auth/login', loginStoreAccount);
router.post('/auth/register', registerStoreAccount);
router.get('/products', listStoreProducts);
router.get('/highlights', getStoreHighlights);
router.get('/memberships/plans', listStoreMembershipPlans);
router.post('/memberships', requireAuth, requireRole(ROLES.CUSTOMER), purchaseMembership);
router.post('/orders', requireAuth, requireRole(ROLES.CUSTOMER), createStoreOrder);
router.post('/workout-plans', createWorkoutPlanRequest);

export default router;
