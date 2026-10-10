/**
 * Canvas origin (D2, mission `activity-divergence-drive` T1a): ports
 * `Recentred` + the document margin + `LimitFinder` -- replaces the flat
 * `LAYOUT_MARGIN` `assign-coordinates-full.ts#computeBounds` used to add on
 * top of its own maxX/maxY. Split out of that module only to keep it under
 * the 500-line hook (mission convention, "a sibling module when a file
 * would cross the hook"); `assign-coordinates-full.ts`'s `pass1Assemble`/
 * `compressAndAssemble` are the only callers of {@link finalizeGeometry}.
 * See `activity-layout-constants.ts` for the three numeric constants this
 * spends (`RECENTRED_PAD`, `RECENTRED_ENLARGE`, `activityDocumentMargin`, `SVG_CANVAS_CEIL`)
 * and their own citations.
 *
 * Mechanism (journalled before any edit, per this task's own instructions):
 * upstream never bakes a margin into the Ftile tree -- the root Ftile's own
 * local coordinates start at 0 (`InstructionList#createFtile` returns the
 * bare root tile). The canvas origin is instead produced by THREE
 * independent steps, run in this order:
 *  1. `LimitFinder` (`klimt/drawing/LimitFinder.java:170-211`) computes the
 *     diagram's own ink `MinMax` by replaying every draw call -- but its
 *     per-shape dispatch is NOT uniform: `drawRectangle` records `x-1,y-1`
 *     (near) and `x+width-1,y+height-1` (far); `drawEllipse` records the
 *     near corner EXACTLY (`x,y`) but the same `-1` far corner;
 *     `drawUPolygon` additionally pads BOTH corners by its own
 *     `HACK_X_FOR_POLYGON = 10`, X ONLY (the Y corners are exact); `drawULine`
 *     /`drawUPath`/`drawDotPath` record both corners exactly. A node's
 *     `{ near, far }` fudge below is this dispatch, keyed by which upstream
 *     `Ftile` draws it as (confirmed per-kind against the oracle: a lone
 *     `start` circle measures ink at exactly its own `[0,20]` box --
 *     `kodiji-34-mofe202`, ellipse near=0; a lone `action` rect's own box
 *     measures one pixel further out on its near corner -- `rarodo-65-
 *     fudu505`, `t-partition`/`t-fork` oracle probes, rect near=1).
 *  2. `Recentred` (`activitydiagram3/Recentred.java:47-59`) re-draws that
 *     ink at a FIXED `(5, 5)` inner pad from its own (fudged) near corner,
 *     and reports its own size as the ink's fudged span PLUS a further 15
 *     on the far corner only (`enlarge(15, 15)`, far corner only -- the near
 *     corner, read by `drawU`'s translate, is untouched by `enlarge`).
 *  3. `TextBlockExporter` (`core/TextBlockExporter.java:172-173,199-202`)
 *     wraps that in the symmetric document margin, `same(10)`
 *     (`TitledDiagram.java:275`, confirmed no `root.document` style override
 *     in `plantuml.skin`) -- `+10` on every side.
 * T2e (`plans/activity-divergence-drive`, journal rows 9-10): step 1's own
 * dispatch was missing two shape kinds the ink scan never fed it --
 * `drawUPolygon` for every edge's arrowhead decoration (not modelled in
 * `ActivityNodeGeo`/`ActivityEdgeGeo` at all; now read from `arrows-
 * regular.ts` by {@link arrowheadTips}/`extendForEdge`) and `drawEmpty`/
 * `drawRectangle` for the `Reservation`s `placeSwimlanes` already computes
 * for the compressor (the lane divider's own `UEmpty(x1+x2,1)`,
 * `LaneDivider.java:91`, and the swimlane title band's `URectangle`,
 * `Swimlanes.java:358-367`) but {@link computeCanvasOrigin} never folded
 * into the ink scan (see {@link extendForReservation}).
 *
 * Composing (1)+(2)'s translate+(3): a node's own near-corner coordinate
 * `p` ends up drawn at `p - m + 15` where `m` is the GLOBAL ink min (every
 * node/edge's own fudged near corner, reduced by `Math.min`) and `15 = 10
 * (margin) + 5 (Recentred's pad)` by default (`activityDocumentMargin`). The canvas's own
 * size is `(M - m) + 35` -- `35 = 20 (margin, both sides) + 15 (enlarge's
 * far pad only -- NOT doubled, `enlarge` never touches the near corner)` --
 * by default, THEN one further pixel from `SvgGraphics
 * #ensureVisible`'s own `(int)(x + 1)` cast (`klimt/drawing/svg/
 * SvgGraphics.java:129-136,142-143`), applied to `option.getMinDim()` (this
 * exact dimension) before any shape is drawn -- confirmed against
 * `kodiji-34-mofe202`: the formula above gives 54×54; the oracle renders
 * 55×55.
 */

