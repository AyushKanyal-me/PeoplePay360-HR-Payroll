import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { sendError } from '../utils/response.js';
import { env } from '../config/env.js';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    sendError(res, err.code, err.message, err.statusCode, err.details);
    return;
  }

  // Handle generic syntax or JSON parse errors
  if (err instanceof SyntaxError && 'status' in err && err.status === 400) {
    sendError(res, 'BAD_REQUEST', 'Invalid JSON syntax in request body', 400);
    return;
  }

  // Log unhandled server errors
  if (env.NODE_ENV !== 'test') {
    console.error('💥 Unhandled Server Error:', err);
  }

  sendError(
    res,
    'INTERNAL_SERVER_ERROR',
    env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred. Please try again later.' 
      : err.message,
    500
  );
}
