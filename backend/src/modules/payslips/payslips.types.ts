import { z } from 'zod';
import { payslipQuerySchema, deliveryQuerySchema } from './payslips.schema.js';

export interface PayslipItem {
  id: string;
  payslip_id: string;
  salary_rule_id: string | null;
  name: string;
  code: string;
  category: 'BASIC' | 'ALLOWANCE' | 'GROSS' | 'DEDUCTION' | 'NET';
  sequence: number;
  amount: number;
  calculation_snapshot: Record<string, unknown> | null;
}

export interface PayslipDetailed {
  id: string;
  payrun_id: string;
  employee_id: string;
  contract_id: string | null;
  salary_structure_id: string;
  period_start: string;
  period_end: string;
  worked_days: number | null;
  worked_hours: number | null;
  gross_salary: number;
  total_deductions: number;
  net_salary: number;
  status: 'GENERATED' | 'SENT' | 'FAILED';
  pdf_path: string | null;
  generated_at: string | null;
  created_at: string;
  updated_at: string;
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
    work_email: string;
    bank_account_number: string | null;
    company_id: string;
    department?: { id: string; name: string } | null;
    job_position?: { id: string; title: string } | null;
  };
  payrun?: {
    id: string;
    name: string;
    status: string;
    company?: { id: string; name: string; currency: string; tax_id: string | null };
  };
  items?: PayslipItem[];
}

export interface PayslipDeliveryRecord {
  id: string;
  payslip_id: string;
  email: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
  payslip?: {
    id: string;
    period_start: string;
    period_end: string;
    net_salary: number;
    employee?: { first_name: string; last_name: string; work_email: string };
  };
}

export type PayslipQueryDto = z.infer<typeof payslipQuerySchema>;
export type DeliveryQueryDto = z.infer<typeof deliveryQuerySchema>;
