/**
 * `String#equalsIgnoreCase` as the egg factories call it. Jar probes
 * (`scripts/oracle-render.sh`, 1.2026.8beta1, authored): `charlıe`
 * (dotless i) renders the charlie page and `Steve WozniaK` (Kelvin sign)
 * the Apple //e page, so both case rules below are the jar's.
 */
import { describe, expect, it } from 'vitest';

import { equalsIgnoreCase } from '../../../src/diagrams/eggs/equals-ignore-case.js';

describe('equalsIgnoreCase', () => {
  it('matches across ASCII case', () => {
    expect(equalsIgnoreCase('CharLIE', 'charlie')).toBe(true);
  });

  it('matches when the upper cases agree (dotless i -> I)', () => {
    expect(equalsIgnoreCase('charlıe', 'charlie')).toBe(true);
  });

  it('matches when the lower cases of the upper cases agree (Kelvin sign -> k)', () => {
    expect(equalsIgnoreCase('Steve WozniaK', 'Steve Wozniak')).toBe(true);
  });

  it('keeps a char whose upper case is several chars (sharp s is not SS)', () => {
    expect(equalsIgnoreCase('ß', 's')).toBe(false);
    expect(equalsIgnoreCase('ß', 'ß')).toBe(true);
  });

  it('fails on different lengths or a different char', () => {
    expect(equalsIgnoreCase('charlie ', 'charlie')).toBe(false);
    expect(equalsIgnoreCase('charlie', 'charlid')).toBe(false);
  });
});
