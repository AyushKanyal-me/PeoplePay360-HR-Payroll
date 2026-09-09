import { Router } from 'express';
import { dashboardController } from './dashboard.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireAnyRole } from '../../middleware/rbac.js';
import { validateRequest } from '../../middleware/validate.js';
import { dashboardFilterSchema, attendanceOverviewFilterSchema } from './dashboard.schema.js';

const router = Router();

// All dashboard endpoints require authentication and management/payroll roles
router.use(requireAuth());
router.use(requireAnyRole('ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER'));

/**
 * GET /api/v1/dashboard/kpis
 */
router.get(
  '/kpis',
  validateRequest({ query: dashboardFilterSchema }),
  dashboardController.getKpis
);

/**
 * GET /api/v1/dashboard/salary-by-dept
 */
router.get(
  '/salary-by-dept',
  validateRequest({ query: dashboardFilterSchema }),
  dashboardController.getSalaryByDept
);

/**
 * GET /api/v1/dashboard/salary-trends
 */
router.get(
  '/salary-trends',
  validateRequest({ query: dashboardFilterSchema }),
  dashboardController.getSalaryTrends
);

/**
 * GET /api/v1/dashboard/attendance-overview
 */
router.get(
  '/attendance-overview',
  validateRequest({ query: attendanceOverviewFilterSchema }),
  dashboardController.getAttendanceOverview
);

/**
 * GET /api/v1/dashboard/operational-alerts
 */
router.get(
  '/operational-alerts',
  dashboardController.getOperationalAlerts
);

export { router as dashboardRouter };
