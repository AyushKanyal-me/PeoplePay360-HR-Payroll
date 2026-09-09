import { supabaseAdminClient } from '../../config/supabase.js';
import {
  AttendanceRecord,
  CreateManualAttendanceDto,
  UpdateAttendanceDto,
  AttendanceQueryDto
} from './attendance.types.js';
import { DatabaseError, ConflictError } from '../../utils/errors.js';

export class AttendanceRepository {
  async findAll(query: AttendanceQueryDto): Promise<{ data: AttendanceRecord[]; total: number }> {
    let queryBuilder = supabaseAdminClient
      .from('attendance')
      .select(`
        *,
        employee:employees (
          id,
          first_name,
          last_name,
          work_email
        )
      `, { count: 'exact' });

    if (query.employee_id) {
      queryBuilder = queryBuilder.eq('employee_id', query.employee_id);
    }

    if (query.date_from) {
      queryBuilder = queryBuilder.gte('attendance_date', query.date_from);
    }

    if (query.date_to) {
      queryBuilder = queryBuilder.lte('attendance_date', query.date_to);
    }

    if (query.status) {
      queryBuilder = queryBuilder.eq('status', query.status);
    }

    const offset = (query.page - 1) * query.limit;
    queryBuilder = queryBuilder
      .order('attendance_date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + query.limit - 1);

    const { data, count, error } = await queryBuilder;

    if (error) {
      throw new DatabaseError(`Failed to fetch attendance records: ${error.message}`, [error]);
    }

    return {
      data: (data || []) as AttendanceRecord[],
      total: count || 0
    };
  }

  async findById(id: string): Promise<AttendanceRecord | null> {
    const { data, error } = await supabaseAdminClient
      .from('attendance')
      .select(`
        *,
        employee:employees (
          id,
          first_name,
          last_name,
          work_email
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new DatabaseError(`Failed to fetch attendance record: ${error.message}`, [error]);
    }

    return data as AttendanceRecord | null;
  }

  async findByEmployeeAndDate(employeeId: string, date: string): Promise<AttendanceRecord | null> {
    const { data, error } = await supabaseAdminClient
      .from('attendance')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('attendance_date', date)
      .maybeSingle();

    if (error) {
      throw new DatabaseError(`Failed to query daily attendance: ${error.message}`, [error]);
    }

    return data as AttendanceRecord | null;
  }

  async create(dto: CreateManualAttendanceDto): Promise<AttendanceRecord> {
    const { data, error } = await supabaseAdminClient
      .from('attendance')
      .insert(dto)
      .select(`
        *,
        employee:employees (id, first_name, last_name, work_email)
      `)
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new ConflictError(`Attendance for this employee on ${dto.attendance_date} already exists`);
      }
      throw new DatabaseError(`Failed to create attendance: ${error.message}`, [error]);
    }

    return data as AttendanceRecord;
  }

  async update(id: string, dto: UpdateAttendanceDto): Promise<AttendanceRecord | null> {
    const { data, error } = await supabaseAdminClient
      .from('attendance')
      .update(dto)
      .eq('id', id)
      .select(`
        *,
        employee:employees (id, first_name, last_name, work_email)
      `)
      .maybeSingle();

    if (error) {
      throw new DatabaseError(`Failed to update attendance: ${error.message}`, [error]);
    }

    return data as AttendanceRecord | null;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await supabaseAdminClient
      .from('attendance')
      .delete()
      .eq('id', id);

    if (error) {
      throw new DatabaseError(`Failed to delete attendance: ${error.message}`, [error]);
    }

    return true;
  }
}

export const attendanceRepository = new AttendanceRepository();
