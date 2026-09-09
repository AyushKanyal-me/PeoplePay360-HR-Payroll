-- ============================================================
-- PeoplePay360 — Migration 3: Constraints & Indexes
-- Exclusion constraint for contract overlap prevention,
-- plus all performance indexes.
-- ============================================================

-- ============================================
-- EXCLUSION CONSTRAINT: prevent overlapping ACTIVE contracts
-- Uses btree_gist (enabled in migration 1).
-- COALESCE handles open-ended contracts (end_date IS NULL).
-- ============================================
ALTER TABLE contracts
  ADD CONSTRAINT no_overlapping_active_contracts
  EXCLUDE USING gist (
    employee_id WITH =,
    daterange(start_date, COALESCE(end_date, '9999-12-31'::date), '[]') WITH &&
  ) WHERE (status = 'ACTIVE');

-- ============================================
-- CHECK CONSTRAINT: contract end_date >= start_date
-- ============================================
ALTER TABLE contracts
  ADD CONSTRAINT chk_contract_dates
  CHECK (end_date IS NULL OR end_date >= start_date);

-- ============================================
-- CHECK CONSTRAINT: time-off request end_date >= start_date
-- ============================================
ALTER TABLE time_off_requests
  ADD CONSTRAINT chk_time_off_request_dates
  CHECK (end_date >= start_date);

-- ============================================
-- CHECK CONSTRAINT: allocation used_amount <= allocated_amount
-- ============================================
ALTER TABLE time_off_allocations
  ADD CONSTRAINT chk_allocation_balance
  CHECK (used_amount <= allocated_amount);

-- ============================================
-- CHECK CONSTRAINT: payrun period_end >= period_start
-- ============================================
ALTER TABLE payruns
  ADD CONSTRAINT chk_payrun_dates
  CHECK (period_end >= period_start);

-- ============================================
-- INDEXES: employees
-- ============================================
CREATE INDEX idx_employees_company_id    ON employees(company_id);
CREATE INDEX idx_employees_department_id ON employees(department_id);
CREATE INDEX idx_employees_status        ON employees(status);
CREATE INDEX idx_employees_email         ON employees(email);
CREATE INDEX idx_employees_manager_id    ON employees(manager_id);

-- ============================================
-- INDEXES: departments
-- ============================================
CREATE INDEX idx_departments_company_id ON departments(company_id);

-- ============================================
-- INDEXES: job_positions
-- ============================================
CREATE INDEX idx_job_positions_company_id ON job_positions(company_id);

-- ============================================
-- INDEXES: working_schedules
-- ============================================
CREATE INDEX idx_working_schedules_company_id ON working_schedules(company_id);

-- ============================================
-- INDEXES: contracts
-- ============================================
CREATE INDEX idx_contracts_employee_id          ON contracts(employee_id);
CREATE INDEX idx_contracts_start_date           ON contracts(start_date);
CREATE INDEX idx_contracts_end_date             ON contracts(end_date);
CREATE INDEX idx_contracts_status               ON contracts(status);
CREATE INDEX idx_contracts_salary_structure_id  ON contracts(salary_structure_id);
-- Composite: find active contract for an employee at a date
CREATE INDEX idx_contracts_employee_status      ON contracts(employee_id, status);

-- ============================================
-- INDEXES: attendance
-- ============================================
CREATE INDEX idx_attendance_employee_id    ON attendance(employee_id);
CREATE INDEX idx_attendance_date           ON attendance(attendance_date);
-- Composite: look up attendance by employee + date range
CREATE INDEX idx_attendance_employee_date  ON attendance(employee_id, attendance_date);

-- ============================================
-- INDEXES: time_off_types
-- ============================================
CREATE INDEX idx_time_off_types_company_id ON time_off_types(company_id);

-- ============================================
-- INDEXES: time_off_allocations
-- ============================================
CREATE INDEX idx_time_off_allocations_employee_id ON time_off_allocations(employee_id);
CREATE INDEX idx_time_off_allocations_type_id     ON time_off_allocations(time_off_type_id);

-- ============================================
-- INDEXES: time_off_requests
-- ============================================
CREATE INDEX idx_time_off_requests_employee_id     ON time_off_requests(employee_id);
CREATE INDEX idx_time_off_requests_status           ON time_off_requests(status);
-- Composite: filter employee requests by status
CREATE INDEX idx_time_off_requests_employee_status ON time_off_requests(employee_id, status);

-- ============================================
-- INDEXES: salary_structures
-- ============================================
CREATE INDEX idx_salary_structures_company_id ON salary_structures(company_id);

-- ============================================
-- INDEXES: salary_structure_rules
-- ============================================
CREATE INDEX idx_salary_structure_rules_structure_id ON salary_structure_rules(salary_structure_id);
CREATE INDEX idx_salary_structure_rules_rule_id      ON salary_structure_rules(salary_rule_id);

-- ============================================
-- INDEXES: payruns
-- ============================================
CREATE INDEX idx_payruns_company_id   ON payruns(company_id);
CREATE INDEX idx_payruns_period_start ON payruns(period_start);
CREATE INDEX idx_payruns_period_end   ON payruns(period_end);
CREATE INDEX idx_payruns_status       ON payruns(status);

-- ============================================
-- INDEXES: payrun_employees
-- ============================================
CREATE INDEX idx_payrun_employees_payrun_id   ON payrun_employees(payrun_id);
CREATE INDEX idx_payrun_employees_employee_id ON payrun_employees(employee_id);

-- ============================================
-- INDEXES: payslips
-- ============================================
CREATE INDEX idx_payslips_payrun_id   ON payslips(payrun_id);
CREATE INDEX idx_payslips_employee_id ON payslips(employee_id);
-- Composite: payslip period queries
CREATE INDEX idx_payslips_period      ON payslips(period_start, period_end);

-- ============================================
-- INDEXES: payslip_items
-- ============================================
CREATE INDEX idx_payslip_items_payslip_id ON payslip_items(payslip_id);

-- ============================================
-- INDEXES: payroll_warnings
-- ============================================
CREATE INDEX idx_payroll_warnings_payrun_id   ON payroll_warnings(payrun_id);
CREATE INDEX idx_payroll_warnings_payslip_id  ON payroll_warnings(payslip_id);
CREATE INDEX idx_payroll_warnings_employee_id ON payroll_warnings(employee_id);

-- ============================================
-- INDEXES: payslip_deliveries
-- ============================================
CREATE INDEX idx_payslip_deliveries_payslip_id ON payslip_deliveries(payslip_id);

-- ============================================
-- INDEXES: audit_logs
-- ============================================
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_entity_id   ON audit_logs(entity_id);
CREATE INDEX idx_audit_logs_user_id     ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at  ON audit_logs(created_at);
-- Composite: filter audit logs by entity
CREATE INDEX idx_audit_logs_entity      ON audit_logs(entity_type, entity_id);

-- ============================================
-- INDEXES: users
-- ============================================
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX idx_users_employee_id  ON users(employee_id);
