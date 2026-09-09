import { Router } from 'express';
import { attendanceController } from './attendance.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireAnyRole } from '../../middleware/rbac.js';
import { validateRequest } from '../../middleware/validate.js';
import {
  createManualAttendanceSchema,
  updateAttendanceSchema,
  attendanceIdParamSchema,
  attendanceQuerySchema
} from './attendance.schema.js';

const attendanceRouter = Router();

attendanceRouter.use(requireAuth());

// Global listing (scoped for employees, broad for HR)
attendanceRouter.get(
  '/',
  validateRequest({ query: attendanceQuerySchema }),
  attendanceController.getAll
);

// Quick widget endpoints (Self action for authenticated employee)
attendanceRouter.get('/quick-status', attendanceController.getQuickStatus);
attendanceRouter.post('/check-in', attendanceController.checkIn);
attendanceRouter.post('/check-out', attendanceController.checkOut);

// Manual management (restricted to HR & Admin)
attendanceRouter.post(
  '/',
  requireAnyRole('ADMIN', 'HR_MANAGER'),
  validateRequest({ body: createManualAttendanceSchema }),
  attendanceController.createManual
);

attendanceRouter.patch(
  '/:id',
  requireAnyRole('ADMIN', 'HR_MANAGER'),
  validateRequest({ params: attendanceIdParamSchema, body: updateAttendanceSchema }),
  attendanceController.update
);

attendanceRouter.delete(
  '/:id',
  requireAnyRole('ADMIN', 'HR_MANAGER'),
  validateRequest({ params: attendanceIdParamSchema }),
  attendanceController.delete
);

export { attendanceRouter };
