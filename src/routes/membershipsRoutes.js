import { Router } from 'express';
import {
  createMembershipPlan,
  createMembership,
  deleteMembershipPlan,
  deleteMembership,
  getMembership,
  listMembershipPlans,
  listMemberships,
  updateMembershipPlan,
  updateMembership
} from '../controllers/membershipsController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../utils/roles.js';

const router = Router();

router.use(requireAuth, requireRole(ROLES.ADMIN));
router.get('/plans', listMembershipPlans);
router.post('/plans', createMembershipPlan);
router.put('/plans/:id', updateMembershipPlan);
router.delete('/plans/:id', deleteMembershipPlan);
router.get('/', listMemberships);
router.get('/:id', getMembership);
router.post('/', createMembership);
router.put('/:id', updateMembership);
router.delete('/:id', deleteMembership);

export default router;
