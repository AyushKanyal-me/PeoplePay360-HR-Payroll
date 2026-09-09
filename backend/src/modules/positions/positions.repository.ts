import { supabaseAdminClient } from '../../config/supabase.js';
import { JobPosition, CreatePositionDto, UpdatePositionDto, PositionQueryDto } from './positions.types.js';
import { DatabaseError } from '../../utils/errors.js';

export class PositionsRepository {
  async findAll(query: PositionQueryDto): Promise<JobPosition[]> {
    let queryBuilder = supabaseAdminClient
      .from('job_positions')
      .select(`
        *,
        department:departments (
          id,
          name,
          code
        )
      `)
      .order('title', { ascending: true });

    if (query.department_id) {
      queryBuilder = queryBuilder.eq('department_id', query.department_id);
    }

    if (query.search) {
      queryBuilder = queryBuilder.or(`title.ilike.%${query.search}%,code.ilike.%${query.search}%`);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      throw new DatabaseError(`Failed to fetch job positions: ${error.message}`, [error]);
    }

    return (data || []) as JobPosition[];
  }

  async findById(id: string): Promise<JobPosition | null> {
    const { data, error } = await supabaseAdminClient
      .from('job_positions')
      .select(`
        *,
        department:departments (
          id,
          name,
          code
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new DatabaseError(`Failed to fetch job position: ${error.message}`, [error]);
    }

    return data as JobPosition | null;
  }

  async create(dto: CreatePositionDto): Promise<JobPosition> {
    const { data, error } = await supabaseAdminClient
      .from('job_positions')
      .insert(dto)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Failed to create job position: ${error.message}`, [error]);
    }

    return data as JobPosition;
  }

  async update(id: string, dto: UpdatePositionDto): Promise<JobPosition | null> {
    const { data, error } = await supabaseAdminClient
      .from('job_positions')
      .update(dto)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      throw new DatabaseError(`Failed to update job position: ${error.message}`, [error]);
    }

    return data as JobPosition | null;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await supabaseAdminClient
      .from('job_positions')
      .delete()
      .eq('id', id);

    if (error) {
      throw new DatabaseError(`Failed to delete job position: ${error.message}`, [error]);
    }

    return true;
  }
}

export const positionsRepository = new PositionsRepository();
