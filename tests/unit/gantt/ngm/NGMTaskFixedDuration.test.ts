import { describe, expect, it } from 'vitest';
import { Duration } from '../../../../src/core/time/Duration.js';
import { LocalDateTime } from '../../../../src/core/time/LocalDateTime.js';
import { Load } from '../../../../src/diagrams/gantt/ngm/Load.js';
import { NGMAllocation } from '../../../../src/diagrams/gantt/ngm/NGMAllocation.js';
import { NGMTaskFixedDuration } from '../../../../src/diagrams/gantt/ngm/NGMTaskFixedDuration.js';

const at = (day: number): LocalDateTime => LocalDateTime.of(2024, 1, day, 0, 0);
const make = (): NGMTaskFixedDuration => new NGMTaskFixedDuration(NGMAllocation.fullTime(), Duration.ofDays(3));

describe('NGMTaskFixedDuration (~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/ngm/NGMTaskFixedDuration.java:56)', () => {
  it('getEnd is start.plus(duration) (:83-85)', () => {
    const task = make();
    task.setStart(at(1));
    expect(task.getStart().toString()).toBe('2024-01-01T00:00');
    expect(task.getEnd().toString()).toBe('2024-01-04T00:00');
  });

  it('setEnd back-computes start = end.minus(duration) (:88-90)', () => {
    const task = make();
    task.setEnd(at(10));
    expect(task.getStart().toString()).toBe('2024-01-07T00:00');
    expect(task.getEnd().toString()).toBe('2024-01-10T00:00');
  });

  it('getDuration returns the intrinsic duration (:93-95)', () => {
    expect(make().getDuration().getSeconds()).toBe(3 * 86400);
  });

  it('getAllocation returns the constructor allocation (NGMTask.java:295)', () => {
    const allocation = NGMAllocation.fullTime();
    expect(new NGMTaskFixedDuration(allocation, Duration.ofDays(1)).getAllocation()).toBe(allocation);
  });

  it('getEnd before any start is a NullPointerException (:84 start.plus on null)', () => {
    expect(() => make().getEnd()).toThrow('NullPointerException');
  });

  it('getTotalEffort and setEffort throw UnsupportedOperationException "Work In Progress" (:98-105)', () => {
    const task = make();
    expect(() => task.getTotalEffort()).toThrow('UnsupportedOperationException: Work In Progress');
    expect(() => task.setEffort(Load.zero())).toThrow('UnsupportedOperationException: Work In Progress');
  });
});
