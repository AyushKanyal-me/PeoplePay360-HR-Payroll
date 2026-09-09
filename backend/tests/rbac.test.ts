import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { requireAuth } from '../src/middleware/auth.js';
import { requireAnyRole, requireRole, requireEmployeeOrRole } from '../src/middleware/rbac.js';
import { authService } from '../src/modules/auth/auth.service.js';
import { errorHandler } from '../src/middleware/error.js';
import { sendSuccess } from '../src/utils/response.js';
import { AuthenticatedUser, CanonicalRole } from '../src/types/auth.js';

function createTestApp(): Express {
  const testApp = express();
  testApp.use(express.json());

  // Test routes for different role requirements
  testApp.get(
    '/test/admin-only',
    requireAuth(),
    requireRole('ADMIN'),
    (_req, res) => sendSuccess(res, { message: 'admin access granted' })
  );

  testApp.get(
    '/test/hr-manager',
    requireAuth(),
    requireAnyRole('HR_MANAGER'),
    (_req, res) => sendSuccess(res, { message: 'hr manager access granted' })
  );

  testApp.get(
    '/test/payroll-manager',
    requireAuth(),
    requireAnyRole('HR_PAYROLL_MANAGER'),
    (_req, res) => sendSuccess(res, { message: 'payroll manager access granted' })
  );

  testApp.get(
    '/test/payroll-user',
    requireAuth(),
    requireAnyRole('HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER'),
    (_req, res) => sendSuccess(res, { message: 'payroll user access granted' })
  );

  testApp.get(
    '/test/employee-only',
    requireAuth(),
    requireRole('EMPLOYEE'),
    (_req, res) => sendSuccess(res, { message: 'employee access granted' })
  );

  testApp.get(
    '/test/employees/:employeeId/profile',
    requireAuth(),
    requireEmployeeOrRole('employeeId', 'HR_MANAGER'),
    (req, res) => sendSuccess(res, { message: 'self or hr manager access granted', employeeId: req.params.employeeId })
  );

  testApp.use(errorHandler);
  return testApp;
}

describe('Phase 2 — RBAC Middleware Suite with Canonical Database Roles', () => {
  const testApp = createTestApp();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const createMockUser = (roles: CanonicalRole[], employeeId = 'emp-101'): AuthenticatedUser => ({
    id: 'user-001',
    authUserId: 'auth-001',
    email: 'user@company.com',
    firstName: 'Test',
    lastName: 'User',
    employeeId,
    companyId: 'comp-001',
    roles,
    isActive: true,
    employee: null
  });

  it('4. Employee access: User with EMPLOYEE role can access employee endpoint', async () => {
    vi.spyOn(authService, 'validateToken').mockResolvedValueOnce(createMockUser(['EMPLOYEE']));

    const res = await request(testApp)
      .get('/test/employee-only')
      .set('Authorization', 'Bearer valid-jwt');

    expect(res.status).toBe(200);
    expect(res.body.data.message).toBe('employee access granted');
  });

  it('5. HR Manager access: User with HR_MANAGER role can access HR endpoint', async () => {
    vi.spyOn(authService, 'validateToken').mockResolvedValueOnce(createMockUser(['HR_MANAGER']));

    const res = await request(testApp)
      .get('/test/hr-manager')
      .set('Authorization', 'Bearer valid-jwt');

    expect(res.status).toBe(200);
    expect(res.body.data.message).toBe('hr manager access granted');
  });

  it('6. Payroll Manager access: User with HR_PAYROLL_MANAGER can access payroll manager endpoint', async () => {
    vi.spyOn(authService, 'validateToken').mockResolvedValueOnce(createMockUser(['HR_PAYROLL_MANAGER']));

    const res = await request(testApp)
      .get('/test/payroll-manager')
      .set('Authorization', 'Bearer valid-jwt');

    expect(res.status).toBe(200);
    expect(res.body.data.message).toBe('payroll manager access granted');
  });

  it('7. Payroll User access: User with HR_PAYROLL_USER can access payroll user endpoint', async () => {
    vi.spyOn(authService, 'validateToken').mockResolvedValueOnce(createMockUser(['HR_PAYROLL_USER']));

    const res = await request(testApp)
      .get('/test/payroll-user')
      .set('Authorization', 'Bearer valid-jwt');

    expect(res.status).toBe(200);
    expect(res.body.data.message).toBe('payroll user access granted');
  });

  it('8. Admin superuser access: User with ADMIN role bypasses and accesses protected routes', async () => {
    vi.spyOn(authService, 'validateToken').mockResolvedValueOnce(createMockUser(['ADMIN']));

    const res = await request(testApp)
      .get('/test/admin-only')
      .set('Authorization', 'Bearer valid-jwt');

    expect(res.status).toBe(200);
    expect(res.body.data.message).toBe('admin access granted');
  });

  it('9. Forbidden role: User with EMPLOYEE role is denied access (403) to HR_MANAGER route', async () => {
    vi.spyOn(authService, 'validateToken').mockResolvedValueOnce(createMockUser(['EMPLOYEE']));

    const res = await request(testApp)
      .get('/test/hr-manager')
      .set('Authorization', 'Bearer valid-jwt');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(res.body.error.message).toContain('Access denied');
  });

  it('10. requireEmployeeOrRole: Employee can access their own record matching route param', async () => {
    vi.spyOn(authService, 'validateToken').mockResolvedValueOnce(createMockUser(['EMPLOYEE'], 'emp-101'));

    const res = await request(testApp)
      .get('/test/employees/emp-101/profile')
      .set('Authorization', 'Bearer valid-jwt');

    expect(res.status).toBe(200);
    expect(res.body.data.message).toBe('self or hr manager access granted');
  });

  it('11. requireEmployeeOrRole: Employee is denied (403) from accessing another employee record', async () => {
    vi.spyOn(authService, 'validateToken').mockResolvedValueOnce(createMockUser(['EMPLOYEE'], 'emp-101'));

    const res = await request(testApp)
      .get('/test/employees/emp-999/profile')
      .set('Authorization', 'Bearer valid-jwt');

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});
