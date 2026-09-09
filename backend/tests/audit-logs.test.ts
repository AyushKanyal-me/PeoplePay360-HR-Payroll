import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { authService } from '../src/modules/auth/auth.service.js';
import { auditLogsService } from '../src/modules/audit-logs/audit-logs.service.js';
import { AuthenticatedUser } from '../src/types/auth.js';

describe('Phase 9 — Audit Logs Test Suite', () => {
  const mockAdminUser: AuthenticatedUser = {
    id: '00000000-0000-0000-0000-000000000001',
    authUserId: '00000000-0000-0000-0000-000000000002',
    email: 'admin@peoplepay360.com',
    roles: ['ADMIN'],
    isActive: true,
    companyId: '00000000-0000-0000-0000-000000000010',
    employeeId: '00000000-0000-0000-0000-000000000100'
  };

  const mockHrManagerUser: AuthenticatedUser = {
    id: '00000000-0000-0000-0000-000000000003',
    authUserId: '00000000-0000-0000-0000-000000000004',
    email: 'hrmanager@peoplepay360.com',
    roles: ['HR_MANAGER'],
    isActive: true,
    companyId: '00000000-0000-0000-0000-000000000010',
    employeeId: '00000000-0000-0000-0000-000000000101'
  };

  const mockPayrollManagerUser: AuthenticatedUser = {
    id: '00000000-0000-0000-0000-000000000005',
    authUserId: '00000000-0000-0000-0000-000000000006',
    email: 'payroll@peoplepay360.com',
    roles: ['HR_PAYROLL_MANAGER'],
    isActive: true,
    companyId: '00000000-0000-0000-0000-000000000010',
    employeeId: '00000000-0000-0000-0000-000000000102'
  };

  const mockEmployeeUser: AuthenticatedUser = {
    id: '00000000-0000-0000-0000-000000000007',
    authUserId: '00000000-0000-0000-0000-000000000008',
    email: 'employee@peoplepay360.com',
    roles: ['EMPLOYEE'],
    isActive: true,
    companyId: '00000000-0000-0000-0000-000000000010',
    employeeId: '00000000-0000-0000-0000-000000000103'
  };

  const mockAuditLogs = [
    {
      id: '00000000-0000-0000-0000-000000000a01',
      user_id: '00000000-0000-0000-0000-000000000001',
      action: 'UPDATE',
      entity_type: 'contracts',
      entity_id: '00000000-0000-0000-0000-000000000501',
      old_values: { wage: 50000 },
      new_values: { wage: 55000 },
      created_at: '2026-09-01T10:00:00.000Z',
      user: {
        id: '00000000-0000-0000-0000-000000000001',
        auth_user_id: '00000000-0000-0000-0000-000000000002',
        employee_id: '00000000-0000-0000-0000-000000000100',
        employee: {
          id: '00000000-0000-0000-0000-000000000100',
          first_name: 'Admin',
          last_name: 'User',
          employee_code: 'EMP-001',
          company_id: '00000000-0000-0000-0000-000000000010'
        }
      }
    }
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------
  // 1. RBAC & SECURITY TESTS
  // -------------------------------------------------------------
  describe('1. Security & RBAC', () => {
    it('should reject unauthenticated request (401 Unauthorized)', async () => {
      const res = await request(app).get('/api/v1/audit-logs');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject EMPLOYEE role (403 Forbidden)', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockEmployeeUser);

      const res = await request(app)
        .get('/api/v1/audit-logs')
        .set('Authorization', 'Bearer employee-jwt');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/Access denied/i);
    });

    it('should reject HR_MANAGER role (403 Forbidden)', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockHrManagerUser);

      const res = await request(app)
        .get('/api/v1/audit-logs')
        .set('Authorization', 'Bearer hrmanager-jwt');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/Access denied/i);
    });

    it('should reject HR_PAYROLL_MANAGER role (403 Forbidden)', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockPayrollManagerUser);

      const res = await request(app)
        .get('/api/v1/audit-logs')
        .set('Authorization', 'Bearer payroll-jwt');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/Access denied/i);
    });

    it('should allow ADMIN role to access audit logs (200 OK)', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockAdminUser);
      vi.spyOn(auditLogsService, 'getAuditLogs').mockResolvedValue({
        data: mockAuditLogs,
        total: 1
      });

      const res = await request(app)
        .get('/api/v1/audit-logs')
        .set('Authorization', 'Bearer admin-jwt');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.meta.total).toBe(1);
      expect(res.body.data[0].action).toBe('UPDATE');
      expect(res.body.data[0].entity_type).toBe('contracts');
    });
  });

  // -------------------------------------------------------------
  // 2. FILTERS & PAGINATION TESTS
  // -------------------------------------------------------------
  describe('2. Filters & Pagination', () => {
    it('should accept filters for action, table, actor (userId), and date range', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockAdminUser);
      const getAuditLogsSpy = vi.spyOn(auditLogsService, 'getAuditLogs').mockResolvedValue({
        data: mockAuditLogs,
        total: 1
      });

      const res = await request(app)
        .get('/api/v1/audit-logs?table=contracts&action=UPDATE&userId=00000000-0000-0000-0000-000000000001&startDate=2026-09-01&endDate=2026-09-30&page=1&limit=10')
        .set('Authorization', 'Bearer admin-jwt');

      expect(res.status).toBe(200);
      expect(getAuditLogsSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          table: 'contracts',
          action: 'UPDATE',
          userId: '00000000-0000-0000-0000-000000000001',
          startDate: '2026-09-01',
          endDate: '2026-09-30',
          page: 1,
          limit: 10
        })
      );
    });

    it('should validate query parameters and reject invalid UUIDs or date formats', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockAdminUser);

      const res = await request(app)
        .get('/api/v1/audit-logs?userId=not-a-uuid')
        .set('Authorization', 'Bearer admin-jwt');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/Validation failed/i);
    });
  });
});