import type { ActivityEdgeGeo, ActivityNodeGeo, SwimlaneGeo } from '../activity-geometry.types.js';
import type { Reservation } from './hexagon-reservations.js';
import { TITLE_ASCENT_FRACTION } from './swimlane-placement.js';
import { bandReservationX, computeSwimlaneChrome, type SwimlaneChrome } from './swimlane-chrome.js';
import {
  RECENTRED_ENLARGE,
  RECENTRED_PAD,
  SVG_CANVAS_CEIL,
  activityDocumentMargin,
} from '../activity-layout-constants.js';
import { arrowDirection, arrowHeadExtents, type ArrowDir } from '../arrows-regular.js';
import { swimlaneTitleFontSize } from '../activity-style-defaults.js';
import type { Theme } from '../../../core/theme.js';
import { shiftAll } from './canvas-origin-shift.js';
import {
  SPLIT_LINE_KINDS,
  extendForEdgeLabelText,
  extendForIfLabelText,
  extendForIfOwnLabelText,
  extendForLaneDivider,
} from './canvas-origin-text-ink.js';
import { NO_FUDGE, POLYGON_FUDGE_X, RECT_FUDGE, isInkless, nodeFudge } from './canvas-origin-fudge.js';

export interface MutableInkBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function extendForNode(acc: MutableInkBounds, node: ActivityNodeGeo, theme: Theme): void {
  if (isInkless(node.kind)) return;
  if (node.kind === 'if-label') {
    extendForIfLabelText(acc, node, theme);
    return;
  }
  if (node.kind === 'if-own-label') {
    extendForIfOwnLabelText(acc, node, theme);
    return;
  }
  const { x: fx, y: fy } = nodeFudge(node);
  acc.minX = Math.min(acc.minX, node.x - fx.near);
  acc.maxX = Math.max(acc.maxX, node.x + node.width + fx.far);
  if (SPLIT_LINE_KINDS.has(node.kind)) {
    acc.minY = Math.min(acc.minY, node.y);
    acc.maxY = Math.max(acc.maxY, node.y);
    return;
  }
  acc.minY = Math.min(acc.minY, node.y - fy.near);
  acc.maxY = Math.max(acc.maxY, node.y + node.height + fy.far);
}

/**
 * One `UPolygon` arrowhead decoration this edge draws, tip + direction --
 * mirrors `renderer.ts#renderEdge`'s three decoration sites (terminal,
 * `emphasize`, `midArrowAt`) exactly, but reads only `arrows-regular.ts`
 * (`arrowDirection`/`arrowHeadExtents`), never `renderer.ts` itself (T2e's
 * own write-set excludes the renderer; `arrowHeadExtents`'s own doc proves
 * the `ArrowsRegular`/`ArrowsTriangle` bounding boxes are identical per
 * direction, so no `Theme` is needed here to pick the right box).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/Worm.java:138-183
 */
function arrowheadTips(edge: ActivityEdgeGeo): Array<{ x: number; y: number; dir: ArrowDir }> {
  const tips: Array<{ x: number; y: number; dir: ArrowDir }> = [];
  const { points } = edge;
  if (points.length < 2) return tips;

  // Terminal decoration: `renderer.ts#renderEdge`'s `arrow` (`:230-234`).
  if (edge.arrowhead !== false) {
    const last = points[points.length - 1]!;
    const prev = points[points.length - 2]!;
    tips.push({ x: last.x, y: last.y, dir: arrowDirection(last.x - prev.x, last.y - prev.y) });
  }

  // Emphasized mid-segment decoration: the FIRST segment whose direction
  // matches `edge.emphasize`, same search as `renderer.ts#findEmphasisSegment`.
  if (edge.emphasize !== undefined) {
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i]!;
      const p2 = points[i + 1]!;
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      if (arrowDirection(dx, dy) === edge.emphasize) {
        tips.push({ x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2, dir: edge.emphasize });
        break;
      }
    }
  }

  // D4 (`activity-loop-lane-translate`): the translate shape's own extra
  // decoration, `renderer.ts#renderMidArrow`.
  if (edge.midArrowAt !== undefined) {
    tips.push({ x: edge.midArrowAt.x, y: edge.midArrowAt.y, dir: edge.midArrowAt.dir });
  }

  return tips;
}

