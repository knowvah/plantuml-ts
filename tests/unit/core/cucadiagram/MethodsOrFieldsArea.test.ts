/**
 * MethodsOrFieldsArea.test.ts — SI1/T8: coverage for
 * `src/core/cucadiagram/MethodsOrFieldsArea.ts`, `Elected.ts`,
 * `TextBlockTracer.ts` (+ the `MethodsOrFieldsAreaConfig.ts` seam
 * types they consume).
 *
 * Uses the real `Display.create8` → `SheetBlock1`/`SheetBlock2` chain
 * with a per-character `AtomOps` (CHAR_WIDTH/LINE_HEIGHT) and a
 * verbatim one-stripe `SheetBuilder` — `BodyEnhanced2.test.ts`'s
 * established `realSheetBuilder`/`unitOps` pattern — so every
 * dimension below is hand-derived from the Java:
 *   row width  = rendered text length × CHAR_WIDTH(2)
 *   row height = LINE_HEIGHT(10)
 *   icon zone  = getCircledCharacterRadius() + 3 (java:156-157; A2s R2f
 *                jar-verified: default radius 11 → zone 14, resolved
 *                radius 8 → zone 11 — `class-member-rows.ts`)
 *   asBlockMemberImpl margins = (6, 4) two-arg Java overload → +12
 *                width, +8 height (java:83-86)
 */
import { describe, expect, it } from 'vitest';
import { Display } from '../../../../src/core/klimt/creole/Display.js';
import { Sheet } from '../../../../src/core/klimt/creole/Sheet.js';
import type { Stripe } from '../../../../src/core/klimt/creole/Stripe.js';
import type { CreoleAtom } from '../../../../src/core/klimt/creole/atom/Atom.js';
import type { SheetBuilder, DisplayLike } from '../../../../src/core/klimt/creole/SheetBuilder.js';
import type { AtomOps } from '../../../../src/core/klimt/creole/Sea.js';
import type { StringBounder } from '../../../../src/core/klimt/font/StringBounder.js';
import type { FontConfiguration } from '../../../../src/core/klimt/shape/UText.js';
import { FontStyle } from '../../../../src/core/klimt/shape/UText.js';
import type { TextBlock } from '../../../../src/core/klimt/shape/TextBlock.js';
import { TextBlockLineBefore } from '../../../../src/core/klimt/shape/TextBlockLineBefore.js';
import type { UGraphic } from '../../../../src/core/klimt/UGraphic.js';
import { HorizontalAlignment } from '../../../../src/core/klimt/geom/HorizontalAlignment.js';
import { ClockwiseTopRightBottomLeft } from '../../../../src/core/klimt/geom/ClockwiseTopRightBottomLeft.js';
import { XDimension2D } from '../../../../src/core/klimt/geom/XDimension2D.js';
import { LineBreakStrategy } from '../../../../src/core/klimt/LineBreakStrategy.js';
import { Pragma } from '../../../../src/core/skin/Pragma.js';
import { Url } from '../../../../src/core/url/Url.js';
import { Ports } from '../../../../src/core/svek/Ports.js';
import type { Entity } from '../../../../src/core/abel/Entity.js';
import type { NestedDiagramRenderer } from '../../../../src/core/EmbeddedDiagram.js';
import { Elected } from '../../../../src/core/cucadiagram/Elected.js';
import { Member } from '../../../../src/core/cucadiagram/Member.js';
import { MethodsOrFieldsArea } from '../../../../src/core/cucadiagram/MethodsOrFieldsArea.js';
import type {
  MethodsOrFieldsAreaConfig,
  MethodsOrFieldsAreaSkinParam,
  MethodsOrFieldsAreaStyleValues,
} from '../../../../src/core/cucadiagram/MethodsOrFieldsAreaConfig.js';
import { TextBlockTracer, fullInnerPosition, isMember } from '../../../../src/core/cucadiagram/TextBlockTracer.js';
import type { DisplayElement } from '../../../../src/core/klimt/creole/Display.js';

