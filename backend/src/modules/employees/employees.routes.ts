import { Router } from 'express';
import { employeesController } from './employees.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireAnyRole, requireEmployeeOrRole } from '../../middleware/rbac.js';
import { validateRequest } from '../../middleware/validate.js';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  employeeIdParamSchema,
  employeeQuerySchema
} from './employees.schema.js';

const employeesRouter = Router();

employeesRouter.use(requireAuth());

employeesRouter.get(
  '/',
  requireAnyRole('ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER'),
  validateRequest({ query: employeeQuerySchema }),
  employeesController.getAll
);

employeesRouter.get(
  '/:id',
  requireEmployeeOrRole('id', 'HR_MANAGER', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER'),
  validateRequest({ params: employeeIdParamSchema }),
  employeesController.getById
);

employeesRouter.get(
  '/:id/smart-counts',
  requireEmployeeOrRole('id', 'HR_MANAGER', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER'),
  validateRequest({ params: employeeIdParamSchema }),
  employeesController.getSmartCounts
);

employeesRouter.post(
  '/',
  requireAnyRole('ADMIN', 'HR_MANAGER'),
  validateRequest({ body: createEmployeeSchema }),
  employeesController.create
);

employeesRouter.patch(
  '/:id',
  requireAnyRole('ADMIN', 'HR_MANAGER'),
  validateRequest({ params: employeeIdParamSchema, body: updateEmployeeSchema }),
  employeesController.update
);

employeesRouter.delete(
  '/:id',
  requireAnyRole('ADMIN', 'HR_MANAGER'),
  validateRequest({ params: employeeIdParamSchema }),
  employeesController.delete
);

export { employeesRouter };
