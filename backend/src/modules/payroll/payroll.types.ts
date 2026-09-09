import { z } from 'zod';
import {
  createPayrunSchema,
  payrunQuerySchema,
  eligibleEmployeesQuerySchema
} from './payroll.schema.js';
import { SalaryStructure } from '../salary/salary.types.js';

export interface Payrun {
  id: string;
  company_id: string;
  salary_structure_id: string;
  name: string;
  period_start: string;
  period_end: string;
  status: 'DRAFT' | 'COMPUTED' | 'VALIDATED' | 'PAID' | 'CANCELLED';
  total_employees: number;
  total_gross: number;
  total_deductions: number;
  total_net: number;
  computed_at: string | null;
  validated_at: string | null;
  paid_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  salary_structure?: SalaryStructure | null;
  employees_count?: number;
  warnings_count?: number;
}

export interface PayrunEmployee {
  id: string;
  payrun_id: string;
  employee_id: string;
  status: 'SELECTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  error_message: string | null;
  created_at: string;
  updated_at: string;
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
    work_email: string;
    bank_account_number: string | null;
  };
}

export interface PayrollWarning {
  id: string;
  payrun_id: string;
  payslip_id: string | null;
  employee_id: string | null;
  type: string;
  severity: 'INFO' | 'WARNING' | 'ERROR';
  message: string;
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
}

export type CreatePayrunDto = z.infer<typeof createPayrunSchema>;
export type PayrunQueryDto = z.infer<typeof payrunQuerySchema>;
export type EligibleEmployeesQueryDto = z.infer<typeof eligibleEmployeesQuerySchema>;
