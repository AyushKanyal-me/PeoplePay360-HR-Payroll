import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { authService } from '../src/modules/auth/auth.service.js';
import { companiesService } from '../src/modules/companies/companies.service.js';
import { departmentsService } from '../src/modules/departments/departments.service.js';
import { positionsService } from '../src/modules/positions/positions.service.js';
import { schedulesService } from '../src/modules/schedules/schedules.service.js';
import { employeesService } from '../src/modules/employees/employees.service.js';
import { contractsService } from '../src/modules/contracts/contracts.service.js';
import { ConflictError } from '../src/utils/errors.js';
import { AuthenticatedUser } from '../src/types/auth.js';

describe('Phase 3 — Core HR API Test Suite', () => {
  const mockAdminUser: AuthenticatedUser = {
    id: '00000000-0000-0000-0000-000000000001',
    authUserId: '00000000-0000-0000-0000-000000000002',
    email: 'admin@peoplepay360.com',
    roles: ['ADMIN'],
    isActive: true,
    companyId: '00000000-0000-0000-0000-000000000010',
    employeeId: '00000000-0000-0000-0000-000000000100'
  };

  const mockHrManagerUser: AuthenticatedUser = {
    id: '00000000-0000-0000-0000-000000000003',
    authUserId: '00000000-0000-0000-0000-000000000004',
    email: 'hrmanager@peoplepay360.com',
    roles: ['HR_MANAGER'],
    isActive: true,
    companyId: '00000000-0000-0000-0000-000000000010',
    employeeId: '00000000-0000-0000-0000-000000000101'
  };

  const mockEmployeeUser: AuthenticatedUser = {
    id: '00000000-0000-0000-0000-000000000005',
    authUserId: '00000000-0000-0000-0000-000000000006',
    email: 'employee@peoplepay360.com',
    roles: ['EMPLOYEE'],
    isActive: true,
    companyId: '00000000-0000-0000-0000-000000000010',
    employeeId: '00000000-0000-0000-0000-000000000102'
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------
  // 1. COMPANIES
  // -------------------------------------------------------------
  describe('Companies Module (/api/v1/companies)', () => {
    it('GET /api/v1/companies should return companies list', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockAdminUser);
      vi.spyOn(companiesService, 'getCompanies').mockResolvedValue([
        {
          id: '00000000-0000-0000-0000-000000000010',
          name: 'PeoplePay360 Demo Corp',
          tax_id: 'TAX-001',
          registration_number: 'REG-12345',
          currency: 'INR',
          fiscal_year_start_month: 4,
          fiscal_year_end_month: 3,
          address: 'Tech Park, Bangalore',
          country: 'India',
          logo_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);

      const res = await request(app)
        .get('/api/v1/companies')
        .set('Authorization', 'Bearer valid-jwt');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].name).toBe('PeoplePay360 Demo Corp');
    });

    it('PATCH /api/v1/companies/:id should allow ADMIN and reject HR_MANAGER with 403', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockHrManagerUser);

      const res = await request(app)
        .patch('/api/v1/companies/00000000-0000-0000-0000-000000000010')
        .set('Authorization', 'Bearer valid-jwt')
        .send({ currency: 'USD' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  // -------------------------------------------------------------
  // 2. DEPARTMENTS
  // -------------------------------------------------------------
  describe('Departments Module (/api/v1/departments)', () => {
    it('GET /api/v1/departments should return paginated list', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockAdminUser);
      vi.spyOn(departmentsService, 'getDepartments').mockResolvedValue({
        data: [
          {
            id: '00000000-0000-0000-0000-000000000020',
            company_id: '00000000-0000-0000-0000-000000000010',
            name: 'Engineering',
            code: 'ENG',
            parent_department_id: null,
            manager_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ],
        total: 1
      });

      const res = await request(app)
        .get('/api/v1/departments?page=1&limit=10')
        .set('Authorization', 'Bearer valid-jwt');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.meta.total).toBe(1);
    });

    it('POST /api/v1/departments should create department for HR_MANAGER', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockHrManagerUser);
      vi.spyOn(departmentsService, 'createDepartment').mockResolvedValue({
        id: '00000000-0000-0000-0000-000000000021',
        company_id: '00000000-0000-0000-0000-000000000010',
        name: 'Human Resources',
        code: 'HR',
        parent_department_id: null,
        manager_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      const res = await request(app)
        .post('/api/v1/departments')
        .set('Authorization', 'Bearer valid-jwt')
        .send({
          company_id: '00000000-0000-0000-0000-000000000010',
          name: 'Human Resources',
          code: 'HR'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Human Resources');
    });
  });

  // -------------------------------------------------------------
  // 3. JOB POSITIONS
  // -------------------------------------------------------------
  describe('Job Positions Module (/api/v1/job-positions)', () => {
    it('GET /api/v1/job-positions should return positions list', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockAdminUser);
      vi.spyOn(positionsService, 'getPositions').mockResolvedValue([
        {
          id: '00000000-0000-0000-0000-000000000030',
          department_id: '00000000-0000-0000-0000-000000000020',
          title: 'Senior Fullstack Engineer',
          code: 'SDE-3',
          description: 'Core platform development',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);

      const res = await request(app)
        .get('/api/v1/job-positions')
        .set('Authorization', 'Bearer valid-jwt');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].title).toBe('Senior Fullstack Engineer');
    });
  });

  // -------------------------------------------------------------
  // 4. WORKING SCHEDULES
  // -------------------------------------------------------------
  describe('Working Schedules Module (/api/v1/schedules)', () => {
    it('POST /api/v1/schedules should validate days & hours and create schedule', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockAdminUser);
      vi.spyOn(schedulesService, 'createSchedule').mockResolvedValue({
        id: '00000000-0000-0000-0000-000000000040',
        company_id: '00000000-0000-0000-0000-000000000010',
        name: 'Standard 40h Hybrid',
        schedule_type: 'FIXED',
        days_per_week: 5,
        hours_per_week: 40,
        timezone: 'Asia/Kolkata',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        days: [
          {
            id: '00000000-0000-0000-0000-000000000041',
            schedule_id: '00000000-0000-0000-0000-000000000040',
            day_of_week: 'MONDAY',
            start_time: '09:00:00',
            end_time: '18:00:00',
            break_hours: 1,
            total_hours: 8,
            created_at: new Date().toISOString()
          }
        ]
      });

      const res = await request(app)
        .post('/api/v1/schedules')
        .set('Authorization', 'Bearer valid-jwt')
        .send({
          company_id: '00000000-0000-0000-0000-000000000010',
          name: 'Standard 40h Hybrid',
          schedule_type: 'FIXED',
          days_per_week: 5,
          hours_per_week: 40,
          timezone: 'Asia/Kolkata',
          days: [
            {
              day_of_week: 'MONDAY',
              start_time: '09:00',
              end_time: '18:00',
              break_hours: 1,
              total_hours: 8
            }
          ]
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Standard 40h Hybrid');
    });
  });

  // -------------------------------------------------------------
  // 5. EMPLOYEES & SMART COUNTS
  // -------------------------------------------------------------
  describe('Employees Module (/api/v1/employees)', () => {
    it('GET /api/v1/employees/:id/smart-counts should return related record counts', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockAdminUser);
      vi.spyOn(employeesService, 'getSmartCounts').mockResolvedValue({
        employee_id: '00000000-0000-0000-0000-000000000102',
        contracts_count: 2,
        attendance_count: 45,
        time_off_requests_count: 3,
        payslips_count: 6
      });

      const res = await request(app)
        .get('/api/v1/employees/00000000-0000-0000-0000-000000000102/smart-counts')
        .set('Authorization', 'Bearer valid-jwt');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.contracts_count).toBe(2);
      expect(res.body.data.attendance_count).toBe(45);
    });

    it('Employee self-access: EMPLOYEE can view own profile but gets 403 on another employee', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockEmployeeUser);
      vi.spyOn(employeesService, 'getEmployeeById').mockResolvedValue({
        id: '00000000-0000-0000-0000-000000000102',
        company_id: '00000000-0000-0000-0000-000000000010',
        department_id: null,
        job_position_id: null,
        manager_id: null,
        schedule_id: null,
        first_name: 'Employee',
        last_name: 'User',
        work_email: 'employee@peoplepay360.com',
        personal_email: null,
        phone: null,
        hire_date: '2025-01-01',
        employment_type: 'FULL_TIME',
        status: 'ACTIVE',
        bank_account_number: null,
        bank_name: null,
        bank_ifsc: null,
        pan_number: null,
        aadhaar_number: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // 1. Self access -> 200 OK
      const selfRes = await request(app)
        .get('/api/v1/employees/00000000-0000-0000-0000-000000000102')
        .set('Authorization', 'Bearer valid-jwt');
      expect(selfRes.status).toBe(200);

      // 2. Another employee access -> 403 Forbidden
      const otherRes = await request(app)
        .get('/api/v1/employees/00000000-0000-0000-0000-000000000999')
        .set('Authorization', 'Bearer valid-jwt');
      expect(otherRes.status).toBe(403);
    });

    it('POST /api/v1/employees with duplicate work_email returns 409 ConflictError', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockAdminUser);
      vi.spyOn(employeesService, 'createEmployee').mockRejectedValue(
        new ConflictError("Employee with work email 'duplicate@peoplepay360.com' already exists")
      );

      const res = await request(app)
        .post('/api/v1/employees')
        .set('Authorization', 'Bearer valid-jwt')
        .send({
          company_id: '00000000-0000-0000-0000-000000000010',
          first_name: 'Duplicate',
          last_name: 'User',
          work_email: 'duplicate@peoplepay360.com',
          hire_date: '2025-01-01'
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
      expect(res.body.error.message).toContain('already exists');
    });
  });

  // -------------------------------------------------------------
  // 6. CONTRACTS & EXCLUSION CONSTRAINT
  // -------------------------------------------------------------
  describe('Contracts Module (/api/v1/contracts)', () => {
    it('POST /api/v1/contracts with overlapping active dates returns 409 ConflictError', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockAdminUser);
      vi.spyOn(contractsService, 'createContract').mockRejectedValue(
        new ConflictError('Contract date range overlaps with an existing active contract for this employee')
      );

      const res = await request(app)
        .post('/api/v1/contracts')
        .set('Authorization', 'Bearer valid-jwt')
        .send({
          employee_id: '00000000-0000-0000-0000-000000000102',
          start_date: '2025-01-01',
          end_date: '2025-12-31',
          wage: 80000,
          status: 'ACTIVE'
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
      expect(res.body.error.message).toContain('overlaps with an existing active contract');
    });

    it('POST /api/v1/contracts/:id/close transitions contract to EXPIRED', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(mockHrManagerUser);
      vi.spyOn(contractsService, 'closeContract').mockResolvedValue({
        id: '00000000-0000-0000-0000-000000000501',
        employee_id: '00000000-0000-0000-0000-000000000102',
        start_date: '2025-01-01',
        end_date: '2026-09-09',
        department_id: null,
        job_position_id: null,
        schedule_id: null,
        salary_structure_id: null,
        wage: 75000,
        currency: 'INR',
        employment_type: 'FULL_TIME',
        status: 'EXPIRED',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      const res = await request(app)
        .post('/api/v1/contracts/00000000-0000-0000-0000-000000000501/close')
        .set('Authorization', 'Bearer valid-jwt');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('EXPIRED');
    });
  });
});
