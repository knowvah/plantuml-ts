/**
 * `UGraphicHandwritten` (klimt/drawing/hand/UGraphicHandwritten.java) and the
 * hand shapes it dispatches to (`URectangleHand`, `ULineHand`, `UPolygonHand`,
 * `UEllipseHand`, `UDotPathHand`, `UPathHand`).
 *
 * The load-bearing contract: the decorator's `Random` is an INSTANCE field
 * seeded `424242L` (java:54) and `apply` returns a NEW decorator
 * (java:114-116) — so a draw after any `apply` restarts the sequence, while
 * two draws on one instance continue it. The jar's own goldens show it:
 * both links of `zature-18-vidu755` open with the identical jiggle.
 */
import { describe, expect, it } from 'vitest';
import type { UChange } from '../../../../../../src/core/klimt/UChange.js';
import type { UGraphic } from '../../../../../../src/core/klimt/UGraphic.js';
import type { UParam } from '../../../../../../src/core/klimt/UParam.js';
import type { UShape } from '../../../../../../src/core/klimt/UShape.js';
import type { UTranslate } from '../../../../../../src/core/klimt/UTranslate.js';
import type { StringBounder } from '../../../../../../src/core/klimt/font/StringBounder.js';
import { JavaRandom } from '../../../../../../src/core/klimt/drawing/hand/JavaRandom.js';
import { UGraphicHandwritten } from '../../../../../../src/core/klimt/drawing/hand/UGraphicHandwritten.js';
import {
  ellipseHand,
  lineHand,
  polygonHand,
  rectangleHand,
} from '../../../../../../src/core/klimt/drawing/hand/shapes.js';
import { DotPath } from '../../../../../../src/core/klimt/shape/DotPath.js';
import { UEllipse } from '../../../../../../src/core/klimt/shape/UEllipse.js';
import { ULine } from '../../../../../../src/core/klimt/shape/ULine.js';
import { UPath, USegmentType } from '../../../../../../src/core/klimt/shape/UPath.js';
import { UPolygon } from '../../../../../../src/core/klimt/shape/UPolygon.js';
import { URectangle } from '../../../../../../src/core/klimt/shape/URectangle.js';
import { UText } from '../../../../../../src/core/klimt/shape/UText.js';

/** `new Random(424242L)` — UGraphicHandwritten.java:54. */
const SEED = 424242;

/** Records every drawn shape into one sink shared by all derived graphics. */
class RecordingUGraphic implements UGraphic {
  constructor(readonly drawn: UShape[] = []) {}
  apply(_change: UChange): UGraphic {
    return new RecordingUGraphic(this.drawn);
  }
  draw(shape: UShape): void {
    this.drawn.push(shape);
  }
  getParam(): UParam {
    throw new Error('not used');
  }
  getTranslate(): UTranslate {
    throw new Error('not used');
  }
  getStringBounder(): StringBounder {
    throw new Error('not used');
  }
}

function polygonPoints(shape: UShape | undefined): { x: number; y: number }[] {
  expect(shape).toBeInstanceOf(UPolygon);
  return (shape as UPolygon).getPoints().map((p) => ({ x: p.x, y: p.y }));
}

function pathSegments(shape: UShape | undefined): [string, number[]][] {
  expect(shape).toBeInstanceOf(UPath);
  return [...(shape as UPath).iterator()].map((s) => [s.segmentType, [...s.coord]]);
}

const NOOP_CHANGE = {} as UChange;

