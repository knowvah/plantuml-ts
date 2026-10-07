/**
 * The per-shape `LimitFinder` fudge table (`klimt/drawing/LimitFinder.java:
 * 133-188`), split out of `canvas-origin.ts` (add4-T3c) to keep that file
 * under the 500-line hook; see that module's doc for the mechanism. Three
 * consumers: the root canvas scan, `swimlane-context.ts#measureLaneExtents`
 * (`Swimlanes.java:379-395`) and `canvas-origin-group-ink.ts`
 * (`FtileGroup.java:150-158`), all through {@link nodeFudge}.
 */
import type { ActivityNodeGeo } from '../activity-geometry.types.js';

/** What {@link nodeFudge} reads of a node: a placed `ActivityNodeGeo`, or
 *  a `swimlane-context.ts#LaneItem` built from one. */
export type FudgeSubject = Pick<ActivityNodeGeo, 'kind'> & Partial<Pick<ActivityNodeGeo, 'usymbol' | 'label'>>;
import { classifyStripeLine } from '../../../core/klimt/creole/legacy/CreoleStripeSimpleParser.js';

/** A shape kind's own `{ near, far }` LimitFinder fudge (module doc above):
 *  `recordedMin = real.min - near`, `recordedMax = real.max + far`. Exported
 *  (T3i, `swimlane-context.ts#measureLaneExtents`): `Swimlanes
 *  .computeDrawingWidths` (`Swimlanes.java:379-395`) measures each lane's
 *  own content extent through this SAME `LimitFinder` class -- a lane's
 *  `getMinMax()` is not the raw node box, it is the SAME fudged ink this
 *  module already computes for the whole-canvas scan. One fudge table, two
 *  consumers, never re-derived. */
export interface ShapeFudge {
  readonly near: number;
  readonly far: number;
}

/** `drawRectangle` (`LimitFinder.java:185-189`). `style.getShadowing()`
 *  defaults to 0 (`root { Shadowing: 0.0; }`, `plantuml.skin:18`, no
 *  `action`/`group`/`partition`/bar-specific override), so the far corner's
 *  `+2*deltaShadow` term is omitted here. */
export const RECT_FUDGE: ShapeFudge = { near: 1, far: -1 };
/** `drawEllipse` (`:206-210`): exact near corner, `drawRectangle`'s far. */
const ELLIPSE_FUDGE: ShapeFudge = { near: 0, far: -1 };
/** `drawUPolygon` (`:170-176`), X axis only -- `HACK_X_FOR_POLYGON = 10`. */
export const POLYGON_FUDGE_X: ShapeFudge = { near: 10, far: 10 };
/** `drawULine`/`drawUPath`/`drawDotPath` (exact), and every kind this task
 *  has not yet verified against the oracle (`note`'s own `Opale` IS
 *  confirmed exact -- a `UPath`, `Opale.java:108` -- but shares this same
 *  zero fudge, so it is not called out as its own constant). */
export const NO_FUDGE: ShapeFudge = { near: 0, far: 0 };

/** `FtileCircleStart`/`Stop`/`EndCross` + the connector spot -- all circles.
 * @see net/sourceforge/plantuml/svek/image/CircleStart.java:73-74 */
const ELLIPSE_KINDS = new Set(['start', 'stop', 'end', 'spot']);
/** `action` is `FtileBox` (a real `URectangle`); `group`/`partition`'s own
 *  outer box is too (confirmed: the oracle's `t-partition` probe places its
 *  rect at the SAME fudged offset as a bare action box); `fork-bar`/
 *  `join-bar` are `FtileBlackBlock`'s solid `URectangle`
 *  (`compress-geometry.ts#RECT_WIDTH_KINDS` already treats them as such for
 *  the unrelated compression transform). */
const RECT_KINDS = new Set(['action', 'group', 'partition', 'fork-bar', 'join-bar']);
/** Every diamond/hexagon condition node -- `Hexagon.asPolygon`/`FtileDiamond`
 *  both draw a `UPolygon` (`Hexagon.java:48-66`). X only (`POLYGON_FUDGE_X`'s
 *  own doc). */
const POLYGON_X_KINDS = new Set(['diamond', 'if-split', 'if-merge', 'while-header', 'repeat-cond', 'repeat-start']);

/** `break` draws no glyph at all (`activity-renderer-shapes.ts`'s own
 *  `case 'break'` returns `''`) -- excluded from the ink scan entirely,
 *  rather than assigned a fudge, so an all-break diagram never collapses
 *  the min/max reduction onto a phantom shape. */
