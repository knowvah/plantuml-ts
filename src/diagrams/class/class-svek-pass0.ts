/**
 * cdd4-T10 — the draw state `SvekResult#drawU` carries from its first pass
 * into its second.
 *
 * `SvekResult#drawU` runs twice (`svek/SvekResult.java:80-102`):
 *
 *  - pass 0: `calculateDimension`'s `TextBlockUtils.getMinMax(this, …)`
 *    (`svek/SvekResult.java:130-134`), whose `LimitFinder` draws the whole
 *    result (`klimt/shape/TextBlockUtils.java:138-141`) at `dx = dy = 0` —
 *    the svek frame, this port's layout frame plus `m` (the
 *    `core/graph-layout.ts#shiftToOrigin` offset, `DotLayoutResult
 *    .originShift`);
 *  - pass 1: the SVG draw, after `clusterManager.moveDelta(6 - minX,
 *    6 - minY)` set every edge's `dx, dy` to `D = S - m`, where `S` is
 *    `layout-ink-extent.ts#computeClassInkShift` (the same ink extent
 *    measured in this port's frame).
 *
 * Two pieces of mutable state survive from pass 0 into pass 1:
 *
 *  - the Kal boxes: `SvekResult#computeKal` (`:95,104-109`) runs on every
 *    pass, and `Kal#moveX` → `SvekEdge#moveStartPoint` moves `dotPathInit`
 *    too (`svek/SvekEdge.java:1346-1349`, `svek/Kal.java:210-216`), which
 *    `SvekEdge#computeKal` re-seeds from (`:1069-1077`) —
 *    `class-kal-overlap.ts#computeKal`;
 *  - the shared `LinkConstraint` (`cucadiagram/LinkConstraint.java:70-104`):
 *    `SvekEdge.java:994-1012` picks a corner of `getSquare(x +
 *    labelXY.x, y + labelXY.y)` (`:1080-1091`, shifted by `x = dx`) against
 *    `todraw.sample()` (`:908-942`, NOT shifted — `todraw` is drawn at
 *    `UTranslate(x, y)`, `:946`), then `setPosition` + `drawMe`. `drawMe`
 *    returns while either point is still `(0, 0)`, so in pass 0 only the
 *    LATER link (`link1`, `atmp/CucaDiagram.java:682-695` +
 *    `command/note/CommandConstraintOnLinks.java:102-107`) draws; in pass 1
 *    the earlier link (`link2`) draws first, from link1's stale pass-0
 *    point.
 */
import type { Point2D } from '../../core/klimt/UTranslate.js';
import type { FontSpec, StringMeasurer } from '../../core/measurer.js';
import { splitDisplayLines } from '../../core/klimt/creole/DisplayNewlines.js';
import type { EdgeGeo } from './class-geo-types.js';
import { constraintAnchor } from './class-edge-constraint.js';
import { drawnEdgePoints } from './class-ink-dot-path.js';
import { computeKal, type PlacedKal } from './class-kal-overlap.js';

/** One `SvekEdge` whose `link.getLinkConstraint() != null`. */
export interface ConstraintLink {
  readonly edgeGeo: EdgeGeo;
  /** The `LinkConstraint` both links share — identity is the pairing. */
  readonly constraint: { readonly text: string };
  /** `labelXY.getPosition()` (`SvekEdge.java:741-747`, `:808-815`): the
   *  label TABLE polygon's min corner, in this port's layout frame. */
  readonly spot: Point2D;
  /** `link == link1` (`LinkConstraint.java:71`). */
  readonly isLink1: boolean;
}

/** `LinkConstraint`'s `x1, y1, x2, y2` (`LinkConstraint.java:58-61`), in
 *  the frame the jar drew them in; a Java `double` field starts at 0. */
