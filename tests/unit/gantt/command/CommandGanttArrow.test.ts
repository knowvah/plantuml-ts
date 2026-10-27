import { describe, expect, it } from 'vitest';
import {
  applyCommandGanttArrow,
  COMMAND_GANTT_ARROW_RE,
  CommandGanttArrow,
} from '../../../../src/diagrams/gantt/command/CommandGanttArrow.js';
import { TaskCode } from '../../../../src/diagrams/gantt/core/TaskCode.js';
import type { GanttModelData } from '../../../../src/diagrams/gantt/data/GanttModelData.js';
import type { GanttDiagram } from '../../../../src/diagrams/gantt/GanttDiagram.js';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';

const constraints = (d: GanttDiagram) => (d as unknown as { modelData: GanttModelData }).modelData.getConstraints();

/** Corpus: dot-cache gantt in.puml inputs and the gantt fixtures (`task01 -> task02` style lines). */
const MATCHING = [
  't1->t2',
  't1 -> t2',
  't1 --> t2  ',
  't1 -[dashed]-> t2',
  't1 -[#red,bold]-> t2',
  't1-[dotted]>t2',
  'a.b_c ---> d_e.f',
];
const NEAR_MISSES = [
  't1 > t2',
  't1 -> ',
  '-> t2',
  't1 -[]-> t2',
  't1 -[nonsense]-> t2',
  't1 - > t2',
  '[t1] -> [t2]',
  't1 -> t2 x',
];

describe('CommandGanttArrow', () => {
  it.each(MATCHING)('regex matches %j (CommandGanttArrow.java:57-69)', (line) => {
    expect(COMMAND_GANTT_ARROW_RE.test(line)).toBe(true);
  });

  it.each(NEAR_MISSES)('regex rejects %j', (line) => {
    expect(COMMAND_GANTT_ARROW_RE.test(line)).toBe(false);
  });

  it('captures CODE1, ARROW_STYLE, CODE2 (CommandGanttArrow.java:59-65)', () => {
    const g = COMMAND_GANTT_ARROW_RE.exec('a -[#red,bold]-> b')!.groups!;
    expect([g['CODE1'], g['ARROW_STYLE'], g['CODE2']]).toEqual(['a', '#red,bold', 'b']);
    expect(COMMAND_GANTT_ARROW_RE.exec('a -> b')!.groups!['ARROW_STYLE']).toBeUndefined();
  });

  it('exports the class-name const as { regex, apply }', () => {
    expect(CommandGanttArrow.regex).toBe(COMMAND_GANTT_ARROW_RE);
    expect(CommandGanttArrow.apply).toBe(applyCommandGanttArrow);
  });

  it('errors on an unknown first / second task (CommandGanttArrow.java:77-84)', () => {
    const diagram = newGantt();
    diagram.getOrCreateTask(TaskCode.fromId('b'), false);
    const r1 = applyCommandGanttArrow(diagram, COMMAND_GANTT_ARROW_RE.exec('a -> b')!);
    expect(r1.getError()).toBe('No such task a');
    diagram.getOrCreateTask(TaskCode.fromId('a'), false);
    const r2 = applyCommandGanttArrow(diagram, COMMAND_GANTT_ARROW_RE.exec('a -> zz')!);
    expect(r2.getError()).toBe('No such task zz');
    expect(constraints(diagram)).toHaveLength(0);
  });

  it('forces the task order and applies the style (CommandGanttArrow.java:86-87)', () => {
    const diagram = newGantt();
    diagram.getOrCreateTask(TaskCode.fromId('a'), false);
    diagram.getOrCreateTask(TaskCode.fromId('b'), false);
    const result = applyCommandGanttArrow(diagram, COMMAND_GANTT_ARROW_RE.exec('a -[dashed]-> b')!);
    expect(result.isOk()).toBe(true);
    const all = constraints(diagram);
    expect(all).toHaveLength(1);
    expect(all[0]!.getType().getStyle().toString()).toBe('DASHED(null)');
  });

  it('without a style bracket the link stays a plain line (WithLinkType.java:126-127: null style is a no-op)', () => {
    const diagram = newGantt();
    diagram.getOrCreateTask(TaskCode.fromId('a'), false);
    diagram.getOrCreateTask(TaskCode.fromId('b'), false);
    applyCommandGanttArrow(diagram, COMMAND_GANTT_ARROW_RE.exec('a -> b')!);
    expect(constraints(diagram)[0]!.getType().getStyle().toString()).toBe('NORMAL(null)');
  });
});
