import { Router } from 'express';
import { payrollController } from './payroll.controller.js';
import { payslipsController } from '../payslips/payslips.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireAnyRole } from '../../middleware/rbac.js';
import { validateRequest } from '../../middleware/validate.js';
import {
  createPayrunSchema,
  payrunIdParamSchema,
  payrunQuerySchema,
  eligibleEmployeesQuerySchema
} from './payroll.schema.js';

const payrollRouter = Router();

payrollRouter.use(requireAuth());

// Wizard & Query endpoints (accessible to Payroll Users & Managers)
payrollRouter.get(
  '/',
  requireAnyRole('ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER'),
  validateRequest({ query: payrunQuerySchema }),
  payrollController.getAll
);

payrollRouter.get(
  '/eligible-employees',
  requireAnyRole('ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER'),
  validateRequest({ query: eligibleEmployeesQuerySchema }),
  payrollController.getEligibleEmployees
);

payrollRouter.get(
  '/:id',
  requireAnyRole('ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER'),
  validateRequest({ params: payrunIdParamSchema }),
  payrollController.getById
);

payrollRouter.get(
  '/:id/warnings',
  requireAnyRole('ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER'),
  validateRequest({ params: payrunIdParamSchema }),
  payrollController.getWarnings
);

// Execution Lifecycle endpoints (RESTRICTED TO ADMIN & HR_PAYROLL_MANAGER)
payrollRouter.post(
  '/',
  requireAnyRole('ADMIN', 'HR_PAYROLL_MANAGER'),
  validateRequest({ body: createPayrunSchema }),
  payrollController.create
);

payrollRouter.post(
  '/:id/compute',
  requireAnyRole('ADMIN', 'HR_PAYROLL_MANAGER'),
  validateRequest({ params: payrunIdParamSchema }),
  payrollController.compute
);

payrollRouter.post(
  '/:id/validate',
  requireAnyRole('ADMIN', 'HR_PAYROLL_MANAGER'),
  validateRequest({ params: payrunIdParamSchema }),
  payrollController.validate
);

payrollRouter.post(
  '/:id/mark-paid',
  requireAnyRole('ADMIN', 'HR_PAYROLL_MANAGER'),
  validateRequest({ params: payrunIdParamSchema }),
  payrollController.markPaid
);

payrollRouter.post(
  '/:id/cancel',
  requireAnyRole('ADMIN', 'HR_PAYROLL_MANAGER'),
  validateRequest({ params: payrunIdParamSchema }),
  payrollController.cancel
);

payrollRouter.post(
  '/:id/send-payslips',
  requireAnyRole('ADMIN', 'HR_PAYROLL_MANAGER'),
  validateRequest({ params: payrunIdParamSchema }),
  payslipsController.sendBulk
);

export { payrollRouter };
