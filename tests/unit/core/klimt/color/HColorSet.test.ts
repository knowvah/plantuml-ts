import { describe, expect, it } from 'vitest';
import {
  HColorSet,
  parseSimpleColor,
  parseColor,
  toSvgHex,
  resolveColorToSvgHex,
} from '../../../../../src/core/klimt/color/HColorSet.js';
import { HColorSimple } from '../../../../../src/core/klimt/color/HColorSimple.js';
import { HColors } from '../../../../../src/core/klimt/color/HColors.js';
import { NoSuchColorException } from '../../../../../src/core/klimt/color/NoSuchColorException.js';

describe('parseSimpleColor', () => {
  it('parses the 1/3/6/8-hex-digit forms, with or without a leading #', () => {
    expect(parseSimpleColor('#F')).toEqual({ r: 255, g: 255, b: 255, a: 255 });
    expect(parseSimpleColor('F')).toEqual({ r: 255, g: 255, b: 255, a: 255 });
    expect(parseSimpleColor('#ABC')).toEqual({ r: 170, g: 187, b: 204, a: 255 });
    expect(parseSimpleColor('FF0000')).toEqual({ r: 255, g: 0, b: 0, a: 255 });
    expect(parseSimpleColor('#00FF0080')).toEqual({ r: 0, g: 255, b: 0, a: 128 });
  });

  it('resolves a named color case-insensitively, with or without a leading #', () => {
    expect(parseSimpleColor('aliceblue')).toEqual({ r: 0xf0, g: 0xf8, b: 0xff, a: 255 });
    expect(parseSimpleColor('#AliceBlue')).toEqual({ r: 0xf0, g: 0xf8, b: 0xff, a: 255 });
    expect(parseSimpleColor('RED')).toEqual({ r: 255, g: 0, b: 0, a: 255 });
  });

  it('falls through to named lookup when a 3/6-length token is NOT valid hex', () => {
    // "red" is 3 characters but not a valid hex triple ('r' is not a hex
    // nibble) -- upstream's if/else-if chain falls through to the named
    // trie rather than returning null (HColorSet.java:134-143,157).
    expect(parseSimpleColor('red')).toEqual({ r: 255, g: 0, b: 0, a: 255 });
    // "orange" is 6 characters, not valid hex ('o'/'r'/'n' aren't hex nibbles).
    expect(parseSimpleColor('orange')).toEqual({ r: 255, g: 165, b: 0, a: 255 });
  });

  it('returns undefined for invalid hex and unregistered names', () => {
    expect(parseSimpleColor('#G')).toBeUndefined();
    expect(parseSimpleColor('#GGG')).toBeUndefined();
    expect(parseSimpleColor('#GGGGGG')).toBeUndefined();
    expect(parseSimpleColor('#GGGGGGGG')).toBeUndefined();
    expect(parseSimpleColor('notacolor')).toBeUndefined();
  });

  it('returns undefined for an invalid-length token that is not a registered name', () => {
    expect(parseSimpleColor('#12')).toBeUndefined();
    expect(parseSimpleColor('a&b<c')).toBeUndefined();
  });

  it('returns undefined for "transparent"/"background" -- upstream\'s PRIVATE parseSimpleColor has no keyword check and ColorTrieNode has no such entry (T3h follow-up, HColorSet.java:122-157)', () => {
    expect(parseSimpleColor('transparent')).toBeUndefined();
    expect(parseSimpleColor('background')).toBeUndefined();
  });
});

describe('parseColor', () => {
  it('resolves "transparent"/"background" to the HColors.none() sentinel (alpha 0), case-insensitively, with or without a leading #', () => {
    // T3h follow-up: ported from the HEAD of the PUBLIC `parseColor`
    // (`HColorSet.java:78-92`), not `parseSimpleColor` -- java:79-80 strips
    // a leading `#` unconditionally BEFORE the java:82-83 keyword check, so
    // it fires for "#transparent" too. `HColors.none()` IS
    // `HColors.transparent()` (`HColors.java:129-135`, the one
    // `XColor(0,0,0,0)` singleton), which is why the resolved value is
    // alpha-0 black, not a distinct sentinel.
    expect(parseColor('transparent')).toEqual({ r: 0, g: 0, b: 0, a: 0 });
    expect(parseColor('TRANSPARENT')).toEqual({ r: 0, g: 0, b: 0, a: 0 });
    expect(parseColor('#Transparent')).toEqual({ r: 0, g: 0, b: 0, a: 0 });
    expect(parseColor('background')).toEqual({ r: 0, g: 0, b: 0, a: 0 });
    expect(parseColor('Background')).toEqual({ r: 0, g: 0, b: 0, a: 0 });
  });

  it('delegates to parseSimpleColor for anything that is not a "transparent"/"background" keyword', () => {
    expect(parseColor('#FF0000')).toEqual({ r: 255, g: 0, b: 0, a: 255 });
    expect(parseColor('red')).toEqual({ r: 255, g: 0, b: 0, a: 255 });
    expect(parseColor('notacolor')).toBeUndefined();
  });
});