/**
 * The X-only half of an edge's own ink (`ULine` points, exact, plus every
 * arrowhead `UPolygon`'s `POLYGON_FUDGE_X`-padded span) -- split out and
 * exported (T3i, `swimlane-context.ts#measureLaneExtents`) so a same-lane
 * edge's arrowhead can widen its lane's content extent the SAME way
 * `Swimlanes#computeDrawingWidths`'s per-lane `LimitFinder` would (it scans
 * every draw call in that lane's content, edges included, not just node
 * boxes). Y is deliberately omitted -- no lane-sizing consumer needs it;
 * {@link extendForEdge} keeps its own exact Y accumulation inline.
 */
export function edgeInkX(edge: ActivityEdgeGeo): { minX: number; maxX: number } {
  let minX = Infinity;
  let maxX = -Infinity;
  for (const p of edge.points) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
  }
  for (const tip of arrowheadTips(edge)) {
    const ext = arrowHeadExtents(tip.dir);
    minX = Math.min(minX, tip.x + ext.minX - POLYGON_FUDGE_X.near);
    maxX = Math.max(maxX, tip.x + ext.maxX + POLYGON_FUDGE_X.far);
  }
  return { minX, maxX };
}

function extendForEdge(acc: MutableInkBounds, edge: ActivityEdgeGeo, theme: Theme): void {
  const { minX, maxX } = edgeInkX(edge);
  acc.minX = Math.min(acc.minX, minX);
  acc.maxX = Math.max(acc.maxX, maxX);
  // `ULine` segments (`LimitFinder#drawULine`, exact) and arrowhead
  // `UPolygon`s (Y exact, `LimitFinder.java:169-176`'s own Y-exact corners).
  for (const p of edge.points) {
    acc.minY = Math.min(acc.minY, p.y);
    acc.maxY = Math.max(acc.maxY, p.y);
  }
  for (const tip of arrowheadTips(edge)) {
    const ext = arrowHeadExtents(tip.dir);
    acc.minY = Math.min(acc.minY, tip.y + ext.minY);
    acc.maxY = Math.max(acc.maxY, tip.y + ext.maxY);
  }
  extendForEdgeLabelText(acc, edge, theme); // T1b: `Snake#drawInternalLabel`.
}

/**
 * The two `Reservation` kinds `placeSwimlanes`/`assignCoordinatesFull` emit
 * (D5, `activity-klimt-compress`): a `UEmpty` -- the lane divider's own
 * `UEmpty(x1 + x2, 1)` (`LaneDivider.java:91`) and the hexagon loop-back
 * placeholder (`hexagon-reservations.ts`) -- dispatches through
 * `LimitFinder#drawEmpty` (exact, `NO_FUDGE`); a `URectangle` -- the
 * swimlane title band's background (`Swimlanes.java:358-367`,
 * `.ignoreForCompressionOnX().ignoreForCompressionOnY()`, the ONLY
 * reservation kind that sets `ignoreX`/`ignoreY`, per `hexagon-
 * reservations.ts#Reservation`'s own doc) -- dispatches through
 * `drawRectangle` (`RECT_FUDGE`). Both were already threaded into
 * `finalizeGeometry`'s `reservations` param (`activity-klimt-compress` T3)
 * for the compressor; this is the first LimitFinder-ink consumer of them
 * (journal row 9: the jar's `20` first-divider-x IS this UEmpty's left
 * edge, not the visible line).
 */
function extendForReservation(acc: MutableInkBounds, r: Reservation): void {
  const fudge = r.ignoreX === true || r.ignoreY === true ? RECT_FUDGE : NO_FUDGE;
  acc.minX = Math.min(acc.minX, r.x - fudge.near);
  acc.maxX = Math.max(acc.maxX, r.x + r.width + fudge.far);
  acc.minY = Math.min(acc.minY, r.y - fudge.near);
  acc.maxY = Math.max(acc.maxY, r.y + r.height + fudge.far);
}

function extendForSwimlane(acc: MutableInkBounds, lane: SwimlaneGeo): void {
  acc.minX = Math.min(acc.minX, lane.x);
  acc.maxX = Math.max(acc.maxX, lane.x + lane.width);
}

