import { Request, Response, NextFunction } from 'express';
import { departmentsService, DepartmentsService } from './departments.service.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/response.js';

export class DepartmentsController {
  constructor(private readonly service: DepartmentsService = departmentsService) {}

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as any;
      const { data, total } = await this.service.getDepartments(query);
      sendPaginated(res, data, query.page, query.limit, total);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dept = await this.service.getDepartmentById(req.params.id as string);
      sendSuccess(res, dept);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dept = await this.service.createDepartment(req.body);
      sendCreated(res, dept);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dept = await this.service.updateDepartment(req.params.id as string, req.body);
      sendSuccess(res, dept);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.deleteDepartment(req.params.id as string);
      sendSuccess(res, { message: 'Department successfully deleted' });
    } catch (error) {
      next(error);
    }
  };
}

export const departmentsController = new DepartmentsController();
