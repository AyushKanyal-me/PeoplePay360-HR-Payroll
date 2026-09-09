import { Request, Response, NextFunction } from 'express';
import { employeesService, EmployeesService } from './employees.service.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/response.js';

export class EmployeesController {
  constructor(private readonly service: EmployeesService = employeesService) {}

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as any;
      const { data, total } = await this.service.getEmployees(query);
      sendPaginated(res, data, query.page, query.limit, total);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const employee = await this.service.getEmployeeById(req.params.id as string);
      sendSuccess(res, employee);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const employee = await this.service.createEmployee(req.body);
      sendCreated(res, employee);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const employee = await this.service.updateEmployee(req.params.id as string, req.body);
      sendSuccess(res, employee);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.deleteEmployee(req.params.id as string);
      sendSuccess(res, { message: 'Employee record successfully deleted' });
    } catch (error) {
      next(error);
    }
  };

  getSmartCounts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const counts = await this.service.getSmartCounts(req.params.id as string);
      sendSuccess(res, counts);
    } catch (error) {
      next(error);
    }
  };
}

export const employeesController = new EmployeesController();
