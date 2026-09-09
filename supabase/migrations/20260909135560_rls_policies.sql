-- ============================================================
-- PeoplePay360 — Migration 4: Row Level Security
-- Helper functions (SECURITY DEFINER to avoid recursive RLS)
-- and per-table policies.
-- ============================================================

-- ============================================
-- HELPER FUNCTIONS
-- All SECURITY DEFINER so they bypass RLS
-- and avoid recursive policy evaluation.
-- ============================================

-- Returns the internal users.id for the authenticated Supabase user.
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM public.users
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$;

-- Returns the employee_id linked to the authenticated user.
CREATE OR REPLACE FUNCTION public.get_current_employee_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT employee_id FROM public.users
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$;

-- Returns the company_id for the authenticated user.
CREATE OR REPLACE FUNCTION public.get_current_company_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT e.company_id
  FROM public.users u
  JOIN public.employees e ON e.id = u.employee_id
  WHERE u.auth_user_id = auth.uid()
  LIMIT 1;
$$;

-- Checks if the current user has a specific role.
CREATE OR REPLACE FUNCTION public.user_has_role(p_role_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    JOIN public.users u ON u.id = ur.user_id
    WHERE u.auth_user_id = auth.uid()
      AND r.name = p_role_name
  );
$$;

-- ============================================
-- ENABLE RLS ON ALL APPLICATION TABLES
-- ============================================
ALTER TABLE companies              ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_positions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE working_schedules      ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_days          ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees              ENABLE ROW LEVEL SECURITY;
ALTER TABLE users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_types         ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_allocations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_requests      ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance             ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_structures      ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_rules           ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_structure_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE payruns                ENABLE ROW LEVEL SECURITY;
ALTER TABLE payrun_employees       ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslips               ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslip_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_warnings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE payslip_deliveries     ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs             ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLICIES
-- ============================================================
-- Naming convention:  <table>_<operation>_<scope>
--
-- Pattern used:
--   FOR SELECT  →  read-only policy (employees see own data)
--   FOR INSERT  →  insert-only policy
--   FOR ALL     →  full CRUD (HR / admin roles); also covers
--                   SELECT so HR doesn't need a separate read policy.
--
-- NOTE: When multiple policies exist for the same operation they
-- are combined with OR, so an employee's own-data SELECT policy
-- and the HR FOR-ALL policy compose correctly.
-- ============================================================

-- ----------------------------------------------------------------
-- companies
-- ----------------------------------------------------------------
CREATE POLICY companies_select_own ON companies
  FOR SELECT TO authenticated
  USING (id = get_current_company_id());

CREATE POLICY companies_manage_admin ON companies
  FOR ALL TO authenticated
  USING (user_has_role('ADMIN'))
  WITH CHECK (user_has_role('ADMIN'));

-- ----------------------------------------------------------------
-- departments
-- ----------------------------------------------------------------
CREATE POLICY departments_select ON departments
  FOR SELECT TO authenticated
  USING (company_id = get_current_company_id());

CREATE POLICY departments_manage ON departments
  FOR ALL TO authenticated
  USING (
    company_id = get_current_company_id()
    AND (user_has_role('HR_MANAGER') OR user_has_role('ADMIN'))
  )
  WITH CHECK (
    company_id = get_current_company_id()
    AND (user_has_role('HR_MANAGER') OR user_has_role('ADMIN'))
  );

-- ----------------------------------------------------------------
-- job_positions
-- ----------------------------------------------------------------
CREATE POLICY job_positions_select ON job_positions
  FOR SELECT TO authenticated
  USING (company_id = get_current_company_id());

CREATE POLICY job_positions_manage ON job_positions
  FOR ALL TO authenticated
  USING (
    company_id = get_current_company_id()
    AND (user_has_role('HR_MANAGER') OR user_has_role('ADMIN'))
  )
  WITH CHECK (
    company_id = get_current_company_id()
    AND (user_has_role('HR_MANAGER') OR user_has_role('ADMIN'))
  );

-- ----------------------------------------------------------------
-- working_schedules
-- ----------------------------------------------------------------
CREATE POLICY working_schedules_select ON working_schedules
  FOR SELECT TO authenticated
  USING (company_id = get_current_company_id());

