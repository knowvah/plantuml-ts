import { describe, expect, it } from 'vitest';
import type { StyleBuilder } from '../../../../src/core/style/StyleBuilder.js';
import { DayOfWeek } from '../../../../src/core/time/DayOfWeek.js';
import { MomentImpl } from '../../../../src/diagrams/gantt/core/MomentImpl.js';
import { TaskAttribute } from '../../../../src/diagrams/gantt/core/TaskAttribute.js';
import { TaskCode } from '../../../../src/diagrams/gantt/core/TaskCode.js';
import { TaskGroup } from '../../../../src/diagrams/gantt/core/TaskGroup.js';
import { TaskInstant } from '../../../../src/diagrams/gantt/core/TaskInstant.js';
import { GanttConstraintMode } from '../../../../src/diagrams/gantt/GanttConstraintMode.js';
import { OpenClose } from '../../../../src/diagrams/gantt/OpenClose.js';
import { TimePoint } from '../../../../src/diagrams/gantt/time/TimePoint.js';

// Expected values: ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskInstant.java
// 2024-03-01 is a Friday, so 03-02 and 03-03 are the weekend.
const day = (d: number): TimePoint => TimePoint.ofStartOfDay(2024, 3, d);
const moment = new MomentImpl(day(1), day(8));
const weekendClosed = (() => {
  const oc = new OpenClose();
  oc.close(DayOfWeek.SATURDAY);
  oc.close(DayOfWeek.SUNDAY);
  return oc.asPiecewiseConstant();
})();

describe('TaskInstant', () => {
  it('START / END without delta give the moment bounds (java:94-103)', () => {
    expect(new TaskInstant(moment, TaskAttribute.START).getInstantPrecise().toString()).toBe('2024-03-01T00:00');
    expect(new TaskInstant(moment, TaskAttribute.END).getInstantPrecise().toString()).toBe('2024-03-08T00:00');
  });

  it('any other attribute is an IllegalArgumentException (java:63-64)', () => {
    expect(() => new TaskInstant(moment, TaskAttribute.LOAD)).toThrow('IllegalArgumentException');
  });

  it('exposes moment and attribute (java:109-119)', () => {
    const i = new TaskInstant(moment, TaskAttribute.END);
    expect(i.getMoment()).toBe(moment);
    expect(i.getAttribute()).toBe(TaskAttribute.END);
  });

  it('positive delta, IGNORE_CALENDAR: +N days (java:71-81)', () => {
    const i = new TaskInstant(moment, TaskAttribute.START).withDelta(2, GanttConstraintMode.IGNORE_CALENDAR, undefined);
    expect(i.getInstantPrecise().toString()).toBe('2024-03-03T00:00');
  });

  it('positive delta, DO_NOT_COUNT_CLOSE_DAY skips closed days without counting them (java:75-81)', () => {
    const i = new TaskInstant(moment, TaskAttribute.START).withDelta(
      2,
      GanttConstraintMode.DO_NOT_COUNT_CLOSE_DAY,
      weekendClosed,
    );
    // Fri 1 -> Sat 2 (closed) -> Sun 3 (closed) -> Mon 4 (1) -> Tue 5 (2)
    expect(i.getInstantPrecise().toString()).toBe('2024-03-05T00:00');
  });

  it('DO_NOT_COUNT_CLOSE_DAY without a calendar is a NullPointerException (java:76 isZeroOnDay(null, ...))', () => {
    const i = new TaskInstant(moment, TaskAttribute.START).withDelta(
      1,
      GanttConstraintMode.DO_NOT_COUNT_CLOSE_DAY,
      undefined,
    );
    expect(() => i.getInstantPrecise()).toThrow('NullPointerException');
  });

  it('negative delta decrements |delta| days regardless of calendar (java:85-87)', () => {
    const i = new TaskInstant(moment, TaskAttribute.END).withDelta(
      -3,
      GanttConstraintMode.DO_NOT_COUNT_CLOSE_DAY,
      weekendClosed,
    );
    expect(i.getInstantPrecise().toString()).toBe('2024-03-05T00:00');
  });

  it('withDelta returns a new instant and leaves the original untouched (java:67-69)', () => {
    const base = new TaskInstant(moment, TaskAttribute.START);
    const moved = base.withDelta(1, GanttConstraintMode.IGNORE_CALENDAR, undefined);
    expect(moved).not.toBe(base);
    expect(base.getInstantPrecise().toString()).toBe('2024-03-01T00:00');
    expect(moved.getInstantPrecise().toString()).toBe('2024-03-02T00:00');
  });

  it('toString is "<attribute> of <moment>" (java:105-107)', () => {
    const m = { ...moment, toString: () => 'M' } as unknown as MomentImpl;
    expect(new TaskInstant(m, TaskAttribute.END).toString()).toBe('END of M');
  });

  describe('isTask / sameRowAs (java:113-130)', () => {
    const style = {} as unknown as StyleBuilder;
    const g1 = new TaskGroup(undefined, style, TaskCode.fromId('1'));
    const g2 = new TaskGroup(undefined, style, TaskCode.fromId('2'));
    const g3 = new TaskGroup(undefined, style, TaskCode.fromId('3'));
    const inst = (m: TaskGroup | MomentImpl): TaskInstant => new TaskInstant(m, TaskAttribute.START);

    it('isTask is true only for AbstractTask moments', () => {
      expect(inst(g1).isTask()).toBe(true);
      expect(inst(moment).isTask()).toBe(false);
    });

    it('same row in either direction, otherwise false', () => {
      g2.putInSameRowAs(g1);
      expect(inst(g1).sameRowAs(inst(g2))).toBe(true);
      expect(inst(g2).sameRowAs(inst(g1))).toBe(true);
      expect(inst(g1).sameRowAs(inst(g3))).toBe(false);
    });

    it('non-task moments are never in the same row', () => {
      expect(inst(moment).sameRowAs(inst(g1))).toBe(false);
      expect(inst(g1).sameRowAs(inst(moment))).toBe(false);
    });
  });
});
