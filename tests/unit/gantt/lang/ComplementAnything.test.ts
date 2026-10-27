import { describe, expect, it } from 'vitest';
import type { CaptureLookup } from '../../../../src/core/ubrex/CaptureLookup.js';
import { ComplementAnything } from '../../../../src/diagrams/gantt/lang/ComplementAnything.js';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';

const lookup = (values: Record<string, string[]>): CaptureLookup => ({
  findFirstValueByKey: (key) => values[key]?.[0],
  findValuesByKey: (key) => values[key] ?? [],
});

// Expected values: lang/ComplementAnything.java (:48-57).
describe('ComplementAnything', () => {
  const c = new ComplementAnything();

  it('captures the whole text as ANYTHING, rejecting nothing (java:50)', () => {
    const m = c.toUnicodeBracketedExpressionComplement().match('any text, 12 !');
    expect(m.exactMatch()).toBe(true);
    expect(m.findFirstValueByKey('ANYTHING')).toBe('any text, 12 !');
  });

  it('〴. is CharClassRaw.ANY (every char, line breaks included), so a multi-line text is accepted whole', () => {
    const m = c.toUnicodeBracketedExpressionComplement().match('a\nb');
    expect(m.exactMatch()).toBe(true);
    expect(m.findFirstValueByKey('ANYTHING')).toBe('a\nb');
  });

  it('getMe returns the ANYTHING capture (java:54-57)', () => {
    const r = c.getMe(newGantt(), lookup({ ANYTHING: ['x y'] }));
    expect(r.get()).toBe('x y');
  });

  it('an empty capture is an ok empty string (java:55-56)', () => {
    expect(c.getMe(newGantt(), lookup({ ANYTHING: [''] })).get()).toBe('');
  });
});
