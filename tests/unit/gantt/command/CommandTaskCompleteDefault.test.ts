import { describe, expect, it, vi } from 'vitest';
import {
  applyCommandTaskCompleteDefault,
  COMMAND_TASK_COMPLETE_DEFAULT_RE,
  CommandTaskCompleteDefault,
} from '../../../../src/diagrams/gantt/command/CommandTaskCompleteDefault.js';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';

const CMD = 'src/main/java/net/sourceforge/plantuml/gantt/command/CommandTaskCompleteDefault.java';

function run(line: string) {
  const d = newGantt();
  const spy = vi.spyOn(d, 'setTaskDefaultCompletion');
  const m = COMMAND_TASK_COMPLETE_DEFAULT_RE.exec(line);
  if (m === null) throw new Error(`no match: ${line}`);
  return { result: applyCommandTaskCompleteDefault(d, m), spy };
}

describe('CommandTaskCompleteDefault', () => {
  // Corpus form plus the second RegexOr branch.
  it.each([
    'Task completion default to 0%',
    'task default completion to 50',
    'task default  completion to 100 trailing words',
    'TASK COMPLETION DEFAULT TO 7',
  ])(`matches %s (${CMD}:58-68)`, (line) => {
    expect(COMMAND_TASK_COMPLETE_DEFAULT_RE.test(line)).toBe(true);
  });

  it.each([
    'task default to 5',
    'task completion to 5',
    'task default completion 5',
    'task default completion to x',
    'task default completion to',
    'tasks default completion to 5',
    'default completion to 5',
  ])(`rejects %j (${CMD}:58-66)`, (line) => {
    expect(COMMAND_TASK_COMPLETE_DEFAULT_RE.test(line)).toBe(false);
  });

  it('captures VALUE (CommandTaskCompleteDefault.java:66)', () => {
    expect(COMMAND_TASK_COMPLETE_DEFAULT_RE.exec('Task completion default to 0%')?.groups?.['VALUE']).toBe('0');
  });

  it('apply stores the value (CommandTaskCompleteDefault.java:75,79)', () => {
    const { result, spy } = run('Task completion default to 0%');
    expect(result.isOk()).toBe(true);
    expect(spy).toHaveBeenCalledExactlyOnceWith(0);
  });

  it('100 is accepted, 101 is refused "Completetion must between 0 and 100" without storing (CommandTaskCompleteDefault.java:76-77)', () => {
    const ok = run('task default completion to 100');
    expect(ok.result.isOk()).toBe(true);
    expect(ok.spy).toHaveBeenCalledExactlyOnceWith(100);
    const bad = run('task default completion to 101');
    expect(bad.result.getError()).toBe('Completetion must between 0 and 100');
    expect(bad.spy).not.toHaveBeenCalled();
  });

  it('a value past the int range throws NumberFormatException as Integer.parseInt does (CommandTaskCompleteDefault.java:75)', () => {
    expect(() => run('task default completion to 99999999999')).toThrow(/NumberFormatException/);
  });

  it('exports { regex, apply } under the Java class name', () => {
    expect(CommandTaskCompleteDefault.regex).toBe(COMMAND_TASK_COMPLETE_DEFAULT_RE);
    expect(CommandTaskCompleteDefault.apply).toBe(applyCommandTaskCompleteDefault);
  });
});
