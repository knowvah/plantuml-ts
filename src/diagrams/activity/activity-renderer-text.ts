/**
 * activity-renderer-text.ts — every activity `<text>` goes through the
 * klimt `DriverTextSvg` (decisions.md#D1), not a hand-built attribute list.
 *
 * `renderer.ts`/`activity-renderer-shapes.ts` used to call `core/svg.ts
 * #text(x, y, content, style)` directly, which never emitted `textLength`
 * (no caller ever set `style.textLength`) and carried no real relationship
 * to the jar's own ascent metrics. `DriverTextSvg` (`core/klimt/drawing/
 * svg/driver-text-svg.ts`) is the SAME driver `mindmap/index.ts:129` and
 * `state/renderer-arrowhead.ts` already draw through — it measures
 * `textLength` off the injected `StringBounder` and emits the `<text>`
 * exactly as `SvgGraphics#text` does, which is how `rarodo-65-fudu505`'s
 * jar output carries `textLength="19.275"` on a 12px `first` label.
 *
 * `x`/`y` are the CALLER's already-resolved baseline position --
 * `activity-text-placement.ts#boxLineX`/`centeredLineX` for `x`;
 * `ASCENT_FRACTION`-sourced arithmetic in `activity-renderer-shapes.ts`
 * for `y` (`centeredFirstBaselineY`, verified against `rarodo`'s
 * `rect.y + 19.333` and `rerovo-62-nazo755`'s hexagon-label `cy + 3.056`,
 * both `padding/geometric-centre + fontSize * (ASCENT_FRACTION - 1/2)`
 * reduced to the N=1 case of the SAME formula the N>1 multi-line path
 * already used). This module's only job is the DRAW -- the same
 * throwaway-`UGraphicSvg` + `extractFlatContent` technique `state/
 * renderer-arrowhead.ts#drawArrowMarkup` and `class/renderer-group.ts
 * #svgFromShapes` already use for a polygon/line, applied here to a
 * `UText`.
 *
 * `dominant-baseline`/`text-anchor` CSS centring tricks the pre-driver
 * code used (`renderDiamond`'s `dominantBaseline: 'middle'`, `renderer.ts
 * #renderEdgeLabel`'s `'central'`) are NOT ported here: `DriverTextSvg`
 * emits neither attribute (it reads `param.getTranslate().getDy()` as the
 * literal SVG `y`, no baseline adjustment of its own), and zero cached jar
 * activity SVG carries a `dominant-baseline` token -- every caller that
 * used to lean on one now computes its own real baseline via
 * `centeredFirstBaselineY` instead (D1).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/svg/DriverTextSvg.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/svg/SvgGraphics.java (the `text(...)` method)
 */

import { UGraphicSvg } from '../../core/klimt/drawing/svg/u-graphic-svg.js';
import { basicSvgOption } from '../../core/klimt/drawing/svg/svg-graphics.js';
import type { StringBounder as DriverStringBounder } from '../../core/klimt/drawing/svg/driver-text-svg.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import { UText } from '../../core/klimt/shape/UText.js';
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import { extractFlatContent } from '../../core/klimt/document-shell-fragment.js';
import { WidthTableMeasurer } from '../../core/measurer.js';

/** `$version$` — the same placeholder literal `state/renderer-arrowhead.ts
 *  #drawArrowMarkup` and `class/renderer-group.ts#svgFromShapes` pass to a
 *  throwaway `UGraphicSvg`; this module's draws never reach the real
 *  `<?plantuml $version$?>` processing instruction either. */
const THROWAWAY_VERSION = '$version$';

/** The width-only `StringBounder` seam `DriverTextSvg` needs to compute
 *  `textLength`. Reuses the SAME `WidthTableMeasurer` class `activity-
 *  text-placement.ts#measureLineWidth` already sizes every box with
 *  (deterministic-conformance-harness parity, that module's own doc
 *  comment) — a fresh module-level instance, matching that module's own
 *  precedent (stateless, table-lookup only, no DOM). */
const MEASURER = new WidthTableMeasurer();

const TEXT_STRING_BOUNDER: DriverStringBounder = {
  calculateDimension(font, text) {
    return { width: MEASURER.measure(text, font).width };
  },
};

/** The minimal font-rendering surface this diagram's text ever needs --
 *  family/size/fill; no activity label carries bold/italic/underline
 *  styling, so `FontConfiguration.styles` is always empty here. */
export interface ActivityTextStyle {
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly fill: string;
}

function toFontConfiguration(style: ActivityTextStyle): FontConfiguration {
  return { family: style.fontFamily, size: style.fontSize, color: style.fill, styles: new Set() };
}

/**
 * One `<text>` element, drawn through `UGraphicSvg`/`DriverTextSvg` -- the
 * replacement for every direct `core/svg.ts#text(...)` call this diagram
 * used to make (D1). `x`/`y` are the final SVG `x`/`y` attribute values
 * (the baseline), exactly as `core/svg.ts#text`'s own signature already
 * expected -- callers need no translation-math change beyond dropping any
 * `dominantBaseline`/`textAnchor` they used to pass.
 */
export function drawActivityText(x: number, y: number, content: string, style: ActivityTextStyle): string {
  const ug = UGraphicSvg.build(0, basicSvgOption(), THROWAWAY_VERSION, TEXT_STRING_BOUNDER);
  ug.apply(new UTranslate(x, y)).draw(UText.build(content, toFontConfiguration(style)));
  return extractFlatContent(ug.getSvgString()).body;
}

/**
 * One `<text>` PER LINE (`activity-renderer-shapes.ts`'s own D3: never
 * `<tspan>` — multi-STYLE-run serialisation is creole's concern, not this
 * diagram's `\n`-split labels), each drawn through {@link
 * drawActivityText}.
 */
export function drawActivityTextLines(
  lines: readonly string[],
  x: number,
  firstBaselineY: number,
  lineHeight: number,
  style: ActivityTextStyle,
): string {
  return lines.map((ln, i) => drawActivityText(x, firstBaselineY + lineHeight * i, ln, style)).join('');
}
