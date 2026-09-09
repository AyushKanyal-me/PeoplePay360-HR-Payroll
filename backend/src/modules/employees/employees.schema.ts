import { z } from 'zod';

export const employeeStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'TERMINATED']);
export const employeeTypeEnum = z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']);

export const createEmployeeSchema = z.object({
  company_id: z.string().uuid('Invalid company ID'),
  department_id: z.string().uuid('Invalid department ID').nullable().optional(),
  job_position_id: z.string().uuid('Invalid job position ID').nullable().optional(),
  manager_id: z.string().uuid('Invalid manager ID').nullable().optional(),
  schedule_id: z.string().uuid('Invalid schedule ID').nullable().optional(),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  work_email: z.string().email('Valid work email is required'),
  personal_email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  hire_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'hire_date must be YYYY-MM-DD'),
  employment_type: employeeTypeEnum.default('FULL_TIME'),
  status: employeeStatusEnum.default('ACTIVE'),
  bank_account_number: z.string().nullable().optional(),
  bank_name: z.string().nullable().optional(),
  bank_ifsc: z.string().nullable().optional(),
  pan_number: z.string().nullable().optional(),
  aadhaar_number: z.string().nullable().optional()
});

export const updateEmployeeSchema = z.object({
  department_id: z.string().uuid('Invalid department ID').nullable().optional(),
  job_position_id: z.string().uuid('Invalid job position ID').nullable().optional(),
  manager_id: z.string().uuid('Invalid manager ID').nullable().optional(),
  schedule_id: z.string().uuid('Invalid schedule ID').nullable().optional(),
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  work_email: z.string().email().optional(),
  personal_email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  hire_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  employment_type: employeeTypeEnum.optional(),
  status: employeeStatusEnum.optional(),
  bank_account_number: z.string().nullable().optional(),
  bank_name: z.string().nullable().optional(),
  bank_ifsc: z.string().nullable().optional(),
  pan_number: z.string().nullable().optional(),
  aadhaar_number: z.string().nullable().optional()
});

export const employeeIdParamSchema = z.object({
  id: z.string().uuid('Invalid employee ID format')
});

export const employeeQuerySchema = z.object({
  department_id: z.string().uuid().optional(),
  status: employeeStatusEnum.optional(),
  company_id: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});
