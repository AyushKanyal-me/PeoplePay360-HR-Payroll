import { attendanceRepository, AttendanceRepository } from './attendance.repository.js';
import {
  AttendanceRecord,
  AttendanceQuickStatus,
  CreateManualAttendanceDto,
  UpdateAttendanceDto,
  AttendanceQueryDto
} from './attendance.types.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';

export class AttendanceService {
  constructor(private readonly repo: AttendanceRepository = attendanceRepository) {}

  async getAttendanceRecords(query: AttendanceQueryDto) {
    return this.repo.findAll(query);
  }

  async getAttendanceById(id: string): Promise<AttendanceRecord> {
    const record = await this.repo.findById(id);
    if (!record) {
      throw new NotFoundError(`Attendance record with ID '${id}' not found`);
    }
    return record;
  }

  async getQuickStatus(employeeId: string): Promise<AttendanceQuickStatus> {
    const today = new Date().toISOString().split('T')[0]!;
    const record = await this.repo.findByEmployeeAndDate(employeeId, today);

    if (!record || !record.check_in) {
      return {
        employee_id: employeeId,
        attendance_date: today,
        is_checked_in: false,
        is_checked_out: false,
        check_in: null,
        check_out: null,
        elapsed_minutes: 0,
        worked_hours: 0,
        status: 'ABSENT'
      };
    }

    const checkInTime = new Date(record.check_in).getTime();
    const endTime = record.check_out ? new Date(record.check_out).getTime() : Date.now();
    const elapsedMinutes = Math.max(0, Math.floor((endTime - checkInTime) / (1000 * 60)));

    return {
      employee_id: employeeId,
      attendance_date: today,
      is_checked_in: true,
      is_checked_out: !!record.check_out,
      check_in: record.check_in,
      check_out: record.check_out,
      elapsed_minutes: elapsedMinutes,
      worked_hours: Number(record.worked_hours || (elapsedMinutes / 60).toFixed(2)),
      status: record.status
    };
  }

  async checkIn(employeeId: string): Promise<AttendanceRecord> {
    const today = new Date().toISOString().split('T')[0]!;
    const existing = await this.repo.findByEmployeeAndDate(employeeId, today);

    if (existing) {
      if (existing.check_in && !existing.check_out) {
        throw new BadRequestError('You are already checked in for today');
      }
      if (existing.check_out) {
        throw new BadRequestError('Attendance session for today has already been completed');
      }
    }

    const now = new Date().toISOString();
    return this.repo.create({
      employee_id: employeeId,
      attendance_date: today,
      check_in: now,
      overtime_hours: 0,
      status: 'PRESENT',
      is_manual_edit: false,
      correction_note: 'Automated quick check-in'
    });
  }

  async checkOut(employeeId: string): Promise<AttendanceRecord> {
    const today = new Date().toISOString().split('T')[0]!;
    const existing = await this.repo.findByEmployeeAndDate(employeeId, today);

    if (!existing || !existing.check_in) {
      throw new BadRequestError('No active check-in found for today. Please check in first.');
    }

    if (existing.check_out) {
      throw new BadRequestError('You have already checked out for today.');
    }

    const checkOutTime = new Date();
    const checkInTime = new Date(existing.check_in);
    const durationHours = Math.max(0, (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60));
    const workedHours = Number(durationHours.toFixed(2));
    const overtimeHours = workedHours > 8 ? Number((workedHours - 8).toFixed(2)) : 0;
    const status = overtimeHours > 0 ? 'OVERTIME' : 'PRESENT';

    const updated = await this.repo.update(existing.id, {
      check_out: checkOutTime.toISOString(),
      worked_hours: workedHours,
      overtime_hours: overtimeHours,
      status,
      is_manual_edit: false
    });

    if (!updated) {
      throw new NotFoundError('Failed to record check out');
    }

    return updated;
  }

  async createManualAttendance(dto: CreateManualAttendanceDto): Promise<AttendanceRecord> {
    if (dto.check_in && dto.check_out) {
      const start = new Date(dto.check_in).getTime();
      const end = new Date(dto.check_out).getTime();
      if (end < start) {
        throw new BadRequestError('check_out must be after check_in time');
      }
      if (!dto.worked_hours) {
        dto.worked_hours = Number(((end - start) / (1000 * 60 * 60)).toFixed(2));
      }
    }
    return this.repo.create(dto);
  }

  async updateAttendance(id: string, dto: UpdateAttendanceDto): Promise<AttendanceRecord> {
    if (dto.check_in && dto.check_out) {
      const start = new Date(dto.check_in).getTime();
      const end = new Date(dto.check_out).getTime();
      if (end < start) {
        throw new BadRequestError('check_out must be after check_in time');
      }
      if (!dto.worked_hours) {
        dto.worked_hours = Number(((end - start) / (1000 * 60 * 60)).toFixed(2));
      }
    }

    const record = await this.repo.update(id, dto);
    if (!record) {
      throw new NotFoundError(`Attendance record with ID '${id}' not found to update`);
    }
    return record;
  }

  async deleteAttendance(id: string): Promise<boolean> {
    await this.getAttendanceById(id);
    return this.repo.delete(id);
  }
}

export const attendanceService = new AttendanceService();