interface LinkConstraintPoints {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** The font `LinkConstraint#drawMe` builds its label with
 *  (`FontParam.ARROW`, `LinkConstraint.java:98-99`). */
export interface ConstraintLabelFont {
  readonly measurer: StringMeasurer;
  readonly font: FontSpec;
}

/** The pass-0 state `runSvekPass1` resumes from. */
export interface SvekDrawState {
  /** The svek frame's offset from this port's layout frame. */
  readonly m: Point2D;
  readonly kals: readonly PlacedKal[];
  readonly constraints: readonly ConstraintLink[];
  readonly points: ReadonlyMap<object, LinkConstraintPoints>;
  /** Pass-0 `LinkConstraint#drawMe` ink, in this port's layout frame. */
  readonly constraintInk: readonly Point2D[];
}

interface ConstraintLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * One pass of `SvekEdge.java:994-1012` over every constrained link, in
 * `allLines()` (link) order. `squareOffset` is the pass's `dx, dy` relative
 * to the un-shifted samples (0 in pass 0, `D` in pass 1); `drawFrame` maps a
 * jar-frame point back to this port's layout frame.
 */
function drawConstraints(
  state: SvekDrawState,
  squareOffset: Point2D,
  drawFrame: Point2D,
  drawMe: (link: ConstraintLink, line: ConstraintLine) => void,
): void {
  for (const link of state.constraints) {
    const spot = { x: link.spot.x + squareOffset.x, y: link.spot.y + squareOffset.y };
    const minPt = constraintAnchor(drawnEdgePoints(link.edgeGeo), spot);
    if (minPt === undefined) continue;
    const p = state.points.get(link.constraint)!;
    // `setPosition` (`LinkConstraint.java:70-80`), in the jar's frame: the
    // samples sit at svek coordinates (layout + m) in both passes.
    if (link.isLink1) [p.x1, p.y1] = [minPt.x + state.m.x, minPt.y + state.m.y];
    else [p.x2, p.y2] = [minPt.x + state.m.x, minPt.y + state.m.y];
    // `drawMe`'s two early returns (`LinkConstraint.java:83-88`).
    if ((p.x1 === 0 && p.y1 === 0) || (p.x2 === 0 && p.y2 === 0)) continue;
    drawMe(link, { x1: p.x1 - drawFrame.x, y1: p.y1 - drawFrame.y, x2: p.x2 - drawFrame.x, y2: p.y2 - drawFrame.y });
  }
}

/** `ascent` of the class renderer's text baseline convention
 *  (`renderer-edge-extras.ts#ascentDescent`, ADR-001's `descent = size/4.5`). */
function ascentOf(fontSize: number): number {
  return fontSize - fontSize / 4.5;
}

/**
 * `LinkConstraint#drawMe`'s ink under `LimitFinder`: the `ULine` both ends
 * (`klimt/drawing/LimitFinder.java` `drawULine`) and every label line's
 * `drawText` box, placed exactly as `renderer-edge-extras.ts
 * #renderEdgeConstraint` draws it and bounded by the class ink walk's text
 * rule (`class-ink-box.ts#addEdgeTextInk`: `baseline - size + 1.5` to
 * `baseline + 1.5`).
 */
function constraintInk(line: ConstraintLine, text: string, label: ConstraintLabelFont): Point2D[] {
  const { font, measurer } = label;
  const ink: Point2D[] = [
    { x: line.x1, y: line.y1 },
    { x: line.x2, y: line.y2 },
  ];
  const { lines } = splitDisplayLines(text);
  const widths = lines.map((l) => measurer.measure(l, { family: font.family, size: font.size }).width);
  const blockWidth = Math.max(0, ...widths);
  const cx = (line.x1 + line.x2) / 2;
  const top = (line.y1 + line.y2) / 2 - (lines.length * font.size) / 2;
  widths.forEach((w, i) => {
    const baseline = top + i * font.size + ascentOf(font.size);
    const left = cx - blockWidth / 2 + (blockWidth - w) / 2;
    ink.push({ x: left, y: baseline - font.size + 1.5 }, { x: left + w, y: baseline + 1.5 });
  });
  return ink;
}

/**
 * Pass 0 of the constraint replay, run after `computeKal` (pass 0) and the
 * magnetic borders — `todraw` is `dotPath` after both. Only a link whose
 * `drawMe` got past both early returns contributes ink.
 */
export function svekPass0(
  m: Point2D,
  kals: readonly PlacedKal[],
  constraints: readonly ConstraintLink[],
  label: ConstraintLabelFont,
): SvekDrawState {
  const points = new Map(constraints.map((c) => [c.constraint, { x1: 0, y1: 0, x2: 0, y2: 0 }]));
  const ink: Point2D[] = [];
  const state: SvekDrawState = { m, kals, constraints, points, constraintInk: ink };
  drawConstraints(state, { x: 0, y: 0 }, m, (link, line) => {
    ink.push(...constraintInk(line, link.constraint.text, label));
  });
  return state;
}

/**
 * Pass 1, once `S` is known: `computeKal` again in the final frame (layout
 * + S), resuming from pass 0's moved `dotPathInit`, then the constraint
 * replay with the square offset by `D = S - m`. A link that draws is
 * stamped with the line `drawMe` emits, mapped back to the layout frame
 * (the caller then shifts every geometry by `S`).
 */
export function runSvekPass1(state: SvekDrawState, shift: { readonly dx: number; readonly dy: number }): void {
  const s = { x: shift.dx, y: shift.dy };
  computeKal(state.kals, s);
  const d = { x: s.x - state.m.x, y: s.y - state.m.y };
  drawConstraints(state, d, s, (link, line) => {
    link.edgeGeo.constraint = { line, text: link.constraint.text };
  });
}
