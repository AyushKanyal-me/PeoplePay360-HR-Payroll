import { supabaseAdminClient } from '../../../config/supabase.js';

export class AttendanceCalculator {
  async calculate(employeeId: string, periodStart: string, periodEnd: string): Promise<{ actualWorkedDays: number; actualWorkedHours: number; missingCheckouts: number }> {
    const { data, error } = await supabaseAdminClient
      .from('attendance')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('attendance_date', periodStart)
      .lte('attendance_date', periodEnd);

    if (error || !data || data.length === 0) {
      return { actualWorkedDays: 0, actualWorkedHours: 0, missingCheckouts: 0 };
    }

    let actualWorkedDays = 0;
    let actualWorkedHours = 0;
    let missingCheckouts = 0;

    for (const record of data) {
      if (record.status === 'PRESENT' || record.status === 'LATE' || record.status === 'OVERTIME') {
        actualWorkedDays++;
      }
      if (record.worked_hours) {
        actualWorkedHours += Number(record.worked_hours);
      }
      if (record.check_in && !record.check_out) {
        missingCheckouts++;
      }
    }

    return {
      actualWorkedDays,
      actualWorkedHours: Number(actualWorkedHours.toFixed(2)),
      missingCheckouts
    };
  }
}
