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

import type { ActivityEdgeGeo, ActivityNodeGeo, SwimlaneBandGeo, SwimlaneGeo } from '../../activity-geometry.types.js';
import type { EdgeMeta } from '../swimlane-placement.js';
import type { Reservation } from '../hexagon-reservations.js';
import type { StringBounder } from '../../tiles/tile.js';
import type { Theme } from '../../../../core/theme.js';
import type { CompressionMode } from './slot.js';
import { arrowDirection, arrowHeadExtents } from '../../arrows-regular.js';
import { activityFontSize, swimlaneTitleFontSize } from '../../activity-style-defaults.js';
import { measureLineWidth } from '../../activity-text-placement.js';
import { conditionBox, noteBox } from './shapes-of-boxes.js';
import { edgeDecorationVector } from './shapes-of-terminal.js';
import { frameTabShape } from './shapes-of-frame.js';
import { DEFAULT_LABEL_ALIGN, getTextBlockPosition } from '../snake-text-position.js';
import { centeredFirstBaselineY } from '../../activity-renderer-shapes.js';

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

/** `FtileBreak#drawU` draws nothing; upstream's `FtileThinSplit` draws a
 *  `ULine`, which never occupies (see {@link shapeForNode}'s doc). `if-merge`
 *  used to be listed here (`FtileEmpty#drawU`, the omitted-diamond2 path,
 *  `ConditionalBuilder.java:309-311`) but the merge rhombus DOES draw when
 *  `hasTwoBranches()` -- D2, `Hexagon.asPolygon(shadowing)` -- so it now gets
 *  a polygon box below instead of being listed as drawing nothing.
 *
 * `label`/`goto` (mission add2-T2g) added: both are `FtileEmpty` with NO
 * `drawU` override (empty method body, `ast.ts`'s own doc) -- zero-size,
 * so without this listing they fall through to the generic `{ kind:
 * 'rect', width: 0, height: 0 }` box below, which `Slot`'s constructor
 * (`slot.ts:62-65`) rejects (`start >= end`) -- reproduced directly
 * (`getene-72-dido571`/`kiceze-91-luke737` both threw
 * `IllegalArgumentException: start=X end=X` before this fix). Outside
 * this task's nominal write-set (`layout/compress/**`) but unavoidable:
 * reported in the final report per the write-set note's own allowance
 * for a one-line arm elsewhere when a new node kind requires it. */
const NO_SHAPE_KINDS = new Set(['break', 'split-bar', 'split-join-bar', 'label', 'goto']);

/** `FtileBlackBlock#drawU`'s `URectangle.ignoreForCompressionOnX()`
 *  (`vertical/FtileBlackBlock.java:101-102`). */
const BAR_KINDS = new Set(['fork-bar', 'join-bar']);

/** Diamond/hexagon condition nodes -- see {@link conditionBox}. */
const CONDITION_KINDS = new Set(['if-split', 'while-header', 'repeat-cond']);

/** T3i (row PARTCOMP): `partition`/`group` resolve to a bare
 *  `USymbolFrame` (`USymbols.java:81,87`), whose own rect sets BOTH
 *  `ignoreForCompressionOnX/Y()` (`USymbolFrame.java:70-71`) -- unlike
 *  every other `'rect'`-kind node below (a plain `URectangle`). */
const FRAME_KINDS = new Set(['group', 'partition']);

