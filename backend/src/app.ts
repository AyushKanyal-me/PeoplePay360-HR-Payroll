import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { requestLogger } from './middleware/logger.js';
import { errorHandler } from './middleware/error.js';
import { apiV1Router } from './routes/index.js';
import { sendSuccess } from './utils/response.js';
import { NotFoundError } from './utils/errors.js';

const app: Express = express();

// Security and utility middlewares
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

/**
 * Root Health Check
 * GET /health
 */
app.get('/health', (_req, res) => {
  sendSuccess(res, {
    status: 'ok'
  });
});

// Mount Versioned API router
app.use(env.API_PREFIX, apiV1Router);

// 404 Handler for unmatched routes
app.use((_req, _res, next) => {
  next(new NotFoundError('The requested endpoint was not found on this server'));
});

// Centralized error handler (must be last)
app.use(errorHandler);

export { app };
