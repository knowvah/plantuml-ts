import { describe, expect, it } from 'vitest';
import type { Display } from '../../../../src/core/klimt/creole/Display.js';
import type { StyleBuilder } from '../../../../src/core/style/StyleBuilder.js';
import { DayOfWeek } from '../../../../src/core/time/DayOfWeek.js';
import { LocalDate } from '../../../../src/core/time/LocalDate.js';
import type { Url } from '../../../../src/core/url/Url.js';
import { Resource } from '../../../../src/diagrams/gantt/core/Resource.js';
import { TaskCode } from '../../../../src/diagrams/gantt/core/TaskCode.js';
import { TaskGroup } from '../../../../src/diagrams/gantt/core/TaskGroup.js';
import { TaskSeparator } from '../../../../src/diagrams/gantt/core/TaskSeparator.js';
import { Load } from '../../../../src/diagrams/gantt/ngm/Load.js';
import { TimePoint } from '../../../../src/diagrams/gantt/time/TimePoint.js';
import type { Task } from '../../../../src/diagrams/gantt/core/Task.js';

// Expected values: ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/core/TaskGroup.java
const STYLE = {} as unknown as StyleBuilder;
const UNSUPPORTED = 'UnsupportedOperationException';
const day = (d: number): TimePoint => TimePoint.ofStartOfDay(2024, 3, d);

/** A child task with fixed dates. */
class Dated extends TaskSeparator {
  constructor(
    private readonly start: TimePoint,
    private readonly end: TimePoint,
  ) {
    super(STYLE, 'dated', 0);
  }
  override getStart(): TimePoint {
    return this.start;
  }
  override getEnd(): TimePoint {
    return this.end;
  }
}

const child = (_id: string, start: TimePoint, end: TimePoint): Task => new Dated(start, end);

const group = (parent?: TaskGroup): TaskGroup => new TaskGroup(parent, STYLE, TaskCode.fromId('G'));

describe('TaskGroup', () => {
  it('start is the min child start, end the max child end (java:61-85)', () => {
    const g = group();
    g.addTask(child('a', day(5), day(9)));
    g.addTask(child('b', day(2), day(4)));
    g.addTask(child('c', day(3), day(12)));
    expect(g.getStart().toString()).toBe('2024-03-02T00:00');
    expect(g.getEnd().toString()).toBe('2024-03-12T00:00');
    expect(g.getEndMinusOneDayTOBEREMOVED().toString()).toBe('2024-03-11T00:00');
  });

  it('with two children, ties keep the first (strict comparison, java:65-66, :78-79)', () => {
    const g = group();
    g.addTask(child('a', day(2), day(9)));
    g.addTask(child('b', day(2), day(9)));
    expect(g.getStart().toString()).toBe('2024-03-02T00:00');
    expect(g.getEnd().toString()).toBe('2024-03-09T00:00');
  });

  it('an empty group has no start or end (java:70, :83)', () => {
    expect(() => group().getStart()).toThrow(UNSUPPORTED);
    expect(() => group().getEnd()).toThrow(UNSUPPORTED);
  });

  it('keeps its parent (java:155-157) and code (AbstractTask)', () => {
    const p = group();
    const g = new TaskGroup(p, STYLE, TaskCode.fromId('kid'));
    expect(g.getParent()).toBe(p);
    expect(p.getParent()).toBeUndefined();
    expect(g.getCode().getId()).toBe('kid');
  });

  it('setNote is a no-op and isAssignedTo is false (java:147-149, :159-162)', () => {
    const g = group();
    expect(g.setNote({} as Display, undefined)).toBeUndefined();
    expect(g.isAssignedTo(new Resource('r'))).toBe(false);
  });

  it('every mutator and per-task accessor throws (java:87-145)', () => {
    const g = group();
    const calls: (() => unknown)[] = [
      () => g.setStart(),
      () => g.setEnd(),
      () => g.setColors(),
      () => g.addResource(new Resource('r'), 100),
      () => g.getLoad(),
      () => g.setLoad(Load.zero()),
      () => g.setDiamond(true),
      () => g.isDiamond(),
      () => g.setCompletion(50),
      () => g.setUrl({} as Url),
      () => g.addPause(LocalDate.of(2024, 3, 1)),
      () => g.addPause(DayOfWeek.MONDAY),
    ];
    for (const call of calls) expect(call).toThrow(UNSUPPORTED);
  });
});
