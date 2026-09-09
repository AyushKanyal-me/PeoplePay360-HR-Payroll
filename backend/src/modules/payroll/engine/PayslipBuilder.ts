import { EvaluatedRuleResult } from './SalaryRuleEvaluator.js';

export interface BuiltPayslip {
  payrunId: string;
  employeeId: string;
  contractId: string | null;
  salaryStructureId: string;
  periodStart: string;
  periodEnd: string;
  workedDays: number;
  workedHours: number;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  status: 'GENERATED';
  items: {
    salary_rule_id: string;
    name: string;
    code: string;
    category: string;
    sequence: number;
    amount: number;
    calculation_snapshot: Record<string, unknown>;
  }[];
}

export class PayslipBuilder {
  build(
    payrunId: string,
    employeeId: string,
    contractId: string | null,
    salaryStructureId: string,
    periodStart: string,
    periodEnd: string,
    workedDays: number,
    workedHours: number,
    gross: number,
    deductions: number,
    net: number,
    evaluatedRules: EvaluatedRuleResult[]
  ): BuiltPayslip {
    return {
      payrunId,
      employeeId,
      contractId,
      salaryStructureId,
      periodStart,
      periodEnd,
      workedDays,
      workedHours,
      grossSalary: gross,
      totalDeductions: deductions,
      netSalary: net,
      status: 'GENERATED',
      items: evaluatedRules.map((er) => ({
        salary_rule_id: er.rule.id,
        name: er.rule.name,
        code: er.rule.code,
        category: er.rule.category,
        sequence: er.sequence,
        amount: er.amount,
        calculation_snapshot: er.calculationSnapshot
      }))
    };
  }
}
