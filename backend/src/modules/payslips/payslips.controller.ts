import { Request, Response, NextFunction } from 'express';
import { payslipsService, PayslipsService } from './payslips.service.js';
import { sendSuccess, sendPaginated } from '../../utils/response.js';
import { ForbiddenError } from '../../utils/errors.js';

export class PayslipsController {
  constructor(private readonly service: PayslipsService = payslipsService) {}

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = { ...req.query } as any;

      if (req.user?.roles.length === 1 && req.user.roles[0] === 'EMPLOYEE') {
        if (!req.user.employeeId) {
          throw new ForbiddenError('No employee profile linked to user account');
        }
        query.employee_id = req.user.employeeId;
      }

      const { data, total } = await this.service.getPayslips(query);
      sendPaginated(res, data, query.page, query.limit, total);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const isPrivileged = req.user?.roles.some((r) =>
        ['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'HR_MANAGER'].includes(r)
      ) || false;

      const payslip = await this.service.getPayslipById(
        req.params.id as string,
        req.user?.employeeId,
        isPrivileged
      );
      sendSuccess(res, payslip);
    } catch (error) {
      next(error);
    }
  };

  downloadPdf = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const isPrivileged = req.user?.roles.some((r) =>
        ['ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'HR_MANAGER'].includes(r)
      ) || false;

      const pdfBuffer = await this.service.generatePdf(
        req.params.id as string,
        req.user?.employeeId,
        isPrivileged
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="payslip-${req.params.id}.pdf"`);
      res.status(200).send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  };

  sendEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.sendPayslipEmail(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  sendBulk = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.sendBulkPayrunPayslips(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  getDeliveries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { data, total } = await this.service.getDeliveries(req.query as any);
      sendPaginated(res, data, (req.query as any).page, (req.query as any).limit, total);
    } catch (error) {
      next(error);
    }
  };
}

export const payslipsController = new PayslipsController();
