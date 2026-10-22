/**
 * Draw pass for `{a1} <-> {a2} : label`.
 *
 * `LinkAnchor#drawAnchor` builds a `Snake` of two points -- the worm's x, from
 * `ymin + 2` down to `ymax - 2` -- with an UP head at its start and a DOWN
 * head at its end, plus a centred label, and calls `Snake#drawInternal`
 * (`LinkAnchor.java:112-117`). `Worm#drawInternalOneColor` strokes the line
 * first (`:134-144`), then the start decoration, then the end decoration under
 * `UStroke.simple()` (`:156-171`); `Snake#drawInternalLabel` closes with the
 * text (`Snake.java:221-231`).
 *
 * `PlayingSpace#drawUInternal` runs the whole loop in BOTH
 * `drawBackground` and `drawForeground` (`PlayingSpace.java:109-134`), so the
 * link is emitted twice: after the background tiles, and again after the
 * foreground ones. The jar's own SVG carries each link twice (fojomu, zoturo,
 * nizuzi).
 *
 * The geometry is unscaled layout space (`sequence-layout-link-anchor.ts`);
 * every length is scaled here at emission, as `SvgGraphics#format` does.
 *
 * @see ~/git/plantuml/.../sequencediagram/LinkAnchor.java:82-123
 * @see ~/git/plantuml/.../activitydiagram3/ftile/Worm.java:119-172
 */

import { FontStyle } from '../../core/klimt/shape/UText.js';
import { fmt } from '../../core/svg-format.js';
import { line, polygon } from '../../core/svg.js';
import { arrowHeadPointsFor, type ArrowDir } from '../activity/arrows-regular.js';
import { creoleRunText } from './renderer.js';
import { scaleRun, type ScaledTheme } from './scale-geo.js';
import type { LinkAnchorGeo } from './geo.js';

/** `ug.apply(UStroke.simple())` before an arrow decoration (`Worm.java:162,170`):
 *  thickness 1, whatever the style says. */
const DECORATION_THICKNESS = 1;

// Link geometry rides the unscaled `SequenceGeometry.linkAnchors`, which
// `scaleSequenceGeometry` does not touch: it is scaled here, at emission.

function head(dir: ArrowDir, tip: { x: number; y: number }, geo: LinkAnchorGeo, theme: ScaledTheme): string {
  const k = theme.scaleK;
  const points = arrowHeadPointsFor(theme, dir).map((p) => ({ x: tip.x + p.x * k, y: tip.y + p.y * k }));
  return polygon(points, { fill: geo.stroke, stroke: geo.stroke, strokeWidth: DECORATION_THICKNESS * k });
}

/** One link: the shaft, its two heads, then the label. */
function renderLinkAnchor(geo: LinkAnchorGeo, theme: ScaledTheme): string {
  const k = theme.scaleK;
  const [x, yStart, yEnd] = [geo.x * k, geo.yStart * k, geo.yEnd * k];
  const shaft = line(x, yStart, x, yEnd, {
    stroke: geo.stroke,
    strokeWidth: geo.thickness * k,
    ...(geo.dash === undefined ? {} : { strokeDasharray: `${fmt(geo.dash[0] * k)},${fmt(geo.dash[1] * k)}` }),
  });
  const bold = geo.font.styles.has(FontStyle.BOLD);
  const label = geo.labelRuns.map((r) => creoleRunText(scaleRun(r, k), theme, geo.font.size * k, bold)).join('');
  return shaft + head('up', { x, y: yStart }, geo, theme) + head('down', { x, y: yEnd }, geo, theme) + label;
}

/** `PlayingSpace#drawUInternal:129-134`'s link loop, once. */
export function renderLinkAnchors(anchors: readonly LinkAnchorGeo[] | undefined, theme: ScaledTheme): string {
  return (anchors ?? []).map((a) => renderLinkAnchor(a, theme)).join('');
}
