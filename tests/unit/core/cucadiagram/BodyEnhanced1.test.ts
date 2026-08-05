/**
 * BodyEnhanced1.test.ts — SI1/T9: `src/core/cucadiagram/BodyEnhanced1.ts`
 * against cucadiagram/BodyEnhanced1.java. Every dimension is
 * hand-derived from the Java through `helpers.ts`'s unit fakes
 * (CHAR_WIDTH=2, LINE_HEIGHT=10) — never fitted.
 *
 * Jar-pin reuse: `decorate`'s constants are the bodyenhanced mission's
 * a2s-note-hline jar pins (BodyEnhanced2 shares the SAME
 * `BodyEnhancedAbstract.decorate`, `BodyEnhancedAbstract.ts`'s traced
 * expressions: separator blocks `withMargin(block, marginX, 4)`,
 * divider itself 0-height — heights below add exactly +8 per separator
 * block, +0 for the line). `getMarginX()=6` is additionally
 * corroborated by `state-sizing.ts`'s independent `BODY_MARGIN_X=6`
 * (that file's own jar trace). The folder-title "+12" of the planning
 * docs traces to the separator==0 branch: `withMargin(block, 6, 6, 0,
 * 0)` — 6 LEFT plus 6 RIGHT from ONE `getMarginX()=6`, not a doubled
 * margin constant.
 */
import { describe, expect, it } from 'vitest';
import { Display } from '../../../../src/core/klimt/creole/Display.js';
import type { DisplayElement } from '../../../../src/core/klimt/creole/Display.js';
import { HorizontalAlignment } from '../../../../src/core/klimt/geom/HorizontalAlignment.js';
import type { FontConfiguration } from '../../../../src/core/klimt/shape/UText.js';
import { LeafType } from '../../../../src/core/abel/LeafType.js';
import { Ports } from '../../../../src/core/svek/Ports.js';
import { BodyEnhanced1 } from '../../../../src/core/cucadiagram/BodyEnhanced1.js';
import type { BodyEnhanced1StyleValues } from '../../../../src/core/cucadiagram/BodyEnhanced1Config.js';
import { Member } from '../../../../src/core/cucadiagram/Member.js';
import {
  CHAR_WIDTH,
  LINE_HEIGHT,
  LINE_THICKNESS,
  MEMBER_FONT,
  TITLE_FONT,
  TREE_FONT,
  fakeLeaf,
  fakeSkin,
  sb,
  unitOps,
  type SkinOptions,
} from './helpers.js';
import { LineBreakStrategy } from '../../../../src/core/klimt/LineBreakStrategy.js';

interface MakeOptions {
  leafType?: LeafType;
  ports?: readonly string[];
  styleOverrides?: Partial<BodyEnhanced1StyleValues>;
  skinOptions?: SkinOptions;
}

function makeBody(rawBody: readonly (string | Member)[] | Display, options: MakeOptions = {}): BodyEnhanced1 {
  const styleValues: BodyEnhanced1StyleValues = {
    lineThickness: LINE_THICKNESS,
    minimumWidth: 0,
    titleConfig: TITLE_FONT,
    treeTableFontConfig: TREE_FONT,
    memberFontConfig: MEMBER_FONT,
    wrapWidth: LineBreakStrategy.NONE,
    ...options.styleOverrides,
  };
  return new BodyEnhanced1(
    rawBody,
    { skinParam: fakeSkin(options.skinOptions), align: HorizontalAlignment.LEFT },
    fakeLeaf(options.leafType ?? LeafType.CLASS, options.ports ?? []),
    styleValues,
    unitOps(),
  );
}

describe('constructor overload split (java:78-109)', () => {
  it('List ctor is lineFirst: the first compartment gets the "_" separator (java:131) — +8 height', () => {
    // 'alpha' (5 chars = 10) + marginX 12; LineBefore('_', withMargin(…,6,6,4,4)) -> +8 height
    const dim = makeBody(['alpha']).calculateDimension(sb);
    expect(dim.getWidth()).toBe(5 * CHAR_WIDTH + 12);
    expect(dim.getHeight()).toBe(LINE_HEIGHT + 8);
  });

  it('Display ctor is NOT lineFirst: separator starts at 0 — bare withMargin(6,6,0,0)', () => {
    const dim = makeBody(Display.create(['alpha'])).calculateDimension(sb);
    expect(dim.getWidth()).toBe(5 * CHAR_WIDTH + 12);
    expect(dim.getHeight()).toBe(LINE_HEIGHT);
  });
});

