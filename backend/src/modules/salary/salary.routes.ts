import { Router } from 'express';
import { salaryController } from './salary.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireAnyRole } from '../../middleware/rbac.js';
import { validateRequest } from '../../middleware/validate.js';
import {
  createSalaryStructureSchema,
  updateSalaryStructureSchema,
  structureIdParamSchema,
  salaryStructureQuerySchema,
  createSalaryRuleSchema,
  updateSalaryRuleSchema,
  ruleIdParamSchema,
  salaryRuleQuerySchema
} from './salary.schema.js';

// 1. Structure Router (/api/v1/salary-structures)
const salaryStructuresRouter = Router();
salaryStructuresRouter.use(requireAuth());

salaryStructuresRouter.get(
  '/',
  validateRequest({ query: salaryStructureQuerySchema }),
  salaryController.getAllStructures
);

salaryStructuresRouter.get(
  '/:id',
  validateRequest({ params: structureIdParamSchema }),
  salaryController.getStructureById
);

salaryStructuresRouter.post(
  '/',
  requireAnyRole('ADMIN', 'HR_PAYROLL_MANAGER'),
  validateRequest({ body: createSalaryStructureSchema }),
  salaryController.createStructure
);

salaryStructuresRouter.patch(
  '/:id',
  requireAnyRole('ADMIN', 'HR_PAYROLL_MANAGER'),
  validateRequest({ params: structureIdParamSchema, body: updateSalaryStructureSchema }),
  salaryController.updateStructure
);

// 2. Rules Router (/api/v1/salary-rules)
const salaryRulesRouter = Router();
salaryRulesRouter.use(requireAuth());

salaryRulesRouter.get(
  '/',
  validateRequest({ query: salaryRuleQuerySchema }),
  salaryController.getAllRules
);

salaryRulesRouter.get(
  '/:id',
  validateRequest({ params: ruleIdParamSchema }),
  salaryController.getRuleById
);

salaryRulesRouter.post(
  '/',
  requireAnyRole('ADMIN', 'HR_PAYROLL_MANAGER'),
  validateRequest({ body: createSalaryRuleSchema }),
  salaryController.createRule
);

salaryRulesRouter.patch(
  '/:id',
  requireAnyRole('ADMIN', 'HR_PAYROLL_MANAGER'),
  validateRequest({ params: ruleIdParamSchema, body: updateSalaryRuleSchema }),
  salaryController.updateRule
);

export { salaryStructuresRouter, salaryRulesRouter };
