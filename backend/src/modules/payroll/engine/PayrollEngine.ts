import { ContractResolver } from './ContractResolver.js';
import { WorkingDaysCalculator } from './WorkingDaysCalculator.js';
import { AttendanceCalculator } from './AttendanceCalculator.js';
import { LeaveCalculator } from './LeaveCalculator.js';
import { DeductionCalculator } from './DeductionCalculator.js';
import { SalaryRuleEvaluator } from './SalaryRuleEvaluator.js';
import { WarningDetector, DetectedWarning } from './WarningDetector.js';
import { PayslipBuilder, BuiltPayslip } from './PayslipBuilder.js';
import { Employee } from '../../employees/employees.types.js';
import { SalaryStructure } from '../../salary/salary.types.js';

export interface EmployeePayrollResult {
  employeeId: string;
  success: boolean;
  payslip?: BuiltPayslip;
  warnings: DetectedWarning[];
  errorMessage?: string;
}

export interface PayrunComputationSummary {
  payrunId: string;
  totalEmployees: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  results: EmployeePayrollResult[];
  allWarnings: DetectedWarning[];
}

export class PayrollEngine {
  private contractResolver = new ContractResolver();
  private workingDaysCalc = new WorkingDaysCalculator();
  private attendanceCalc = new AttendanceCalculator();
  private leaveCalc = new LeaveCalculator();
  private deductionCalc = new DeductionCalculator();
  private ruleEvaluator = new SalaryRuleEvaluator();
  private warningDetector = new WarningDetector();
  private payslipBuilder = new PayslipBuilder();

  async computeEmployee(
    payrunId: string,
    employee: Employee,
    structure: SalaryStructure,
    periodStart: string,
    periodEnd: string
  ): Promise<EmployeePayrollResult> {
    const warnings: DetectedWarning[] = [];

    // 1. Resolve Contract
    const contract = await this.contractResolver.resolve(employee.id, periodStart, periodEnd);
    if (!contract) {
      const contractWarnings = this.warningDetector.detect(
        employee,
        null,
        periodStart,
        periodEnd,
        0,
        0,
        0
      );
      return {
        employeeId: employee.id,
        success: false,
        warnings: contractWarnings,
        errorMessage: `No active contract covering period ${periodStart} to ${periodEnd}`
      };
    }

    const wage = Number(contract.wage || 0);

    // 2. Working days calculation
    const scheduleDays = (contract.schedule as any)?.days?.map((d: any) => d.day_of_week) || [];
    const { workingDays: expectedWorkingDays } = this.workingDaysCalc.calculate(periodStart, periodEnd, scheduleDays);

    // 3. Attendance calculation
    const { actualWorkedDays, actualWorkedHours, missingCheckouts } = await this.attendanceCalc.calculate(
      employee.id,
      periodStart,
      periodEnd
    );

    // 4. Leave calculation
    const { approvedUnpaidLeaveDays } = await this.leaveCalc.calculate(
      employee.id,
      periodStart,
      periodEnd
    );

    // 5. Unpaid leave deduction
    const unpaidDeduction = this.deductionCalc.calculateUnpaidLeaveDeduction(
      wage,
      expectedWorkingDays,
      approvedUnpaidLeaveDays
    );

    // 6. Base Context
    const effectiveWorkedDays = actualWorkedDays > 0 ? actualWorkedDays : expectedWorkingDays - approvedUnpaidLeaveDays;
    const baseContext: Record<string, number> = {
      WAGE: wage,
      EXPECTED_DAYS: expectedWorkingDays,
      WORKED_DAYS: effectiveWorkedDays,
      UNPAID_DAYS: approvedUnpaidLeaveDays,
      UNPAID_DEDUCTION: unpaidDeduction
    };

    // 7. Evaluate Rules in Structure Sequence
    const rulesToEvaluate = (structure.rules || []).map((r) => ({
      rule: r.rule,
      sequence: r.sequence
    }));

    const { evaluatedRules, gross, deductions, net } = this.ruleEvaluator.evaluateSequence(
      rulesToEvaluate,
      baseContext
    );

    // 8. Warning Detection
    const detectedWarnings = this.warningDetector.detect(
      employee,
      contract,
      periodStart,
      periodEnd,
      actualWorkedDays,
      missingCheckouts,
      net
    );
    warnings.push(...detectedWarnings);

    // 9. Build Payslip Record
    const payslip = this.payslipBuilder.build(
      payrunId,
      employee.id,
      contract.id,
      structure.id,
      periodStart,
      periodEnd,
      effectiveWorkedDays,
      actualWorkedHours,
      gross,
      deductions,
      net,
      evaluatedRules
    );

    return {
      employeeId: employee.id,
      success: true,
      payslip,
      warnings
    };
  }

  async computePayrun(
    payrunId: string,
    employees: Employee[],
    structure: SalaryStructure,
    periodStart: string,
    periodEnd: string
  ): Promise<PayrunComputationSummary> {
    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;
    const results: EmployeePayrollResult[] = [];
    const allWarnings: DetectedWarning[] = [];

    for (const emp of employees) {
      const res = await this.computeEmployee(payrunId, emp, structure, periodStart, periodEnd);
      results.push(res);
      allWarnings.push(...res.warnings);

      if (res.success && res.payslip) {
        totalGross += res.payslip.grossSalary;
        totalDeductions += res.payslip.totalDeductions;
        totalNet += res.payslip.netSalary;
      }
    }

    return {
      payrunId,
      totalEmployees: employees.length,
      totalGross: Number(totalGross.toFixed(2)),
      totalDeductions: Number(totalDeductions.toFixed(2)),
      totalNet: Number(totalNet.toFixed(2)),
      results,
      allWarnings
    };
  }
}
