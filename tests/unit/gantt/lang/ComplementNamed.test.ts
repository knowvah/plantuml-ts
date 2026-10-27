import { describe, expect, it } from 'vitest';
import { ComplementNamed } from '../../../../src/diagrams/gantt/lang/ComplementNamed.js';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';

// Expected values: ComplementNamed.java:48-60.
const complement = new ComplementNamed();
const parse = (s: string) => complement.toUnicodeBracketedExpressionComplement().match(s);

describe('ComplementNamed', () => {
  it.each(['[Task 1]', '[a]', '[with spaces and (parens)]'])('accepts %s (java:50-53)', (s) => {
    expect(parse(s).exactMatch()).toBe(true);
  });

  it.each(['[]', 'Task', '[open', 'close]'])('rejects %s (java:50-53)', (s) => {
    expect(parse(s).exactMatch()).toBe(false);
  });

  it('getMe returns the bracketed text (java:57-59)', () => {
    expect(complement.getMe(newGantt(), parse('[Prototype design]')).get()).toBe('Prototype design');
  });

  it('a missing capture is Failable.ok(null), which Java rejects (java:59, Failable.java:50-51)', () => {
    const none = { findFirstValueByKey: () => undefined, findValuesByKey: () => [] };
    expect(() => complement.getMe(newGantt(), none)).toThrow('IllegalArgumentException');
  });
});
