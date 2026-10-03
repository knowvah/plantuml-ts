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
import { UText, FontStyle } from '../../core/klimt/shape/UText.js';
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import { extractFlatContent } from '../../core/klimt/document-shell-fragment.js';
import { WidthTableMeasurer } from '../../core/measurer.js';
import { linkWrap } from '../../core/svg.js';
import { creoleTextLines } from '../../core/svek/image/creole-text-lines.js';
import type { CreoleTextRun } from '../../core/svek/image/creole-text-lines.js';
import { isTableRowLine, tableRowCellsOf } from './activity-text-placement.js';

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

/** One already-resolved run drawn through `UGraphicSvg`/`DriverTextSvg` --
 *  the shared primitive {@link drawActivityText}'s plain path and every
 *  creole run below funnel through, so a creole run's `textLength`/
 *  decoration emission stays byte-identical to the pre-T3e plain path. */
function drawRun(x: number, y: number, text: string, font: FontConfiguration): string {
  const ug = UGraphicSvg.build(0, basicSvgOption(), THROWAWAY_VERSION, TEXT_STRING_BOUNDER);
  ug.apply(new UTranslate(x, y)).draw(UText.build(text, font));
  return extractFlatContent(ug.getSvgString()).body;
}

/** `StripeTable`'s stripped cells drawn LEFT-aligned, no padding, side by
 *  side (`AtomTable#drawU`'s `dx = 0` branch, `AtomTable.java:133-137`) --
 *  see `activity-text-placement.ts#tableRowCellsOf`'s own doc comment for
 *  this function's single-column/no-grid scope (T3e's two assigned rows,
 *  `activity-creole-table`/`niletu-83-lego826`). The merged table's own
 *  grid `<line>` rules (`AtomTable.java:150-158`) are NOT drawn here --
 *  they need the whole table's row/column bounds, only known at the
 *  per-node renderer call site (`activity-renderer-shapes.ts
 *  #renderAction`, T3f, outside this task's write-set) -- reported as a
 *  residual, not forced. */
function drawCreoleTableRow(x: number, y: number, content: string, style: ActivityTextStyle): string {
  const font = toFontConfiguration(style);
  let cx = x;
  let out = '';
  for (const cell of tableRowCellsOf(content)) {
    out += drawRun(cx, y, cell, font);
    cx += MEASURER.measure(cell, { family: style.fontFamily, size: style.fontSize }).width;
  }
  return out;
}

/** One `CreoleTextRun`'s `FontStyleFlags` -> the `FontStyle` set
 *  `DriverTextSvg` reads -- the SAME four flags `state/renderer-box.ts
 *  #runDecoration` maps to `text-decoration`, applied here as
 *  `FontConfiguration.styles` instead since activity draws through the
 *  klimt driver directly (D1), not `core/svg.ts#text`'s own attribute bag. */
function fontConfigForRun(run: CreoleTextRun, style: ActivityTextStyle): FontConfiguration {
  const styles = new Set<FontStyle>();
  if (run.style.bold) styles.add(FontStyle.BOLD);
  if (run.style.italic) styles.add(FontStyle.ITALIC);
  if (run.style.underline) styles.add(FontStyle.UNDERLINE);
  if (run.style.strike) styles.add(FontStyle.STRIKE);
  return { family: style.fontFamily, size: run.size, color: run.color ?? style.fill, styles };
}

