import { describe, expect, it } from 'vitest';
import type { Failable } from '../../../../src/core/gantt/Failable.js';
import { ComplementClose } from '../../../../src/diagrams/gantt/lang/ComplementClose.js';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';

// Expected values: ComplementClose.java:48-70.
const complement = new ComplementClose();
const parse = (s: string) => complement.toUnicodeBracketedExpressionComplement().match(s);

describe('ComplementClose', () => {
  it.each(['close', 'closed', 'close for [A]', 'closed for [Task one]'])('accepts %s (java:54-55)', (s) => {
    expect(parse(s).exactMatch()).toBe(true);
  });

  it.each(['', 'closing', 'close for', 'close for A', 'close for []', ' [A]'])('rejects %s', (s) => {
    expect(parse(s).exactMatch()).toBe(false);
  });

  it('getMe without a task gives "" (java:67)', () => {
    const r: Failable<string> = complement.getMe(newGantt(), parse('close'));
    expect(r.get()).toBe('');
  });

  it('getMe with "for [Task one]" gives the task code between the brackets (java:59-66)', () => {
    expect(complement.getMe(newGantt(), parse('closed for [Task one]')).get()).toBe('Task one');
  });

  it('names the capture CLOSED (java:52)', () => {
    expect(parse('close for [A]').findFirstValueByKey('CLOSED')).toBe('close for [A]');
  });
});
