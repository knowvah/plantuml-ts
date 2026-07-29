/**
 * BodyEnhanced2.test.ts — T2b-1: coverage for `src/core/cucadiagram/
 * BodyEnhanced2.ts` + `BodyFactory.create3`.
 *
 * Uses a real (non-mocked) `SheetBuilder`/`AtomOps` pair -- one text stripe
 * per joined display line, `CHAR_WIDTH`/`LINE_HEIGHT`-per-character sizing
 * -- matching `Display.test.ts`'s own established `realSheetBuilder`/
 * `unitOps` pattern, so `getArea`'s separator loop and `decorate`'s margin
 * arithmetic are exercised end to end through the REAL `Display.create9`/
 * `SheetBlock1`/`SheetBlock2` chain, not a stubbed `getTextBlock`.
 */
import { describe, expect, it } from 'vitest';
import { Display } from '../../../../src/core/klimt/creole/Display.js';
import { Sheet } from '../../../../src/core/klimt/creole/Sheet.js';
import type { Stripe } from '../../../../src/core/klimt/creole/Stripe.js';
import type { CreoleAtom } from '../../../../src/core/klimt/creole/atom/Atom.js';
import type { SheetBuilder, DisplayLike } from '../../../../src/core/klimt/creole/SheetBuilder.js';
import type { AtomOps } from '../../../../src/core/klimt/creole/Sea.js';
import type { ISkinSimple } from '../../../../src/core/style/ISkinSimple.js';
import type { StringBounder } from '../../../../src/core/klimt/font/StringBounder.js';
import type { FontConfiguration } from '../../../../src/core/klimt/shape/UText.js';
import { HorizontalAlignment } from '../../../../src/core/klimt/geom/HorizontalAlignment.js';
import { ClockwiseTopRightBottomLeft } from '../../../../src/core/klimt/geom/ClockwiseTopRightBottomLeft.js';
import { XDimension2D } from '../../../../src/core/klimt/geom/XDimension2D.js';
import { LineBreakStrategy } from '../../../../src/core/klimt/LineBreakStrategy.js';
import { Pragma } from '../../../../src/core/skin/Pragma.js';
import { BodyEnhanced2, type BodyEnhanced2Config, type BodyEnhanced2StyleValues } from '../../../../src/core/cucadiagram/BodyEnhanced2.js';
import { BodyFactory } from '../../../../src/core/cucadiagram/BodyFactory.js';

const CHAR_WIDTH = 2;
const LINE_HEIGHT = 10;
const FONT: FontConfiguration = { family: 'sans-serif', size: 12, color: '#000000', styles: new Set() };

class FakeStringBounder implements StringBounder {
  calculateDimension(): XDimension2D {
    return new XDimension2D(0, 0);
  }
}
const sb: StringBounder = new FakeStringBounder();

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

/** One text stripe joining every line by a space; an EMPTY display
 *  produces a sheet with ZERO stripes (dimension (0,0) via `SheetBlock1`'s
 *  `MinMax.getEmpty(true)` path) -- matching `Display.test.ts`'s
 *  `realSheetBuilder`, specialized for the empty case this task's
 *  `separator === 0` / bare-separator-with-no-title branches both hit. */
function realSheetBuilder(): SheetBuilder {
  return {
    createSheet(display: DisplayLike) {
      const sheet = new Sheet(HorizontalAlignment.LEFT);
      const lines = [...display];
      if (lines.length === 0) return sheet;
      const text = lines.map((line) => (typeof line === 'string' ? line : line.toString())).join(' ');
      const atom: CreoleAtom = { kind: 'text', text, font: FONT };
      const stripe: Stripe = { getLHeader: () => null, getAtoms: () => [atom] };
      sheet.add(stripe);
      return sheet;
    },
  };
}

function fakeSkin(): ISkinSimple {
  return {
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
    sheet: () => realSheetBuilder(),
  };
}

