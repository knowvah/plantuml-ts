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
import { linkWrap, line, type LineStyle } from '../../core/svg.js';
import { creoleTextLines } from '../../core/svek/image/creole-text-lines.js';
import type { CreoleTextRun, CreoleTextLine } from '../../core/svek/image/creole-text-lines.js';
import { JAR_DEFAULT_TEXT_COLOR } from '../../core/decoration/symbol/usymbol-resolve.js';
import { isTableRowLine, tableRowCellsOf } from './activity-text-placement.js';
import { activityPadding, activityLineThickness } from './activity-style-defaults.js';
import { activityFontColor } from './activity-text-style.js';
import type { Theme } from '../../core/theme.js';

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
  /** add2 T3e (family F): `theme.hyperlinkUnderline` (`core/theme-root-
   *  fields.ts`), forwarded by the caller that resolved it. `undefined`
   *  (no caller sets it yet) reads as `true` -- see {@link fontConfigForRun}. */
  readonly hyperlinkUnderline?: boolean;
  /** add2 T3e (family F): `theme.svgLinkTarget`, forwarded by the caller
   *  that resolved it. `undefined` falls through to `core/svg.ts
   *  #linkWrap`'s own `'_top'` parameter default. */
  readonly svgLinkTarget?: string;
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

/**
 * The merged table's own grid `<line>` rules `drawCreoleTableRow`'s own
 * doc comment deferred to this call site (T2f, mission `activity-
 * divergence-drive-2`) -- `AtomTable#drawU`'s `hline`/`vline` loops
 * (`AtomTable.java:150-158`), collapsed to the single-column,
 * uniform-row-height case this mission's two rows (`activity-creole-
 * table`, `niletu-83-lego826`) exercise: `rowCount + 1` horizontal rules
 * at `getStartingY(i) = i * lineHeight`, 2 vertical rules (one column) at
 * `getStartingX({0, 1}) = {0, tableWidth}`. `lineColor` defaults to the
 * font's own resolved color, not a fixed ink (`StripeTable.java:79-83`).
 * The table block is centred in the box the SAME way `renderMultilineText`
 * centres plain text (`TABLE_BLOCK_MARGIN_Y`'s own `AtomWithMargin(2,2)`
 * wrap washes out of a symmetric centre, `gtile-action.ts`'s own doc).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/atom/AtomTable.java:150-158
 */
export function renderCreoleTableGrid(
  box: { x: number; y: number; width: number; height: number },
  lines: readonly string[],
  lineHeight: number,
  theme: Theme,
): string {
  if (lines.length === 0 || !lines.every(isTableRowLine)) return '';
  const rowCount = lines.length;
  const pad = activityPadding('activity');
  const left = box.x + pad;
  const width = box.width - 2 * pad;
  const tableHeight = rowCount * lineHeight;
  const top = box.y + box.height / 2 - tableHeight / 2;
  const lineStyle: LineStyle = {
    stroke: activityFontColor(theme, 'activity'),
    strokeWidth: activityLineThickness(theme, 'activity'),
  };
  let out = '';
  for (let i = 0; i <= rowCount; i += 1) {
    const y = top + i * lineHeight;
    out += line(left, y, left + width, y, lineStyle);
  }
  out += line(left, top, left, top + tableHeight, lineStyle);
  out += line(left + width, top, left + width, top + tableHeight, lineStyle);
  return out;
}

