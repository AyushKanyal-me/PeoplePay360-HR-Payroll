import { z } from 'zod';
import { SafeFormulaEvaluator } from './salary.evaluator.js';

export const salaryRuleCategoryEnum = z.enum([
  'BASIC',
  'ALLOWANCE',
  'GROSS',
  'DEDUCTION',
  'NET'
]);

export const calculationTypeEnum = z.enum(['FIXED', 'PERCENTAGE', 'FORMULA']);

export const structureRuleInputSchema = z.object({
  salary_rule_id: z.string().uuid('Invalid salary rule ID'),
  sequence: z.number().int().min(1, 'Sequence must be at least 1')
});

// Salary Structures
export const createSalaryStructureSchema = z.object({
  company_id: z.string().uuid('Invalid company ID'),
  name: z.string().min(1, 'Structure name is required'),
  code: z.string().min(1, 'Structure code is required'),
  description: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
  rules: z.array(structureRuleInputSchema).optional()
}).refine(
  (data) => {
    if (data.rules && data.rules.length > 0) {
      const sequences = data.rules.map((r) => r.sequence);
      const uniqueSequences = new Set(sequences);
      if (sequences.length !== uniqueSequences.size) return false;

      const ruleIds = data.rules.map((r) => r.salary_rule_id);
      const uniqueRuleIds = new Set(ruleIds);
      if (ruleIds.length !== uniqueRuleIds.size) return false;
    }
    return true;
  },
  {
    message: 'Rules within a salary structure cannot have duplicate sequences or duplicate rules',
    path: ['rules']
  }
);

export const updateSalaryStructureSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  rules: z.array(structureRuleInputSchema).optional()
}).refine(
  (data) => {
    if (data.rules && data.rules.length > 0) {
      const sequences = data.rules.map((r) => r.sequence);
      const uniqueSequences = new Set(sequences);
      if (sequences.length !== uniqueSequences.size) return false;

      const ruleIds = data.rules.map((r) => r.salary_rule_id);
      const uniqueRuleIds = new Set(ruleIds);
      if (ruleIds.length !== uniqueRuleIds.size) return false;
    }
    return true;
  },
  {
    message: 'Rules within a salary structure cannot have duplicate sequences or duplicate rules',
    path: ['rules']
  }
);

export const structureIdParamSchema = z.object({
  id: z.string().uuid('Invalid salary structure ID format')
});

// Salary Rules
export const createSalaryRuleSchema = z.object({
  name: z.string().min(1, 'Rule name is required'),
  code: z.string().min(1, 'Rule code is required').regex(/^[A-Z0-9_]+$/, 'Rule code must be uppercase alphanumeric (e.g. BASIC, HRA)'),
  category: salaryRuleCategoryEnum,
  calculation_type: calculationTypeEnum.default('FIXED'),
  fixed_amount: z.number().min(0).nullable().optional(),
  percentage: z.number().min(0).max(100).nullable().optional(),
  formula: z.string().nullable().optional(),
  is_active: z.boolean().default(true)
}).refine(
  (data) => {
    if (data.calculation_type === 'FIXED' && (data.fixed_amount === undefined || data.fixed_amount === null)) {
      return false;
    }
    if (data.calculation_type === 'PERCENTAGE' && (data.percentage === undefined || data.percentage === null)) {
      return false;
    }
    if (data.calculation_type === 'FORMULA') {
      if (!data.formula || data.formula.trim() === '') return false;
      return SafeFormulaEvaluator.validateFormulaSyntax(data.formula);
    }
    return true;
  },
  {
    message: 'Calculation parameters must match calculation_type (FIXED requires fixed_amount, PERCENTAGE requires percentage, FORMULA requires valid arithmetic formula)',
    path: ['calculation_type']
  }
);

export const updateSalaryRuleSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().regex(/^[A-Z0-9_]+$/).optional(),
  category: salaryRuleCategoryEnum.optional(),
  calculation_type: calculationTypeEnum.optional(),
  fixed_amount: z.number().min(0).nullable().optional(),
  percentage: z.number().min(0).max(100).nullable().optional(),
  formula: z.string().nullable().optional(),
  is_active: z.boolean().optional()
});

export const ruleIdParamSchema = z.object({
  id: z.string().uuid('Invalid salary rule ID format')
});

export const salaryStructureQuerySchema = z.object({
  company_id: z.string().uuid().optional(),
  is_active: z.preprocess((val) => (val === 'true' ? true : val === 'false' ? false : val), z.boolean().optional())
});

export const salaryRuleQuerySchema = z.object({
  category: salaryRuleCategoryEnum.optional(),
  calculation_type: calculationTypeEnum.optional(),
  is_active: z.preprocess((val) => (val === 'true' ? true : val === 'false' ? false : val), z.boolean().optional())
});
