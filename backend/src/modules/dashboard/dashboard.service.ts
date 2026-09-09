import { DashboardRepository, dashboardRepository } from './dashboard.repository.js';
import { DashboardFilterDto, AttendanceOverviewFilterDto } from './dashboard.schema.js';
import {
  DashboardKpis,
  DepartmentSalaryItem,
  SalaryTrendItem,
  AttendanceOverview,
  OperationalAlerts
} from './dashboard.types.js';

export class DashboardService {
  constructor(private readonly repo: DashboardRepository = dashboardRepository) {}

  async getKpis(companyId: string, filters?: DashboardFilterDto): Promise<DashboardKpis> {
    const [employees, payruns, payslips, timeOff] = await Promise.all([
      this.repo.getEmployeesForCompany(companyId, filters),
      this.repo.getPayrunsForCompany(companyId, filters),
      this.repo.getPayslipsForCompany(companyId, filters),
      this.repo.getTimeOffMetricsForCompany(companyId)
    ]);

    // Headcount calculations
    let active = 0;
    let inactive = 0;
    let terminated = 0;
    const byType: Record<string, number> = {};

    for (const emp of employees) {
      if (emp.status === 'ACTIVE') active++;
      else if (emp.status === 'INACTIVE') inactive++;
      else if (emp.status === 'TERMINATED') terminated++;

      const empType = emp.employee_type || 'FULL_TIME';
      byType[empType] = (byType[empType] || 0) + 1;
    }

    // Payroll calculations
    let totalNetSalaryPaid = 0;
    let totalGrossSalaryPaid = 0;
    let totalDeductions = 0;
    let paidPayslipsCount = 0;

    for (const ps of payslips) {
      const payrun = (ps as any).payruns;
      if (payrun?.status === 'PAID') {
        totalNetSalaryPaid += Number(ps.net_salary || 0);
        totalGrossSalaryPaid += Number(ps.gross_salary || 0);
        totalDeductions += Number(ps.total_deductions || 0);
        paidPayslipsCount++;
      }
    }

    const averageNetSalary = paidPayslipsCount > 0
      ? Math.round((totalNetSalaryPaid / paidPayslipsCount) * 100) / 100
      : 0;

    return {
      headcount: {
        total: employees.length,
        active,
        inactive,
        terminated,
        byType
      },
      payroll: {
        totalNetSalaryPaid: Math.round(totalNetSalaryPaid * 100) / 100,
        totalGrossSalaryPaid: Math.round(totalGrossSalaryPaid * 100) / 100,
        totalDeductions: Math.round(totalDeductions * 100) / 100,
        payslipsGenerated: payslips.length,
        averageNetSalary,
        totalPayrunsCount: payruns.length
      },
      timeOffHealth: {
        pendingRequests: timeOff.pendingRequestsCount,
        approvedRequests: timeOff.approvedRequestsCount,
        activeAllocations: timeOff.activeAllocationsCount
      }
    };
  }

  async getSalaryByDepartment(companyId: string, filters?: DashboardFilterDto): Promise<DepartmentSalaryItem[]> {
    const [departments, employees, contracts, payslips] = await Promise.all([
      this.repo.getDepartmentsForCompany(companyId),
      this.repo.getEmployeesForCompany(companyId, filters),
      this.repo.getActiveContractsForCompany(companyId),
      this.repo.getPayslipsForCompany(companyId, filters)
    ]);

    // Map departments
    return departments.map((dept: any) => {
      // 1. Headcount in department
      const deptEmployees = employees.filter((e: any) => e.department_id === dept.id && e.status === 'ACTIVE');
      const headcount = deptEmployees.length;

      // 2. Contracts in department
      const deptContracts = contracts.filter((c: any) => c.department_id === dept.id);
      const activeContractCount = deptContracts.length;
      const totalWage = deptContracts.reduce((sum: number, c: any) => sum + Number(c.wage || 0), 0);
      const averageWage = activeContractCount > 0 ? Math.round((totalWage / activeContractCount) * 100) / 100 : 0;

      // 3. Paid payslips in department
      const deptPayslips = payslips.filter((ps: any) => {
        const emp = ps.employees;
        const payrun = ps.payruns;
        return emp?.department_id === dept.id && payrun?.status === 'PAID';
      });

      const totalPaidNet = deptPayslips.reduce((sum: number, ps: any) => sum + Number(ps.net_salary || 0), 0);
      const totalPaidGross = deptPayslips.reduce((sum: number, ps: any) => sum + Number(ps.gross_salary || 0), 0);

      return {
        departmentId: dept.id,
        departmentName: dept.name,
        departmentCode: dept.code,
        headcount,
        activeContractCount,
        totalWage: Math.round(totalWage * 100) / 100,
        averageWage,
        totalPaidNet: Math.round(totalPaidNet * 100) / 100,
        totalPaidGross: Math.round(totalPaidGross * 100) / 100
      };
    });
  }