/**
 * `if-label`'s text box (D3) -- `renderIfLabel`'s own baseline convention
 * (`activity-renderer-if-shapes.ts`, Q5: `y0 + ARROW_FONT_SIZE *
 * ASCENT_FRACTION`, left-aligned starting at `node.x`,
 * `ConditionalBuilder.java:280`'s `HorizontalAlignment.LEFT`). The ascent
 * ratio is the same one {@link titleShapes} already cites
 * (`StringBounder#getDescent`, `klimt/font/StringBounder.java:47`).
 *
 * Multi-line (bazuma mechanism, `.agent-notes/T2f-geometry.md`):
 * `renderIfLabel` draws a multi-line else/then label as `textLines` --
 * one `<text>` per `\n`-split line, each its own `UText` draw, matching
 * upstream's `LimitFinder.drawText`, called once PER line, not once for
 * the whole label. The prior single-call `bounder.getDimension
 * (wholeLabel, fontSize)` measured the string as ONE line, under-counting
 * a multi-line label's height and letting `compress-geometry.ts` remove
 * vertical space the drawn text still occupies (`bazuma-86-metu353`'s
 * diamond1 +23.944 shift). This returns ONE combined box spanning the
 * first line's own ink-top to the last line's own ink-bottom (max width
 * across lines) rather than one `CompressShape` per line: `collectSlots`
 * (`invariant.test.ts`, stop 11) index-matches `shapesOf`'s list 1:1
 * between pre-/post-compression geometry for every OTHER node kind, and a
 * variable per-line shape count would (a) shift every later shape's index
 * for any OTHER task's fixture carrying a multi-line if-label and (b)
 * introduce adjacent sibling-line boxes that can touch/overlap each other
 * post-compression even though the SOURCE has never drawn a `UText` that
 * overlaps its own neighbour -- confirmed by reproducing exactly that on
 * `leduvi-16-voli986`/`jupoxe-15-sugo110` with the per-line array before
 * reverting to this single envelope. Mirrors the per-line SUM
 * `tiles/gtile-diamond-inside.ts#measureLabel` already uses for the
 * SIZING side of this same label -- this is the matching envelope for the
 * DRAWING/compression-bounds side.
 */
function ifLabelShape(node: ActivityNodeGeo, bounder: StringBounder, theme: Theme): CompressShape {
  const fontSize = activityFontSize(theme, 'arrow');
  const firstBaselineY = node.y + fontSize * TITLE_BASELINE_ASCENT;
  const lines = (node.label ?? '').split('\n');
  let width = 0;
  let firstHeight = 0;
  for (let i = 0; i < lines.length; i++) {
    const dim = bounder.getDimension(lines[i]!, fontSize);
    if (dim.width > width) width = dim.width;
    if (i === 0) firstHeight = dim.height;
  }
  const lastBaselineY = firstBaselineY + fontSize * (lines.length - 1);
  return { kind: 'text', x: node.x, y: lastBaselineY, width, height: lastBaselineY - firstBaselineY + firstHeight };
}

/**
 * `if-own-label`'s text box (T3k, companion fix -- see `shapeForNode`'s own
 * doc) -- `renderHexagonOwnLabel`'s own `cx`/`cy`/`condSize` geometry
 * (`activity-renderer-if-shapes.ts`), CENTERED horizontally (unlike {@link
 * ifLabelShape}'s left-aligned `node.x`), single-line reduction of
 * `centeredFirstBaselineY` for the baseline (the SAME `ASCENT_FRACTION`
 * {@link ifLabelShape} already uses, under this file's own name). Before
 * T3k split the own label into its own node, this text was baked into the
 * SAME node as the polygon and so had no separate `CompressShape` at all
 * (`conditionBox`'s hexagon box already bounds it); this restores that
 * coverage so compression's own overlap invariant (`invariant.test.ts`,
 * stop 11) still sees it.
 */
function ifOwnLabelShape(node: ActivityNodeGeo, bounder: StringBounder, theme: Theme): CompressShape {
  const condSize = activityFontSize(theme, 'diamond');
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  const dim = bounder.getDimension(node.label ?? '', condSize);
  const baselineY = cy - condSize / 2 + condSize * TITLE_BASELINE_ASCENT;
  return { kind: 'text', x: cx - dim.width / 2, y: baselineY, width: dim.width, height: dim.height };
}

