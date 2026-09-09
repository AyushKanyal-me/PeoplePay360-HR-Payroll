import { Router } from 'express';
import { auditLogsController } from './audit-logs.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireAnyRole } from '../../middleware/rbac.js';
import { validateRequest } from '../../middleware/validate.js';
import { auditLogsQuerySchema } from './audit-logs.schema.js';

const router = Router();

// Only ADMIN can access audit logs
router.use(requireAuth());
router.use(requireAnyRole('ADMIN'));

/**
 * GET /api/v1/audit-logs
 */
router.get(
  '/',
  validateRequest({ query: auditLogsQuerySchema }),
  auditLogsController.getAll
);

export { router as auditLogsRouter };
