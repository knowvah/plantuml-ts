/**
 * AtomText.test.ts — the tab-stop advance ported from upstream
 * `klimt/creole/legacy/AtomText.java#getWidth`/`#getTabSize`.
 *
 * The numbers asserted below are the jar's own, not invented: under
 * `-DPLANTUML_DETERMINISTIC_TEXT=true` the SPACE glyph measures 0
 * (`WidthTableMeasurer`, asserted directly in the first test), so
 * `getTabSize` always takes its `getSize2D() * 4` fallback — 56px at the
 * default font size 14, which is the advance jar-probed for
 * `fariba-82-xolu802`.
 */
import { describe, expect, test } from 'vitest';
import {
  BLOCK_E1_REAL_TABULATION,
  TAB_STOP_FONT_SIZE_FACTOR,
  TAB_STRING,
  advanceToTabStop,
  atomTextStartingAltitude,
  atomTextWidth,
  hasTabulation,
  tabStopWidth,
} from '../../../../../../src/core/klimt/creole/legacy/AtomText.js';
import { WidthTableMeasurer } from '../../../../../../src/core/measurer.js';

const FONT_SIZE = 14;
/** `getSize2D() * 4` at the default font size — the jar-probed advance. */
const TAB_STOP_AT_14 = FONT_SIZE * TAB_STOP_FONT_SIZE_FACTOR;

/** A measurer whose widths are trivially checkable: every character is 10
 *  units wide, spaces included. Used for the branch where `tabString()` DOES
 *  measure non-zero, which the deterministic width table never reaches. */
const tenPerChar = (s: string): number => s.length * 10;

describe('the premise: the deterministic width table measures spaces at zero', () => {
  test('TAB_STRING measures 0, which is what forces the fontSize*4 fallback', () => {
    const measurer = new WidthTableMeasurer();
    const font = { family: 'SansSerif', size: FONT_SIZE };
    expect(measurer.measure(' ', font).width).toBe(0);
    expect(measurer.measure(TAB_STRING, font).width).toBe(0);
    // A non-space glyph is NOT zero — the zero is specific to the space.
    expect(measurer.measure('a', font).width).toBeGreaterThan(0);
  });

  test('TAB_STRING is upstream tabString()\'s 8-space default', () => {
    expect(TAB_STRING).toBe('        ');
    expect(TAB_STRING).toHaveLength(8);
  });
});

describe('hasTabulation', () => {
  test('is false for text with no tabulation', () => {
    expect(hasTabulation('')).toBe(false);
    expect(hasTabulation('"sts:AssumeRole"')).toBe(false);
    expect(hasTabulation('    leading spaces are not tabs')).toBe(false);
  });

  test('is true for a real tab, wherever it sits', () => {
    expect(hasTabulation('\t')).toBe(true);
    expect(hasTabulation('\tlead')).toBe(true);
    expect(hasTabulation('mid\tdle')).toBe(true);
    expect(hasTabulation('trail\t')).toBe(true);
  });

  test('is true for the Jaws BLOCK_E1_REAL_TABULATION sentinel', () => {
    expect(BLOCK_E1_REAL_TABULATION).toBe('\u{E111}');
    expect(hasTabulation(`a${BLOCK_E1_REAL_TABULATION}b`)).toBe(true);
  });
});

describe('tabStopWidth — upstream getTabSize', () => {
  test('falls back to fontSize * 4 when the tab string measures zero', () => {
    expect(tabStopWidth(0, FONT_SIZE)).toBe(56);
    expect(tabStopWidth(0, 12)).toBe(48);
    expect(tabStopWidth(0, 20)).toBe(80);
  });

  test('uses the measured tab-string width when it is non-zero', () => {
    expect(tabStopWidth(37.5, FONT_SIZE)).toBe(37.5);
  });
});

describe('advanceToTabStop — upstream x += tabSize - (x % tabSize)', () => {
  test('advances a mid-stop position to the next stop', () => {
    expect(advanceToTabStop(10, 56)).toBe(56);
    expect(advanceToTabStop(55.5, 56)).toBe(56);
    expect(advanceToTabStop(60, 56)).toBe(112);
  });

  test('advances a FULL stop from a position already on a boundary', () => {
    // remainder 0 => x += tabSize - 0, never zero. This is the case a naive
    // "round up to the next multiple" implementation gets wrong.
    expect(advanceToTabStop(0, 56)).toBe(56);
    expect(advanceToTabStop(56, 56)).toBe(112);
    expect(advanceToTabStop(112, 56)).toBe(168);
  });

  test('scales with the stop width', () => {
    expect(advanceToTabStop(0, 48)).toBe(48);
    expect(advanceToTabStop(50, 48)).toBe(96);
  });
});

