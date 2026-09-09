import { z } from 'zod';
import { createPositionSchema, updatePositionSchema, positionQuerySchema } from './positions.schema.js';

export interface JobPosition {
  id: string;
  department_id: string | null;
  title: string;
  code: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  department?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

export type CreatePositionDto = z.infer<typeof createPositionSchema>;
export type UpdatePositionDto = z.infer<typeof updatePositionSchema>;
export type PositionQueryDto = z.infer<typeof positionQuerySchema>;
