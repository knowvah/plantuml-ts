/**
 * Style — `style/Style.java` (387 lines).
 *
 * Getter expectations are the jar's own: a scratch reflection probe ran
 * `Idea.getStyle()` on the stereo snippet of `StyleBuilder.test.ts`
 * (1.2026.8beta1) and printed `getMargin`/`getPadding`/`getStroke`/
 * `wrapWidth`/`getHorizontalAlignment`/`getShadowing`/`getUFont` and
 * `getFontConfiguration(HColorSet.instance())`, e.g. for node `r <<foo>>`:
 *
 * ```
 * [r ]: margin=10.0,10.0,10.0,10.0 padding=10.0,10.0,10.0,10.0 stroke=5.0,3.0,1.5 wrap=60 halign=LEFT
 *   shadow=0.0 font=FontStack[SansSerif]|w=300|i=false|size=14
 *   fc.color=[r=0,g=255,b=0,a=255] α=255 fc.hyper=WITHDARK [r=0,g=0,b=255,a=255] α=255
 *   fc.ustroke=0.0,0.0,1.0 fc.tab=8 back=[r=255,g=0,b=0,a=255] α=255 line=WITHDARK [r=24,g=24,b=24,a=255] α=255
 * [a]: ... padding=4.0,8.0,4.0,8.0 stroke=0.0,0.0,1.5 wrap= ... w=400 ...
 * ```
 */
import { describe, expect, it } from 'vitest';
import { Style } from '../../../../src/core/style/Style.js';
import { StyleSignatureBasic } from '../../../../src/core/style/StyleSignatureBasic.js';
import { MergeStrategy } from '../../../../src/core/style/MergeStrategy.js';
import { ValueImpl } from '../../../../src/core/style/ValueImpl.js';
import { ValueColor } from '../../../../src/core/style/ValueColor.js';
import { ValueNull } from '../../../../src/core/style/ValueNull.js';
import { Colors } from '../../../../src/core/abel/Colors.js';
import { ColorType } from '../../../../src/core/abel/ColorType.js';
import { Fashion } from '../../../../src/core/klimt/Fashion.js';
import { HColorSet } from '../../../../src/core/klimt/color/HColorSet.js';
import { HColorSimple } from '../../../../src/core/klimt/color/HColorSimple.js';
import { HorizontalAlignment } from '../../../../src/core/klimt/geom/HorizontalAlignment.js';
import type { UFont } from '../../../../src/core/klimt/font/UFont.js';
import type { PName } from '../../../../src/core/style/PName.js';
import type { Value } from '../../../../src/core/style/Value.js';
import { ideaScenarioDump, styleFromDump } from './helpers/style-fixture.js';

const SIG = StyleSignatureBasic.of('root', 'element');
const SET = HColorSet.instance();

function style(values: Record<string, [string, number]>, sig: StyleSignatureBasic = SIG): Style {
  const map = new Map<PName, Value>();
  for (const [k, [v, p]] of Object.entries(values)) map.set(k as PName, ValueImpl.regular(v, p));
  return new Style(sig, map);
}

/** `HColorSimple#toString` of a `FontConfiguration` colour (typed `object` by `abel/Colors`). */
function colorString(c: object): string {
  if (c instanceof HColorSimple) return c.toString();
  throw new Error('not an HColorSimple');
}

/** The jar's `Idea.getStyle()` for one stereo-snippet idea, rebuilt from the dump. */
function stereoIdea(label: string): Style {
  const idea = ideaScenarioDump('stereo').ideas.find((i) => i.label === label && i.branch === 'regular');
  if (idea === undefined) throw new Error(label);
  return styleFromDump(idea.style);
}