const CHAR_WIDTH = 2;
const LINE_HEIGHT = 10;
const FONT: FontConfiguration = { family: 'sans-serif', size: 12, color: '#000000', styles: new Set() };
const DEFAULT_RADIUS = 11; // 17/3+6 -- class-member-rows.ts's documented default derivation
const LINE_THICKNESS = 0.5; // plantuml.skin `element { LineThickness 0.5 }` (BodyEnhancedAbstract.ts)

class FakeStringBounder implements StringBounder {
  calculateDimension(): XDimension2D {
    return new XDimension2D(0, 0);
  }
}
const sb: StringBounder = new FakeStringBounder();

/** A bounder whose duck-typed `matchesProperty('TIKZ')` is true — the
 *  java:166-173 branch's trigger. */
class TikzStringBounder extends FakeStringBounder {
  matchesProperty(name: string): boolean {
    return name === 'TIKZ';
  }
}

function unitOps(): AtomOps {
  return {
    calculateDimension: (atom): XDimension2D => {
      const text = atom.kind === 'text' ? atom.text : '';
      return new XDimension2D(text.length * CHAR_WIDTH, LINE_HEIGHT);
    },
    getStartingAltitude: (): number => 0,
    drawU: (): void => undefined,
  };
}

/** One verbatim text stripe per sheet (empty display → zero stripes) —
 *  `BodyEnhanced2.test.ts#realSheetBuilder`, reused unchanged. */
function realSheetBuilder(font: FontConfiguration): SheetBuilder {
  return {
    createSheet(display: DisplayLike) {
      const sheet = new Sheet(HorizontalAlignment.LEFT);
      const lines = [...display];
      if (lines.length === 0) return sheet;
      const text = lines.map((line) => (typeof line === 'string' ? line : line.toString())).join(' ');
      const atom: CreoleAtom = { kind: 'text', text, font };
      const stripe: Stripe = { getLHeader: () => null, getAtoms: () => [atom] };
      sheet.add(stripe);
      return sheet;
    },
  };
}

interface SkinOptions {
  classAttributeIconSize?: number;
  circledCharacterRadius?: number;
  /** Records every `sheet(...)` first argument (the resolved
   *  `FontConfiguration`) so italic/underline routing is observable. */
  sheetFonts?: FontConfiguration[];
}

function fakeSkin(options: SkinOptions = {}): MethodsOrFieldsAreaSkinParam {
  return {
    // --- abel/ISkinParam.ts consumed slice (T5 stub) ---
    getFontHtmlColor: () => ({}),
    getFont: () => ({}),
    getHyperlinkColor: () => ({}),
    useUnderlineForHyperlink: () => {
      throw new Error('not exercised in this test');
    },
    getCurrentStyleBuilder: () => ({}),
    getDefaultTextAlignment: (defaultValue) => defaultValue,
    // --- style/ISkinSimple.ts ---
    getSprite: () => null,
    guillemet: () => {
      throw new Error('not exercised in this test');
    },
    getFromMd5: () => null,
    transformStringForSizeHack: (s) => s,
    getValue: () => null,
    values: () => new Map(),
    getPadding: () => ClockwiseTopRightBottomLeft.none(),
    getMonospacedFamily: () => 'monospaced',
    getTabSize: () => 8,
    getDpi: () => 96,
    copyAllFrom: () => undefined,
    getPragma: () => Pragma.createEmpty(),
    sheet: (font: FontConfiguration) => {
      options.sheetFonts?.push(font);
      return realSheetBuilder(font);
    },
    // --- MethodsOrFieldsAreaSkinParam additions (java:126/157) ---
    classAttributeIconSize: () => options.classAttributeIconSize ?? 0,
    getCircledCharacterRadius: () => options.circledCharacterRadius ?? DEFAULT_RADIUS,
  };
}

function fakeLeaf(portShortNames: readonly string[] = []): Entity {
  return { getPortShortNames: () => new Set(portShortNames) } as unknown as Entity;
}

