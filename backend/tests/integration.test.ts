import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { authService } from '../src/modules/auth/auth.service.js';
import { SafeFormulaEvaluator } from '../src/modules/salary/salary.evaluator.js';
import { SalaryRuleEvaluator } from '../src/modules/payroll/engine/SalaryRuleEvaluator.js';
import { DeductionCalculator } from '../src/modules/payroll/engine/DeductionCalculator.js';
import { generatePayslipPdfBuffer } from '../src/utils/pdf.js';
import { AuthenticatedUser } from '../src/types/auth.js';

describe('FINAL INTEGRATION TEST SUITE — PEOPLEPAY360', () => {
  // Test Tenants & Users
  const companyA = '00000000-0000-0000-0000-000000000010';
  const companyB = '00000000-0000-0000-0000-000000000020';

  const adminUser: AuthenticatedUser = {
    id: '00000000-0000-0000-0000-000000000001',
    authUserId: '00000000-0000-0000-0000-000000000002',
    email: 'admin@company-a.com',
    roles: ['ADMIN'],
    isActive: true,
    companyId: companyA,
    employeeId: '00000000-0000-0000-0000-000000000101'
  };

  const hrManagerUser: AuthenticatedUser = {
    id: '00000000-0000-0000-0000-000000000003',
    authUserId: '00000000-0000-0000-0000-000000000004',
    email: 'hrmanager@company-a.com',
    roles: ['HR_MANAGER'],
    isActive: true,
    companyId: companyA,
    employeeId: '00000000-0000-0000-0000-000000000102'
  };

  const hrPayrollManagerUser: AuthenticatedUser = {
    id: '00000000-0000-0000-0000-000000000005',
    authUserId: '00000000-0000-0000-0000-000000000006',
    email: 'payrollmgr@company-a.com',
    roles: ['HR_PAYROLL_MANAGER'],
    isActive: true,
    companyId: companyA,
    employeeId: '00000000-0000-0000-0000-000000000103'
  };

  const hrPayrollUser: AuthenticatedUser = {
    id: '00000000-0000-0000-0000-000000000007',
    authUserId: '00000000-0000-0000-0000-000000000008',
    email: 'payrolluser@company-a.com',
    roles: ['HR_PAYROLL_USER'],
    isActive: true,
    companyId: companyA,
    employeeId: '00000000-0000-0000-0000-000000000104'
  };

  const employeeA: AuthenticatedUser = {
    id: '00000000-0000-0000-0000-000000000009',
    authUserId: '00000000-0000-0000-0000-000000000010',
    email: 'emp.a@company-a.com',
    roles: ['EMPLOYEE'],
    isActive: true,
    companyId: companyA,
    employeeId: '00000000-0000-0000-0000-000000000105'
  };

  const employeeB: AuthenticatedUser = {
    id: '00000000-0000-0000-0000-000000000011',
    authUserId: '00000000-0000-0000-0000-000000000012',
    email: 'emp.b@company-b.com',
    roles: ['EMPLOYEE'],
    isActive: true,
    companyId: companyB,
    employeeId: '00000000-0000-0000-0000-000000000201'
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // =============================================================
  // 1. AUTHENTICATION INTEGRATION TESTS
  // =============================================================
  describe('1. Authentication Verification', () => {
    it('rejects request without token (401)', async () => {
      const res = await request(app).get('/api/v1/employees');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects request with invalid token format (401)', async () => {
      const res = await request(app)
        .get('/api/v1/employees')
        .set('Authorization', 'InvalidTokenStructure');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects request with expired or invalid token (401)', async () => {
      vi.spyOn(authService, 'validateToken').mockRejectedValue(new Error('Token expired'));
      const res = await request(app)
        .get('/api/v1/employees')
        .set('Authorization', 'Bearer expired-jwt-token');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('accepts valid JWT and resolves current user context (/api/v1/auth/me)', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(adminUser);
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer valid-jwt');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.id).toBe(adminUser.id);
      expect(res.body.data.roles).toContain('ADMIN');
      expect(res.body.data.company_id).toBe(companyA);
    });
  });

  // =============================================================
  // 2. RBAC TEST MATRIX (ALLOW & DENY)
  // =============================================================
  describe('2. RBAC Matrix & Role Boundaries', () => {
    it('DENY: EMPLOYEE cannot access audit logs (403)', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(employeeA);
      const res = await request(app)
        .get('/api/v1/audit-logs')
        .set('Authorization', 'Bearer emp-jwt');
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('DENY: HR_MANAGER cannot validate a payrun (requires HR_PAYROLL_MANAGER or ADMIN) (403)', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(hrManagerUser);
      const res = await request(app)
        .post('/api/v1/payruns/00000000-0000-0000-0000-000000000601/validate')
        .set('Authorization', 'Bearer hrmanager-jwt');
      expect(res.status).toBe(403);
    });

    it('DENY: HR_PAYROLL_USER cannot mark a payrun as paid (requires HR_PAYROLL_MANAGER or ADMIN) (403)', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(hrPayrollUser);
      const res = await request(app)
        .post('/api/v1/payruns/00000000-0000-0000-0000-000000000601/mark-paid')
        .set('Authorization', 'Bearer payrolluser-jwt');
      expect(res.status).toBe(403);
    });

    it('ALLOW: HR_PAYROLL_MANAGER can compute payroll (200)', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(hrPayrollManagerUser);
      const res = await request(app)
        .post('/api/v1/payruns/00000000-0000-0000-0000-000000000601/compute')
        .set('Authorization', 'Bearer payrollmgr-jwt');
      expect(res.status).not.toBe(403);
    });

    it('ALLOW: ADMIN has full access across modules', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(adminUser);
      const res = await request(app)
        .get('/api/v1/companies')
        .set('Authorization', 'Bearer admin-jwt');
      expect(res.status).not.toBe(403);
    });
  });

  // =============================================================
  // 3. EMPLOYEE SELF-ACCESS BOUNDARY
  // =============================================================
  describe('3. Employee Self-Service Access Boundaries', () => {
    it('ALLOW: Employee A accessing their own employee profile', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(employeeA);
      const res = await request(app)
        .get(`/api/v1/employees/${employeeA.employeeId}`)
        .set('Authorization', 'Bearer emp-a-jwt');
      expect(res.status).not.toBe(403);
    });

    it('DENY: Employee A attempting to access Employee B private profile returns 403 Forbidden', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(employeeA);
      const res = await request(app)
        .get(`/api/v1/employees/${employeeB.employeeId}`)
        .set('Authorization', 'Bearer emp-a-jwt');
      expect(res.status).toBe(403);
      expect(res.body.error.message).toMatch(/Access denied/i);
    });
  });

  // =============================================================
  // 4. SALARY ENGINE DETERMINISTIC RULES & ARITHMETIC AST
  // =============================================================
  describe('4. Safe AST Formula Evaluation Engine (Zero eval / new Function)', () => {
    it('evaluates fixed and percentage rules deterministically', () => {
      const fixedResult = SafeFormulaEvaluator.evaluate('15000', {});
      expect(fixedResult).toBe(15000);

      const pctResult = SafeFormulaEvaluator.evaluate('BASIC * 0.40', { BASIC: 50000 });
      expect(pctResult).toBe(20000);
    });

    it('evaluates arithmetic sequence: BASIC (30000) + HRA (12000) + TRANSPORT (3000) = GROSS (45000)', () => {
      const gross = SafeFormulaEvaluator.evaluate('BASIC + HRA + TRANSPORT', {
        BASIC: 30000,
        HRA: 12000,
        TRANSPORT: 3000
      });
      expect(gross).toBe(45000);

      const pf = SafeFormulaEvaluator.evaluate('BASIC * 0.12', { BASIC: 30000 });
      expect(pf).toBe(3600);

      const net = SafeFormulaEvaluator.evaluate('GROSS - PF - PT', {
        GROSS: gross,
        PF: pf,
        PT: 200
      });
      expect(net).toBe(41200);
    });

    it('evaluates arithmetic expressions accurately', () => {
      const val = SafeFormulaEvaluator.evaluate('BASIC * 0.12 + 100', { BASIC: 30000 });
      expect(val).toBe(3700);
    });

    it('rejects malicious or invalid formula strings safely without executing code', () => {
      expect(() => SafeFormulaEvaluator.validate('process.exit()')).toThrow();
      expect(() => SafeFormulaEvaluator.validate('require("fs")')).toThrow();
      expect(() => SafeFormulaEvaluator.validate('import("os")')).toThrow();
      expect(() => SafeFormulaEvaluator.validate('10 + * 5')).toThrow();
    });
  });

  // =============================================================
  // 5. PAYROLL ENGINE & PRORATION COMPUTATION
  // =============================================================
  describe('5. Payroll Engine Deterministic Fixtures & Proration', () => {
    it('computes exact sequential rules: Basic = 30k, HRA = 12k, Transport = 3k => Gross = 45k', () => {
      const evaluator = new SalaryRuleEvaluator();
      const rules = [
        {
          sequence: 1,
          rule: {
            id: 'r-1',
            name: 'Basic Salary',
            code: 'BASIC',
            category: 'BASIC' as const,
            calculation_type: 'FIXED' as const,
            fixed_amount: 30000,
            percentage: null,
            formula: null,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        },
        {
          sequence: 2,
          rule: {
            id: 'r-2',
            name: 'House Rent Allowance',
            code: 'HRA',
            category: 'ALLOWANCE' as const,
            calculation_type: 'FIXED' as const,
            fixed_amount: 12000,
            percentage: null,
            formula: null,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        },
        {
          sequence: 3,
          rule: {
            id: 'r-3',
            name: 'Transport Allowance',
            code: 'TRANSPORT',
            category: 'ALLOWANCE' as const,
            calculation_type: 'FIXED' as const,
            fixed_amount: 3000,
            percentage: null,
            formula: null,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        },
        {
          sequence: 4,
          rule: {
            id: 'r-4',
            name: 'Gross Salary',
            code: 'GROSS',
            category: 'GROSS' as const,
            calculation_type: 'FORMULA' as const,
            fixed_amount: null,
            percentage: null,
            formula: 'BASIC + HRA + TRANSPORT',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        },
        {
          sequence: 5,
          rule: {
            id: 'r-5',
            name: 'Provident Fund',
            code: 'PF',
            category: 'DEDUCTION' as const,
            calculation_type: 'FORMULA' as const,
            fixed_amount: null,
            percentage: null,
            formula: 'BASIC * 0.12',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        },
        {
          sequence: 6,
          rule: {
            id: 'r-6',
            name: 'Net Salary',
            code: 'NET',
            category: 'NET' as const,
            calculation_type: 'FORMULA' as const,
            fixed_amount: null,
            percentage: null,
            formula: 'GROSS - PF',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }
      ];

      const { evaluatedRules, gross, deductions, net } = evaluator.evaluateSequence(rules, { WAGE: 45000 });

      expect(gross).toBe(45000);
      expect(deductions).toBe(3600);
      expect(net).toBe(41400);
      expect(evaluatedRules.length).toBe(6);
    });

    it('prorates unpaid leave deduction accurately: (wage / 22) * 2 unpaid days', () => {
      const deductionCalc = new DeductionCalculator();
      const unpaidDeduction = deductionCalc.calculateUnpaidLeaveDeduction(44000, 22, 2);
      expect(unpaidDeduction).toBe(4000);
    });
  });

  // =============================================================
  // 6. PDF RENDERING SNAPSHOT PRESERVATION
  // =============================================================
  describe('6. PDF Generation & Snapshot Preservation', () => {
    it('generates valid printable PDF buffer with binary header %PDF-', async () => {
      const mockPayslip: any = {
        company: {
          name: 'PeoplePay360 Enterprises',
          currency: 'INR'
        },
        employee: {
          first_name: 'Aarav',
          last_name: 'Mehta',
          work_email: 'aarav@company.com',
          department: 'Engineering',
          job_position: 'Software Engineer',
          bank_account_number: '123456789'
        },
        payslip: {
          id: 'ps-101',
          period_start: '2026-09-01',
          period_end: '2026-09-30',
          gross_salary: 45000,
          total_deductions: 3600,
          net_salary: 41400,
          worked_days: 22
        },
        items: [
          { name: 'Basic Salary', code: 'BASIC', category: 'BASIC', sequence: 1, amount: 30000 },
          { name: 'House Rent Allowance', code: 'HRA', category: 'ALLOWANCE', sequence: 2, amount: 12000 },
          { name: 'Transport Allowance', code: 'TRANSPORT', category: 'ALLOWANCE', sequence: 3, amount: 3000 },
          { name: 'Provident Fund', code: 'PF', category: 'DEDUCTION', sequence: 4, amount: 3600 }
        ]
      };

      const pdfBuffer = await generatePayslipPdfBuffer(mockPayslip);
      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
      expect(pdfBuffer.length).toBeGreaterThan(500);
      expect(pdfBuffer.toString('utf-8', 0, 5)).toBe('%PDF-');
    });
  });

  // =============================================================
  // 7. STANDARDIZED API ERROR RESPONSES
  // =============================================================
  describe('7. Standardized Error Response Envelope', () => {
    it('returns consistent JSON error envelope { success: false, error: { code, message } }', async () => {
      const res = await request(app).get('/api/v1/non-existent-route');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('code');
      expect(res.body.error).toHaveProperty('message');
    });
  });
});