/**
 * Maps one `ActivityNodeGeo` to the `CompressShape` `renderNode`
 * (`activity-renderer-shapes.ts`) actually draws for it, or `null` for a
 * kind that draws nothing.
 *
 * - `break` -> nothing (`FtileBreak#drawU` draws nothing; our `renderNode`
 *   returns `''`).
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
 * - `if-merge` -> `polygon`, the node's own 24x24 box (D2 -- `renderIfMerge`
 *   draws `Hexagon.asPolygon(shadowing)`'s 4-point rhombus, whose bounding
 *   box is exactly `[x, x+24] x [y, y+24]`, `Hexagon.java:49-56`).
 * - `if-label` -> `text`, {@link ifLabelShape} (D3).
 * - `if-own-label` -> `text`, {@link ifOwnLabelShape} (T3k, companion fix
 *   -- the hexagon's own label, now its own node, see that function's doc).
 * - `note` -> `polygon`, {@link noteBox} (Opale is a `UPath`; `SlotFinder
 *   #drawPath` uses min/max, same as `drawPolygon`).
 * - `group`, `partition` -> `rect`, `ignoreX: true, ignoreY: true` (T3i,
 *   {@link FRAME_KINDS}'s own doc).
 * - everything else (start/stop/end/kill/spot/action/label/default) ->
 *   `rect`, the node's own box, neither flag set. Occupancy-wise this is
 *   IDENTICAL to `ellipse`/`empty` for a symmetric shape --
 *   `SlotFinder#drawRectangle`/`drawEllipse`/`drawEmpty` all compute
 *   `[x, x+width]`/`[y, y+height]` byte-identically (`SlotFinder.java
 *   :138-161`) -- so which of the three a plain box kind is tagged does
 *   not change any slot.
 */
function shapeForNode(node: ActivityNodeGeo, bounder: StringBounder, theme: Theme): CompressShape | null {
  if (NO_SHAPE_KINDS.has(node.kind)) return null;
  if (BAR_KINDS.has(node.kind)) {
    return { kind: 'rect', x: node.x, y: node.y, width: node.width, height: node.height, ignoreX: true };
  }
  if (CONDITION_KINDS.has(node.kind)) return { kind: 'polygon', ...conditionBox(node) };
  if (node.kind === 'if-merge') {
    return { kind: 'polygon', x: node.x, y: node.y, width: node.width, height: node.height };
  }
  if (node.kind === 'if-label') return ifLabelShape(node, bounder, theme);
  if (node.kind === 'if-own-label') return ifOwnLabelShape(node, bounder, theme);
  if (node.kind === 'note') return { kind: 'polygon', ...noteBox(node) };
  if (FRAME_KINDS.has(node.kind)) {
    return { kind: 'rect', x: node.x, y: node.y, width: node.width, height: node.height, ignoreX: true, ignoreY: true };
  }
  return { kind: 'rect', x: node.x, y: node.y, width: node.width, height: node.height };
}

/**
 * The terminal arrowhead at an edge's last point, oriented by
 * {@link edgeDecorationVector} (the same vector `renderer.ts#renderEdge`
 * passes its terminal `arrowTip`). A zero-length last segment still gets
 * its arrowhead (`ftile/Worm.java:161-168` draws the end decoration with no
 * length test), so the compressor keeps its 10 px. `undefined` when
 * `edge.arrowhead === false` (D6 -- a `null` end decoration never draws) or
 * no segment has length.
 */
