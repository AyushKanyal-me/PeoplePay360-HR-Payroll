import { supabaseAdminClient } from '../../../config/supabase.js';
import { Contract } from '../../contracts/contracts.types.js';

export class ContractResolver {
  /**
   * Resolves the active contract for an employee valid for the payroll period.
   * Uses DB function get_applicable_contract or direct fallback query.
   */
  async resolve(employeeId: string, periodStart: string, periodEnd: string): Promise<Contract | null> {
    // Try calling DB function get_applicable_contract for period end
    const { data: rpcData, error: rpcError } = await supabaseAdminClient
      .rpc('get_applicable_contract', {
        p_employee_id: employeeId,
        p_payroll_date: periodEnd
      });

    if (!rpcError && rpcData && rpcData.length > 0) {
      return rpcData[0] as Contract;
    }

    // Direct fallback query
    const { data, error } = await supabaseAdminClient
      .from('contracts')
      .select(`
        *,
        salary_structure:salary_structures (*),
        schedule:working_schedules (
          *,
          days:schedule_days (*)
        )
      `)
      .eq('employee_id', employeeId)
      .eq('status', 'ACTIVE')
      .lte('start_date', periodEnd)
      .or(`end_date.is.null,end_date.gte.${periodStart}`)
      .order('start_date', { ascending: false })
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data as Contract;
  }
}
