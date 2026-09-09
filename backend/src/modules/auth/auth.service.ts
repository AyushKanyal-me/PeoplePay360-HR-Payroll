import { supabaseAnonClient } from '../../config/supabase.js';
import { authRepository, AuthRepository } from './auth.repository.js';
import { AuthenticatedUser } from '../../types/auth.js';
import { UnauthorizedError } from '../../utils/errors.js';

export class AuthService {
  constructor(private readonly repo: AuthRepository = authRepository) { }

  async validateToken(token: string): Promise<AuthenticatedUser> {
    const { data, error } = await supabaseAnonClient.auth.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedError('Invalid, expired or unrecognized authentication token');
    }

    const user = await this.repo.getUserByAuthId(data.user.id);

    if (!user) {
      throw new UnauthorizedError('User account not found or is currently inactive in the system');
    }

    return user;
  }

  getProfile(user: AuthenticatedUser) {
    return {
      user: {
        id: user.id,
        auth_user_id: user.authUserId,
        email: user.email,
        first_name: user.firstName ?? null,
        last_name: user.lastName ?? null,
        is_active: user.isActive
      },
      employee: user.employee
        ? {
          id: user.employee.id,
          first_name: user.employee.firstName,
          last_name: user.employee.lastName,
          work_email: user.employee.workEmail,
          status: user.employee.status,
          department_id: user.employee.departmentId ?? null,
          job_position_id: user.employee.jobPositionId ?? null
        }
        : null,
      company_id: user.companyId ?? null,
      roles: user.roles
    };
  }
}

export const authService = new AuthService();