CREATE POLICY working_schedules_manage ON working_schedules
  FOR ALL TO authenticated
  USING (
    company_id = get_current_company_id()
    AND (user_has_role('HR_MANAGER') OR user_has_role('ADMIN'))
  )
  WITH CHECK (
    company_id = get_current_company_id()
    AND (user_has_role('HR_MANAGER') OR user_has_role('ADMIN'))
  );

-- ----------------------------------------------------------------
-- schedule_days
-- ----------------------------------------------------------------
CREATE POLICY schedule_days_select ON schedule_days
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM working_schedules ws
      WHERE ws.id = schedule_days.schedule_id
        AND ws.company_id = get_current_company_id()
    )
  );

CREATE POLICY schedule_days_manage ON schedule_days
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM working_schedules ws
      WHERE ws.id = schedule_days.schedule_id
        AND ws.company_id = get_current_company_id()
    )
    AND (user_has_role('HR_MANAGER') OR user_has_role('ADMIN'))
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM working_schedules ws
      WHERE ws.id = schedule_days.schedule_id
        AND ws.company_id = get_current_company_id()
    )
    AND (user_has_role('HR_MANAGER') OR user_has_role('ADMIN'))
  );

-- ----------------------------------------------------------------
-- employees
-- ----------------------------------------------------------------
-- Employees see their own record
CREATE POLICY employees_select_own ON employees
  FOR SELECT TO authenticated
  USING (id = get_current_employee_id());

-- HR/Admin full access within company
CREATE POLICY employees_manage ON employees
  FOR ALL TO authenticated
  USING (
    company_id = get_current_company_id()
    AND (user_has_role('HR_MANAGER') OR user_has_role('ADMIN'))
  )
  WITH CHECK (
    company_id = get_current_company_id()
    AND (user_has_role('HR_MANAGER') OR user_has_role('ADMIN'))
  );

-- ----------------------------------------------------------------
-- users
-- ----------------------------------------------------------------
-- Users see their own record (uses auth.uid() directly — no recursion)
CREATE POLICY users_select_own ON users
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

-- ADMIN can view and manage all users
CREATE POLICY users_manage_admin ON users
  FOR ALL TO authenticated
  USING (user_has_role('ADMIN'))
  WITH CHECK (user_has_role('ADMIN'));

-- ----------------------------------------------------------------
-- roles  (read-only for all authenticated; ADMIN manages)
-- ----------------------------------------------------------------
CREATE POLICY roles_select ON roles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY roles_manage ON roles
  FOR ALL TO authenticated
  USING (user_has_role('ADMIN'))
  WITH CHECK (user_has_role('ADMIN'));

-- ----------------------------------------------------------------
-- user_roles
-- ----------------------------------------------------------------
-- Users can see their own role assignments
CREATE POLICY user_roles_select_own ON user_roles
  FOR SELECT TO authenticated
  USING (user_id = get_current_user_id());

-- ADMIN can manage all role assignments
CREATE POLICY user_roles_manage_admin ON user_roles
  FOR ALL TO authenticated
  USING (user_has_role('ADMIN'))
  WITH CHECK (user_has_role('ADMIN'));

-- ----------------------------------------------------------------
-- time_off_types
-- ----------------------------------------------------------------
CREATE POLICY time_off_types_select ON time_off_types
  FOR SELECT TO authenticated
  USING (company_id = get_current_company_id());

CREATE POLICY time_off_types_manage ON time_off_types
  FOR ALL TO authenticated
  USING (
    company_id = get_current_company_id()
    AND (user_has_role('HR_MANAGER') OR user_has_role('ADMIN'))
  )
  WITH CHECK (
    company_id = get_current_company_id()
    AND (user_has_role('HR_MANAGER') OR user_has_role('ADMIN'))
  );

-- ----------------------------------------------------------------
-- time_off_allocations
-- ----------------------------------------------------------------
-- Employees see their own allocations
CREATE POLICY time_off_allocations_select_own ON time_off_allocations
  FOR SELECT TO authenticated
  USING (employee_id = get_current_employee_id());