describe('Style — value / hasValue / toString', () => {
  it('value returns the stored value, or ValueNull.NULL when absent', () => {
    const s = style({ FontSize: ['14', 5] });
    expect(s.value('FontSize').asString()).toBe('14');
    expect(s.value('Padding')).toBe(ValueNull.NULL);
    expect(s.hasValue('FontSize')).toBe(true);
    expect(s.hasValue('Padding')).toBe(false);
  });

  it('toString is signature + EnumMap (PName ordinal order)', () => {
    const s = style({ Padding: ['1', 3], FontName: ['X', 2] });
    expect(s.toString()).toBe('[element, root]  [] {FontName=X/null (2), Padding=1/null (3)}');
  });
});

describe('Style — mergeWith', () => {
  it('undefined other returns this', () => {
    const s = style({ FontSize: ['14', 5] });
    expect(s.mergeWith(undefined, MergeStrategy.OVERWRITE_EXISTING_VALUE)).toBe(s);
  });

  it('OVERWRITE: the higher priority wins per key; keys union; signatures merge', () => {
    const a = style({ FontSize: ['14', 5], FontColor: ['black', 9] });
    const b = style({ FontSize: ['20', 7], FontColor: ['red', 3], Margin: ['2', 1] }, StyleSignatureBasic.of('node'));
    const m = a.mergeWith(b, MergeStrategy.OVERWRITE_EXISTING_VALUE);
    expect(m.value('FontSize').asString()).toBe('20');
    expect(m.value('FontColor').asString()).toBe('black');
    expect(m.value('Margin').asString()).toBe('2');
    expect(m.getSignature().toString()).toBe('[element, node, root]  []');
    expect(a.value('FontSize').asString()).toBe('14');
  });

  it('KEEP_EXISTING_VALUE_OF_STEREOTYPE keeps an existing value above priority 1000 (StyleLoader.java:178)', () => {
    const a = style({ FontColor: ['red', 1001], FontSize: ['9', 1000] });
    const b = style({ FontColor: ['blue', 5000], FontSize: ['12', 5000] });
    const keep = a.mergeWith(b, MergeStrategy.KEEP_EXISTING_VALUE_OF_STEREOTYPE);
    expect(keep.value('FontColor').asString()).toBe('red');
    expect(keep.value('FontSize').asString()).toBe('12');
    const overwrite = a.mergeWith(b, MergeStrategy.OVERWRITE_EXISTING_VALUE);
    expect(overwrite.value('FontColor').asString()).toBe('blue');
  });

  it("a non-ValueImpl value on the other side is Java's ClassCastException", () => {
    const a = style({});
    const b = new Style(
      SIG,
      new Map<PName, Value>([['BackGroundColor', new ValueColor(SET.getColorOrWhite('black'), 1)]]),
    );
    expect(() => a.mergeWith(b, MergeStrategy.OVERWRITE_EXISTING_VALUE)).toThrow('ClassCastException');
  });
});

describe('Style — deltaPriority', () => {
  it('adds the delta to every value of a starred style', () => {
    const s = style({ FontColor: ['red', 326] }, SIG.addStar()).deltaPriority(1411065408);
    expect(s.value('FontColor').getPriority()).toBe(1411065734);
    expect(s.value('FontColor').asString()).toBe('red');
    expect(s.getSignature().isStarred()).toBe(true);
  });

  it('throws UnsupportedOperationException on an unstarred style', () => {
    expect(() => style({ FontColor: ['red', 1] }).deltaPriority(10)).toThrow('UnsupportedOperationException');
  });
});

