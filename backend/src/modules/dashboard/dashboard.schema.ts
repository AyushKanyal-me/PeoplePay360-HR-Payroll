import { z } from 'zod';

export const dashboardFilterSchema = z.object({
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  departmentId: z.string().uuid('Invalid UUID format').optional(),
  employeeType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']).optional(),
  companyId: z.string().uuid('Invalid UUID format').optional()
});

export const attendanceOverviewFilterSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  departmentId: z.string().uuid('Invalid UUID format').optional(),
  employeeType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']).optional(),
  companyId: z.string().uuid('Invalid UUID format').optional()
});

export type DashboardFilterDto = z.infer<typeof dashboardFilterSchema>;
export type AttendanceOverviewFilterDto = z.infer<typeof attendanceOverviewFilterSchema>;
