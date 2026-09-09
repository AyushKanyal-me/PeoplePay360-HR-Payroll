-- ============================================================
-- PeoplePay360 — Migration 1: Core Schema
-- Extensions, enums, trigger function, base tables
-- ============================================================

-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE employee_status AS ENUM ('ACTIVE', 'INACTIVE', 'TERMINATED');
CREATE TYPE employee_type_enum AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN');
CREATE TYPE schedule_type_enum AS ENUM ('FIXED', 'FLEXIBLE');
CREATE TYPE day_of_week_enum AS ENUM (
  'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY',
  'FRIDAY', 'SATURDAY', 'SUNDAY'
);
CREATE TYPE contract_status AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED');
CREATE TYPE attendance_status AS ENUM (
  'PRESENT', 'ABSENT', 'LATE', 'OVERTIME', 'MISSING_CHECKOUT'
);
CREATE TYPE time_off_unit AS ENUM ('DAYS', 'HOURS');
CREATE TYPE allocation_status AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');
CREATE TYPE time_off_request_status AS ENUM ('PENDING', 'APPROVED', 'REFUSED', 'CANCELLED');
CREATE TYPE salary_rule_category AS ENUM ('BASIC', 'ALLOWANCE', 'GROSS', 'DEDUCTION', 'NET');
CREATE TYPE calculation_type_enum AS ENUM ('FIXED', 'PERCENTAGE', 'FORMULA');
CREATE TYPE payrun_status AS ENUM ('DRAFT', 'COMPUTED', 'VALIDATED', 'PAID', 'CANCELLED');
CREATE TYPE payrun_employee_status AS ENUM ('SELECTED', 'PROCESSING', 'COMPLETED', 'FAILED');
CREATE TYPE payslip_status AS ENUM ('GENERATED', 'SENT', 'FAILED');
CREATE TYPE warning_type_enum AS ENUM (
  'MISSING_BANK_DETAILS', 'DUPLICATE_PAYSLIP', 'MISSING_CONTRACT',
  'MULTIPLE_ACTIVE_CONTRACTS', 'MISSING_ATTENDANCE', 'MISSING_CHECKOUT'
);
CREATE TYPE warning_severity AS ENUM ('INFO', 'WARNING', 'ERROR');
CREATE TYPE delivery_status AS ENUM ('PENDING', 'SENT', 'FAILED');

-- ============================================
-- TRIGGER FUNCTION: auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TABLE: companies
-- ============================================
CREATE TABLE companies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  legal_name  TEXT,
  currency    TEXT NOT NULL DEFAULT 'INR',
  timezone    TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: departments
-- ============================================
CREATE TABLE departments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  code        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_departments_company_code UNIQUE (company_id, code)
);

CREATE TRIGGER trg_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: job_positions
-- ============================================
CREATE TABLE job_positions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_job_positions_updated_at
  BEFORE UPDATE ON job_positions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: working_schedules
-- (created before employees so FK can reference it)
-- ============================================
CREATE TABLE working_schedules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  schedule_type schedule_type_enum NOT NULL DEFAULT 'FIXED',
  weekly_hours  NUMERIC NOT NULL DEFAULT 40,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_working_schedules_updated_at
  BEFORE UPDATE ON working_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: schedule_days
-- ============================================
CREATE TABLE schedule_days (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id   UUID NOT NULL REFERENCES working_schedules(id) ON DELETE CASCADE,
  day_of_week   day_of_week_enum NOT NULL,
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  break_minutes INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_schedule_days_schedule_dow UNIQUE (schedule_id, day_of_week)
);

-- ============================================
-- TABLE: employees
-- ============================================
CREATE TABLE employees (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_code       TEXT NOT NULL,
  first_name          TEXT NOT NULL,
  last_name           TEXT NOT NULL,
  email               TEXT,
  phone               TEXT,
  date_of_birth       DATE,
  date_of_joining     DATE,
  department_id       UUID REFERENCES departments(id) ON DELETE SET NULL,
  job_position_id     UUID REFERENCES job_positions(id) ON DELETE SET NULL,
  manager_id          UUID REFERENCES employees(id) ON DELETE SET NULL,
  schedule_id         UUID REFERENCES working_schedules(id) ON DELETE SET NULL,
  employee_type       employee_type_enum NOT NULL DEFAULT 'FULL_TIME',
  status              employee_status NOT NULL DEFAULT 'ACTIVE',
  bank_account_number TEXT,
  bank_name           TEXT,
  ifsc_code           TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_employees_company_code UNIQUE (company_id, employee_code)
);

CREATE TRIGGER trg_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: users
-- Links Supabase Auth users to employees
-- ============================================
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id  UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id   UUID UNIQUE REFERENCES employees(id) ON DELETE SET NULL,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: roles
-- ============================================
CREATE TABLE roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE: user_roles
-- ============================================
CREATE TABLE user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);