-- HR/Admin can manage all allocations within company
CREATE POLICY time_off_allocations_manage ON time_off_allocations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = time_off_allocations.employee_id
        AND e.company_id = get_current_company_id()
    )
    AND (user_has_role('HR_MANAGER') OR user_has_role('ADMIN'))
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = time_off_allocations.employee_id
        AND e.company_id = get_current_company_id()
    )
    AND (user_has_role('HR_MANAGER') OR user_has_role('ADMIN'))
  );

-- ----------------------------------------------------------------
-- time_off_requests
-- ----------------------------------------------------------------
-- Employees see their own requests
CREATE POLICY time_off_requests_select_own ON time_off_requests
  FOR SELECT TO authenticated
  USING (employee_id = get_current_employee_id());

-- Employees can create their own requests
CREATE POLICY time_off_requests_insert_own ON time_off_requests
  FOR INSERT TO authenticated
  WITH CHECK (employee_id = get_current_employee_id());

-- HR/Admin can view and manage all requests in company
CREATE POLICY time_off_requests_manage ON time_off_requests
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = time_off_requests.employee_id
        AND e.company_id = get_current_company_id()
    )
    AND (user_has_role('HR_MANAGER') OR user_has_role('ADMIN'))
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = time_off_requests.employee_id
        AND e.company_id = get_current_company_id()
    )
    AND (user_has_role('HR_MANAGER') OR user_has_role('ADMIN'))
  );

-- ----------------------------------------------------------------
-- attendance
-- ----------------------------------------------------------------
-- Employees see their own attendance
CREATE POLICY attendance_select_own ON attendance
  FOR SELECT TO authenticated
  USING (employee_id = get_current_employee_id());

-- HR/Admin can manage all attendance in company
CREATE POLICY attendance_manage ON attendance
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = attendance.employee_id
        AND e.company_id = get_current_company_id()
    )
    AND (user_has_role('HR_MANAGER') OR user_has_role('ADMIN'))
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = attendance.employee_id
        AND e.company_id = get_current_company_id()
    )
    AND (user_has_role('HR_MANAGER') OR user_has_role('ADMIN'))
  );

-- ----------------------------------------------------------------
-- salary_structures
-- ----------------------------------------------------------------
-- All authenticated users in company can view
CREATE POLICY salary_structures_select ON salary_structures
  FOR SELECT TO authenticated
  USING (company_id = get_current_company_id());

-- Payroll managers / admins can manage
CREATE POLICY salary_structures_manage ON salary_structures
  FOR ALL TO authenticated
  USING (
    company_id = get_current_company_id()
    AND (user_has_role('HR_PAYROLL_MANAGER') OR user_has_role('ADMIN'))
  )
  WITH CHECK (
    company_id = get_current_company_id()
    AND (user_has_role('HR_PAYROLL_MANAGER') OR user_has_role('ADMIN'))
  );

-- ----------------------------------------------------------------
-- salary_rules  (global — not company-scoped)
-- ----------------------------------------------------------------
-- All authenticated users can view
CREATE POLICY salary_rules_select ON salary_rules
  FOR SELECT TO authenticated
  USING (true);

-- Only payroll managers / admins can manage
CREATE POLICY salary_rules_manage ON salary_rules
  FOR ALL TO authenticated
  USING (user_has_role('HR_PAYROLL_MANAGER') OR user_has_role('ADMIN'))
  WITH CHECK (user_has_role('HR_PAYROLL_MANAGER') OR user_has_role('ADMIN'));

-- ----------------------------------------------------------------
-- salary_structure_rules
-- ----------------------------------------------------------------
CREATE POLICY salary_structure_rules_select ON salary_structure_rules
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM salary_structures ss
      WHERE ss.id = salary_structure_rules.salary_structure_id
        AND ss.company_id = get_current_company_id()
    )
  );

CREATE POLICY salary_structure_rules_manage ON salary_structure_rules
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM salary_structures ss
      WHERE ss.id = salary_structure_rules.salary_structure_id
        AND ss.company_id = get_current_company_id()
    )
    AND (user_has_role('HR_PAYROLL_MANAGER') OR user_has_role('ADMIN'))
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM salary_structures ss
      WHERE ss.id = salary_structure_rules.salary_structure_id
        AND ss.company_id = get_current_company_id()
    )
    AND (user_has_role('HR_PAYROLL_MANAGER') OR user_has_role('ADMIN'))
  );

