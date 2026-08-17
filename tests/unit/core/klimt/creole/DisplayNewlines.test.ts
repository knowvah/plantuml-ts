/**
 * DisplayNewlines.test.ts — T9c: unit coverage for `DisplayNewlines.ts`
 * (`Display#getWithNewlines`'s escape-sequence scanner, `getWithNewlines3`,
 * `hasSeveralGuideLines`), exercised both directly and through
 * `Display.getWithNewlines`.
 */
import { describe, expect, it } from 'vitest';
import { Display } from '../../../../../src/core/klimt/creole/Display.js';
import { getWithNewlines3, jawsWarningToWarning, JawsWarning, splitDisplayLines } from '../../../../../src/core/klimt/creole/DisplayNewlines.js';
import { HorizontalAlignment } from '../../../../../src/core/klimt/geom/HorizontalAlignment.js';
import { Pragma } from '../../../../../src/core/skin/Pragma.js';
import { PragmaKey } from '../../../../../src/core/skin/PragmaKey.js';
import { BackSlash } from '../../../../../src/core/text/BackSlash.js';

const BLOCK_E1_NEWLINE_LEFT_ALIGN = '';
const BLOCK_E1_NEWLINE_RIGHT_ALIGN = '';
const BLOCK_E1_BREAKLINE = '';
const BLOCK_E1_REAL_BACKSLASH = '';
const BLOCK_E1_REAL_TABULATION = '';
const BLOCK_E1_INVISIBLE_QUOTE = '';

describe('Display.getWithNewlines -- backslash escape scanning (java:262-346)', () => {
  it('null input returns Display.NULL', () => {
    expect(Display.getWithNewlines(Pragma.createEmpty(), null)).toBe(Display.NULL);
  });

  it('\\n splits into multiple lines', () => {
    const d = Display.getWithNewlines(Pragma.createEmpty(), 'a\\nb\\nc');
    expect(d.asList()).toEqual(['a', 'b', 'c']);
  });

  it('\\t inserts a real tab character', () => {
    const d = Display.getWithNewlines(Pragma.createEmpty(), 'a\\tb');
    expect(d.asList()).toEqual(['a\tb']);
  });

  it('\\\\ inserts a literal backslash', () => {
    const d = Display.getWithNewlines(Pragma.createEmpty(), 'a\\\\b');
    expect(d.asList()).toEqual(['a\\b']);
  });

  it('\\r sets naturalHorizontalAlignment to RIGHT and splits the line', () => {
    const d = Display.getWithNewlines(Pragma.createEmpty(), 'a\\rb');
    expect(d.getNaturalHorizontalAlignment()).toBe(HorizontalAlignment.RIGHT);
    expect(d.asList()).toEqual(['a', 'b']);
  });

  it('\\l sets naturalHorizontalAlignment to LEFT and splits the line', () => {
    const d = Display.getWithNewlines(Pragma.createEmpty(), 'a\\lb');
    expect(d.getNaturalHorizontalAlignment()).toBe(HorizontalAlignment.LEFT);
    expect(d.asList()).toEqual(['a', 'b']);
  });

  it('an unrecognized backslash-letter pair is appended verbatim (both characters)', () => {
    const d = Display.getWithNewlines(Pragma.createEmpty(), 'a\\xb');
    expect(d.asList()).toEqual(['a\\xb']);
  });

  it('<math>/<latex>/[[ ]] spans suppress newline-splitting ("raw mode")', () => {
    const d = Display.getWithNewlines(Pragma.createEmpty(), '<math>a\\nb</math>');
    expect(d.asList()).toEqual(['<math>a\\nb</math>']);
  });

  it('emits a Warning when SHOW_DEPRECATION is true, none when false (default)', () => {
    const quiet = Pragma.createEmpty();
    Display.getWithNewlines(quiet, 'a\\nb');
    expect(quiet.getWarnings()).toHaveLength(0);

    const loud = Pragma.createEmpty();
    loud.define(PragmaKey.SHOW_DEPRECATION, 'true');
    Display.getWithNewlines(loud, 'a\\nb');
    expect(loud.getWarnings().length).toBeGreaterThan(0);
  });

  it('Display.getWithNewlines(quark) forwards quark.getName() through an empty Pragma', () => {
    const d = Display.getWithNewlines({ getName: () => 'a\\nb' });
    expect(d.asList()).toEqual(['a', 'b']);
  });

  it('Display.getWithNewlines2 is a plain forward (no color-check side effect)', () => {
    const d = Display.getWithNewlines2(Pragma.createEmpty(), 'x\\ny');
    expect(d.asList()).toEqual(['x', 'y']);
  });
});