function makeArea(
  members: readonly DisplayElement[],
  configOverride: Partial<MethodsOrFieldsAreaConfig> = {},
  styleOverride: Partial<MethodsOrFieldsAreaStyleValues> = {},
  leaf: Entity = fakeLeaf(),
): MethodsOrFieldsArea {
  const config: MethodsOrFieldsAreaConfig = {
    skinParam: fakeSkin(),
    memberFontConfig: FONT,
    ...configOverride,
  };
  const styleValues: MethodsOrFieldsAreaStyleValues = {
    lineThickness: LINE_THICKNESS,
    wrapWidth: LineBreakStrategy.NONE,
    ...styleOverride,
  };
  return new MethodsOrFieldsArea(Display.create(members), config, leaf, styleValues, unitOps());
}

/** Members ride through `Display` as upstream's
 *  `Display.create(List<CharSequence>)` rows do (`Member` structurally
 *  satisfies `DisplayElement`'s `MessageNumberLike` arm, so no
 *  assertion is needed — eslint no-unnecessary-type-assertion). */
function asElement(m: Member): DisplayElement {
  return m;
}

describe('Elected (cucadiagram/Elected.java)', () => {
  it('carries shortName/score and formats toString as "name/score"', () => {
    const elected = new Elected('foo', 100);
    expect(elected.getShortName()).toBe('foo');
    expect(elected.getScore()).toBe(100);
    expect(elected.toString()).toBe('foo/100');
  });
});

describe('isMember (the cs-instanceof-Member stand-in)', () => {
  it('recognizes a real Member and rejects plain strings', () => {
    expect(isMember(Member.field('-count : int'))).toBe(true);
    expect(isMember('field : int')).toBe(false);
    expect(isMember(null)).toBe(false);
  });
});

describe('calculateDimensionOnlyMembers via calculateDimension (java:140-178)', () => {
  it('plain string rows: width = max row width, height = rows stacked', () => {
    const area = makeArea(['alpha', 'bo']);
    const dim = area.calculateDimension(sb);
    expect(dim.getWidth()).toBe(5 * CHAR_WIDTH); // 'alpha'
    expect(dim.getHeight()).toBe(2 * LINE_HEIGHT);
  });

  it('iconSize 0: rows render getDisplay(true) with the visibility char (java:244-245)', () => {
    const area = makeArea([asElement(Member.field('-count : int'))]);
    // '-count : int' -- 12 chars, no icon zone (classAttributeIconSize == 0)
    const dim = area.calculateDimension(sb);
    expect(dim.getWidth()).toBe(12 * CHAR_WIDTH);
    expect(dim.getHeight()).toBe(LINE_HEIGHT);
  });

  it('a "#"-prefixed display gets CharHidder.addTileAtBegin (java:246-247)', () => {
    const area = makeArea([asElement(Member.field('#prot : int'))]);
    // getDisplay(true) = '#prot : int' (11) -> '~#prot : int' (12)
    expect(area.calculateDimension(sb).getWidth()).toBe(12 * CHAR_WIDTH);
  });

  it('icons on: adds the radius+3 zone once (java:156-157, 175; A2s pin: radius 11 -> 14)', () => {
    const area = makeArea([asElement(Member.field('-count : int'))], { skinParam: fakeSkin({ classAttributeIconSize: 1 }) });
    // withVisibilityChar false -> 'count : int' (11 chars) + zone 14
    const dim = area.calculateDimension(sb);
    expect(dim.getWidth()).toBe(11 * CHAR_WIDTH + (DEFAULT_RADIUS + 3));
    expect(dim.getHeight()).toBe(LINE_HEIGHT);
  });

  it('icons on, resolved radius 8 -> zone 11 (puvono-84 resolved-radius rule)', () => {
    const area = makeArea([asElement(Member.field('-count : int'))], {
      skinParam: fakeSkin({ classAttributeIconSize: 1, circledCharacterRadius: 8 }),
    });
    expect(area.calculateDimension(sb).getWidth()).toBe(11 * CHAR_WIDTH + 11);
  });

  it('icons on but no member carries a modifier: hasSmallIcon false, no zone (java:125-138)', () => {
    const area = makeArea([asElement(Member.field('plain', false))], { skinParam: fakeSkin({ classAttributeIconSize: 1 }) });
    expect(area.calculateDimension(sb).getWidth()).toBe(5 * CHAR_WIDTH);
  });

  it('TIKZ bounder: each 10-high row gets the hard-coded +1 (java:166-173)', () => {
    const area = makeArea(['ab', 'cd']);
    const dim = area.calculateDimension(new TikzStringBounder());
    expect(dim.getHeight()).toBe(2 * (LINE_HEIGHT + 1));
  });
});

