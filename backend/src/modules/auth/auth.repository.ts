import { supabaseAdminClient } from '../../config/supabase.js';
import { AuthenticatedUser, CanonicalRole, LinkedEmployee } from '../../types/auth.js';
import { DatabaseError } from '../../utils/errors.js';

export class AuthRepository {
  async getUserByAuthId(authUserId: string): Promise<AuthenticatedUser | null> {
    const { data: userRecord, error: userError } = await supabaseAdminClient
      .from('users')
      .select(`
        id,
        auth_user_id,
        email,
        first_name,
        last_name,
        employee_id,
        is_active,
        employees (
          id,
          company_id,
          first_name,
          last_name,
          work_email,
          status,
          department_id,
          job_position_id
        )
      `)
      .eq('auth_user_id', authUserId)
      .eq('is_active', true)
      .maybeSingle();

    if (userError) {
      throw new DatabaseError(`Failed to fetch user by auth ID: ${userError.message}`, [userError]);
    }

    if (!userRecord) {
      return null;
    }

    const { data: userRoles, error: rolesError } = await supabaseAdminClient
      .from('user_roles')
      .select(`
        roles (
          name
        )
      `)
      .eq('user_id', userRecord.id);

    if (rolesError) {
      throw new DatabaseError(`Failed to fetch user roles: ${rolesError.message}`, [rolesError]);
    }

    const roles: CanonicalRole[] = (userRoles || [])
      .map((ur: any) => ur.roles?.name as CanonicalRole)
      .filter(Boolean);

    const empData: any = Array.isArray(userRecord.employees)
      ? userRecord.employees[0]
      : userRecord.employees;

    const employee: LinkedEmployee | null = empData
      ? {
        id: empData.id,
        companyId: empData.company_id,
        firstName: empData.first_name,
        lastName: empData.last_name,
        workEmail: empData.work_email,
        status: empData.status,
        departmentId: empData.department_id,
        jobPositionId: empData.job_position_id
      }
      : null;

    return {
      id: userRecord.id,
      authUserId: userRecord.auth_user_id,
      email: userRecord.email,
      firstName: userRecord.first_name,
      lastName: userRecord.last_name,
      employeeId: userRecord.employee_id,
      companyId: employee?.companyId ?? null,
      roles,
      isActive: userRecord.is_active,
      employee
    };
  }
}

export const authRepository = new AuthRepository();
