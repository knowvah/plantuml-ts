/**
 * PragmaKey.test.ts — T10b: unit coverage for `PragmaKey`
 * (skin/PragmaKey.java): `pragmaKeyDefaultValue`, `pragmaKeyLazyFrom`'s
 * case/punctuation-insensitive matching.
 */
import { describe, expect, it } from 'vitest';
import { PragmaKey, pragmaKeyDefaultValue, pragmaKeyLazyFrom } from '../../../../src/core/skin/PragmaKey.js';

describe('pragmaKeyDefaultValue (java:80-82)', () => {
  it('SVEK_TRACE and TEOZ default to "true"', () => {
    expect(pragmaKeyDefaultValue(PragmaKey.SVEK_TRACE)).toBe('true');
    expect(pragmaKeyDefaultValue(PragmaKey.TEOZ)).toBe('true');
  });

  it('every other key defaults to null', () => {
    expect(pragmaKeyDefaultValue(PragmaKey.TEX_SYSTEM)).toBeNull();
    expect(pragmaKeyDefaultValue(PragmaKey.RATIO)).toBeNull();
  });
});

describe('pragmaKeyLazyFrom (java:85-100)', () => {
  it('matches exact member names', () => {
    expect(pragmaKeyLazyFrom('TEX_SYSTEM')).toBe(PragmaKey.TEX_SYSTEM);
  });

  it('is case-insensitive and ignores non-letter characters (underscores, digits)', () => {
    expect(pragmaKeyLazyFrom('tex_system')).toBe(PragmaKey.TEX_SYSTEM);
    expect(pragmaKeyLazyFrom('TexSystem')).toBe(PragmaKey.TEX_SYSTEM);
    expect(pragmaKeyLazyFrom('t-e-x-s-y-s-t-e-m')).toBe(PragmaKey.TEX_SYSTEM);
  });

  it('returns null for an unrecognized key', () => {
    expect(pragmaKeyLazyFrom('not_a_real_pragma_key')).toBeNull();
  });
});