describe('Style — eventuallyOverride', () => {
  const base = style({ BackGroundColor: ['white', 7], LineColor: ['black', 8], FontColor: ['black', 9] });
  const red = SET.getColorOrWhite('red');
  const green = SET.getColorOrWhite('#00ff00');
  const blue = SET.getColorOrWhite('blue');

  it('PName + HColor: a ValueColor carrying the old priority; undefined colour is identity', () => {
    const s = base.eventuallyOverride('BackGroundColor', red);
    expect(s.value('BackGroundColor').asColor(SET)).toBe(red);
    expect(s.value('BackGroundColor').getPriority()).toBe(7);
    expect(base.eventuallyOverride('BackGroundColor', undefined)).toBe(base);
  });

  it('PName + HColor on an absent key is the NullPointerException of `old.getPriority()`', () => {
    expect(() => base.eventuallyOverride('Padding', red)).toThrow('NullPointerException');
  });

  it('Colors: BACK -> BackGroundColor, LINE -> LineColor, TEXT -> FontColor', () => {
    const colors = Colors.empty().add(ColorType.BACK, red).add(ColorType.LINE, green).add(ColorType.TEXT, blue);
    const s = base.eventuallyOverride(colors);
    expect(s.value('BackGroundColor').asColor(SET)).toBe(red);
    expect(s.value('LineColor').asColor(SET)).toBe(green);
    expect(s.value('FontColor').asColor(SET)).toBe(blue);
    expect(base.eventuallyOverride(Colors.empty().add(ColorType.LINE, green)).value('BackGroundColor').asString()).toBe(
      'white',
    );
  });

  it('Colors: undefined is identity', () => {
    expect(base.eventuallyOverride(undefined)).toBe(base);
  });

  it('Colors: a colour that is not an HColor is rejected at the seam', () => {
    expect(() => base.eventuallyOverride(Colors.empty().add(ColorType.BACK, { r: 1 }))).toThrow('HColor');
  });

  it('Fashion: only the back colour overrides', () => {
    const s = base.eventuallyOverride(new Fashion(red, green));
    expect(s.value('BackGroundColor').asColor(SET)).toBe(red);
    expect(s.value('LineColor').asString()).toBe('black');
    expect(base.eventuallyOverride(new Fashion(undefined, green))).toBe(base);
    expect(new Fashion(red, green).getForeColor()).toBe(green);
  });
});

describe('Style — getters equal the jar (stereo snippet ideas)', () => {
  it('r <<foo>>: margin, padding, dashed stroke, wrap, alignment, shadowing', () => {
    const s = stereoIdea('r ');
    const m = s.getMargin();
    const p = s.getPadding();
    expect([m.getTop(), m.getRight(), m.getBottom(), m.getLeft()]).toEqual([10, 10, 10, 10]);
    expect([p.getTop(), p.getRight(), p.getBottom(), p.getLeft()]).toEqual([10, 10, 10, 10]);
    const st = s.getStroke();
    expect([st.getDashVisible(), st.getDashSpace(), st.getThickness()]).toEqual([5, 3, 1.5]);
    expect(s.wrapWidth().toString()).toBe('60');
    expect(s.getHorizontalAlignment()).toBe(HorizontalAlignment.LEFT);
    expect(s.getShadowing()).toBe(0);
  });

  it('a: `Padding 4 8`, plain stroke, empty wrap', () => {
    const s = stereoIdea('a');
    const p = s.getPadding();
    expect([p.getTop(), p.getRight(), p.getBottom(), p.getLeft()]).toEqual([4, 8, 4, 8]);
    const st = s.getStroke();
    expect([st.getDashVisible(), st.getDashSpace(), st.getThickness()]).toEqual([0, 0, 1.5]);
    expect(s.wrapWidth().toString()).toBe('');
  });

  it('r <<foo>>: getUFont = SansSerif, FontStyle bold overridden by FontWeight 300, size 14', () => {
    const f = stereoIdea('r ').getUFont();
    expect(f.toString()).toBe('sans-serif/14');
    expect(f.getFontFace()).toEqual({ cssWeight: 300, italic: false });
    expect(f.getSize()).toBe(14);
  });

  it('getFontConfiguration: font colour, hyperlink colour (with dark), underline stroke, tab 8', () => {
    const fc = stereoIdea('r ').getFontConfiguration(SET);
    expect(colorString(fc.getColor())).toBe('[r=0,g=255,b=0,a=255] α=255');
    expect(colorString(fc.getHyperlinkColor())).toBe('WITHDARK [r=0,g=0,b=255,a=255] α=255');
    const u = fc.getHyperlinkUnderlineStroke();
    expect([u.getDashVisible(), u.getDashSpace(), u.getThickness()]).toEqual([0, 0, 1]);
    expect(fc.getTabSize()).toBe(8);
    expect((fc.getFont() as UFont).getSize()).toBe(14);
  });

  it('getFontConfiguration with Colors: a TEXT colour replaces FontColor', () => {
    const red = SET.getColorOrWhite('red');
    const fc = stereoIdea('a').getFontConfiguration(SET, Colors.empty().add(ColorType.TEXT, red));
    expect(fc.getColor()).toBe(red);
  });

  it('colours read through the set: back and line of r <<foo>>', () => {
    const s = stereoIdea('r ');
    expect(s.value('BackGroundColor').asColor(SET).toString()).toBe('[r=255,g=0,b=0,a=255] α=255');
    expect(s.value('LineColor').asColor(SET).toString()).toBe('WITHDARK [r=24,g=24,b=24,a=255] α=255');
  });
});

