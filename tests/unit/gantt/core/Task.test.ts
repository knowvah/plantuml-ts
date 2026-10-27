import { describe, expect, it } from 'vitest';
import type { StyleBuilder } from '../../../../src/core/style/StyleBuilder.js';
import { LocalDateTime } from '../../../../src/core/time/LocalDateTime.js';
import type { Task } from '../../../../src/diagrams/gantt/core/Task.js';
import { TaskCode } from '../../../../src/diagrams/gantt/core/TaskCode.js';
import { TaskGroup } from '../../../../src/diagrams/gantt/core/TaskGroup.js';
import { TaskSeparator } from '../../../../src/diagrams/gantt/core/TaskSeparator.js';

// Task is an interface (Task.java:49-95): its contract is exercised through the two
// concrete implementers in this port, used here only through the `Task` type.
const STYLE = {} as unknown as StyleBuilder;

describe('Task (interface contract)', () => {
  const tasks: Task[] = [new TaskGroup(undefined, STYLE, TaskCode.fromId('g')), new TaskSeparator(STYLE, 'sep', 1)];

  it.each([0, 1])('implementer %i exposes getCode and an unset row (java:51, :69)', (i) => {
    const t = tasks[i] as Task;
    expect(t.getCode().getId()).toBe(['g', '##1'][i]);
    expect(t.getRow()).toBeUndefined();
  });

  it('is a Moment: getEnd is reachable through the type (Task extends Moment, java:49)', () => {
    const t = tasks[1] as Task;
    expect(() => t.getEnd()).toThrow('UnsupportedOperationException');
    expect(LocalDateTime.of(2024, 3, 1, 0, 0).getHour()).toBe(0);
  });
});
