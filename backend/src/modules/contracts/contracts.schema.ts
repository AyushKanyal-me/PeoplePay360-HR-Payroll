import { z } from 'zod';
import { employeeTypeEnum } from '../employees/employees.schema.js';

export const contractStatusEnum = z.enum(['DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED']);

export const createContractSchema = z.object({
  employee_id: z.string().uuid('Invalid employee ID'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'start_date must be YYYY-MM-DD'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'end_date must be YYYY-MM-DD').nullable().optional(),
  department_id: z.string().uuid('Invalid department ID').nullable().optional(),
  job_position_id: z.string().uuid('Invalid job position ID').nullable().optional(),
  schedule_id: z.string().uuid('Invalid schedule ID').nullable().optional(),
  salary_structure_id: z.string().uuid('Invalid salary structure ID').nullable().optional(),
  wage: z.number().min(0, 'Wage must be a positive amount'),
  currency: z.string().default('INR'),
  employment_type: employeeTypeEnum.default('FULL_TIME'),
  status: contractStatusEnum.default('DRAFT')
}).refine(
  (data) => {
    if (data.end_date && data.start_date > data.end_date) {
      return false;
    }
    return true;
  },
  {
    message: 'Contract end_date must be greater than or equal to start_date',
    path: ['end_date']
  }
);

export const updateContractSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  department_id: z.string().uuid().nullable().optional(),
  job_position_id: z.string().uuid().nullable().optional(),
  schedule_id: z.string().uuid().nullable().optional(),
  salary_structure_id: z.string().uuid().nullable().optional(),
  wage: z.number().min(0).optional(),
  currency: z.string().optional(),
  employment_type: employeeTypeEnum.optional(),
  status: contractStatusEnum.optional()
});

export const contractIdParamSchema = z.object({
  id: z.string().uuid('Invalid contract ID format')
});

export const contractQuerySchema = z.object({
  employee_id: z.string().uuid().optional(),
  department_id: z.string().uuid().optional(),
  status: contractStatusEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});
