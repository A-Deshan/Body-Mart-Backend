import { Router } from 'express';
import {
  createDelivery,
  deleteDelivery,
  getDelivery,
  listDeliveries,
  updateDelivery
} from '../controllers/deliveriesController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../utils/roles.js';

const router = Router();

router.use(requireAuth, requireRole(ROLES.ADMIN, ROLES.DELIVERY_PERSONNEL));
router.get('/', listDeliveries);
router.get('/:id', getDelivery);
router.post('/', createDelivery);
router.put('/:id', updateDelivery);
router.delete('/:id', deleteDelivery);

export default router;
