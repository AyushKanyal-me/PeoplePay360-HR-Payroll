import { z } from 'zod';

export const payslipStatusEnum = z.enum(['GENERATED', 'SENT', 'FAILED']);
export const deliveryStatusEnum = z.enum(['PENDING', 'SENT', 'FAILED']);

export const payslipIdParamSchema = z.object({
  id: z.string().uuid('Invalid payslip ID format')
});

export const payslipQuerySchema = z.object({
  payrun_id: z.string().uuid().optional(),
  employee_id: z.string().uuid().optional(),
  status: payslipStatusEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const deliveryQuerySchema = z.object({
  payslip_id: z.string().uuid().optional(),
  status: deliveryStatusEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});
