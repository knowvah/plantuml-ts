/**
 * Edge-label placement through compression (add4-T3a, R2).
 *
 * Upstream computes a Snake label's position on the RAW worm and only then
 * draws it through the compressing `UGraphic`:
 *
 * - `Snake#drawInternalLabel` -> `getTextBlockPosition` reads
 *   `worm.getPoint(i)` (`ftile/Snake.java:225-231,244-270`). `Worm#getPoint`
 *   resolves a point through the Worm's OWN `tr` (its `move` translate,
 *   `ftile/Worm.java:65-79,322-330`), never through the `UGraphic`, so the
 *   position is pre-compression.
 * - `text.textBlock.drawU(ug.apply(UTranslate.point(position)))` then emits
 *   each line's `UText` through `UGraphicCompressOnXorY#draw`'s fallthrough
 *   branch, `getUg().apply(getTranslate(x, y)).draw(shape)`, which maps the
 *   draw point through `ct()` on that pass's axis
 *   (`klimt/compress/UGraphicCompressOnXorY.java:87-128`). The ON_Y builder
 *   wraps the ON_X builder (`ActivityDiagram3.java:209-210`;
 *   `CompressionXorYBuilder.java:72-75`), so the point is `ctX` then `ctY`.
 *
 * `getTextBlockPosition` is not compression-equivariant (CENTER is
 * `(first.y + last.y - 10) / 2 - h / 2`, LD/RD the mid of `pt1`/`pt3`):
 * when a removed slot sits inside the span it averages, recomputing on the
 * compressed points lands elsewhere than `ct(position)`.
 *
 * The port keeps the raw anchor (the first line's `UText` draw point:
 * block left x, first baseline) through both passes, and stores on the edge
 * the {@link ActivityEdgeGeo.labelDelta} between that anchor and the
 * position recomputed on the edge's own points. A delta, not an absolute
 * point, so every later rigid translate of `edge.points` (the canvas-origin
 * shift) carries the label with it: `getTextBlockPosition` is
 * translation-equivariant in every branch.
 *
 * Multi-line labels transform as one anchor. Each line is its own `UText`
 * (`SheetBlock1.java:146-148`, one font size apart) and `ct` maps each
 * baseline, but the per-line ink slots touch (`TextLimitFinder`'s
 * `[b - h + 1.5, b + 1.5]` with `h` = the font size), so no removed slot
 * falls between two lines and `ct(b + k * size) = ct(b) + k * size`.
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/Snake.java:225-231,244-270
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/Worm.java:322-330
 * @see net/sourceforge/plantuml/klimt/compress/UGraphicCompressOnXorY.java:87-128
 */

import type { ActivityEdgeGeo } from '../../activity-geometry.types.js';
import type { Theme } from '../../../../core/theme.js';
import type { PiecewiseAffineTransform } from './compression-transform.js';
import type { CompressionMode } from './slot.js';
import { activityFontSize } from '../../activity-style-defaults.js';
import { ASCENT_FRACTION } from '../../activity-renderer-shapes.js';
import { activityDisplayBlock, activityTextFontConfiguration } from '../../activity-text-sheet.js';
import { klimtStringBounder } from '../../activity-creole-sheet.js';
import { HorizontalAlignment } from '../../../../core/klimt/geom/HorizontalAlignment.js';
import { CreoleMode } from '../../../../core/klimt/creole/CreoleMode.js';
import type { StringMeasurer } from '../../../../core/measurer.js';
import { activityMeasurer } from '../../activity-string-bounder.js';
import { activityWrapWidth } from '../../activity-text-style.js';
import type { TextBlock } from '../../../../core/klimt/shape/TextBlock.js';
import { DEFAULT_LABEL_ALIGN, getTextBlockPosition } from '../snake-text-position.js';

/** A label's draw inputs: its lines, the arrow font size, the block width
 *  ({@link edgeLabelBlockSize}) and the block's anchor: its left `x` and
 *  `top + size * ASCENT_FRACTION` (the renderer recovers the top from it). */
export interface EdgeLabelLayout {
  readonly lines: readonly string[];
  readonly size: number;
  readonly width: number;
  readonly x: number;
  readonly baselineY: number;
}

/** The first `UText` draw point of a label. */
export interface LabelAnchor {
  readonly x: number;
  readonly y: number;
}

/**
 * The block an edge label draws: `FtileFactoryDelegator#getTextBlock`'s
 * `create7(fc, LEFT, skinParam, SIMPLE_LINE)` (`FtileFactoryDelegator.java:
 * 103-112`, `LineBreakStrategy.NONE`), or -- `wrapped`, a switch case's
 * label -- `Branch#getTextBlock`'s `create0(fcArrow, LEFT, skinParam,
 * style.wrapWidth(), SIMPLE_LINE)` (`Branch.java:248-258`, isw-T2-act F5).
 */