  async getSalaryTrends(companyId: string, filters?: DashboardFilterDto): Promise<SalaryTrendItem[]> {
    const payruns = await this.repo.getPayrunsForCompany(companyId, filters);

    // Group payruns by period month (YYYY-MM)
    const monthlyGroups = new Map<string, {
      periodStart: string;
      periodEnd: string;
      totalGross: number;
      totalNet: number;
      totalDeductions: number;
      employeeCount: number;
      payrunCount: number;
    }>();

    for (const pr of payruns) {
      const monthKey = pr.period_start.substring(0, 7); // '2026-03'
      const existing = monthlyGroups.get(monthKey);

      if (existing) {
        existing.totalGross += Number(pr.total_gross || 0);
        existing.totalNet += Number(pr.total_net || 0);
        existing.totalDeductions += Number(pr.total_deductions || 0);
        existing.employeeCount += Number(pr.total_employees || 0);
        existing.payrunCount += 1;
        if (pr.period_end > existing.periodEnd) existing.periodEnd = pr.period_end;
        if (pr.period_start < existing.periodStart) existing.periodStart = pr.period_start;
      } else {
        monthlyGroups.set(monthKey, {
          periodStart: pr.period_start,
          periodEnd: pr.period_end,
          totalGross: Number(pr.total_gross || 0),
          totalNet: Number(pr.total_net || 0),
          totalDeductions: Number(pr.total_deductions || 0),
          employeeCount: Number(pr.total_employees || 0),
          payrunCount: 1
        });
      }
    }

    const result: SalaryTrendItem[] = [];
    for (const [period, data] of monthlyGroups.entries()) {
      result.push({
        period,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        totalGross: Math.round(data.totalGross * 100) / 100,
        totalNet: Math.round(data.totalNet * 100) / 100,
        totalDeductions: Math.round(data.totalDeductions * 100) / 100,
        employeeCount: data.employeeCount,
        payrunCount: data.payrunCount
      });
    }

    return result.sort((a, b) => a.period.localeCompare(b.period));
  }

  async getAttendanceOverview(companyId: string, filters?: AttendanceOverviewFilterDto): Promise<AttendanceOverview> {
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0] ?? '2026-01-01';
    const defaultEnd = now.toISOString().split('T')[0] ?? '2026-01-31';

    let computedStartDate: string = defaultStart;
    let computedEndDate: string = defaultEnd;
    if (filters && typeof filters.startDate === 'string') {
      computedStartDate = filters.startDate;
    }
    if (filters && typeof filters.endDate === 'string') {
      computedEndDate = filters.endDate;
    }

    const records = await this.repo.getAttendanceRecords(companyId, {
      ...filters,
      startDate: computedStartDate,
      endDate: computedEndDate
    });

    const breakdown = {
      present: 0,
      absent: 0,
      late: 0,
      overtime: 0,
      missingCheckout: 0
    };

    let totalWorkedHours = 0;
    let totalOvertimeHours = 0;

