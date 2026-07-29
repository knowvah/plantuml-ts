/**
 * BodyEnhancedAbstract.test.ts — T2a: coverage for the newly-ported
 * `src/core/cucadiagram/BodyEnhancedAbstract.ts`, focused on `decorate`'s
 * three branches (upstream `BodyEnhancedAbstract.java:106-118`) — the
 * geometry S1L-i and the class-side rewire both depend on.
 */
import { describe, expect, it } from 'vitest';
import type { TextBlock } from '../../../../src/core/klimt/shape/TextBlock.js';
import type { StringBounder } from '../../../../src/core/klimt/font/StringBounder.js';
import type { UGraphic } from '../../../../src/core/klimt/UGraphic.js';
import { XDimension2D } from '../../../../src/core/klimt/geom/XDimension2D.js';
import { TextBlockLineBefore } from '../../../../src/core/klimt/shape/TextBlockLineBefore.js';
import { BodyEnhancedAbstract } from '../../../../src/core/cucadiagram/BodyEnhancedAbstract.js';

const stubStringBounder: StringBounder = { calculateDimension: () => new XDimension2D(0, 0) };

function fixedBlock(width: number, height: number): TextBlock {
  return {
    calculateDimension: () => new XDimension2D(width, height),
    drawU: (): void => {
      // no-op sink -- these tests exercise geometry only.
    },
  };
}

/** Minimal concrete subclass exposing `decorate`/`getDefaultThickness`
 *  for direct testing -- mirrors how T2b's `BodyEnhanced1`/`BodyEnhanced2`
 *  will supply `getArea`/`getMarginX`. */
class TestBody extends BodyEnhancedAbstract {
  constructor(
    defaultThickness: number,
    private readonly marginX: number,
    private readonly area: TextBlock,
  ) {
    super(defaultThickness);
  }

  protected getArea(): TextBlock {
    return this.area;
  }

  protected getMarginX(): number {
    return this.marginX;
  }

  callDecorate(
    block: TextBlock,
    separator: string | 0,
    title: TextBlock | undefined,
    sb: StringBounder,
  ): TextBlock {
    return this.decorate(block, separator, title, sb);
  }
}

describe('BodyEnhancedAbstract.isBlockSeparator (Java:67-82, static)', () => {
  it.each([
    ['--sep--', true],
    ['==sep==', true],
    ['..sep..', true],
    ['...', false],
    ['__sep__', true],
    ['plain text', false],
    ['--', true],
  ])('isBlockSeparator(%s) === %s', (input, expected) => {
    expect(BodyEnhancedAbstract.isBlockSeparator(input)).toBe(expected);
  });
});

describe('BodyEnhancedAbstract.calculateDimension / drawU delegate to getArea', () => {
  it('calculateDimension delegates to getArea(sb).calculateDimension(sb)', () => {
    const body = new TestBody(0.5, 6, fixedBlock(40, 20));
    expect(body.calculateDimension(stubStringBounder)).toEqual(new XDimension2D(40, 20));
  });

  it('drawU delegates to getArea(ug.getStringBounder()).drawU(ug)', () => {
    let drawn = false;
    const area: TextBlock = {
      calculateDimension: () => new XDimension2D(0, 0),
      drawU: () => {
        drawn = true;
      },
    };
    const body = new TestBody(0.5, 6, area);
    const ug: UGraphic = {
      apply: () => ug,
      draw: () => undefined,
      getParam: () => ({
        getStroke: () => {
          throw new Error('not needed');
        },
        getColor: () => 'none',
        getBackcolor: () => 'none',
        getTranslate: () => {
          throw new Error('not needed');
        },
      }),
      getTranslate: () => {
        throw new Error('not needed');
      },
      getStringBounder: () => stubStringBounder,
    };
    body.drawU(ug);
    expect(drawn).toBe(true);
  });
});

describe("BodyEnhancedAbstract.decorate — separator === 0 (Java:108-109: withMargin(block, marginX, 0))", () => {
  it('applies LEFT+RIGHT margin only, height unchanged (2-arg Java overload: marginX->L/R, 0->T/B)', () => {
    const body = new TestBody(0.5, 6, fixedBlock(0, 0));
    const block = fixedBlock(50, 20);
    const result = body.callDecorate(block, 0, undefined, stubStringBounder);
    // marginX=6 both sides: width 50+6+6=62; height unchanged (top=bottom=0).
    expect(result.calculateDimension(stubStringBounder)).toEqual(new XDimension2D(62, 20));
  });
});

describe('BodyEnhancedAbstract.decorate — separator set, no title (Java:111-113)', () => {
  it('wraps in TextBlockLineBefore(thickness, withMargin(block, marginX, marginX, 4, 4), separator)', () => {
    const body = new TestBody(0.5, 6, fixedBlock(0, 0));
    const block = fixedBlock(50, 20);
    const result = body.callDecorate(block, '-', undefined, stubStringBounder);
    expect(result).toBeInstanceOf(TextBlockLineBefore);
    // inner margin: width 50+6+6=62; height 20+4+4=28 (top=bottom=4). No
    // title -> TextBlockLineBefore.calculateDimension returns inner dim
    // unchanged (no atLeast floor).
    expect(result.calculateDimension(stubStringBounder)).toEqual(new XDimension2D(62, 28));
  });
});

describe('BodyEnhancedAbstract.decorate — separator + title (Java:115-118)', () => {
  it('reproduces the dimTitle.height/2 offsets exactly', () => {
    const body = new TestBody(0.5, 6, fixedBlock(0, 0));
    const block = fixedBlock(50, 20);
    const title = fixedBlock(30, 10); // dimTitleHeight = 10
    const result = body.callDecorate(block, '-', title, stubStringBounder);
    // inner = withMargin(block, marginX=6, 6, dimTitle.height/2=5, 4):
    //   width = 50+6+6 = 62; height = 20+5+4 = 29
    // raw = TextBlockLineBefore(...).calculateDimension =
    //   inner.atLeast(title.width+8=38, title.height=10) -> (62,29) unchanged
    //   (62 > 38 and 29 > 10, both floors already cleared).
    // final = withMargin(raw, 0, 0, dimTitle.height/2=5, 0):
    //   width = 62; height = 29+5 = 34
    expect(result.calculateDimension(stubStringBounder)).toEqual(new XDimension2D(62, 34));
  });

  it("the raw TextBlockLineBefore's own atLeast floor binds when title is wide", () => {
    const body = new TestBody(0.5, 6, fixedBlock(0, 0));
    const block = fixedBlock(10, 4); // small content
    const title = fixedBlock(100, 10); // wide title: floor should bind on width
    const result = body.callDecorate(block, '-', title, stubStringBounder);
    // inner = withMargin(block, 6, 6, 5, 4): width=10+12=22; height=4+5+4=13
    // raw = inner.atLeast(100+8=108, 10) -> width floors to 108 (108>22),
    //   height stays 13 (13>10, unaffected).
    // final = withMargin(raw, 0, 0, 5, 0): width=108; height=13+5=18
    expect(result.calculateDimension(stubStringBounder)).toEqual(new XDimension2D(108, 18));
  });
});
