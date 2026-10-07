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
import { measureLineWidth } from '../../activity-text-placement.js';
import { centeredFirstBaselineY } from '../../activity-renderer-shapes.js';
import { DEFAULT_LABEL_ALIGN, getTextBlockPosition } from '../snake-text-position.js';

/** A label's draw inputs: its lines, the arrow font size, the block width
 *  (widest line, `measureLineWidth`) and the first line's `UText` point. */
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
 * The label placed on `points` alone: `Snake#getTextBlockPosition` for the
 * block's top-left (`Snake.java:244-270`), then the first baseline of a
 * LEFT Sheet of `lines.length` stripes, one font size each
 * (`Branch.java:247-257`, `SheetBlock1.java:146-148`,
 * `StringBounderFromWidthTable.java:69-71`).
 */
function placeOnPoints(edge: ActivityEdgeGeo, label: string, theme: Theme): EdgeLabelLayout {
  const size = activityFontSize(theme, 'arrow');
  const lines = label.split('\n');
  const width = Math.max(...lines.map((l) => measureLineWidth(theme, size, l)));
  const height = size * lines.length;
  const position = getTextBlockPosition(edge.points, { width, height }, edge.labelAlign ?? DEFAULT_LABEL_ALIGN);
  const baselineY = centeredFirstBaselineY(position.y + height / 2, size, lines.length);
  return { lines, size, width, x: position.x, baselineY };
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
