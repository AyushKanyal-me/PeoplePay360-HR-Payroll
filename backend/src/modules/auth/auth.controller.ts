import { Request, Response, NextFunction } from 'express';
import { authService, AuthService } from './auth.service.js';
import { sendSuccess } from '../../utils/response.js';
import { UnauthorizedError } from '../../utils/errors.js';

export class AuthController {
  constructor(private readonly service: AuthService = authService) {}

  getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User must be authenticated');
      }

      const profile = this.service.getProfile(req.user);
      sendSuccess(res, profile);
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
