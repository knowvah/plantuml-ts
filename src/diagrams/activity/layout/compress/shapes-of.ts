/**
 * `shapesOf` -- D2's shape adapter. Turns one activity diagram's placed
 * geometry into the flat `CompressShape[]` `collectSlots` (`slot-finder.ts`)
 * dispatches over, mirroring what `renderer.ts`/`activity-renderer-
 * shapes.ts` actually draws for each node/edge kind -- not a literal
 * `Ftile` class map, since our node vocabulary does not correspond 1:1 to
 * upstream's (see the per-kind citations below).
 *
 * @see net/sourceforge/plantuml/klimt/compress/SlotFinder.java:70-140
 *   -- the shape-kind dispatch {@link collectSlots} ports; this module only
 *   decides WHICH kind each of our node/edge kinds maps to.
 */

import type { ActivityEdgeGeo, ActivityNodeGeo } from '../../layout.old.js';
import type { EdgeMeta } from '../swimlane-placement.js';
import type { Reservation } from '../hexagon-reservations.js';
import type { StringBounder } from '../../tiles/tile.js';
import type { Theme } from '../../../../core/theme.js';
import type { SwimlaneBandGeo, SwimlaneGeo } from '../../activity-layout-types.js';
import type { CompressionMode } from './slot.js';
import { arrowDirection, arrowHeadExtents } from '../../arrows-regular.js';
import { activityFontSize, swimlaneTitleFontSize } from '../../activity-style-defaults.js';

export type { Reservation } from '../hexagon-reservations.js';

/**
 * One occupied (or reserved) box `collectSlots` dispatches on, mirroring
 * `SlotFinder#draw`'s own `instanceof` chain (`URectangle` -> `'rect'`,
 * `UPolygon` -> `'polygon'`, `UEllipse` -> `'ellipse'`, `UText` ->
 * `'text'`, `UEmpty` -> `'empty'`). `x`/`y`/`width`/`height` are the shape's
 * own box for every kind EXCEPT `'text'`, where `(x, y)` is the baseline
 * origin passed to `UText` and `width`/`height` are the bounder's raw
 * dimension -- `collectSlots` applies `TextLimitFinder`'s own `y - h +
 * 1.5` shift, not this adapter (D2: the dispatch arithmetic belongs to the
 * ported `SlotFinder`, not the adapter).
 */
export interface CompressShape {
  kind: 'rect' | 'ellipse' | 'polygon' | 'text' | 'centeredText' | 'empty';
  x: number;
  y: number;
  width: number;
  height: number;
  /** `URectangle#isIgnoreForCompressionOn` (`klimt/shape/URectangle.java
   *  :107-113`) -- only ever set on `'rect'` shapes (fork/join bars, the
   *  swimlane title band). `UEmpty`/`UEllipse`/`UPolygon`/`UText` never
   *  implement `UShapeIgnorableForCompression`. */
  ignoreX?: boolean;
  ignoreY?: boolean;
  /** `UPolygon#getCompressionMode()` (`Worm.java:159-168`) -- set only on
   *  a cross-lane fork/split arrowhead's polygon, skipped on that one axis. */
  polygonSkipMode?: CompressionMode;
}

export interface ShapesOfInput {
  readonly nodes: readonly ActivityNodeGeo[];
  readonly edges: readonly ActivityEdgeGeo[];
  readonly edgeMeta: readonly EdgeMeta[];
  /**
   * Read for one purpose: {@link titleShapes}'s per-lane `centeredText`
   * position (`contentX`/`contentWidth`/`titleWidth`, mirroring
   * `activity-renderer-swimlanes.ts#renderSwimlaneTitles:115-126`).
   * Divider/title-BAND occupancy still comes from `reservations` instead
   * (computed upstream where the block's own `baseY` is in scope) --
   * `SwimlaneGeo` alone does not carry that vertical anchor. No per-lane
   * BACKGROUND colour shape is emitted: `Swimlanes.java:330-338`'s per-lane
   * `back` rect needs a `SwimlaneGeo.backgroundColor` field that does not
   * exist in this port today.
   */
  readonly swimlanes: readonly SwimlaneGeo[];
  readonly reservations: readonly Reservation[];
  /**
   * `computeSwimlaneChrome`'s own band rect (`assign-coordinates-full.ts`),
   * `undefined` for a single-lane diagram (`Swimlanes.java:275`'s own
   * `size() > 1` guard -- no band, no titles). Needed only for its `y`,
   * the title baseline's anchor (see {@link titleShapes}).
   */
  readonly swimlaneBand: SwimlaneBandGeo | undefined;
  readonly bounder: StringBounder;
  readonly theme: Theme;
}