describe('toSvgHex', () => {
  it('formats a fully-opaque color as uppercase #RRGGBB', () => {
    expect(toSvgHex({ r: 0xf0, g: 0xf8, b: 0xff, a: 255 })).toBe('#F0F8FF');
  });

  it('formats a fully-transparent color as the canonical #00000000, regardless of RGB', () => {
    expect(toSvgHex({ r: 0xff, g: 0, b: 0, a: 0 })).toBe('#00000000');
    expect(toSvgHex({ r: 0, g: 0, b: 0, a: 0 })).toBe('#00000000');
  });

  it('formats a partially-transparent color as uppercase #RRGGBBAA (alpha LAST)', () => {
    expect(toSvgHex({ r: 0x11, g: 0x22, b: 0x33, a: 0x80 })).toBe('#11223380');
  });
});

describe('resolveColorToSvgHex', () => {
  it('resolves a named color to its jar-verified canonical hex', () => {
    expect(resolveColorToSvgHex('aliceblue')).toBe('#F0F8FF');
    expect(resolveColorToSvgHex('blue')).toBe('#0000FF');
    expect(resolveColorToSvgHex('yellow')).toBe('#FFFF00');
    expect(resolveColorToSvgHex('gold')).toBe('#FFD700');
    expect(resolveColorToSvgHex('orange')).toBe('#FFA500');
    expect(resolveColorToSvgHex('grey')).toBe('#808080');
    expect(resolveColorToSvgHex('Aqua')).toBe('#00FFFF');
  });

  it('canonicalizes an already-hex value to uppercase, adding a leading # when absent', () => {
    // G1 I10: bare (no leading `#`) 6-hex-digit fills must still resolve to
    // the jar's `#`-prefixed uppercase form, not pass through verbatim.
    expect(resolveColorToSvgHex('0000ff')).toBe('#0000FF');
    expect(resolveColorToSvgHex('#c3d8f4')).toBe('#C3D8F4');
    expect(resolveColorToSvgHex('#FEFECE')).toBe('#FEFECE');
  });

  it('collapses "transparent"/"background" to the canonical #00000000, case-insensitively', () => {
    expect(resolveColorToSvgHex('transparent')).toBe('#00000000');
    expect(resolveColorToSvgHex('TRANSPARENT')).toBe('#00000000');
    expect(resolveColorToSvgHex('background')).toBe('#00000000');
  });

  it('leaves an unresolvable token unchanged (deferred-resolution design, no WHITE fallback)', () => {
    expect(resolveColorToSvgHex('url(#g0)')).toBe('url(#g0)');
    expect(resolveColorToSvgHex('none')).toBe('none');
    expect(resolveColorToSvgHex('a&b<c')).toBe('a&b<c');
  });
});

describe('HColorSet class (HColorSet.java:43-120)', () => {
  const set = HColorSet.instance();
  const simple = (s: string): HColorSimple => {
    const c = set.getColorOrWhite(s);
    if (!(c instanceof HColorSimple)) throw new Error(`not simple: ${s}`);
    return c;
  };

  it('instance() is a singleton', () => {
    expect(HColorSet.instance()).toBe(set);
  });

  it('getColorOrWhite: hex, names, a leading #; WHITE for an unknown token', () => {
    expect(simple('#181818').toString()).toBe('[r=24,g=24,b=24,a=255] α=255');
    expect(simple('lightGreen').toString()).toBe('[r=144,g=238,b=144,a=255] α=255');
    expect(set.getColorOrWhite('#8').asString()).toBe('#888888');
    expect(set.getColorOrWhite('nosuchcolour')).toBe(HColors.WHITE);
  });

  it('transparent / background (any case, # optional) are HColors.none()', () => {
    expect(set.getColorOrWhite('transparent')).toBe(HColors.none());
    expect(set.getColorOrWhite('#BackGround')).toBe(HColors.none());
  });

  it('getColorOrNull returns undefined for an unknown token', () => {
    expect(set.getColorOrNull('nosuchcolour')).toBeUndefined();
    expect(set.getColorOrNull('red')?.asString()).toBe('#FF0000');
  });

  it('getColor throws NoSuchColorException for an unknown token', () => {
    expect(() => set.getColor('nosuchcolour')).toThrow(NoSuchColorException);
    expect(() => set.getColor('nosuchcolour')).toThrow('NoSuchColorException');
    expect(set.getColor('blue').asString()).toBe('#0000FF');
  });

  it('the unported HColorAutomagic / HColorScheme results throw rather than resolve', () => {
    expect(() => set.getColorOrWhite('automatic')).toThrow('HColorAutomagic');
    expect(() => set.getColorOrWhite('#?red:blue')).toThrow('HColorScheme');
    expect(() => set.getColorOrWhite('#?red:blue:green')).toThrow('HColorScheme');
  });

  it('a c1<policy>c2 token is an HColorGradient (java:109-117), asString "?HColorGradient" (HColor.java:113-115)', () => {
    expect(set.getColorOrWhite('red-blue').asString()).toBe('?HColorGradient');
  });

  it('`?` with an unparsable 2-part scheme reads colors[2]: ArrayIndexOutOfBounds (java:88-94)', () => {
    expect(() => set.getColorOrWhite('?red:nosuch')).toThrow('ArrayIndexOutOfBoundsException');
  });

  it('`?` with an unparsable 3rd part falls through to the gradient scan and then null', () => {
    expect(set.getColorOrNull('?red:blue:nosuch')).toBeUndefined();
  });
});
