import { describe, expect, it } from 'vitest';
import { SkinParamColors } from '../../../../src/core/skin/SkinParamColors.js';
import { SkinParamDelegator } from '../../../../src/core/skin/SkinParamDelegator.js';
import { Colors } from '../../../../src/core/abel/Colors.js';
import { ColorType } from '../../../../src/core/abel/ColorType.js';
import type { ISkinParamWithSimple } from '../../../../src/core/abel/ISkinParam.js';
import { HColorSet } from '../../../../src/core/klimt/color/HColorSet.js';
import { CreoleMode } from '../../../../src/core/klimt/creole/CreoleMode.js';
import { HorizontalAlignment } from '../../../../src/core/klimt/geom/HorizontalAlignment.js';
import { ClockwiseTopRightBottomLeft } from '../../../../src/core/klimt/geom/ClockwiseTopRightBottomLeft.js';
import type { FontConfiguration } from '../../../../src/core/klimt/shape/UText.js';
import type { SheetBuilder } from '../../../../src/core/klimt/creole/SheetBuilder.js';
import { UStroke } from '../../../../src/core/klimt/UStroke.js';
import { Pragma } from '../../../../src/core/skin/Pragma.js';
import { GUILLEMET_DEFAULT } from '../../../../src/core/text/Guillemet.js';

const RED = HColorSet.instance().getColor('#FF0000');
const BLUE = HColorSet.instance().getColor('#0000FF');
const FONT: FontConfiguration = { family: 'SansSerif', size: 14, color: '#000000', styles: new Set() };
const PRAGMA = Pragma.createEmpty();
const PADDING = ClockwiseTopRightBottomLeft.same(3);
const STROKE = UStroke.withThickness(2);
const VALUES = new Map([['k', 'v']]);
const STYLE_BUILDER = {};
const UFONT = {};

interface SheetCall {
  readonly args: readonly unknown[];
}

/** A wrapped skin param whose every member returns a distinct, recognisable value. */
function wrapped(calls: SheetCall[], copied: ReadonlyMap<string, string>[]): ISkinParamWithSimple {
  const builder: SheetBuilder = { createSheet: () => ({}) as ReturnType<SheetBuilder['createSheet']> };
  return {
    getIHtmlColorSet: () => HColorSet.instance(),
    sheet: (...args: readonly unknown[]) => {
      calls.push({ args });
      return builder;
    },
    getSprite: (name: string) => (name === 'none' ? null : ({ name } as never)),
    guillemet: () => GUILLEMET_DEFAULT,
    getFromMd5: (md5: string) => `md5:${md5}`,
    transformStringForSizeHack: (s: string) => `hack:${s}`,
    getValue: (key: string) => `value:${key}`,
    values: () => VALUES,
    getPadding: () => PADDING,
    getMonospacedFamily: () => 'Courier',
    getTabSize: () => 4,
    getDpi: () => 120,
    copyAllFrom: (other: ReadonlyMap<string, string>) => {
      copied.push(other);
    },
    getPragma: () => PRAGMA,
    getFontHtmlColor: () => BLUE,
    getFont: () => UFONT,
    getHyperlinkColor: () => RED,
    useUnderlineForHyperlink: () => STROKE,
    getCurrentStyleBuilder: () => STYLE_BUILDER,
    getDefaultTextAlignment: () => HorizontalAlignment.RIGHT,
    strictUmlStyle: () => true,
  };
}

describe('SkinParamColors (skin/SkinParamColors.java)', () => {
  it('getColors returns the Colors it was built with (java:48-50)', () => {
    const colors = Colors.empty().add(ColorType.BACK, RED);
    const p = new SkinParamColors(wrapped([], []), colors);
    expect(p.getColors()).toBe(colors);
    expect(p.getColors().getColor(ColorType.BACK)).toBe(RED);
    expect(p).toBeInstanceOf(SkinParamDelegator);
  });

  it('toString is "SkinParamColors::" + colors (java:59-62)', () => {
    const colors = Colors.empty().add(ColorType.BACK, RED);
    expect(new SkinParamColors(wrapped([], []), colors).toString()).toBe(`SkinParamColors::${colors.toString()}`);
  });

  it('getFontHtmlColor: the TEXT colour when set, else the wrapped answer (java:72-79)', () => {
    const withText = new SkinParamColors(wrapped([], []), Colors.empty().add(ColorType.TEXT, RED));
    expect(withText.getFontHtmlColor(undefined)).toBe(RED);
    const withoutText = new SkinParamColors(wrapped([], []), Colors.empty().add(ColorType.BACK, RED));
    expect(withoutText.getFontHtmlColor(undefined)).toBe(BLUE);
  });
});

describe('SkinParamDelegator (skin/SkinParamDelegator.java) — delegation', () => {
  const calls: SheetCall[] = [];
  const copied: ReadonlyMap<string, string>[] = [];
  const p = new SkinParamColors(wrapped(calls, copied), Colors.empty());

  it('forwards ISkinParam members', () => {
    expect(p.getHyperlinkColor()).toBe(RED);
    expect(p.getFont(undefined, false)).toBe(UFONT);
    expect(p.useUnderlineForHyperlink()).toBe(STROKE);
    expect(p.getCurrentStyleBuilder()).toBe(STYLE_BUILDER);
    expect(p.getDefaultTextAlignment(HorizontalAlignment.LEFT)).toBe(HorizontalAlignment.RIGHT);
    expect(p.strictUmlStyle()).toBe(true);
    expect(p.getValue('x')).toBe('value:x');
    expect(p.getTabSize()).toBe(4);
    expect(p.getPragma()).toBe(PRAGMA);
  });

  it('forwards ISkinSimple members and getIHtmlColorSet', () => {
    expect(p.getIHtmlColorSet()).toBe(HColorSet.instance());
    expect(p.getSprite('none')).toBeNull();
    expect(p.guillemet()).toBe(GUILLEMET_DEFAULT);
    expect(p.getFromMd5('abc')).toBe('md5:abc');
    expect(p.transformStringForSizeHack('s')).toBe('hack:s');
    expect(p.values()).toBe(VALUES);
    expect(p.getPadding()).toBe(PADDING);
    expect(p.getMonospacedFamily()).toBe('Courier');
    expect(p.getDpi()).toBe(120);
    const other = new Map([['a', 'b']]);
    p.copyAllFrom(other);
    expect(copied).toEqual([other]);
  });

  it('forwards both sheet overloads with their exact arguments (java:453-463)', () => {
    p.sheet(FONT, HorizontalAlignment.LEFT, CreoleMode.FULL);
    p.sheet(FONT, HorizontalAlignment.CENTER, CreoleMode.SIMPLE_LINE, FONT);
    expect(calls.map((c) => c.args)).toEqual([
      [FONT, HorizontalAlignment.LEFT, CreoleMode.FULL],
      [FONT, HorizontalAlignment.CENTER, CreoleMode.SIMPLE_LINE, FONT],
    ]);
  });
});

describe('SkinParamDelegator.getFont forwards inPackageTitle = false (java:97-99)', () => {
  it('passes false whatever the caller asked', () => {
    const seen: boolean[] = [];
    const base = wrapped([], []);
    const p = new SkinParamDelegator({
      ...base,
      getFont: (_s, inGroup) => {
        seen.push(inGroup);
        return UFONT;
      },
    });
    expect(p.getFont(undefined, true)).toBe(UFONT);
    expect(seen).toEqual([false]);
  });
});
