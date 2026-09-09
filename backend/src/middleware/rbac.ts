import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../utils/errors.js';
import { CanonicalRole } from '../types/auth.js';

/**
 * Ensures the user has ALL of the specified roles.
 * Note: ADMIN role always satisfies all role checks.
 */
export function requireRole(...roles: CanonicalRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('User must be authenticated before role verification'));
    }

    const userRoles = req.user.roles || [];

    // ADMIN has full system access
    if (userRoles.includes('ADMIN')) {
      return next();
    }

    const hasAllRoles = roles.every((role) => userRoles.includes(role));
    if (!hasAllRoles) {
      return next(
        new ForbiddenError(
          `Access denied. Requires all roles: [${roles.join(', ')}]`
        )
      );
    }

    next();
  };
}

/**
 * Ensures the user has AT LEAST ONE of the specified roles.
 * Note: ADMIN role always satisfies all role checks.
 */
export function requireAnyRole(...roles: CanonicalRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('User must be authenticated before role verification'));
    }

    const userRoles = req.user.roles || [];

    // ADMIN has full system access
    if (userRoles.includes('ADMIN')) {
      return next();
    }

    const hasAnyRole = roles.some((role) => userRoles.includes(role));
    if (!hasAnyRole) {
      return next(
        new ForbiddenError(
          `Access denied. Requires at least one role of: [${roles.join(', ')}]`
        )
      );
    }

    next();
  };
}

/**
 * Allows access if:
 * 1. The user has the ADMIN role, OR
 * 2. The user has ANY of the elevated roles, OR
 * 3. The user is an EMPLOYEE accessing their own record matching `req.params[employeeIdParam]`.
 */
export function requireEmployeeOrRole(
  employeeIdParam = 'employeeId',
  ...elevatedRoles: CanonicalRole[]
) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('User must be authenticated before access verification'));
    }

    const userRoles = req.user.roles || [];

    // 1. Admin bypass
    if (userRoles.includes('ADMIN')) {
      return next();
    }

    // 2. Elevated role check
    if (elevatedRoles.some((role) => userRoles.includes(role))) {
      return next();
    }

    // 3. Self employee check
    const targetEmployeeId = req.params[employeeIdParam];
    if (req.user.employeeId && targetEmployeeId && req.user.employeeId === targetEmployeeId) {
      return next();
    }

    return next(
      new ForbiddenError(
        `Access denied. You can only access your own record or require one of: [${elevatedRoles.join(', ')}]`
      )
    );
  };
}
