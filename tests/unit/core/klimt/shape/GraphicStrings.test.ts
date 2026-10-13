/**
 * `GraphicStrings` (klimt/shape/GraphicStrings.java): the creole block inside
 * its 5px margin (java:63), the image placements (java:153-191), the
 * factories' fonts/colours/modes (java:81-128).
 *
 * Page-level jar pins (welcome, license) live in
 * `tests/unit/core/PlainStringsDiagram.test.ts`.
 */
import { describe, expect, it } from 'vitest';
import type { RasterImage } from '../../../../../src/core/error/raster-image.js';
import { ColorMapper } from '../../../../../src/core/klimt/color/ColorMapper.js';
import type { HColorOrPaint } from '../../../../../src/core/klimt/color/ColorMapper.js';
import { ClockwiseTopRightBottomLeft } from '../../../../../src/core/klimt/geom/ClockwiseTopRightBottomLeft.js';
import { GraphicPosition } from '../../../../../src/core/klimt/geom/GraphicPosition.js';
import { GraphicStrings } from '../../../../../src/core/klimt/shape/GraphicStrings.js';
import type { TextBlock } from '../../../../../src/core/klimt/shape/TextBlock.js';
import { DeterministicMeasurer } from '../../../../../src/core/measurer-deterministic.js';
import { Margins, ShapeType } from '../../../../../src/core/svek/image/EntityImageDescriptionSupport.js';
import { DEFAULT_SVG_DECIMALS, formatDecimal } from '../../../../../src/core/svg-format.js';
import { exportTo, stringBounderFor } from '../../../../../src/core/UgDiagram.js';

const measurer = new DeterministicMeasurer();
const stringBounder = stringBounderFor(measurer);

/** A 40x20 raster: dims are what the SVG carries. */
const IMG: RasterImage = { width: 40, height: 20, href: 'data:image/png;base64,AAAA' };

/** The block exported with no margin, its own back colour as the canvas. */
function svgOf(block: TextBlock): string {
  const backcolor = (block as GraphicStrings).getBackcolor() as HColorOrPaint;
  return exportTo(
    {
      textBlock: block,
      backcolor,
      margin: ClockwiseTopRightBottomLeft.same(0),
      scale: undefined,
      colorMapper: ColorMapper.IDENTITY,
      isHandwritten: false,
    },
    stringBounder,
    measurer,
  );
}

function dims(block: TextBlock): [number, number] {
  const d = block.calculateDimension(stringBounder);
  return [d.getWidth(), d.getHeight()];
}

/** A coordinate as the SVG prints it (`SvgGraphics#format`, 3 decimals). */
function printed(n: number): number {
  return Number(formatDecimal(n, DEFAULT_SVG_DECIMALS));
}

/** `x`, `y`, `width`, `height` of the one `<image>`. */
function imageBox(svg: string): number[] {
  const tag = /<image [^>]*>/.exec(svg)?.[0] ?? '';
  return ['x', 'y', 'width', 'height'].map((a) => Number(new RegExp(` ${a}="([^"]*)"`).exec(tag)?.[1]));
}

describe('GraphicStrings.createBlackOnWhite(strings) (java:105-107)', () => {
  const block = GraphicStrings.createBlackOnWhite(['Hello', 'World!']);
  const [w, h] = dims(block);

  it('is the creole block plus the 5px margin on every side (java:174-177)', () => {
    const hello = measurer.measure('Hello', { family: 'sans-serif', size: 12, weight: 'normal', style: 'normal' });
    const world = measurer.measure('World!', { family: 'sans-serif', size: 12, weight: 'normal', style: 'normal' });
    expect(w).toBeCloseTo(Math.max(hello.width, world.width) + 10, 9);
    expect(h).toBe(2 * 12 + 10);
  });

  it('draws the text translated by the margin, sans-serif 12 black (java:118-120, :153-156)', () => {
    const svg = svgOf(block);
    expect(svg).toContain('<text x="5" y="14.333" fill="#000" font-size="12"');
    expect(svg).toContain('<text x="5" y="26.333" fill="#000" font-size="12"');
  });

  it('is white-backed (java:106), the export canvas colour', () => {
    expect(svgOf(block)).toContain('background:#FFFFFF;');
  });

  it('reads creole FULL: __x__ underlines', () => {
    expect(svgOf(GraphicStrings.createBlackOnWhite(['__a__ b']))).toContain('text-decoration="underline">a</text>');
  });

  it('memoizes its dimension per string bounder (TextBlockMemoized)', () => {
    expect(block.calculateDimension(stringBounder)).toBe(block.calculateDimension(stringBounder));
  });
});

