export type CanonicalRole =
  | 'ADMIN'
  | 'HR_MANAGER'
  | 'HR_PAYROLL_MANAGER'
  | 'HR_PAYROLL_USER'
  | 'EMPLOYEE';

export interface LinkedEmployee {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  status: string;
  departmentId?: string | null;
  jobPositionId?: string | null;
}

export interface AuthenticatedUser {
  id: string; // public.users.id
  authUserId: string; // auth.users.id
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  employeeId?: string | null; // public.employees.id
  companyId?: string | null; // public.companies.id
  roles: CanonicalRole[];
  isActive: boolean;
  employee?: LinkedEmployee | null;
}

export interface RequestContext {
  userId: string;
  authUserId: string;
  employeeId?: string | null;
  companyId?: string | null;
  roles: CanonicalRole[];
  token: string;
  user: AuthenticatedUser;
}
