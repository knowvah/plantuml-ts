import { describe, expect, it } from 'vitest';
import {
  applyCommandGroupStart,
  COMMAND_GROUP_START_RE,
  CommandGroupStart,
} from '../../../../src/diagrams/gantt/command/CommandGroupStart.js';
import { TaskCode } from '../../../../src/diagrams/gantt/core/TaskCode.js';
import { TaskGroup } from '../../../../src/diagrams/gantt/core/TaskGroup.js';
import type { GanttModelData } from '../../../../src/diagrams/gantt/data/GanttModelData.js';
import type { GanttDiagram } from '../../../../src/diagrams/gantt/GanttDiagram.js';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';

const taskOf = (d: GanttDiagram, id: string) =>
  (d as unknown as { modelData: GanttModelData }).modelData.getTask(TaskCode.fromId(id));

/** Corpus: `group [Architectural design]`, `group [Interior design phase]`, `group [GENERAL DESIGN]`. */
const MATCHING = [
  'group [Architectural design]',
  'group [GENERAL DESIGN]',
  'group [Interior design phase]  ',
  'GROUP  [x]',
];
const NEAR_MISSES = ['group', 'group []', 'group [a', 'group [a[b]]', 'group[a] x', ' group [a]', 'groups [a]'];

describe('CommandGroupStart', () => {
  it.each(MATCHING)('regex matches %j (CommandGroupStart.java:55-64)', (line) => {
    expect(COMMAND_GROUP_START_RE.test(line)).toBe(true);
  });

  it.each(NEAR_MISSES)('regex rejects %j', (line) => {
    expect(COMMAND_GROUP_START_RE.test(line)).toBe(false);
  });

  it('captures NAME without the brackets (CommandGroupStart.java:59-61)', () => {
    expect(COMMAND_GROUP_START_RE.exec('group [Interior design phase]')!.groups!['NAME']).toBe('Interior design phase');
  });

  it('exports the class-name const as { regex, apply }', () => {
    expect(CommandGroupStart.regex).toBe(COMMAND_GROUP_START_RE);
    expect(CommandGroupStart.apply).toBe(applyCommandGroupStart);
  });

  it('adds a TaskGroup coded by TaskCode.fromId(name) (CommandGroupStart.java:69-70)', () => {
    const diagram = newGantt();
    const result = applyCommandGroupStart(diagram, COMMAND_GROUP_START_RE.exec('group [GENERAL DESIGN]')!);
    expect(result.isOk()).toBe(true);
    const group = taskOf(diagram, 'GENERAL DESIGN');
    expect(group).toBeInstanceOf(TaskGroup);
    expect(group!.getCode().getId()).toBe('GENERAL DESIGN');
  });
});
