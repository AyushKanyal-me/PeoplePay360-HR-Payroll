import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { authService } from '../src/modules/auth/auth.service.js';
import { payslipsService } from '../src/modules/payslips/payslips.service.js';
import { EmailService } from '../src/utils/email.js';
import { generatePayslipPdfBuffer } from '../src/utils/pdf.js';
import { ForbiddenError, NotFoundError, BadRequestError } from '../src/utils/errors.js';
import { AuthenticatedUser } from '../src/types/auth.js';

describe('Phase 7 — Payslips, PDF & Email Delivery Test Suite', () => {
  const mockAdminUser: AuthenticatedUser = {
    id: '00000000-0000-0000-0000-000000000001',
    authUserId: '00000000-0000-0000-0000-000000000002',
    email: 'admin@peoplepay360.com',
    roles: ['ADMIN'],
    isActive: true,
    companyId: '00000000-0000-0000-0000-000000000010',
    employeeId: '00000000-0000-0000-0000-000000000100'
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

  const mockPayslipDetailed: any = {
    id: '00000000-0000-0000-0000-000000000701',
    payrun_id: '00000000-0000-0000-0000-000000000601',
    employee_id: '00000000-0000-0000-0000-000000000102',
    contract_id: '00000000-0000-0000-0000-000000000501',
    salary_structure_id: '00000000-0000-0000-0000-000000000401',
    period_start: '2026-09-01',
    period_end: '2026-09-30',
    worked_days: 22,
    worked_hours: 176,
    gross_salary: 50000,
    total_deductions: 6000,
    net_salary: 44000,
    status: 'GENERATED',
    pdf_path: null,
    generated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    employee: {
      id: '00000000-0000-0000-0000-000000000102',
      first_name: 'Aarav',
      last_name: 'Mehta',
      work_email: 'aarav@peoplepay360.com',
      bank_account_number: '123456789012',
      company_id: '00000000-0000-0000-0000-000000000010',
      department: { id: 'd-1', name: 'Engineering' },
      job_position: { id: 'p-1', title: 'Software Engineer' }
    },
    payrun: {
      id: '00000000-0000-0000-0000-000000000601',
      name: 'September 2026 Payroll',
      status: 'COMPUTED',
      company: { id: 'c-1', name: 'PeoplePay360 Corp', currency: 'INR', tax_id: 'TAX-001' }
    },
    items: [
      { id: 'item-1', name: 'Basic Salary', code: 'BASIC', category: 'BASIC', sequence: 10, amount: 30000 },
      { id: 'item-2', name: 'House Rent Allowance', code: 'HRA', category: 'ALLOWANCE', sequence: 20, amount: 15000 },
      { id: 'item-3', name: 'Meal Allowance', code: 'MEAL', category: 'ALLOWANCE', sequence: 30, amount: 5000 },
      { id: 'item-4', name: 'Provident Fund', code: 'PF', category: 'DEDUCTION', sequence: 40, amount: 6000 }
    ]
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------
  // 1. PAYSLIP RETRIEVAL & SELF-ACCESS
  // -------------------------------------------------------------
  describe('Payslip Retrieval & RBAC', () => {
    it('1. Employee self-access: EMPLOYEE can view own payslip', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockEmployeeUser);
      vi.spyOn(payslipsService, 'getPayslipById').mockResolvedValue(mockPayslipDetailed);

      const res = await request(app)
        .get('/api/v1/payslips/00000000-0000-0000-0000-000000000701')
        .set('Authorization', 'Bearer valid-jwt');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(mockPayslipDetailed.id);
      expect(res.body.data.net_salary).toBe(44000);
    });

    it('2. Unauthorized payslip access: EMPLOYEE cannot access another employee payslip (403 Forbidden)', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockEmployeeUser);
      vi.spyOn(payslipsService, 'getPayslipById').mockRejectedValue(
        new ForbiddenError('You can only access your own payslip')
      );

      const res = await request(app)
        .get('/api/v1/payslips/00000000-0000-0000-0000-000000000799')
        .set('Authorization', 'Bearer valid-jwt');

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('4. Missing payslip: returns 404 NotFoundError', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockAdminUser);
      vi.spyOn(payslipsService, 'getPayslipById').mockRejectedValue(
        new NotFoundError("Payslip with ID '00000000-0000-0000-0000-000000000999' not found")
      );

      const res = await request(app)
        .get('/api/v1/payslips/00000000-0000-0000-0000-000000000999')
        .set('Authorization', 'Bearer valid-jwt');

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  // -------------------------------------------------------------
  // 2. PDF GENERATION
  // -------------------------------------------------------------
  describe('PDF Generation Unit & Endpoint', () => {
    it('generatePayslipPdfBuffer generates valid binary PDF buffer starting with %PDF-', async () => {
      const pdfBuffer = await generatePayslipPdfBuffer({
        company: { name: 'PeoplePay360 Corp', currency: 'INR' },
        employee: {
          id: 'emp-1',
          first_name: 'Aarav',
          last_name: 'Mehta',
          work_email: 'aarav@peoplepay360.com'
        },
        payslip: {
          id: 'ps-1',
          period_start: '2026-09-01',
          period_end: '2026-09-30',
          worked_days: 22,
          worked_hours: 176,
          gross_salary: 50000,
          total_deductions: 6000,
          net_salary: 44000,
          generated_at: new Date().toISOString()
        },
        items: [
          { name: 'Basic Salary', code: 'BASIC', category: 'BASIC', amount: 30000 },
          { id: 'item-2', name: 'HRA', code: 'HRA', category: 'ALLOWANCE', amount: 20000 } as any
        ]
      });

      expect(pdfBuffer).toBeDefined();
      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
      expect(pdfBuffer.toString('utf-8', 0, 5)).toBe('%PDF-');
    });

    it('3. GET /api/v1/payslips/:id/pdf streams printable PDF with application/pdf header', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockAdminUser);
      const sampleBuffer = Buffer.from('%PDF-1.4 Mock PDF content');
      vi.spyOn(payslipsService, 'generatePdf').mockResolvedValue(sampleBuffer);

      const res = await request(app)
        .get('/api/v1/payslips/00000000-0000-0000-0000-000000000701/pdf')
        .set('Authorization', 'Bearer valid-jwt');

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/pdf');
    });
  });

  // -------------------------------------------------------------
  // 3. EMAIL DELIVERY & AUDIT
  // -------------------------------------------------------------
  describe('Email Delivery & Audit Log', () => {
    it('5. Email configuration failure: returns 400 BadRequestError with controlled message when unconfigured', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockAdminUser);
      vi.spyOn(payslipsService, 'sendPayslipEmail').mockRejectedValue(
        new BadRequestError('Email delivery is currently not configured on this server.')
      );

      const res = await request(app)
        .post('/api/v1/payslips/00000000-0000-0000-0000-000000000701/send-email')
        .set('Authorization', 'Bearer valid-jwt');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('BAD_REQUEST');
      expect(res.body.error.message).toContain('not configured');
    });

    it('6. Successful email delivery path: sends email and returns delivery ID', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockAdminUser);
      vi.spyOn(payslipsService, 'sendPayslipEmail').mockResolvedValue({
        success: true,
        deliveryId: '00000000-0000-0000-0000-000000000801'
      });

      const res = await request(app)
        .post('/api/v1/payslips/00000000-0000-0000-0000-000000000701/send-email')
        .set('Authorization', 'Bearer valid-jwt');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.deliveryId).toBe('00000000-0000-0000-0000-000000000801');
    });

    it('7. GET /api/v1/payslip-deliveries: returns delivery audit logs', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockAdminUser);
      vi.spyOn(payslipsService, 'getDeliveries').mockResolvedValue({
        data: [
          {
            id: '00000000-0000-0000-0000-000000000801',
            payslip_id: '00000000-0000-0000-0000-000000000701',
            email: 'aarav@peoplepay360.com',
            status: 'SENT',
            sent_at: new Date().toISOString(),
            error_message: null,
            created_at: new Date().toISOString()
          }
        ],
        total: 1
      });

      const res = await request(app)
        .get('/api/v1/payslip-deliveries')
        .set('Authorization', 'Bearer valid-jwt');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].status).toBe('SENT');
    });

    it('8. POST /api/v1/payruns/:id/send-payslips: triggers bulk payslip delivery for payrun', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockAdminUser);
      vi.spyOn(payslipsService, 'sendBulkPayrunPayslips').mockResolvedValue({
        total: 5,
        sent: 5,
        failed: 0
      });

      const res = await request(app)
        .post('/api/v1/payruns/00000000-0000-0000-0000-000000000601/send-payslips')
        .set('Authorization', 'Bearer valid-jwt');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sent).toBe(5);
    });
  });
});
