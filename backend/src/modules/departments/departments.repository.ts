import { supabaseAdminClient } from '../../config/supabase.js';
import { Department, CreateDepartmentDto, UpdateDepartmentDto, DepartmentQueryDto } from './departments.types.js';
import { DatabaseError } from '../../utils/errors.js';

export class DepartmentsRepository {
  async findAll(query: DepartmentQueryDto): Promise<{ data: Department[]; total: number }> {
    let queryBuilder = supabaseAdminClient
      .from('departments')
      .select(`
        *,
        manager:employees!departments_manager_id_fkey (
          id,
          first_name,
          last_name,
          work_email
        )
      `, { count: 'exact' });

    if (query.company_id) {
      queryBuilder = queryBuilder.eq('company_id', query.company_id);
    }

    if (query.search) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query.search}%,code.ilike.%${query.search}%`);
    }

    const offset = (query.page - 1) * query.limit;
    queryBuilder = queryBuilder
      .order('name', { ascending: true })
      .range(offset, offset + query.limit - 1);

    const { data, count, error } = await queryBuilder;

    if (error) {
      throw new DatabaseError(`Failed to fetch departments: ${error.message}`, [error]);
    }

    return {
      data: (data || []) as Department[],
      total: count || 0
    };
  }

  async findById(id: string): Promise<Department | null> {
    const { data, error } = await supabaseAdminClient
      .from('departments')
      .select(`
        *,
        manager:employees!departments_manager_id_fkey (
          id,
          first_name,
          last_name,
          work_email
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new DatabaseError(`Failed to fetch department: ${error.message}`, [error]);
    }

    return data as Department | null;
  }

  async create(dto: CreateDepartmentDto): Promise<Department> {
    const { data, error } = await supabaseAdminClient
      .from('departments')
      .insert(dto)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Failed to create department: ${error.message}`, [error]);
    }

    return data as Department;
  }

  async update(id: string, dto: UpdateDepartmentDto): Promise<Department | null> {
    const { data, error } = await supabaseAdminClient
      .from('departments')
      .update(dto)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      throw new DatabaseError(`Failed to update department: ${error.message}`, [error]);
    }

    return data as Department | null;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await supabaseAdminClient
      .from('departments')
      .delete()
      .eq('id', id);

    if (error) {
      throw new DatabaseError(`Failed to delete department: ${error.message}`, [error]);
    }

    return true;
  }
}

export const departmentsRepository = new DepartmentsRepository();
