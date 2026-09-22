import { describe, it, expect } from 'vitest';
import { colorForCode4096 } from '../../../../../src/core/klimt/sprite/ColorPalette4096.js';

// cdd-T26 residual round (malara-55-moce209's `sprite $demo [.../color]`):
// ColorPalette4096.java:46-113's 64-char alphabet ('.','
// ,$%&*+-:;<=>?@^_~' then 'G'-'Z' then 'a'-'z') maps a 2-char code to a
// 12-bit-packed RGB via `code = v1*64 + v2`, unpacked base-16
// (`blue=code%16, green=(code/16)%16, red=(code/256)%16`), each nibble
// `dup()`-expanded to 8 bits (`v*16+v`). Hand-traced against the ported
// alphabet string itself (not fit to an observed pixel):
// 'z' is alphabet index 63 (last char), 'w' is index 60 -- both from
// malara's own sprite body's dominant background code "zw".
describe('colorForCode4096', () => {
  it('decodes "zw" (malara-55-moce209 background code) to RGB(255,255,204)', () => {
    // code = 63*64 + 60 = 4092; blue = 4092%16 = 12 -> dup(12) = 204;
    // green = (4092/16)%16 = 255%16 = 15 -> dup(15) = 255;
    // red = (4092/256)%16 = 15%16 = 15 -> dup(15) = 255.
    expect(colorForCode4096('zw')).toEqual({ r: 255, g: 255, b: 204 });
  });

  it('decodes the alphabet\'s first two characters ("..") to RGB(0,0,0)', () => {
    // v1 = v2 = 0 -> code = 0 -> every channel nibble is 0 -> dup(0) = 0.
    expect(colorForCode4096('..')).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('applies the `!`->`.`/`#`->`,` migration alias (ColorPalette4096.java:84-85)', () => {
    expect(colorForCode4096('!!')).toEqual(colorForCode4096('..'));
    expect(colorForCode4096('##')).toEqual(colorForCode4096(',,'));
  });

  it('returns undefined for a code outside the palette alphabet', () => {
    expect(colorForCode4096('  ')).toBeUndefined();
    expect(colorForCode4096('()')).toBeUndefined();
  });

  it('returns undefined for a code that is not exactly 2 characters', () => {
    expect(colorForCode4096('z')).toBeUndefined();
    expect(colorForCode4096('zww')).toBeUndefined();
    expect(colorForCode4096('')).toBeUndefined();
  });

  it('dup() expands each 4-bit nibble by duplication, not a left shift (0xF -> 0xFF, not 0xF0)', () => {
    // 'z','z' -> v1=v2=63 -> code=63*64+63=4095 (0xFFF) -> every nibble
    // 15 -> every channel dup(15)=255, matching 0xFFFFFF exactly (a
    // left-shift-only expansion would instead give 0xF0F0F0).
    expect(colorForCode4096('zz')).toEqual({ r: 255, g: 255, b: 255 });
  });
});