/**
 * `FtileIfHexagon`/`GtileHexagonInside`'s drawn extents when a condition
 * label IS present (`activity-renderer-shapes.ts#renderHexagon`: a
 * `<polygon>` spanning the node's own box, `[x, x+w] x [y, y+h]`).
 */
function hexagonBox(node: ActivityNodeGeo): { x: number; y: number; width: number; height: number } {
  return { x: node.x, y: node.y, width: node.width, height: node.height };
}

/**
 * `renderDiamond`'s `diamond(cx, cy, size)` (`core/svg-shapes.ts`, `size =
 * node.width / 2`): x spans `[cx-size, cx+size] = [x, x+w]` exactly, but y
 * spans `[cy-size, cy+size]`, which only equals `[y, y+h]` when
 * `width === height` -- read literally here rather than assumed equal.
 */
function diamondBox(node: ActivityNodeGeo): { x: number; y: number; width: number; height: number } {
  const size = node.width / 2;
  const cy = node.y + node.height / 2;
  return { x: node.x, y: cy - size, width: node.width, height: size * 2 };
}

/**
 * `if-split`/`while-header` render a hexagon ONLY when labelled
 * (`activity-renderer-shapes.ts#renderNode`'s own `node.label !== undefined
 * && node.label !== '' ? renderHexagon(...) : renderDiamond(...)`);
 * `repeat-cond` always renders a hexagon.
 */
function conditionBox(node: ActivityNodeGeo): { x: number; y: number; width: number; height: number } {
  if (node.kind === 'repeat-cond') return hexagonBox(node);
  return node.label !== undefined && node.label !== '' ? hexagonBox(node) : diamondBox(node);
}

/**
 * `renderNote`'s Opale balloon path: the box extended to include the
 * spike tip on whichever side the note sits (`activity-renderer-shapes.ts
 * #renderNote`'s `bodyPath` -- both the left- and right-spike cases route
 * through `spike.x`/`spike.y`, so the drawn extents are the box union the
 * spike point).
 */