/** One `CreoleTextRun`'s `FontStyleFlags` -> the `FontStyle` set
 *  `DriverTextSvg` reads -- the SAME four flags `state/renderer-box.ts
 *  #runDecoration` maps to `text-decoration`, applied here as
 *  `FontConfiguration.styles` instead since activity draws through the
 *  klimt driver directly (D1), not `core/svg.ts#text`'s own attribute bag.
 *
 * add2 T3e (family F): a url run's `run.style.underline` is set
 * unconditionally by `CommandCreoleUrl.ts` (klimt, outside this task's
 * write-set) -- `SkinParam#useUnderlineForHyperlink()` (`skin/
 * SkinParam.java:1056-1060`) only turns it OFF, so the suppression belongs
 * here, gated on `run.url !== undefined` so a user's own explicit creole
 * underline on NON-link text is never touched.
 *
 * add3-T2b: `run.color` is `creole-text-lines.ts#textAtomMeasured`'s copy
 * of the atom's own `FontConfiguration.color`, which starts life at
 * `leaf-sizing-text.ts#baseFontConfiguration`'s `JAR_DEFAULT_TEXT_COLOR`
 * (`'#000000'`) -- `FontSpec` (this seam's measurement-only font shape)
 * carries no colour field for the base to inherit the CALLER's already-
 * resolved `style.fill` from, so an ordinary NORMAL run (no creole
 * `<color:x>` command) carries that fixed black, not "unset." Widening
 * {@link drawActivityText} to route every line through this seam (D5)
 * exposed the bug a bare `run.color ?? style.fill` would otherwise paper
 * over: a `[[url]]`-only line, the sole pre-T2b caller, never coincided
 * with a non-black `activityFontColor`/theme/dark-mode fill in this port's
 * corpus, so the always-defined default silently won every time. Only a
 * run whose colour differs from that SENTINEL carries a real creole
 * override (`<color:x>`/`<back:x>`); anything else defers to the caller's
 * OWN cascaded fill, matching upstream's `FontConfiguration` cascade
 * (`FtileBox.java:178`'s `fc` argument, not a hardcoded jar default).
 * Jar-verified against `labala-74-juki864` (`!theme amiga`), `levuma-67-
 * cego489` (`skinparam mode dark`), `loxija-71-joku558`/`zepima-96-
 * peco612` (`skinparam activityFontColor red`) -- all four regressed to
 * black text under the bare fallback and are restored by this guard. */
function fontConfigForRun(run: CreoleTextRun, style: ActivityTextStyle): FontConfiguration {
  const styles = new Set<FontStyle>();
  if (run.style.bold) styles.add(FontStyle.BOLD);
  if (run.style.italic) styles.add(FontStyle.ITALIC);
  if (run.style.underline) styles.add(FontStyle.UNDERLINE);
  if (run.style.strike) styles.add(FontStyle.STRIKE);
  if (run.url !== undefined && style.hyperlinkUnderline === false) styles.delete(FontStyle.UNDERLINE);
  const hasExplicitColor = run.color !== undefined && run.color !== JAR_DEFAULT_TEXT_COLOR;
  return { family: style.fontFamily, size: run.size, color: hasExplicitColor ? run.color : style.fill, styles };
}

/**
 * One physical line, routed through the real creole lexer
 * (`buildLineAtoms`, via `creoleTextLines`) -- `FtileBox.java:178-181`'s
 * `skinParam.sheet(fc, align, CreoleMode.FULL).createSheet(label)` for an
 * action's label, `ConditionalBuilder.java:280-282`'s `CreoleMode
 * .SIMPLE_LINE` for a branch/condition label (both reach this ONE drawing
 * primitive: neither caller passes its own `CreoleMode` through today, so
 * the distinction is not yet observable in this port -- see this task's
 * final report). add3-T2b (D5) widens this from the pre-existing `[[url]]`
 * trigger (`CommandCreoleUrl`'s resolved label/url/surrounding-text run
 * sequence, `CommandCreoleUrl.ts`) to EVERY non-table line, so `**bold**`/
 * `__underline__`/a `=heading` cascade through the SAME classifier
 * (`CreoleStripeSimpleParser.java:92-109,149-153`) instead of drawing as
 * literal markup characters in a single unstyled run (`vimako-25-mega336`/
 * `fatuzu-07-cevu894`/`bedezo-44-more709`/`pirofe-41-xama594`, census
 * family CREOLE-INLINE). A `kind !== 'text'` line (a `HORIZONTAL_LINE`
 * stripe, `creole-text-lines.ts`'s `'hr'` kind) still falls back to the
 * single-run literal draw below -- UNCHANGED from the pre-T2b behavior,
 * not yet a real rule (reported as a residual, not this commit's row).
 *
 * Each run draws at `y + run.dy` (0 for every NORMAL run on a line whose
 * OTHER atoms -- if any -- share its own natural height, per `creole-sea-
 * line.ts`'s own baseline-offset contract, decisions.md#D2). A lone run
 * below `creole-sea-line.ts#ATOM_TEXT_MIN_HEIGHT` (`= 10`, the port's own
 * `AtomText.java:179-181` floor) is the ONE case where `Sea` reports a
 * REAL non-zero `dy` for an otherwise all-NORMAL single-run line -- jar-
 * verified via `loxija-71-joku558`/`zepima-96-peco612` (both `skinparam
 * activityFontSize 4`): routing their already-byte-exact plain "start"/
 * "me" labels through this function moved their `<text>/@y` FURTHER from
 * the jar, not closer, because `gtile-action.ts`'s own box-height sizing
 * does not (yet) apply the matching floor (KLIMT-FLOOR, census-owned by a
 * sibling task, not this one). {@link isPlainSingleRun} keeps that one
 * case on its PRE-existing literal-draw path (byte-identical to before
 * this task), so this generalization never regresses a row it does not
 * own; every line that actually carries creole content (2+ runs, a style
 * flag, a url, or a cascaded size) still draws through the real per-run
 * path below.
 *
 * Each run draws at `y + run.dy` and wraps in `<a href>` when it carries a
 * url (`core/svg.ts#linkWrap`, the SAME string-emitting `<a>` wrapper
 * every other engine's url runs use, jar-verified byte-exact per that
 * function's own doc comment).
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
 * add2 T3e (CORRECTED -- the prior version of this comment named `Theme`
 * fields that did not yet exist): `hyperlinkUnderline`/`svgLinkTarget` now
 * both read `theme`-derived values off {@link ActivityTextStyle}, applied
 * by {@link fontConfigForRun} (underline) and below (`linkWrap`'s
 * `target`). STILL NOT CLOSED, re-slotted: the one call site that would
 * populate those two `ActivityTextStyle` fields for an ACTION node's label
 * (`activity-renderer-shapes.ts#renderAction`) is outside this task's
 * write-set, so both stay `undefined` (= upstream's own defaults, no
 * behavior change) until that file forwards `theme.hyperlinkUnderline`/
 * `theme.svgLinkTarget`. Affects `gaxezi-48-zesa921`/`nisexe-68-vabu320`/
 * `pekuxe-00-bovi270`.
 */
