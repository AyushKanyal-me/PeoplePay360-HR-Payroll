import { z } from 'zod';
import {
  createContractSchema,
  updateContractSchema,
  contractQuerySchema
} from './contracts.schema.js';

export interface Contract {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string | null;
  department_id: string | null;
  job_position_id: string | null;
  schedule_id: string | null;
  salary_structure_id: string | null;
  wage: number;
  currency: string;
  employment_type: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
  status: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
  created_at: string;
  updated_at: string;
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
    work_email: string;
  } | null;
  department?: { id: string; name: string } | null;
  job_position?: { id: string; title: string } | null;
  schedule?: { id: string; name: string; hours_per_week: number } | null;
  salary_structure?: { id: string; name: string; code: string } | null;
}

export type CreateContractDto = z.infer<typeof createContractSchema>;
export type UpdateContractDto = z.infer<typeof updateContractSchema>;
export type ContractQueryDto = z.infer<typeof contractQuerySchema>;