/**
 * A `[[url]]`-bearing physical line: `CommandCreoleUrl`'s resolved
 * label/url/surrounding-text run sequence, built by the SAME creole lexer
 * (`buildLineAtoms`, via `creoleTextLines`) `CommandCreoleUrl.ts` registers
 * against. Each run draws at `y + run.dy` (0 for every NORMAL run --
 * `creole-sea-line.ts`'s own baseline-offset contract, decisions.md#D2) and
 * wraps in `<a href>` when it carries a url (`core/svg.ts#linkWrap`, the
 * SAME string-emitting `<a>` wrapper every other engine's url runs use,
 * jar-verified byte-exact per that function's own doc comment).
 *
 * T2c: `tooltip: run.tooltip ?? run.url` now carries the creole command's
 * own resolved `{tooltip}` -- `creole-text-lines.ts#textAtomMeasured` was
 * dropping `atom.url.tooltip` on the floor (`CreoleAtomUrl` already
 * carried both halves correctly; only the copy into `CreoleTextRun` was
 * narrowed). Fixes `zamagu-75-vape137`'s `title`/`xlink:title`.
 * `state/renderer-box.ts#renderStateRuns` (a different engine) still
 * passes `run.url` as its own `tooltip` arg, so it is UNCHANGED by the
 * new field's mere existence -- not this task's row to fix.
 *
 * STILL NOT READ here, reported rather than fixed: `skinparam
 * hyperlinkUnderline`/`svgLinkTarget` -- both now have a `Theme` field
 * (`theme.ts#hyperlinkUnderline`/`#svgLinkTarget`, T2c), but every url
 * run still keeps `FontStyle.UNDERLINE` unconditionally
 * (`CommandCreoleUrl.ts`'s own unconditional
 * `.add(FontStyle.UNDERLINE)`) and `linkWrap`'s `target` keeps its own
 * `_top` default: `ActivityTextStyle` (this file) carries no `theme`
 * field, and the one call site that would need to supply it for an
 * ACTION node's label (`activity-renderer-shapes.ts#renderAction`) is
 * outside this task's write-set. Affects `gaxezi-48-zesa921`/
 * `nisexe-68-vabu320`/`pekuxe-00-bovi270`.
 */
function drawCreoleUrlLine(x: number, y: number, content: string, style: ActivityTextStyle): string {
  const font = { family: style.fontFamily, size: style.fontSize };
  const lines = creoleTextLines(content, font, MEASURER);
  const line = lines[0];
  if (line === undefined || line.kind !== 'text') return drawRun(x, y, content, toFontConfiguration(style));
  let cx = x;
  let out = '';
  for (const run of line.runs) {
    // `image` (latex/math) runs carry no text -- no row this task owns
    // reaches a `[[url]]` line that also carries `<latex>`/`<math>`.
    if (run.text === '') continue;
    const drawn = drawRun(cx, y + run.dy, run.text, fontConfigForRun(run, style));
    out += run.url !== undefined ? linkWrap(drawn, { url: run.url, tooltip: run.tooltip ?? run.url }) : drawn;
    cx += MEASURER.measure(run.text, { family: style.fontFamily, size: run.size }).width;
  }
  return out;
}

/**
 * One `<text>` element, drawn through `UGraphicSvg`/`DriverTextSvg` -- the
 * replacement for every direct `core/svg.ts#text(...)` call this diagram
 * used to make (D1). `x`/`y` are the final SVG `x`/`y` attribute values
 * (the baseline), exactly as `core/svg.ts#text`'s own signature already
 * expected -- callers need no translation-math change beyond dropping any
 * `dominantBaseline`/`textAnchor` they used to pass.
 *
 * T3e: a `|cell|`/`[[url]]`-bearing physical line routes through the real
 * creole seam ({@link drawCreoleTableRow}/{@link drawCreoleUrlLine})
 * instead of being drawn as one literal run -- every OTHER line (this
 * port's existing corpus, including every pinned golden) is drawn exactly
 * as before, since neither trigger (`[[`, a leading `|`) appears in a
 * plain activity label.
 */
export function drawActivityText(x: number, y: number, content: string, style: ActivityTextStyle): string {
  if (isTableRowLine(content)) return drawCreoleTableRow(x, y, content, style);
  if (content.includes('[[')) return drawCreoleUrlLine(x, y, content, style);
  return drawRun(x, y, content, toFontConfiguration(style));
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
