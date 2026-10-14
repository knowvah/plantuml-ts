/**
 * `OPENICONIC_ALL` -- upstream `openiconic/all.txt` in file order, the list
 * `PSystemListOpenIconic.java:66-73` reads line by line (ufp T0e, D5).
 */
import { describe, expect, it } from 'vitest';

import { RAW_GLYPHS } from '../../../src/core/openiconic-glyphs-data.js';
import { OPENICONIC_ALL } from '../../../src/diagrams/openiconic/openiconic-all.js';

describe('OPENICONIC_ALL', () => {
  it('carries all 223 lines of upstream all.txt, first and last as in the file', () => {
    expect(OPENICONIC_ALL).toHaveLength(223);
    expect(OPENICONIC_ALL[0]).toBe('account-login');
    expect(OPENICONIC_ALL[1]).toBe('account-logout');
    expect(OPENICONIC_ALL.at(-1)).toBe('zoom-out');
  });

  it('keeps file order, which is not a code-unit sort (all.txt is hand-ordered)', () => {
    const sorted = [...OPENICONIC_ALL].sort();
    expect(OPENICONIC_ALL).not.toEqual(sorted);
  });

  it('names only glyphs the port can draw (every entry is a RAW_GLYPHS key)', () => {
    const missing = OPENICONIC_ALL.filter((name) => !Object.hasOwn(RAW_GLYPHS, name));
    expect(missing).toEqual([]);
    expect(new Set(OPENICONIC_ALL).size).toBe(Object.keys(RAW_GLYPHS).length);
  });
});