describe('Display.getWithNewlines -- BLOCK_E1_* sentinel characters (java:315-339, jaws/Jaws.java:47-57)', () => {
  it('BLOCK_E1_NEWLINE_LEFT_ALIGN (U+E101) sets LEFT alignment and splits', () => {
    const d = Display.getWithNewlines(Pragma.createEmpty(), `a${BLOCK_E1_NEWLINE_LEFT_ALIGN}b`);
    expect(d.getNaturalHorizontalAlignment()).toBe(HorizontalAlignment.LEFT);
    expect(d.asList()).toEqual(['a', 'b']);
  });

  it('BLOCK_E1_NEWLINE_RIGHT_ALIGN (U+E102) sets RIGHT alignment and splits', () => {
    const d = Display.getWithNewlines(Pragma.createEmpty(), `a${BLOCK_E1_NEWLINE_RIGHT_ALIGN}b`);
    expect(d.getNaturalHorizontalAlignment()).toBe(HorizontalAlignment.RIGHT);
    expect(d.asList()).toEqual(['a', 'b']);
  });

  it('BLOCK_E1_BREAKLINE (U+E103) splits without setting alignment', () => {
    const d = Display.getWithNewlines(Pragma.createEmpty(), `a${BLOCK_E1_BREAKLINE}b`);
    expect(d.getNaturalHorizontalAlignment()).toBeNull();
    expect(d.asList()).toEqual(['a', 'b']);
  });

  it('BLOCK_E1_REAL_TABULATION (U+E111) appends the sentinel verbatim, NOT a real tab (java:316-317)', () => {
    const d = Display.getWithNewlines(Pragma.createEmpty(), `a${BLOCK_E1_REAL_TABULATION}b`);
    expect(d.asList()).toEqual([`a${BLOCK_E1_REAL_TABULATION}b`]);
  });

  it('BLOCK_E1_REAL_BACKSLASH (U+E110) appends a literal backslash', () => {
    const d = Display.getWithNewlines(Pragma.createEmpty(), `a${BLOCK_E1_REAL_BACKSLASH}b`);
    expect(d.asList()).toEqual(['a\\b']);
  });

  it('BLOCK_E1_INVISIBLE_QUOTE (U+E121) is dropped entirely, nothing appended', () => {
    const d = Display.getWithNewlines(Pragma.createEmpty(), `a${BLOCK_E1_INVISIBLE_QUOTE}b`);
    expect(d.asList()).toEqual(['ab']);
  });

  it('BackSlash.hiddenNewLine() (U+E100) splits the line when not in raw mode', () => {
    const d = Display.getWithNewlines(Pragma.createEmpty(), `a${BackSlash.hiddenNewLine()}b`);
    expect(d.asList()).toEqual(['a', 'b']);
  });

  it('BackSlash.hiddenNewLine() is suppressed inside a <math> raw-mode span', () => {
    const raw = `<math>a${BackSlash.hiddenNewLine()}b</math>`;
    const d = Display.getWithNewlines(Pragma.createEmpty(), raw);
    expect(d.asList()).toEqual([raw]);
  });
});

