import { z } from 'zod';

export const createPositionSchema = z.object({
  department_id: z.string().uuid('Invalid department ID').nullable().optional(),
  title: z.string().min(1, 'Job title is required'),
  code: z.string().min(1, 'Job position code is required'),
  description: z.string().nullable().optional()
});

export const updatePositionSchema = z.object({
  department_id: z.string().uuid('Invalid department ID').nullable().optional(),
  title: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  description: z.string().nullable().optional()
});

export const positionIdParamSchema = z.object({
  id: z.string().uuid('Invalid position ID format')
});

export const positionQuerySchema = z.object({
  department_id: z.string().uuid().optional(),
  search: z.string().optional()
});
