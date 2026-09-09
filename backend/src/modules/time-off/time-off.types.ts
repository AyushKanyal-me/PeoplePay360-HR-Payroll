import { z } from 'zod';
import {
  createTimeOffTypeSchema,
  createTimeOffAllocationSchema,
  createTimeOffRequestSchema,
  timeOffRequestQuerySchema,
  allocationQuerySchema,
  refuseRequestSchema
} from './time-off.schema.js';

export interface TimeOffType {
  id: string;
  company_id: string;
  name: string;
  code: string;
  unit: 'DAYS' | 'HOURS';
  requires_allocation: boolean;
  is_paid: boolean;
  created_at: string;
  updated_at: string;
}

export interface TimeOffAllocation {
  id: string;
  employee_id: string;
  time_off_type_id: string;
  year: number;
  allocated_amount: number;
  used_amount: number;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  created_at: string;
  updated_at: string;
  employee?: { id: string; first_name: string; last_name: string; work_email: string } | null;
  time_off_type?: { id: string; name: string; code: string; unit: string } | null;
}

export interface TimeOffRequest {
  id: string;
  employee_id: string;
  time_off_type_id: string;
  allocation_id: string | null;
  start_date: string;
  end_date: string;
  duration: number;
  reason: string | null;
  status: 'PENDING' | 'APPROVED' | 'REFUSED' | 'CANCELLED';
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  employee?: { id: string; first_name: string; last_name: string; work_email: string } | null;
  time_off_type?: { id: string; name: string; code: string; unit: string } | null;
  approver?: { id: string; first_name: string; last_name: string; email: string } | null;
}

export type CreateTimeOffTypeDto = z.infer<typeof createTimeOffTypeSchema>;
export type CreateTimeOffAllocationDto = z.infer<typeof createTimeOffAllocationSchema>;
export type CreateTimeOffRequestDto = z.infer<typeof createTimeOffRequestSchema>;
export type RefuseRequestDto = z.infer<typeof refuseRequestSchema>;
export type TimeOffRequestQueryDto = z.infer<typeof timeOffRequestQuerySchema>;
export type AllocationQueryDto = z.infer<typeof allocationQuerySchema>;
