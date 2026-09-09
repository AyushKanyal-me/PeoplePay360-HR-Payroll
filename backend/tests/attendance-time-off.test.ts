import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { authService } from '../src/modules/auth/auth.service.js';
import { attendanceService } from '../src/modules/attendance/attendance.service.js';
import { timeOffService } from '../src/modules/time-off/time-off.service.js';
import { BadRequestError, ForbiddenError } from '../src/utils/errors.js';
import { AuthenticatedUser } from '../src/types/auth.js';

describe('Phase 4 — Attendance & Time Off API Test Suite', () => {
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

  const mockEmployeeUser: AuthenticatedUser = {
    id: '00000000-0000-0000-0000-000000000005',
    authUserId: '00000000-0000-0000-0000-000000000006',
    email: 'employee@peoplepay360.com',
    roles: ['EMPLOYEE'],
    isActive: true,
    companyId: '00000000-0000-0000-0000-000000000010',
    employeeId: '00000000-0000-0000-0000-000000000102'
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------
  // 1. ATTENDANCE & QUICK WIDGET
  // -------------------------------------------------------------
  describe('Attendance Module (/api/v1/attendance)', () => {
    it('POST /api/v1/attendance/check-in records check-in for authenticated employee', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockEmployeeUser);
      vi.spyOn(attendanceService, 'checkIn').mockResolvedValue({
        id: '00000000-0000-0000-0000-000000000201',
        employee_id: '00000000-0000-0000-0000-000000000102',
        attendance_date: '2026-09-09',
        check_in: new Date().toISOString(),
        check_out: null,
        worked_hours: null,
        overtime_hours: 0,
        status: 'PRESENT',
        is_manual_edit: false,
        correction_note: 'Automated quick check-in',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      const res = await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', 'Bearer valid-jwt');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('PRESENT');
      expect(res.body.data.employee_id).toBe(mockEmployeeUser.employeeId);
    });

    it('Duplicate check-in: checking in twice returns 400 BadRequestError', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockEmployeeUser);
      vi.spyOn(attendanceService, 'checkIn').mockRejectedValue(
        new BadRequestError('You are already checked in for today')
      );

      const res = await request(app)
        .post('/api/v1/attendance/check-in')
        .set('Authorization', 'Bearer valid-jwt');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('BAD_REQUEST');
      expect(res.body.error.message).toContain('already checked in');
    });

    it('POST /api/v1/attendance/check-out records checkout and computes worked hours', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockEmployeeUser);
      vi.spyOn(attendanceService, 'checkOut').mockResolvedValue({
        id: '00000000-0000-0000-0000-000000000201',
        employee_id: '00000000-0000-0000-0000-000000000102',
        attendance_date: '2026-09-09',
        check_in: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
        check_out: new Date().toISOString(),
        worked_hours: 8,
        overtime_hours: 0,
        status: 'PRESENT',
        is_manual_edit: false,
        correction_note: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      const res = await request(app)
        .post('/api/v1/attendance/check-out')
        .set('Authorization', 'Bearer valid-jwt');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.worked_hours).toBe(8);
    });

    it('Invalid checkout: checking out without check-in returns 400 BadRequestError', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockEmployeeUser);
      vi.spyOn(attendanceService, 'checkOut').mockRejectedValue(
        new BadRequestError('No active check-in found for today. Please check in first.')
      );

      const res = await request(app)
        .post('/api/v1/attendance/check-out')
        .set('Authorization', 'Bearer valid-jwt');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('BAD_REQUEST');
    });

    it('POST /api/v1/attendance: HR_MANAGER can create manual attendance record', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockHrManagerUser);
      vi.spyOn(attendanceService, 'createManualAttendance').mockResolvedValue({
        id: '00000000-0000-0000-0000-000000000202',
        employee_id: '00000000-0000-0000-0000-000000000102',
        attendance_date: '2026-09-08',
        check_in: '2026-09-08T09:00:00.000Z',
        check_out: '2026-09-08T18:00:00.000Z',
        worked_hours: 8,
        overtime_hours: 0,
        status: 'PRESENT',
        is_manual_edit: true,
        correction_note: 'Manual backfill for network outage',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      const res = await request(app)
        .post('/api/v1/attendance')
        .set('Authorization', 'Bearer valid-jwt')
        .send({
          employee_id: '00000000-0000-0000-0000-000000000102',
          attendance_date: '2026-09-08',
          check_in: '2026-09-08T09:00:00.000Z',
          check_out: '2026-09-08T18:00:00.000Z',
          worked_hours: 8,
          correction_note: 'Manual backfill for network outage'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.is_manual_edit).toBe(true);
    });
  });

  // -------------------------------------------------------------
  // 2. TIME OFF & APPROVAL WORKFLOW
  // -------------------------------------------------------------
  describe('Time Off Module (/api/v1/time-off)', () => {
    it('POST /api/v1/time-off/requests: employee can submit leave request', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockEmployeeUser);
      vi.spyOn(timeOffService, 'submitRequest').mockResolvedValue({
        id: '00000000-0000-0000-0000-000000000301',
        employee_id: '00000000-0000-0000-0000-000000000102',
        time_off_type_id: '00000000-0000-0000-0000-000000000300',
        allocation_id: '00000000-0000-0000-0000-000000000310',
        start_date: '2026-10-01',
        end_date: '2026-10-03',
        duration: 3,
        reason: 'Family vacation',
        status: 'PENDING',
        approved_by: null,
        approved_at: null,
        rejection_reason: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      const res = await request(app)
        .post('/api/v1/time-off/requests')
        .set('Authorization', 'Bearer valid-jwt')
        .send({
          time_off_type_id: '00000000-0000-0000-0000-000000000300',
          start_date: '2026-10-01',
          end_date: '2026-10-03',
          duration: 3,
          reason: 'Family vacation'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('PENDING');
      expect(res.body.data.duration).toBe(3);
    });

    it('POST /api/v1/time-off/requests/:id/approve: HR_MANAGER approves request transactionally', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockHrManagerUser);
      vi.spyOn(timeOffService, 'approveRequest').mockResolvedValue({
        id: '00000000-0000-0000-0000-000000000301',
        employee_id: '00000000-0000-0000-0000-000000000102',
        time_off_type_id: '00000000-0000-0000-0000-000000000300',
        allocation_id: '00000000-0000-0000-0000-000000000310',
        start_date: '2026-10-01',
        end_date: '2026-10-03',
        duration: 3,
        reason: 'Family vacation',
        status: 'APPROVED',
        approved_by: mockHrManagerUser.id,
        approved_at: new Date().toISOString(),
        rejection_reason: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      const res = await request(app)
        .post('/api/v1/time-off/requests/00000000-0000-0000-0000-000000000301/approve')
        .set('Authorization', 'Bearer valid-jwt');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('APPROVED');
    });

    it('Approval security: EMPLOYEE role cannot approve leave requests (403 Forbidden)', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockEmployeeUser);

      const res = await request(app)
        .post('/api/v1/time-off/requests/00000000-0000-0000-0000-000000000301/approve')
        .set('Authorization', 'Bearer valid-jwt');

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('POST /api/v1/time-off/requests/:id/refuse: HR_MANAGER refuses leave with explanation', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockHrManagerUser);
      vi.spyOn(timeOffService, 'refuseRequest').mockResolvedValue({
        id: '00000000-0000-0000-0000-000000000301',
        employee_id: '00000000-0000-0000-0000-000000000102',
        time_off_type_id: '00000000-0000-0000-0000-000000000300',
        allocation_id: '00000000-0000-0000-0000-000000000310',
        start_date: '2026-10-01',
        end_date: '2026-10-03',
        duration: 3,
        reason: 'Family vacation',
        status: 'REFUSED',
        approved_by: mockHrManagerUser.id,
        approved_at: new Date().toISOString(),
        rejection_reason: 'Critical project release milestone on requested dates',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      const res = await request(app)
        .post('/api/v1/time-off/requests/00000000-0000-0000-0000-000000000301/refuse')
        .set('Authorization', 'Bearer valid-jwt')
        .send({ rejection_reason: 'Critical project release milestone on requested dates' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('REFUSED');
      expect(res.body.data.rejection_reason).toContain('Critical project release');
    });

    it('Insufficient balance: requesting leave beyond allocation balance returns 400 BadRequestError', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockEmployeeUser);
      vi.spyOn(timeOffService, 'submitRequest').mockRejectedValue(
        new BadRequestError('Insufficient leave balance. Available: 2 DAYS, Requested: 5 DAYS')
      );

      const res = await request(app)
        .post('/api/v1/time-off/requests')
        .set('Authorization', 'Bearer valid-jwt')
        .send({
          time_off_type_id: '00000000-0000-0000-0000-000000000300',
          start_date: '2026-10-01',
          end_date: '2026-10-05',
          duration: 5,
          reason: 'Extended leave'
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('BAD_REQUEST');
      expect(res.body.error.message).toContain('Insufficient leave balance');
    });
  });
});
