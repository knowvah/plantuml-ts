import { UPath, USegmentType, type USegment } from '../../shape/UPath.js';
import type { Point2D } from '../../UTranslate.js';
import { HandJiggle } from './HandJiggle.js';
import type { JavaRandom } from './JavaRandom.js';

/** `private final double defaultVariation = 4.0` — UPathHand.java:48, the
 *  LINETO variation. */
const DEFAULT_VARIATION = 4.0;
/** `HandJiggle.create(last, 2.0, rnd)` — UPathHand.java:66, the CUBICTO one. */
const CUBIC_VARIATION = 2.0;

/**
 * UPathHand — each segment jiggled from wherever the previous one ended
 * (`last`, starting at `(0,0)`, java:54):
 * - MOVETO kept as is;
 * - CUBICTO: a 2.0 jiggle along the curve, appended WHOLE
 *   (`HandJiggle#appendTo` — its own start point included);
 * - LINETO: a 4.0 jiggle, only its `lineTo` points kept (the leading
 *   `moveTo` of `jiggle.toUPath()` is dropped);
 * - ARCTO: a straight `lineTo` its end point;
 * - anything else (QUADTO, CLOSE): the WHOLE source path is drawn unchanged
 *   and its shadow is not copied (java:89-90 return before java:94).
 *
 * The `shapes.ts#pathHand` builder is the same walk over its own segment
 * model; this class is the one over klimt's `UPath`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/hand/UPathHand.java
 */
export class UPathHand {
  private readonly path: UPath;

  constructor(source: UPath, rnd: JavaRandom) {
    const result = UPath.none();
    let last: Point2D = { x: 0, y: 0 };
    for (const segment of source.iterator()) {
      const next = appendSegment(result, segment, last, rnd);
      if (next === undefined) {
        this.path = source;
        return;
      }
      last = next;
    }
    this.path = result;
    this.path.setDeltaShadow(source.getDeltaShadow());
  }

  getHanddrawn(): UPath {
    return this.path;
  }
}

/** One iteration of the constructor's loop (java:56-92): appends to
 *  `result` and returns the new `last`, or `undefined` for the
 *  unhandled-segment early return. */
function appendSegment(result: UPath, segment: USegment, last: Point2D, rnd: JavaRandom): Point2D | undefined {
  const c = segment.coord;
  switch (segment.segmentType) {
    case USegmentType.SEG_MOVETO:
      result.moveTo(c[0]!, c[1]!);
      return { x: c[0]!, y: c[1]! };
    case USegmentType.SEG_CUBICTO:
      return appendCubic(result, c, last, rnd);
    case USegmentType.SEG_LINETO:
      return appendLine(result, c, last, rnd);
    case USegmentType.SEG_ARCTO:
      result.lineTo(c[5]!, c[6]!);
      return { x: c[5]!, y: c[6]! };
    default:
      return undefined;
  }
}

/** SEG_CUBICTO (java:63-72): the jiggle along
 *  `XCubicCurve2D(last, ctrl1, ctrl2, end)`, appended whole. */
function appendCubic(result: UPath, c: readonly number[], last: Point2D, rnd: JavaRandom): Point2D {
  const jiggle = HandJiggle.create(last, CUBIC_VARIATION, rnd);
  jiggle.curveTo({
    x1: last.x,
    y1: last.y,
    ctrlx1: c[0]!,
    ctrly1: c[1]!,
    ctrlx2: c[2]!,
    ctrly2: c[3]!,
    x2: c[4]!,
    y2: c[5]!,
  });
  jiggle.appendTo(result);
  return { x: c[4]!, y: c[5]! };
}

/** SEG_LINETO (java:73-82): only the jiggle's `lineTo` points. */
function appendLine(result: UPath, c: readonly number[], last: Point2D, rnd: JavaRandom): Point2D {
  const jiggle = new HandJiggle(last.x, last.y, DEFAULT_VARIATION, rnd);
  jiggle.lineTo(c[0]!, c[1]!);
  for (const seg2 of jiggle.toUPath().iterator())
    if (seg2.segmentType === USegmentType.SEG_LINETO) result.lineTo(seg2.coord[0]!, seg2.coord[1]!);
  return { x: c[0]!, y: c[1]! };
}
