import { describe, expect, it } from 'vitest';
import type { StyleBuilder } from '../../../../src/core/style/StyleBuilder.js';
import { Duration } from '../../../../src/core/time/Duration.js';
import { Resource } from '../../../../src/diagrams/gantt/core/Resource.js';
import type { Task } from '../../../../src/diagrams/gantt/core/Task.js';
import { TaskCode } from '../../../../src/diagrams/gantt/core/TaskCode.js';
import { TaskGroup } from '../../../../src/diagrams/gantt/core/TaskGroup.js';
import { TaskImpl } from '../../../../src/diagrams/gantt/core/TaskImpl.js';
import { TaskSeparator } from '../../../../src/diagrams/gantt/core/TaskSeparator.js';
import { DayCalendarData } from '../../../../src/diagrams/gantt/data/DayCalendarData.js';
import { GanttModelData } from '../../../../src/diagrams/gantt/data/GanttModelData.js';
import { Load } from '../../../../src/diagrams/gantt/ngm/Load.js';
import { TimePoint } from '../../../../src/diagrams/gantt/time/TimePoint.js';

// Expected values: ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/GanttModelData.java

const STYLE = {} as unknown as StyleBuilder;
type Gantt = ConstructorParameters<typeof TaskImpl>[0];
type Constraint = Parameters<GanttModelData['addConstraint']>[0];

const calendar = new DayCalendarData();
const gantt = {
  durationOfDays: (n: number) => calendar.durationOfDays(n),
  getLoadPlanableForTask: (id: string) =>
    calendar.getOpenClose().mutateMe(calendar.getOpenCloseForTask(id)).asPiecewiseConstant(),
} as unknown as Gantt;

const day = (d: number): TimePoint => TimePoint.ofStartOfDay(2024, 3, d);
const impl = (id: string): TaskImpl => new TaskImpl(gantt, STYLE, TaskCode.fromId(id), day(4), 0);
/** A constraint stub: only `isOn` is read by GanttModelData (java:112). */
const constraintOn = (...tasks: Task[]): Constraint =>
  ({ isOn: (t: Task) => tasks.includes(t) }) as unknown as Constraint;

describe('GanttModelData', () => {
  it('tasks keep insertion order; a re-put of the same code keeps its position (LinkedHashMap, java:50-51, :75-77)', () => {
    const m = new GanttModelData();
    const a = impl('A');
    const b = impl('B');
    const a2 = impl('A');
    m.putTask(a.getCode(), a);
    m.putTask(b.getCode(), b);
    m.putTask(a2.getCode(), a2);
    expect(m.getTasks()).toEqual([a2, b]);
    expect(m.getTask(TaskCode.fromIdAndDisplay('A', 'other display'))).toBe(a2);
    expect(m.getTask(TaskCode.fromId('missing'))).toBeUndefined();
  });

  it('resources are keyed by name, in insertion order (java:81-89)', () => {
    const m = new GanttModelData();
    const r1 = new Resource('R1');
    const r2 = new Resource('R2');
    m.putResource('R2', r2);
    m.putResource('R1', r1);
    expect(m.getResources()).toEqual([r2, r1]);
    expect(m.getResource('R1')).toBe(r1);
    expect(m.getResource('nope')).toBeUndefined();
  });

  it('the collection getters return copies (unmodifiableCollection snapshots, java:57-67)', () => {
    const m = new GanttModelData();
    m.getTasks().push(impl('X'));
    m.getResources().push(new Resource('X'));
    m.getConstraints().push(constraintOn());
    expect(m.getTasks()).toEqual([]);
    expect(m.getResources()).toEqual([]);
    expect(m.getConstraints()).toEqual([]);
  });

  it('getConstraintsForTask keeps only constraints on the task, in order (java:103-110)', () => {
    const m = new GanttModelData();
    const a = impl('A');
    const b = impl('B');
    const c1 = constraintOn(a);
    const c2 = constraintOn(b);
    const c3 = constraintOn(a, b);
    m.addConstraint(c1);
    m.addConstraint(c2);
    m.addConstraint(c3);
    expect(m.getConstraints()).toEqual([c1, c2, c3]);
    expect(m.getConstraintsForTask(a)).toEqual([c1, c3]);
    expect(m.getConstraintsForTask(impl('Z'))).toEqual([]);
  });

  it('getLoadForResource sums TaskImpl loads and skips separators (java:91-101)', () => {
    const m = new GanttModelData();
    const r = new Resource('R1');
    const a = impl('A');
    a.setLoad(Load.of(Duration.ofDays(3)));
    a.addResource(r, 40);
    const b = impl('B');
    b.setLoad(Load.of(Duration.ofDays(3)));
    b.addResource(r, 25);
    const sep = new TaskSeparator(STYLE, 'sep', 1);
    m.putTask(a.getCode(), a);
    m.putTask(sep.getCode(), sep);
    m.putTask(b.getCode(), b);
    expect(m.getLoadForResource(r, day(4))).toBe(65);
    expect(m.getLoadForResource(r, day(3))).toBe(0);
  });

  it('a task that is neither TaskSeparator nor TaskImpl is the Java ClassCastException (java:96)', () => {
    const m = new GanttModelData();
    const g = new TaskGroup(undefined, STYLE, TaskCode.fromId('G'));
    m.putTask(g.getCode(), g);
    expect(() => m.getLoadForResource(new Resource('R'), day(4))).toThrow('ClassCastException');
  });
});
