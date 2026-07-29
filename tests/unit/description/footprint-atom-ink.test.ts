/**
 * T3-seams, ADR-2 -- `footprintBoxes`/`inlineFootprintBox`
 * (`leaf-sizing-text.ts`) already fit an SVG `<$sprite>` atom's use-case
 * footprint to its drawn-INK box (via `SpriteDimsLookup`'s own
 * `inkX/inkY/inkWidth/inkHeight`, not the declared `width`/`height`), when
 * the sprite registry reports ink. This is the EXISTING shape ADR-2 mirrors
 * onto `AtomImageResolver` (`creole-atoms.test`/`creole-img-render.test.ts`)
 * rather than inventing a second, parallel channel for the same fact -- see
 * this module's own doc comment on `inlineFootprintBox`.
 */
import { describe, it, expect } from 'vitest';
import { footprintBoxes } from '../../../src/diagrams/description/leaf-sizing-text.js';
import type { SpriteDimsLookup } from '../../../src/core/creole-atoms.js';
import type { FontSpec, StringMeasurer } from '../../../src/core/measurer.js';

/** Font size 13 keeps `spriteScale`'s `size/13` factor at exactly 1, so
 *  expected ink coordinates need no scaling arithmetic in the assertions. */
const fontSpec: FontSpec = { family: 'Helvetica', size: 13 };

const stubMeasurer: StringMeasurer = {
  measure: (text, f) => ({ width: text.length * 10, height: f.size }),
  getDescent: () => 0,
};

function spriteLookup(dims: Record<string, { width: number; height: number; inkX?: number; inkY?: number; inkWidth?: number; inkHeight?: number }>): SpriteDimsLookup {
  return { get: (name) => dims[name] };
}

describe('footprintBoxes -- sprite ink offset (T3-seams, ADR-2 shape to mirror)', () => {
  it('a sprite whose ink != declared box reports the INK box, not the declared box', () => {
    const sprites = spriteLookup({ foo: { width: 16, height: 16, inkX: 2, inkY: 3, inkWidth: 10, inkHeight: 8 } });
    const boxes = footprintBoxes('<$foo>', fontSpec, stubMeasurer, sprites, 16);
    expect(boxes).toHaveLength(1);
    expect(boxes[0]).toEqual({ x: 2, y: 3, width: 10, height: 8 });
  });

  it('a sprite registry entry with no ink fields falls back to the declared box -- today\'s behaviour', () => {
    const sprites = spriteLookup({ foo: { width: 16, height: 16 } });
    const boxes = footprintBoxes('<$foo>', fontSpec, stubMeasurer, sprites, 16);
    expect(boxes).toHaveLength(1);
    expect(boxes[0]).toEqual({ x: 0, y: 0, width: 16, height: 16 });
  });

  it('an unresolved sprite name contributes a zero-size box -- consistent with its zero measured width/height', () => {
    const sprites = spriteLookup({});
    const boxes = footprintBoxes('<$nope>', fontSpec, stubMeasurer, sprites, 16);
    expect(boxes).toHaveLength(1);
    expect(boxes[0]).toEqual({ x: 8, y: 0, width: 0, height: 0 });
  });

  it('a non-sprite (img) atom always inks its whole declared box -- no ink-offset source for it here', () => {
    const dataUri = 'data:image/png;base64,AAAA';
    const boxes = footprintBoxes(`<img:${dataUri}>`, fontSpec, stubMeasurer, undefined, 100);
    expect(boxes).toHaveLength(1);
    expect(boxes[0]!.width).toBeGreaterThan(0);
    // No ink concept applies to a non-sprite atom -- its box is exactly its
    // measured (declared) width/height, at whatever x/y the line placed it.
    expect(boxes[0]!.height).toBeGreaterThan(0);
  });
});
