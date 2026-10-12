import { describe, expect, it } from 'vitest';

import { FontConfiguration } from '../../../../src/core/abel/FontConfiguration.js';
import { HColorSimple } from '../../../../src/core/klimt/color/HColorSimple.js';
import { UFontFactory } from '../../../../src/core/klimt/font/UFontFactory.js';
import { UStroke } from '../../../../src/core/klimt/UStroke.js';
import { MockSkinParam } from './helpers.js';

/** Behavior tests for the ADR-2 consumed slice of klimt/font/FontConfiguration.java. */
describe('FontConfiguration (consumed slice)', () => {
  it('create (5-arg) stores font, colors, underline stroke and tab size', () => {
    const font = { f: 1 };
    const color = { c: 1 };
    const hyperlink = { c: 2 };
    const stroke = UStroke.simple();
    const fc = FontConfiguration.create(font, color, hyperlink, stroke, 4);
    expect(fc.getFont()).toBe(font);
    expect(fc.getColor()).toBe(color);
    expect(fc.getHyperlinkColor()).toBe(hyperlink);
    expect(fc.getHyperlinkUnderlineStroke()).toBe(stroke);
    expect(fc.getTabSize()).toBe(4);
  });

  it('create (skinParam, style) is ADR-2 deferred (throws)', () => {
    const skinParam = new MockSkinParam();
    const style = { getHorizontalAlignment: () => 'LEFT' as const };
    expect(() => FontConfiguration.create(skinParam, style)).toThrow('deferred per SI1/ADR-2');
  });

  it('blackBlueTrue(font) is create(font, BLACK.withDark(WHITE), BLUE, UStroke.simple(), 8) (java:63-65)', () => {
    const font = UFontFactory.sansSerif(12);
    const fc = FontConfiguration.blackBlueTrue(font);
    expect(fc.getFont()).toBe(font);
    const color = fc.getColor() as HColorSimple;
    expect(color).toBeInstanceOf(HColorSimple);
    expect(color.asPaint()).toBe('#000000');
    expect((color.darkSchemeTheme() as HColorSimple).asPaint()).toBe('#FFFFFF');
    const hyperlink = fc.getHyperlinkColor() as HColorSimple;
    expect(hyperlink.asPaint()).toBe('#0000FF');
    expect(hyperlink.darkSchemeTheme()).toBe(hyperlink);
    expect(fc.getHyperlinkUnderlineStroke().getThickness()).toBe(1);
    expect(fc.getHyperlinkUnderlineStroke().getDasharraySvg()).toBeUndefined();
    expect(fc.getTabSize()).toBe(8);
  });
});
