import { supabaseAdminClient } from '../../config/supabase.js';
import { DashboardFilterDto, AttendanceOverviewFilterDto } from './dashboard.schema.js';

export class DashboardRepository {
  async getEmployeesForCompany(companyId: string, filters?: DashboardFilterDto) {
    let query = supabaseAdminClient
      .from('employees')
      .select('id, employee_code, first_name, last_name, status, employee_type, department_id, bank_account_number, departments(id, name, code)')
      .eq('company_id', companyId);

    if (filters?.departmentId) {
      query = query.eq('department_id', filters.departmentId);
    }
    if (filters?.employeeType) {
      query = query.eq('employee_type', filters.employeeType);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as any[];
  }

  async getPayrunsForCompany(companyId: string, filters?: DashboardFilterDto) {
    let query = supabaseAdminClient
      .from('payruns')
      .select('id, name, period_start, period_end, status, total_employees, total_gross, total_deductions, total_net')
      .eq('company_id', companyId)
      .neq('status', 'CANCELLED');

    if (filters?.periodStart) {
      query = query.gte('period_start', filters.periodStart);
    }
    if (filters?.periodEnd) {
      query = query.lte('period_end', filters.periodEnd);
    }

    const { data, error } = await query.order('period_start', { ascending: true });
    if (error) throw error;
    return (data || []) as any[];
  }

  async getPayslipsForCompany(companyId: string, filters?: DashboardFilterDto) {
    let query = supabaseAdminClient
      .from('payslips')
      .select(`
        id,
        gross_salary,
        total_deductions,
        net_salary,
        status,
        payrun_id,
        employee_id,
        payruns!inner (
          id,
          company_id,
          status,
          period_start,
          period_end
        ),
        employees!inner (
          id,
          company_id,
          department_id,
          employee_type
        )
      `)
      .eq('payruns.company_id', companyId)
      .neq('payruns.status', 'CANCELLED');

    if (filters?.departmentId) {
      query = query.eq('employees.department_id', filters.departmentId);
    }
    if (filters?.employeeType) {
      query = query.eq('employees.employee_type', filters.employeeType);
    }
    if (filters?.periodStart) {
      query = query.gte('payruns.period_start', filters.periodStart);
    }
    if (filters?.periodEnd) {
      query = query.lte('payruns.period_end', filters.periodEnd);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as any[];
  }

  async getTimeOffMetricsForCompany(companyId: string) {
    // 1. Pending requests
    const { data: pendingRequests, error: reqErr } = await supabaseAdminClient
      .from('time_off_requests')
      .select(`
        id,
        status,
        employees!inner (
          company_id
        )
      `)
      .eq('employees.company_id', companyId)
      .eq('status', 'PENDING');

    if (reqErr) throw reqErr;

    // 2. Approved requests
    const { data: approvedRequests, error: appErr } = await supabaseAdminClient
      .from('time_off_requests')
      .select(`
        id,
        status,
        employees!inner (
          company_id
        )
      `)
      .eq('employees.company_id', companyId)
      .eq('status', 'APPROVED');

    if (appErr) throw appErr;

    // 3. Active allocations
    const { data: activeAllocations, error: allocErr } = await supabaseAdminClient
      .from('time_off_allocations')
      .select(`
        id,
        status,
        employees!inner (
          company_id
        )
      `)
      .eq('employees.company_id', companyId)
      .eq('status', 'ACTIVE');

    if (allocErr) throw allocErr;

    return {
      pendingRequestsCount: pendingRequests?.length || 0,
      approvedRequestsCount: approvedRequests?.length || 0,
      activeAllocationsCount: activeAllocations?.length || 0
    };
  }

  async getDepartmentsForCompany(companyId: string) {
    const { data, error } = await supabaseAdminClient
      .from('departments')
      .select('id, name, code')
      .eq('company_id', companyId)
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []) as any[];
  }

  async getActiveContractsForCompany(companyId: string) {
    const { data, error } = await supabaseAdminClient
      .from('contracts')
      .select(`
        id,
        employee_id,
        department_id,
        wage,
        status,
        employees!inner (
          company_id,
          status
        )
      `)
      .eq('employees.company_id', companyId)
      .eq('status', 'ACTIVE')
      .eq('employees.status', 'ACTIVE');

    if (error) throw error;
    return (data || []) as any[];
  }

  async getAttendanceRecords(companyId: string, filters?: AttendanceOverviewFilterDto) {
    let query = supabaseAdminClient
      .from('attendance')
      .select(`
        id,
        attendance_date,
        worked_hours,
        overtime_hours,
        status,
        employees!inner (
          id,
          company_id,
          department_id,
          employee_type
        )
      `)
      .eq('employees.company_id', companyId);

    if (filters?.startDate) {
      query = query.gte('attendance_date', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('attendance_date', filters.endDate);
    }
    if (filters?.departmentId) {
      query = query.eq('employees.department_id', filters.departmentId);
    }
    if (filters?.employeeType) {
      query = query.eq('employees.employee_type', filters.employeeType);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as any[];
  }

  async getExpiringContracts(companyId: string, daysAhead: number = 30) {
    const today = new Date().toISOString().split('T')[0];
    const targetDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data, error } = await supabaseAdminClient
      .from('contracts')
      .select(`
        id,
        start_date,
        end_date,
        status,
        employees!inner (
          id,
          company_id,
          employee_code,
          first_name,
          last_name
        )
      `)
      .eq('employees.company_id', companyId)
      .eq('status', 'ACTIVE')
      .gte('end_date', today)
      .lte('end_date', targetDate)
      .order('end_date', { ascending: true });

    if (error) throw error;
    return (data || []) as any[];
  }

  async getPendingTimeOffRequests(companyId: string) {
    const { data, error } = await supabaseAdminClient
      .from('time_off_requests')
      .select(`
        id,
        start_date,
        end_date,
        duration,
        status,
        time_off_types (
          name
        ),
        employees!inner (
          id,
          company_id,
          employee_code,
          first_name,
          last_name
        )
      `)
      .eq('employees.company_id', companyId)
      .eq('status', 'PENDING')
      .order('start_date', { ascending: true });

    if (error) throw error;
    return (data || []) as any[];
  }

  async getUnresolvedPayrollWarnings(companyId: string) {
    const { data, error } = await supabaseAdminClient
      .from('payroll_warnings')
      .select(`
        id,
        type,
        severity,
        message,
        is_resolved,
        payrun_id,
        payruns!inner (
          id,
          name,
          company_id
        ),
        employees (
          id,
          first_name,
          last_name
        )
      `)
      .eq('payruns.company_id', companyId)
      .eq('is_resolved', false);

    if (error) throw error;
    return (data || []) as any[];
  }
}

export const dashboardRepository = new DashboardRepository();
