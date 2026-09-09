import morgan from 'morgan';
import { Request, Response } from 'express';
import { env } from '../config/env.js';

morgan.token('body', (req: Request) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const sanitized = { ...req.body };
    if (sanitized.password) sanitized.password = '***';
    if (sanitized.token) sanitized.token = '***';
    return JSON.stringify(sanitized);
  }
  return '';
});

export const requestLogger = env.NODE_ENV === 'test'
  ? (_req: Request, _res: Response, next: () => void) => next()
  : morgan(':method :url :status :res[content-length] - :response-time ms');
