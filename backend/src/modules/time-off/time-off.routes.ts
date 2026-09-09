import { Router } from 'express';
import { timeOffController } from './time-off.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireAnyRole } from '../../middleware/rbac.js';
import { validateRequest } from '../../middleware/validate.js';
import {
  createTimeOffTypeSchema,
  createTimeOffAllocationSchema,
  createTimeOffRequestSchema,
  requestIdParamSchema,
  refuseRequestSchema,
  timeOffRequestQuerySchema,
  allocationQuerySchema
} from './time-off.schema.js';

const timeOffRouter = Router();

timeOffRouter.use(requireAuth());

// Types
timeOffRouter.get('/types', timeOffController.getTypes);
timeOffRouter.post(
  '/types',
  requireAnyRole('ADMIN', 'HR_MANAGER'),
  validateRequest({ body: createTimeOffTypeSchema }),
  timeOffController.createType
);

// Allocations
timeOffRouter.get(
  '/allocations',
  validateRequest({ query: allocationQuerySchema }),
  timeOffController.getAllocations
);
timeOffRouter.post(
  '/allocations',
  requireAnyRole('ADMIN', 'HR_MANAGER'),
  validateRequest({ body: createTimeOffAllocationSchema }),
  timeOffController.createAllocation
);

// Requests
timeOffRouter.get(
  '/requests',
  validateRequest({ query: timeOffRequestQuerySchema }),
  timeOffController.getRequests
);

timeOffRouter.get(
  '/requests/:id',
  validateRequest({ params: requestIdParamSchema }),
  timeOffController.getRequestById
);

timeOffRouter.post(
  '/requests',
  validateRequest({ body: createTimeOffRequestSchema }),
  timeOffController.createRequest
);

timeOffRouter.post(
  '/requests/:id/approve',
  requireAnyRole('ADMIN', 'HR_MANAGER'),
  validateRequest({ params: requestIdParamSchema }),
  timeOffController.approve
);

timeOffRouter.post(
  '/requests/:id/refuse',
  requireAnyRole('ADMIN', 'HR_MANAGER'),
  validateRequest({ params: requestIdParamSchema, body: refuseRequestSchema }),
  timeOffController.refuse
);

timeOffRouter.post(
  '/requests/:id/cancel',
  validateRequest({ params: requestIdParamSchema }),
  timeOffController.cancel
);

export { timeOffRouter };
