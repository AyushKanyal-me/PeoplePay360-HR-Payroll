export interface DashboardKpis {
  headcount: {
    total: number;
    active: number;
    inactive: number;
    terminated: number;
    byType: Record<string, number>;
  };
  payroll: {
    totalNetSalaryPaid: number;
    totalGrossSalaryPaid: number;
    totalDeductions: number;
    payslipsGenerated: number;
    averageNetSalary: number;
    totalPayrunsCount: number;
  };
  timeOffHealth: {
    pendingRequests: number;
    approvedRequests: number;
    activeAllocations: number;
  };
}

export interface DepartmentSalaryItem {
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  headcount: number;
  activeContractCount: number;
  totalWage: number;
  averageWage: number;
  totalPaidNet: number;
  totalPaidGross: number;
}

export interface SalaryTrendItem {
  period: string; // YYYY-MM
  periodStart: string;
  periodEnd: string;
  totalGross: number;
  totalNet: number;
  totalDeductions: number;
  employeeCount: number;
  payrunCount: number;
}

export interface AttendanceOverview {
  period: {
    startDate: string;
    endDate: string;
  };
  totalRecords: number;
  breakdown: {
    present: number;
    absent: number;
    late: number;
    overtime: number;
    missingCheckout: number;
  };
  totalWorkedHours: number;
  totalOvertimeHours: number;
  attendanceRate: number; // percentage (present+late+overtime / total)
}

export interface OperationalAlerts {
  summary: {
    totalAlerts: number;
    missingBankDetailsCount: number;
    expiringContractsCount: number;
    pendingLeaveRequestsCount: number;
    unresolvedWarningsCount: number;
  };
  alerts: {
    missingBankDetails: Array<{
      employeeId: string;
      employeeCode: string;
      firstName: string;
      lastName: string;
      departmentName?: string | null;
    }>;
    expiringContracts: Array<{
      contractId: string;
      employeeId: string;
      employeeCode: string;
      employeeName: string;
      endDate: string;
      daysRemaining: number;
    }>;
    pendingLeaveRequests: Array<{
      requestId: string;
      employeeId: string;
      employeeName: string;
      timeOffTypeName: string;
      startDate: string;
      endDate: string;
      duration: number;
    }>;
    unresolvedWarnings: Array<{
      warningId: string;
      payrunId: string;
      payrunName?: string | null;
      employeeName?: string | null;
      type: string;
      severity: string;
      message: string;
    }>;
  };
}