/**
 * T3i: the per-lane title TEXT's own ink. `Swimlanes#drawTitles` (`:369-
 * 377`) draws a `CenteredText`, which `LimitFinder.draw` itself ignores
 * (`klimt/drawing/LimitFinder.java:139-142`, `// Ignored`) -- but every
 * swimlane draw call is wrapped by TWO `CompressionXorYBuilder` layers
 * (`ActivityDiagram3.java:206-209`), and `UGraphicCompressOnXorY#draw`
 * (`klimt/compress/UGraphicCompressOnXorY.java:100-113`) special-cases
 * `CenteredText` by unwrapping it and calling `text.drawU(...)` on the
 * wrapped `TextBlock` directly -- so the title's actual glyphs DO reach
 * the ink-scanning `LimitFinder` as plain `UText` draws, via `drawText`
 * (`:220-226`): `y -= dim.getHeight() - 1.5`, i.e. near corner `y0 - (H -
 * 1.5)`, far corner `y0 + 1.5`, where `H` is the RAW (un-floored) title
 * height -- `drawText` measures the glyph directly, never `AtomText`'s own
 * `h < 10 ? 10 : h` floor (`measureSwimlaneTitlesHeight`'s own doc) --
 * and `y0` is the SAME local baseline the renderer draws at
 * (`activity-renderer-swimlanes.ts#renderSwimlaneTitles`:
 * `band.y + fontSize * TITLE_ASCENT_FRACTION`, `band.y` here being the
 * UNSHIFTED `baseY` every reservation in this module already uses).
 * `Swimlanes.java:275`'s own `size() > 1` guard applies (mirrored already
 * by `resolveSwimlaneVertical`/`computeSwimlaneChrome`): a single lane
 * draws no title at all.
 *
 * Verified against `jakuco-69-dari135` (`SwimlaneTitleFontSize` default,
 * 18): `y0 = 0 + 18 * 7/9 = 14`; near `= 14 - (18 - 1.5) = -2.5`, more
 * negative than the title band rect's own `RECT_FUDGE.near`-derived `-1`
 * (`extendForReservation`) -- the title text, not the band, sets the
 * diagram's own top ink for every `SwimlaneTitleFontSize >= ~3`. At
 * `SwimlaneTitleFontSize 8` (`sikino-19-vuca111`): `y0 = 6.222`, near
 * `= 6.222 - 6.5 = -0.278`, LESS negative than the band rect's `-1` -- the
 * band stays dominant, matching that fixture's unchanged canvas top.
 */
function extendForSwimlaneTitles(
  acc: MutableInkBounds,
  swimlanes: readonly SwimlaneGeo[],
  baseY: number,
  theme: Theme,
): void {
  if (swimlanes.length <= 1) return;
  const fontSize = swimlaneTitleFontSize(theme);
  const y0 = baseY + fontSize * TITLE_ASCENT_FRACTION;
  acc.minY = Math.min(acc.minY, y0 - (fontSize - 1.5));
  acc.maxY = Math.max(acc.maxY, y0 + 1.5);
}

interface CanvasOrigin {
  readonly shiftX: number;
  readonly shiftY: number;
  readonly totalWidth: number;
  readonly totalHeight: number;
  /** b3/T3a (family E): the un-floored, un-ceiled canvas span -- see
   *  {@link ActivityGeometry.rawWidth}'s own doc for the consumer. */
  readonly rawWidth: number;
  readonly rawHeight: number;
}

/** The draw calls one Ftile subtree makes, as the walk records them. */
export interface InkSource {
  readonly nodes: readonly ActivityNodeGeo[];
  readonly edges: readonly ActivityEdgeGeo[];
  readonly reservations: readonly Reservation[];
}

/**
 * `LimitFinder`'s `MinMax` over every node, edge and `UEmpty`/`URectangle`
 * reservation of `src` (`LimitFinder.java:133-188`), as unbounded (`+-Infinity`)
 * corners when `src` draws nothing (`MinMaxMutable.getEmpty(false)`,
 * `MinMaxMutable.java:45-50`). Shared by the root canvas scan and add4-T3c's
 * `FtileGroup#getInnerMinMax` emulation (`canvas-origin-group-ink.ts`).
 */
export function inkBoundsOf(src: InkSource, theme: Theme): MutableInkBounds {
  const acc: MutableInkBounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  for (const n of src.nodes) extendForNode(acc, n, theme);
  for (const e of src.edges) extendForEdge(acc, e, theme);
  for (const r of src.reservations) extendForReservation(acc, r);
  return acc;
}

/** {@link computeCanvasOrigin}'s own inputs, bundled to keep that function
 *  under the file's 5-parameter limit (T3i added `theme` as a 6th). */
interface CanvasOriginInput {
  readonly nodes: readonly ActivityNodeGeo[];
  readonly edges: readonly ActivityEdgeGeo[];
  readonly swimlanes: readonly SwimlaneGeo[];
  readonly reservations: readonly Reservation[];
  readonly baseY: number;
  readonly theme: Theme;
  /** b3/T3a (family A): the content's own pre-shift bottom -- the lane
   *  divider's own ink reaches exactly this far (`extendForLaneDivider`). */
  readonly contentMaxY: number;
}

