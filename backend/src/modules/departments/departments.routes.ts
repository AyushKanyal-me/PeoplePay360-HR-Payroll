import { Router } from 'express';
import { departmentsController } from './departments.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireAnyRole } from '../../middleware/rbac.js';
import { validateRequest } from '../../middleware/validate.js';
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  departmentIdParamSchema,
  departmentQuerySchema
} from './departments.schema.js';

const departmentsRouter = Router();

departmentsRouter.use(requireAuth());

departmentsRouter.get(
  '/',
  validateRequest({ query: departmentQuerySchema }),
  departmentsController.getAll
);

departmentsRouter.get(
  '/:id',
  validateRequest({ params: departmentIdParamSchema }),
  departmentsController.getById
);

departmentsRouter.post(
  '/',
  requireAnyRole('ADMIN', 'HR_MANAGER'),
  validateRequest({ body: createDepartmentSchema }),
  departmentsController.create
);

departmentsRouter.patch(
  '/:id',
  requireAnyRole('ADMIN', 'HR_MANAGER'),
  validateRequest({ params: departmentIdParamSchema, body: updateDepartmentSchema }),
  departmentsController.update
);

departmentsRouter.delete(
  '/:id',
  requireAnyRole('ADMIN', 'HR_MANAGER'),
  validateRequest({ params: departmentIdParamSchema }),
  departmentsController.delete
);

export { departmentsRouter };
