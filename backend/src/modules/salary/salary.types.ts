import { z } from 'zod';
import {
  createSalaryStructureSchema,
  updateSalaryStructureSchema,
  createSalaryRuleSchema,
  updateSalaryRuleSchema,
  structureRuleInputSchema,
  salaryStructureQuerySchema,
  salaryRuleQuerySchema
} from './salary.schema.js';

export interface SalaryRule {
  id: string;
  name: string;
  code: string;
  category: 'BASIC' | 'ALLOWANCE' | 'GROSS' | 'DEDUCTION' | 'NET';
  calculation_type: 'FIXED' | 'PERCENTAGE' | 'FORMULA';
  fixed_amount: number | null;
  percentage: number | null;
  formula: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SequencedSalaryRule {
  id: string; // junction id
  salary_structure_id: string;
  salary_rule_id: string;
  sequence: number;
  created_at: string;
  rule: SalaryRule;
}

export interface SalaryStructure {
  id: string;
  company_id: string;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  rules?: SequencedSalaryRule[];
}

export type StructureRuleInput = z.infer<typeof structureRuleInputSchema>;
export type CreateSalaryStructureDto = z.infer<typeof createSalaryStructureSchema>;
export type UpdateSalaryStructureDto = z.infer<typeof updateSalaryStructureSchema>;
export type CreateSalaryRuleDto = z.infer<typeof createSalaryRuleSchema>;
export type UpdateSalaryRuleDto = z.infer<typeof updateSalaryRuleSchema>;
export type SalaryStructureQueryDto = z.infer<typeof salaryStructureQuerySchema>;
export type SalaryRuleQueryDto = z.infer<typeof salaryRuleQuerySchema>;
