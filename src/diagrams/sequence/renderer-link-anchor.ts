/**
 * Draw pass for `{a1} <-> {a2} : label`, through the page's `UGraphic`
 * (sdd3 T8e).
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
 * link is drawn twice: after the background tiles, and again after the
 * foreground ones. The jar's own SVG carries each link twice (fojomu, zoturo,
 * nizuzi).
 *
 * The geometry is layout space (`sequence-layout-link-anchor.ts`), drawn at
 * scale 1; the export scale is the exporter's `SvgGraphics#format` pass.
 *
 * @see ~/git/plantuml/.../sequencediagram/LinkAnchor.java:82-123
 * @see ~/git/plantuml/.../activitydiagram3/ftile/Worm.java:119-172
 */

import type { UGraphic } from '../../core/klimt/UGraphic.js';
import { Back } from '../../core/klimt/Back.js';
import { Fore } from '../../core/klimt/Fore.js';
import { UStroke } from '../../core/klimt/UStroke.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import { ULine } from '../../core/klimt/shape/ULine.js';
import { UPolygon } from '../../core/klimt/shape/UPolygon.js';
import { FontStyle } from '../../core/klimt/shape/UText.js';
import { arrowHeadPointsFor, type ArrowDir } from '../activity/arrows-regular.js';
import type { PageTheme } from './renderer-ug.js';
import type { LinkAnchorGeo } from './geo.js';
import { drawCreoleRuns } from './sequence-text.js';

/** `ug.apply(UStroke.simple())` before an arrow decoration (`Worm.java:162,170`):
 *  thickness 1, whatever the style says. */
const DECORATION_THICKNESS = 1;

/** `Worm#drawInternalOneColor:156-171`: the decoration's colours, then
 *  `UStroke.withThickness(1.5)`, then -- on a fresh child -- the translate to
 *  the point and `UStroke.simple()`, and the polygon in its local frame. */
function drawHead(
  ug: UGraphic,
  dir: ArrowDir,
  tip: { x: number; y: number },
  geo: LinkAnchorGeo,
  theme: PageTheme,
): void {
  const polygon = new UPolygon(arrowHeadPointsFor(theme, dir));
  ug.apply(new Fore(geo.stroke))
    .apply(new Back(geo.stroke))
    .apply(UStroke.withThickness(1.5))
    .apply(new UTranslate(tip.x, tip.y))
    .apply(UStroke.withThickness(DECORATION_THICKNESS))
    .draw(polygon);
}

/** The shaft's `UStroke`: the arrow style's thickness and dash
 *  (`Worm.java:130-132`, `style.getStroke()`). */
function shaftStroke(geo: LinkAnchorGeo): UStroke {
  return geo.dash === undefined
    ? UStroke.withThickness(geo.thickness)
    : new UStroke(geo.dash[0], geo.dash[1], geo.thickness);
}

/** One link: the shaft, its two heads, then the label. */
function drawLinkAnchor(ug: UGraphic, geo: LinkAnchorGeo, theme: PageTheme): void {
  const [x, yStart, yEnd] = [geo.x, geo.yStart, geo.yEnd];
  // `Worm.java:126-132,160-164`: colour, `.bg()`, stroke, then `drawLine`'s
  // `ug.apply(new UTranslate(x1, y1))` and `draw(new ULine(x2 - x1, y2 - y1))`.
  ug.apply(new Fore(geo.stroke))
    .apply(new Back(geo.stroke))
    .apply(shaftStroke(geo))
    .apply(new UTranslate(x, yStart))
    .draw(new ULine(0, yEnd - yStart));
  drawHead(ug, 'up', { x, y: yStart }, geo, theme);
  drawHead(ug, 'down', { x, y: yEnd }, geo, theme);
  drawCreoleRuns(ug, geo.labelRuns, theme, geo.font.size, geo.font.styles.has(FontStyle.BOLD));
}

/** `PlayingSpace#drawUInternal:129-134`'s link loop, once. */
export function drawLinkAnchors(ug: UGraphic, anchors: readonly LinkAnchorGeo[] | undefined, theme: PageTheme): void {
  for (const anchor of anchors ?? []) drawLinkAnchor(ug, anchor, theme);
}