describe('UGraphicHandwritten dispatch', () => {
  it('a rounded URectangle becomes the URectangleHand polygon (roundCorner halved)', () => {
    const sink = new RecordingUGraphic();
    new UGraphicHandwritten(sink).draw(URectangle.build(40, 20).rounded(5));
    expect(polygonPoints(sink.drawn[0])).toEqual(rectangleHand(40, 20, 5, new JavaRandom(SEED)));
  });

  it('a ULine becomes the ULineHand path: moveTo the first point, lineTo the rest', () => {
    const sink = new RecordingUGraphic();
    new UGraphicHandwritten(sink).draw(new ULine(30, 0));
    const pts = lineHand(30, 0, new JavaRandom(SEED));
    expect(pathSegments(sink.drawn[0])).toEqual([
      ['SEG_MOVETO', [pts[0]!.x, pts[0]!.y]],
      ...pts.slice(1).map((p): [string, number[]] => ['SEG_LINETO', [p.x, p.y]]),
    ]);
  });

  it('a UPolygon becomes the UPolygonHand polygon', () => {
    const sink = new RecordingUGraphic();
    const tri = [
      { x: 0, y: 0 },
      { x: 30, y: 0 },
      { x: 15, y: 20 },
    ];
    new UGraphicHandwritten(sink).draw(new UPolygon(tri));
    expect(polygonPoints(sink.drawn[0])).toEqual(polygonHand(tri, new JavaRandom(SEED)));
  });

  it('a full UEllipse becomes the UEllipseHand polygon; an arc is drawn unchanged', () => {
    const sink = new RecordingUGraphic();
    const ug = new UGraphicHandwritten(sink);
    ug.draw(UEllipse.build(20, 20));
    expect(polygonPoints(sink.drawn[0])).toEqual(ellipseHand(20, 20, new JavaRandom(SEED)));
    const arc = new UEllipse(20, 10, 0, 90);
    ug.draw(arc);
    expect(sink.drawn[1]).toBe(arc);
  });

  it('a DotPath becomes the UDotPathHand path (variation 2.0 from the start point)', () => {
    const sink = new RecordingUGraphic();
    const bez = { x1: 0, y1: 0, ctrlx1: 10, ctrly1: 0, ctrlx2: 10, ctrly2: 30, x2: 40, y2: 30 };
    new UGraphicHandwritten(sink).draw(DotPath.fromBeziers([bez]));
    const segs = pathSegments(sink.drawn[0]);
    expect(segs[0]).toEqual(['SEG_MOVETO', [0, 0]]);
    expect(segs.at(-1)).toEqual(['SEG_LINETO', [40, 30]]);
    expect(segs.slice(1).every(([t]) => t === 'SEG_LINETO')).toBe(true);
  });

  it('any other shape (UText) is drawn unchanged', () => {
    const sink = new RecordingUGraphic();
    const text = UText.build('x', undefined as never);
    new UGraphicHandwritten(sink).draw(text);
    expect(sink.drawn[0]).toBe(text);
  });
});

describe('UPathHand', () => {
  it('moveTo kept; a cubic appends its whole jiggle (start included); a line only its lineTo points', () => {
    const sink = new RecordingUGraphic();
    const path = UPath.none();
    path.moveTo(0, 20);
    path.lineTo(10, 20);
    path.cubicTo(25, 20, 25, 0, 40, 0);
    new UGraphicHandwritten(sink).draw(path);
    const segs = pathSegments(sink.drawn[0]);
    expect(segs[0]).toEqual(['SEG_MOVETO', [0, 20]]);
    // The 10-long line: 5 jittered points (segments floored to 5) then its
    // end (10, 20) — its own start, the toUPath moveTo, is dropped.
    expect(segs.slice(1, 7).every(([t]) => t === 'SEG_LINETO')).toBe(true);
    expect(segs[6]).toEqual(['SEG_LINETO', [10, 20]]);
    // The cubic jiggle re-emits its start (10, 20) — HandJiggle#appendTo.
    expect(segs[7]).toEqual(['SEG_LINETO', [10, 20]]);
    expect(segs.at(-1)).toEqual(['SEG_LINETO', [40, 0]]);
  });

  it('a path with a segment kind it does not handle is drawn unchanged', () => {
    // No public UPath method records one (`quadTo` stores a CUBICTO,
    // `closePath` is a no-op, as upstream) — only the raw `add`.
    const sink = new RecordingUGraphic();
    const path = UPath.none();
    path.moveTo(0, 0);
    path.add([5, 5, 10, 0], USegmentType.SEG_QUADTO);
    new UGraphicHandwritten(sink).draw(path);
    expect(sink.drawn[0]).toBe(path);
  });

  it('an arcTo becomes a straight lineTo its end point', () => {
    const sink = new RecordingUGraphic();
    const path = UPath.none();
    path.moveTo(0, 0);
    path.arcTo(5, 5, 0, 0, 1, 10, 0);
    new UGraphicHandwritten(sink).draw(path);
    expect(pathSegments(sink.drawn[0])).toEqual([
      ['SEG_MOVETO', [0, 0]],
      ['SEG_LINETO', [10, 0]],
    ]);
  });
});

describe('UGraphicHandwritten random stream', () => {
  const rect = (): URectangle => URectangle.build(40, 20);

  it('two draws on ONE instance continue the sequence', () => {
    const sink = new RecordingUGraphic();
    const ug = new UGraphicHandwritten(sink);
    ug.draw(rect());
    ug.draw(rect());
    const rnd = new JavaRandom(SEED);
    const first = rectangleHand(40, 20, 0, rnd);
    const second = rectangleHand(40, 20, 0, rnd);
    expect(polygonPoints(sink.drawn[0])).toEqual(first);
    expect(polygonPoints(sink.drawn[1])).toEqual(second);
  });

  it('apply() returns a new decorator with a fresh Random(424242)', () => {
    const sink = new RecordingUGraphic();
    const ug = new UGraphicHandwritten(sink);
    ug.draw(rect());
    const derived = ug.apply(NOOP_CHANGE);
    expect(derived).toBeInstanceOf(UGraphicHandwritten);
    derived.draw(rect());
    expect(polygonPoints(sink.drawn[1])).toEqual(polygonPoints(sink.drawn[0]));
  });
});