describe('embedded diagram separation (java:109-122) + calculateDimensionSlow (java:140-152)', () => {
  it('splits embedded blocks out of the member rows and stacks their dimensions', () => {
    const sources: (readonly string[])[] = [];
    const renderer: NestedDiagramRenderer = {
      render: (source): TextBlock => {
        sources.push(source);
        return {
          calculateDimension: () => new XDimension2D(100, 30),
          drawU: () => undefined,
        };
      },
    };
    const area = makeArea(['first', '{{uml', 'x', '}}', 'last'], { nestedDiagramRenderer: renderer });
    const dim = area.calculateDimension(sb);
    // members: 'first'(10) / 'last'(8); embedded: 100x30
    expect(dim.getWidth()).toBe(100);
    expect(dim.getHeight()).toBe(2 * LINE_HEIGHT + 30);
    expect(sources).toEqual([['@startuml', 'x', '@enduml']]);
  });

  it('throws the typed ADR-2 deferral when an embedded block appears without a renderer', () => {
    expect(() => makeArea(['{{uml', '}}'])).toThrow(/deferred per SI1\/ADR-2/);
  });
});

describe('asBlockMemberImpl (java:83-86)', () => {
  it('wraps in TextBlockLineBefore with the (6, 4) margin: +12 width, +8 height', () => {
    const area = makeArea(['alpha']);
    const block = area.asBlockMemberImpl();
    expect(block).toBeInstanceOf(TextBlockLineBefore);
    const dim = block.calculateDimension(sb);
    expect(dim.getWidth()).toBe(5 * CHAR_WIDTH + 12);
    expect(dim.getHeight()).toBe(LINE_HEIGHT + 8);
  });
});

describe('getPorts (java:194-211) + getElected/getScore (java:219-236)', () => {
  it('a word-boundary match scores 100 and lands at the row y-band', () => {
    const area = makeArea(['zzz', 'int foo()'], {}, {}, fakeLeaf(['foo']));
    const geometries = area.getPorts(sb).getAllPortGeometry();
    expect(geometries).toHaveLength(1);
    const geometry = geometries[0]!;
    expect(geometry.getId()).toBe(Ports.encodePortNameToId('foo'));
    expect(geometry.getScore()).toBe(100);
    expect(geometry.getPosition()).toBe(LINE_HEIGHT); // second row
    expect(geometry.getHeight()).toBe(LINE_HEIGHT);
  });

  it('sortBySize elects the LONGEST matching short name first (java:180-192)', () => {
    const area = makeArea(['xxabcxx'], {}, {}, fakeLeaf(['ab', 'abc']));
    const geometries = area.getPorts(sb).getAllPortGeometry();
    expect(geometries).toHaveLength(1);
    expect(geometries[0]!.getId()).toBe(Ports.encodePortNameToId('abc'));
    expect(geometries[0]!.getScore()).toBe(50); // substring, not word-boundary
  });

  it('getElected: word-boundary 100 / substring 50 / no match null (java:228-236)', () => {
    const area = makeArea([]);
    expect(area.getElected('m abc n', ['abc'])?.getScore()).toBe(100);
    expect(area.getElected('xabcx', ['abc'])?.getScore()).toBe(50);
    expect(area.getElected('none', ['abc'])).toBeNull();
  });

  it('a Member row is matched on getDisplay(false) via convert (java:213-217)', () => {
    const area = makeArea([asElement(Member.method('+doFoo()'))], {}, {}, fakeLeaf(['doFoo']));
    const geometries = area.getPorts(sb).getAllPortGeometry();
    expect(geometries).toHaveLength(1);
    expect(geometries[0]!.getScore()).toBe(100);
  });
});

