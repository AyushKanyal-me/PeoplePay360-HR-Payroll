import { z } from 'zod';
import { updateCompanySchema } from './companies.schema.js';

export interface Company {
  id: string;
  name: string;
  tax_id: string | null;
  registration_number: string | null;
  currency: string;
  fiscal_year_start_month: number | null;
  fiscal_year_end_month: number | null;
  address: string | null;
  country: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export type UpdateCompanyDto = z.infer<typeof updateCompanySchema>;
