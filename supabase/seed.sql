-- ============================================================
-- PeoplePay360 — Seed Data
-- Roles, salary rules, and example time-off types.
-- ============================================================

-- ============================================
-- ROLES
-- ============================================
INSERT INTO roles (name) VALUES
  ('EMPLOYEE'),
  ('HR_MANAGER'),
  ('HR_PAYROLL_USER'),
  ('HR_PAYROLL_MANAGER'),
  ('ADMIN')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- SALARY RULES
-- Standard Indian payroll rules.
-- These are global (not company-scoped).
-- ============================================
INSERT INTO salary_rules (name, code, category, calculation_type, percentage, formula) VALUES
  ('Basic Salary',      'BASIC',            'BASIC',     'PERCENTAGE', 40,   'wage * 0.40'),
  ('HRA',               'HRA',              'ALLOWANCE', 'PERCENTAGE', 50,   'BASIC * 0.50'),
  ('Transport Allowance','TRANSPORT',        'ALLOWANCE', 'FIXED',     NULL, NULL),
  ('Gross Salary',      'GROSS',            'GROSS',     'FORMULA',   NULL, 'BASIC + HRA + TRANSPORT'),
  ('Provident Fund',    'PF',               'DEDUCTION', 'PERCENTAGE', 12,   'BASIC * 0.12'),
  ('Professional Tax',  'PROFESSIONAL_TAX', 'DEDUCTION', 'FIXED',     NULL, NULL),
  ('Net Salary',        'NET',              'NET',       'FORMULA',   NULL, 'GROSS - PF - PROFESSIONAL_TAX')
ON CONFLICT DO NOTHING;

-- Set fixed amounts for rules that use FIXED calculation
UPDATE salary_rules SET fixed_amount = 1600  WHERE code = 'TRANSPORT'        AND fixed_amount IS NULL;
UPDATE salary_rules SET fixed_amount = 200   WHERE code = 'PROFESSIONAL_TAX' AND fixed_amount IS NULL;

-- ============================================
-- DEMO COMPANY
-- Required for seeding company-scoped data.
-- ============================================
INSERT INTO companies (id, name, legal_name, currency, timezone) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'PeoplePay360 Demo', 'PeoplePay360 Demo Pvt. Ltd.', 'INR', 'Asia/Kolkata')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- TIME-OFF TYPES (for demo company)
-- ============================================
INSERT INTO time_off_types (company_id, name, code, unit, requires_allocation, requires_approval, payroll_integration) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Annual Leave',  'ANNUAL', 'DAYS', true,  true,  true),
  ('a0000000-0000-0000-0000-000000000001', 'Sick Leave',    'SICK',   'DAYS', true,  true,  true),
  ('a0000000-0000-0000-0000-000000000001', 'Unpaid Leave',  'UNPAID', 'DAYS', false, true,  true)
ON CONFLICT DO NOTHING;

-- ============================================
-- DEMO SALARY STRUCTURE (for demo company)
-- Links salary rules in sequence.
-- ============================================
INSERT INTO salary_structures (id, company_id, name, code, description) VALUES
  ('b0000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000001',
   'Standard Monthly Salary', 'STD_MONTHLY',
   'Default salary structure with Basic + HRA + Transport, minus PF and Professional Tax.')
ON CONFLICT (id) DO NOTHING;

-- Link salary rules to the demo structure in order
INSERT INTO salary_structure_rules (salary_structure_id, salary_rule_id, sequence)
SELECT
  'b0000000-0000-0000-0000-000000000001',
  sr.id,
  CASE sr.code
    WHEN 'BASIC'            THEN 1
    WHEN 'HRA'              THEN 2
    WHEN 'TRANSPORT'        THEN 3
    WHEN 'GROSS'            THEN 4
    WHEN 'PF'               THEN 5
    WHEN 'PROFESSIONAL_TAX' THEN 6
    WHEN 'NET'              THEN 7
  END
FROM salary_rules sr
WHERE sr.code IN ('BASIC', 'HRA', 'TRANSPORT', 'GROSS', 'PF', 'PROFESSIONAL_TAX', 'NET')
ON CONFLICT DO NOTHING;