describe('contains (java:371-379)', () => {
  it('prefix-matches on getDisplay(false)', () => {
    const area = makeArea([asElement(Member.field('-count : int'))]);
    expect(area.contains('count')).toBe(true);
    expect(area.contains('int')).toBe(false);
  });
});

describe('getInnerPosition (java:381-393) through getLayout (java:395-427)', () => {
  it('no icons: Y1Y2Left stacks rows; the queried row rectangle is claimed via fullInnerPosition', () => {
    const area = makeArea([asElement(Member.field('alpha', false)), asElement(Member.field('beta', false))]);
    const rect = area.getInnerPosition('beta', sb);
    expect(rect).toBeDefined();
    expect(rect!.getX()).toBe(0);
    expect(rect!.getY()).toBe(LINE_HEIGHT);
    expect(rect!.getWidth()).toBe(4 * CHAR_WIDTH);
    expect(rect!.getHeight()).toBe(LINE_HEIGHT);
  });

  it('icons on: the rectangle is extended left by the radius+3 zone (java:386-390)', () => {
    const area = makeArea(
      [asElement(Member.field('-count : int'))],
      { skinParam: fakeSkin({ classAttributeIconSize: 1 }) },
      { resolveVisibilityStyle: () => ({ lineColor: '#000000', backGroundColor: '#ffffff' }) },
    );
    // Member.toString() is the RAW text (java:61-63) -- the query key.
    const rect = area.getInnerPosition('-count : int', sb);
    expect(rect).toBeDefined();
    // text sits at x = col2 = 14; extension subtracts the same 14 back.
    expect(rect!.getX()).toBe(0);
    expect(rect!.getY()).toBe(0);
    expect(rect!.getWidth()).toBe(11 * CHAR_WIDTH + (DEFAULT_RADIUS + 3));
    expect(rect!.getHeight()).toBe(LINE_HEIGHT);
  });

  it('an unknown member yields undefined', () => {
    const area = makeArea([asElement(Member.field('alpha', false))]);
    expect(area.getInnerPosition('nope', sb)).toBeUndefined();
  });

  it('getUBlock without the resolveVisibilityStyle seam throws the typed ADR-2 deferral', () => {
    const area = makeArea([asElement(Member.field('-count : int'))], { skinParam: fakeSkin({ classAttributeIconSize: 1 }) });
    expect(() => area.getInnerPosition('-count : int', sb)).toThrow(/deferred per SI1\/ADR-2/);
  });
});

