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
});
