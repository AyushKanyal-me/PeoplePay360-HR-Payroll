import { Router } from 'express';
import { companiesController } from './companies.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { validateRequest } from '../../middleware/validate.js';
import { updateCompanySchema, companyIdParamSchema } from './companies.schema.js';

const companiesRouter = Router();

companiesRouter.use(requireAuth());

companiesRouter.get('/', companiesController.getAll);

companiesRouter.patch(
  '/:id',
  requireRole('ADMIN'),
  validateRequest({ params: companyIdParamSchema, body: updateCompanySchema }),
  companiesController.update
);

export { companiesRouter };