-- ----------------------------------------------------------------
-- contracts
-- ----------------------------------------------------------------
-- Employees see their own contracts
CREATE POLICY contracts_select_own ON contracts
  FOR SELECT TO authenticated
  USING (employee_id = get_current_employee_id());

-- HR/Admin can manage contracts within company
CREATE POLICY contracts_manage ON contracts
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = contracts.employee_id
        AND e.company_id = get_current_company_id()
    )
    AND (user_has_role('HR_MANAGER') OR user_has_role('ADMIN'))
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.id = contracts.employee_id
        AND e.company_id = get_current_company_id()
    )
    AND (user_has_role('HR_MANAGER') OR user_has_role('ADMIN'))
  );

-- ----------------------------------------------------------------
-- payruns
-- ----------------------------------------------------------------
-- Payroll users can view payruns in their company
CREATE POLICY payruns_select ON payruns
  FOR SELECT TO authenticated
  USING (
    company_id = get_current_company_id()
    AND (
      user_has_role('HR_PAYROLL_USER')
      OR user_has_role('HR_PAYROLL_MANAGER')
      OR user_has_role('ADMIN')
    )
  );

-- Payroll managers / admins can manage payruns
CREATE POLICY payruns_manage ON payruns
  FOR ALL TO authenticated
  USING (
    company_id = get_current_company_id()
    AND (user_has_role('HR_PAYROLL_MANAGER') OR user_has_role('ADMIN'))
  )
  WITH CHECK (
    company_id = get_current_company_id()
    AND (user_has_role('HR_PAYROLL_MANAGER') OR user_has_role('ADMIN'))
  );

-- ----------------------------------------------------------------
-- payrun_employees
-- ----------------------------------------------------------------
CREATE POLICY payrun_employees_select ON payrun_employees
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM payruns p
      WHERE p.id = payrun_employees.payrun_id
        AND p.company_id = get_current_company_id()
    )
    AND (
      user_has_role('HR_PAYROLL_USER')
      OR user_has_role('HR_PAYROLL_MANAGER')
      OR user_has_role('ADMIN')
    )
  );

CREATE POLICY payrun_employees_manage ON payrun_employees
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM payruns p
      WHERE p.id = payrun_employees.payrun_id
        AND p.company_id = get_current_company_id()
    )
    AND (user_has_role('HR_PAYROLL_MANAGER') OR user_has_role('ADMIN'))
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM payruns p
      WHERE p.id = payrun_employees.payrun_id
        AND p.company_id = get_current_company_id()
    )
    AND (user_has_role('HR_PAYROLL_MANAGER') OR user_has_role('ADMIN'))
  );

-- ----------------------------------------------------------------
-- payslips
-- ----------------------------------------------------------------
-- Employees can view their own payslips
CREATE POLICY payslips_select_own ON payslips
  FOR SELECT TO authenticated
  USING (employee_id = get_current_employee_id());

-- Payroll users can view all payslips in company
CREATE POLICY payslips_select_payroll ON payslips
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM payruns p
      WHERE p.id = payslips.payrun_id
        AND p.company_id = get_current_company_id()
    )
    AND (
      user_has_role('HR_PAYROLL_USER')
      OR user_has_role('HR_PAYROLL_MANAGER')
      OR user_has_role('ADMIN')
    )
  );

-- Payroll managers can manage payslips
CREATE POLICY payslips_manage ON payslips
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM payruns p
      WHERE p.id = payslips.payrun_id
        AND p.company_id = get_current_company_id()
    )
    AND (user_has_role('HR_PAYROLL_MANAGER') OR user_has_role('ADMIN'))
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM payruns p
      WHERE p.id = payslips.payrun_id
        AND p.company_id = get_current_company_id()
    )
    AND (user_has_role('HR_PAYROLL_MANAGER') OR user_has_role('ADMIN'))
  );

-- ----------------------------------------------------------------
-- payslip_items
-- ----------------------------------------------------------------
-- Employees can view items for their own payslips
CREATE POLICY payslip_items_select_own ON payslip_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM payslips ps
      WHERE ps.id = payslip_items.payslip_id
        AND ps.employee_id = get_current_employee_id()
    )
  );

