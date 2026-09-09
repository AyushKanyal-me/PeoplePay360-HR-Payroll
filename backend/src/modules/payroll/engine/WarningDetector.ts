import { Employee } from '../../employees/employees.types.js';
import { Contract } from '../../contracts/contracts.types.js';

export interface DetectedWarning {
  employeeId?: string;
  type: 'MISSING_BANK_DETAILS' | 'DUPLICATE_PAYSLIP' | 'MISSING_CONTRACT' | 'MULTIPLE_ACTIVE_CONTRACTS' | 'MISSING_ATTENDANCE' | 'MISSING_CHECKOUT';
  severity: 'INFO' | 'WARNING' | 'ERROR';
  message: string;
}

export class WarningDetector {
  detect(
    employee: Employee,
    contract: Contract | null,
    periodStart: string,
    periodEnd: string,
    actualWorkedDays: number,
    missingCheckouts: number,
    netSalary: number
  ): DetectedWarning[] {
    const warnings: DetectedWarning[] = [];

    // 1. Missing Contract
    if (!contract) {
      warnings.push({
        employeeId: employee.id,
        type: 'MISSING_CONTRACT',
        severity: 'ERROR',
        message: `No active employment contract found for ${employee.first_name} ${employee.last_name} during period ${periodStart} to ${periodEnd}`
      });
      return warnings;
    }

    // 2. Missing Bank Details
    if (!employee.bank_account_number || employee.bank_account_number.trim() === '') {
      warnings.push({
        employeeId: employee.id,
        type: 'MISSING_BANK_DETAILS',
        severity: 'WARNING',
        message: `Employee ${employee.first_name} ${employee.last_name} is missing bank account details`
      });
    }

    // 3. Contract ending during period
    if (contract.end_date && contract.end_date <= periodEnd && contract.end_date >= periodStart) {
      warnings.push({
        employeeId: employee.id,
        type: 'MISSING_CONTRACT',
        severity: 'INFO',
        message: `Contract for ${employee.first_name} ${employee.last_name} ends on ${contract.end_date} during this payrun period`
      });
    }

    // 4. Missing Attendance
    if (actualWorkedDays === 0) {
      warnings.push({
        employeeId: employee.id,
        type: 'MISSING_ATTENDANCE',
        severity: 'WARNING',
        message: `Zero attendance records logged for ${employee.first_name} ${employee.last_name} in payroll period`
      });
    }

    // 5. Missing Checkouts
    if (missingCheckouts > 0) {
      warnings.push({
        employeeId: employee.id,
        type: 'MISSING_CHECKOUT',
        severity: 'WARNING',
        message: `${missingCheckouts} attendance record(s) with missing check-out detected for ${employee.first_name} ${employee.last_name}`
      });
    }

    // 6. Negative Net Salary
    if (netSalary < 0) {
      warnings.push({
        employeeId: employee.id,
        type: 'MISSING_CONTRACT',
        severity: 'ERROR',
        message: `Computed net salary is negative (${netSalary} INR) for ${employee.first_name} ${employee.last_name}`
      });
    }

    return warnings;
  }
}
