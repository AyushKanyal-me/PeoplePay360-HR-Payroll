-- ============================================================
-- PeoplePay360 — Migration 2: Dependent Tables
-- Attendance, leave, salary, payroll, audit
-- ============================================================

-- ============================================
-- TABLE: time_off_types
-- ============================================
CREATE TABLE time_off_types (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  code                TEXT NOT NULL,
  unit                time_off_unit NOT NULL DEFAULT 'DAYS',
  requires_allocation BOOLEAN NOT NULL DEFAULT true,
  requires_approval   BOOLEAN NOT NULL DEFAULT true,
  payroll_integration BOOLEAN NOT NULL DEFAULT false,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_time_off_types_updated_at
  BEFORE UPDATE ON time_off_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: time_off_allocations
-- ============================================
CREATE TABLE time_off_allocations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id       UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  time_off_type_id  UUID NOT NULL REFERENCES time_off_types(id) ON DELETE CASCADE,
  allocated_amount  NUMERIC NOT NULL DEFAULT 0,
  used_amount       NUMERIC NOT NULL DEFAULT 0,
  start_date        DATE,
  end_date          DATE,
  status            allocation_status NOT NULL DEFAULT 'ACTIVE',
  approved_at       TIMESTAMPTZ,
  approved_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_time_off_allocations_updated_at
  BEFORE UPDATE ON time_off_allocations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: time_off_requests
-- ============================================
CREATE TABLE time_off_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id       UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  time_off_type_id  UUID NOT NULL REFERENCES time_off_types(id) ON DELETE CASCADE,
  allocation_id     UUID REFERENCES time_off_allocations(id) ON DELETE SET NULL,
  start_date        DATE NOT NULL,
  end_date          DATE NOT NULL,
  duration          NUMERIC NOT NULL,
  reason            TEXT,
  status            time_off_request_status NOT NULL DEFAULT 'PENDING',
  approved_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at       TIMESTAMPTZ,
  rejection_reason  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_time_off_requests_updated_at
  BEFORE UPDATE ON time_off_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: attendance
-- ============================================
CREATE TABLE attendance (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  check_in        TIMESTAMPTZ,
  check_out       TIMESTAMPTZ,
  worked_hours    NUMERIC,
  overtime_hours  NUMERIC DEFAULT 0,
  status          attendance_status NOT NULL DEFAULT 'PRESENT',
  is_manual_edit  BOOLEAN NOT NULL DEFAULT false,
  correction_note TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_attendance_employee_date UNIQUE (employee_id, attendance_date)
);

CREATE TRIGGER trg_attendance_updated_at
  BEFORE UPDATE ON attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: salary_structures
-- ============================================
CREATE TABLE salary_structures (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  code        TEXT NOT NULL,
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_salary_structures_updated_at
  BEFORE UPDATE ON salary_structures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: salary_rules
-- (global — not scoped to a company)
-- ============================================
CREATE TABLE salary_rules (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  code              TEXT NOT NULL,
  category          salary_rule_category NOT NULL,
  calculation_type  calculation_type_enum NOT NULL DEFAULT 'FIXED',
  fixed_amount      NUMERIC,
  percentage        NUMERIC,
  formula           TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_salary_rules_updated_at
  BEFORE UPDATE ON salary_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: salary_structure_rules
-- (junction between salary_structures and salary_rules)
-- ============================================
CREATE TABLE salary_structure_rules (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salary_structure_id  UUID NOT NULL REFERENCES salary_structures(id) ON DELETE CASCADE,
  salary_rule_id       UUID NOT NULL REFERENCES salary_rules(id) ON DELETE CASCADE,
  sequence             INTEGER NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_structure_rule UNIQUE (salary_structure_id, salary_rule_id),
  CONSTRAINT uq_structure_sequence UNIQUE (salary_structure_id, sequence)
);

-- ============================================
-- TABLE: contracts
-- ============================================
CREATE TABLE contracts (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id          UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  start_date           DATE NOT NULL,
  end_date             DATE,
  department_id        UUID REFERENCES departments(id) ON DELETE SET NULL,
  job_position_id      UUID REFERENCES job_positions(id) ON DELETE SET NULL,
  schedule_id          UUID REFERENCES working_schedules(id) ON DELETE SET NULL,
  salary_structure_id  UUID REFERENCES salary_structures(id) ON DELETE SET NULL,
  wage                 NUMERIC,
  currency             TEXT DEFAULT 'INR',
  employment_type      employee_type_enum,
  status               contract_status NOT NULL DEFAULT 'DRAFT',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: payruns
-- ============================================
CREATE TABLE payruns (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id           UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  salary_structure_id  UUID NOT NULL REFERENCES salary_structures(id) ON DELETE RESTRICT,
  name                 TEXT NOT NULL,
  period_start         DATE NOT NULL,
  period_end           DATE NOT NULL,
  status               payrun_status NOT NULL DEFAULT 'DRAFT',
  total_employees      INTEGER NOT NULL DEFAULT 0,
  total_gross          NUMERIC NOT NULL DEFAULT 0,
  total_deductions     NUMERIC NOT NULL DEFAULT 0,
  total_net            NUMERIC NOT NULL DEFAULT 0,
  computed_at          TIMESTAMPTZ,
  validated_at         TIMESTAMPTZ,
  paid_at              TIMESTAMPTZ,
  created_by           UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_payruns_updated_at
  BEFORE UPDATE ON payruns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: payrun_employees
-- ============================================
CREATE TABLE payrun_employees (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payrun_id     UUID NOT NULL REFERENCES payruns(id) ON DELETE CASCADE,
  employee_id   UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  status        payrun_employee_status NOT NULL DEFAULT 'SELECTED',
  error_message TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_payrun_employee UNIQUE (payrun_id, employee_id)
);

CREATE TRIGGER trg_payrun_employees_updated_at
  BEFORE UPDATE ON payrun_employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: payslips
-- ============================================
CREATE TABLE payslips (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payrun_id            UUID NOT NULL REFERENCES payruns(id) ON DELETE CASCADE,
  employee_id          UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  contract_id          UUID REFERENCES contracts(id) ON DELETE SET NULL,
  salary_structure_id  UUID NOT NULL REFERENCES salary_structures(id) ON DELETE RESTRICT,
  period_start         DATE NOT NULL,
  period_end           DATE NOT NULL,
  worked_days          NUMERIC,
  worked_hours         NUMERIC,
  gross_salary         NUMERIC NOT NULL DEFAULT 0,
  total_deductions     NUMERIC NOT NULL DEFAULT 0,
  net_salary           NUMERIC NOT NULL DEFAULT 0,
  status               payslip_status NOT NULL DEFAULT 'GENERATED',
  pdf_path             TEXT,
  generated_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_payslip_payrun_employee UNIQUE (payrun_id, employee_id)
);

CREATE TRIGGER trg_payslips_updated_at
  BEFORE UPDATE ON payslips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: payslip_items
-- ============================================
CREATE TABLE payslip_items (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payslip_id            UUID NOT NULL REFERENCES payslips(id) ON DELETE CASCADE,
  salary_rule_id        UUID REFERENCES salary_rules(id) ON DELETE SET NULL,
  name                  TEXT NOT NULL,
  code                  TEXT NOT NULL,
  category              salary_rule_category NOT NULL,
  sequence              INTEGER NOT NULL,
  amount                NUMERIC NOT NULL DEFAULT 0,
  calculation_snapshot  JSONB,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE: payroll_warnings
-- ============================================
CREATE TABLE payroll_warnings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payrun_id   UUID NOT NULL REFERENCES payruns(id) ON DELETE CASCADE,
  payslip_id  UUID REFERENCES payslips(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  type        warning_type_enum NOT NULL,
  severity    warning_severity NOT NULL DEFAULT 'WARNING',
  message     TEXT NOT NULL,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE: payslip_deliveries
-- ============================================
CREATE TABLE payslip_deliveries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payslip_id    UUID NOT NULL REFERENCES payslips(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  status        delivery_status NOT NULL DEFAULT 'PENDING',
  sent_at       TIMESTAMPTZ,
  error_message TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE: audit_logs
-- ============================================
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   UUID,
  old_values  JSONB,
  new_values  JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