-- Payroll users can view all payslip items in company
CREATE POLICY payslip_items_select_payroll ON payslip_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM payslips ps
      JOIN payruns p ON p.id = ps.payrun_id
      WHERE ps.id = payslip_items.payslip_id
        AND p.company_id = get_current_company_id()
    )
    AND (
      user_has_role('HR_PAYROLL_USER')
      OR user_has_role('HR_PAYROLL_MANAGER')
      OR user_has_role('ADMIN')
    )
  );

-- Payroll managers can manage payslip items
CREATE POLICY payslip_items_manage ON payslip_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM payslips ps
      JOIN payruns p ON p.id = ps.payrun_id
      WHERE ps.id = payslip_items.payslip_id
        AND p.company_id = get_current_company_id()
    )
    AND (user_has_role('HR_PAYROLL_MANAGER') OR user_has_role('ADMIN'))
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM payslips ps
      JOIN payruns p ON p.id = ps.payrun_id
      WHERE ps.id = payslip_items.payslip_id
        AND p.company_id = get_current_company_id()
    )
    AND (user_has_role('HR_PAYROLL_MANAGER') OR user_has_role('ADMIN'))
  );

-- ----------------------------------------------------------------
-- payroll_warnings
-- ----------------------------------------------------------------
CREATE POLICY payroll_warnings_select ON payroll_warnings
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM payruns p
      WHERE p.id = payroll_warnings.payrun_id
        AND p.company_id = get_current_company_id()
    )
    AND (
      user_has_role('HR_PAYROLL_USER')
      OR user_has_role('HR_PAYROLL_MANAGER')
      OR user_has_role('ADMIN')
    )
  );

CREATE POLICY payroll_warnings_manage ON payroll_warnings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM payruns p
      WHERE p.id = payroll_warnings.payrun_id
        AND p.company_id = get_current_company_id()
    )
    AND (user_has_role('HR_PAYROLL_MANAGER') OR user_has_role('ADMIN'))
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM payruns p
      WHERE p.id = payroll_warnings.payrun_id
        AND p.company_id = get_current_company_id()
    )
    AND (user_has_role('HR_PAYROLL_MANAGER') OR user_has_role('ADMIN'))
  );

-- ----------------------------------------------------------------
-- payslip_deliveries
-- ----------------------------------------------------------------
CREATE POLICY payslip_deliveries_select ON payslip_deliveries
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM payslips ps
      JOIN payruns p ON p.id = ps.payrun_id
      WHERE ps.id = payslip_deliveries.payslip_id
        AND p.company_id = get_current_company_id()
    )
    AND (
      user_has_role('HR_PAYROLL_USER')
      OR user_has_role('HR_PAYROLL_MANAGER')
      OR user_has_role('ADMIN')
    )
  );

CREATE POLICY payslip_deliveries_manage ON payslip_deliveries
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM payslips ps
      JOIN payruns p ON p.id = ps.payrun_id
      WHERE ps.id = payslip_deliveries.payslip_id
        AND p.company_id = get_current_company_id()
    )
    AND (user_has_role('HR_PAYROLL_MANAGER') OR user_has_role('ADMIN'))
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM payslips ps
      JOIN payruns p ON p.id = ps.payrun_id
      WHERE ps.id = payslip_deliveries.payslip_id
        AND p.company_id = get_current_company_id()
    )
    AND (user_has_role('HR_PAYROLL_MANAGER') OR user_has_role('ADMIN'))
  );

-- ----------------------------------------------------------------
-- audit_logs
-- Only ADMIN can read audit logs.
-- Inserts are done by the backend via service-role key
-- (which bypasses RLS), so no INSERT policy is needed.
-- ----------------------------------------------------------------
CREATE POLICY audit_logs_select_admin ON audit_logs
  FOR SELECT TO authenticated
  USING (user_has_role('ADMIN'));

-- ============================================================
-- NOTE ON PRODUCTION RLS
-- ============================================================
-- These policies provide a solid baseline. In production you
-- should also consider:
--   • Manager-level access (managers viewing their direct
--     reports' data)
--   • Backend service-role operations that bypass RLS for
--     payroll computation, audit logging, etc.
--   • Rate limiting and additional validation at the API layer
-- ============================================================
