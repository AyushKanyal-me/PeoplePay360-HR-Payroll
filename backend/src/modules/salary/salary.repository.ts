import { supabaseAdminClient } from '../../config/supabase.js';
import {
  SalaryStructure,
  SalaryRule,
  CreateSalaryStructureDto,
  UpdateSalaryStructureDto,
  CreateSalaryRuleDto,
  UpdateSalaryRuleDto,
  SalaryStructureQueryDto,
  SalaryRuleQueryDto
} from './salary.types.js';
import { DatabaseError, ConflictError } from '../../utils/errors.js';

export class SalaryRepository {
  // Structures
  async findAllStructures(query: SalaryStructureQueryDto): Promise<SalaryStructure[]> {
    let queryBuilder = supabaseAdminClient
      .from('salary_structures')
      .select(`
        *,
        rules:salary_structure_rules (
          id,
          salary_structure_id,
          salary_rule_id,
          sequence,
          created_at,
          rule:salary_rules (*)
        )
      `)
      .order('name', { ascending: true });

    if (query.company_id) {
      queryBuilder = queryBuilder.eq('company_id', query.company_id);
    }

    if (query.is_active !== undefined) {
      queryBuilder = queryBuilder.eq('is_active', query.is_active);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      throw new DatabaseError(`Failed to fetch salary structures: ${error.message}`, [error]);
    }

    // Sort nested rules by sequence ASC
    const structures = (data || []).map((s: any) => ({
      ...s,
      rules: (s.rules || []).sort((a: any, b: any) => a.sequence - b.sequence)
    }));

    return structures as SalaryStructure[];
  }

  async findStructureById(id: string): Promise<SalaryStructure | null> {
    const { data, error } = await supabaseAdminClient
      .from('salary_structures')
      .select(`
        *,
        rules:salary_structure_rules (
          id,
          salary_structure_id,
          salary_rule_id,
          sequence,
          created_at,
          rule:salary_rules (*)
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new DatabaseError(`Failed to fetch salary structure: ${error.message}`, [error]);
    }

    if (!data) return null;

    const sortedRules = (data.rules || []).sort((a: any, b: any) => a.sequence - b.sequence);

    return {
      ...data,
      rules: sortedRules
    } as SalaryStructure;
  }

  async createStructure(dto: CreateSalaryStructureDto): Promise<SalaryStructure> {
    const { rules, ...structureData } = dto;

    const { data: structure, error: structError } = await supabaseAdminClient
      .from('salary_structures')
      .insert(structureData)
      .select()
      .single();

    if (structError) {
      throw new DatabaseError(`Failed to create salary structure: ${structError.message}`, [structError]);
    }

    if (rules && rules.length > 0) {
      const junctionInserts = rules.map((r) => ({
        salary_structure_id: structure.id,
        salary_rule_id: r.salary_rule_id,
        sequence: r.sequence
      }));

      const { error: rulesError } = await supabaseAdminClient
        .from('salary_structure_rules')
        .insert(junctionInserts);

      if (rulesError) {
        if (rulesError.code === '23505') {
          throw new ConflictError('Duplicate sequence number or duplicate rule in salary structure');
        }
        throw new DatabaseError(`Failed to attach rules to structure: ${rulesError.message}`, [rulesError]);
      }
    }

    return (await this.findStructureById(structure.id))!;
  }

  async updateStructure(id: string, dto: UpdateSalaryStructureDto): Promise<SalaryStructure | null> {
    const { rules, ...structureData } = dto;

    if (Object.keys(structureData).length > 0) {
      const { error: updateError } = await supabaseAdminClient
        .from('salary_structures')
        .update(structureData)
        .eq('id', id);

      if (updateError) {
        throw new DatabaseError(`Failed to update structure: ${updateError.message}`, [updateError]);
      }
    }

    if (rules !== undefined) {
      // Re-sync rules for the structure
      await supabaseAdminClient.from('salary_structure_rules').delete().eq('salary_structure_id', id);

      if (rules.length > 0) {
        const junctionInserts = rules.map((r) => ({
          salary_structure_id: id,
          salary_rule_id: r.salary_rule_id,
          sequence: r.sequence
        }));

        const { error: insertError } = await supabaseAdminClient
          .from('salary_structure_rules')
          .insert(junctionInserts);

        if (insertError) {
          if (insertError.code === '23505') {
            throw new ConflictError('Duplicate sequence number or duplicate rule in salary structure');
          }
          throw new DatabaseError(`Failed to update structure rules: ${insertError.message}`, [insertError]);
        }
      }
    }

    return this.findStructureById(id);
  }

  // Rules
  async findAllRules(query: SalaryRuleQueryDto): Promise<SalaryRule[]> {
    let queryBuilder = supabaseAdminClient
      .from('salary_rules')
      .select('*')
      .order('code', { ascending: true });

    if (query.category) {
      queryBuilder = queryBuilder.eq('category', query.category);
    }

    if (query.calculation_type) {
      queryBuilder = queryBuilder.eq('calculation_type', query.calculation_type);
    }

    if (query.is_active !== undefined) {
      queryBuilder = queryBuilder.eq('is_active', query.is_active);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      throw new DatabaseError(`Failed to fetch salary rules: ${error.message}`, [error]);
    }

    return (data || []) as SalaryRule[];
  }

  async findRuleById(id: string): Promise<SalaryRule | null> {
    const { data, error } = await supabaseAdminClient
      .from('salary_rules')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new DatabaseError(`Failed to fetch salary rule: ${error.message}`, [error]);
    }

    return data as SalaryRule | null;
  }

  async createRule(dto: CreateSalaryRuleDto): Promise<SalaryRule> {
    const { data, error } = await supabaseAdminClient
      .from('salary_rules')
      .insert(dto)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Failed to create salary rule: ${error.message}`, [error]);
    }

    return data as SalaryRule;
  }

  async updateRule(id: string, dto: UpdateSalaryRuleDto): Promise<SalaryRule | null> {
    const { data, error } = await supabaseAdminClient
      .from('salary_rules')
      .update(dto)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      throw new DatabaseError(`Failed to update salary rule: ${error.message}`, [error]);
    }

    return data as SalaryRule | null;
  }
}

export const salaryRepository = new SalaryRepository();