    for (const rec of records) {
      if (rec.status === 'PRESENT') breakdown.present++;
      else if (rec.status === 'ABSENT') breakdown.absent++;
      else if (rec.status === 'LATE') breakdown.late++;
      else if (rec.status === 'OVERTIME') breakdown.overtime++;
      else if (rec.status === 'MISSING_CHECKOUT') breakdown.missingCheckout++;

      totalWorkedHours += Number(rec.worked_hours || 0);
      totalOvertimeHours += Number(rec.overtime_hours || 0);
    }

    const totalRecords = records.length;
    const effectiveAttended = breakdown.present + breakdown.late + breakdown.overtime;
    const attendanceRate = totalRecords > 0
      ? Math.round((effectiveAttended / totalRecords) * 10000) / 100
      : 0;

    return {
      period: {
        startDate: computedStartDate,
        endDate: computedEndDate
      },
      totalRecords,
      breakdown,
      totalWorkedHours: Math.round(totalWorkedHours * 100) / 100,
      totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
      attendanceRate
    };
  }

  async getOperationalAlerts(companyId: string): Promise<OperationalAlerts> {
    const [employees, expiringContractsRaw, pendingRequestsRaw, warningsRaw] = await Promise.all([
      this.repo.getEmployeesForCompany(companyId),
      this.repo.getExpiringContracts(companyId, 30),
      this.repo.getPendingTimeOffRequests(companyId),
      this.repo.getUnresolvedPayrollWarnings(companyId)
    ]);

    // 1. Missing bank details for active employees
    const missingBankDetails = employees
      .filter((e: any) => e.status === 'ACTIVE' && (!e.bank_account_number || e.bank_account_number.trim() === ''))
      .map((e: any) => ({
        employeeId: e.id,
        employeeCode: e.employee_code,
        firstName: e.first_name,
        lastName: e.last_name,
        departmentName: e.departments?.name || null
      }));

    // 2. Expiring contracts within 30 days
    const todayMs = new Date().setHours(0, 0, 0, 0);
    const expiringContracts = expiringContractsRaw.map((c: any) => {
      const endMs = new Date(c.end_date).setHours(0, 0, 0, 0);
      const daysRemaining = Math.max(0, Math.ceil((endMs - todayMs) / (1000 * 60 * 60 * 24)));
      const emp = c.employees;
      return {
        contractId: c.id,
        employeeId: emp?.id,
        employeeCode: emp?.employee_code,
        employeeName: `${emp?.first_name || ''} ${emp?.last_name || ''}`.trim(),
        endDate: c.end_date,
        daysRemaining
      };
    });

    // 3. Pending leave requests
    const pendingLeaveRequests = pendingRequestsRaw.map((r: any) => {
      const emp = r.employees;
      return {
        requestId: r.id,
        employeeId: emp?.id,
        employeeName: `${emp?.first_name || ''} ${emp?.last_name || ''}`.trim(),
        timeOffTypeName: r.time_off_types?.name || 'General Leave',
        startDate: r.start_date,
        endDate: r.end_date,
        duration: Number(r.duration)
      };
    });

    // 4. Unresolved payroll warnings
    const unresolvedWarnings = warningsRaw.map((w: any) => {
      const emp = w.employees;
      return {
        warningId: w.id,
        payrunId: w.payrun_id,
        payrunName: w.payruns?.name || null,
        employeeName: emp ? `${emp.first_name} ${emp.last_name}`.trim() : null,
        type: w.type,
        severity: w.severity,
        message: w.message
      };
    });

    const totalAlerts =
      missingBankDetails.length +
      expiringContracts.length +
      pendingLeaveRequests.length +
      unresolvedWarnings.length;

    return {
      summary: {
        totalAlerts,
        missingBankDetailsCount: missingBankDetails.length,
        expiringContractsCount: expiringContracts.length,
        pendingLeaveRequestsCount: pendingLeaveRequests.length,
        unresolvedWarningsCount: unresolvedWarnings.length
      },
      alerts: {
        missingBankDetails,
        expiringContracts,
        pendingLeaveRequests,
        unresolvedWarnings
      }
    };
  }
}

export const dashboardService = new DashboardService();
