import { Request, Response, NextFunction } from 'express';
import { companiesService, CompaniesService } from './companies.service.js';
import { sendSuccess } from '../../utils/response.js';

export class CompaniesController {
  constructor(private readonly service: CompaniesService = companiesService) {}

  getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companies = await this.service.getCompanies();
      sendSuccess(res, companies);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const company = await this.service.updateCompany(req.params.id as string, req.body);
      sendSuccess(res, company);
    } catch (error) {
      next(error);
    }
  };
}

export const companiesController = new CompaniesController();
