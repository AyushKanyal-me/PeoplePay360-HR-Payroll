import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, AppError } from '../utils/errors.js';
import { AuthenticatedUser, RequestContext } from '../types/auth.js';
import { authService } from '../modules/auth/auth.service.js';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      token?: string;
      context?: RequestContext;
    }
  }
}

/**
 * Authentication Middleware.
 * Validates Supabase JWT from Authorization: Bearer <token>
 * Resolves user, linked employee, company, and roles.
 */
export function requireAuth() {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedError('Authorization header missing or invalid format (Bearer token required)');
      }

      const token = authHeader.split(' ')[1];
      if (!token || token.trim() === '') {
        throw new UnauthorizedError('Bearer token is empty');
      }

      const user = await authService.validateToken(token);

      req.user = user;
      req.token = token;
      req.context = {
        userId: user.id,
        authUserId: user.authUserId,
        employeeId: user.employeeId ?? null,
        companyId: user.companyId ?? null,
        roles: user.roles,
        token,
        user
      };

      next();
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new UnauthorizedError('Invalid, expired or unrecognized authentication token'));
      }
    }
  };
}

export const authenticate = requireAuth;
