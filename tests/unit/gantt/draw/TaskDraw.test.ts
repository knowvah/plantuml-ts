import { describe, expect, it } from 'vitest';
import type { StringBounder } from '../../../../src/core/klimt/font/StringBounder.js';
import { taskDrawLabelOverflow, type TaskDraw } from '../../../../src/diagrams/gantt/draw/TaskDraw.js';

// TaskDraw.java is an interface; its only behaviour is the `default` getLabelOverflow returning 0 (java:76-78).
const SB = {} as StringBounder;
function draw(overflow?: TaskDraw['getLabelOverflow']): TaskDraw {
  return { getLabelOverflow: overflow } as unknown as TaskDraw;
}

describe('taskDrawLabelOverflow (TaskDraw.java:76-78)', () => {
  it('defaults to 0 when the implementer does not override it', () => {
    expect(taskDrawLabelOverflow(draw(), SB, 100)).toBe(0);
  });

  it('delegates to an override with the bars width', () => {
    expect(
      taskDrawLabelOverflow(
        draw((_sb, barsWidth) => barsWidth / 4),
        SB,
        100,
      ),
    ).toBe(25);
  });
});
