/**
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/emoji/ColorResolver.java
 */
import { describe, expect, it } from 'vitest';
import { ColorResolver, colorResolverToSvgHex } from '../../../../../src/core/klimt/sprite/ColorResolver.js';
import type { GrayLevelRange } from '../../../../../src/core/klimt/sprite/ColorResolver.js';

const RED = { r: 255, g: 0, b: 0, a: 255 };
const BLUE = { r: 0, g: 0, b: 255, a: 255 };
const GRAY_MID = { r: 100, g: 100, b: 100, a: 255 };
const BLACK = { r: 0, g: 0, b: 0, a: 255 };
const WHITE = { r: 255, g: 255, b: 255, a: 255 };
const NONE = { r: 0, g: 0, b: 0, a: 0 };

function grayLevelRange(minGrayLevel: number, maxGrayLevel: number): GrayLevelRange {
  return { getMinGrayLevel: () => minGrayLevel, getMaxGrayLevel: () => maxGrayLevel };
}

describe('ColorResolver#getDefaultColor', () => {
  it('returns HColors.BLACK when neither fontColor nor forcedColor is set', () => {
    const resolver = new ColorResolver(undefined, undefined, grayLevelRange(0, 255));
    expect(resolver.getDefaultColor()).toEqual(BLACK);
  });

  it('returns fontColor when only fontColor is set', () => {
    const resolver = new ColorResolver(RED, undefined, grayLevelRange(0, 255));
    expect(resolver.getDefaultColor()).toEqual(RED);
  });

  it('returns forcedColor when only forcedColor is set', () => {
    const resolver = new ColorResolver(undefined, BLUE, grayLevelRange(0, 255));
    expect(resolver.getDefaultColor()).toEqual(BLUE);
  });

  it('prefers forcedColor over fontColor when both are set (acceptance criterion 1)', () => {
    const resolver = new ColorResolver(RED, BLUE, grayLevelRange(0, 255));
    expect(resolver.getDefaultColor()).toEqual(BLUE);
  });
});

describe('ColorResolver#getTrueColor', () => {
  it('resolves the literal "none" token to the fully-transparent sentinel', () => {
    const resolver = new ColorResolver(undefined, undefined, grayLevelRange(0, 255));
    expect(resolver.getTrueColor('none')).toEqual(NONE);
  });

  it('resolves "none" case-insensitively, matching equalsIgnoreCase', () => {
    const resolver = new ColorResolver(undefined, undefined, grayLevelRange(0, 255));
    expect(resolver.getTrueColor('NoNe')).toEqual(NONE);
  });

  it('resolves a plain hex code unchanged when no forcedColor is set', () => {
    const resolver = new ColorResolver(undefined, undefined, grayLevelRange(0, 255));
    expect(resolver.getTrueColor('#FF0000')).toEqual(RED);
  });

  it('resolves a registered named colour unchanged when no forcedColor is set', () => {
    const resolver = new ColorResolver(undefined, undefined, grayLevelRange(0, 255));
    expect(resolver.getTrueColor('Red')).toEqual(RED);
  });

  it('falls back to white for an unrecognised code (acceptance criterion 3: no throw)', () => {
    const resolver = new ColorResolver(undefined, undefined, grayLevelRange(0, 255));
    expect(() => resolver.getTrueColor('not-a-real-color')).not.toThrow();
    expect(resolver.getTrueColor('not-a-real-color')).toEqual(WHITE);
  });

  it('collapses to plain YIQ greyscale when forcedColor is itself gray', () => {
    const resolver = new ColorResolver(undefined, GRAY_MID, grayLevelRange(0, 255));
    // YIQ: trunc((255*299 + 0*587 + 0*114) / 1000) = 76
    expect(resolver.getTrueColor('#FF0000')).toEqual({ r: 76, g: 76, b: 76, a: 255 });
  });

  it('tints via the HSLuv grayToColor interpolation when forcedColor is non-gray (acceptance criterion 2)', () => {
    const resolver = new ColorResolver(undefined, BLUE, grayLevelRange(10, 200));
    // Independently computed from ColorUtils#grayToColor's exact arithmetic:
    // gray = YIQ(red) = 76; coef = (76 - 10) / 256 = 0.2578125;
    // HSLuv(blue) interpolated toward l=100 by coef, converted back to RGB.
    expect(resolver.getTrueColor('#FF0000')).toEqual({ r: 96, g: 96, b: 255, a: 255 });
  });

  it('ignores maxGrayLevel in the tinted branch, matching the Java signature that never reads it', () => {
    const lowMax = new ColorResolver(undefined, BLUE, grayLevelRange(10, 20));
    const highMax = new ColorResolver(undefined, BLUE, grayLevelRange(10, 250));
    expect(lowMax.getTrueColor('#FF0000')).toEqual(highMax.getTrueColor('#FF0000'));
  });

  it('produces a different tint for a different minGrayLevel (interpolation is live, not a constant)', () => {
    const resolver = new ColorResolver(undefined, BLUE, grayLevelRange(50, 200));
    const result = resolver.getTrueColor('#FF0000');
    expect(result).not.toEqual({ r: 96, g: 96, b: 255, a: 255 });
    expect(result.a).toBe(255);
  });
});

describe('colorResolverToSvgHex', () => {
  it('serializes a fully-opaque tuple to uppercase #RRGGBB', () => {
    expect(colorResolverToSvgHex(RED)).toBe('#FF0000');
  });

  it('serializes the fully-transparent sentinel to #00000000', () => {
    expect(colorResolverToSvgHex(NONE)).toBe('#00000000');
  });
});