describe('atomTextWidth', () => {
  test('short-circuits a tab-free run to a single plain measurement', () => {
    const seen: string[] = [];
    const measure = (s: string): number => {
      seen.push(s);
      return tenPerChar(s);
    };
    expect(atomTextWidth('abcd', FONT_SIZE, measure)).toBe(40);
    // Exactly one call, with the whole run — the property that makes wiring
    // this in a zero-diff change for every tab-free text atom.
    expect(seen).toEqual(['abcd']);
  });

  test('measures an empty run as zero without consulting a tab stop', () => {
    expect(atomTextWidth('', FONT_SIZE, () => 0)).toBe(0);
  });

  test('two leading tabs advance two full stops, then the text is added', () => {
    // `fariba-82-xolu802`'s own body line, at the width table's numbers:
    // "sts:AssumeRole" quoted measures 111.125 at size 14.
    const measure = (s: string): number => (s === TAB_STRING ? 0 : s === '"sts:AssumeRole"' ? 111.125 : 0);
    expect(atomTextWidth('\t\t"sts:AssumeRole"', FONT_SIZE, measure)).toBe(2 * TAB_STOP_AT_14 + 111.125);
    expect(2 * TAB_STOP_AT_14).toBe(112);
  });

  test('a mid-run tab advances from the accumulated x, not from zero', () => {
    // "abc" = 30 under tenPerChar, so the tab advances 30 -> 56, then "de".
    const measure = (s: string): number => (s === TAB_STRING ? 0 : tenPerChar(s));
    expect(atomTextWidth('abc\tde', FONT_SIZE, measure)).toBe(TAB_STOP_AT_14 + 20);
  });

  test('a tab landing exactly on a stop boundary still advances a full stop', () => {
    // A 56-wide prefix puts x exactly on the stop; the tab must push to 112.
    const measure = (s: string): number => (s === TAB_STRING ? 0 : s === 'wide' ? 56 : 4);
    expect(atomTextWidth('wide\tx', FONT_SIZE, measure)).toBe(112 + 4);
  });

  test('a trailing tab contributes its own advance', () => {
    const measure = (s: string): number => (s === TAB_STRING ? 0 : tenPerChar(s));
    expect(atomTextWidth('ab\t', FONT_SIZE, measure)).toBe(TAB_STOP_AT_14);
  });

  test('the Jaws sentinel advances identically to a real tab', () => {
    const measure = (s: string): number => (s === TAB_STRING ? 0 : tenPerChar(s));
    expect(atomTextWidth(`${BLOCK_E1_REAL_TABULATION}ab`, FONT_SIZE, measure)).toBe(TAB_STOP_AT_14 + 20);
  });

  test('honours a non-zero measured tab string instead of the fallback', () => {
    // tenPerChar measures TAB_STRING (8 spaces) at 80, so the stop is 80 —
    // NOT fontSize*4. Guards the getTabSize branch the width table never hits.
    expect(atomTextWidth('\tab', FONT_SIZE, tenPerChar)).toBe(80 + 20);
  });

  test('is independent of skinparam tabSize — there is no such parameter', () => {
    // atomTextWidth's whole signature is (text, fontSize, measure); the only
    // lever on the stop is the FONT SIZE, exactly as upstream's
    // Style#getFontConfiguration hardcodes tabSize=8 on this path.
    expect(atomTextWidth.length).toBe(3);
    const measure = (s: string): number => (s === TAB_STRING ? 0 : 0);
    expect(atomTextWidth('\t', 12, measure)).toBe(48);
    expect(atomTextWidth('\t', 20, measure)).toBe(80);
  });
});

/**
 * SI30 T1 — `AtomText#getStartingAltitude(StringBounder)` (java:321-323) is
 * a straight `return fontConfiguration.getSpace()`. It is the ONLY place the
 * raise/lower is applied: `drawU`'s own `getSpace()` line is commented out
 * upstream (java:212), so the altitude reaches the page through `Sea`
 * (decisions.md#D2).
 */
describe('atomTextStartingAltitude (AtomText.java:321-323)', () => {
  const base = { family: 'sans-serif', size: 14, color: '#000000', styles: new Set<never>() };

  test('a run with no fontPosition sits on the normal baseline', () => {
    expect(atomTextStartingAltitude(base)).toBe(0);
  });

  test('an EXPOSANT run is raised 6 (FontPosition.java:42-43)', () => {
    expect(atomTextStartingAltitude({ ...base, fontPosition: 'EXPOSANT' })).toBe(-6);
  });

  test('an INDICE run is lowered 3 (FontPosition.java:45-46)', () => {
    expect(atomTextStartingAltitude({ ...base, fontPosition: 'INDICE' })).toBe(3);
  });

  test('the altitude is independent of the run size (no scaling upstream)', () => {
    expect(atomTextStartingAltitude({ ...base, size: 40, fontPosition: 'EXPOSANT' })).toBe(-6);
  });
});
