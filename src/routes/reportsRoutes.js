import { Router } from 'express';
import {
  createReport,
  deleteReport,
  exportInventoryCsv,
  exportSalesCsv,
  getAnalyticsSummary,
  getProductPerformance,
  getReport,
  getRevenueTrend,
  getUserGrowth,
  listReports,
  updateReport
} from '../controllers/reportsController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../utils/roles.js';

const router = Router();

router.use(requireAuth, requireRole(ROLES.ADMIN));
router.get('/analytics/summary', getAnalyticsSummary);
router.get('/analytics/revenue-trend', getRevenueTrend);
router.get('/analytics/product-performance', getProductPerformance);
router.get('/analytics/user-growth', getUserGrowth);
router.get('/export/sales.csv', exportSalesCsv);
router.get('/export/inventory.csv', exportInventoryCsv);
router.get('/', listReports);
router.get('/:id', getReport);
router.post('/', createReport);
router.put('/:id', updateReport);
router.delete('/:id', deleteReport);

export default router;
