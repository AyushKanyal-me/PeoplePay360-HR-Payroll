import { z } from 'zod';

export const timeOffUnitEnum = z.enum(['DAYS', 'HOURS']);
export const allocationStatusEnum = z.enum(['ACTIVE', 'EXPIRED', 'CANCELLED']);
export const timeOffRequestStatusEnum = z.enum(['PENDING', 'APPROVED', 'REFUSED', 'CANCELLED']);

// Leave Types
export const createTimeOffTypeSchema = z.object({
  company_id: z.string().uuid('Invalid company ID'),
  name: z.string().min(1, 'Type name is required'),
  code: z.string().min(1, 'Type code is required'),
  unit: timeOffUnitEnum.default('DAYS'),
  requires_allocation: z.boolean().default(true),
  is_paid: z.boolean().default(true)
});

// Leave Allocations
export const createTimeOffAllocationSchema = z.object({
  employee_id: z.string().uuid('Invalid employee ID'),
  time_off_type_id: z.string().uuid('Invalid time off type ID'),
  year: z.number().int().min(2000).max(2100).default(new Date().getFullYear()),
  allocated_amount: z.number().min(0, 'Allocated amount must be positive'),
  status: allocationStatusEnum.default('ACTIVE')
});

// Leave Requests
export const createTimeOffRequestSchema = z.object({
  employee_id: z.string().uuid('Invalid employee ID').optional(), // optional when submitted by self
  time_off_type_id: z.string().uuid('Invalid time off type ID'),
  allocation_id: z.string().uuid('Invalid allocation ID').nullable().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'start_date must be YYYY-MM-DD'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'end_date must be YYYY-MM-DD'),
  duration: z.number().min(0.5, 'Duration must be at least 0.5'),
  reason: z.string().nullable().optional()
}).refine((data) => data.start_date <= data.end_date, {
  message: 'end_date must be greater than or equal to start_date',
  path: ['end_date']
});

export const requestIdParamSchema = z.object({
  id: z.string().uuid('Invalid request ID format')
});

export const refuseRequestSchema = z.object({
  rejection_reason: z.string().min(1, 'Rejection reason is required')
});

export const timeOffRequestQuerySchema = z.object({
  employee_id: z.string().uuid().optional(),
  time_off_type_id: z.string().uuid().optional(),
  status: timeOffRequestStatusEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const allocationQuerySchema = z.object({
  employee_id: z.string().uuid().optional(),
  time_off_type_id: z.string().uuid().optional(),
  year: z.coerce.number().int().optional()
});
