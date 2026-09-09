/**
 * Swimlane chrome: dividers, the transparent title band, and the floating
 * per-lane titles. Split out of `renderer.ts` (file-length cap); called
 * once from `renderActivity` when `geo.swimlanes.length > 1`
 * (`Swimlanes.java:275`'s own `size() > 1` guard -- a single lane draws
 * nothing).
 *
 * Draw order mirrors `Swimlanes#drawWhenSwimlanes` (`:318-356`, D5 of
 * `plans/activity-swimlane-rendering/decisions.md`): the band, then for
 * each lane its own nodes followed by that lane's LEFT divider, then the
 * trailing (rightmost) divider, then every edge (unchanged, drawn by
 * `renderActivity` itself), then titles LAST.
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/Swimlanes.java
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/LaneDivider.java
 */

import type { ActivityGeometry, ActivityNodeGeo } from './layout/tile-layout.js';
import type { Theme } from '../../core/theme.js';
import { line, rect, text } from '../../core/svg.js';
import { renderNode } from './activity-renderer-shapes.js';
import {
  swimlaneBorderColor,
  swimlaneBorderThickness,
  swimlaneHeaderBackground,
  swimlaneTitleFontColor,
  swimlaneTitleFontSize,
} from './activity-style-defaults.js';

/**
 * The ASCENT fraction a title's baseline sits at within the band, from
 * `StringBounder#getDescent` = `size / 4.5` (`klimt/font/StringBounder
 * .java:47`) -- the SAME ratio `activity-renderer-shapes.ts#ASCENT_FRACTION`
 * uses for every other activity label. Verified against two pinned
 * fixtures: `sikino-19-vuca111` (`SwimlaneTitleFontSize 8`, band y=16) ->
 * baseline 22.222 = 16 + 8*7/9; `pakema-21-xema183` (default 18, band
 * y=17.5) -> baseline 31.5 = 17.5 + 18*7/9. Both exact.
 */
const TITLE_ASCENT_FRACTION = 1 - 1 / 4.5;

/**
 * The transparent (or user-coloured) title-band rect (D3). Emits
 * `fill="none"` when no `SwimlaneTitleBackgroundColor` override resolves,
 * matching `renderEdgeLabel`'s own `stroke: 'none'` "paint nothing"
 * convention rather than a resolved `#00000000`.
 */
function renderSwimlaneBand(geo: ActivityGeometry, theme: Theme): string {
  if (geo.swimlaneBand === undefined) return '';
  const { x, y, width, height } = geo.swimlaneBand;
  return rect(x, y, width, height, { fill: swimlaneHeaderBackground(theme), stroke: 'none' });
}

/** Every lane boundary X, INCLUDING both outer edges -- `n + 1` dividers
 *  for `n` lanes (`Swimlanes.java:318-350`'s own loop over
 *  `swimlanesSpecial()`, which has one more entry than `swimlanes()`). */
function dividerXs(swimlanes: ActivityGeometry['swimlanes']): number[] {
  const xs = swimlanes.map((s) => s.x);
  const last = swimlanes[swimlanes.length - 1]!;
  xs.push(last.x + last.width);
  return xs;
}

/** Buckets `geo.nodes` by their own `swimlane` field, preserving each
 *  bucket's relative order. A node with no matching lane (should not
 *  occur once lanes exist -- T5 inherits a lane for every AST-derived
 *  tile) is returned separately so it is still drawn, just not
 *  interleaved with a divider. */
function bucketNodesByLane(geo: ActivityGeometry): {
  before: ActivityNodeGeo[];
  byLane: Map<string, ActivityNodeGeo[]>;
} {
  const byLane = new Map<string, ActivityNodeGeo[]>();
  for (const lane of geo.swimlanes) byLane.set(lane.name, []);
  const before: ActivityNodeGeo[] = [];
  for (const node of geo.nodes) {
    const bucket = node.swimlane !== undefined ? byLane.get(node.swimlane) : undefined;
    if (bucket !== undefined) bucket.push(node);
    else before.push(node);
  }
  return { before, byLane };
}

/**
 * Band, then per-lane nodes interleaved with that lane's own LEFT
 * divider, then the trailing divider (`Swimlanes.java:318-350`). Edges and
 * titles are drawn separately by `renderActivity` (D5): edges after every
 * divider, titles last.
 */
export function renderSwimlaneChrome(geo: ActivityGeometry, theme: Theme): string {
  if (geo.swimlaneDividerY === undefined) return renderSwimlaneBand(geo, theme);
  const { y1, y2 } = geo.swimlaneDividerY;
  const stroke = swimlaneBorderColor(theme);
  const strokeWidth = swimlaneBorderThickness(theme);
  const { before, byLane } = bucketNodesByLane(geo);

  let out = renderSwimlaneBand(geo, theme);
  for (const n of before) out += renderNode(n, theme);
  for (const lane of geo.swimlanes) {
    for (const n of byLane.get(lane.name) ?? []) out += renderNode(n, theme);
    out += line(lane.x, y1, lane.x, y2, { stroke, strokeWidth });
  }
  const xs = dividerXs(geo.swimlanes);
  out += line(xs[xs.length - 1]!, y1, xs[xs.length - 1]!, y2, { stroke, strokeWidth });
  return out;
}

/**
 * Lane titles, drawn LAST (D5) -- `Swimlanes#drawTitles` (`:369-377`) via
 * `CenteredText` (`klimt/compress/UGraphicCompressOnXorY.java:100-112`):
 * LEFT-ALIGNED text at `contentX + (contentWidth - textWidth) / 2`, never
 * `text-anchor="middle"`, not bold (the root `swimlane { }` block declares
 * no `FontStyle`). `contentX`/`contentWidth`/`titleWidth` are T5's own
 * `SwimlaneGeo` fields, already measured at layout time.
 */
export function renderSwimlaneTitles(geo: ActivityGeometry, theme: Theme): string {
  if (geo.swimlaneBand === undefined) return '';
  const fontSize = swimlaneTitleFontSize(theme);
  const fill = swimlaneTitleFontColor(theme);
  const baselineY = geo.swimlaneBand.y + fontSize * TITLE_ASCENT_FRACTION;
  let out = '';
  for (const lane of geo.swimlanes) {
    const contentX = lane.contentX ?? lane.x;
    const contentWidth = lane.contentWidth ?? lane.width;
    const titleX = contentX + (contentWidth - (lane.titleWidth ?? 0)) / 2;
    out += text(titleX, baselineY, lane.name, { fontFamily: theme.fontFamily, fontSize, fill });
  }
  return out;
}
