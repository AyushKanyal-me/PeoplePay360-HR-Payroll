import { supabaseAdminClient } from '../../config/supabase.js';
import {
  TimeOffType,
  TimeOffAllocation,
  TimeOffRequest,
  CreateTimeOffTypeDto,
  CreateTimeOffAllocationDto,
  TimeOffRequestQueryDto,
  AllocationQueryDto
} from './time-off.types.js';
import { DatabaseError, ConflictError, BadRequestError } from '../../utils/errors.js';

export class TimeOffRepository {
  // Types
  async findAllTypes(): Promise<TimeOffType[]> {
    const { data, error } = await supabaseAdminClient
      .from('time_off_types')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw new DatabaseError(`Failed to fetch time-off types: ${error.message}`, [error]);
    }

    return (data || []) as TimeOffType[];
  }

  async findTypeById(id: string): Promise<TimeOffType | null> {
    const { data, error } = await supabaseAdminClient
      .from('time_off_types')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new DatabaseError(`Failed to fetch time-off type: ${error.message}`, [error]);
    }

    return data as TimeOffType | null;
  }

  async createType(dto: CreateTimeOffTypeDto): Promise<TimeOffType> {
    const { data, error } = await supabaseAdminClient
      .from('time_off_types')
      .insert(dto)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Failed to create time-off type: ${error.message}`, [error]);
    }

    return data as TimeOffType;
  }

  // Allocations
  async findAllAllocations(query: AllocationQueryDto): Promise<TimeOffAllocation[]> {
    let queryBuilder = supabaseAdminClient
      .from('time_off_allocations')
      .select(`
        *,
        employee:employees (id, first_name, last_name, work_email),
        time_off_type:time_off_types (id, name, code, unit)
      `)
      .order('year', { ascending: false });

    if (query.employee_id) {
      queryBuilder = queryBuilder.eq('employee_id', query.employee_id);
    }

    if (query.time_off_type_id) {
      queryBuilder = queryBuilder.eq('time_off_type_id', query.time_off_type_id);
    }

    if (query.year) {
      queryBuilder = queryBuilder.eq('year', query.year);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      throw new DatabaseError(`Failed to fetch leave allocations: ${error.message}`, [error]);
    }

    return (data || []) as TimeOffAllocation[];
  }

  async findAllocationByEmployeeAndType(
    employeeId: string,
    typeId: string,
    year: number
  ): Promise<TimeOffAllocation | null> {
    const { data, error } = await supabaseAdminClient
      .from('time_off_allocations')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('time_off_type_id', typeId)
      .eq('year', year)
      .eq('status', 'ACTIVE')
      .maybeSingle();

    if (error) {
      throw new DatabaseError(`Failed to find allocation: ${error.message}`, [error]);
    }

    return data as TimeOffAllocation | null;
  }

  async createAllocation(dto: CreateTimeOffAllocationDto): Promise<TimeOffAllocation> {
    const { data, error } = await supabaseAdminClient
      .from('time_off_allocations')
      .insert(dto)
      .select(`
        *,
        employee:employees (id, first_name, last_name, work_email),
        time_off_type:time_off_types (id, name, code, unit)
      `)
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new ConflictError('An active allocation for this employee, leave type, and year already exists');
      }
      throw new DatabaseError(`Failed to create leave allocation: ${error.message}`, [error]);
    }

    return data as TimeOffAllocation;
  }

  // Requests
  async findAllRequests(query: TimeOffRequestQueryDto): Promise<{ data: TimeOffRequest[]; total: number }> {
    let queryBuilder = supabaseAdminClient
      .from('time_off_requests')
      .select(`
        *,
        employee:employees (id, first_name, last_name, work_email),
        time_off_type:time_off_types (id, name, code, unit),
        approver:users!time_off_requests_approved_by_fkey (id, first_name, last_name, email)
      `, { count: 'exact' });

    if (query.employee_id) {
      queryBuilder = queryBuilder.eq('employee_id', query.employee_id);
    }

    if (query.time_off_type_id) {
      queryBuilder = queryBuilder.eq('time_off_type_id', query.time_off_type_id);
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
      throw new DatabaseError(`Failed to fetch leave requests: ${error.message}`, [error]);
    }

    return {
      data: (data || []) as TimeOffRequest[],
      total: count || 0
    };
  }

  async findRequestById(id: string): Promise<TimeOffRequest | null> {
    const { data, error } = await supabaseAdminClient
      .from('time_off_requests')
      .select(`
        *,
        employee:employees (id, first_name, last_name, work_email),
        time_off_type:time_off_types (id, name, code, unit),
        approver:users!time_off_requests_approved_by_fkey (id, first_name, last_name, email)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new DatabaseError(`Failed to fetch leave request: ${error.message}`, [error]);
    }

    return data as TimeOffRequest | null;
  }

  async createRequest(dto: any): Promise<TimeOffRequest> {
    const { data, error } = await supabaseAdminClient
      .from('time_off_requests')
      .insert(dto)
      .select(`
        *,
        employee:employees (id, first_name, last_name, work_email),
        time_off_type:time_off_types (id, name, code, unit)
      `)
      .single();

    if (error) {
      throw new DatabaseError(`Failed to create time-off request: ${error.message}`, [error]);
    }

    return data as TimeOffRequest;
  }

  // Database Function Callers (Transactional)
  async approveRequestWithDbFunction(requestId: string, approverUserId: string): Promise<TimeOffRequest> {
    const { error } = await supabaseAdminClient.rpc('approve_time_off_request', {
      p_request_id: requestId,
      p_approver_id: approverUserId
    });

    if (error) {
      if (error.message.includes('insufficient') || error.message.includes('balance') || error.message.includes('used_amount')) {
        throw new BadRequestError(`Approval failed: Insufficient leave balance on allocation.`);
      }
      if (error.message.includes('PENDING')) {
        throw new BadRequestError(`Cannot approve: Request is not in PENDING state.`);
      }
      throw new DatabaseError(`Failed to approve request via database procedure: ${error.message}`, [error]);
    }

    const updated = await this.findRequestById(requestId);
    return updated!;
  }

  async refuseRequestWithDbFunction(requestId: string, refuserId: string, reason: string): Promise<TimeOffRequest> {
    const { error } = await supabaseAdminClient.rpc('refuse_time_off_request', {
      p_request_id: requestId,
      p_refuser_id: refuserId,
      p_rejection_reason: reason
    });

    if (error) {
      if (error.message.includes('PENDING')) {
        throw new BadRequestError(`Cannot refuse: Request is not in PENDING state.`);
      }
      throw new DatabaseError(`Failed to refuse request via database procedure: ${error.message}`, [error]);
    }

    const updated = await this.findRequestById(requestId);
    return updated!;
  }

  async cancelRequestWithDbFunction(requestId: string, cancellerId: string): Promise<TimeOffRequest> {
    const { error } = await supabaseAdminClient.rpc('cancel_time_off_request', {
      p_request_id: requestId,
      p_canceller_id: cancellerId
    });

    if (error) {
      throw new DatabaseError(`Failed to cancel request via database procedure: ${error.message}`, [error]);
    }

    const updated = await this.findRequestById(requestId);
    return updated!;
  }
}

export const timeOffRepository = new TimeOffRepository();
