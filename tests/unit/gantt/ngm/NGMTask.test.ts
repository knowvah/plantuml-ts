import { describe, expect, it } from 'vitest';
import { Duration } from '../../../../src/core/time/Duration.js';
import { LocalDateTime } from '../../../../src/core/time/LocalDateTime.js';
import { Fraction } from '../../../../src/diagrams/gantt/ngm/math/Fraction.js';
import { PiecewiseConstantWeekday } from '../../../../src/diagrams/gantt/ngm/math/PiecewiseConstantWeekday.js';
import { Load } from '../../../../src/diagrams/gantt/ngm/Load.js';
import { NGMAllocation } from '../../../../src/diagrams/gantt/ngm/NGMAllocation.js';

import { NGMTask } from '../../../../src/diagrams/gantt/ngm/NGMTask.js';
import { NGMTaskFixedDuration } from '../../../../src/diagrams/gantt/ngm/NGMTaskFixedDuration.js';
import { NGMTaskFixedTotalEffort } from '../../../../src/diagrams/gantt/ngm/NGMTaskFixedTotalEffort.js';

const at = (day: number): LocalDateTime => LocalDateTime.of(2024, 1, day, 0, 0);

describe('NGMTask (~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMTask.java:117)', () => {
  it('withFixedDuration builds a NGMTaskFixedDuration (:331-333)', () => {
    const allocation = NGMAllocation.fullTime();
    const task = NGMTask.withFixedDuration(allocation, Duration.ofDays(2));
    expect(task).toBeInstanceOf(NGMTaskFixedDuration);
    expect(task.getDuration().getSeconds()).toBe(2 * 86400);
    expect(task.getAllocation()).toBe(allocation);
  });

  it('withFixedTotalEffort builds a NGMTaskFixedTotalEffort anchored at start (:368-371)', () => {
    // Full time (1/1 every day, NGMAllocation.java:136): 2 days from Mon 1st end Wed 3rd 00:00.
    const task = NGMTask.withFixedTotalEffort(NGMAllocation.fullTime(), at(1), Load.of(Duration.ofDays(2)));
    expect(task).toBeInstanceOf(NGMTaskFixedTotalEffort);
    expect(task.getStart().toString()).toBe('2024-01-01T00:00');
    expect(task.getEnd().toString()).toBe('2024-01-03T00:00');
  });

  it('a 1/2 allocation on a fixed-total-effort task doubles its duration (:368, LoadIntegrator.java:113-117)', () => {
    const half = NGMAllocation.of(PiecewiseConstantWeekday.of(new Fraction(1, 2)));
    const task = NGMTask.withFixedTotalEffort(half, at(1), Load.of(Duration.ofDays(1)));
    expect(task.getDuration().getSeconds()).toBe(2 * 86400);
  });
});
