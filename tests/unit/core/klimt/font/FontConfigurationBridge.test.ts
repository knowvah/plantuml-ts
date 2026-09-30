import { describe, expect, it } from 'vitest';
import { FontConfiguration as StyleFontConfiguration } from '../../../../../src/core/abel/FontConfiguration.js';
import { HColorSet } from '../../../../../src/core/klimt/color/HColorSet.js';
import { HColors } from '../../../../../src/core/klimt/color/HColors.js';
import { bridgeFontConfiguration } from '../../../../../src/core/klimt/font/FontConfigurationBridge.js';
import { UFontFactory } from '../../../../../src/core/klimt/font/UFontFactory.js';
import { FontStyle } from '../../../../../src/core/klimt/shape/UText.js';
import { UStroke } from '../../../../../src/core/klimt/UStroke.js';

const BLUE = HColorSet.instance().getColor('blue');
const STROKE = UStroke.withThickness(1);

function fcOf(weight: number, italic: boolean, color: object = BLUE): StyleFontConfiguration {
  return StyleFontConfiguration.create(
    UFontFactory.build('Arial', { cssWeight: weight, italic }, 11),
    color,
    BLUE,
    STROKE,
  );
}

describe('bridgeFontConfiguration (FontConfiguration.java:57-80)', () => {
  it('carries family, size, face and the solid colour', () => {
    const fc = bridgeFontConfiguration(fcOf(400, false));
    expect(fc).toEqual({
      family: 'Arial',
      size: 11,
      color: '#0000FF',
      styles: new Set(),
      fontFace: { cssWeight: 400, italic: false },
    });
  });

  it('getStyles: BOLD from weight >= 700 (UFontFace.java:158-160), ITALIC from the face', () => {
    expect([...bridgeFontConfiguration(fcOf(700, false)).styles]).toEqual([FontStyle.BOLD]);
    expect([...bridgeFontConfiguration(fcOf(699, true)).styles]).toEqual([FontStyle.ITALIC]);
    expect([...bridgeFontConfiguration(fcOf(900, true)).styles]).toEqual([FontStyle.ITALIC, FontStyle.BOLD]);
  });

  it('a transparent colour is null (UText.ts stand-in for isTransparent)', () => {
    expect(bridgeFontConfiguration(fcOf(400, false, HColors.transparent())).color).toBeNull();
  });

  it('rejects a colour that is not an HColorSimple, and a font that is not a UFont', () => {
    expect(() => bridgeFontConfiguration(fcOf(400, false, {}))).toThrow('ClassCastException');
    const noUFont = StyleFontConfiguration.create({}, BLUE, BLUE, STROKE);
    expect(() => bridgeFontConfiguration(noUFont)).toThrow('ClassCastException');
  });
});
