import { supabaseAdminClient } from '../../config/supabase.js';
import {
  Employee,
  EmployeeSmartCounts,
  CreateEmployeeDto,
  UpdateEmployeeDto,
  EmployeeQueryDto
} from './employees.types.js';
import { DatabaseError, ConflictError } from '../../utils/errors.js';

export class EmployeesRepository {
  async findAll(query: EmployeeQueryDto): Promise<{ data: Employee[]; total: number }> {
    let queryBuilder = supabaseAdminClient
      .from('employees')
      .select(`
        *,
        department:departments (id, name, code),
        job_position:job_positions (id, title, code),
        manager:employees!employees_manager_id_fkey (id, first_name, last_name, work_email),
        schedule:working_schedules (id, name, hours_per_week)
      `, { count: 'exact' });

    if (query.company_id) {
      queryBuilder = queryBuilder.eq('company_id', query.company_id);
    }

    if (query.department_id) {
      queryBuilder = queryBuilder.eq('department_id', query.department_id);
    }

    if (query.status) {
      queryBuilder = queryBuilder.eq('status', query.status);
    }

    if (query.search) {
      queryBuilder = queryBuilder.or(
        `first_name.ilike.%${query.search}%,last_name.ilike.%${query.search}%,work_email.ilike.%${query.search}%`
      );
    }

    const offset = (query.page - 1) * query.limit;
    queryBuilder = queryBuilder
      .order('first_name', { ascending: true })
      .range(offset, offset + query.limit - 1);

    const { data, count, error } = await queryBuilder;

    if (error) {
      throw new DatabaseError(`Failed to fetch employees: ${error.message}`, [error]);
    }

    return {
      data: (data || []) as Employee[],
      total: count || 0
    };
  }

  async findById(id: string): Promise<Employee | null> {
    const { data, error } = await supabaseAdminClient
      .from('employees')
      .select(`
        *,
        department:departments (id, name, code),
        job_position:job_positions (id, title, code),
        manager:employees!employees_manager_id_fkey (id, first_name, last_name, work_email),
        schedule:working_schedules (id, name, hours_per_week)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new DatabaseError(`Failed to fetch employee: ${error.message}`, [error]);
    }

    return data as Employee | null;
  }

  async create(dto: CreateEmployeeDto): Promise<Employee> {
    const { data, error } = await supabaseAdminClient
      .from('employees')
      .insert(dto)
      .select(`
        *,
        department:departments (id, name, code),
        job_position:job_positions (id, title, code),
        manager:employees!employees_manager_id_fkey (id, first_name, last_name, work_email),
        schedule:working_schedules (id, name, hours_per_week)
      `)
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new ConflictError(`Employee with work email '${dto.work_email}' already exists`);
      }
      throw new DatabaseError(`Failed to create employee: ${error.message}`, [error]);
    }

    return data as Employee;
  }

  async update(id: string, dto: UpdateEmployeeDto): Promise<Employee | null> {
    const { data, error } = await supabaseAdminClient
      .from('employees')
      .update(dto)
      .eq('id', id)
      .select(`
        *,
        department:departments (id, name, code),
        job_position:job_positions (id, title, code),
        manager:employees!employees_manager_id_fkey (id, first_name, last_name, work_email),
        schedule:working_schedules (id, name, hours_per_week)
      `)
      .maybeSingle();

    if (error) {
      if (error.code === '23505') {
        throw new ConflictError(`Update conflict: ${error.message}`);
      }
      throw new DatabaseError(`Failed to update employee: ${error.message}`, [error]);
    }

    return data as Employee | null;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await supabaseAdminClient
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) {
      throw new DatabaseError(`Failed to delete employee: ${error.message}`, [error]);
    }

    return true;
  }

  async getSmartCounts(employeeId: string): Promise<EmployeeSmartCounts> {
    const [contractsRes, attendanceRes, timeOffRes, payslipsRes] = await Promise.all([
      supabaseAdminClient.from('contracts').select('id', { count: 'exact', head: true }).eq('employee_id', employeeId),
      supabaseAdminClient.from('attendance').select('id', { count: 'exact', head: true }).eq('employee_id', employeeId),
      supabaseAdminClient.from('time_off_requests').select('id', { count: 'exact', head: true }).eq('employee_id', employeeId),
      supabaseAdminClient.from('payslips').select('id', { count: 'exact', head: true }).eq('employee_id', employeeId)
    ]);

    return {
      employee_id: employeeId,
      contracts_count: contractsRes.count || 0,
      attendance_count: attendanceRes.count || 0,
      time_off_requests_count: timeOffRes.count || 0,
      payslips_count: payslipsRes.count || 0
    };
  }
}

export const employeesRepository = new EmployeesRepository();
