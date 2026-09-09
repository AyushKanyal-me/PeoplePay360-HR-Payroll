import { z } from 'zod';

export const auditLogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  userId: z.string().uuid('Invalid UUID format').optional(),
  action: z.string().trim().min(1).optional(),
  table: z.string().trim().min(1).optional(),
  entityType: z.string().trim().min(1).optional(),
  entityId: z.string().uuid('Invalid UUID format').optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?Z?)?$/, 'Invalid date format (YYYY-MM-DD or ISO 8601)').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?Z?)?$/, 'Invalid date format (YYYY-MM-DD or ISO 8601)').optional()
});

export type AuditLogsQueryDto = z.infer<typeof auditLogsQuerySchema>;