describe('getMarginX()=6 — THE folder-title margin (java:111-115; T6 narrowing #1)', () => {
  it('separator==0 decorates with withMargin(block, 6, 6, 0, 0): width - inner == 12, height unchanged', () => {
    const inner = 2 * CHAR_WIDTH; // 'bo'
    const dim = makeBody(Display.create(['bo', 'alpha'])).calculateDimension(sb);
    // width = max row ('alpha' = 10) + 6 left + 6 right; rows stacked, +0 vertical
    expect(dim.getWidth()).toBe(5 * CHAR_WIDTH + 12);
    expect(dim.getWidth()).toBeGreaterThan(inner); // the +12 is margin, not text
    expect(dim.getHeight()).toBe(2 * LINE_HEIGHT);
  });
});

describe('getArea separator loop (java:123-187)', () => {
  it('a bare "--" splits compartments: untitled TextBlockLineBefore adds +8, the hline itself 0 height (a2s-note-hline pin)', () => {
    const dim = makeBody(Display.create(['a', '--', 'b'])).calculateDimension(sb);
    // block1 = ('a'=2)+12 x 10; block2 = LineBefore(withMargin(2+12, 10+8))
    expect(dim.getWidth()).toBe(14);
    expect(dim.getHeight()).toBe(10 + 18);
  });

  it('a titled "__ T __" separator: title height enters as h/2+4 inside plus h/2 outside (decorate title branch)', () => {
    const sheetFonts: FontConfiguration[] = [];
    const dim = makeBody(Display.create(['a', '__ T __', 'b']), { skinOptions: { sheetFonts } }).calculateDimension(sb);
    // title 'T' = (2,10); block2 inner (2+12, 10+5+4)=(14,19); LineBefore atLeast(2+8,10);
    // outer +5 -> (14,24); block1 (14,10) -> vertical (14,34)
    expect(dim.getWidth()).toBe(14);
    expect(dim.getHeight()).toBe(34);
    // the title rendered with titleConfig, member rows with memberFontConfig
    expect(sheetFonts).toContain(TITLE_FONT);
    expect(sheetFonts).toContain(MEMBER_FONT);
  });

  it('bare separators of length <= 4 produce NO title (getTitle java guard)', () => {
    const bare = makeBody(Display.create(['a', '====', 'b'])).calculateDimension(sb);
    const titled = makeBody(Display.create(['a', '== t ==', 'b'])).calculateDimension(sb);
    expect(bare.getHeight()).toBe(28); // 10 + 18, no title contribution
    expect(titled.getHeight()).toBe(34); // +10 title height +(-4)… = 10+24
  });

  it('a table line renders one creole block with the tree/table font and the (10,10,0,5) table margin (java:143-158)', () => {
    const sheetFonts: FontConfiguration[] = [];
    const dim = makeBody(Display.create(['x', '|a|b|', 'y']), { skinOptions: { sheetFonts } }).calculateDimension(sb);
    // blocks: ('x')14x10; table '|a|b|' (5*2=10)+20 x 10+5; ('y')14x10
    expect(dim.getWidth()).toBe(30);
    expect(dim.getHeight()).toBe(35);
    expect(sheetFonts).toContain(TREE_FONT);
  });

  it('consecutive tree lines are un-indented by the FIRST line\'s leading whitespace and the run stops without eating the next line (buildTreeOrTable/purge, java:199-225)', () => {
    const dim = makeBody(Display.create(['  |_a', '  |_b', 'z'])).calculateDimension(sb);
    // block1 empty (12,0); tree run '|_a' + '|_b' joined -> 7 chars = 14 wide, no table margin;
    // 'z' survives as its own compartment (14,10)
    expect(dim.getWidth()).toBe(14);
    expect(dim.getHeight()).toBe(0 + 10 + 10);
  });

  it('a tree run ENDING the body exhausts the iterator (buildTreeOrTable java:207-216 tail) and still closes with a final empty compartment', () => {
    const dim = makeBody(Display.create(['x', '|_a', '|_b'])).calculateDimension(sb);
    // ('x')14x10; tree '|_a'+'|_b' joined 7 chars = 14x10; trailing empty (12,0)
    expect(dim.getWidth()).toBe(14);
    expect(dim.getHeight()).toBe(20);
  });

  it('purge leaves a line NOT sharing the first line\'s indent untouched (java:220-225 miss branch)', () => {
    const dim = makeBody(Display.create(['  |_a', ' |_b'])).calculateDimension(sb);
    // start='  ': '  |_a' -> '|_a' (3); ' |_b' does NOT start with '  ' -> kept (4);
    // joined '|_a  |_b' = 8 chars = 16 wide
    expect(dim.getWidth()).toBe(16);
    expect(dim.getHeight()).toBe(10);
  });

  it('minimumWidth > 0 wraps the area in withMinWidth (java:182-184)', () => {
    const dim = makeBody(Display.create(['a']), { styleOverrides: { minimumWidth: 100 } }).calculateDimension(sb);
    expect(dim.getWidth()).toBe(100);
    expect(dim.getHeight()).toBe(10);
  });
});

