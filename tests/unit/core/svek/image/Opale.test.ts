/**
 * Opale.test.ts — cdd3-T15 (C-15 = E3-19): `resolveOpaleConnector`'s
 * bezier-count guard.
 *
 * `SvekEdge.java:769-770` `if (isOpalisable() == false) setOpale(false);`
 * and `:804-806` `private boolean isOpalisable() { return
 * dotPath.getBeziers().size() <= 1; }` — a note connector is only merged
 * into the note's own Opale outline when its routed graphviz spline is a
 * SINGLE bezier. `DotPath#addCurve` (`klimt/shape/DotPath.java:112-124`)
 * appends 4 points for the first bezier, then 3 more per additional bezier
 * (each shares the previous curve's endpoint), so `points = 3*beziers + 1`
 * — `beziers <= 1` is exactly `points <= 4`.
 */
import { describe, expect, it } from 'vitest';
import { Direction } from '../../../../../src/core/abel/Direction.js';
import { Back } from '../../../../../src/core/klimt/Back.js';
import { Fore } from '../../../../../src/core/klimt/Fore.js';
import type { UChange } from '../../../../../src/core/klimt/UChange.js';
import type { UGraphic } from '../../../../../src/core/klimt/UGraphic.js';
import type { UParam } from '../../../../../src/core/klimt/UParam.js';
import type { UShape } from '../../../../../src/core/klimt/UShape.js';
import { UStroke } from '../../../../../src/core/klimt/UStroke.js';
import { UTranslate } from '../../../../../src/core/klimt/UTranslate.js';
import { HColorSimple } from '../../../../../src/core/klimt/color/HColorSimple.js';
import type { StringBounder } from '../../../../../src/core/klimt/font/StringBounder.js';
import { XDimension2D } from '../../../../../src/core/klimt/geom/XDimension2D.js';
import { XPoint2D } from '../../../../../src/core/klimt/geom/XPoint2D.js';
import type { TextBlock } from '../../../../../src/core/klimt/shape/TextBlock.js';
import type { UPath } from '../../../../../src/core/klimt/shape/UPath.js';
import { MeasurerStringBounder } from '../../../../../src/core/measurer-bounder.js';
import { DeterministicMeasurer } from '../../../../../src/core/measurer-deterministic.js';
import { Opale, resolveOpaleConnector } from '../../../../../src/core/svek/image/Opale.js';

const DIM = { width: 100, height: 40 };
const ORIGIN = { x: 0, y: 0 };

