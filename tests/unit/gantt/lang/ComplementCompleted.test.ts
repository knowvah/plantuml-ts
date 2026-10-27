import { describe, expect, it } from 'vitest';
import type { CaptureLookup } from '../../../../src/core/ubrex/CaptureLookup.js';
import { ComplementCompleted } from '../../../../src/diagrams/gantt/lang/ComplementCompleted.js';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';

const lookup = (values: Record<string, string[]>): CaptureLookup => ({
  findFirstValueByKey: (key) => values[key]?.[0],
  findValuesByKey: (key) => values[key] ?? [],
});

// Expected values: lang/ComplementCompleted.java (:50-62).
describe('ComplementCompleted', () => {
  const c = new ComplementCompleted();
  const ubrex = c.toUnicodeBracketedExpressionComplement();

  it.each([
    ['40% complete', '40'],
    ['100% completed', '100'],
    ['7%  complete', '7'],
    ['40 complete', '40'], // 〴W is any non-word char, a blank included (java:53)
  ])('accepts %s and captures COMPLEMENT=%s (java:52-56)', (text, value) => {
    const m = ubrex.match(text);
    expect(m.exactMatch()).toBe(true);
    expect(m.findFirstValueByKey('COMPLEMENT')).toBe(value);
  });

  it.each(['40% done', '% complete', 'x% complete', '40complete'])('rejects %s', (text) => {
    expect(ubrex.match(text).exactMatch()).toBe(false);
  });

  it('getMe builds a Completion from the captured integer (java:58-62)', () => {
    expect(
      c
        .getMe(newGantt(), lookup({ COMPLEMENT: ['40'] }))
        .get()
        .getCompletion(),
    ).toBe(40);
  });

  it('a non-integer or missing capture is a NumberFormatException (Integer.parseInt)', () => {
    expect(() => c.getMe(newGantt(), lookup({ COMPLEMENT: ['x'] }))).toThrow('NumberFormatException');
    expect(() => c.getMe(newGantt(), lookup({}))).toThrow('NumberFormatException');
    expect(() => c.getMe(newGantt(), lookup({ COMPLEMENT: ['99999999999'] }))).toThrow('NumberFormatException');
  });
});
