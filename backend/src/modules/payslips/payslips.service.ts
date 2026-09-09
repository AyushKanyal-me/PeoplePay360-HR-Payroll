import { payslipsRepository, PayslipsRepository } from './payslips.repository.js';
import { generatePayslipPdfBuffer } from '../../utils/pdf.js';
import { EmailService } from '../../utils/email.js';
import { PayslipDetailed, PayslipQueryDto, DeliveryQueryDto } from './payslips.types.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../utils/errors.js';

export class PayslipsService {
  constructor(private readonly repo: PayslipsRepository = payslipsRepository) { }

  async getPayslips(query: PayslipQueryDto) {
    return this.repo.findAll(query);
  }

  async getPayslipById(id: string, userEmployeeId?: string | null, isPrivileged = false): Promise<PayslipDetailed> {
    const payslip = await this.repo.findById(id);
    if (!payslip) {
      throw new NotFoundError(`Payslip with ID '${id}' not found`);
    }

    if (!isPrivileged && userEmployeeId && payslip.employee_id !== userEmployeeId) {
      throw new ForbiddenError('You can only access your own payslip');
    }

    return payslip;
  }

  async generatePdf(payslipId: string, userEmployeeId?: string | null, isPrivileged = false): Promise<Buffer> {
    const payslip = await this.getPayslipById(payslipId, userEmployeeId, isPrivileged);

    const pdfData = {
      company: {
        name: payslip.payrun?.company?.name || 'PeoplePay360',
        currency: payslip.payrun?.company?.currency || 'INR',
        tax_id: payslip.payrun?.company?.tax_id
      },
      employee: {
        id: payslip.employee?.id || payslip.employee_id,
        first_name: payslip.employee?.first_name || 'Employee',
        last_name: payslip.employee?.last_name || '',
        work_email: payslip.employee?.work_email || '',
        department: payslip.employee?.department?.name,
        job_position: payslip.employee?.job_position?.title,
        bank_account_number: payslip.employee?.bank_account_number
      },
      payslip: {
        id: payslip.id,
        period_start: payslip.period_start,
        period_end: payslip.period_end,
        worked_days: payslip.worked_days,
        worked_hours: payslip.worked_hours,
        gross_salary: Number(payslip.gross_salary),
        total_deductions: Number(payslip.total_deductions),
        net_salary: Number(payslip.net_salary),
        generated_at: payslip.generated_at
      },
      items: (payslip.items || []).map((i) => ({
        name: i.name,
        code: i.code,
        category: i.category,
        amount: Number(i.amount)
      }))
    };

    return generatePayslipPdfBuffer(pdfData);
  }

  async sendPayslipEmail(payslipId: string): Promise<{ success: boolean; deliveryId: string }> {
    const payslip = await this.repo.findById(payslipId);
    if (!payslip) {
      throw new NotFoundError(`Payslip with ID '${payslipId}' not found`);
    }

    const email = payslip.employee?.work_email;
    if (!email) {
      throw new BadRequestError('Employee does not have a valid work email configured');
    }

    try {
      const pdfBuffer = await this.generatePdf(payslipId, null, true);
      const companyName = payslip.payrun?.company?.name || 'PeoplePay360';

      await EmailService.sendEmail({
        to: email,
        subject: `Salary Payslip for Period ${payslip.period_start} to ${payslip.period_end} — ${companyName}`,
        html: `
          <p>Dear ${payslip.employee?.first_name},</p>
          <p>Your salary payslip for the period <strong>${payslip.period_start}</strong> to <strong>${payslip.period_end}</strong> has been generated.</p>
          <p><strong>Net Payable:</strong> ${payslip.payrun?.company?.currency || 'INR'} ${payslip.net_salary}</p>
          <p>Please find your official PDF payslip attached to this email.</p>
          <br/>
          <p>Warm regards,<br/>Payroll & HR Team<br/>${companyName}</p>
        `,
        attachments: [
          {
            filename: `payslip-${payslip.period_start}-${payslip.period_end}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      });

      const delivery = await this.repo.recordDelivery(payslipId, email, 'SENT');
      return { success: true, deliveryId: delivery.id };
    } catch (err: any) {
      await this.repo.recordDelivery(payslipId, email, 'FAILED', err.message);
      throw new BadRequestError(`Email delivery failed: ${err.message}`);
    }
  }

  async sendBulkPayrunPayslips(payrunId: string): Promise<{ total: number; sent: number; failed: number }> {
    const payslips = await this.repo.findPayslipsByPayrunId(payrunId);
    if (payslips.length === 0) {
      throw new BadRequestError(`No generated payslips found for payrun ID '${payrunId}'`);
    }

    let sent = 0;
    let failed = 0;

    for (const ps of payslips) {
      try {
        await this.sendPayslipEmail(ps.id);
        sent++;
      } catch {
        failed++;
      }
    }

    return { total: payslips.length, sent, failed };
  }

  async getDeliveries(query: DeliveryQueryDto) {
    return this.repo.findAllDeliveries(query);
  }
}

export const payslipsService = new PayslipsService();