function makeConfig(): BodyEnhanced2Config {
  return { skinParam: fakeSkin(), align: HorizontalAlignment.LEFT, titleConfig: FONT, lineBreakStrategy: LineBreakStrategy.NONE };
}

function makeStyleValues(minimumWidth = 0): BodyEnhanced2StyleValues {
  return { defaultThickness: 0.5, minimumWidth };
}

function makeBody(lines: readonly string[], minimumWidth = 0): BodyEnhanced2 {
  return new BodyEnhanced2(Display.create(lines), makeConfig(), makeStyleValues(minimumWidth), unitOps());
}

describe('BodyEnhanced2.getMarginX (java:72-75)', () => {
  it('returns 0 -- the subclass this task ports, distinct from BodyEnhanced1.getMarginX() = 6', () => {
    class ExposedBody extends BodyEnhanced2 {
      exposeMarginX(): number {
        // getMarginX is `protected` on BodyEnhancedAbstract -- reachable
        // from a subclass, matching BodyEnhancedAbstract.test.ts's own
        // TestBody exposure pattern.
        return (this as unknown as { getMarginX(): number }).getMarginX();
      }
    }
    const body = new ExposedBody(Display.empty(), makeConfig(), makeStyleValues(), unitOps());
    expect(body.exposeMarginX()).toBe(0);
  });
});

