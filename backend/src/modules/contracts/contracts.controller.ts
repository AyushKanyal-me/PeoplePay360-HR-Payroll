import { Request, Response, NextFunction } from 'express';
import { contractsService, ContractsService } from './contracts.service.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/response.js';
import { ForbiddenError } from '../../utils/errors.js';

export class ContractsController {
  constructor(private readonly service: ContractsService = contractsService) {}

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = { ...req.query } as any;

      // If user is solely EMPLOYEE, scope query to their own employee_id
      if (req.user?.roles.length === 1 && req.user.roles[0] === 'EMPLOYEE') {
        if (!req.user.employeeId) {
          throw new ForbiddenError('No employee profile linked to your account');
        }
        query.employee_id = req.user.employeeId;
      }

      const { data, total } = await this.service.getContracts(query);
      sendPaginated(res, data, query.page, query.limit, total);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const contract = await this.service.getContractById(req.params.id as string);

      // Self-access verification for EMPLOYEE role
      if (req.user?.roles.length === 1 && req.user.roles[0] === 'EMPLOYEE') {
        if (contract.employee_id !== req.user.employeeId) {
          throw new ForbiddenError('You can only view your own employment contracts');
        }
      }

      sendSuccess(res, contract);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const contract = await this.service.createContract(req.body);
      sendCreated(res, contract);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const contract = await this.service.updateContract(req.params.id as string, req.body);
      sendSuccess(res, contract);
    } catch (error) {
      next(error);
    }
  };

  close = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const contract = await this.service.closeContract(req.params.id as string);
      sendSuccess(res, contract);
    } catch (error) {
      next(error);
    }
  };
}

export const contractsController = new ContractsController();