describe('usecase ellipse handling (java:100-105, 171-172)', () => {
  it('a LEADING separator in an ellipse leaf appends one blank line at construction', () => {
    const dim = makeBody(Display.create(['--']), { leafType: LeafType.USECASE }).calculateDimension(sb);
    // blocks: empty (12,0); then LineBefore over the appended '' row (0+12, 10+8)
    expect(dim.getWidth()).toBe(12);
    expect(dim.getHeight()).toBe(18);
  });

  it('an EMPTY ellipse body gets one blank row; a class body stays 0-height', () => {
    const usecase = makeBody(Display.empty(), { leafType: LeafType.USECASE }).calculateDimension(sb);
    expect(usecase.getWidth()).toBe(12);
    expect(usecase.getHeight()).toBe(LINE_HEIGHT);

    const clazz = makeBody(Display.empty(), { leafType: LeafType.CLASS }).calculateDimension(sb);
    expect(clazz.getWidth()).toBe(12);
    expect(clazz.getHeight()).toBe(0);
  });
});

describe('urls + memoization (java:127, 124-125, 163-166, 236-238)', () => {
  it('collects Member urls during getArea; the memoized area never re-collects', () => {
    const member = Member.field('name [[[http://x]]]');
    const body = makeBody([member]);
    expect(body.getUrls()).toHaveLength(0); // not measured yet
    body.calculateDimension(sb);
    expect(body.getUrls()).toHaveLength(1);
    expect(body.getUrls()[0]!.getUrl()).toBe('http://x');
    body.calculateDimension(sb);
    expect(body.getUrls()).toHaveLength(1); // area memoized (java:124-125)
  });
});

describe('getPorts/getInnerPosition through the decorated stack (java:227-243; SI1/T9 closure pull: TextBlockMarged/TextBlockVertical WithPorts)', () => {
  const rawBody: readonly (string | Member)[] = [Member.field('alpha', false), '--', Member.field('beta', false)];

  it('ports translate through Marged(top) and Vertical(y): alpha@4, beta@4+18', () => {
    const body = makeBody(rawBody, { ports: ['alpha', 'beta'] });
    const ports = body.getPorts(sb).getAllPortGeometry();
    expect(ports).toHaveLength(2);
    // block1 LineBefore('_')->Marged top 4: alpha row y0 -> 4; block1 height 18
    expect(ports[0]!.getId()).toBe(Ports.encodePortNameToId('alpha'));
    expect(ports[0]!.getPosition()).toBe(4);
    expect(ports[0]!.getHeight()).toBe(LINE_HEIGHT);
    // block2 Marged top 4, vertical offset 18 -> 22
    expect(ports[1]!.getId()).toBe(Ports.encodePortNameToId('beta'));
    expect(ports[1]!.getPosition()).toBe(22);
    expect(ports[1]!.getHeight()).toBe(LINE_HEIGHT);
  });

  it('getInnerPosition finds a member in a later compartment, translated by (left, top) + vertical offset', () => {
    const body = makeBody(rawBody);
    const alpha = body.getInnerPosition('alpha', sb);
    expect(alpha).toBeDefined();
    expect(alpha!.getX()).toBe(6);
    expect(alpha!.getY()).toBe(4);
    const beta = body.getInnerPosition('beta', sb);
    expect(beta).toBeDefined();
    expect(beta!.getX()).toBe(6);
    expect(beta!.getY()).toBe(22);
    expect(beta!.getWidth()).toBe(4 * CHAR_WIDTH);
    expect(beta!.getHeight()).toBe(LINE_HEIGHT);
    expect(body.getInnerPosition('nope', sb)).toBeUndefined();
  });

  it('a single-compartment area delegates straight to the LineBefore stack (blocks.length==1, java:177-178)', () => {
    const body = makeBody([Member.field('alpha', false)], {
      ports: ['alpha'],
      // present-but-unconsumed on the sizing path: covers the optional
      // resolveVisibilityStyle forwarding into MethodsOrFieldsArea
      styleOverrides: { resolveVisibilityStyle: () => ({ lineColor: '#000000', backGroundColor: '#ffffff' }) },
    });
    const ports = body.getPorts(sb).getAllPortGeometry();
    expect(ports).toHaveLength(1);
    expect(ports[0]!.getPosition()).toBe(4); // Marged top 4 only, no vertical offset
  });

  it('a withMinWidth-wrapped area reports NO ports — upstream TextBlockMinWidth is not WithPorts (java:232-233 fallback)', () => {
    const body = makeBody([Member.field('alpha', false)], { ports: ['alpha'], styleOverrides: { minimumWidth: 100 } });
    expect(body.getPorts(sb).getAllPortGeometry()).toHaveLength(0);
  });
});

describe('rawBody Display element identity', () => {
  it('Member rows keep identity through Display.create (T8: no coercion via asList)', () => {
    const member = Member.field('m : int');
    const elements: readonly DisplayElement[] = Display.create([member]).asList();
    expect(elements[0]).toBe(member);
  });
});