function noteBox(node: ActivityNodeGeo): { x: number; y: number; width: number; height: number } {
  const spike = node.spikeTip;
  if (spike === undefined) return { x: node.x, y: node.y, width: node.width, height: node.height };
  const minX = Math.min(node.x, spike.x);
  const maxX = Math.max(node.x + node.width, spike.x);
  const minY = Math.min(node.y, spike.y);
  const maxY = Math.max(node.y + node.height, spike.y);
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/** `FtileBreak`/`FtileEmpty#drawU` draw nothing; upstream's `FtileThinSplit`
 *  draws a `ULine`, which never occupies (see {@link shapeForNode}'s doc). */
const NO_SHAPE_KINDS = new Set(['break', 'if-merge', 'split-bar', 'split-join-bar']);

/** `FtileBlackBlock#drawU`'s `URectangle.ignoreForCompressionOnX()`
 *  (`vertical/FtileBlackBlock.java:101-102`). */
const BAR_KINDS = new Set(['fork-bar', 'join-bar']);

/** Diamond/hexagon condition nodes -- see {@link conditionBox}. */
const CONDITION_KINDS = new Set(['if-split', 'while-header', 'repeat-cond']);

/**
 * Maps one `ActivityNodeGeo` to the `CompressShape` `renderNode`
 * (`activity-renderer-shapes.ts`) actually draws for it, or `null` for a
 * kind that draws nothing.
 *
 * - `break`, `if-merge` -> nothing (`FtileBreak`, `FtileEmpty#drawU` draw
 *   nothing; our `renderNode` returns `''` for both).
 * - `split-bar`, `split-join-bar` -> nothing. DEVIATION from a literal
 *   reading of this task's own brief, which grouped these with the fork
 *   bars: `renderSplitLine` (`activity-renderer-bars.ts`) draws a `<line>`,
 *   and upstream's own `FtileThinSplit#drawU` (`vertical/FtileThinSplit
 *   .java:87-96`) draws `ULine.hline(...)`, NOT a `URectangle` --
 *   `SlotFinder#draw`'s dispatch (`SlotFinder.java:78-100`) has no `ULine`
 *   branch, so a `ULine` never occupies. Only `FtileBlackBlock#drawU`
 *   (`vertical/FtileBlackBlock.java:101-102`, the FORK/JOIN bar) draws a
 *   `URectangle.ignoreForCompressionOnX()`.
 * - `fork-bar`, `join-bar` -> `rect`, `ignoreX: true`
 *   (`FtileBlackBlock.java:101-102`).
 * - `if-split`, `while-header`, `repeat-cond` -> `polygon`,
 *   {@link conditionBox}.
 * - `note` -> `polygon`, {@link noteBox} (Opale is a `UPath`; `SlotFinder
 *   #drawPath` uses min/max, same as `drawPolygon`).
 * - everything else (start/stop/end/kill/spot/action/group/partition/
 *   label/default) -> `rect`, the node's own box. Occupancy-wise this is
 *   IDENTICAL to `ellipse`/`empty` for a symmetric shape --
 *   `SlotFinder#drawRectangle`/`drawEllipse`/`drawEmpty` all compute
 *   `[x, x+width]`/`[y, y+height]` byte-identically (`SlotFinder.java
 *   :138-161`) -- so which of the three a plain box kind is tagged does
 *   not change any slot.
 */
function shapeForNode(node: ActivityNodeGeo): CompressShape | null {
  if (NO_SHAPE_KINDS.has(node.kind)) return null;
  if (BAR_KINDS.has(node.kind)) {
    return { kind: 'rect', x: node.x, y: node.y, width: node.width, height: node.height, ignoreX: true };
  }
  if (CONDITION_KINDS.has(node.kind)) return { kind: 'polygon', ...conditionBox(node) };
  if (node.kind === 'note') return { kind: 'polygon', ...noteBox(node) };
  return { kind: 'rect', x: node.x, y: node.y, width: node.width, height: node.height };
}

/**
 * The terminal arrowhead at an edge's last point, direction from the
 * second-to-last point (`renderer.ts#renderEdge`'s own `arrowTip` call).
 * `undefined` when the edge is too short or the last segment is zero-
 * length -- `arrowTip`'s own `dx === 0 && dy === 0` guard, D3.
 */
function terminalArrowhead(edge: ActivityEdgeGeo, meta: EdgeMeta): CompressShape | undefined {
  const pts = edge.points;
  if (pts.length < 2) return undefined;
  const last = pts[pts.length - 1]!;
  const prev = pts[pts.length - 2]!;
  const dx = last.x - prev.x;
  const dy = last.y - prev.y;
  if (dx === 0 && dy === 0) return undefined;
  const ext = arrowHeadExtents(arrowDirection(dx, dy));
  const shape: CompressShape = {
    kind: 'polygon',
    x: last.x + ext.minX,
    y: last.y + ext.minY,
    width: ext.maxX - ext.minX,
    height: ext.maxY - ext.minY,
  };
  // `Worm.java:159-168`: a cross-lane fork/split decoration's
  // `compressionMode` is set to `ON_X`, skipping it on X only.
  if (meta.shape === 'parallel-in' || meta.shape === 'parallel-out') shape.polygonSkipMode = 'x';
  return shape;
}

/** `renderer.ts#renderEdge`'s own longest-segment search, split out only
 *  to keep {@link midArrowhead}'s own NLOC under the file's limit. */
function longestSegment(pts: readonly { x: number; y: number }[]): {
  segStart: { x: number; y: number };
  segEnd: { x: number; y: number };
} {
  let maxLen = 0;
  let maxI = 1;
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i - 1]!;
    const p1 = pts[i]!;
    const len = Math.hypot(p1.x - p0.x, p1.y - p0.y);
    if (len > maxLen) {
      maxLen = len;
      maxI = i;
    }
  }
  return { segStart: pts[maxI - 1]!, segEnd: pts[maxI]! };
}

