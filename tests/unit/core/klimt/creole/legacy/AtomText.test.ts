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
  layoutTabbedText,
  tabStopWidth,
} from '../../../../../../src/core/klimt/creole/legacy/AtomText.js';
import { DeterministicMeasurer } from '../../../../../../src/core/measurer-deterministic.js';

const FONT_SIZE = 14;
/** `getSize2D() * 4` at the default font size — the jar-probed advance. */
const TAB_STOP_AT_14 = FONT_SIZE * TAB_STOP_FONT_SIZE_FACTOR;

/** A measurer whose widths are trivially checkable: every character is 10
 *  units wide, spaces included. Used for the branch where `tabString()` DOES
 *  measure non-zero (the deterministic measurer now reaches it too, seam #4). */
const tenPerChar = (s: string): number => s.length * 10;

describe('the premise: the deterministic measurer gives spaces a width (seam #4)', () => {
  test('TAB_STRING measures 8 spaces (seam #4), so the fontSize*4 fallback does not fire', () => {
    // AtomText.java:270-274: getTabSize returns calculateDimension(tabString())
    // and falls back to getSize2D() * 4 only `if (width == 0)`. Under oracle
    // seam #4 (isw D1) U+0020 is 44 tenths, so 8 spaces = 8 * 4.4 * size / 16.
    const measurer = new DeterministicMeasurer();
    const font = { family: 'SansSerif', size: FONT_SIZE };
    expect(measurer.measure(' ', font).width).toBe(Math.fround((4.4 * FONT_SIZE) / 16));
    expect(measurer.measure(TAB_STRING, font).width).toBe(Math.fround((8 * 4.4 * FONT_SIZE) / 16));
    expect(measurer.measure(TAB_STRING, font).width).not.toBe(0);
  });

  test("TAB_STRING is upstream tabString()'s 8-space default", () => {
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

describe('layoutTabbedText (AtomText.java:210-256, drawU + getWidth)', () => {
  test('a tab-free run is one token at x 0, its own width', () => {
    expect(layoutTabbedText('abc', FONT_SIZE, tenPerChar)).toEqual({
      tokens: [{ text: 'abc', x: 0, width: 30 }],
      width: 30,
    });
  });

  test('an empty run draws nothing and is 0 wide', () => {
    expect(layoutTabbedText('', FONT_SIZE, tenPerChar)).toEqual({ tokens: [], width: 0 });
  });

  test('each tab advances to the next stop and draws nothing', () => {
    // tabString() at nb=8 measures 80 under tenPerChar, so the stop is 80.
    expect(layoutTabbedText('ab\tc\t\td', FONT_SIZE, tenPerChar)).toEqual({
      tokens: [
        { text: 'ab', x: 0, width: 20 },
        { text: 'c', x: 80, width: 10 },
        { text: 'd', x: 240, width: 10 },
      ],
      width: 250,
    });
  });

  test('a trailing tab still widens the run (getWidth is x after the walk)', () => {
    expect(layoutTabbedText('a\t', FONT_SIZE, tenPerChar)).toEqual({
      tokens: [{ text: 'a', x: 0, width: 10 }],
      width: 80,
    });
  });

  test('BLOCK_E1_REAL_TABULATION (%tab()) advances like a tab', () => {
    const layout = layoutTabbedText(`a${BLOCK_E1_REAL_TABULATION}b`, FONT_SIZE, tenPerChar);
    expect(layout.tokens).toEqual([
      { text: 'a', x: 0, width: 10 },
      { text: 'b', x: 80, width: 10 },
    ]);
  });

  test('nb in 1..6 shortens tabString (AtomText.java:258-264)', () => {
    expect(layoutTabbedText('a\tb', FONT_SIZE, tenPerChar, 4).tokens[1]).toEqual({ text: 'b', x: 40, width: 10 });
  });

  test('under the deterministic measurer the stop is tabString() = 8 spaces (28.6 at 13pt)', () => {
    // AtomText.java:270-274 (getTabSize): the measured width wins when non-zero.
    const measurer = new DeterministicMeasurer();
    const font = { family: 'SansSerif', size: 13 };
    const layout = layoutTabbedText('a\tb', 13, (s) => measurer.measure(s, font).width);
    expect(layout.tokens.map((t) => t.x)).toEqual([0, measurer.measure(TAB_STRING, font).width]);
    expect(layout.tokens[1]!.x).toBe(Math.fround(28.6));
  });
});