export function isInkless(kind: string): boolean {
  return kind === 'break';
}

export function fudgeX(kind: string): ShapeFudge {
  if (ELLIPSE_KINDS.has(kind)) return ELLIPSE_FUDGE;
  if (RECT_KINDS.has(kind)) return RECT_FUDGE;
  if (POLYGON_X_KINDS.has(kind)) return POLYGON_FUDGE_X;
  return NO_FUDGE;
}

export function fudgeY(kind: string): ShapeFudge {
  if (ELLIPSE_KINDS.has(kind)) return ELLIPSE_FUDGE;
  if (RECT_KINDS.has(kind)) return RECT_FUDGE;
  return NO_FUDGE; // polygon fudge is X-only; every other kind is exact.
}

/** A `URectangle` whose far X edge is overdrawn by a full-width `ULine`:
 *  the rectangle's near corner, the line's exact far end
 *  (`LimitFinder.java:179-188`). */
const RECT_WITH_FULL_HLINE_X: ShapeFudge = { near: RECT_FUDGE.near, far: NO_FUDGE.far };

/**
 * add4-T2g: the ink a `package`/`card` frame draws, which differs from the
 * `USymbolFrame`/`USymbolRectangle` `URectangle` every other container
 * draws (`FtileGroup.java:218-220` -> `type.asBig(...).drawU`):
 *  - `package` (`USymbols.PACKAGE`, `USymbols.java:86`) is `USymbolFolder`'s
 *    `UPolygon` when `roundCorner == 0` (`USymbolFolder.java:84-93`), which
 *    `drawUPolygon` pads by `HACK_X_FOR_POLYGON` on X only, Y exact
 *    (`LimitFinder.java:168-177`); the title `hline` lies inside it
 *    (`USymbolFolder.java:123`).
 *  - `card` (`USymbols.CARD`, `USymbols.java:69`) is `USymbolCard`'s
 *    `URectangle` PLUS a full-width `ULine.hline(width)`
 *    (`USymbolCard.java:61-67`); `drawULine` records `x + dx` exactly
 *    (`LimitFinder.java:179-182`), one px past the rectangle's `x + width -
 *    1` (`:184-188`), so the far X is exact and the near X stays the
 *    rectangle's.
 * `undefined` for every kind that keeps its {@link fudgeX}/{@link fudgeY}.
 */
function compositeFudge(node: FudgeSubject): { x: ShapeFudge; y: ShapeFudge } | undefined {
  if (node.usymbol === 'package') return { x: POLYGON_FUDGE_X, y: NO_FUDGE };
  if (node.usymbol === 'card') return { x: RECT_WITH_FULL_HLINE_X, y: RECT_FUDGE };
  return undefined;
}

/**
 * add4-T3c HRULE-INK: an action label with a creole `----`/`====`/`....`
 * separator (`classifyStripeLine`'s `HORIZONTAL_LINE`, the same predicate
 * the renderer draws the rule from) or a titled `-- t --` one, whose two
 * halves still start and end on the stencil (`UHorizontalLine.java:87-96,
 * 111-139`). `FtileBox` draws its `SheetBlock2`
 * through `MyStencil` (`FtileBox.java:125-135,180-181`), so the rule runs
 * from `-padding.left` to `width - padding.right` of the padded text, i.e.
 * the box's full width; `UGraphicStencil#drawHline` (`UGraphicStencil.java:
 * 83-84`) turns it into `ULine`s (`UHorizontalLine.java:141-152`).
 */
function hasHorizontalRule(node: FudgeSubject): boolean {
  if (node.kind !== 'action' || node.label === undefined) return false;
  return node.label.split('\n').some((l) => {
    const c = classifyStripeLine(l);
    return c.type === 'HORIZONTAL_LINE' || ('titledHorizontalLine' in c && c.titledHorizontalLine !== undefined);
  });
}

/**
 * One node's `{ x, y }` `LimitFinder` fudge: {@link compositeFudge}'s
 * USymbol cases, an action's full-width rule, else the kind's own
 * {@link fudgeX}/{@link fudgeY}.
 */
export function nodeFudge(node: FudgeSubject): { x: ShapeFudge; y: ShapeFudge } {
  const composite = compositeFudge(node);
  if (composite !== undefined) return composite;
  if (hasHorizontalRule(node)) return { x: RECT_WITH_FULL_HLINE_X, y: RECT_FUDGE };
  return { x: fudgeX(node.kind), y: fudgeY(node.kind) };
}