describe('GraphicStrings.createBlackOnWhite(strings, image, position) (java:113-116)', () => {
  const text = GraphicStrings.createBlackOnWhite(['Hello']);
  const [tw, th] = dims(text);

  it('reads creole FULL_BUT_UNDERSCORE: __x__ stays literal, even with no image', () => {
    expect(svgOf(GraphicStrings.createBlackOnWhite(['__a__ b'], undefined, undefined))).toContain('>__a__ b</text>');
  });

  it('BACKGROUND_CORNER_BOTTOM_RIGHT: wider by imagePadding 30 + image, image in the bottom-right corner', () => {
    const block = GraphicStrings.createBlackOnWhite(['Hello'], IMG, GraphicPosition.BACKGROUND_CORNER_BOTTOM_RIGHT);
    const [w, h] = dims(block);
    expect([w, h]).toEqual([tw + 30 + 40, th]);
    // size = dim - 2*margin; origin = margin + (size.w - img.w, size.h - img.h)
    expect(imageBox(svgOf(block))).toEqual([printed(5 + (w - 10 - 40)), 5 + (h - 10 - 20), 40, 20]);
  });

  it('BACKGROUND_CORNER_TOP_RIGHT: same width, image one pixel in from the top-right', () => {
    const block = GraphicStrings.createBlackOnWhite(['Hello'], IMG, GraphicPosition.BACKGROUND_CORNER_TOP_RIGHT);
    const [w, h] = dims(block);
    expect([w, h]).toEqual([tw + 30 + 40, th]);
    expect(imageBox(svgOf(block))).toEqual([printed(5 + (w - 10 - 40 - 1)), 5 + 1, 40, 20]);
  });

  it('BOTTOM: taller by the image, image centred under the text', () => {
    const block = GraphicStrings.createBlackOnWhite(['Hello'], IMG, GraphicPosition.BOTTOM);
    const [w, h] = dims(block);
    expect([w, h]).toEqual([tw, th + 20]);
    expect(imageBox(svgOf(block))).toEqual([printed(5 + (w - 10 - 40) / 2), 5 + (h - 10 - 20), 40, 20]);
  });

  it('an image without a position is neither sized nor drawn (java:157-170, :181-188)', () => {
    const block = GraphicStrings.createBlackOnWhite(['Hello'], IMG, undefined);
    expect(dims(block)).toEqual([tw, th]);
    expect(svgOf(block)).not.toContain('<image');
  });
});

describe('the monospaced factories', () => {
  it('createBlackOnWhiteMonospaced: monospace 14 black on white (java:109-111, :126-128)', () => {
    const svg = svgOf(GraphicStrings.createBlackOnWhiteMonospaced(['x y']));
    expect(svg).toContain(
      '<text x="5" y="15.889" fill="#000" font-size="14" textLength="17.85" font-family="monospace">',
    );
    expect(svg).toContain('background:#FFFFFF;');
  });

  it('createGreenOnBlackMonospaced: monospace 14 #00FF00 on black (java:100-103)', () => {
    const svg = svgOf(GraphicStrings.createGreenOnBlackMonospaced(['x y']));
    expect(svg).toContain('fill="#0F0" font-size="14"');
    expect(svg).toContain('background:#000000;');
  });
});

describe('GraphicStrings.createForError (java:81-98)', () => {
  it('is a crash image, backed RED_LIGHT when red, black otherwise', () => {
    const red = GraphicStrings.createForError(['boom'], true);
    const green = GraphicStrings.createForError(['boom'], false);
    expect(red.isCrash()).toBe(true);
    expect(red.getBackcolor().asString()).toBe('#FEF6F3');
    expect(green.getBackcolor().asString()).toBe('#000000');
  });

  it('needs TextBlockRaw (CreoleMode.NO_CREOLE), unported: measuring it throws', () => {
    expect(() => GraphicStrings.createForError(['boom'], true).calculateDimension(stringBounder)).toThrow(
      'TextBlockRaw (CreoleMode.NO_CREOLE) is not ported',
    );
  });
});

describe('the IEntityImage members (java:193-216)', () => {
  const block = GraphicStrings.createBlackOnWhite(['x']) as GraphicStrings;

  it('is a rectangle with no shield, never hidden, no overscan, not a crash', () => {
    expect(block.getShapeType()).toBe(ShapeType.RECTANGLE);
    expect(block.getShield(stringBounder)).toBe(Margins.NONE);
    expect(block.isHidden()).toBe(false);
    expect(block.getOverscanX(stringBounder)).toBe(0);
    expect(block.isCrash()).toBe(false);
  });
});
