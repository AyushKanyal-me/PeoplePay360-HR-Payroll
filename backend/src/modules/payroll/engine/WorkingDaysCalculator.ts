export class WorkingDaysCalculator {
  /**
   * Calculates total scheduled working days in a period based on schedule days pattern.
   * If schedule days are configured (e.g. MONDAY-FRIDAY), counts matching weekdays.
   * Defaults to 5 days/week or total weekdays in period if no explicit schedule.
   */
  calculate(periodStart: string, periodEnd: string, scheduledDayNames?: string[]): { totalPeriodDays: number; workingDays: number } {
    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    const dayMap = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

    const activeScheduleDays = (scheduledDayNames && scheduledDayNames.length > 0)
      ? scheduledDayNames.map((d) => d.toUpperCase())
      : ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

    let workingDays = 0;
    let totalPeriodDays = 0;

    const current = new Date(start);
    while (current <= end) {
      totalPeriodDays++;
      const dayName = dayMap[current.getDay()]!;
      if (activeScheduleDays.includes(dayName)) {
        workingDays++;
      }
      current.setDate(current.getDate() + 1);
    }

    return {
      totalPeriodDays,
      workingDays: Math.max(1, workingDays)
    };
  }
}