export function edgeLabelBlock(label: string, theme: Theme, wrapped: boolean): TextBlock {
  const fc = activityTextFontConfiguration(theme, activityFontSize(theme, 'arrow'), 'arrow');
  return activityDisplayBlock(label, theme, {
    fontConfiguration: fc,
    horizontalAlignment: HorizontalAlignment.LEFT,
    creoleMode: CreoleMode.SIMPLE_LINE,
    ...(wrapped ? { maxMessageSize: activityWrapWidth(theme, 'arrow') } : {}),
  });
}

/**
 * `text.textBlock.calculateDimension(stringBounder)` (`Snake.java:247`) for
 * the block the renderer draws: `FtileFactoryDelegator#getTextBlock`'s
 * `create7(fc, LEFT, skinParam, CreoleMode.SIMPLE_LINE)`
 * (`FtileFactoryDelegator.java:103-112`) -- creole resolved, every stripe's
 * `AtomText` floor (`AtomText.java:179-181`) and `SheetBlock1`'s padding on
 * both axes (`SheetBlock1.java:194-197`) included. A `<back:color>` the
 * parser lifted into `edge.color` changes no extent. `measurer` is the
 * caller's `StringBounder` (the compressor's injected one); the render's own
 * (`activity-string-bounder.ts`) by default.
 */
export function edgeLabelBlockSize(
  label: string,
  theme: Theme,
  measurer: StringMeasurer = activityMeasurer(theme),
  wrapped = false,
): { width: number; height: number } {
  const size = activityFontSize(theme, 'arrow');
  const fc = activityTextFontConfiguration(theme, size, 'arrow');
  const tb = edgeLabelBlock(label, theme, wrapped);
  const dim = tb.calculateDimension(klimtStringBounder(measurer, { family: fc.family, size }));
  return { width: dim.getWidth(), height: dim.getHeight() };
}

/**
 * The label placed on `points` alone: `Snake#getTextBlockPosition` for the
 * block's top-left (`Snake.java:244-270`) over the drawn block's own
 * dimension ({@link edgeLabelBlockSize}).
 */
function placeOnPoints(edge: ActivityEdgeGeo, label: string, theme: Theme): EdgeLabelLayout {
  const size = activityFontSize(theme, 'arrow');
  const lines = label.split('\n');
  const dim = edgeLabelBlockSize(label, theme, undefined, edge.labelWrapped === true);
  const position = getTextBlockPosition(edge.points, dim, edge.labelAlign ?? DEFAULT_LABEL_ALIGN);
  return { lines, size, width: dim.width, x: position.x, baselineY: position.y + size * ASCENT_FRACTION };
}

/**
 * Where the label is drawn: placed on `edge.points`, moved by
 * `edge.labelDelta` when compression set one. `undefined` without a label.
 * The one placement every consumer reads (renderer, slot finder).
 */
export function edgeLabelLayout(edge: ActivityEdgeGeo, theme: Theme): EdgeLabelLayout | undefined {
  if (edge.label === undefined) return undefined;
  const placed = placeOnPoints(edge, edge.label, theme);
  const delta = edge.labelDelta;
  if (delta === undefined) return placed;
  return { ...placed, x: placed.x + delta.x, baselineY: placed.baselineY + delta.y };
}

/** Each edge's current label anchor ({@link edgeLabelLayout}'s draw point),
 *  `undefined` for an unlabelled edge. Read once on the raw geometry. */
export function labelAnchors(edges: readonly ActivityEdgeGeo[], theme: Theme): (LabelAnchor | undefined)[] {
  return edges.map((edge) => {
    const layout = edgeLabelLayout(edge, theme);
    return layout === undefined ? undefined : { x: layout.x, y: layout.baselineY };
  });
}

/** One pass's `ct()` applied to every anchor on that pass's axis
 *  (`UGraphicCompressOnXorY.java:122-128`, `getTranslate`). */
export function transformAnchors(
  anchors: readonly (LabelAnchor | undefined)[],
  ct: PiecewiseAffineTransform,
  mode: CompressionMode,
): (LabelAnchor | undefined)[] {
  return anchors.map((a) => {
    if (a === undefined) return undefined;
    return mode === 'x' ? { x: ct.transform(a.x), y: a.y } : { x: a.x, y: ct.transform(a.y) };
  });
}

/**
 * Re-bases every labelled edge's `labelDelta` on its (transformed) points:
 * `anchor - placeOnPoints(points)`. A zero delta is left unset, so an edge
 * whose label compression did not displace keeps its prior shape.
 */
export function withLabelDeltas(
  edges: readonly ActivityEdgeGeo[],
  anchors: readonly (LabelAnchor | undefined)[],
  theme: Theme,
): ActivityEdgeGeo[] {
  return edges.map((edge, i) => {
    const anchor = anchors[i];
    const { labelDelta: _stale, ...rest } = edge;
    if (anchor === undefined || edge.label === undefined) return edge;
    const placed = placeOnPoints(edge, edge.label, theme);
    const delta = { x: anchor.x - placed.x, y: anchor.y - placed.baselineY };
    return delta.x === 0 && delta.y === 0 ? rest : { ...rest, labelDelta: delta };
  });
}
