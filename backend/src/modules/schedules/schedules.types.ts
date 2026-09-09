import { z } from 'zod';
import {
  createScheduleSchema,
  updateScheduleSchema,
  scheduleQuerySchema,
  scheduleDayInputSchema
} from './schedules.schema.js';

export interface ScheduleDay {
  id: string;
  schedule_id: string;
  day_of_week: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  start_time: string;
  end_time: string;
  break_hours: number;
  total_hours: number;
  created_at: string;
}

export interface WorkingSchedule {
  id: string;
  company_id: string;
  name: string;
  schedule_type: 'FIXED' | 'FLEXIBLE';
  days_per_week: number;
  hours_per_week: number;
  timezone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  days?: ScheduleDay[];
}

export type ScheduleDayInput = z.infer<typeof scheduleDayInputSchema>;
export type CreateScheduleDto = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleDto = z.infer<typeof updateScheduleSchema>;
export type ScheduleQueryDto = z.infer<typeof scheduleQuerySchema>;
