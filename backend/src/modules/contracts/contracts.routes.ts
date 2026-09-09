import { Router } from 'express';
import { contractsController } from './contracts.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireAnyRole } from '../../middleware/rbac.js';
import { validateRequest } from '../../middleware/validate.js';
import {
  createContractSchema,
  updateContractSchema,
  contractIdParamSchema,
  contractQuerySchema
} from './contracts.schema.js';

const contractsRouter = Router();

contractsRouter.use(requireAuth());

contractsRouter.get(
  '/',
  validateRequest({ query: contractQuerySchema }),
  contractsController.getAll
);

contractsRouter.get(
  '/:id',
  validateRequest({ params: contractIdParamSchema }),
  contractsController.getById
);

contractsRouter.post(
  '/',
  requireAnyRole('ADMIN', 'HR_MANAGER'),
  validateRequest({ body: createContractSchema }),
  contractsController.create
);

contractsRouter.patch(
  '/:id',
  requireAnyRole('ADMIN', 'HR_MANAGER'),
  validateRequest({ params: contractIdParamSchema, body: updateContractSchema }),
  contractsController.update
);

contractsRouter.post(
  '/:id/close',
  requireAnyRole('ADMIN', 'HR_MANAGER'),
  validateRequest({ params: contractIdParamSchema }),
  contractsController.close
);

export { contractsRouter };
