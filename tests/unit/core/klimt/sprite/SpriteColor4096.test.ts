import { describe, it, expect } from 'vitest';
import { SpriteColor4096 } from '../../../../../src/core/klimt/sprite/SpriteColor4096.js';
import { buildSpriteColor4096 } from '../../../../../src/core/klimt/sprite/SpriteColorBuilder4096.js';
import { spriteColor4096ToRgba, spriteColor4096ToPngDataUri } from '../../../../../src/core/klimt/sprite/sprite-raster.js';

describe('SpriteColor4096', () => {
  it('defaults every cell to 0 (opaque black), matching Java int[][] zero-init', () => {
    const sprite = new SpriteColor4096(2, 2);
    expect(sprite.getColor(0, 0)).toBe(0);
    expect(sprite.getColor(1, 1)).toBe(0);
  });

  it('setColor/getColor round-trips a packed RGB value', () => {
    const sprite = new SpriteColor4096(2, 2);
    sprite.setColor(1, 0, 0xff00cc);
    expect(sprite.getColor(1, 0)).toBe(0xff00cc);
    expect(sprite.getColor(0, 0)).toBe(0); // unaffected
  });

  it('setGray marks the cell -1 in getColor (the toUImage gray-fallback sentinel)', () => {
    const sprite = new SpriteColor4096(1, 1);
    sprite.setColor(0, 0, 0x123456);
    sprite.setGray(0, 0, 5);
    expect(sprite.getColor(0, 0)).toBe(-1);
    expect(sprite.getGray(0, 0)).toBe(5);
  });

  it('setColor/setGray silently no-op out of bounds (SpriteColor.java:67-90)', () => {
    const sprite = new SpriteColor4096(2, 2);
    expect(() => sprite.setColor(-1, 0, 0xff0000)).not.toThrow();
    expect(() => sprite.setColor(0, 5, 0xff0000)).not.toThrow();
    expect(() => sprite.setGray(5, 0, 3)).not.toThrow();
  });

  it('getColor/getGray throw for an out-of-bounds coordinate', () => {
    const sprite = new SpriteColor4096(2, 2);
    expect(() => sprite.getColor(-1, 0)).toThrow();
    expect(() => sprite.getColor(0, 2)).toThrow();
    expect(() => sprite.getGray(2, 0)).toThrow();
  });
});

// cdd-T26 residual round: malara-55-moce209's `sprite $demo [13x26/color]`
// body — the DECLARED `13x26` header is a mismatch with the real body
// shape (SpriteColorBuilder4096.java:51: width = row[0].length/2, height =
// row count) — verified against the fixture's own cached `.puml`.
describe('buildSpriteColor4096', () => {
  it('derives width/height from the BODY, ignoring the declared header dims', () => {
    // 3 rows, each 4 chars (2 pixels wide) -> width=2, height=3, NOT the
    // "13x26" a caller might have parsed from the header and discarded.
    const sprite = buildSpriteColor4096(['zwzw', 'zwzw', 'zwzw']);
    expect(sprite.width).toBe(2);
    expect(sprite.height).toBe(3);
  });

  it('decodes each 2-char cell via ColorPalette4096, "zw" -> 0xFFFFCC', () => {
    const sprite = buildSpriteColor4096(['zw']);
    expect(sprite.getColor(0, 0)).toBe(0xffffcc);
  });

  it('leaves a cell at its zero-initialized default when its row is shorter than the first row (SpriteColorBuilder4096.java:55-57)', () => {
    const sprite = buildSpriteColor4096(['zwzw', 'zw']);
    expect(sprite.getColor(0, 1)).toBe(0xffffcc); // present
    expect(sprite.getColor(1, 1)).toBe(0); // short row -- default, not decoded
  });

  it('leaves a cell at its default for an out-of-palette code rather than throwing', () => {
    const sprite = buildSpriteColor4096(['  ']);
    expect(sprite.getColor(0, 0)).toBe(0);
  });
});

describe('spriteColor4096ToRgba / spriteColor4096ToPngDataUri', () => {
  it('rasterizes every pixel fully opaque, passing the packed RGB through verbatim', () => {
    const sprite = buildSpriteColor4096(['zw..']);
    const { rgba, width, height } = spriteColor4096ToRgba(sprite);
    expect(width).toBe(2);
    expect(height).toBe(1);
    // Pixel 0: "zw" -> 0xFFFFCC.
    expect([rgba[0], rgba[1], rgba[2], rgba[3]]).toEqual([255, 255, 204, 255]);
    // Pixel 1: ".." -> 0x000000.
    expect([rgba[4], rgba[5], rgba[6], rgba[7]]).toEqual([0, 0, 0, 255]);
  });

  it('scales the returned display width/height without resampling the raster (matches spriteToPngDataUri\'s own contract)', () => {
    const sprite = buildSpriteColor4096(['zwzw', 'zwzw']); // 2x2
    const result = spriteColor4096ToPngDataUri(sprite, 1.5);
    expect(result.naturalWidth).toBe(2);
    expect(result.naturalHeight).toBe(2);
    expect(result.width).toBe(3);
    expect(result.height).toBe(3);
    expect(result.dataUri.startsWith('data:image/png;base64,')).toBe(true);
  });
});
