/**
 * Unit tests for `core/color-override.ts#resolveBareOrBackColor` — the
 * shared `Classifier.color`/`ClassNote.color`/`State.color`
 * background-override extraction (moved from `class/class-color-
 * override.ts` at T4, SI27; no prior colocated test existed for this
 * module, so this file is new rather than moved).
 */
import { describe, it, expect } from 'vitest';
import { resolveBareOrBackColor } from '../../../src/core/color-override.js';

describe('resolveBareOrBackColor', () => {
  it('returns undefined for an undefined color (no override present)', () => {
    expect(resolveBareOrBackColor(undefined)).toBeUndefined();
  });

  // Colors.java:100-103 -- a token with no `:` and no `.` is put directly
  // under `mainType` (ColorType.BACK for `simpleColor(ColorType.BACK)`).
  it('a bare `#colorname` token IS the background', () => {
    expect(resolveBareOrBackColor('#f00')).toBe('#f00');
  });

  // Colors.java:105-115 -- a `name:value` token is keyed by
  // `ColorType.getType(name)`; only a `back:` name lands under BACK.
  it('a compound token extracts the explicit `back:` component', () => {
    expect(resolveBareOrBackColor('#back:blue;text:red')).toBe('blue');
  });

  it('a single-part compound `#back:color` (no trailing `;`) still extracts', () => {
    expect(resolveBareOrBackColor('#back:blue')).toBe('blue');
  });

  it('a compound token with no `back:` part returns undefined', () => {
    expect(resolveBareOrBackColor('#text:red;line:blue')).toBeUndefined();
  });

  it('a compound token with only `shadowing` returns undefined', () => {
    expect(resolveBareOrBackColor('#shadowing:true')).toBeUndefined();
  });

  // CommandCreateClassMultilines.java:115-118 -- `color().getRegex()`
  // (the COLOR group) and the `##[style]color` LINECOLOR group are
  // SEPARATE captures in the grammar; a `geo.color`/`node.color` string
  // that is `##red` ALONE (no space-joined COLOR half) never reaches
  // `ColorParser`/`Colors` as background input at all upstream, so this
  // function's `startsWith('##')` guard mirrors that grammar-level
  // exclusion rather than special-casing `##` inside `Colors.java` itself.
  it('a LINECOLOR-only token (`##red`, no COLOR half) carries no background', () => {
    expect(resolveBareOrBackColor('##red')).toBeUndefined();
  });

  it('only the first space-joined token (the COLOR half) is consulted', () => {
    expect(resolveBareOrBackColor('#f00 ##00f')).toBe('#f00');
  });

  // CDD T6FU -- `Colors.java:97-104`'s tokenizer walks EVERY `;`-separated
  // token, not just the ones introduced by a keyword: a token with no `:`
  // lands under `mainType` (BACK) whatever its position, as long as it
  // contains no `.`.
  describe('compound specs with a bare leading token (Colors.java:97-104)', () => {
    it('extracts the bare leading token of a compound spec as the background', () => {
      // gojatu-01-jibo986: `class class #yellow;line:red;line.bold;text:red`
      expect(resolveBareOrBackColor('#yellow;line:red;text:red')).toBe('#yellow');
      expect(resolveBareOrBackColor('#yellow;line:red;line.bold;text:red')).toBe('#yellow');
      // mexaka-52-gati860: `class bar2 #lightblue;text:red;line:green`
      expect(resolveBareOrBackColor('#lightblue;text:red;line:green')).toBe('#lightblue');
    });

    it('a bare token anywhere in the spec is the background', () => {
      expect(resolveBareOrBackColor('#text:red;yellow')).toBe('yellow');
    });

    // `if (s.contains(".") == false)` (Colors.java:101) -- a dotted token is
    // a LINE STYLE (`line.bold`/`.dashed`/`.dotted`, read separately at
    // java:117-122), never a colour.
    it('a keyword-only `#line.bold` spec carries no background', () => {
      // mexaka-52-gati860: `class FooBold #line.bold` rendered the literal
      // string `#line.bold` as an SVG fill before this fix.
      expect(resolveBareOrBackColor('#line.bold')).toBeUndefined();
      expect(resolveBareOrBackColor('#line.dashed')).toBeUndefined();
      expect(resolveBareOrBackColor('#line.dotted')).toBeUndefined();
    });

    it('a dotted line-style token does not suppress a bare colour beside it', () => {
      expect(resolveBareOrBackColor('#line.bold;yellow')).toBe('yellow');
    });

    // `map.put` -- one key, so the LAST token to claim BACK wins.
    it('the last token claiming BACK wins', () => {
      expect(resolveBareOrBackColor('#yellow;back:blue')).toBe('blue');
      expect(resolveBareOrBackColor('#back:blue;yellow')).toBe('yellow');
    });

    // `StringTokenizer` never yields an empty token.
    it('empty `;` tokens are skipped', () => {
      expect(resolveBareOrBackColor('#;back:blue;')).toBe('blue');
      expect(resolveBareOrBackColor('#')).toBeUndefined();
    });

    it('a typed `line.dashed:blue` name is not BACK', () => {
      // mexaka-52-gati860: `class FooDashed #line.dashed:blue`.
      expect(resolveBareOrBackColor('#line.dashed:blue')).toBeUndefined();
    });
  });
});
