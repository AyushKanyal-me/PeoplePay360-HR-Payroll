import { Request, Response, NextFunction } from 'express';
import { payrollService, PayrollService } from './payroll.service.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/response.js';

export class PayrollController {
  constructor(private readonly service: PayrollService = payrollService) {}

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as any;
      const { data, total } = await this.service.getPayruns(query);
      sendPaginated(res, data, query.page, query.limit, total);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payrun = await this.service.getPayrunById(req.params.id as string);
      sendSuccess(res, payrun);
    } catch (error) {
      next(error);
    }
  };

  getEligibleEmployees = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const employees = await this.service.getEligibleEmployees(req.query as any);
      sendSuccess(res, employees);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payrun = await this.service.createPayrun(req.body, req.user?.id);
      sendCreated(res, payrun);
    } catch (error) {
      next(error);
    }
  };

  compute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payrun = await this.service.computePayrun(req.params.id as string);
      sendSuccess(res, payrun);
    } catch (error) {
      next(error);
    }
  };

  validate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payrun = await this.service.validatePayrun(req.params.id as string);
      sendSuccess(res, payrun);
    } catch (error) {
      next(error);
    }
  };

  markPaid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payrun = await this.service.markPaid(req.params.id as string);
      sendSuccess(res, payrun);
    } catch (error) {
      next(error);
    }
  };

  cancel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payrun = await this.service.cancelPayrun(req.params.id as string);
      sendSuccess(res, payrun);
    } catch (error) {
      next(error);
    }
  };

  getWarnings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const warnings = await this.service.getWarnings(req.params.id as string);
      sendSuccess(res, warnings);
    } catch (error) {
      next(error);
    }
  };
}

export const payrollController = new PayrollController();
