import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { authService } from '../src/modules/auth/auth.service.js';
import { UnauthorizedError } from '../src/utils/errors.js';
import { AuthenticatedUser } from '../src/types/auth.js';

describe('Phase 2 — Authentication & Profile API (GET /api/v1/auth/me)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Missing JWT should return 401 Unauthorized', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
    expect(res.body.error.message).toContain('Authorization header missing');
  });

  it('2. Invalid or malformed JWT should return 401 Unauthorized', async () => {
    vi.spyOn(authService, 'validateToken').mockRejectedValueOnce(
      new UnauthorizedError('Invalid, expired or unrecognized authentication token')
    );

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid-token-xyz');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('3. Valid JWT should return 200 with authenticated user, linked employee, and canonical roles', async () => {
    const mockUser: AuthenticatedUser = {
      id: '11111111-1111-1111-1111-111111111111',
      authUserId: 'auth-uid-12345',
      email: 'admin@peoplepay360.com',
      firstName: 'Aarav',
      lastName: 'Mehta',
      employeeId: '22222222-2222-2222-2222-222222222222',
      companyId: '33333333-3333-3333-3333-333333333333',
      roles: ['ADMIN'],
      isActive: true,
      employee: {
        id: '22222222-2222-2222-2222-222222222222',
        companyId: '33333333-3333-3333-3333-333333333333',
        firstName: 'Aarav',
        lastName: 'Mehta',
        workEmail: 'aarav@peoplepay360.com',
        status: 'ACTIVE',
        departmentId: 'dept-uuid',
        jobPositionId: 'job-uuid'
      }
    };

    vi.spyOn(authService, 'validateToken').mockResolvedValueOnce(mockUser);

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer valid-jwt-token');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.id).toBe(mockUser.id);
    expect(res.body.data.user.email).toBe('admin@peoplepay360.com');
    expect(res.body.data.user.first_name).toBe('Aarav');
    expect(res.body.data.employee.id).toBe(mockUser.employeeId);
    expect(res.body.data.company_id).toBe(mockUser.companyId);
    expect(res.body.data.roles).toEqual(['ADMIN']);
    expect(res.body.data.password).toBeUndefined();
    expect(res.body.data.token).toBeUndefined();
  });
});