describe('Style — getter edge cases', () => {
  it('getShadowing: 0 when absent, else asDoubleDefaultTo(1.5)', () => {
    expect(style({}).getShadowing()).toBe(0);
    expect(style({ Shadowing: ['2.0', 1] }).getShadowing()).toBe(2);
  });

  it('getStroke: a single dash length is used for both; `;` and `,` also separate', () => {
    const one = style({ LineThickness: ['2', 1], LineStyle: ['4', 1] }).getStroke();
    expect([one.getDashVisible(), one.getDashSpace(), one.getThickness()]).toEqual([4, 4, 2]);
    const semi = style({ LineThickness: ['1', 1], LineStyle: ['1;2', 1] }).getStroke();
    expect([semi.getDashVisible(), semi.getDashSpace()]).toEqual([1, 2]);
  });

  it('getStroke: an unparsable dash falls back to thickness only (the catch)', () => {
    const s = style({ LineThickness: ['3', 1], LineStyle: ['dotted', 1] }).getStroke();
    expect([s.getDashVisible(), s.getDashSpace(), s.getThickness()]).toEqual([0, 0, 3]);
    const empty = style({ LineThickness: ['3', 1], LineStyle: ['-', 1] }).getStroke();
    expect([empty.getDashVisible(), empty.getThickness()]).toEqual([0, 3]);
  });

  it('getStroke: thickness absent is ValueNull 0', () => {
    expect(style({}).getStroke().getThickness()).toBe(0);
  });

  it('getHorizontalAlignment: ValueNull is LEFT, an unknown string is undefined (Java null)', () => {
    expect(style({}).getHorizontalAlignment()).toBe(HorizontalAlignment.LEFT);
    expect(style({ HorizontalAlignment: ['center', 1] }).getHorizontalAlignment()).toBe(HorizontalAlignment.CENTER);
    expect(style({ HorizontalAlignment: ['middle', 1] }).getHorizontalAlignment()).toBeUndefined();
  });

  it('getUFont: FontSize without digits is 14, absent is ValueNull 0; italic kept under a FontWeight', () => {
    const f = style({
      FontName: ['Serif', 1],
      FontSize: ['big', 1],
      FontStyle: ['italic', 1],
      FontWeight: ['bold', 1],
    }).getUFont();
    expect(f.getFontFace()).toEqual({ cssWeight: 700, italic: true });
    expect(f.getSize()).toBe(14);
    expect(f.toString()).toBe('serif/14');
    expect(
      style({ FontName: ['Serif', 1] })
        .getUFont()
        .getSize(),
    ).toBe(0);
    expect(
      style({ FontName: ['"My Font"', 1], FontSize: ['12', 1] })
        .getUFont()
        .toString(),
    ).toBe("'My Font'/12");
  });

  it('getSignature returns the constructor signature', () => {
    expect(style({}).getSignature()).toBe(SIG);
  });
});