describe('BodyEnhanced2.getArea -- separator loop (java:77-119, ADR-4)', () => {
  it('no separators: a single block, no TextBlockVertical wrapping (blocks.size() == 1 branch, java:109-110)', () => {
    const body = makeBody(['content']);
    // 'content' = 7 chars * 2 = 14 wide, 10 tall; marginX=0 -> decorate's
    // separator===0 branch (java:107-108) returns the block unchanged.
    expect(body.calculateDimension(sb)).toEqual(new XDimension2D(14, 10));
  });

  it('one bare separator, no title: TextBlockVertical of 2 decorated blocks (java:95-99, 111-113)', () => {
    const body = makeBody(['AAAA', '--', 'BB']);
    // Block 1: 'AAAA' (4*2=8 wide, 10 tall), separator=0 -> unchanged (8,10).
    // Block 2: 'BB' (2*2=4 wide, 10 tall), separator='-', no title (java:98
    //   getTitle('--') -- length 2 <= 4 -> undefined) -> TextBlockLineBefore
    //   wraps withMargin(block, marginX=0, 0, 4, 4): width 4+0+0=4, height
    //   10+4+4=18; no title -> TextBlockLineBefore.calculateDimension
    //   returns the inner dim unchanged (BodyEnhancedAbstract.test.ts's own
    //   established math) -> (4, 18).
    // TextBlockVertical.mergeTB: width = max(8,4) = 8; height = 10+18 = 28.
    expect(body.calculateDimension(sb)).toEqual(new XDimension2D(8, 28));
  });

  it('titled separator: LEFT=marginX=0, RIGHT=literal 6 -- the ASYMMETRIC branch (java:98,114-118)', () => {
    const body = makeBody(['==Title==', 'content']);
    // Block 1: separator=0 (initial), empty display -> getTextBlock(empty)
    //   is a ZERO-stripe sheet -> dimension (0,0); decorate leaves it
    //   unchanged (marginX=0, separator===0 branch) -> (0,0).
    // title = getTitle('==Title==') -- length 9 > 4 -> trin(slice(2,7)) =
    //   'Title' -> a REAL 1-line TextBlock via the same sheet pipeline:
    //   5 chars * 2 = 10 wide, 10 tall -- dimTitle = (10,10).
    // Block 2: 'content' (7*2=14 wide, 10 tall), separator='=', title set:
    //   inner = withMargin(block, marginX=0, 6, dimTitle.height/2=5, 4):
    //     width = 14+0+6 = 20; height = 10+5+4 = 19.
    //   raw = TextBlockLineBefore(...).calculateDimension =
    //     inner.atLeast(title.width+8=18, title.height=10) -> (20,19)
    //     unchanged (20>18, 19>10, both floors already cleared).
    //   final = withMargin(raw, 0, 0, dimTitle.height/2=5, 0):
    //     width=20 (unchanged); height=19+5=24.
    // TextBlockVertical.mergeTB(block1=(0,0), block2=(20,24)):
    //   width=max(0,20)=20; height=0+24=24.
    //
    // This numerically DISTINGUISHES the asymmetric formula from both
    // alternatives it could be confused with: a fully-symmetric marginX=0
    // (0 both sides) would give width 14 (content unchanged); a
    // BodyEnhanced1-style symmetric marginX=6 (6 both sides) would give
    // width 14+6+6=26. The actual 20 = 14+0(left)+6(right) is neither --
    // it is upstream's OWN asymmetry (literal `6` on decorate's title
    // branch, `BodyEnhancedAbstract.ts:120`), reproduced as-is, not
    // smoothed to symmetric.
    expect(body.calculateDimension(sb)).toEqual(new XDimension2D(20, 24));
  });

  it('getTitle trims leading/trailing whitespace via trin (StringUtils.trin, java:56-62)', () => {
    const body = makeBody(['==  Padded  ==', 'z']);
    // title = trin('  Padded  ') = 'Padded' (6 chars * 2 = 12 wide, 10
    // tall) -- the leading/trailing-space trim loop bodies actually run
    // here, unlike the untrimmed 'Title' case above.
    // Block1 (separator=0, empty) = (0,0).
    // Block2: 'z' (1*2=2 wide, 10 tall); inner = withMargin(block, 0, 6,
    //   dimTitle.height/2=5, 4): width=2+0+6=8; height=10+5+4=19.
    //   raw.calculateDimension = inner.atLeast(title.width+8=20, 10) ->
    //   width floors to 20 (20>8, the atLeast floor BINDS here, unlike the
    //   untrimmed-title case above); height stays 19 (19>10).
    //   final = withMargin(raw, 0, 0, 5, 0): width=20; height=19+5=24.
    // Vertical merge: width=max(0,20)=20; height=0+24=24.
    expect(body.calculateDimension(sb)).toEqual(new XDimension2D(20, 24));
  });

  it('a separator with content before AND after it (no title) still produces the TextBlockLineBefore-wrapped 2nd block', () => {
    // Block1 (separator=0, 'lead' = 4*2=8 wide/10 tall) unchanged (8,10);
    // Block2 ('--' consumed as separator, no title (length 2 <= 4) ->
    // TextBlockLineBefore, content 'content' 14 wide/10 tall ->
    // withMargin(0,0,4,4) = (14,18) -> no title -> unchanged (14,18)).
    // Vertical merge: width=max(8,14)=14; height=10+18=28.
    const body = makeBody(['lead', '--', 'content']);
    expect(body.calculateDimension(sb)).toEqual(new XDimension2D(14, 28));
  });
});

