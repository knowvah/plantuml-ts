import { describe, expect, it } from 'vitest';
import { LocalTime } from '../../../../src/core/time/LocalTime.js';
import { DeterministicMeasurer } from '../../../../src/core/measurer-deterministic.js';
import { TimeRange } from '../../../../src/diagrams/gantt/core/TimeRange.js';
import { TimeRanges } from '../../../../src/diagrams/gantt/core/TimeRanges.js';
import { WorkingHours } from '../../../../src/diagrams/gantt/data/WorkingHours.js';
import { record } from '../../../helpers/recording-ugraphic.js';

// Expected values: WorkingHours.java (gantt/data). Fixture: 08:00-12:00 and
// 13:00-17:30, dayWidth 240 (10 px/hour), closeFactor 0.5 (closed hours are 5 px/hour).
const DAY_WIDTH = 240;
const CLOSE_FACTOR = 0.5;
const ranges = (): TimeRanges => new TimeRanges(new TimeRange('08:00', '12:00'), new TimeRange('13:00', '17:30'));
const hours = (): WorkingHours => new WorkingHours(ranges(), DAY_WIDTH, CLOSE_FACTOR);

describe('WorkingHours', () => {
  it('toString is the ranges list (java:59-62)', () => {
    expect(hours().toString()).toBe('[08:00-12:00, 13:00-17:30]');
  });

  it('a closed day is 24h * closeFactor (java:64-66, 99-101)', () => {
    expect(hours().getWorkingDurationForOneDay(true)).toBe(120);
  });

  it('an open day is working width + closed width of the pause (java:68-70)', () => {
    // working 8.5h -> 85; pause 15.5h -> 0.5 * 155 = 77.5
    expect(hours().getWorkingDurationForOneDay(false)).toBe(162.5);
  });

  it('pos before the first range counts only pause (java:78-80)', () => {
    expect(hours().getPartialDayWidth(LocalTime.of(6, 0))).toBe(30);
  });

  it('pos inside a range counts pause before it and work up to pos (java:81-84)', () => {
    // pause 8h -> 40, working 2h -> 20
    expect(hours().getPartialDayWidth(LocalTime.of(10, 0))).toBe(60);
  });

  it('pos between ranges accumulates the first range then pause (java:78-80, 85-88)', () => {
    // after 12:00: working 4h = 40, pause 8h + 0.5h = 8.5h -> 42.5
    expect(hours().getPartialDayWidth(LocalTime.of(12, 30))).toBe(82.5);
  });

  it('pos after the last range adds the trailing pause (java:90-92)', () => {
    // working 85; pause 8h + 1h + 5.5h = 14.5h -> 72.5
    expect(hours().getPartialDayWidth(LocalTime.of(23, 0))).toBe(157.5);
  });

  it('midnight is 0 and an empty schedule is all pause (java:74-77, 90-92)', () => {
    expect(hours().getPartialDayWidth(LocalTime.MIDNIGHT)).toBe(0);
    const empty = new WorkingHours(new TimeRanges(), DAY_WIDTH, CLOSE_FACTOR);
    expect(empty.getPartialDayWidth(LocalTime.of(12, 0))).toBe(60);
    expect(empty.getWorkingDurationForOneDay(false)).toBe(120);
  });

  it('a range with a null bound is a NullPointerException (java:76-83)', () => {
    const bad = new WorkingHours(new TimeRanges(new TimeRange(null, null)), DAY_WIDTH, CLOSE_FACTOR);
    expect(() => bad.getPartialDayWidth(LocalTime.of(1, 0))).toThrow('NullPointerException');
    expect(() => bad.drawOneDay(record(new DeterministicMeasurer(), () => {}) as never, 10)).toThrow();
  });

  it('drawOneDay draws the closed spans between working ranges (java:103-113)', () => {
    const log = record(new DeterministicMeasurer(), (ug) => {
      hours().drawOneDay(ug, 20);
    });
    const shapes = log.map((e) => {
      if (!('draw' in e)) throw new Error('unexpected event');
      return e;
    });
    // closed 00:00-08:00 = 40 at dx 0; 12:00-13:00 = 85 - 80 = 5 at dx 80; 17:30-MAX at dx 130.
    expect(shapes.slice(0, 2)).toEqual([
      { draw: 'URectangle(40,20)', chain: ['translate(0,0)'] },
      { draw: 'URectangle(5,20)', chain: ['translate(80,0)'] },
    ]);
    expect(shapes).toHaveLength(3);
    const last = shapes[2]!;
    expect(last.chain).toEqual(['translate(130,0)']);
    // the trailing span runs to 23:59:59 (55799 s of pause in total): 85 + 0.5 * 55799 * 240 / 86400 - 130
    const width = Number(/URectangle\((.*),20\)/.exec(last.draw)![1]);
    expect(width).toBeCloseTo(85 + (0.5 * 55799 * 240) / 86400 - 130, 9);
  });
});
