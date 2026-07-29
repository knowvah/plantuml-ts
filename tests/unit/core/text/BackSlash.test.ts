/**
 * BackSlash.test.ts — T10b: unit coverage for `BackSlash`
 * (text/BackSlash.java): constants, `lineSeparator`, `hiddenNewLine`,
 * `translateBackSlashes`/`untranslateBackSlashes` round trip.
 */
import { describe, expect, it } from 'vitest';
import { BackSlash } from '../../../../src/core/text/BackSlash.js';

describe('BackSlash constants (java:44-48)', () => {
  it('BS_BS_N/NEWLINE/CHAR_NEWLINE match upstream literals', () => {
    expect(BackSlash.BS_BS_N).toBe('\\n');
    expect(BackSlash.NEWLINE).toBe('\n');
    expect(BackSlash.CHAR_NEWLINE).toBe('\n');
  });

  it('lineSeparator always returns "\\n" in this browser-only port', () => {
    expect(BackSlash.lineSeparator()).toBe('\n');
  });

  it('hiddenNewLine returns a single private-use-block sentinel character', () => {
    const c = BackSlash.hiddenNewLine();
    expect(c).toHaveLength(1);
    expect(c.codePointAt(0)).toBe(0xe100);
  });
});

describe('BackSlash.translateBackSlashes/untranslateBackSlashes round trip (java:59-95)', () => {
  it('translates a literal "\\n" escape into a private-use-block-shifted form', () => {
    const translated = BackSlash.translateBackSlashes('a\\nb');
    // The "n" is shifted into the private-use block, invisible as text but
    // round-trips back to the original literal escape.
    expect(translated).not.toBe('a\\nb');
    expect(BackSlash.untranslateBackSlashes(translated)).toBe('a\\nb');
  });

  it('leaves a real newline character untouched (only "\\" + "n" is translated)', () => {
    const s = 'a\nb';
    expect(BackSlash.translateBackSlashes(s)).toBe(s);
  });

  it('leaves a backslash followed by a non-"n" letter untouched (java:78-80: only "n" is recognized)', () => {
    const s = 'a\\tb';
    expect(BackSlash.translateBackSlashes(s)).toBe(s);
  });

  it('null in, null out for both directions (java:60-61,83-84)', () => {
    expect(BackSlash.translateBackSlashes(null)).toBeNull();
    expect(BackSlash.untranslateBackSlashes(null)).toBeNull();
  });

  it('untranslateBackSlashes leaves ordinary text untouched', () => {
    expect(BackSlash.untranslateBackSlashes('plain text')).toBe('plain text');
  });
});