describe('BodyEnhanced2.getArea -- embedded diagram handling (java:91-94, addOneSingleLineManageEmbedded2)', () => {
  it('appends the OUTER closing "}}" line too -- distinct from EmbeddedDiagram.createAndSkip, which swallows it', () => {
    const body = makeBody(['{{salt', 'x', '}}']);
    // All 3 lines end up in ONE Display (no separator anywhere), joined by
    // realSheetBuilder as '{{salt x }}' -- 11 characters (6+1+1+1+2).
    // If the outer "}}" were swallowed (createAndSkip's own behavior),
    // the joined text would be '{{salt x' (8 chars, width 16) instead.
    expect(body.calculateDimension(sb)).toEqual(new XDimension2D(11 * CHAR_WIDTH, LINE_HEIGHT));
  });

  it('a NESTED embedded close ("}}" that only decrements nested > 0) is ALSO appended', () => {
    const body = makeBody(['{{salt', '{{creole', 'y', '}}', 'z', '}}']);
    // nested starts at 1 on entry to addOneSingleLineManageEmbedded2 (java:
    // 121-134): '{{creole' -> nested=2; 'y' -> no change; '}}' -> nested=1
    // (NOT zero, so the loop continues per this method's own algorithm,
    // and this element WAS appended before the check ran, java:127); 'z'
    // -> no change; '}}' -> nested=0 -> stop (also appended). Every one of
    // the 6 lines ends up in the display: '{{salt {{creole y }} z }}' = 26
    // characters (6+1+8+1+1+1+2+1+1+1+2 = 25 -- recount precisely below).
    const joined = '{{salt {{creole y }} z }}';
    expect(joined.length).toBe(25);
    expect(body.calculateDimension(sb)).toEqual(new XDimension2D(25 * CHAR_WIDTH, LINE_HEIGHT));
  });

  it('an UNTERMINATED embedded block (no closing "}}" anywhere) returns whatever was collected -- matches Java iterating to exhaustion', () => {
    const body = makeBody(['{{salt', 'x']);
    // The consuming loop never finds nested === 0 (no '}}' at all), so it
    // runs off the end of `elements` and returns the accumulated display
    // unchanged -- java's own `while (it.hasNext())` loop does the exact
    // same thing when the iterator is exhausted first. Joined: '{{salt x'
    // = 8 characters.
    expect(body.calculateDimension(sb)).toEqual(new XDimension2D(8 * CHAR_WIDTH, LINE_HEIGHT));
  });

  it('a closing "}}" surrounded by whitespace still matches via trim2 (StringUtils.trim2, java:127-130)', () => {
    const body = makeBody(['{{salt', 'x', '  }}  ']);
    // trim2('  }}  ') === '}}' (StringUtils.trim2's own whitespace-trim
    // loop bodies run here, unlike the exact-match '}}' case above) ->
    // nesting closes at this element (also appended, per this method's
    // own "add before check" order). Joined: '{{salt x   }}  ' = 15 chars.
    expect(body.calculateDimension(sb)).toEqual(new XDimension2D(15 * CHAR_WIDTH, LINE_HEIGHT));
  });
});

describe('BodyEnhanced2.getArea -- MinimumWidth (java:114-116)', () => {
  it('minimumWidth > 0 wraps the final area in TextBlockUtils.withMinWidth', () => {
    const body = makeBody(['AB'], 100);
    // 'AB' = 2*2=4 wide, 10 tall; single block (no wrap) -> (4,10); then
    // withMinWidth(area, 100, LEFT).calculateDimension = dim.atLeast(100,0)
    // -> width floors to 100, height stays 10.
    expect(body.calculateDimension(sb)).toEqual(new XDimension2D(100, 10));
  });

  it('minimumWidth == 0 (default) leaves the area unwrapped', () => {
    const body = makeBody(['AB'], 0);
    expect(body.calculateDimension(sb)).toEqual(new XDimension2D(4, 10));
  });
});

describe('BodyEnhanced2 -- memoization (java:79-80 area field, reimplemented per-subclass)', () => {
  it('getArea is computed once; a second calculateDimension call returns the SAME memoized area', () => {
    const body = makeBody(['content']);
    const first = body.calculateDimension(sb);
    const second = body.calculateDimension(sb);
    expect(second).toEqual(first);
  });
});

describe('BodyFactory.create3 (java:78-81)', () => {
  it('constructs a real BodyEnhanced2 wired identically to the direct constructor', () => {
    const rawBody = Display.create(['content']);
    const viaFactory = BodyFactory.create3(rawBody, makeConfig(), makeStyleValues(), unitOps());
    expect(viaFactory).toBeInstanceOf(BodyEnhanced2);
    expect(viaFactory.calculateDimension(sb)).toEqual(new XDimension2D(14, 10));
  });
});

