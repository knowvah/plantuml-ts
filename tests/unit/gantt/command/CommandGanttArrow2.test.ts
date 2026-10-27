import { describe, expect, it } from 'vitest';
import {
  applyCommandGanttArrow2,
  COMMAND_GANTT_ARROW2_RE,
  CommandGanttArrow2,
} from '../../../../src/diagrams/gantt/command/CommandGanttArrow2.js';
import { TaskCode } from '../../../../src/diagrams/gantt/core/TaskCode.js';
import type { GanttModelData } from '../../../../src/diagrams/gantt/data/GanttModelData.js';
import type { GanttDiagram } from '../../../../src/diagrams/gantt/GanttDiagram.js';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';

const model = (d: GanttDiagram) => (d as unknown as { modelData: GanttModelData }).modelData;

/** Corpus (dot-cache gantt in.puml inputs, gantt fixtures): the lines below occur verbatim. */
const MATCHING = [
  '[TASK1]->[Testing]',
  '[task01] -> [task02]',
  '[t3] -> [<back:red>t4]',
  '[UI 2] -> [UI Task]',
  '[Prototype design] -[#012]-> [Build prototype]',
  '[Start] -[dotted]-> [UI 1]',
  '[a] ---> [b]  ',
  '[a]-[dashed]>[b]',
];
const NEAR_MISSES = [
  'a -> b',
  '[a] -> b',
  '[a] > [b]',
  '[] -> [b]',
  '[a] -[]-> [b]',
  '[a] -> [b] x',
  '[a[x]] -> [b]',
  ' [a] -> [b]',
];

describe('CommandGanttArrow2', () => {
  it.each(MATCHING)('regex matches %j (CommandGanttArrow2.java:58-74)', (line) => {
    expect(COMMAND_GANTT_ARROW2_RE.test(line)).toBe(true);
  });

  it.each(NEAR_MISSES)('regex rejects %j', (line) => {
    expect(COMMAND_GANTT_ARROW2_RE.test(line)).toBe(false);
  });

  it('captures TASK1, ARROW_STYLE, TASK2 (CommandGanttArrow2.java:61-71)', () => {
    const g = COMMAND_GANTT_ARROW2_RE.exec('[Prototype design] -[#012]-> [Build prototype]')!.groups!;
    expect([g['TASK1'], g['ARROW_STYLE'], g['TASK2']]).toEqual(['Prototype design', '#012', 'Build prototype']);
    expect(COMMAND_GANTT_ARROW2_RE.exec('[a] -> [b]')!.groups!['ARROW_STYLE']).toBeUndefined();
  });

  it('exports the class-name const as { regex, apply }', () => {
    expect(CommandGanttArrow2.regex).toBe(COMMAND_GANTT_ARROW2_RE);
    expect(CommandGanttArrow2.apply).toBe(applyCommandGanttArrow2);
  });

  it('creates both tasks and forces their order (CommandGanttArrow2.java:80-84)', () => {
    const diagram = newGantt();
    const result = applyCommandGanttArrow2(diagram, COMMAND_GANTT_ARROW2_RE.exec('[UI 1] -> [UI 2]')!);
    expect(result.isOk()).toBe(true);
    expect(
      model(diagram)
        .getTasks()
        .map((t) => t.getCode().getId()),
    ).toEqual(['UI 1', 'UI 2']);
    expect(model(diagram).getConstraints()).toHaveLength(1);
  });

  it('reuses an existing task rather than creating a second (GanttDiagram.java:277-280)', () => {
    const diagram = newGantt();
    diagram.getOrCreateTask(TaskCode.fromId('a'), false);
    applyCommandGanttArrow2(diagram, COMMAND_GANTT_ARROW2_RE.exec('[a] -> [b]')!);
    expect(model(diagram).getTasks()).toHaveLength(2);
  });

  it('applies the style bracket (CommandGanttArrow2.java:86)', () => {
    const dashed = newGantt();
    applyCommandGanttArrow2(dashed, COMMAND_GANTT_ARROW2_RE.exec('[a] -[dashed]-> [b]')!);
    expect(model(dashed).getConstraints()[0]!.getType().getStyle().toString()).toBe('DASHED(null)');
    const plain = newGantt();
    applyCommandGanttArrow2(plain, COMMAND_GANTT_ARROW2_RE.exec('[a] -> [b]')!);
    expect(model(plain).getConstraints()[0]!.getType().getStyle().toString()).toBe('NORMAL(null)');
  });
});
