import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { authService } from '../src/modules/auth/auth.service.js';
import { dashboardService } from '../src/modules/dashboard/dashboard.service.js';
import { DashboardRepository } from '../src/modules/dashboard/dashboard.repository.js';
import { DashboardService } from '../src/modules/dashboard/dashboard.service.js';
import { AuthenticatedUser } from '../src/types/auth.js';

describe('Phase 8 — Dashboard and Analytics Test Suite', () => {
  const mockAdminUser: AuthenticatedUser = {
    id: '00000000-0000-0000-0000-000000000001',
    authUserId: '00000000-0000-0000-0000-000000000002',
    email: 'admin@peoplepay360.com',
    roles: ['ADMIN'],
    isActive: true,
    companyId: '00000000-0000-0000-0000-000000000010',
    employeeId: '00000000-0000-0000-0000-000000000100'
  };

  const mockHrPayrollUser: AuthenticatedUser = {
    id: '00000000-0000-0000-0000-000000000003',
    authUserId: '00000000-0000-0000-0000-000000000004',
    email: 'payroll@peoplepay360.com',
    roles: ['HR_PAYROLL_MANAGER'],
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
  // 1. RBAC & TENANT ISOLATION
  // -------------------------------------------------------------
  describe('1. RBAC & Access Control', () => {
    it('should reject unauthenticated request (401 Unauthorized)', async () => {
      const res = await request(app).get('/api/v1/dashboard/kpis');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject EMPLOYEE role from accessing dashboard APIs (403 Forbidden)', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockEmployeeUser);

      const res = await request(app)
        .get('/api/v1/dashboard/kpis')
        .set('Authorization', 'Bearer employee-jwt');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/Access denied/i);
    });

    it('should allow ADMIN and HR_PAYROLL_MANAGER to access dashboard APIs (200 OK)', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockHrPayrollUser);
      vi.spyOn(dashboardService, 'getKpis').mockResolvedValue({
        headcount: { total: 10, active: 8, inactive: 1, terminated: 1, byType: { FULL_TIME: 8 } },
        payroll: { totalNetSalaryPaid: 400000, totalGrossSalaryPaid: 450000, totalDeductions: 50000, payslipsGenerated: 8, averageNetSalary: 50000, totalPayrunsCount: 2 },
        timeOffHealth: { pendingRequests: 2, approvedRequests: 5, activeAllocations: 8 }
      });

      const res = await request(app)
        .get('/api/v1/dashboard/kpis')
        .set('Authorization', 'Bearer payroll-jwt');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.headcount.total).toBe(10);
    });
  });

  // -------------------------------------------------------------
  // 2. ENDPOINTS VALIDATION & DATA RETURN
  // -------------------------------------------------------------
  describe('2. Dashboard Endpoints', () => {
    it('GET /api/v1/dashboard/kpis should return valid KPI metrics', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockAdminUser);
      vi.spyOn(dashboardService, 'getKpis').mockResolvedValue({
        headcount: { total: 15, active: 14, inactive: 1, terminated: 0, byType: { FULL_TIME: 12, CONTRACT: 3 } },
        payroll: {
          totalNetSalaryPaid: 650000,
          totalGrossSalaryPaid: 720000,
          totalDeductions: 70000,
          payslipsGenerated: 14,
          averageNetSalary: 46428.57,
          totalPayrunsCount: 3
        },
        timeOffHealth: {
          pendingRequests: 3,
          approvedRequests: 12,
          activeAllocations: 14
        }
      });

      const res = await request(app)
        .get('/api/v1/dashboard/kpis')
        .set('Authorization', 'Bearer admin-jwt');

      expect(res.status).toBe(200);
      expect(res.body.data.headcount.active).toBe(14);
      expect(res.body.data.payroll.totalNetSalaryPaid).toBe(650000);
      expect(res.body.data.timeOffHealth.pendingRequests).toBe(3);
    });

    it('GET /api/v1/dashboard/salary-by-dept should return department breakdown', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockAdminUser);
      vi.spyOn(dashboardService, 'getSalaryByDepartment').mockResolvedValue([
        {
          departmentId: '00000000-0000-0000-0000-0000000000d1',
          departmentName: 'Engineering',
          departmentCode: 'ENG',
          headcount: 8,
          activeContractCount: 8,
          totalWage: 480000,
          averageWage: 60000,
          totalPaidNet: 440000,
          totalPaidGross: 480000
        },
        {
          departmentId: '00000000-0000-0000-0000-0000000000d2',
          departmentName: 'Human Resources',
          departmentCode: 'HR',
          headcount: 3,
          activeContractCount: 3,
          totalWage: 150000,
          averageWage: 50000,
          totalPaidNet: 135000,
          totalPaidGross: 150000
        }
      ]);

      const res = await request(app)
        .get('/api/v1/dashboard/salary-by-dept')
        .set('Authorization', 'Bearer admin-jwt');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0].departmentCode).toBe('ENG');
      expect(res.body.data[0].totalWage).toBe(480000);
    });

    it('GET /api/v1/dashboard/salary-trends should return monthly trend data', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockAdminUser);
      vi.spyOn(dashboardService, 'getSalaryTrends').mockResolvedValue([
        {
          period: '2026-08',
          periodStart: '2026-08-01',
          periodEnd: '2026-08-31',
          totalGross: 500000,
          totalNet: 450000,
          totalDeductions: 50000,
          employeeCount: 10,
          payrunCount: 1
        },
        {
          period: '2026-09',
          periodStart: '2026-09-01',
          periodEnd: '2026-09-30',
          totalGross: 550000,
          totalNet: 495000,
          totalDeductions: 55000,
          employeeCount: 11,
          payrunCount: 1
        }
      ]);

      const res = await request(app)
        .get('/api/v1/dashboard/salary-trends')
        .set('Authorization', 'Bearer admin-jwt');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0].period).toBe('2026-08');
      expect(res.body.data[1].totalNet).toBe(495000);
    });

    it('GET /api/v1/dashboard/attendance-overview should return attendance breakdown & rate', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockAdminUser);
      vi.spyOn(dashboardService, 'getAttendanceOverview').mockResolvedValue({
        period: {
          startDate: '2026-09-01',
          endDate: '2026-09-09'
        },
        totalRecords: 100,
        breakdown: {
          present: 85,
          absent: 5,
          late: 8,
          overtime: 2,
          missingCheckout: 0
        },
        totalWorkedHours: 780,
        totalOvertimeHours: 12,
        attendanceRate: 95.0
      });

      const res = await request(app)
        .get('/api/v1/dashboard/attendance-overview?startDate=2026-09-01&endDate=2026-09-09')
        .set('Authorization', 'Bearer admin-jwt');

      expect(res.status).toBe(200);
      expect(res.body.data.totalRecords).toBe(100);
      expect(res.body.data.breakdown.present).toBe(85);
      expect(res.body.data.attendanceRate).toBe(95.0);
    });

    it('GET /api/v1/dashboard/operational-alerts should return supported alerts', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockAdminUser);
      vi.spyOn(dashboardService, 'getOperationalAlerts').mockResolvedValue({
        summary: {
          totalAlerts: 4,
          missingBankDetailsCount: 1,
          expiringContractsCount: 1,
          pendingLeaveRequestsCount: 1,
          unresolvedWarningsCount: 1
        },
        alerts: {
          missingBankDetails: [
            {
              employeeId: '00000000-0000-0000-0000-000000000105',
              employeeCode: 'EMP-005',
              firstName: 'Vikram',
              lastName: 'Singh',
              departmentName: 'Engineering'
            }
          ],
          expiringContracts: [
            {
              contractId: '00000000-0000-0000-0000-000000000505',
              employeeId: '00000000-0000-0000-0000-000000000105',
              employeeCode: 'EMP-005',
              employeeName: 'Vikram Singh',
              endDate: '2026-09-28',
              daysRemaining: 19
            }
          ],
          pendingLeaveRequests: [
            {
              requestId: '00000000-0000-0000-0000-000000000301',
              employeeId: '00000000-0000-0000-0000-000000000102',
              employeeName: 'Aarav Mehta',
              timeOffTypeName: 'Casual Leave',
              startDate: '2026-09-15',
              endDate: '2026-09-16',
              duration: 2
            }
          ],
          unresolvedWarnings: [
            {
              warningId: '00000000-0000-0000-0000-000000000901',
              payrunId: '00000000-0000-0000-0000-000000000601',
              payrunName: 'September Payroll',
              employeeName: 'Vikram Singh',
              type: 'MISSING_BANK_DETAILS',
              severity: 'WARNING',
              message: 'Employee Vikram Singh has no bank details'
            }
          ]
        }
      });

      const res = await request(app)
        .get('/api/v1/dashboard/operational-alerts')
        .set('Authorization', 'Bearer admin-jwt');

      expect(res.status).toBe(200);
      expect(res.body.data.summary.totalAlerts).toBe(4);
      expect(res.body.data.alerts.missingBankDetails.length).toBe(1);
      expect(res.body.data.alerts.expiringContracts[0].daysRemaining).toBe(19);
    });
  });

  // -------------------------------------------------------------
  // 3. SERVICE LOGIC & EMPTY STATE AGGREGATION TESTS
  // -------------------------------------------------------------
  describe('3. Service Logic & Empty State Handling', () => {
    it('should calculate accurate zeroed KPIs on empty data', async () => {
      const mockRepo = {
        getEmployeesForCompany: vi.fn().mockResolvedValue([]),
        getPayrunsForCompany: vi.fn().mockResolvedValue([]),
        getPayslipsForCompany: vi.fn().mockResolvedValue([]),
        getTimeOffMetricsForCompany: vi.fn().mockResolvedValue({
          pendingRequestsCount: 0,
          approvedRequestsCount: 0,
          activeAllocationsCount: 0
        }),
        getDepartmentsForCompany: vi.fn().mockResolvedValue([]),
        getActiveContractsForCompany: vi.fn().mockResolvedValue([]),
        getAttendanceRecords: vi.fn().mockResolvedValue([]),
        getExpiringContracts: vi.fn().mockResolvedValue([]),
        getPendingTimeOffRequests: vi.fn().mockResolvedValue([]),
        getUnresolvedPayrollWarnings: vi.fn().mockResolvedValue([])
      } as unknown as DashboardRepository;

      const service = new DashboardService(mockRepo);
      const kpis = await service.getKpis('00000000-0000-0000-0000-000000000010');

      expect(kpis.headcount.total).toBe(0);
      expect(kpis.headcount.active).toBe(0);
      expect(kpis.payroll.totalNetSalaryPaid).toBe(0);
      expect(kpis.payroll.averageNetSalary).toBe(0);
      expect(kpis.timeOffHealth.pendingRequests).toBe(0);
    });

    it('should aggregate attendance rates and overtime accurately', async () => {
      const mockRepo = {
        getAttendanceRecords: vi.fn().mockResolvedValue([
          { status: 'PRESENT', worked_hours: 8, overtime_hours: 1 },
          { status: 'LATE', worked_hours: 7.5, overtime_hours: 0 },
          { status: 'OVERTIME', worked_hours: 10, overtime_hours: 2 },
          { status: 'ABSENT', worked_hours: 0, overtime_hours: 0 }
        ])
      } as unknown as DashboardRepository;

      const service = new DashboardService(mockRepo);
      const overview = await service.getAttendanceOverview('00000000-0000-0000-0000-000000000010');

      expect(overview.totalRecords).toBe(4);
      expect(overview.breakdown.present).toBe(1);
      expect(overview.breakdown.late).toBe(1);
      expect(overview.breakdown.overtime).toBe(1);
      expect(overview.breakdown.absent).toBe(1);
      expect(overview.totalWorkedHours).toBe(25.5);
      expect(overview.totalOvertimeHours).toBe(3);
      // (1 + 1 + 1) / 4 = 75%
      expect(overview.attendanceRate).toBe(75);
    });
  });
});
