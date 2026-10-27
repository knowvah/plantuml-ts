import { describe, expect, it } from 'vitest';
import { PrintScale } from '../../../../src/diagrams/gantt/core/PrintScale.js';
import { TimePoint } from '../../../../src/diagrams/gantt/time/TimePoint.js';
import type { TimeScale } from '../../../../src/diagrams/gantt/timescale/TimeScale.js';
import { TimeScaleDaily } from '../../../../src/diagrams/gantt/timescale/TimeScaleDaily.js';
import { TimeScaleWink } from '../../../../src/diagrams/gantt/timescale/TimeScaleWink.js';

/** Contract shared by every implementation (TimeScale.java:42-46). */
const IMPLEMENTATIONS: readonly [string, () => TimeScale][] = [
  ['TimeScaleWink', () => new TimeScaleWink(10, 1, PrintScale.DAILY)],
  ['TimeScaleDaily', () => new TimeScaleDaily(10, TimePoint.ofStartOfDay(2024, 3, 1), 1, undefined)],
];

describe.each(IMPLEMENTATIONS)('TimeScale contract: %s', (_n, make) => {
  it('position is monotonic and width is constant per day', () => {
    const s = make();
    const d1 = TimePoint.ofStartOfDay(2024, 3, 1);
    const d2 = TimePoint.ofStartOfDay(2024, 3, 2);
    expect(s.getPosition(d2)).toBeGreaterThan(s.getPosition(d1));
    expect(s.getPosition(d2) - s.getPosition(d1)).toBe(s.getWidth(d1));
    expect(typeof s.isBreaking(d1)).toBe('boolean');
  });
});
