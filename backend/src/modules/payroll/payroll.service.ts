import { payrollRepository, PayrollRepository } from './payroll.repository.js';
import { PayrollEngine } from './engine/PayrollEngine.js';
import { CreatePayrunDto, PayrunQueryDto, EligibleEmployeesQueryDto, Payrun } from './payroll.types.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';
import { Employee } from '../employees/employees.types.js';

export class PayrollService {
  private engine = new PayrollEngine();

  constructor(private readonly repo: PayrollRepository = payrollRepository) {}

  async getPayruns(query: PayrunQueryDto) {
    return this.repo.findAll(query);
  }

  async getPayrunById(id: string): Promise<Payrun> {
    const payrun = await this.repo.findById(id);
    if (!payrun) {
      throw new NotFoundError(`Payrun with ID '${id}' not found`);
    }
    return payrun;
  }

  async getEligibleEmployees(query: EligibleEmployeesQueryDto) {
    return this.repo.findEligibleEmployees(
      query.salary_structure_id,
      query.period_start,
      query.period_end
    );
  }

  async createPayrun(dto: CreatePayrunDto, userId?: string): Promise<Payrun> {
    return this.repo.create(dto, userId);
  }

  async computePayrun(payrunId: string): Promise<Payrun> {
    const payrun = await this.getPayrunById(payrunId);

    // State transition check
    if (payrun.status !== 'DRAFT' && payrun.status !== 'COMPUTED') {
      throw new BadRequestError(`Cannot compute payrun in '${payrun.status}' state. Only DRAFT or COMPUTED batches can be computed.`);
    }

    if (!payrun.salary_structure) {
      throw new BadRequestError('Payrun is missing an associated salary structure');
    }

    const payrunEmployees = await this.repo.findPayrunEmployees(payrunId);
    if (payrunEmployees.length === 0) {
      throw new BadRequestError('No employees assigned to this payrun batch');
    }

    const employeesToCompute: Employee[] = payrunEmployees
      .map((pe) => pe.employee as unknown as Employee)
      .filter(Boolean);

    // Execute Payroll Engine
    const computationSummary = await this.engine.computePayrun(
      payrun.id,
      employeesToCompute,
      payrun.salary_structure,
      payrun.period_start,
      payrun.period_end
    );

    const validPayslips = computationSummary.results
      .filter((r) => r.success && r.payslip)
      .map((r) => r.payslip!);

    // Persist computation snapshot
    await this.repo.saveComputationResults(
      payrun.id,
      {
        totalGross: computationSummary.totalGross,
        totalDeductions: computationSummary.totalDeductions,
        totalNet: computationSummary.totalNet
      },
      validPayslips,
      computationSummary.allWarnings
    );

    return this.getPayrunById(payrunId);
  }

  async validatePayrun(payrunId: string): Promise<Payrun> {
    const payrun = await this.getPayrunById(payrunId);

    if (payrun.status !== 'COMPUTED') {
      throw new BadRequestError(`Cannot validate payrun in '${payrun.status}' state. Batch must be COMPUTED first.`);
    }

    return this.repo.updateStatus(payrunId, 'VALIDATED', {
      validated_at: new Date().toISOString()
    });
  }

  async markPaid(payrunId: string): Promise<Payrun> {
    const payrun = await this.getPayrunById(payrunId);

    if (payrun.status !== 'VALIDATED') {
      throw new BadRequestError(`Cannot mark payrun as paid in '${payrun.status}' state. Batch must be VALIDATED first.`);
    }

    return this.repo.updateStatus(payrunId, 'PAID', {
      paid_at: new Date().toISOString()
    });
  }

  async cancelPayrun(payrunId: string): Promise<Payrun> {
    const payrun = await this.getPayrunById(payrunId);

    if (payrun.status !== 'DRAFT' && payrun.status !== 'COMPUTED') {
      throw new BadRequestError(`Cannot cancel payrun in '${payrun.status}' state. Finalized or paid batches cannot be cancelled.`);
    }

    return this.repo.updateStatus(payrunId, 'CANCELLED');
  }

  async getWarnings(payrunId: string) {
    await this.getPayrunById(payrunId);
    return this.repo.findWarnings(payrunId);
  }
}

export const payrollService = new PayrollService();
