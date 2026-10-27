import { describe, expect, it } from 'vitest';
import { DayOfWeek } from '../../../../src/core/time/DayOfWeek.js';
import { LocalDate } from '../../../../src/core/time/LocalDate.js';
import { LocalDateTime } from '../../../../src/core/time/LocalDateTime.js';
import { TimeRange } from '../../../../src/diagrams/gantt/core/TimeRange.js';
import { TimeRanges } from '../../../../src/diagrams/gantt/core/TimeRanges.js';
import { WorkingHours } from '../../../../src/diagrams/gantt/data/WorkingHours.js';
import { OpenClose } from '../../../../src/diagrams/gantt/OpenClose.js';
import { TimePoint } from '../../../../src/diagrams/gantt/time/TimePoint.js';
import { VariantTimeScale } from '../../../../src/diagrams/gantt/timescale/VariantTimeScale.js';

// Expected values: VariantTimeScale.java over WorkingHours.java (08:00-12:00 + 13:00-17:30,
// dayWidth 240, closeFactor 0.5): open day 162.5 (WorkingHours.java:68-70), closed day 120
// (:64-66), partial 10:00 = 60 (:78-84). 2024-03-01 is a Friday; Sat/Sun closed.
const MIN = LocalDate.of(2024, 3, 1);
const at = (d: number, h = 0): TimePoint => TimePoint.of(LocalDateTime.of(2024, 3, d, h, 0));
const build = (): VariantTimeScale => {
  const openClose = new OpenClose();
  openClose.close(DayOfWeek.SATURDAY);
  openClose.close(DayOfWeek.SUNDAY);
  const ranges = new TimeRanges(new TimeRange('08:00', '12:00'), new TimeRange('13:00', '17:30'));
  return new VariantTimeScale(MIN, LocalDate.of(2024, 3, 31), new WorkingHours(ranges, 240, 0.5), openClose);
};

describe('VariantTimeScale', () => {
  it('getPosition at min 00:00 is 0 (:59-68)', () => {
    expect(build().getPosition(at(1))).toBe(0);
  });

  it('getPosition sums one-day widths before the date plus the partial day (:62-67)', () => {
    // Fri 162.5 + Sat 120 + Sun 120 + Mon 162.5 = 565, + partial(10:00) = 60
    expect(build().getPosition(at(5, 10))).toBe(625);
  });

  it('getPosition on the first day is only the partial width (:67)', () => {
    expect(build().getPosition(at(1, 10))).toBe(60);
  });

  it('getWidth is the open or closed day width (:70-74)', () => {
    const s = build();
    expect(s.getWidth(at(1))).toBe(162.5);
    expect(s.getWidth(at(2))).toBe(120);
  });

  it('isBreaking is false (:76-79)', () => {
    expect(build().isBreaking(at(2))).toBe(false);
  });
});
