import { describe, expect, it } from 'vitest';
import { TaskCode } from '../../../../src/diagrams/gantt/core/TaskCode.js';
import { ComplementTask } from '../../../../src/diagrams/gantt/lang/ComplementTask.js';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';

// Expected values: ComplementTask.java:46-62.
const complement = new ComplementTask();
const parse = (s: string) => complement.toUnicodeBracketedExpressionComplement().match(s);

describe('ComplementTask', () => {
  it.each(['[A]', '[Task one]', '[x-1]'])('accepts %s (java:50 taskCode)', (s) => {
    expect(parse(s).exactMatch()).toBe(true);
  });

  it.each(['A', '[]', '[A', 'A]', '[[A]]', ''])('rejects %s', (s) => {
    expect(parse(s).exactMatch()).toBe(false);
  });

  it('captures the code as COMPLEMENT with its brackets (java:50)', () => {
    const m = parse('[Task one]');
    expect(m.findFirstValueByKey('COMPLEMENT')).toBe('[Task one]');
  });

  it('getMe on an existing task code (with its brackets, as captured) returns that task (java:59)', () => {
    const gantt = newGantt();
    const task = gantt.getOrCreateTask(TaskCode.fromId('[A]'), false);
    expect(complement.getMe(gantt, parse('[A]')).get()).toBe(task);
  });

  it('getMe on an unknown task is the error "No such task <code>" (java:56-58)', () => {
    const r = complement.getMe(newGantt(), parse('[Nope]'));
    expect(r.isFail()).toBe(true);
    expect(r.getError()).toBe('No such task [Nope]');
  });
});
