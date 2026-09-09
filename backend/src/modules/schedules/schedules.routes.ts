import { Router } from 'express';
import { schedulesController } from './schedules.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireAnyRole } from '../../middleware/rbac.js';
import { validateRequest } from '../../middleware/validate.js';
import {
  createScheduleSchema,
  updateScheduleSchema,
  scheduleIdParamSchema,
  scheduleQuerySchema
} from './schedules.schema.js';

const schedulesRouter = Router();

schedulesRouter.use(requireAuth());

schedulesRouter.get(
  '/',
  validateRequest({ query: scheduleQuerySchema }),
  schedulesController.getAll
);

schedulesRouter.get(
  '/:id',
  validateRequest({ params: scheduleIdParamSchema }),
  schedulesController.getById
);

schedulesRouter.post(
  '/',
  requireAnyRole('ADMIN', 'HR_MANAGER'),
  validateRequest({ body: createScheduleSchema }),
  schedulesController.create
);

schedulesRouter.patch(
  '/:id',
  requireAnyRole('ADMIN', 'HR_MANAGER'),
  validateRequest({ params: scheduleIdParamSchema, body: updateScheduleSchema }),
  schedulesController.update
);

schedulesRouter.delete(
  '/:id',
  requireAnyRole('ADMIN', 'HR_MANAGER'),
  validateRequest({ params: scheduleIdParamSchema }),
  schedulesController.delete
);

export { schedulesRouter };