/**
 * The mid-segment arrowhead `renderer.ts#renderEdge` draws on the LONGEST
 * segment when `edge.midArrow === true` (repeat back-edges) -- same
 * longest-segment search, same direction/extents computation.
 */
function midArrowhead(edge: ActivityEdgeGeo): CompressShape | undefined {
  const pts = edge.points;
  if (edge.midArrow !== true || pts.length < 2) return undefined;
  const { segStart, segEnd } = longestSegment(pts);
  const dx = segEnd.x - segStart.x;
  const dy = segEnd.y - segStart.y;
  if (dx === 0 && dy === 0) return undefined;
  const midX = (segStart.x + segEnd.x) / 2;
  const midY = (segStart.y + segEnd.y) / 2;
  const ext = arrowHeadExtents(arrowDirection(dx, dy));
  return {
    kind: 'polygon',
    x: midX + ext.minX,
    y: midY + ext.minY,
    width: ext.maxX - ext.minX,
    height: ext.maxY - ext.minY,
  };
}

/**
 * An edge label, measured WITH THE BOUNDER at `activityFontSize(theme,
 * 'arrow')` and placed exactly where `renderer.ts#renderEdgeLabel` places
 * it -- the renderer's own `label.length * 0.6 * size` width estimate is a
 * FILED approximation (mission README, "does not change"); this adapter
 * measures the true width instead, which is the whole point of porting
 * `TextLimitFinder` faithfully, and the difference is journaled, not
 * reconciled by changing the renderer.
 */
function edgeLabelShape(edge: ActivityEdgeGeo, bounder: StringBounder, theme: Theme): CompressShape | undefined {
  if (edge.label === undefined) return undefined;
  const pts = edge.points;
  const mid = Math.floor(pts.length / 2);
  const midPt = pts[mid]!;
  const size = activityFontSize(theme, 'arrow');
  const dim = bounder.getDimension(edge.label, size);
  let x: number;
  let y: number;
  if (edge.color !== undefined) {
    // Pill case: `renderEdgeLabel`'s `text(pillX + 4, midY, ...)`.
    const textWidth = edge.label.length * (size * 0.6);
    const pillW = textWidth + 8;
    const pillX = midPt.x - pillW / 2;
    x = pillX + 4;
    y = midPt.y;
  } else {
    // Plain case: `renderEdgeLabel`'s `text(midX + 4, midY - 4, ...)`.
    x = midPt.x + 4;
    y = midPt.y - 4;
  }
  return { kind: 'text', x, y, width: dim.width, height: dim.height };
}

/** Every `CompressShape` one `ActivityEdgeGeo` contributes -- never its
 *  segments (`ULine`, never occupies, D1). */
function shapesForEdge(edge: ActivityEdgeGeo, meta: EdgeMeta, bounder: StringBounder, theme: Theme): CompressShape[] {
  const shapes: CompressShape[] = [];
  const terminal = terminalArrowhead(edge, meta);
  if (terminal !== undefined) shapes.push(terminal);
  const mid = midArrowhead(edge);
  if (mid !== undefined) shapes.push(mid);
  const label = edgeLabelShape(edge, bounder, theme);
  if (label !== undefined) shapes.push(label);
  return shapes;
}

/** A {@link Reservation} as a `CompressShape` -- `'rect'` with its ignore
 *  flags when it carries any (the swimlane title band,
 *  `Swimlanes.java:358-367`), else `'empty'` (a divider or hexagon
 *  reservation -- `UEmpty` never implements `UShapeIgnorableForCompression`). */
function shapeForReservation(r: Reservation): CompressShape {
  if (r.ignoreX === true || r.ignoreY === true) {
    const shape: CompressShape = { kind: 'rect', x: r.x, y: r.y, width: r.width, height: r.height };
    if (r.ignoreX === true) shape.ignoreX = true;
    if (r.ignoreY === true) shape.ignoreY = true;
    return shape;
  }
  return { kind: 'empty', x: r.x, y: r.y, width: r.width, height: r.height };
}

