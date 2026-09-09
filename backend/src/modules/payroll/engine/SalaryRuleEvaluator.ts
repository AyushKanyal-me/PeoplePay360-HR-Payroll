import { SafeFormulaEvaluator } from '../../salary/salary.evaluator.js';
import { SalaryRule } from '../../salary/salary.types.js';

export interface EvaluatedRuleResult {
  rule: SalaryRule;
  sequence: number;
  amount: number;
  calculationSnapshot: Record<string, unknown>;
}

export class SalaryRuleEvaluator {
  evaluateSequence(
    rules: { rule: SalaryRule; sequence: number }[],
    baseContext: Record<string, number>
  ): { evaluatedRules: EvaluatedRuleResult[]; finalContext: Record<string, number>; gross: number; deductions: number; net: number } {
    const context: Record<string, number> = { ...baseContext };
    const evaluatedRules: EvaluatedRuleResult[] = [];

    let totalGross = 0;
    let totalDeductions = 0;

    // Evaluate in strict ascending sequence
    for (const { rule, sequence } of rules) {
      let amount = 0;
      let snapshotDetail: Record<string, unknown> = {};

      switch (rule.calculation_type) {
        case 'FIXED':
          amount = Number(rule.fixed_amount || 0);
          snapshotDetail = { type: 'FIXED', value: amount };
          break;

        case 'PERCENTAGE': {
          const base = context['BASIC'] ?? context['GROSS'] ?? context['WAGE'] ?? 0;
          const pct = Number(rule.percentage || 0);
          amount = Number(((base * pct) / 100).toFixed(2));
          snapshotDetail = { type: 'PERCENTAGE', base, percentage: pct, calculated: amount };
          break;
        }

        case 'FORMULA': {
          if (rule.formula) {
            amount = SafeFormulaEvaluator.evaluate(rule.formula, context);
            snapshotDetail = { type: 'FORMULA', formula: rule.formula, result: amount };
          }
          break;
        }
      }

      // Add to context with rule code
      context[rule.code] = amount;

      if (rule.category === 'BASIC' || rule.category === 'ALLOWANCE' || rule.category === 'GROSS') {
        if (rule.category !== 'GROSS') {
          totalGross += amount;
        }
      } else if (rule.category === 'DEDUCTION') {
        totalDeductions += amount;
      }

      evaluatedRules.push({
        rule,
        sequence,
        amount,
        calculationSnapshot: snapshotDetail
      });
    }

    // Determine gross and net if not explicitly overridden
    const gross = context['GROSS'] !== undefined ? context['GROSS'] : Number(totalGross.toFixed(2));
    const deductions = context['DEDUCTIONS'] !== undefined ? context['DEDUCTIONS'] : Number(totalDeductions.toFixed(2));
    const net = context['NET'] !== undefined ? context['NET'] : Number((gross - deductions).toFixed(2));

    return {
      evaluatedRules,
      finalContext: context,
      gross,
      deductions,
      net
    };
  }
}
