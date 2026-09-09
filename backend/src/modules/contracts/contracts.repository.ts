import { supabaseAdminClient } from '../../config/supabase.js';
import { Contract, CreateContractDto, UpdateContractDto, ContractQueryDto } from './contracts.types.js';
import { DatabaseError, ConflictError } from '../../utils/errors.js';

export class ContractsRepository {
  async findAll(query: ContractQueryDto): Promise<{ data: Contract[]; total: number }> {
    let queryBuilder = supabaseAdminClient
      .from('contracts')
      .select(`
        *,
        employee:employees (id, first_name, last_name, work_email),
        department:departments (id, name),
        job_position:job_positions (id, title),
        schedule:working_schedules (id, name, hours_per_week),
        salary_structure:salary_structures (id, name, code)
      `, { count: 'exact' });

    if (query.employee_id) {
      queryBuilder = queryBuilder.eq('employee_id', query.employee_id);
    }

    if (query.department_id) {
      queryBuilder = queryBuilder.eq('department_id', query.department_id);
    }

    if (query.status) {
      queryBuilder = queryBuilder.eq('status', query.status);
    }

    const offset = (query.page - 1) * query.limit;
    queryBuilder = queryBuilder
      .order('start_date', { ascending: false })
      .range(offset, offset + query.limit - 1);

    const { data, count, error } = await queryBuilder;

    if (error) {
      throw new DatabaseError(`Failed to fetch contracts: ${error.message}`, [error]);
    }

    return {
      data: (data || []) as Contract[],
      total: count || 0
    };
  }

  async findById(id: string): Promise<Contract | null> {
    const { data, error } = await supabaseAdminClient
      .from('contracts')
      .select(`
        *,
        employee:employees (id, first_name, last_name, work_email),
        department:departments (id, name),
        job_position:job_positions (id, title),
        schedule:working_schedules (id, name, hours_per_week),
        salary_structure:salary_structures (id, name, code)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new DatabaseError(`Failed to fetch contract: ${error.message}`, [error]);
    }

    return data as Contract | null;
  }

  async create(dto: CreateContractDto): Promise<Contract> {
    const { data, error } = await supabaseAdminClient
      .from('contracts')
      .insert(dto)
      .select(`
        *,
        employee:employees (id, first_name, last_name, work_email),
        department:departments (id, name),
        job_position:job_positions (id, title),
        schedule:working_schedules (id, name, hours_per_week),
        salary_structure:salary_structures (id, name, code)
      `)
      .single();

    if (error) {
      if (error.code === '23P01' || error.message.includes('overlapping') || error.message.includes('exclude_overlapping_contracts')) {
        throw new ConflictError('Contract date range overlaps with an existing active contract for this employee');
      }
      throw new DatabaseError(`Failed to create contract: ${error.message}`, [error]);
    }

    return data as Contract;
  }

  async update(id: string, dto: UpdateContractDto): Promise<Contract | null> {
    const { data, error } = await supabaseAdminClient
      .from('contracts')
      .update(dto)
      .eq('id', id)
      .select(`
        *,
        employee:employees (id, first_name, last_name, work_email),
        department:departments (id, name),
        job_position:job_positions (id, title),
        schedule:working_schedules (id, name, hours_per_week),
        salary_structure:salary_structures (id, name, code)
      `)
      .maybeSingle();

    if (error) {
      if (error.code === '23P01' || error.message.includes('overlapping') || error.message.includes('exclude_overlapping_contracts')) {
        throw new ConflictError('Contract date range overlaps with an existing active contract for this employee');
      }
      throw new DatabaseError(`Failed to update contract: ${error.message}`, [error]);
    }

    return data as Contract | null;
  }

  async close(id: string, closeDate: string): Promise<Contract | null> {
    const { data, error } = await supabaseAdminClient
      .from('contracts')
      .update({
        status: 'EXPIRED',
        end_date: closeDate
      })
      .eq('id', id)
      .select(`
        *,
        employee:employees (id, first_name, last_name, work_email)
      `)
      .maybeSingle();

    if (error) {
      throw new DatabaseError(`Failed to close contract: ${error.message}`, [error]);
    }

    return data as Contract | null;
  }
}

export const contractsRepository = new ContractsRepository();