function terminalArrowhead(edge: ActivityEdgeGeo, meta: EdgeMeta): CompressShape | undefined {
  if (edge.arrowhead === false) return undefined;
  const vector = edgeDecorationVector(edge);
  if (vector === undefined) return undefined;
  const last = edge.points[edge.points.length - 1]!;
  const ext = arrowHeadExtents(arrowDirection(vector.dx, vector.dy));
  const shape: CompressShape = {
    kind: 'polygon',
    x: last.x + ext.minX,
    y: last.y + ext.minY,
    width: ext.maxX - ext.minX,
    height: ext.maxY - ext.minY,
  };
  // `ParallelBuilderFork.java:172,229`: `ConnectionIn`/`ConnectionOut`
  // call `.ignoreForCompression()` ONLY in `drawTranslate` (the
  // cross-lane path -- same-lane `drawU`, lines 151-163/202-217, never
  // does). `Worm.java:159-168` then sets the decoration's
  // `compressionMode` to `ON_X`. A same-lane fork/split connector (or
  // one with an unlaned endpoint) must NOT skip X -- PARX family,
  // gevaxi-80-tone223/ciloke-34-pumi198 (same-lane fork, ws -> 0/-14).
  // PARX residual (T3c re-slot, closed b3w2): `ParallelBuilderSplit
  // .java:207-225,264-285`'s `drawTranslate` overloads NEVER call
  // `.ignoreForCompression()`, so a CROSS-lane split connector (e.g.
  // bugaja-31-jaso630) must never skip X either -- `meta.shape` now
  // carries the builder-kind discriminant (`'parallel-in-split'`/
  // `'parallel-out-split'`, set by `walk-fork-branches.ts`'s
  // `ForkBranchContext.isSplit`, `swimlane-placement.ts#EdgeShape`'s own
  // doc), so the `-split` variants fall through to no-skip below.
  const crossLane = meta.lane1 !== undefined && meta.lane2 !== undefined && meta.lane1 !== meta.lane2;
  if ((meta.shape === 'parallel-in' || meta.shape === 'parallel-out') && crossLane) {
    shape.polygonSkipMode = 'x';
  }
  return shape;
}

/**
 * The emphasized mid-segment arrowhead `renderer.ts#renderEdge` draws at the
 * midpoint of the FIRST segment whose direction equals `edge.emphasize`
 * (`Snake#emphasizeDirection`, `Worm.java:138-139,178-183`, D6) -- same
 * first-match search and direction/extents computation as the renderer.
 */
function emphasizeArrowhead(edge: ActivityEdgeGeo): CompressShape | undefined {
  const pts = edge.points;
  if (edge.emphasize === undefined) return undefined;
  for (let i = 0; i < pts.length - 1; i++) {
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    if (arrowDirection(dx, dy) !== edge.emphasize) continue;
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    const ext = arrowHeadExtents(arrowDirection(dx, dy));
    return {
      kind: 'polygon',
      x: midX + ext.minX,
      y: midY + ext.minY,
      width: ext.maxX - ext.minX,
      height: ext.maxY - ext.minY,
    };
  }
  return undefined;
}

/**
 * D4/T1b (`stop-1-edgemeta-zip.md` addendum): the extra arrowhead a
 * translate shape draws at its own `midArrowAt` point (`renderer.ts
 * #renderMidArrow`), built the exact same way as {@link emphasizeArrowhead}
 * -- same `arrowHeadExtents(dir)` polygon box -- so the compressor sees it
 * as an occupant and moves it with the snake (`compress-geometry.ts
 * #transformEdge`), matching the jar's shared compressing `UGraphic`
 * (`FtileWhile.java:307`; `UGraphicCompressOnXorY.java`).
 */
function midArrowShape(edge: ActivityEdgeGeo): CompressShape | undefined {
  if (edge.midArrowAt === undefined) return undefined;
  const { x, y, dir } = edge.midArrowAt;
  const ext = arrowHeadExtents(dir);
  return { kind: 'polygon', x: x + ext.minX, y: y + ext.minY, width: ext.maxX - ext.minX, height: ext.maxY - ext.minY };
}

