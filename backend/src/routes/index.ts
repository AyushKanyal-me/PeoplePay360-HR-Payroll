import { Router } from 'express';
import { sendSuccess } from '../utils/response.js';
import { authRouter } from '../modules/auth/index.js';
import { companiesRouter } from '../modules/companies/index.js';
import { departmentsRouter } from '../modules/departments/index.js';
import { positionsRouter } from '../modules/positions/index.js';
import { schedulesRouter } from '../modules/schedules/index.js';
import { employeesRouter } from '../modules/employees/index.js';
import { contractsRouter } from '../modules/contracts/index.js';
import { attendanceRouter } from '../modules/attendance/index.js';
import { timeOffRouter } from '../modules/time-off/index.js';
import { salaryStructuresRouter, salaryRulesRouter } from '../modules/salary/index.js';
import { payrollRouter } from '../modules/payroll/index.js';
import { payslipsRouter, payslipDeliveriesRouter } from '../modules/payslips/index.js';
import { dashboardRouter } from '../modules/dashboard/index.js';
import { auditLogsRouter } from '../modules/audit-logs/index.js';

const apiV1Router = Router();

/**
 * Health check
 * GET /api/v1/health
 */
apiV1Router.get('/health', (_req, res) => {
  sendSuccess(res, {
    status: 'ok',
    version: 'v1',
    timestamp: new Date().toISOString()
  });
});

// Phase 2: Auth
apiV1Router.use('/auth', authRouter);

// Phase 3: Core HR
apiV1Router.use('/companies', companiesRouter);
apiV1Router.use('/departments', departmentsRouter);
apiV1Router.use('/job-positions', positionsRouter);
apiV1Router.use('/schedules', schedulesRouter);
apiV1Router.use('/employees', employeesRouter);
apiV1Router.use('/contracts', contractsRouter);

// Phase 4: Attendance & Time Off
apiV1Router.use('/attendance', attendanceRouter);
apiV1Router.use('/time-off', timeOffRouter);

// Phase 5: Salary Structures & Rules
apiV1Router.use('/salary-structures', salaryStructuresRouter);
apiV1Router.use('/salary-rules', salaryRulesRouter);

// Phase 6 & 7: Payroll, Payslips & Deliveries
apiV1Router.use('/payruns', payrollRouter);
apiV1Router.use('/payslips', payslipsRouter);
apiV1Router.use('/payslip-deliveries', payslipDeliveriesRouter);

// Phase 8: Dashboard & Analytics
apiV1Router.use('/dashboard', dashboardRouter);

// Phase 9: Audit Logs
apiV1Router.use('/audit-logs', auditLogsRouter);

export { apiV1Router };
