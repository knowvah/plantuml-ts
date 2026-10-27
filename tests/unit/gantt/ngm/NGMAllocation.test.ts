import { describe, expect, it } from 'vitest';
import { LocalDateTime } from '../../../../src/core/time/LocalDateTime.js';
import { Fraction } from '../../../../src/diagrams/gantt/ngm/math/Fraction.js';
import { PiecewiseConstantWeekday } from '../../../../src/diagrams/gantt/ngm/math/PiecewiseConstantWeekday.js';
import { TimeDirection } from '../../../../src/diagrams/gantt/ngm/math/TimeDirection.js';
import { NGMAllocation } from '../../../../src/diagrams/gantt/ngm/NGMAllocation.js';

describe('NGMAllocation (~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMAllocation.java:86)', () => {
  it('of() wraps the given load function and getLoadFunction returns it (:122,151)', () => {
    const f = PiecewiseConstantWeekday.of(new Fraction(1, 2));
    expect(NGMAllocation.of(f).getLoadFunction()).toBe(f);
  });

  it('fullTime() is 1/1 on every day of the week (:136-139)', () => {
    const f = NGMAllocation.fullTime().getLoadFunction();
    for (let day = 1; day <= 7; day++) {
      const s = f.segmentAt(LocalDateTime.of(2024, 1, day, 10, 0), TimeDirection.FORWARD);
      expect(s.getValue().toString()).toBe('1');
      expect(s.endExclusive().toString()).toBe(`2024-01-0${day + 1}T00:00`);
    }
  });
});