/** See {@link drawCreoleLine}'s own doc comment (the `ATOM_TEXT_MIN_HEIGHT`
 *  paragraph) for why this guard exists: `true` iff the line is exactly
 *  one NORMAL, non-url, non-cascaded-size run -- the shape a line with NO
 *  creole content (no style flag, no url, no heading/sup/sub) always has. */
function isPlainSingleRun(line: CreoleTextLine, style: ActivityTextStyle): boolean {
  if (line.runs.length !== 1) return false;
  const run = line.runs[0]!;
  const s = run.style;
  return !s.bold && !s.italic && !s.underline && !s.strike && run.url === undefined && run.size === style.fontSize;
}

function drawCreoleLine(x: number, y: number, content: string, style: ActivityTextStyle): string {
  const font = { family: style.fontFamily, size: style.fontSize };
  const lines = creoleTextLines(content, font, MEASURER);
  const line = lines[0];
  if (line === undefined || line.kind !== 'text' || isPlainSingleRun(line, style)) {
    return drawRun(x, y, content, toFontConfiguration(style));
  }
  let cx = x;
  let out = '';
  for (const run of line.runs) {
    // `image` (latex/math) runs carry no text -- no row this task owns
    // reaches a `[[url]]` line that also carries `<latex>`/`<math>`.
    if (run.text === '') continue;
    const drawn = drawRun(cx, y + run.dy, run.text, fontConfigForRun(run, style));
    out +=
      run.url !== undefined
        ? linkWrap(drawn, { url: run.url, tooltip: run.tooltip ?? run.url }, style.svgLinkTarget)
        : drawn;
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
 * T3e: a `|cell|` physical line routes through the dedicated table-cell
 * seam ({@link drawCreoleTableRow}, `StripeTable`'s own stripped-cell
 * content, checked first to match `creoleTextLines`' own table-row
 * priority, `CreoleParser.java:91-100`). add3-T2b (D5): every OTHER line
 * now routes through {@link drawCreoleLine} -- the SAME real creole lexer
 * ({@link drawCreoleLine}'s own doc comment) -- not just a `[[url]]` line
 * as before; a plain line with neither a url nor any `**`/`__`/`=`/`____`
 * markup still measures and draws byte-identically, since `creoleTextLines`
 * reduces to one unstyled run at the caller's own font for that case (no
 * regression to this port's existing corpus, including every pinned
 * golden).
 */
export function drawActivityText(x: number, y: number, content: string, style: ActivityTextStyle): string {
  if (isTableRowLine(content)) return drawCreoleTableRow(x, y, content, style);
  return drawCreoleLine(x, y, content, style);
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
