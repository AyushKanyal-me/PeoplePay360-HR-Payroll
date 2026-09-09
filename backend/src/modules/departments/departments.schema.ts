import { z } from 'zod';

export const createDepartmentSchema = z.object({
  company_id: z.string().uuid('Invalid company ID'),
  name: z.string().min(1, 'Department name is required'),
  code: z.string().min(1, 'Department code is required'),
  parent_department_id: z.string().uuid().nullable().optional(),
  manager_id: z.string().uuid().nullable().optional()
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  parent_department_id: z.string().uuid().nullable().optional(),
  manager_id: z.string().uuid().nullable().optional()
});

export const departmentIdParamSchema = z.object({
  id: z.string().uuid('Invalid department ID format')
});

export const departmentQuerySchema = z.object({
  company_id: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});
