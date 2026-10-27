import { describe, expect, it } from 'vitest';
import {
  applyCommandColorTask,
  COMMAND_COLOR_TASK_RE,
  CommandColorTask,
} from '../../../../src/diagrams/gantt/command/CommandColorTask.js';
import { CommandExecutionResult } from '../../../../src/core/command/CommandExecutionResult.js';
import { HColorSet } from '../../../../src/core/klimt/color/HColorSet.js';
import { TaskCode } from '../../../../src/diagrams/gantt/core/TaskCode.js';
import type { TaskImpl } from '../../../../src/diagrams/gantt/core/TaskImpl.js';
import { CenterBorderColor } from '../../../../src/diagrams/gantt/lang/CenterBorderColor.js';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';

/** Corpus: `[TASK1] #Lavender/red`, `[TASK1] #Lavender` (dot-cache gantt in.puml inputs). */
const MATCHING = ['[TASK1] #Lavender/red', '[TASK1] #Lavender', '[a.b_c] #red/#blue  ', '[Tâche1]  #red'];
const NEAR_MISSES = [
  '[TASK1]#red',
  '[TASK1] red',
  '[] #red',
  '[TASK 1] #red',
  'TASK1 #red',
  '[T] #red/',
  '[T] #red/#blue/x',
];

const color = (name: string) => HColorSet.instance().getColor(name);

describe('CommandColorTask', () => {
  it.each(MATCHING)('regex matches %j (CommandColorTask.java:58-65)', (line) => {
    expect(COMMAND_COLOR_TASK_RE.test(line)).toBe(true);
  });

  it.each(NEAR_MISSES)('regex rejects %j', (line) => {
    expect(COMMAND_COLOR_TASK_RE.test(line)).toBe(false);
  });

  it('captures CODE and the two COLORS groups (CommandColorTask.java:60-62)', () => {
    const g = COMMAND_COLOR_TASK_RE.exec('[t.1] #red/#blue')!.groups!;
    expect([g['CODE'], g['COLORS0'], g['COLORS1']]).toEqual(['t.1', 'red', '#blue']);
    expect(COMMAND_COLOR_TASK_RE.exec('[t] #red')!.groups!['COLORS1']).toBeUndefined();
  });

  it('exports the class-name const as { regex, apply }', () => {
    expect(CommandColorTask.regex).toBe(COMMAND_COLOR_TASK_RE);
    expect(CommandColorTask.apply).toBe(applyCommandColorTask);
  });

  it('errors on an unknown task (CommandColorTask.java:72-75)', () => {
    const result = applyCommandColorTask(newGantt(), COMMAND_COLOR_TASK_RE.exec('[nope] #red')!);
    expect(result.isOk()).toBe(false);
    expect(result.getError()).toBe('No such task nope');
  });

  it('sets CenterBorderColor(col1, col2) on the task (CommandColorTask.java:77-81)', () => {
    const diagram = newGantt();
    const task = diagram.getOrCreateTask(TaskCode.fromId('T1'), false) as TaskImpl;
    const result = applyCommandColorTask(diagram, COMMAND_COLOR_TASK_RE.exec('[T1] #Lavender/#red')!);
    expect(result.isOk()).toBe(true);
    expect(task.getColors()).toEqual(new CenterBorderColor(color('Lavender'), color('#red')));
  });

  it('a single colour leaves the border undefined (CommandColorTask.java:78-79)', () => {
    const diagram = newGantt();
    const task = diagram.getOrCreateTask(TaskCode.fromId('T1'), false) as TaskImpl;
    applyCommandColorTask(diagram, COMMAND_COLOR_TASK_RE.exec('[T1] #Lavender')!);
    expect(task.getColors()).toEqual(new CenterBorderColor(color('Lavender'), undefined));
  });

  it('an absent first colour group stays undefined (CommandColorTask.java:79)', () => {
    // The regex makes COLORS0 mandatory (java:62), so the null arm needs a hand-built match.
    const diagram = newGantt();
    const task = diagram.getOrCreateTask(TaskCode.fromId('T1'), false) as TaskImpl;
    const match = COMMAND_COLOR_TASK_RE.exec('[T1] #red/#blue')!;
    match.groups = { CODE: 'T1', COLORS1: '#blue' };
    expect(applyCommandColorTask(diagram, match).isOk()).toBe(true);
    expect(task.getColors()).toEqual(new CenterBorderColor(undefined, color('#blue')));
  });

  it('an unknown colour name answers badColor, leaving the task uncoloured (HColorSet.java:69-76)', () => {
    const diagram = newGantt();
    const task = diagram.getOrCreateTask(TaskCode.fromId('T1'), false) as TaskImpl;
    const result = applyCommandColorTask(diagram, COMMAND_COLOR_TASK_RE.exec('[T1] #notacolourname')!);
    expect(result.isOk()).toBe(false);
    expect(result.getError()).toBe(CommandExecutionResult.badColor().getError());
    expect(task.getColors()).toBeUndefined();
  });

  it('rethrows anything but NoSuchColorException (SingleLineCommand2.java:174-178 catches only that)', () => {
    const diagram = newGantt();
    diagram.getOrCreateTask(TaskCode.fromId('T1'), false);
    const boom = new Error('boom');
    diagram.getIHtmlColorSet = () => {
      throw boom;
    };
    expect(() => applyCommandColorTask(diagram, COMMAND_COLOR_TASK_RE.exec('[T1] #red')!)).toThrow(boom);
  });
});
