import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { authService } from '../src/modules/auth/auth.service.js';
import { salaryService } from '../src/modules/salary/salary.service.js';
import { SafeFormulaEvaluator } from '../src/modules/salary/salary.evaluator.js';
import { BadRequestError } from '../src/utils/errors.js';
import { AuthenticatedUser } from '../src/types/auth.js';
import { SalaryRule } from '../src/modules/salary/salary.types.js';

describe('Phase 5 — Salary Structures & Safe Rules Engine Test Suite', () => {
  const mockAdminUser: AuthenticatedUser = {
    id: '00000000-0000-0000-0000-000000000001',
    authUserId: '00000000-0000-0000-0000-000000000002',
    email: 'admin@peoplepay360.com',
    roles: ['ADMIN'],
    isActive: true,
    companyId: '00000000-0000-0000-0000-000000000010',
    employeeId: '00000000-0000-0000-0000-000000000100'
  };

  const mockPayrollManagerUser: AuthenticatedUser = {
    id: '00000000-0000-0000-0000-000000000007',
    authUserId: '00000000-0000-0000-0000-000000000008',
    email: 'payroll@peoplepay360.com',
    roles: ['HR_PAYROLL_MANAGER'],
    isActive: true,
    companyId: '00000000-0000-0000-0000-000000000010',
    employeeId: '00000000-0000-0000-0000-000000000107'
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
  // 1. SAFE FORMULA EVALUATOR (UNIT TESTS)
  // -------------------------------------------------------------
  describe('SafeFormulaEvaluator (No eval / No new Function)', () => {
    it('1. Fixed rule calculation: evaluates constant numbers and arithmetic properly', () => {
      const result = SafeFormulaEvaluator.evaluate('2000 + 500', {});
      expect(result).toBe(2500);
    });

    it('2. Percentage calculation: evaluates percentage formulas against context', () => {
      const context = { BASIC: 50000 };
      const result = SafeFormulaEvaluator.evaluate('BASIC * 0.40', context);
      expect(result).toBe(20000);
    });

    it('3. Sequential dependency evaluation: evaluates complex gross, deduction and net chains', () => {
      const context: Record<string, number> = {
        WAGE: 60000
      };

      // Step 1: Basic = 50% of Wage
      context['BASIC'] = SafeFormulaEvaluator.evaluate('WAGE * 0.50', context);
      expect(context['BASIC']).toBe(30000);

      // Step 2: HRA = 40% of Basic
      context['HRA'] = SafeFormulaEvaluator.evaluate('BASIC * 0.40', context);
      expect(context['HRA']).toBe(12000);

      // Step 3: Fixed Meal Allowance
      context['MEAL'] = 2000;

      // Step 4: Gross = Basic + HRA + Meal
      context['GROSS'] = SafeFormulaEvaluator.evaluate('BASIC + HRA + MEAL', context);
      expect(context['GROSS']).toBe(44000);

      // Step 5: PF = 12% of Basic
      context['PF'] = SafeFormulaEvaluator.evaluate('BASIC * 0.12', context);
      expect(context['PF']).toBe(3600);

      // Step 6: Net = Gross - PF
      context['NET'] = SafeFormulaEvaluator.evaluate('GROSS - PF', context);
      expect(context['NET']).toBe(40400);
    });

    it('4. Invalid formula rejection: rejects eval, process, window, statements, or illegal tokens', () => {
      expect(() => {
        SafeFormulaEvaluator.evaluate('eval("1+1")', {});
      }).toThrow(BadRequestError);

      expect(() => {
        SafeFormulaEvaluator.evaluate('BASIC; DROP TABLE users;', { BASIC: 100 });
      }).toThrow(BadRequestError);

      expect(() => {
        SafeFormulaEvaluator.evaluate('process.exit(1)', {});
      }).toThrow(BadRequestError);

      expect(() => {
        SafeFormulaEvaluator.evaluate('(10 + 20', {}); // Unclosed paren
      }).toThrow(BadRequestError);
    });

    it('5. Unknown variable rejection: throws BadRequestError when referencing unresolved variable', () => {
      const context = { BASIC: 50000 };
      expect(() => {
        SafeFormulaEvaluator.evaluate('BASIC + UNKNOWN_ALLOWANCE', context);
      }).toThrow(BadRequestError);
    });
  });

  // -------------------------------------------------------------
  // 2. SALARY SERVICE EVALUATION ENGINE
  // -------------------------------------------------------------
  describe('SalaryService Rule Evaluation Method', () => {
    it('evaluates FIXED, PERCENTAGE, and FORMULA rules properly', () => {
      const fixedRule: SalaryRule = {
        id: 'rule-1',
        name: 'Meal Allowance',
        code: 'MEAL',
        category: 'ALLOWANCE',
        calculation_type: 'FIXED',
        fixed_amount: 2500,
        percentage: null,
        formula: null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      expect(salaryService.evaluateRule(fixedRule, {}, 50000)).toBe(2500);

      const percentageRule: SalaryRule = {
        id: 'rule-2',
        name: 'House Rent Allowance',
        code: 'HRA',
        category: 'ALLOWANCE',
        calculation_type: 'PERCENTAGE',
        fixed_amount: null,
        percentage: 40,
        formula: null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      expect(salaryService.evaluateRule(percentageRule, { BASIC: 30000 }, 50000)).toBe(12000);

      const formulaRule: SalaryRule = {
        id: 'rule-3',
        name: 'Net Salary',
        code: 'NET',
        category: 'NET',
        calculation_type: 'FORMULA',
        fixed_amount: null,
        percentage: null,
        formula: 'GROSS - (PF + TAX)',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      expect(salaryService.evaluateRule(formulaRule, { GROSS: 50000, PF: 3600, TAX: 2000 })).toBe(44400);
    });
  });

  // -------------------------------------------------------------
  // 3. API ENDPOINTS & RBAC
  // -------------------------------------------------------------
  describe('Salary Structures & Rules API Endpoints', () => {
    it('GET /api/v1/salary-structures returns structures list', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockAdminUser);
      vi.spyOn(salaryService, 'getStructures').mockResolvedValue([
        {
          id: '00000000-0000-0000-0000-000000000401',
          company_id: '00000000-0000-0000-0000-000000000010',
          name: 'Standard Indian Payroll',
          code: 'IN_STD_01',
          description: 'Standard 7-rule structure',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          rules: []
        }
      ]);

      const res = await request(app)
        .get('/api/v1/salary-structures')
        .set('Authorization', 'Bearer valid-jwt');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].code).toBe('IN_STD_01');
    });

    it('6. Duplicate sequence rejection: POST /api/v1/salary-structures with duplicate sequence numbers returns 400 ValidationError', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockPayrollManagerUser);

      const res = await request(app)
        .post('/api/v1/salary-structures')
        .set('Authorization', 'Bearer valid-jwt')
        .send({
          company_id: '00000000-0000-0000-0000-000000000010',
          name: 'Invalid Duplicate Sequence Structure',
          code: 'DUP_SEQ',
          rules: [
            { salary_rule_id: '00000000-0000-0000-0000-000000000411', sequence: 10 },
            { salary_rule_id: '00000000-0000-0000-0000-000000000412', sequence: 10 } // DUPLICATE sequence 10!
          ]
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details[0].message).toContain('duplicate');
    });

    it('7. Unauthorized rule modification: EMPLOYEE role cannot create salary rules (403 Forbidden)', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockEmployeeUser);

      const res = await request(app)
        .post('/api/v1/salary-rules')
        .set('Authorization', 'Bearer valid-jwt')
        .send({
          name: 'Unauthorized Rule',
          code: 'UNAUTH',
          category: 'BASIC',
          calculation_type: 'FIXED',
          fixed_amount: 50000
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('POST /api/v1/salary-rules: HR_PAYROLL_MANAGER can create new formula salary rule', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockPayrollManagerUser);
      vi.spyOn(salaryService, 'createRule').mockResolvedValue({
        id: '00000000-0000-0000-0000-000000000499',
        name: 'Attendance Adjusted Basic',
        code: 'ATT_BASIC',
        category: 'BASIC',
        calculation_type: 'FORMULA',
        fixed_amount: null,
        percentage: null,
        formula: '(WAGE / 30) * WORKED_DAYS',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      const res = await request(app)
        .post('/api/v1/salary-rules')
        .set('Authorization', 'Bearer valid-jwt')
        .send({
          name: 'Attendance Adjusted Basic',
          code: 'ATT_BASIC',
          category: 'BASIC',
          calculation_type: 'FORMULA',
          formula: '(WAGE / 30) * WORKED_DAYS'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.code).toBe('ATT_BASIC');
      expect(res.body.data.calculation_type).toBe('FORMULA');
    });
  });
});