/**
 * `Swimlanes#drawTitles` draws ONE `CenteredText` per lane
 * (`Swimlanes.java:369-375`), only when the band exists
 * (`:275`'s `size() > 1` guard -- `renderSwimlaneTitles`'s own
 * `geo.swimlaneBand === undefined` early return mirrors this). A
 * `CenteredText` is a bare `UShape` (`ftile/CenteredText.java:26`), not a
 * `UText` -- `SlotFinder#draw`'s dispatch chain (`SlotFinder.java:78-100`)
 * has no branch for it, so on the ON_X pass (the raw block drawn straight
 * into a fresh `SlotFinder`, `CompressionXorYBuilder.java:60-63`) it never
 * occupies. But the ON_Y builder wraps the ON_X builder
 * (`ActivityDiagram3.java:209-210`), so ON_Y's `SlotFinder` sees the raw
 * block drawn through `UGraphicCompressOnXorY.create(ON_X, ySlotFinder,
 * xAffine)` instead -- and that wrapper's OWN `CenteredText` branch
 * (`UGraphicCompressOnXorY.java:100-112`) does not forward the
 * `CenteredText` shape at all: it calls `text.drawU(...)` on the WRAPPED
 * title `TextBlock`, which emits a genuine `UText` straight into
 * `getUg()` -- here, `ySlotFinder` -- so the title occupies on Y exactly
 * like {@link edgeLabelShape}'s `'text'` kind (`TextLimitFinder`'s
 * `y - h + 1.5` shift, `collectSlots` applies it, not this adapter).
 *
 * Position/font mirror `activity-renderer-swimlanes.ts#renderSwimlaneTitles`
 * (`:115-126`, read-only -- never edited by this port's compress work):
 * `x = contentX + (contentWidth - titleWidth) / 2`, baseline `y =
 * band.y + fontSize * (1 - 1/4.5)` (`StringBounder#getDescent`,
 * `klimt/font/StringBounder.java:47`, the same ascent ratio the renderer
 * already cites). The ratio is duplicated here, not imported, because the
 * renderer module is read-only for this fix.
 */
const TITLE_BASELINE_ASCENT = 1 - 1 / 4.5;

function titleShapes(
  swimlanes: readonly SwimlaneGeo[],
  band: SwimlaneBandGeo | undefined,
  bounder: StringBounder,
  theme: Theme,
): CompressShape[] {
  if (band === undefined) return [];
  const fontSize = swimlaneTitleFontSize(theme);
  const baselineY = band.y + fontSize * TITLE_BASELINE_ASCENT;
  const shapes: CompressShape[] = [];
  for (const lane of swimlanes) {
    const contentX = lane.contentX ?? lane.x;
    const contentWidth = lane.contentWidth ?? lane.width;
    const titleWidth = lane.titleWidth ?? 0;
    const titleX = contentX + (contentWidth - titleWidth) / 2;
    const dim = bounder.getDimension(lane.name, fontSize);
    shapes.push({ kind: 'centeredText', x: titleX, y: baselineY, width: dim.width, height: dim.height });
  }
  return shapes;
}

/**
 * D2: the single shape adapter feeding `collectSlots`. Combines every
 * node's, edge's, reservation's, and swimlane title's drawn extent into
 * one flat list.
 */
export function shapesOf(input: ShapesOfInput): CompressShape[] {
  const shapes: CompressShape[] = [];
  for (const node of input.nodes) {
    const shape = shapeForNode(node);
    if (shape !== null) shapes.push(shape);
  }
  for (let i = 0; i < input.edges.length; i++) {
    shapes.push(...shapesForEdge(input.edges[i]!, input.edgeMeta[i]!, input.bounder, input.theme));
  }
  for (const r of input.reservations) shapes.push(shapeForReservation(r));
  shapes.push(...titleShapes(input.swimlanes, input.swimlaneBand, input.bounder, input.theme));
  return shapes;
}