describe('Display.getWithNewlines3 -- the simpler pragma-free scanner (java:233-258)', () => {
  it('null in, null out', () => {
    expect(Display.getWithNewlines3(null)).toBeNull();
    expect(getWithNewlines3(null)).toBeNull();
  });

  it('splits on \\n, expands \\t, unescapes \\\\', () => {
    expect(Display.getWithNewlines3('a\\nb\\tc\\\\d')).toEqual(['a', 'b\tc\\d']);
  });

  it('an unrecognized c2 (e.g. "r") is silently dropped -- neither branch appends it (java:244-251, verbatim)', () => {
    expect(Display.getWithNewlines3('a\\rb')).toEqual(['ab']);
  });
});

/**
 * T1 (mission `shared-seam-extraction`): migrated verbatim from
 * `tests/unit/class/class-layout-helpers.test.ts`'s former
 * `splitEdgeLabelLines` describe block (`class-edge-label-lines.ts`,
 * retired) -- every assertion is unchanged, only the function under test
 * is now the ONE shared adapter. Jar citations preserved from the
 * original: `sicile-99-pefa679`'s own 3-line `\n` label
 * (`cl1 -- cl2 : this is\non several\nlines`).
 */
describe('splitDisplayLines (G2 item 43 / T1 shared adapter)', () => {
  it('returns a single line with center alignment when no escape is present', () => {
    expect(splitDisplayLines('demo')).toEqual({ lines: ['demo'], align: 'center' });
  });

  it('splits on \\n with no alignment change (default CENTER)', () => {
    expect(splitDisplayLines('this is\\non several\\nlines')).toEqual({
      lines: ['this is', 'on several', 'lines'],
      align: 'center',
    });
  });

  it('splits on \\l and sets alignment to left', () => {
    expect(splitDisplayLines('this is\\lon several\\llines')).toEqual({
      lines: ['this is', 'on several', 'lines'],
      align: 'left',
    });
  });

  it('splits on \\r and sets alignment to right', () => {
    expect(splitDisplayLines('this is\\ron several\\rlines')).toEqual({
      lines: ['this is', 'on several', 'lines'],
      align: 'right',
    });
  });

  it('the LAST \\l/\\r occurrence wins, matching jar\'s overwritten field', () => {
    expect(splitDisplayLines('a\\rb\\lc')).toEqual({ lines: ['a', 'b', 'c'], align: 'left' });
  });

  it('\\t becomes a literal tab within the current line', () => {
    expect(splitDisplayLines('a\\tb')).toEqual({ lines: ['a\tb'], align: 'center' });
  });

  it('\\\\ becomes a literal backslash', () => {
    expect(splitDisplayLines('a\\\\b')).toEqual({ lines: ['a\\b'], align: 'center' });
  });

  it('an unrecognized \\x pair is kept as-is (both characters)', () => {
    expect(splitDisplayLines('a\\zb')).toEqual({ lines: ['a\\zb'], align: 'center' });
  });

  it('a trailing lone backslash is kept as-is', () => {
    expect(splitDisplayLines('abc\\')).toEqual({ lines: ['abc\\'], align: 'center' });
  });

  // T1: unlike the retired `core/edge-label-box.ts#splitCreoleLines`, a REAL
  // newline character is NOT a break -- matches Java exactly
  // (`Display.java:262-346` only breaks on the literal two-char `\n` token
  // or a BLOCK_E1 sentinel; a raw `\n` char falls through to the default
  // `current.append(c)` branch, same as any other plain character).
  it('a real newline character is NOT a line break (unlike the retired splitCreoleLines)', () => {
    expect(splitDisplayLines('a\nb')).toEqual({ lines: ['a\nb'], align: 'center' });
  });
});

describe('jawsWarningToWarning (warning/JawsWarning.java)', () => {
  it('produces the expected two-line deprecation message per kind', () => {
    const w = jawsWarningToWarning(JawsWarning.BACKSLASH_RIGHT);
    expect(w.getMessage()).toEqual([
      'This diagram is using \\r which is deprecated and will be removed in the future.',
      'You should use %right_align() instead in your diagram.',
    ]);
  });
});