describe('drawU (java:429-440)', () => {
  /** Minimal recording UGraphic: apply() returns itself (translations
   *  are not asserted here), draw() is a no-op — enough for the
   *  `SheetBlock2` → `SheetBlock1` → `atomOps.drawU` chain plus
   *  `ULayoutGroup#drawU`. */
  function recordingUg(): UGraphic {
    const ug = {
      apply: () => ug,
      draw: () => undefined,
      getParam: () => ({ getColor: () => undefined }),
      getTranslate: () => undefined,
      getStringBounder: () => sb,
      // VisibilityModifier#drawWithGroup requires the group capability
      // (`requireGroups(ug)` -- see VisibilityModifier.ts).
      startGroup: () => undefined,
      closeGroup: () => undefined,
    };
    return ug as unknown as UGraphic;
  }

  it('draws member rows then stacks embedded diagrams below (no icons)', () => {
    const drawn: string[] = [];
    const renderer: NestedDiagramRenderer = {
      render: (): TextBlock => ({
        calculateDimension: () => new XDimension2D(100, 30),
        drawU: () => {
          drawn.push('embedded');
        },
      }),
    };
    const area = makeArea(['alpha', '{{uml', '}}'], { nestedDiagramRenderer: renderer });
    area.drawU(recordingUg());
    expect(drawn).toEqual(['embedded']);
  });

  it('with icons on, draws the getUBlock/text pairs through PlacementStrategyVisibility', () => {
    const area = makeArea(
      [asElement(Member.field('-count : int'))],
      { skinParam: fakeSkin({ classAttributeIconSize: 1 }) },
      { resolveVisibilityStyle: () => ({ lineColor: '#000000', backGroundColor: '#ffffff' }) },
    );
    expect(() => area.drawU(recordingUg())).not.toThrow();
    // the pair layout reserved the icon zone: total width is text + 14.
    expect(area.calculateDimension(sb).getWidth()).toBe(11 * CHAR_WIDTH + (DEFAULT_RADIUS + 3));
  });
});

describe('createTextBlock font routing (java:249-253)', () => {
  it('an {abstract} member renders italic, a {static} member underlined', () => {
    const sheetFonts: FontConfiguration[] = [];
    const skinParam = fakeSkin({ sheetFonts });
    makeArea([asElement(Member.method('{abstract} foo()'))], { skinParam }).calculateDimension(sb);
    makeArea([asElement(Member.method('{static} bar()'))], { skinParam }).calculateDimension(sb);
    makeArea([asElement(Member.method('plain()'))], { skinParam }).calculateDimension(sb);
    expect(sheetFonts).toHaveLength(3);
    expect(sheetFonts[0]!.styles.has(FontStyle.ITALIC)).toBe(true);
    expect(sheetFonts[1]!.styles.has(FontStyle.UNDERLINE)).toBe(true);
    expect(sheetFonts[2]!.styles.size).toBe(0);
  });
});

describe('TextBlockTracer (java:307-339)', () => {
  function fakeBlock(events: string[]): TextBlock {
    return {
      calculateDimension: () => new XDimension2D(7, 13),
      drawU: () => {
        events.push('draw');
      },
    };
  }

  it('brackets drawU with startUrl/closeUrl when the member has a url', () => {
    const events: string[] = [];
    const m = { getUrl: () => new Url('http://x/', null, null) } as unknown as Member;
    const tracer = new TextBlockTracer(m, fakeBlock(events));
    const ug = {
      startUrl: () => events.push('start'),
      closeUrl: () => events.push('close'),
    } as unknown as UGraphic;
    tracer.drawU(ug);
    expect(events).toEqual(['start', 'draw', 'close']);
    expect(tracer.calculateDimension(sb).getWidth()).toBe(7);
  });

  it('draws bare when the member has no url', () => {
    const events: string[] = [];
    const m = { getUrl: () => null } as unknown as Member;
    new TextBlockTracer(m, fakeBlock(events)).drawU({} as unknown as UGraphic);
    expect(events).toEqual(['draw']);
  });
});

describe('fullInnerPosition (java:269-305)', () => {
  const block: TextBlock = {
    calculateDimension: () => new XDimension2D(7, 13),
    drawU: () => undefined,
  };

  it('claims the whole row rectangle for its own member, nothing for others', () => {
    const m = { toString: () => 'row' } as unknown as Member;
    const wrapped = fullInnerPosition(block, m) as TextBlock & {
      getInnerPosition(member: string, stringBounder: StringBounder): unknown;
    };
    const rect = wrapped.getInnerPosition('row', sb) as { getWidth(): number; getHeight(): number; getX(): number };
    expect(rect.getX()).toBe(0);
    expect(rect.getWidth()).toBe(7);
    expect(rect.getHeight()).toBe(13);
    expect(wrapped.getInnerPosition('other', sb)).toBeUndefined();
  });
});
