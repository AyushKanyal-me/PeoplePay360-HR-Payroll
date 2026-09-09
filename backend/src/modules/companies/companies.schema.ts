import { z } from 'zod';

export const updateCompanySchema = z.object({
  name: z.string().min(1).optional(),
  tax_id: z.string().nullable().optional(),
  registration_number: z.string().nullable().optional(),
  currency: z.string().min(1).max(10).optional(),
  fiscal_year_start_month: z.number().int().min(1).max(12).optional(),
  fiscal_year_end_month: z.number().int().min(1).max(12).optional(),
  address: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  logo_url: z.string().url().nullable().optional()
});

export const companyIdParamSchema = z.object({
  id: z.string().uuid('Invalid company ID format')
});