/** The module doc's mechanism, applied: reduces every node/edge/swimlane's
 *  own (fudged) span into one global ink `MinMax`, then derives the uniform
 *  near-corner shift and the final (ceiled) canvas size from it. */
function computeCanvasOrigin(input: CanvasOriginInput): CanvasOrigin {
  const { nodes, edges, swimlanes, reservations, baseY, theme, contentMaxY } = input;
  const acc = inkBoundsOf({ nodes, edges, reservations }, theme);
  for (const s of swimlanes) extendForSwimlane(acc, s);
  extendForSwimlaneTitles(acc, swimlanes, baseY, theme);
  extendForLaneDivider(acc, swimlanes, baseY, contentMaxY);
  if (!Number.isFinite(acc.minX)) {
    acc.minX = 0;
    acc.minY = 0;
    acc.maxX = 0;
    acc.maxY = 0;
  }
  // b3/T3a (family E): the `Recentred`-only span `preChromeWidth`/
  // `preChromeHeight` must carry (`activity-layout-constants.ts
  // #RECENTRED_ENLARGE`'s own doc: `(M - m) + RECENTRED_ENLARGE`, BEFORE
  // the document margin's further `left + right`) -- a DIFFERENT (smaller)
  // padding term than `totalWidth`/`totalHeight`'s own below.
  const rawWidth = acc.maxX - acc.minX + RECENTRED_ENLARGE;
  const rawHeight = acc.maxY - acc.minY + RECENTRED_ENLARGE;
  // add4-T2e THEME-MARGIN: the document margin is the theme's
  // (`activityDocumentMargin`, `TextBlockExporter.java:510-516`); the
  // integer pad terms are summed first, as the former constants were.
  const m = activityDocumentMargin(theme);
  return {
    shiftX: RECENTRED_PAD + m.left - acc.minX,
    shiftY: RECENTRED_PAD + m.top - acc.minY,
    totalWidth: Math.floor(acc.maxX - acc.minX + (RECENTRED_ENLARGE + m.left + m.right)) + SVG_CANVAS_CEIL,
    totalHeight: Math.floor(acc.maxY - acc.minY + (RECENTRED_ENLARGE + m.top + m.bottom)) + SVG_CANVAS_CEIL,
    rawWidth,
    rawHeight,
  };
}

/** Bundles {@link computeCanvasOrigin} + the shift it implies into one
 *  finishing pass, shared by `assign-coordinates-full.ts`'s `pass1Assemble`
 *  and `compressAndAssemble` so the mechanism is written once. */
export interface FinalizeInput {
  nodes: ActivityNodeGeo[];
  edges: ActivityEdgeGeo[];
  swimlanes: SwimlaneGeo[];
  reservations: Reservation[];
  bounds: { maxX: number; maxY: number };
  baseY: number;
  titlesHeight: number;
  /** T3i: the title's own font size (`extendForSwimlaneTitles`) needs the
   *  theme every other swimlane-sizing call site already threads through. */
  theme: Theme;
}

export interface FinalizedGeometry {
  totalWidth: number;
  totalHeight: number;
  /** b3/T3a (family E) -- see {@link ActivityGeometry.rawWidth}'s own doc. */
  rawWidth: number;
  rawHeight: number;
  nodes: ActivityNodeGeo[];
  edges: ActivityEdgeGeo[];
  swimlanes: SwimlaneGeo[];
  reservations: Reservation[];
  chrome: Partial<SwimlaneChrome>;
}

export function finalizeGeometry(input: FinalizeInput): FinalizedGeometry {
  const { nodes, edges, swimlanes, reservations, bounds, baseY, titlesHeight, theme } = input;
  const origin = computeCanvasOrigin({
    nodes,
    edges,
    swimlanes,
    reservations,
    baseY,
    theme,
    contentMaxY: bounds.maxY,
  });
  const shifted = shiftAll({ nodes, edges, swimlanes, reservations }, origin.shiftX, origin.shiftY);
  const [y1, y2] = [baseY + origin.shiftY, bounds.maxY + origin.shiftY];
  const chrome = computeSwimlaneChrome(shifted.swimlanes, y1, titlesHeight, y2, bandReservationX(shifted.reservations));
  return {
    totalWidth: origin.totalWidth,
    totalHeight: origin.totalHeight,
    rawWidth: origin.rawWidth,
    rawHeight: origin.rawHeight,
    ...shifted,
    chrome,
  };
}
