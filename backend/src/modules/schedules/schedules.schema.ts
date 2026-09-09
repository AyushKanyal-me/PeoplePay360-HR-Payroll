import { z } from 'zod';

export const dayOfWeekEnum = z.enum([
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY'
]);

export const scheduleTypeEnum = z.enum(['FIXED', 'FLEXIBLE']);

export const scheduleDayInputSchema = z.object({
  day_of_week: dayOfWeekEnum,
  start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, 'Format must be HH:MM or HH:MM:SS'),
  end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, 'Format must be HH:MM or HH:MM:SS'),
  break_hours: z.number().min(0).default(1.0),
  total_hours: z.number().min(0)
});

export const createScheduleSchema = z.object({
  company_id: z.string().uuid('Invalid company ID'),
  name: z.string().min(1, 'Schedule name is required'),
  schedule_type: scheduleTypeEnum.default('FIXED'),
  days_per_week: z.number().int().min(1).max(7),
  hours_per_week: z.number().min(0.5).max(168),
  timezone: z.string().default('UTC'),
  is_active: z.boolean().default(true),
  days: z.array(scheduleDayInputSchema).optional()
});

export const updateScheduleSchema = z.object({
  name: z.string().min(1).optional(),
  schedule_type: scheduleTypeEnum.optional(),
  days_per_week: z.number().int().min(1).max(7).optional(),
  hours_per_week: z.number().min(0.5).max(168).optional(),
  timezone: z.string().optional(),
  is_active: z.boolean().optional(),
  days: z.array(scheduleDayInputSchema).optional()
});

export const scheduleIdParamSchema = z.object({
  id: z.string().uuid('Invalid schedule ID format')
});

export const scheduleQuerySchema = z.object({
  company_id: z.string().uuid().optional(),
  is_active: z.preprocess((val) => (val === 'true' ? true : val === 'false' ? false : val), z.boolean().optional())
});
