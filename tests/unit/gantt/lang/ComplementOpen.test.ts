import { describe, expect, it } from 'vitest';
import type { Failable } from '../../../../src/core/gantt/Failable.js';
import { ComplementOpen } from '../../../../src/diagrams/gantt/lang/ComplementOpen.js';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';

// Expected values: ComplementOpen.java:48-70.
const complement = new ComplementOpen();
const parse = (s: string) => complement.toUnicodeBracketedExpressionComplement().match(s);

describe('ComplementOpen', () => {
  it.each(['open', 'opened', 'open for [A]', 'opened for [Task one]'])('accepts %s (java:54-55)', (s) => {
    expect(parse(s).exactMatch()).toBe(true);
  });

  it.each(['', 'openning', 'open for', 'open for A', 'open for []', ' [A]'])('rejects %s', (s) => {
    expect(parse(s).exactMatch()).toBe(false);
  });

  it('getMe without a task gives "" (java:67)', () => {
    const r: Failable<string> = complement.getMe(newGantt(), parse('open'));
    expect(r.get()).toBe('');
  });

  it('getMe with "for [Task one]" gives the task code between the brackets (java:59-66)', () => {
    expect(complement.getMe(newGantt(), parse('opened for [Task one]')).get()).toBe('Task one');
  });

  it('names the capture OPEN (java:52)', () => {
    expect(parse('open for [A]').findFirstValueByKey('OPEN')).toBe('open for [A]');
  });
});