describe('resolveOpaleConnector — SvekEdge.java:769-770,804-806 bezier-count guard', () => {
  it('resolves a straight 2-point connector (0 beziers, 0 <= 1)', () => {
    const result = resolveOpaleConnector(DIM, ORIGIN, [
      { x: 0, y: 0 },
      { x: 100, y: 40 },
    ]);
    expect(result).not.toBeUndefined();
  });

  it('resolves a single-bezier 4-point connector (1 bezier, 1 <= 1)', () => {
    const result = resolveOpaleConnector(DIM, ORIGIN, [
      { x: 0, y: 0 },
      { x: 30, y: 10 },
      { x: 60, y: 20 },
      { x: 100, y: 40 },
    ]);
    expect(result).not.toBeUndefined();
  });

  it('rejects a two-bezier 7-point connector (2 beziers, 2 > 1) -- zepeki-75-pifo352, vudepo-27-cuvo793', () => {
    const result = resolveOpaleConnector(DIM, ORIGIN, [
      { x: 0, y: 0 },
      { x: 10, y: 5 },
      { x: 20, y: 10 },
      { x: 30, y: 15 },
      { x: 60, y: 25 },
      { x: 80, y: 32 },
      { x: 100, y: 40 },
    ]);
    expect(result).toBeUndefined();
  });

  it('rejects a three-bezier 10-point connector (3 beziers, 3 > 1)', () => {
    const points = Array.from({ length: 10 }, (_, i) => ({ x: i * 10, y: i * 4 }));
    expect(resolveOpaleConnector(DIM, ORIGIN, points)).toBeUndefined();
  });

  it('still rejects a degenerate 1-point connector (below the length-2 floor)', () => {
    expect(resolveOpaleConnector(DIM, ORIGIN, [{ x: 0, y: 0 }])).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// The Opale class (Opale.java:51-271)
// ---------------------------------------------------------------------------

const TEXT_W = 20;
const TEXT_H = 10;
// Opale.java:56-58: marginX1 6, marginX2 15, marginY 5 -> 20+6+15 = 41, 10+2*5 = 20 (:90-98)
const WIDTH = 41;
const HEIGHT = 20;
const SHADOW = 3;
const FILL = HColorSimple.create({ r: 255, g: 255, b: 204, a: 255 });
const BORDER = HColorSimple.create({ r: 1, g: 2, b: 3, a: 255 });

const bounder = new MeasurerStringBounder(new DeterministicMeasurer());

/** Records the changes applied to each drawn shape; the text block records its own translate. */
class Capture implements UGraphic {
  constructor(
    readonly log: { shape: UShape; changes: UChange[] }[] = [],
    readonly changes: UChange[] = [],
  ) {}
  apply(change: UChange): UGraphic {
    return new Capture(this.log, [...this.changes, change]);
  }
  draw(shape: UShape): void {
    this.log.push({ shape, changes: this.changes });
  }
  startUrl(): void {}
  closeUrl(): void {}
  getParam(): UParam {
    throw new Error('unused');
  }
  getTranslate(): UTranslate {
    return UTranslate.none();
  }
  getStringBounder(): StringBounder {
    return bounder;
  }
}

class StubText implements TextBlock {
  drawnAt: UChange[] | undefined;
  calculateDimension(): XDimension2D {
    return new XDimension2D(TEXT_W, TEXT_H);
  }
  drawU(ug: UGraphic): void {
    this.drawnAt = (ug as Capture).changes;
  }
}

function segments(path: UPath): string[] {
  return [...path.iterator()].map((s) => `${s.segmentType.slice(4)}(${s.coord.join(',')})`);
}

function makeOpale(withLink: boolean, stroke?: UStroke): { opale: Opale; text: StubText } {
  const text = new StubText();
  return { opale: new Opale(SHADOW, BORDER, FILL, text, withLink, stroke), text };
}

describe('Opale class -- size (Opale.java:90-106)', () => {
  it('adds marginX1 + marginX2 to the width and 2 * marginY to the height', () => {
    const dim = makeOpale(false).opale.calculateDimension(bounder);
    expect(dim.getWidth()).toBe(WIDTH);
    expect(dim.getHeight()).toBe(HEIGHT);
  });

  it('exposes marginX1 / marginX2 (java:56-57) and getMarginX1 (java:268-270)', () => {
    expect(Opale.marginX1).toBe(6);
    expect(Opale.marginX2).toBe(15);
    expect(makeOpale(false).opale.getMarginX1()).toBe(6);
  });
});

describe('Opale class -- static outlines (Opale.java:147-188)', () => {
  it('getPolygonNormal, roundCorner 0 (java:163-173)', () => {
    expect(segments(Opale.getPolygonNormal(WIDTH, HEIGHT, 0))).toEqual([
      'MOVETO(0,0)',
      'LINETO(0,20)',
      'LINETO(41,20)',
      'LINETO(41,10)',
      'LINETO(31,0)',
      'LINETO(0,0)',
    ]);
  });

  it('getPolygonNormal, rounded (java:174-186) uses arcs of radius roundCorner/2', () => {
    expect(segments(Opale.getPolygonNormal(WIDTH, HEIGHT, 4))).toEqual([
      'MOVETO(0,2)',
      'LINETO(0,18)',
      'ARCTO(2,2,0,0,0,2,20)',
      'LINETO(39,20)',
      'ARCTO(2,2,0,0,0,41,18)',
      'LINETO(41,10)',
      'LINETO(31,0)',
      'LINETO(2,0)',
      'ARCTO(2,2,0,0,0,0,2)',
    ]);
  });

  it('getCorner, roundCorner 0 (java:147-161)', () => {
    expect(segments(Opale.getCorner(WIDTH, 0))).toEqual([
      'MOVETO(31,0)',
      'LINETO(31,10)',
      'LINETO(41,10)',
      'LINETO(31,0)',
    ]);
  });

  it('getCorner, rounded: a quarter-roundCorner arc', () => {
    expect(segments(Opale.getCorner(WIDTH, 4))).toEqual([
      'MOVETO(31,0)',
      'LINETO(31,9)',
      'ARCTO(1,1,0,0,0,32,10)',
      'LINETO(41,10)',
      'LINETO(31,0)',
    ]);
  });
});

describe('Opale class -- drawU (Opale.java:108-136)', () => {
  it('unlinked: background then border, the outline, the corner, the text at (marginX1, marginY)', () => {
    const { opale, text } = makeOpale(false);
    const ug = new Capture();
    opale.drawU(ug);

    expect(ug.log).toHaveLength(2);
    const [outline, corner] = ug.log as [(typeof ug.log)[number], (typeof ug.log)[number]];
    expect(outline.changes).toHaveLength(2);
    expect(outline.changes[0]).toBeInstanceOf(Back);
    expect(outline.changes[1]).toBeInstanceOf(Fore);
    expect(segments(outline.shape as UPath)).toEqual(segments(Opale.getPolygonNormal(WIDTH, HEIGHT, 0)));
    expect((outline.shape as UPath).getDeltaShadow()).toBe(SHADOW);
    expect(segments(corner.shape as UPath)).toEqual(segments(Opale.getCorner(WIDTH, 0)));
    const translate = text.drawnAt?.at(-1) as UTranslate;
    expect([translate.getDx(), translate.getDy()]).toEqual([6, 5]);
  });

  it('applies the stroke after the colours when given (java:132-133)', () => {
    const stroke = UStroke.withThickness(2);
    const ug = new Capture();
    makeOpale(false, stroke).opale.drawU(ug);
    expect(ug.log[0]?.changes).toHaveLength(3);
    expect(ug.log[0]?.changes[2]).toBe(stroke);
  });

  it('honours setRoundCorner (java:82-84,110)', () => {
    const { opale } = makeOpale(false);
    opale.setRoundCorner(4);
    const ug = new Capture();
    opale.drawU(ug);
    expect(segments(ug.log[0]?.shape as UPath)).toEqual(segments(Opale.getPolygonNormal(WIDTH, HEIGHT, 4)));
    expect(segments(ug.log[1]?.shape as UPath)).toEqual(segments(Opale.getCorner(WIDTH, 4)));
  });

  const PP1 = new XPoint2D(20, 10);
  const PP2 = new XPoint2D(20, 40);
  const linked = (direction: Direction): string[] => {
    const { opale } = makeOpale(true);
    opale.setOpale(direction, PP1, PP2);
    const ug = new Capture();
    opale.drawU(ug);
    return segments(ug.log[0]?.shape as UPath);
  };

  it('LEFT notch (java:175-203): y1 = clamp(pp1.y - 4, 0, h - 8) = 6', () => {
    expect(linked(Direction.LEFT).slice(0, 5)).toEqual([
      'MOVETO(0,0)',
      'LINETO(0,6)',
      'LINETO(20,40)',
      'LINETO(0,14)',
      'LINETO(0,20)',
    ]);
  });

  it('RIGHT notch (java:205-229): y1 = clamp(6, cornersize, h - 8) = 10, so y1 + 8 = 18', () => {
    expect(linked(Direction.RIGHT).slice(5, 8)).toEqual(['LINETO(41,18)', 'LINETO(20,40)', 'LINETO(41,10)']);
  });

  it('UP notch (java:231-248): x1 = clamp(pp1.x - 4, 0, w - cornersize) = 16', () => {
    expect(linked(Direction.UP).slice(7, 10)).toEqual(['LINETO(24,0)', 'LINETO(20,40)', 'LINETO(16,0)']);
  });

  it('DOWN notch (java:250-269): x1 = clamp(pp1.x - 4, 0, w) = 16', () => {
    expect(linked(Direction.DOWN).slice(3, 6)).toEqual(['LINETO(16,20)', 'LINETO(20,40)', 'LINETO(24,20)']);
  });

  it('RIGHT with min >= max answers y1 untouched (MathUtils.java:78-82)', () => {
    // text height 0 -> box height 10; limitation(-1, cornersize 10, 10 - 8 = 2): min >= max -> -1
    const text = new StubText();
    text.calculateDimension = () => new XDimension2D(TEXT_W, 0);
    const opale = new Opale(SHADOW, BORDER, FILL, text, true, undefined);
    opale.setOpale(Direction.RIGHT, new XPoint2D(0, 3), new XPoint2D(60, 3));
    const ug = new Capture();
    opale.drawU(ug);
    expect(segments(ug.log[0]?.shape as UPath).slice(5, 8)).toEqual(['LINETO(41,7)', 'LINETO(60,3)', 'LINETO(41,-1)']);
  });

  it('a linked outline without a recognised strategy throws (java:122)', () => {
    const { opale } = makeOpale(true);
    expect(() => opale.drawU(new Capture())).toThrow('IllegalArgumentException');
  });
});
