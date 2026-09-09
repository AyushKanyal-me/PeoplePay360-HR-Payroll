import { schedulesRepository, SchedulesRepository } from './schedules.repository.js';
import {
  WorkingSchedule,
  CreateScheduleDto,
  UpdateScheduleDto,
  ScheduleQueryDto
} from './schedules.types.js';
import { NotFoundError } from '../../utils/errors.js';

export class SchedulesService {
  constructor(private readonly repo: SchedulesRepository = schedulesRepository) {}

  async getSchedules(query: ScheduleQueryDto): Promise<WorkingSchedule[]> {
    return this.repo.findAll(query);
  }

  async getScheduleById(id: string): Promise<WorkingSchedule> {
    const schedule = await this.repo.findById(id);
    if (!schedule) {
      throw new NotFoundError(`Working schedule with ID '${id}' not found`);
    }
    return schedule;
  }

  async createSchedule(dto: CreateScheduleDto): Promise<WorkingSchedule> {
    return this.repo.create(dto);
  }

  async updateSchedule(id: string, dto: UpdateScheduleDto): Promise<WorkingSchedule> {
    const schedule = await this.repo.update(id, dto);
    if (!schedule) {
      throw new NotFoundError(`Working schedule with ID '${id}' not found to update`);
    }
    return schedule;
  }

  async deleteSchedule(id: string): Promise<boolean> {
    await this.getScheduleById(id);
    return this.repo.delete(id);
  }
}

export const schedulesService = new SchedulesService();
