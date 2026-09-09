import { Response } from 'express';
import { ApiResponse } from '../types/index.js';

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: ApiResponse<T>['meta']
): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(meta ? { meta } : {})
  };
  return res.status(statusCode).json(response);
}

export function sendCreated<T>(
  res: Response,
  data: T,
  meta?: ApiResponse<T>['meta']
): Response {
  return sendSuccess(res, data, 201, meta);
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number
): Response {
  const totalPages = Math.ceil(total / limit) || 1;
  return sendSuccess(res, data, 200, {
    page,
    limit,
    total,
    totalPages
  });
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode = 500,
  details?: unknown[]
): Response {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && details.length > 0 ? { details } : {})
    }
  };
  return res.status(statusCode).json(response);
}
