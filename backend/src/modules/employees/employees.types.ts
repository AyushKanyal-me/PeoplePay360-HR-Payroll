import { z } from 'zod';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  employeeQuerySchema
} from './employees.schema.js';

export interface Employee {
  id: string;
  company_id: string;
  department_id: string | null;
  job_position_id: string | null;
  manager_id: string | null;
  schedule_id: string | null;
  first_name: string;
  last_name: string;
  work_email: string;
  personal_email: string | null;
  phone: string | null;
  hire_date: string;
  employment_type: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
  status: 'ACTIVE' | 'INACTIVE' | 'TERMINATED';
  bank_account_number: string | null;
  bank_name: string | null;
  bank_ifsc: string | null;
  pan_number: string | null;
  aadhaar_number: string | null;
  created_at: string;
  updated_at: string;
  department?: { id: string; name: string; code: string } | null;
  job_position?: { id: string; title: string; code: string } | null;
  manager?: { id: string; first_name: string; last_name: string; work_email: string } | null;
  schedule?: { id: string; name: string; hours_per_week: number } | null;
}

export interface EmployeeSmartCounts {
  employee_id: string;
  contracts_count: number;
  attendance_count: number;
  time_off_requests_count: number;
  payslips_count: number;
}

export type CreateEmployeeDto = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeDto = z.infer<typeof updateEmployeeSchema>;
export type EmployeeQueryDto = z.infer<typeof employeeQuerySchema>;
