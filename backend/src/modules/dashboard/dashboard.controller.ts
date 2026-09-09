import { Request, Response, NextFunction } from 'express';
import { dashboardService, DashboardService } from './dashboard.service.js';
import { sendSuccess } from '../../utils/response.js';
import { BadRequestError } from '../../utils/errors.js';

export class DashboardController {
  constructor(private readonly service: DashboardService = dashboardService) {}

  private resolveCompanyId(req: Request): string {
    const companyId = (req.query.companyId as string) || req.user?.companyId;
    if (!companyId) {
      throw new BadRequestError('Company ID is required for dashboard analytics');
    }
    return companyId;
  }

  getKpis = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = this.resolveCompanyId(req);
      const kpis = await this.service.getKpis(companyId, req.query as any);
      sendSuccess(res, kpis);
    } catch (error) {
      next(error);
    }
  };

  getSalaryByDept = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = this.resolveCompanyId(req);
      const data = await this.service.getSalaryByDepartment(companyId, req.query as any);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  getSalaryTrends = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = this.resolveCompanyId(req);
      const trends = await this.service.getSalaryTrends(companyId, req.query as any);
      sendSuccess(res, trends);
    } catch (error) {
      next(error);
    }
  };

  getAttendanceOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = this.resolveCompanyId(req);
      const overview = await this.service.getAttendanceOverview(companyId, req.query as any);
      sendSuccess(res, overview);
    } catch (error) {
      next(error);
    }
  };

  getOperationalAlerts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = this.resolveCompanyId(req);
      const alerts = await this.service.getOperationalAlerts(companyId);
      sendSuccess(res, alerts);
    } catch (error) {
      next(error);
    }
  };
}

export const dashboardController = new DashboardController();