/**
 * An edge label -- the `UText` `Snake#drawInternalLabel` draws
 * (`ftile/Snake.java:225-231`: `text.textBlock.drawU(ug.apply(UTranslate
 * .point(getTextBlockPosition(...))))`), which `SlotFinder#drawText`
 * registers (`klimt/compress/SlotFinder.java:121-128`). Upstream has ONE
 * draw site for every Snake label -- the switch case labels included:
 * `FtileDecorateInLabel#drawU` draws nothing of its own, only the body
 * `dy(yl)` lower (`vertical/FtileDecorateInLabel.java:71-74`); the text
 * comes from the connection's `Snake.withLabel(branch
 * .getTextBlockPositive(), ...)` (`cond/FtileSwitchWithManyLinks.java
 * :91-92,218-219`). So the box sits exactly where `renderer.ts
 * #renderEdgeLabelAligned` draws it: {@link getTextBlockPosition} over the
 * edge's own points with its push site's `labelAlign` (default
 * `arrowHorizontalAlignment()`, `AbstractFtile.java:108-110`), baseline via
 * `centeredFirstBaselineY`. The prior mid-point `x + 4, y - 4` estimate
 * mirrored a renderer convention retired by add3-T1b and sat up to 4 px
 * past the real ink, blocking X compression the jar applies.
 *
 * The extents stay the bounder's own dimension (`TextLimitFinder#drawText`
 * measures the `UText` through the `StringBounder`,
 * `klimt/drawing/TextLimitFinder.java:82-90`); the position inputs mirror
 * the renderer's (`measureLineWidth`, `height = font size`).
 * add4-T1f: a `\n` label is N `UText`s, each boxed by `SlotFinder#drawText`
 * (`SlotFinder.java:127-135`), stacked one font size apart
 * (`SheetBlock1.java:146-148`). Boxed as ONE envelope, {@link ifLabelShape}'s
 * convention: "from the first line's own ink-top to the last line's own
 * ink-bottom (max width across lines)"; the per-line slots touch, so the
 * envelope is the same slot set.
 */
function edgeLabelShape(edge: ActivityEdgeGeo, bounder: StringBounder, theme: Theme): CompressShape | undefined {
  if (edge.label === undefined) return undefined;
  const size = activityFontSize(theme, 'arrow');
  const lines = edge.label.split('\n');
  const width = Math.max(...lines.map((l) => bounder.getDimension(l, size).width));
  const placeDim = {
    width: Math.max(...lines.map((l) => measureLineWidth(theme, size, l))),
    height: size * lines.length,
  };
  const position = getTextBlockPosition(edge.points, placeDim, edge.labelAlign ?? DEFAULT_LABEL_ALIGN);
  const first = centeredFirstBaselineY(position.y + placeDim.height / 2, size, lines.length);
  const last = first + size * (lines.length - 1);
  const height = last - first + bounder.getDimension(lines[0]!, size).height;
  return { kind: 'text', x: position.x, y: last, width, height };
}

/** Every `CompressShape` one `ActivityEdgeGeo` contributes -- never its
 *  segments (`ULine`, never occupies, D1). */
function shapesForEdge(edge: ActivityEdgeGeo, meta: EdgeMeta, bounder: StringBounder, theme: Theme): CompressShape[] {
  const shapes: CompressShape[] = [];
  const terminal = terminalArrowhead(edge, meta);
  if (terminal !== undefined) shapes.push(terminal);
  const emphasized = emphasizeArrowhead(edge);
  if (emphasized !== undefined) shapes.push(emphasized);
  const midArrow = midArrowShape(edge);
  if (midArrow !== undefined) shapes.push(midArrow);
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
    const shape = shapeForNode(node, input.bounder, input.theme);
    if (shape !== null) shapes.push(shape);
    if (FRAME_KINDS.has(node.kind)) {
      shapes.push(frameTabShape(node, input.theme));
    }
  }
  for (let i = 0; i < input.edges.length; i++) {
    shapes.push(...shapesForEdge(input.edges[i]!, input.edgeMeta[i]!, input.bounder, input.theme));
  }
  for (const r of input.reservations) shapes.push(shapeForReservation(r));
  shapes.push(...titleShapes(input.swimlanes, input.swimlaneBand, input.bounder, input.theme));
  return shapes;
}
