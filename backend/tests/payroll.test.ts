import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { authService } from '../src/modules/auth/auth.service.js';
import { payrollService } from '../src/modules/payroll/payroll.service.js';
import { PayrollEngine } from '../src/modules/payroll/engine/PayrollEngine.js';
import { DeductionCalculator } from '../src/modules/payroll/engine/DeductionCalculator.js';
import { WorkingDaysCalculator } from '../src/modules/payroll/engine/WorkingDaysCalculator.js';
import { WarningDetector } from '../src/modules/payroll/engine/WarningDetector.js';
import { BadRequestError } from '../src/utils/errors.js';
import { AuthenticatedUser } from '../src/types/auth.js';
import { SalaryStructure } from '../src/modules/salary/salary.types.js';
import { Employee } from '../src/modules/employees/employees.types.js';

describe('Phase 6 — Payroll Engine & Payrun Lifecycle Test Suite', () => {
  const mockAdminUser: AuthenticatedUser = {
    id: '00000000-0000-0000-0000-000000000001',
    authUserId: '00000000-0000-0000-0000-000000000002',
    email: 'admin@peoplepay360.com',
    roles: ['ADMIN'],
    isActive: true,
    companyId: '00000000-0000-0000-0000-000000000010',
    employeeId: '00000000-0000-0000-0000-000000000100'
  };

  const mockPayrollManager: AuthenticatedUser = {
    id: '00000000-0000-0000-0000-000000000007',
    authUserId: '00000000-0000-0000-0000-000000000008',
    email: 'payrollmanager@peoplepay360.com',
    roles: ['HR_PAYROLL_MANAGER'],
    isActive: true,
    companyId: '00000000-0000-0000-0000-000000000010',
    employeeId: '00000000-0000-0000-0000-000000000107'
  };

  const mockPayrollUser: AuthenticatedUser = {
    id: '00000000-0000-0000-0000-000000000009',
    authUserId: '00000000-0000-0000-0000-000000000010',
    email: 'payrolluser@peoplepay360.com',
    roles: ['HR_PAYROLL_USER'],
    isActive: true,
    companyId: '00000000-0000-0000-0000-000000000010',
    employeeId: '00000000-0000-0000-0000-000000000109'
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
  // 1. DEDUCTION & WORKING DAYS CALCULATOR UNIT TESTS
  // -------------------------------------------------------------
  describe('Engine Units (WorkingDays, Deductions, Warnings)', () => {
    it('WorkingDaysCalculator counts exact schedule days in month', () => {
      const calc = new WorkingDaysCalculator();
      // September 2026: 30 days total
      const { totalPeriodDays, workingDays } = calc.calculate(
        '2026-09-01',
        '2026-09-30',
        ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
      );
      expect(totalPeriodDays).toBe(30);
      expect(workingDays).toBe(22); // 22 weekdays in Sept 2026
    });

    it('5. Unpaid leave deduction: computes (wage / totalWorkingDays) * unpaidDays', () => {
      const deductionCalc = new DeductionCalculator();
      const wage = 66000;
      const totalWorkingDays = 22;
      const unpaidDays = 2;

      // daily rate = 66000 / 22 = 3000 -> 2 days = 6000
      const deduction = deductionCalc.calculateUnpaidLeaveDeduction(wage, totalWorkingDays, unpaidDays);
      expect(deduction).toBe(6000);
    });

    it('6. WarningDetector: detects missing contract as ERROR', () => {
      const detector = new WarningDetector();
      const dummyEmp: Employee = {
        id: 'emp-1',
        company_id: 'comp-1',
        first_name: 'John',
        last_name: 'Doe',
        work_email: 'john@company.com',
        personal_email: null,
        phone: null,
        hire_date: '2025-01-01',
        employment_type: 'FULL_TIME',
        status: 'ACTIVE',
        bank_account_number: '1234567890',
        bank_name: 'HDFC',
        bank_ifsc: 'HDFC0001',
        pan_number: null,
        aadhaar_number: null,
        department_id: null,
        job_position_id: null,
        manager_id: null,
        schedule_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const warnings = detector.detect(dummyEmp, null, '2026-09-01', '2026-09-30', 0, 0, 0);
      expect(warnings.length).toBe(1);
      expect(warnings[0]!.type).toBe('MISSING_CONTRACT');
      expect(warnings[0]!.severity).toBe('ERROR');
    });

    it('7. WarningDetector: detects contract ending mid-period as INFO', () => {
      const detector = new WarningDetector();
      const dummyEmp: Employee = {
        id: 'emp-1',
        company_id: 'comp-1',
        first_name: 'Jane',
        last_name: 'Smith',
        work_email: 'jane@company.com',
        personal_email: null,
        phone: null,
        hire_date: '2025-01-01',
        employment_type: 'FULL_TIME',
        status: 'ACTIVE',
        bank_account_number: '9876543210',
        bank_name: 'ICICI',
        bank_ifsc: 'ICIC0001',
        pan_number: null,
        aadhaar_number: null,
        department_id: null,
        job_position_id: null,
        manager_id: null,
        schedule_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const dummyContract: any = {
        id: 'contract-1',
        employee_id: 'emp-1',
        start_date: '2025-01-01',
        end_date: '2026-09-15', // ends mid-September!
        wage: 50000,
        status: 'ACTIVE'
      };

      const warnings = detector.detect(dummyEmp, dummyContract, '2026-09-01', '2026-09-30', 20, 0, 45000);
      const contractEndWarning = warnings.find((w) => w.message.includes('ends on'));
      expect(contractEndWarning).toBeDefined();
      expect(contractEndWarning?.severity).toBe('INFO');
    });

    it('8. WarningDetector: detects missing bank details as WARNING', () => {
      const detector = new WarningDetector();
      const dummyEmp: Employee = {
        id: 'emp-1',
        company_id: 'comp-1',
        first_name: 'NoBank',
        last_name: 'User',
        work_email: 'nobank@company.com',
        personal_email: null,
        phone: null,
        hire_date: '2025-01-01',
        employment_type: 'FULL_TIME',
        status: 'ACTIVE',
        bank_account_number: null, // MISSING
        bank_name: null,
        bank_ifsc: null,
        pan_number: null,
        aadhaar_number: null,
        department_id: null,
        job_position_id: null,
        manager_id: null,
        schedule_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const dummyContract: any = {
        id: 'contract-1',
        employee_id: 'emp-1',
        start_date: '2025-01-01',
        end_date: null,
        wage: 50000,
        status: 'ACTIVE'
      };

      const warnings = detector.detect(dummyEmp, dummyContract, '2026-09-01', '2026-09-30', 20, 0, 45000);
      const bankWarning = warnings.find((w) => w.type === 'MISSING_BANK_DETAILS');
      expect(bankWarning).toBeDefined();
      expect(bankWarning?.severity).toBe('WARNING');
    });
  });

  // -------------------------------------------------------------
  // 2. PAYROLL API LIFECYCLE & STATE TRANSITIONS
  // -------------------------------------------------------------
  describe('Payrun Lifecycle & RBAC API Endpoints', () => {
    it('10. POST /api/v1/payruns: HR_PAYROLL_MANAGER creates payrun in DRAFT', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockPayrollManager);
      vi.spyOn(payrollService, 'createPayrun').mockResolvedValue({
        id: '00000000-0000-0000-0000-000000000601',
        company_id: '00000000-0000-0000-0000-000000000010',
        salary_structure_id: '00000000-0000-0000-0000-000000000401',
        name: 'September 2026 Payroll Batch',
        period_start: '2026-09-01',
        period_end: '2026-09-30',
        status: 'DRAFT',
        total_employees: 5,
        total_gross: 0,
        total_deductions: 0,
        total_net: 0,
        computed_at: null,
        validated_at: null,
        paid_at: null,
        created_by: mockPayrollManager.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      const res = await request(app)
        .post('/api/v1/payruns')
        .set('Authorization', 'Bearer valid-jwt')
        .send({
          company_id: '00000000-0000-0000-0000-000000000010',
          salary_structure_id: '00000000-0000-0000-0000-000000000401',
          name: 'September 2026 Payroll Batch',
          period_start: '2026-09-01',
          period_end: '2026-09-30'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('DRAFT');
    });

    it('14. POST /api/v1/payruns/:id/compute: HR_PAYROLL_MANAGER computes batch and transitions to COMPUTED', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockPayrollManager);
      vi.spyOn(payrollService, 'computePayrun').mockResolvedValue({
        id: '00000000-0000-0000-0000-000000000601',
        company_id: '00000000-0000-0000-0000-000000000010',
        salary_structure_id: '00000000-0000-0000-0000-000000000401',
        name: 'September 2026 Payroll Batch',
        period_start: '2026-09-01',
        period_end: '2026-09-30',
        status: 'COMPUTED',
        total_employees: 5,
        total_gross: 250000,
        total_deductions: 30000,
        total_net: 220000,
        computed_at: new Date().toISOString(),
        validated_at: null,
        paid_at: null,
        created_by: mockPayrollManager.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      const res = await request(app)
        .post('/api/v1/payruns/00000000-0000-0000-0000-000000000601/compute')
        .set('Authorization', 'Bearer valid-jwt');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('COMPUTED');
      expect(res.body.data.total_net).toBe(220000);
    });

    it('13. RBAC: HR_PAYROLL_USER cannot trigger compute (403 Forbidden)', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockPayrollUser);

      const res = await request(app)
        .post('/api/v1/payruns/00000000-0000-0000-0000-000000000601/compute')
        .set('Authorization', 'Bearer valid-jwt');

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('15. RBAC: EMPLOYEE cannot access payroll endpoints (403 Forbidden)', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockEmployeeUser);

      const res = await request(app)
        .get('/api/v1/payruns')
        .set('Authorization', 'Bearer valid-jwt');

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('12. Invalid state transition: attempting to mark-paid a DRAFT payrun throws 400 BadRequestError', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockPayrollManager);
      vi.spyOn(payrollService, 'markPaid').mockRejectedValue(
        new BadRequestError("Cannot mark payrun as paid in 'DRAFT' state. Batch must be VALIDATED first.")
      );

      const res = await request(app)
        .post('/api/v1/payruns/00000000-0000-0000-0000-000000000601/mark-paid')
        .set('Authorization', 'Bearer valid-jwt');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('BAD_REQUEST');
      expect(res.body.error.message).toContain('VALIDATED first');
    });

    it('Lifecycle progression: COMPUTED -> VALIDATED -> PAID', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockPayrollManager);

      // Validate
      vi.spyOn(payrollService, 'validatePayrun').mockResolvedValue({
        id: '00000000-0000-0000-0000-000000000601',
        company_id: '00000000-0000-0000-0000-000000000010',
        salary_structure_id: '00000000-0000-0000-0000-000000000401',
        name: 'September 2026 Payroll Batch',
        period_start: '2026-09-01',
        period_end: '2026-09-30',
        status: 'VALIDATED',
        total_employees: 5,
        total_gross: 250000,
        total_deductions: 30000,
        total_net: 220000,
        computed_at: new Date().toISOString(),
        validated_at: new Date().toISOString(),
        paid_at: null,
        created_by: mockPayrollManager.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      const valRes = await request(app)
        .post('/api/v1/payruns/00000000-0000-0000-0000-000000000601/validate')
        .set('Authorization', 'Bearer valid-jwt');
      expect(valRes.status).toBe(200);
      expect(valRes.body.data.status).toBe('VALIDATED');

      // Mark Paid
      vi.spyOn(payrollService, 'markPaid').mockResolvedValue({
        id: '00000000-0000-0000-0000-000000000601',
        company_id: '00000000-0000-0000-0000-000000000010',
        salary_structure_id: '00000000-0000-0000-0000-000000000401',
        name: 'September 2026 Payroll Batch',
        period_start: '2026-09-01',
        period_end: '2026-09-30',
        status: 'PAID',
        total_employees: 5,
        total_gross: 250000,
        total_deductions: 30000,
        total_net: 220000,
        computed_at: new Date().toISOString(),
        validated_at: new Date().toISOString(),
        paid_at: new Date().toISOString(),
        created_by: mockPayrollManager.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      const paidRes = await request(app)
        .post('/api/v1/payruns/00000000-0000-0000-0000-000000000601/mark-paid')
        .set('Authorization', 'Bearer valid-jwt');
      expect(paidRes.status).toBe(200);
      expect(paidRes.body.data.status).toBe('PAID');
    });
  });
});
