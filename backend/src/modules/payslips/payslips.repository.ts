import { supabaseAdminClient } from '../../config/supabase.js';
import { PayslipDetailed, PayslipDeliveryRecord, PayslipQueryDto, DeliveryQueryDto } from './payslips.types.js';
import { DatabaseError } from '../../utils/errors.js';

export class PayslipsRepository {
  async findAll(query: PayslipQueryDto): Promise<{ data: PayslipDetailed[]; total: number }> {
    let queryBuilder = supabaseAdminClient
      .from('payslips')
      .select(`
        *,
        employee:employees (
          id, first_name, last_name, work_email, department_id, job_position_id
        ),
        payrun:payruns (
          id, name, status
        )
      `, { count: 'exact' });

    if (query.payrun_id) {
      queryBuilder = queryBuilder.eq('payrun_id', query.payrun_id);
    }

    if (query.employee_id) {
      queryBuilder = queryBuilder.eq('employee_id', query.employee_id);
    }

    if (query.status) {
      queryBuilder = queryBuilder.eq('status', query.status);
    }

    const offset = (query.page - 1) * query.limit;
    queryBuilder = queryBuilder
      .order('period_start', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + query.limit - 1);

    const { data, count, error } = await queryBuilder;

    if (error) {
      throw new DatabaseError(`Failed to fetch payslips: ${error.message}`, [error]);
    }

    return {
      data: (data || []) as PayslipDetailed[],
      total: count || 0
    };
  }

  async findById(id: string): Promise<PayslipDetailed | null> {
    const { data, error } = await supabaseAdminClient
      .from('payslips')
      .select(`
        *,
        employee:employees (
          id, first_name, last_name, work_email, bank_account_number, company_id,
          department:departments (id, name),
          job_position:job_positions (id, title)
        ),
        payrun:payruns (
          id, name, status,
          company:companies (id, name, currency, tax_id)
        ),
        items:payslip_items (*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new DatabaseError(`Failed to fetch payslip: ${error.message}`, [error]);
    }

    if (!data) return null;

    // Sort items by sequence ASC
    const sortedItems = (data.items || []).sort((a: any, b: any) => a.sequence - b.sequence);

    return {
      ...data,
      items: sortedItems
    } as PayslipDetailed;
  }

  async recordDelivery(
    payslipId: string,
    email: string,
    status: 'PENDING' | 'SENT' | 'FAILED',
    errorMessage?: string
  ): Promise<PayslipDeliveryRecord> {
    const { data, error } = await supabaseAdminClient
      .from('payslip_deliveries')
      .insert({
        payslip_id: payslipId,
        email,
        status,
        sent_at: status === 'SENT' ? new Date().toISOString() : null,
        error_message: errorMessage ?? null
      })
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Failed to record payslip delivery: ${error.message}`, [error]);
    }

    // If sent successfully, update payslip status to SENT
    if (status === 'SENT') {
      await supabaseAdminClient
        .from('payslips')
        .update({ status: 'SENT' })
        .eq('id', payslipId);
    }

    return data as PayslipDeliveryRecord;
  }

  async findAllDeliveries(query: DeliveryQueryDto): Promise<{ data: PayslipDeliveryRecord[]; total: number }> {
    let queryBuilder = supabaseAdminClient
      .from('payslip_deliveries')
      .select(`
        *,
        payslip:payslips (
          id, period_start, period_end, net_salary,
          employee:employees (first_name, last_name, work_email)
        )
      `, { count: 'exact' });

    if (query.payslip_id) {
      queryBuilder = queryBuilder.eq('payslip_id', query.payslip_id);
    }

    if (query.status) {
      queryBuilder = queryBuilder.eq('status', query.status);
    }

    const offset = (query.page - 1) * query.limit;
    queryBuilder = queryBuilder
      .order('created_at', { ascending: false })
      .range(offset, offset + query.limit - 1);

    const { data, count, error } = await queryBuilder;

    if (error) {
      throw new DatabaseError(`Failed to fetch payslip deliveries: ${error.message}`, [error]);
    }

    return {
      data: (data || []) as PayslipDeliveryRecord[],
      total: count || 0
    };
  }

  async findPayslipsByPayrunId(payrunId: string): Promise<PayslipDetailed[]> {
    const { data, error } = await supabaseAdminClient
      .from('payslips')
      .select(`
        *,
        employee:employees (
          id, first_name, last_name, work_email, bank_account_number, company_id,
          department:departments (id, name),
          job_position:job_positions (id, title)
        ),
        payrun:payruns (
          id, name, status,
          company:companies (id, name, currency, tax_id)
        ),
        items:payslip_items (*)
      `)
      .eq('payrun_id', payrunId);

    if (error) {
      throw new DatabaseError(`Failed to fetch payslips for payrun: ${error.message}`, [error]);
    }

    return (data || []).map((d: any) => ({
      ...d,
      items: (d.items || []).sort((a: any, b: any) => a.sequence - b.sequence)
    })) as PayslipDetailed[];
  }
}

export const payslipsRepository = new PayslipsRepository();
