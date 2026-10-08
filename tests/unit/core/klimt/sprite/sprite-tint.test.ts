/**
 * unwind2-S7: `sprite-tint.ts` -- the gradient start `toUImage` takes from a
 * drawing context's back paint (`SpriteMonochrome.java:180-188,215-217`,
 * `HColorGradient.java:50-51`, `HColorSimple.java:132-134`).
 */
import { describe, expect, it } from 'vitest';
import {
  spriteBackColor,
  spriteHrefOver,
  spriteTintHref,
  type SpriteTint,
} from '../../../../../src/core/klimt/sprite/sprite-tint.js';
import { spriteToPngDataUri, type SpriteLike } from '../../../../../src/core/klimt/sprite/sprite-raster.js';

const NOTE_BACK = '#FEFFDD';
const SPRITE: SpriteLike = { width: 2, height: 1, grayLevels: 16, pixelAt: (x) => (x === 0 ? 0 : 15) };
const TINT: SpriteTint = { sprite: SPRITE, color: '#FF0000', scale: 1 };

describe('spriteBackColor', () => {
  it('passes a solid colour through', () => {
    expect(spriteBackColor(NOTE_BACK)).toBe(NOTE_BACK);
    expect(spriteBackColor('pink')).toBe('pink');
  });

  it("takes a gradient's first colour (HColorGradient.java:50-51)", () => {
    expect(spriteBackColor({ color1: '#FF0000', color2: '#00FF00', policy: '-' })).toBe('#FF0000');
  });

  it('maps no back, none and alpha-0 to the white default (SpriteMonochrome.java:181-182)', () => {
    expect(spriteBackColor(undefined)).toBeUndefined();
    expect(spriteBackColor('none')).toBeUndefined();
    expect(spriteBackColor('#FFFFFF00')).toBeUndefined();
  });

  it('keeps a translucent colour: only RGB reaches the gradient (HColorGradient.java:73-86)', () => {
    expect(spriteBackColor('#FF000080')).toBe('#FF000080');
  });
});

describe('spriteTintHref / spriteHrefOver', () => {
  it('rasterises over the back colour', () => {
    expect(spriteTintHref(TINT, NOTE_BACK)).toBe(spriteToPngDataUri(SPRITE, '#FF0000', NOTE_BACK, 1).dataUri);
    expect(spriteTintHref(TINT, undefined)).toBe(spriteToPngDataUri(SPRITE, '#FF0000', undefined, 1).dataUri);
  });

  it('re-tints only an atom that carries a tint', () => {
    expect(spriteHrefOver({ href: 'data:x', tint: TINT }, NOTE_BACK)).toBe(spriteTintHref(TINT, NOTE_BACK));
    expect(spriteHrefOver({ href: 'data:x' }, NOTE_BACK)).toBe('data:x');
  });
});
