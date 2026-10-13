/**
 * `AbstractElement` (AbstractElement.java:45-89): the salt palette, each a
 * light colour with its `@media dark` partner, `blackBlueTrue`, `getPragma`.
 *
 * Jar cross-check: `vizono-80-vipa581/in.svg` (cached oracle) fills its
 * buttons `#EEE` (`getColorEE`, ElementButton.java:69) and strokes in `#000`
 * (`getBlack`).
 */
import { describe, expect, it } from 'vitest';
import type { HColorSimple } from '../../../../src/core/klimt/color/HColorSimple.js';
import type { StringBounder } from '../../../../src/core/klimt/font/StringBounder.js';
import type { UFont } from '../../../../src/core/klimt/font/UFont.js';
import { XDimension2D } from '../../../../src/core/klimt/geom/XDimension2D.js';
import { FontStyle } from '../../../../src/core/klimt/shape/UText.js';
import type { UGraphic } from '../../../../src/core/klimt/UGraphic.js';
import { AbstractElement } from '../../../../src/diagrams/salt/element/AbstractElement.js';
import { FONT_12 } from '../salt-test-support.js';
import { FontStack } from '../../../../src/core/klimt/font/FontStack.js';
import { UFontFactory } from '../../../../src/core/klimt/font/UFontFactory.js';
import { PragmaKey } from '../../../../src/core/skin/PragmaKey.js';

/** Exposes the protected members; draws nothing. */
class Probe extends AbstractElement {
  getPreferredDimension(_stringBounder: StringBounder, _x: number, _y: number): XDimension2D {
    return new XDimension2D(0, 0);
  }

  drawU(_ug: UGraphic, _zIndex: number, _dimToUse: XDimension2D): void {}

  palette(): Record<string, HColorSimple> {
    return {
      black: this.getBlack(),
      color88: this.getColor88(),
      colorAA: this.getColorAA(),
      colorBB: this.getColorBB(),
      colorDD: this.getColorDD(),
      colorEE: this.getColorEE(),
      white: this.getWhite(),
    };
  }

  font(font: UFont): ReturnType<AbstractElement['blackBlueTrue']> {
    return this.blackBlueTrue(font);
  }

  pragma(): ReturnType<AbstractElement['getPragma']> {
    return this.getPragma();
  }
}

const probe = new Probe();

describe('AbstractElement palette (java:47-79)', () => {
  /** [light, dark] per getter, `#X` read by HColorSet as `#XXXXXX`. */
  const EXPECTED: Record<string, [string, string]> = {
    black: ['#000000', '#FFFFFF'],
    color88: ['#888888', '#888888'],
    colorAA: ['#AAAAAA', '#666666'],
    colorBB: ['#BBBBBB', '#555555'],
    colorDD: ['#DDDDDD', '#333333'],
    colorEE: ['#EEEEEE', '#222222'],
    white: ['#FFFFFF', '#000000'],
  };

  for (const [name, [light, dark]] of Object.entries(EXPECTED)) {
    it(`${name} is ${light} with dark partner ${dark}`, () => {
      const color = probe.palette()[name] as HColorSimple;
      expect(color.asString()).toBe(light);
      expect((color.darkSchemeTheme() as HColorSimple).asString()).toBe(dark);
      expect(color.toString().startsWith('WITHDARK ')).toBe(true);
    });
  }

  it('paints the light colour (the jar fills #EEE and strokes #000)', () => {
    expect(probe.palette().colorEE?.asPaint()).toBe('#EEEEEE');
    expect(probe.palette().black?.asPaint()).toBe('#000000');
  });
});

describe('AbstractElement#blackBlueTrue (FontConfiguration.java:63-65)', () => {
  it('is the font in black, plain, with the default hyperlink colour and underline', () => {
    const fc = probe.font(FONT_12);
    expect(fc.family).toBe('SansSerif');
    expect(fc.size).toBe(12);
    expect(fc.color).toBe('#000000');
    expect([...fc.styles]).toEqual([]);
    // FontConfiguration.java:63-64: `create(font, BLACK.withDark(WHITE), HColors.BLUE,
    // UStroke.simple(), 8)` -- the hyperlink colour and underline reach the UText
    // config since wep-T5a's FontConfigurationBridge fix (Style.java:265-267).
    expect(fc.hyperlinkColor).toBe('#0000FF');
    expect(fc.hyperlinkUnderlineStroke?.getThickness()).toBe(1);
  });

  it('carries the face: bold and italic become styles (FontConfiguration.java:67-80)', () => {
    const boldItalic = UFontFactory.build(FontStack.SANS_SERIF, { cssWeight: 700, italic: true }, 10);
    const fc = probe.font(boldItalic);
    expect(fc.size).toBe(10);
    expect(new Set(fc.styles)).toEqual(new Set([FontStyle.BOLD, FontStyle.ITALIC]));
    expect(fc.fontFace).toEqual({ cssWeight: 700, italic: true });
  });
});

describe('AbstractElement#getPragma (java:85-87)', () => {
  it('is a fresh empty pragma each call', () => {
    const a = probe.pragma();
    expect(a).not.toBe(probe.pragma());
    expect(a.isDefine(PragmaKey.COMPACT)).toBe(false);
    expect(a.getWarnings()).toEqual([]);
  });
});
