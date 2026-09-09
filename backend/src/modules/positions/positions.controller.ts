import { Request, Response, NextFunction } from 'express';
import { positionsService, PositionsService } from './positions.service.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';

export class PositionsController {
  constructor(private readonly service: PositionsService = positionsService) {}

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const positions = await this.service.getPositions(req.query as any);
      sendSuccess(res, positions);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const position = await this.service.getPositionById(req.params.id as string);
      sendSuccess(res, position);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const position = await this.service.createPosition(req.body);
      sendCreated(res, position);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const position = await this.service.updatePosition(req.params.id as string, req.body);
      sendSuccess(res, position);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.deletePosition(req.params.id as string);
      sendSuccess(res, { message: 'Job position successfully deleted' });
    } catch (error) {
      next(error);
    }
  };
}

export const positionsController = new PositionsController();
