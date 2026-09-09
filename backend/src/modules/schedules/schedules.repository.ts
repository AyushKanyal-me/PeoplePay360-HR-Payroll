import { supabaseAdminClient } from '../../config/supabase.js';
import {
  WorkingSchedule,
  ScheduleDay,
  CreateScheduleDto,
  UpdateScheduleDto,
  ScheduleQueryDto
} from './schedules.types.js';
import { DatabaseError } from '../../utils/errors.js';

export class SchedulesRepository {
  async findAll(query: ScheduleQueryDto): Promise<WorkingSchedule[]> {
    let queryBuilder = supabaseAdminClient
      .from('working_schedules')
      .select(`
        *,
        days:schedule_days (
          id,
          schedule_id,
          day_of_week,
          start_time,
          end_time,
          break_hours,
          total_hours,
          created_at
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
      throw new DatabaseError(`Failed to fetch working schedules: ${error.message}`, [error]);
    }

    return (data || []) as WorkingSchedule[];
  }

  async findById(id: string): Promise<WorkingSchedule | null> {
    const { data, error } = await supabaseAdminClient
      .from('working_schedules')
      .select(`
        *,
        days:schedule_days (
          id,
          schedule_id,
          day_of_week,
          start_time,
          end_time,
          break_hours,
          total_hours,
          created_at
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new DatabaseError(`Failed to fetch working schedule: ${error.message}`, [error]);
    }

    return data as WorkingSchedule | null;
  }

  async create(dto: CreateScheduleDto): Promise<WorkingSchedule> {
    const { days, ...scheduleData } = dto;

    const { data: schedule, error: schedError } = await supabaseAdminClient
      .from('working_schedules')
      .insert(scheduleData)
      .select()
      .single();

    if (schedError) {
      throw new DatabaseError(`Failed to create working schedule: ${schedError.message}`, [schedError]);
    }

    let insertedDays: ScheduleDay[] = [];
    if (days && days.length > 0) {
      const daysToInsert = days.map((d) => ({
        ...d,
        schedule_id: schedule.id
      }));

      const { data: daysData, error: daysError } = await supabaseAdminClient
        .from('schedule_days')
        .insert(daysToInsert)
        .select();

      if (daysError) {
        throw new DatabaseError(`Failed to create schedule days: ${daysError.message}`, [daysError]);
      }
      insertedDays = (daysData || []) as ScheduleDay[];
    }

    return {
      ...(schedule as WorkingSchedule),
      days: insertedDays
    };
  }

  async update(id: string, dto: UpdateScheduleDto): Promise<WorkingSchedule | null> {
    const { days, ...scheduleData } = dto;

    if (Object.keys(scheduleData).length > 0) {
      const { error: updateError } = await supabaseAdminClient
        .from('working_schedules')
        .update(scheduleData)
        .eq('id', id);

      if (updateError) {
        throw new DatabaseError(`Failed to update working schedule: ${updateError.message}`, [updateError]);
      }
    }

    if (days) {
      // Replace schedule days
      await supabaseAdminClient.from('schedule_days').delete().eq('schedule_id', id);

      if (days.length > 0) {
        const daysToInsert = days.map((d) => ({
          ...d,
          schedule_id: id
        }));
        const { error: daysError } = await supabaseAdminClient
          .from('schedule_days')
          .insert(daysToInsert);

        if (daysError) {
          throw new DatabaseError(`Failed to update schedule days: ${daysError.message}`, [daysError]);
        }
      }
    }

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await supabaseAdminClient
      .from('working_schedules')
      .delete()
      .eq('id', id);

    if (error) {
      throw new DatabaseError(`Failed to delete working schedule: ${error.message}`, [error]);
    }

    return true;
  }
}

export const schedulesRepository = new SchedulesRepository();
