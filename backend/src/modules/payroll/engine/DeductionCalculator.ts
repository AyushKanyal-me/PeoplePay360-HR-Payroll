export class DeductionCalculator {
  /**
   * Calculates prorated unpaid leave deduction:
   * deduction = (wage / totalWorkingDays) * unpaidDays
   */
  calculateUnpaidLeaveDeduction(wage: number, totalWorkingDays: number, unpaidDays: number): number {
    if (totalWorkingDays <= 0 || unpaidDays <= 0 || wage <= 0) {
      return 0;
    }
    const dailyRate = wage / totalWorkingDays;
    const deduction = dailyRate * unpaidDays;
    return Number(deduction.toFixed(2));
  }
}
