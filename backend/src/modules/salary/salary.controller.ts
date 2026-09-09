import { Request, Response, NextFunction } from 'express';
import { salaryService, SalaryService } from './salary.service.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';

export class SalaryController {
  constructor(private readonly service: SalaryService = salaryService) {}

  // Structures
  getAllStructures = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const structures = await this.service.getStructures(req.query as any);
      sendSuccess(res, structures);
    } catch (error) {
      next(error);
    }
  };

  getStructureById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const structure = await this.service.getStructureById(req.params.id as string);
      sendSuccess(res, structure);
    } catch (error) {
      next(error);
    }
  };

  createStructure = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const structure = await this.service.createStructure(req.body);
      sendCreated(res, structure);
    } catch (error) {
      next(error);
    }
  };

  updateStructure = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const structure = await this.service.updateStructure(req.params.id as string, req.body);
      sendSuccess(res, structure);
    } catch (error) {
      next(error);
    }
  };

  // Rules
  getAllRules = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rules = await this.service.getRules(req.query as any);
      sendSuccess(res, rules);
    } catch (error) {
      next(error);
    }
  };

  getRuleById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rule = await this.service.getRuleById(req.params.id as string);
      sendSuccess(res, rule);
    } catch (error) {
      next(error);
    }
  };

  createRule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rule = await this.service.createRule(req.body);
      sendCreated(res, rule);
    } catch (error) {
      next(error);
    }
  };

  updateRule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rule = await this.service.updateRule(req.params.id as string, req.body);
      sendSuccess(res, rule);
    } catch (error) {
      next(error);
    }
  };
}

export const salaryController = new SalaryController();
