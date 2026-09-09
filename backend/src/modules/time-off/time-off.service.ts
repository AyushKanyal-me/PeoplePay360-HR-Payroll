import { timeOffRepository, TimeOffRepository } from './time-off.repository.js';
import {
  TimeOffType,
  TimeOffAllocation,
  TimeOffRequest,
  CreateTimeOffTypeDto,
  CreateTimeOffAllocationDto,
  CreateTimeOffRequestDto,
  TimeOffRequestQueryDto,
  AllocationQueryDto
} from './time-off.types.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../utils/errors.js';

export class TimeOffService {
  constructor(private readonly repo: TimeOffRepository = timeOffRepository) { }

  // Types
  async getTypes(): Promise<TimeOffType[]> {
    return this.repo.findAllTypes();
  }

  async createType(dto: CreateTimeOffTypeDto): Promise<TimeOffType> {
    return this.repo.createType(dto);
  }

  // Allocations
  async getAllocations(query: AllocationQueryDto): Promise<TimeOffAllocation[]> {
    return this.repo.findAllAllocations(query);
  }

  async createAllocation(dto: CreateTimeOffAllocationDto): Promise<TimeOffAllocation> {
    return this.repo.createAllocation(dto);
  }

  // Requests
  async getRequests(query: TimeOffRequestQueryDto) {
    return this.repo.findAllRequests(query);
  }

  async getRequestById(id: string): Promise<TimeOffRequest> {
    const req = await this.repo.findRequestById(id);
    if (!req) {
      throw new NotFoundError(`Time-off request with ID '${id}' not found`);
    }
    return req;
  }

  async submitRequest(employeeId: string, dto: CreateTimeOffRequestDto): Promise<TimeOffRequest> {
    const targetEmployeeId = dto.employee_id || employeeId;
    const leaveType = await this.repo.findTypeById(dto.time_off_type_id);

    if (!leaveType) {
      throw new NotFoundError(`Time-off type with ID '${dto.time_off_type_id}' not found`);
    }

    let allocationId = dto.allocation_id || null;

    // Auto-resolve allocation if leave type requires allocation
    if (leaveType.requires_allocation && !allocationId) {
      const year = new Date(dto.start_date).getFullYear();
      const allocation = await this.repo.findAllocationByEmployeeAndType(targetEmployeeId, leaveType.id, year);

      if (!allocation) {
        throw new BadRequestError(
          `No active leave allocation found for type '${leaveType.name}' for the year ${year}`
        );
      }

      const available = Number(allocation.allocated_amount) - Number(allocation.used_amount);
      if (available < dto.duration) {
        throw new BadRequestError(
          `Insufficient leave balance. Available: ${available} ${leaveType.unit}, Requested: ${dto.duration} ${leaveType.unit}`
        );
      }

      allocationId = allocation.id;
    }

    return this.repo.createRequest({
      employee_id: targetEmployeeId,
      time_off_type_id: dto.time_off_type_id,
      allocation_id: allocationId,
      start_date: dto.start_date,
      end_date: dto.end_date,
      duration: dto.duration,
      reason: dto.reason ?? null,
      status: 'PENDING'
    });
  }

  async approveRequest(id: string, approverUserId: string): Promise<TimeOffRequest> {
    const request = await this.getRequestById(id);
    if (request.status !== 'PENDING') {
      throw new BadRequestError(`Cannot approve request in status '${request.status}'`);
    }
    return this.repo.approveRequestWithDbFunction(id, approverUserId);
  }

  async refuseRequest(id: string, refuserId: string, reason: string): Promise<TimeOffRequest> {
    const request = await this.getRequestById(id);
    if (request.status !== 'PENDING') {
      throw new BadRequestError(`Cannot refuse request in status '${request.status}'`);
    }
    return this.repo.refuseRequestWithDbFunction(id, refuserId, reason);
  }

  async cancelRequest(id: string, cancellerUserId: string, cancellerEmployeeId?: string | null, isManager = false): Promise<TimeOffRequest> {
    const request = await this.getRequestById(id);

    if (request.status === 'REFUSED' || request.status === 'CANCELLED') {
      throw new BadRequestError(`Cannot cancel request already in '${request.status}' status`);
    }

    if (!isManager && cancellerEmployeeId && request.employee_id !== cancellerEmployeeId) {
      throw new ForbiddenError('You can only cancel your own leave requests');
    }

    return this.repo.cancelRequestWithDbFunction(id, cancellerUserId);
  }
}

export const timeOffService = new TimeOffService();
