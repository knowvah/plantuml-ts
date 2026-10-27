import { describe, expect, it } from 'vitest';
import { HorizontalAlignment } from '../../../src/core/klimt/geom/HorizontalAlignment.js';
import { LabelPosition } from '../../../src/diagrams/gantt/LabelPosition.js';
import { LabelStrategy } from '../../../src/diagrams/gantt/LabelStrategy.js';

describe('LabelStrategy', () => {
  it.each([
    [LabelPosition.LEGACY, [false, false, true]],
    [LabelPosition.FIRST_COLUMN, [true, false, false]],
    [LabelPosition.LAST_COLUMN, [false, true, false]],
  ] as const)('%s (LabelStrategy.java:50-60)', (pos, [first, last, inside]) => {
    const s = new LabelStrategy(pos, HorizontalAlignment.LEFT);
    expect([s.titleInFirstColumn(), s.titleInLastColumn(), s.titleInside()]).toEqual([first, last, inside]);
  });

  it('rightAligned is alignment == RIGHT (LabelStrategy.java:62-64)', () => {
    expect(new LabelStrategy(LabelPosition.LEGACY, HorizontalAlignment.RIGHT).rightAligned()).toBe(true);
    expect(new LabelStrategy(LabelPosition.LEGACY, HorizontalAlignment.CENTER).rightAligned()).toBe(false);
  });
});
