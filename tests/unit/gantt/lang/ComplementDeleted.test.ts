import { describe, expect, it } from 'vitest';
import { ComplementDeleted } from '../../../../src/diagrams/gantt/lang/ComplementDeleted.js';
import { newGantt } from '../helpers/gantt-diagram-fixture.js';

// Expected values: lang/ComplementDeleted.java (:47-55).
describe('ComplementDeleted', () => {
  const c = new ComplementDeleted();

  it('accepts "deleted" and rejects other words (java:49)', () => {
    const ubrex = c.toUnicodeBracketedExpressionComplement();
    expect(ubrex.match('deleted').exactMatch()).toBe(true);
    expect(ubrex.match('delete').exactMatch()).toBe(false);
    expect(ubrex.match('removed').exactMatch()).toBe(false);
  });

  it('getMe is ok with a fresh object (java:53-55)', () => {
    const r = c.getMe(newGantt(), { findFirstValueByKey: () => undefined, findValuesByKey: () => [] });
    expect(r.isFail()).toBe(false);
    expect(r.get()).toEqual({});
  });
});
