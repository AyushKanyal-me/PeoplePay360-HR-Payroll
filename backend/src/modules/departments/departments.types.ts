import { z } from 'zod';
import { createDepartmentSchema, updateDepartmentSchema, departmentQuerySchema } from './departments.schema.js';

export interface Department {
  id: string;
  company_id: string;
  name: string;
  code: string;
  parent_department_id: string | null;
  manager_id: string | null;
  created_at: string;
  updated_at: string;
  manager?: {
    id: string;
    first_name: string;
    last_name: string;
    work_email: string;
  } | null;
}

export type CreateDepartmentDto = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentDto = z.infer<typeof updateDepartmentSchema>;
export type DepartmentQueryDto = z.infer<typeof departmentQuerySchema>;
