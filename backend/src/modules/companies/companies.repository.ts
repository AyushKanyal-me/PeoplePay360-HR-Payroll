import { supabaseAdminClient } from '../../config/supabase.js';
import { Company, UpdateCompanyDto } from './companies.types.js';
import { DatabaseError } from '../../utils/errors.js';

export class CompaniesRepository {
  async findAll(): Promise<Company[]> {
    const { data, error } = await supabaseAdminClient
      .from('companies')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      throw new DatabaseError(`Failed to fetch companies: ${error.message}`, [error]);
    }

    return (data || []) as Company[];
  }

  async findById(id: string): Promise<Company | null> {
    const { data, error } = await supabaseAdminClient
      .from('companies')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new DatabaseError(`Failed to fetch company: ${error.message}`, [error]);
    }

    return data as Company | null;
  }

  async update(id: string, dto: UpdateCompanyDto): Promise<Company | null> {
    const { data, error } = await supabaseAdminClient
      .from('companies')
      .update(dto)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      throw new DatabaseError(`Failed to update company: ${error.message}`, [error]);
    }

    return data as Company | null;
  }
}

export const companiesRepository = new CompaniesRepository();
