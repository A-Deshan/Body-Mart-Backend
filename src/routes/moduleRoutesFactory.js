import { Router } from 'express';
import { createModuleController } from '../controllers/genericControllerFactory.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ROLES } from '../utils/roles.js';

export function createModuleRoutes(moduleName, allowedRoles = Object.values(ROLES)) {
  const router = Router();
  const controller = createModuleController(moduleName);

  router.use(requireAuth, requireRole(...allowedRoles));
  router.get('/', controller.list);
  router.get('/:id', controller.detail);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.remove);

  return router;
}
