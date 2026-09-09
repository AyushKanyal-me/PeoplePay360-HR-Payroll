# PeoplePay360 REST API Specification & Reference

Welcome to the **PeoplePay360** REST API documentation. This API powers the HR, Payroll, Attendance, Leaves, Salary Structures, Payruns Lifecycle, Payslips, Dashboard, and Audit Logging platform.

---

## 1. Base URL & Authentication

### Base URL
```
http://localhost:4000/api/v1
```

### Authentication Header
All protected endpoints require a Supabase JWT bearer token:
```http
Authorization: Bearer <SUPABASE_JWT_ACCESS_TOKEN>
```

### Standard Response Envelope
All API endpoints return responses structured in the following standardized JSON format:

#### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

#### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed for incoming request",
    "details": [
      { "field": "email", "message": "Invalid email address" }
    ]
  }
}
```

---

## 2. Canonical Roles & RBAC Matrix

| Role | Description |
|---|---|
| `ADMIN` | Full administrative access across all tenant settings, HR records, payroll engine, payruns, analytics, and audit logs. |
| `HR_MANAGER` | Employee directory management, department/position configuration, contract lifecycle, working schedules, time-off approvals. |
| `HR_PAYROLL_MANAGER` | Payroll computation, validation, marking payruns as paid, salary structures, bulk payslip dispatch, operational dashboard. |
| `HR_PAYROLL_USER` | Operational payroll execution (compute draft payruns, download payslips, attendance corrections). Cannot validate or mark paid. |
| `EMPLOYEE` | Self-service access: view own profile, check-in/out attendance, submit time-off requests, download own PDF payslips. |

---

## 3. Complete Endpoints Inventory

### 3.1 Authentication (`/api/v1/auth`)
- **`GET /api/v1/auth/me`**
  - **Auth**: Required
  - **Roles**: All (`ADMIN`, `HR_MANAGER`, `HR_PAYROLL_MANAGER`, `HR_PAYROLL_USER`, `EMPLOYEE`)
  - **Description**: Returns authenticated user profile, linked employee profile, company ID, and assigned roles.

### 3.2 Companies (`/api/v1/companies`)
- **`GET /api/v1/companies`** (Roles: `ADMIN`, `HR_MANAGER`, `HR_PAYROLL_MANAGER`, `HR_PAYROLL_USER`)
- **`PATCH /api/v1/companies/:id`** (Roles: `ADMIN`)

### 3.3 Departments & Positions (`/api/v1/departments`, `/api/v1/job-positions`)
- **`GET /api/v1/departments`** (Roles: All authenticated)
- **`POST /api/v1/departments`** (Roles: `ADMIN`, `HR_MANAGER`)
- **`GET /api/v1/departments/:id`** (Roles: All authenticated)
- **`PATCH /api/v1/departments/:id`** (Roles: `ADMIN`, `HR_MANAGER`)
- **`DELETE /api/v1/departments/:id`** (Roles: `ADMIN`, `HR_MANAGER`)
- **`GET /api/v1/job-positions`** (Roles: All authenticated)
- **`POST /api/v1/job-positions`** (Roles: `ADMIN`, `HR_MANAGER`)
- **`GET /api/v1/job-positions/:id`** (Roles: All authenticated)
- **`PATCH /api/v1/job-positions/:id`** (Roles: `ADMIN`, `HR_MANAGER`)
- **`DELETE /api/v1/job-positions/:id`** (Roles: `ADMIN`, `HR_MANAGER`)

### 3.4 Working Schedules (`/api/v1/schedules`)
- **`GET /api/v1/schedules`** (Roles: All authenticated)
- **`POST /api/v1/schedules`** (Roles: `ADMIN`, `HR_MANAGER`)
- **`GET /api/v1/schedules/:id`** (Roles: All authenticated)
- **`PATCH /api/v1/schedules/:id`** (Roles: `ADMIN`, `HR_MANAGER`)
- **`DELETE /api/v1/schedules/:id`** (Roles: `ADMIN`, `HR_MANAGER`)

### 3.5 Employees Master Hub (`/api/v1/employees`)
- **`GET /api/v1/employees`** (Roles: `ADMIN`, `HR_MANAGER`, `HR_PAYROLL_MANAGER`, `HR_PAYROLL_USER`)
- **`POST /api/v1/employees`** (Roles: `ADMIN`, `HR_MANAGER`)
- **`GET /api/v1/employees/:id`** (Roles: Self `EMPLOYEE`, `ADMIN`, `HR_MANAGER`, `HR_PAYROLL_MANAGER`, `HR_PAYROLL_USER`)
- **`PATCH /api/v1/employees/:id`** (Roles: `ADMIN`, `HR_MANAGER`)
- **`DELETE /api/v1/employees/:id`** (Roles: `ADMIN`, `HR_MANAGER`)
- **`GET /api/v1/employees/:id/smart-counts`** (Roles: Self `EMPLOYEE`, `ADMIN`, `HR_MANAGER`, `HR_PAYROLL_MANAGER`, `HR_PAYROLL_USER`)

### 3.6 Contracts (`/api/v1/contracts`)
- **`GET /api/v1/contracts`** (Roles: `ADMIN`, `HR_MANAGER`, `HR_PAYROLL_MANAGER`, `HR_PAYROLL_USER`)
- **`POST /api/v1/contracts`** (Roles: `ADMIN`, `HR_MANAGER`)
- **`GET /api/v1/contracts/:id`** (Roles: `ADMIN`, `HR_MANAGER`, `HR_PAYROLL_MANAGER`, `HR_PAYROLL_USER`)
- **`PATCH /api/v1/contracts/:id`** (Roles: `ADMIN`, `HR_MANAGER`)
- **`DELETE /api/v1/contracts/:id`** (Roles: `ADMIN`, `HR_MANAGER`)
- **`POST /api/v1/contracts/:id/close`** (Roles: `ADMIN`, `HR_MANAGER`)

### 3.7 Attendance (`/api/v1/attendance`)
- **`GET /api/v1/attendance`** (Roles: Self `EMPLOYEE`, `ADMIN`, `HR_MANAGER`, `HR_PAYROLL_MANAGER`, `HR_PAYROLL_USER`)
- **`GET /api/v1/attendance/quick-status`** (Roles: All authenticated employees)
- **`POST /api/v1/attendance/check-in`** (Roles: All authenticated employees)
- **`POST /api/v1/attendance/check-out`** (Roles: All authenticated employees)
- **`POST /api/v1/attendance`** (Roles: `ADMIN`, `HR_MANAGER`, `HR_PAYROLL_USER`, `HR_PAYROLL_MANAGER`)
- **`PATCH /api/v1/attendance/:id`** (Roles: `ADMIN`, `HR_MANAGER`, `HR_PAYROLL_USER`, `HR_PAYROLL_MANAGER`)
- **`DELETE /api/v1/attendance/:id`** (Roles: `ADMIN`, `HR_MANAGER`)

### 3.8 Time Off (`/api/v1/time-off`)
- **`GET /api/v1/time-off/types`** (Roles: All authenticated)
- **`POST /api/v1/time-off/types`** (Roles: `ADMIN`, `HR_MANAGER`)
- **`GET /api/v1/time-off/allocations`** (Roles: Self `EMPLOYEE`, `ADMIN`, `HR_MANAGER`, `HR_PAYROLL_MANAGER`)
- **`POST /api/v1/time-off/allocations`** (Roles: `ADMIN`, `HR_MANAGER`)
- **`GET /api/v1/time-off/requests`** (Roles: Self `EMPLOYEE`, `ADMIN`, `HR_MANAGER`, `HR_PAYROLL_MANAGER`)
- **`POST /api/v1/time-off/requests`** (Roles: All authenticated employees)
- **`GET /api/v1/time-off/requests/:id`** (Roles: Self `EMPLOYEE`, `ADMIN`, `HR_MANAGER`, `HR_PAYROLL_MANAGER`)
- **`POST /api/v1/time-off/requests/:id/approve`** (Roles: `ADMIN`, `HR_MANAGER`)
- **`POST /api/v1/time-off/requests/:id/refuse`** (Roles: `ADMIN`, `HR_MANAGER`)
- **`POST /api/v1/time-off/requests/:id/cancel`** (Roles: Self `EMPLOYEE`, `ADMIN`, `HR_MANAGER`)

### 3.9 Salary Structures & Rules (`/api/v1/salary-structures`, `/api/v1/salary-rules`)
- **`GET /api/v1/salary-structures`** (Roles: `ADMIN`, `HR_MANAGER`, `HR_PAYROLL_MANAGER`, `HR_PAYROLL_USER`)
- **`POST /api/v1/salary-structures`** (Roles: `ADMIN`, `HR_PAYROLL_MANAGER`)
- **`GET /api/v1/salary-structures/:id`** (Roles: `ADMIN`, `HR_MANAGER`, `HR_PAYROLL_MANAGER`, `HR_PAYROLL_USER`)
- **`PATCH /api/v1/salary-structures/:id`** (Roles: `ADMIN`, `HR_PAYROLL_MANAGER`)
- **`GET /api/v1/salary-rules`** (Roles: `ADMIN`, `HR_MANAGER`, `HR_PAYROLL_MANAGER`, `HR_PAYROLL_USER`)
- **`POST /api/v1/salary-rules`** (Roles: `ADMIN`, `HR_PAYROLL_MANAGER`)
- **`PATCH /api/v1/salary-rules/:id`** (Roles: `ADMIN`, `HR_PAYROLL_MANAGER`)

### 3.10 Payroll Engine & Payruns Lifecycle (`/api/v1/payruns`)
- **`GET /api/v1/payruns`** (Roles: `ADMIN`, `HR_MANAGER`, `HR_PAYROLL_MANAGER`, `HR_PAYROLL_USER`)
- **`POST /api/v1/payruns`** (Roles: `ADMIN`, `HR_PAYROLL_MANAGER`)
- **`GET /api/v1/payruns/eligible-employees`** (Roles: `ADMIN`, `HR_PAYROLL_MANAGER`, `HR_PAYROLL_USER`)
- **`GET /api/v1/payruns/:id`** (Roles: `ADMIN`, `HR_MANAGER`, `HR_PAYROLL_MANAGER`, `HR_PAYROLL_USER`)
- **`POST /api/v1/payruns/:id/compute`** (Roles: `ADMIN`, `HR_PAYROLL_MANAGER`, `HR_PAYROLL_USER`)
- **`POST /api/v1/payruns/:id/validate`** (Roles: `ADMIN`, `HR_PAYROLL_MANAGER`)
- **`POST /api/v1/payruns/:id/mark-paid`** (Roles: `ADMIN`, `HR_PAYROLL_MANAGER`)
- **`POST /api/v1/payruns/:id/cancel`** (Roles: `ADMIN`, `HR_PAYROLL_MANAGER`)
- **`GET /api/v1/payruns/:id/warnings`** (Roles: `ADMIN`, `HR_MANAGER`, `HR_PAYROLL_MANAGER`, `HR_PAYROLL_USER`)
- **`POST /api/v1/payruns/:id/send-payslips`** (Roles: `ADMIN`, `HR_PAYROLL_MANAGER`)

### 3.11 Payslips & Deliveries (`/api/v1/payslips`, `/api/v1/payslip-deliveries`)
- **`GET /api/v1/payslips`** (Roles: Self `EMPLOYEE`, `ADMIN`, `HR_MANAGER`, `HR_PAYROLL_MANAGER`, `HR_PAYROLL_USER`)
- **`GET /api/v1/payslips/:id`** (Roles: Self `EMPLOYEE`, `ADMIN`, `HR_MANAGER`, `HR_PAYROLL_MANAGER`, `HR_PAYROLL_USER`)
- **`GET /api/v1/payslips/:id/pdf`** (Roles: Self `EMPLOYEE`, `ADMIN`, `HR_MANAGER`, `HR_PAYROLL_MANAGER`, `HR_PAYROLL_USER`)
- **`POST /api/v1/payslips/:id/send-email`** (Roles: `ADMIN`, `HR_MANAGER`, `HR_PAYROLL_MANAGER`, `HR_PAYROLL_USER`)
- **`GET /api/v1/payslip-deliveries`** (Roles: `ADMIN`, `HR_MANAGER`, `HR_PAYROLL_MANAGER`, `HR_PAYROLL_USER`)

### 3.12 Live Dashboard & Analytics (`/api/v1/dashboard`)
- **`GET /api/v1/dashboard/kpis`** (Roles: `ADMIN`, `HR_MANAGER`, `HR_PAYROLL_MANAGER`, `HR_PAYROLL_USER`)
- **`GET /api/v1/dashboard/salary-by-dept`** (Roles: `ADMIN`, `HR_MANAGER`, `HR_PAYROLL_MANAGER`, `HR_PAYROLL_USER`)
- **`GET /api/v1/dashboard/salary-trends`** (Roles: `ADMIN`, `HR_MANAGER`, `HR_PAYROLL_MANAGER`, `HR_PAYROLL_USER`)
- **`GET /api/v1/dashboard/attendance-overview`** (Roles: `ADMIN`, `HR_MANAGER`, `HR_PAYROLL_MANAGER`, `HR_PAYROLL_USER`)
- **`GET /api/v1/dashboard/operational-alerts`** (Roles: `ADMIN`, `HR_MANAGER`, `HR_PAYROLL_MANAGER`, `HR_PAYROLL_USER`)

### 3.13 Audit Logs (`/api/v1/audit-logs`)
- **`GET /api/v1/audit-logs`** (Roles: `ADMIN` only)

---

## 4. Payruns Lifecycle State Machine

```
      +-----------+
      |   DRAFT   | <----+
      +-----------+      |
            |            |
         compute         | recompute
            v            |
      +-----------+      |
      | COMPUTED  | -----+
      +-----------+
            |
         validate
            v
      +-----------+
      | VALIDATED |
      +-----------+
            |
        mark-paid
            v
      +-----------+
      |   PAID    | ----> (send-payslips via email)
      +-----------+

  (Cancel allowed from DRAFT, COMPUTED, VALIDATED -> CANCELLED)
```

---

## 5. Safe Arithmetic Formula Syntax

Salary rules evaluated via the AST formula evaluator support:
- Arithmetic: `+`, `-`, `*`, `/`, `(` `)`
- Variable lookups: Any previous salary rule code in the structure sequence (`BASIC`, `HRA`, `GROSS`, `PF`, `WAGE`)
- Unpaid leave deduction placeholder: `UNPAID_LEAVE_DEDUCTION`
- Deterministic evaluation without `eval()` or `new Function()`.
