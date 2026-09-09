import { Router } from 'express';
import { payslipsController } from './payslips.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireAnyRole } from '../../middleware/rbac.js';
import { validateRequest } from '../../middleware/validate.js';
import {
  payslipIdParamSchema,
  payslipQuerySchema,
  deliveryQuerySchema
} from './payslips.schema.js';

// 1. Payslips Router (/api/v1/payslips)
const payslipsRouter = Router();
payslipsRouter.use(requireAuth());

payslipsRouter.get(
  '/',
  validateRequest({ query: payslipQuerySchema }),
  payslipsController.getAll
);

payslipsRouter.get(
  '/:id',
  validateRequest({ params: payslipIdParamSchema }),
  payslipsController.getById
);

payslipsRouter.get(
  '/:id/pdf',
  validateRequest({ params: payslipIdParamSchema }),
  payslipsController.downloadPdf
);

payslipsRouter.post(
  '/:id/send-email',
  requireAnyRole('ADMIN', 'HR_PAYROLL_MANAGER'),
  validateRequest({ params: payslipIdParamSchema }),
  payslipsController.sendEmail
);

// 2. Deliveries Router (/api/v1/payslip-deliveries)
const payslipDeliveriesRouter = Router();
payslipDeliveriesRouter.use(requireAuth());

payslipDeliveriesRouter.get(
  '/',
  requireAnyRole('ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER'),
  validateRequest({ query: deliveryQuerySchema }),
  payslipsController.getDeliveries
);

export { payslipsRouter, payslipDeliveriesRouter };
