import { Request, Response, NextFunction } from 'express';
import { schedulesService, SchedulesService } from './schedules.service.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';

export class SchedulesController {
  constructor(private readonly service: SchedulesService = schedulesService) {}

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const schedules = await this.service.getSchedules(req.query as any);
      sendSuccess(res, schedules);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const schedule = await this.service.getScheduleById(req.params.id as string);
      sendSuccess(res, schedule);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const schedule = await this.service.createSchedule(req.body);
      sendCreated(res, schedule);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const schedule = await this.service.updateSchedule(req.params.id as string, req.body);
      sendSuccess(res, schedule);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.deleteSchedule(req.params.id as string);
      sendSuccess(res, { message: 'Working schedule successfully deleted' });
    } catch (error) {
      next(error);
    }
  };
}

export const schedulesController = new SchedulesController();
