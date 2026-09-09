import { z } from 'zod';

export const payrunStatusEnum = z.enum([
  'DRAFT',
  'COMPUTED',
  'VALIDATED',
  'PAID',
  'CANCELLED'
]);

export const createPayrunSchema = z.object({
  company_id: z.string().uuid('Invalid company ID'),
  salary_structure_id: z.string().uuid('Invalid salary structure ID'),
  name: z.string().min(1, 'Payrun batch name is required'),
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'period_start must be YYYY-MM-DD'),
  period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'period_end must be YYYY-MM-DD'),
  employee_ids: z.array(z.string().uuid('Invalid employee ID')).optional()
}).refine((data) => data.period_start <= data.period_end, {
  message: 'period_end must be greater than or equal to period_start',
  path: ['period_end']
});

export const payrunIdParamSchema = z.object({
  id: z.string().uuid('Invalid payrun ID format')
});

export const payrunQuerySchema = z.object({
  company_id: z.string().uuid().optional(),
  status: payrunStatusEnum.optional(),
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const eligibleEmployeesQuerySchema = z.object({
  salary_structure_id: z.string().uuid('Invalid salary structure ID'),
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});
