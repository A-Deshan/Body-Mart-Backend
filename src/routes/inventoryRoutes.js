import { Router } from 'express';
import { getStockHistory, listInventory, updateStock } from '../controllers/inventoryController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../utils/roles.js';

const router = Router();

router.use(requireAuth, requireRole(ROLES.ADMIN, ROLES.STOCK_MANAGER));
router.get('/', listInventory);
router.get('/history', getStockHistory);
router.patch('/:productId', updateStock);

export default router;
