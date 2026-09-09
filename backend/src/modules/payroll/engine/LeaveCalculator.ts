import { supabaseAdminClient } from '../../../config/supabase.js';

export class LeaveCalculator {
  async calculate(employeeId: string, periodStart: string, periodEnd: string): Promise<{ approvedPaidLeaveDays: number; approvedUnpaidLeaveDays: number }> {
    const { data, error } = await supabaseAdminClient
      .from('time_off_requests')
      .select(`
        duration,
        time_off_type:time_off_types (
          is_paid
        )
      `)
      .eq('employee_id', employeeId)
      .eq('status', 'APPROVED')
      .gte('start_date', periodStart)
      .lte('end_date', periodEnd);

    if (error || !data || data.length === 0) {
      return { approvedPaidLeaveDays: 0, approvedUnpaidLeaveDays: 0 };
    }

    let approvedPaidLeaveDays = 0;
    let approvedUnpaidLeaveDays = 0;

    for (const req of data as any[]) {
      const isPaid = req.time_off_type?.is_paid ?? true;
      const dur = Number(req.duration || 0);
      if (isPaid) {
        approvedPaidLeaveDays += dur;
      } else {
        approvedUnpaidLeaveDays += dur;
      }
    }

    return {
      approvedPaidLeaveDays,
      approvedUnpaidLeaveDays
    };
  }
}
