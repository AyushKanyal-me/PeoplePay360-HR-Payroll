import { Request, Response, NextFunction } from 'express';
import { attendanceService, AttendanceService } from './attendance.service.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/response.js';
import { ForbiddenError, BadRequestError } from '../../utils/errors.js';

export class AttendanceController {
  constructor(private readonly service: AttendanceService = attendanceService) {}

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = { ...req.query } as any;

      // Scoping for standard EMPLOYEE role
      if (req.user?.roles.length === 1 && req.user.roles[0] === 'EMPLOYEE') {
        if (!req.user.employeeId) {
          throw new ForbiddenError('No employee profile linked to your user account');
        }
        query.employee_id = req.user.employeeId;
      }

      const { data, total } = await this.service.getAttendanceRecords(query);
      sendPaginated(res, data, query.page, query.limit, total);
    } catch (error) {
      next(error);
    }
  };

  getQuickStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const employeeId = req.user?.employeeId;
      if (!employeeId) {
        throw new BadRequestError('Current user is not linked to an employee profile');
      }

      const status = await this.service.getQuickStatus(employeeId);
      sendSuccess(res, status);
    } catch (error) {
      next(error);
    }
  };

  checkIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const employeeId = req.user?.employeeId;
      if (!employeeId) {
        throw new BadRequestError('Current user is not linked to an employee profile');
      }

      const record = await this.service.checkIn(employeeId);
      sendCreated(res, record);
    } catch (error) {
      next(error);
    }
  };

  checkOut = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const employeeId = req.user?.employeeId;
      if (!employeeId) {
        throw new BadRequestError('Current user is not linked to an employee profile');
      }

      const record = await this.service.checkOut(employeeId);
      sendSuccess(res, record);
    } catch (error) {
      next(error);
    }
  };

  createManual = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const record = await this.service.createManualAttendance(req.body);
      sendCreated(res, record);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const record = await this.service.updateAttendance(req.params.id as string, req.body);
      sendSuccess(res, record);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.deleteAttendance(req.params.id as string);
      sendSuccess(res, { message: 'Attendance record deleted' });
    } catch (error) {
      next(error);
    }
  };
}

export const attendanceController = new AttendanceController();
