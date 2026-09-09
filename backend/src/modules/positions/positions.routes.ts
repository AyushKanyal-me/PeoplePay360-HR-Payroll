import { Router } from 'express';
import { positionsController } from './positions.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireAnyRole } from '../../middleware/rbac.js';
import { validateRequest } from '../../middleware/validate.js';
import {
  createPositionSchema,
  updatePositionSchema,
  positionIdParamSchema,
  positionQuerySchema
} from './positions.schema.js';

const positionsRouter = Router();

positionsRouter.use(requireAuth());

positionsRouter.get(
  '/',
  validateRequest({ query: positionQuerySchema }),
  positionsController.getAll
);

positionsRouter.get(
  '/:id',
  validateRequest({ params: positionIdParamSchema }),
  positionsController.getById
);

positionsRouter.post(
  '/',
  requireAnyRole('ADMIN', 'HR_MANAGER'),
  validateRequest({ body: createPositionSchema }),
  positionsController.create
);

positionsRouter.patch(
  '/:id',
  requireAnyRole('ADMIN', 'HR_MANAGER'),
  validateRequest({ params: positionIdParamSchema, body: updatePositionSchema }),
  positionsController.update
);

positionsRouter.delete(
  '/:id',
  requireAnyRole('ADMIN', 'HR_MANAGER'),
  validateRequest({ params: positionIdParamSchema }),
  positionsController.delete
);

export { positionsRouter };
