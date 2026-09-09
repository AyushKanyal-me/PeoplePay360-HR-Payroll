import { Request, Response, NextFunction } from 'express';
import { timeOffService, TimeOffService } from './time-off.service.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/response.js';
import { ForbiddenError, BadRequestError } from '../../utils/errors.js';

export class TimeOffController {
  constructor(private readonly service: TimeOffService = timeOffService) {}

  // Types
  getTypes = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const types = await this.service.getTypes();
      sendSuccess(res, types);
    } catch (error) {
      next(error);
    }
  };

  createType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const type = await this.service.createType(req.body);
      sendCreated(res, type);
    } catch (error) {
      next(error);
    }
  };

  // Allocations
  getAllocations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = { ...req.query } as any;

      if (req.user?.roles.length === 1 && req.user.roles[0] === 'EMPLOYEE') {
        if (!req.user.employeeId) {
          throw new ForbiddenError('No employee profile linked to user account');
        }
        query.employee_id = req.user.employeeId;
      }

      const allocations = await this.service.getAllocations(query);
      sendSuccess(res, allocations);
    } catch (error) {
      next(error);
    }
  };

  createAllocation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const allocation = await this.service.createAllocation(req.body);
      sendCreated(res, allocation);
    } catch (error) {
      next(error);
    }
  };

  // Requests
  getRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = { ...req.query } as any;

      if (req.user?.roles.length === 1 && req.user.roles[0] === 'EMPLOYEE') {
        if (!req.user.employeeId) {
          throw new ForbiddenError('No employee profile linked to user account');
        }
        query.employee_id = req.user.employeeId;
      }

      const { data, total } = await this.service.getRequests(query);
      sendPaginated(res, data, query.page, query.limit, total);
    } catch (error) {
      next(error);
    }
  };

  getRequestById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const request = await this.service.getRequestById(req.params.id as string);

      if (req.user?.roles.length === 1 && req.user.roles[0] === 'EMPLOYEE') {
        if (request.employee_id !== req.user.employeeId) {
          throw new ForbiddenError('You can only view your own leave requests');
        }
      }

      sendSuccess(res, request);
    } catch (error) {
      next(error);
    }
  };

  createRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const employeeId = req.user?.employeeId;
      if (!employeeId && !req.body.employee_id) {
        throw new BadRequestError('employee_id is required or user must be linked to an employee');
      }

      const request = await this.service.submitRequest(employeeId || req.body.employee_id, req.body);
      sendCreated(res, request);
    } catch (error) {
      next(error);
    }
  };

  approve = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const approverUserId = req.user?.id;
      if (!approverUserId) {
        throw new ForbiddenError('Authenticated user required');
      }

      const request = await this.service.approveRequest(req.params.id as string, approverUserId);
      sendSuccess(res, request);
    } catch (error) {
      next(error);
    }
  };

  refuse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refuserId = req.user?.id;
      if (!refuserId) {
        throw new ForbiddenError('Authenticated user required');
      }

      const request = await this.service.refuseRequest(
        req.params.id as string,
        refuserId,
        req.body.rejection_reason
      );
      sendSuccess(res, request);
    } catch (error) {
      next(error);
    }
  };

  cancel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cancellerUserId = req.user?.id;
      if (!cancellerUserId) {
        throw new ForbiddenError('Authenticated user required');
      }

      const isManager = req.user?.roles.some((r) => ['ADMIN', 'HR_MANAGER'].includes(r)) || false;
      const request = await this.service.cancelRequest(
        req.params.id as string,
        cancellerUserId,
        req.user?.employeeId,
        isManager
      );
      sendSuccess(res, request);
    } catch (error) {
      next(error);
    }
  };
}

export const timeOffController = new TimeOffController();
