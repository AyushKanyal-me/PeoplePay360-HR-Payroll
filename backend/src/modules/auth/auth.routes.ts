import { Router } from 'express';
import { authController } from './auth.controller.js';
import { requireAuth } from '../../middleware/auth.js';

const authRouter = Router();

/**
 * GET /api/v1/auth/me
 * Returns authenticated user, linked employee, company, and roles.
 */
authRouter.get('/me', requireAuth(), authController.getMe);

export { authRouter };
