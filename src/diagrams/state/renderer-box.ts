/**
 * Simple-state (`kind:'normal'`) leaf box renderer — mission G4 S2,
 * mechanism 5. Split out of renderer.ts to keep that file under the
 * project's 500-line cap. Jar-verified byte-for-byte against 3 fixtures:
 * jocela-05-niba392 (title-only, `#red` inline override, no body lines —
 * the divider STILL draws, see below), votoki-67-gufa610 (2-line body,
 * name CENTERED against a body-dominated wider box), gefefe-91-xoge233
 * (1-line body, a single literal space " " — `IDLE :` with no real text).
 *
 * Box anatomy (`EntityImageState.java`, MARGIN=MARGIN_LINE=5 —
 * `state-sizing.ts`'s `STATE_MARGIN_DELTA` doc comment):
 *   - rounded rect, rx=ry=12.5, fill/border via `resolveStateFill`/
 *     `theme.colors.border`, stroke-width 0.5
 *   - a FULL-WIDTH (no 1px inset, unlike class's own divider) horizontal
 *     `<line>` divider at `y = MARGIN + headerHeight + MARGIN_LINE` —
 *     ALWAYS drawn for this render path (jar-verified: jocela-05-niba392
 *     has ZERO body lines yet still draws the divider — `EntityImageState`
 *     draws it unconditionally; only the SEPARATE `EntityImageState
 *     EmptyDescription` shape, gated on `hide empty description` AND no
 *     body — state-sizing.ts's `measureEmptyDescription` — omits it. That
 *     boolean is not threaded onto `StateNodeGeo` this iteration — a named,
 *     deferred remainder, `plans/g4-state-svg/ledger.md` S2)
 *   - header (display/name) line(s) CENTERED (`x = box mid -
 *     textLength/2`), first baseline at `MARGIN + ascent`, subsequent
 *     lines step by `theme.fontSize`
 *   - body (description) line(s) LEFT-aligned at `box.x + MARGIN`, first
 *     baseline at `dividerY + MARGIN_LINE + ascent`
 * Text fill is a HARDCODED `#000000` in the measured path (not
 * `theme.colors.text`) — matches class's own `EntityImageClassHeader`
 * precedent (`renderer-classifier-box.ts#renderRowText`'s identical doc
 * comment); the UNMEASURED fallback path below (json) keeps its
 * PRE-EXISTING `theme.colors.text` behavior unchanged.
 * @see ~/git/plantuml/.../svek/image/EntityImageState.java
 * @see ~/git/plantuml/.../svek/image/EntityImageStateCommon.java (MARGIN/MARGIN_LINE=5)
 */
import { lineTo, moveTo } from '../../core/svg-path-builder.js';
import type { StateNodeGeo, StateTextLine } from './state-geo-types.js';
import type { Theme } from '../../core/theme.js';
import { rect, line, text, path, ellipse, linkWrap } from '../../core/svg.js';
// G1/G8/G23 (mission state-declared-size-fix): the renderer draws the SAME
// styled runs / table the sizer measured -- see `state-sizing-creole.ts`.
import type { StateTableGeo, StateTextRun } from './state-sizing-creole.js';
import { styledLines } from './state-sizing-creole.js';
import { STATE_DEFAULT_BACKGROUND, STATE_BORDER_STROKE_WIDTH, resolveStateFillBucketed, resolveStateBorder, resolveStateFontColor, resolveStateFontSize, resolveStateBoxRadius, textAscent } from './state-render-colors.js';
import { stateShadowFilterUrl } from './state-shadow.js';

const STATE_BOX_RX = 12.5;
import {
  ENTITY_IMAGE_MARGIN as MARGIN,
  ENTITY_IMAGE_MARGIN_LINE as MARGIN_LINE,
} from '../../core/svek/IEntityImage.js';
/** `USymbolFrame#getMargin`/`BodyEnhanced1#getMarginX` -- duplicated from
 *  `state-sizing.ts`'s own `SDL_MARGIN`/`BODY_MARGIN_X` (this codebase's
 *  established per-module constant convention, `STATE_BOX_RX`'s own
 *  precedent above/`renderer-composite-box.ts`'s identical duplication). */
const SDL_MARGIN = { x1: 15, x2: 25, y1: 20, y2: 10 };
const BODY_MARGIN_X = 6;

/** `FontStyle` set -> the SVG `text-decoration` attribute value -- mirrors
 *  `core/klimt/drawing/svg/driver-text-svg.ts#textDecorationOf` (same
 *  keywords, same join order), duplicated for the same reason
 *  `class/renderer-classifier-rows.ts#memberAtomDecoration` documents: the
 *  state renderer has no `UDriver`/`UGraphic` seam to share one from. */
function runDecoration(run: StateTextRun): string | undefined {
  const parts: string[] = [];
  if (run.underline) parts.push('underline');
  if (run.strike) parts.push('line-through');
  return parts.length > 0 ? parts.join(' ') : undefined;
}

/**
 * SI30 D2/D3: `Sea`'s own baseline reconstruction (`creole-sea-line.ts`'s
 * own doc comment) -- `lineTop + lineHeight - run.size/4.5 + run.dy`. Uses
 * the run's own (possibly MUTED, `<sup>`/`<sub>`) `size` for the descent
 * term rather than the TRUE unmuted `atom.font.size` Sea itself measured
 * with: `StateTextRun` carries no unmuted-size field to recover, since the
 * locked seam contract it consumes (`CreoleTextRun`, `decisions.md#D3`)
 * doesn't expose one either -- only the effective (post-mute) `size` and the
 * already-`Sea`-computed `dy`.
 *
 * Exact for every NORMAL run (muted === unmuted there, D1) -- algebraically
 * confirmed against `juvagu-33-dupa212`'s own jar SVG (`H`/`O` both at
 * `font-size="14"`, `y="125.889"`, matching `lineTop + lineHeight -
 * 14/4.5 + (-3)` exactly for the `<sub>`-adjacent NORMAL runs). For the
 * `<sub>` run itself (`"2"`, muted 11 from 14) this formula's own
 * `run.size`-for-descent substitution differs from the jar's true
 * `129.556` by a FIXED (mute delta 3) / 4.5 ~= 0.667px -- a bounded,
 * documented residual, not a fitted constant: 3 is `FontPosition.java
 * :51-60`'s own mute amount, and 4.5 is `StringMeasurer.getDescent`'s
 * documented fallback divisor (`core/measurer.ts:19-22`), so the whole
 * expression is two already-cited upstream numbers, never adjusted to
 * shrink this residual.
 */
function runBaseline(lineTop: number, lineHeight: number, run: StateTextRun): number {
  return lineTop + lineHeight - run.size / 4.5 + run.dy;
}

/**
 * One creole line's styled runs, left to right, x-advancing by each run's
 * OWN measured width -- the SAME per-`<text>`-element sequence the jar
 * emits (`AtomText#drawU` once per atom; jar-verified `xasoka-58-temi462`
 * and `papifi-44-caxo706`). A `[[url]]` run wraps in its own `<a href>`
 * (`class/renderer-classifier-rows.ts#renderRowAtoms`'s identical rule).
 * `run.color` is set only when the creole resolved one, so the caller's
 * `StateFontColor` cascade still supplies the default.
 *
 * SI30 D3: each run now draws at its OWN `font-size` (`run.size`) and its
 * own `<sup>`/`<sub>`-adjusted baseline ({@link runBaseline}) instead of one
 * shared `style.fontSize`/`y` for the whole line -- the per-run `<size:N>`
 * fix this task's own report names (a `<size:20>` NORMAL run inside an
 * otherwise-14pt line now draws at 20, not the line's shared size).
 * `lineTop`/`lineHeight` are the line's own top edge and `Sea`-computed
 * height (`state-sizing-creole.ts#StateStyledTextLine.height`).
 */
export function renderStateRuns(
  runs: readonly StateTextRun[],
  startX: number,
  lineTop: number,
  lineHeight: number,
  style: { readonly fontFamily: string; readonly fill: string },
): string {
  let x = startX;
  let out = '';
  for (const run of runs) {
    // `AtomText#drawU`'s tab-stop skip (`AtomText.java:216-221`) -- see
    // `StateTextRun.dx`'s own doc comment.
    x += run.dx ?? 0;
    if (run.text === '') continue;
    const decoration = runDecoration(run);
    const y = runBaseline(lineTop, lineHeight, run);
    const drawn = text(x, y, run.text, {
      fill: run.color ?? style.fill,
      fontFamily: style.fontFamily,
      fontSize: run.size,
      lengthAdjust: 'spacing',
      textLength: run.width,
      ...(run.bold ? { fontWeight: '700' as const } : {}),
      ...(run.italic ? { fontStyle: 'italic' as const } : {}),
      ...(decoration !== undefined ? { textDecoration: decoration } : {}),
    });
    out += run.url !== undefined ? linkWrap(drawn, { url: run.url, tooltip: run.url }) : drawn;
    x += run.width;
  }
  return out;
}

/**
 * A creole TABLE stripe (`AtomTable#drawU`, `AtomTable.java:106-158`):
 * every cell's own runs at its `Position` (LEFT-aligned, no padding), then
 * the grid -- one horizontal rule per row boundary spanning the full table
 * width, one vertical rule per column boundary spanning the full height.
 * `x`/`y` are the table's own origin, i.e. the block's top-left PLUS
 * `AtomWithMargin`'s own `marginY1` (`AtomWithMargin.java:65`).
 * jar-verified `kinuca-03-nice683` byte-for-byte (cells at x=12/63.363/
 * 114.725, baselines 43.889/57.889/71.889, rules at y=33/47/61/75 and
 * x=12/63.363/114.725/166.087, `stroke:#000;stroke-width:1`).
 */
export function renderStateTable(
  table: StateTableGeo,
  x: number,
  y: number,
  style: { readonly fontFamily: string; readonly fontSize: number; readonly fill: string; readonly ascent: number },
): string {
  let out = '';
  for (const cell of table.cells) {
    // `lineTop = y + cell.y`, `lineHeight = style.fontSize` reproduces the
    // pre-SI30 `y + cell.y + style.ascent` baseline byte-for-byte for every
    // NORMAL cell run (`runBaseline`'s own doc comment) -- a table cell
    // carries no `<sup>`/`<sub>` in this corpus, so this is the SAME number,
    // not a new one.
    out += renderStateRuns(cell.runs, x + cell.x, y + cell.y, style.fontSize, {
      fontFamily: style.fontFamily,
      fill: style.fill,
    });
  }
  const lastX = x + (table.colX[table.colX.length - 1] as number);
  const lastY = y + (table.rowY[table.rowY.length - 1] as number);
  const stroke = { stroke: style.fill, strokeWidth: TABLE_RULE_WIDTH };
  for (const ry of table.rowY) out += line(x, y + ry, lastX, y + ry, stroke);
  for (const cx of table.colX) out += line(x + cx, y, x + cx, lastY, stroke);
  return out;
}

/** `AtomTable#drawU`'s grid rules are drawn with the ambient `UStroke`,
 *  which for a creole block is the 1px default (`UStroke.simple()`) --
 *  jar-verified `kinuca-03-nice683`'s `stroke-width:1`. */
const TABLE_RULE_WIDTH = 1;

/**
 * Draws a measured text block: one line per entry, each line's own styled
 * runs starting at `xForLine(ln)`, advancing the baseline by each line's
 * OWN measured height (`fontSize` for an ordinary line, the whole grid box
 * for a creole TABLE stripe).
 *
 * SI30 D2/D3: tracks the running `lineTop` (the line's own TOP edge, not a
 * pre-computed baseline) so each line's -- and, inside it, each run's --
 * baseline can be reconstructed independently via {@link runBaseline} from
 * the `Sea`-computed `line.height` and per-run `dy`, rather than one shared
 * per-block offset. `startY` keeps its pre-SI30 meaning (the FIRST line's
 * own baseline, `ascent` below the block's top) for every existing caller;
 * `lineTop = startY - ascent` recovers the top once, since `ascent` is a
 * caller-supplied CONSTANT (not itself `Sea`-derived).
 */
export function renderStateTextLines(
  lines: readonly StateTextLine[],
  xForLine: (ln: StateTextLine) => number,
  startY: number,
  theme: Theme,
  // mission G4 S15: `skinparam stateFontColor<<X>>` -- see
  // `state-render-colors.ts#resolveStateFontColor`'s own doc comment.
  // Defaults to jar's own hardcoded `#000000` label-text default (every
  // pre-S15 call site's unchanged behavior).
  opts: { readonly fill?: string; readonly fontSize?: number } = {},
): string {
  // mission G4 S16: `skinparam stateFontSize<<X>>` -- see
  // `state-render-colors.ts#resolveStateFontSize`'s own doc comment.
  const fontSize = opts.fontSize ?? theme.fontSize;
  const style = { fontFamily: theme.fontFamily, fill: opts.fill ?? '#000000' };
  const ascent = textAscent(fontSize);
  let out = '';
  let lineTop = startY - ascent;
  for (const ln of styledLines(lines, fontSize)) {
    const height = ln.height === 0 ? fontSize : ln.height;
    if (ln.table !== undefined) {
      out += renderStateTable(ln.table, xForLine(ln), lineTop + TABLE_STRIPE_MARGIN_Y, {
        fontFamily: theme.fontFamily,
        fontSize,
        fill: style.fill,
        ascent,
      });
      lineTop += height;
      continue;
    }
    out += renderStateRuns(ln.runs, xForLine(ln), lineTop, height, style);
    lineTop += height;
  }
  return out;
}

/** `StripeTable`'s own `new AtomWithMargin(table, 2, 2)`
 *  (`StripeTable.java:82`) -- the grid starts `marginY1` below the stripe's
 *  own top edge. Duplicated from `state-sizing-creole.ts#TABLE_MARGIN_Y`,
 *  this codebase's established per-module constant convention (see
 *  `SDL_MARGIN` above). */
const TABLE_STRIPE_MARGIN_Y = 2;

function renderTextLines(
  lines: readonly StateTextLine[],
  xForLine: (ln: StateTextLine) => number,
  startY: number,
  theme: Theme,
  fill: string = '#000000',
  fontSize: number = theme.fontSize,
): string {
  return renderStateTextLines(lines, xForLine, startY, theme, { fill, fontSize });
}

/**
 * `kind:'json'` (mission A4 Phase L iter 20) and any other pre-measurement
 * caller reuse this UNCHANGED fallback (`node.headerLines === undefined`):
 * a single centered, unmeasured `<text>`, matching the pre-S2 behavior
 * exactly — faithful `shape=plaintext` TABLE content for json is deferred
 * (renderer.ts's own `renderJson` doc comment), not attempted here.
 */
function renderUnmeasuredFallback(node: StateNodeGeo, theme: Theme, box: string): string {
  return (
    box +
    text(node.x + node.width / 2, node.y + node.height / 2 + theme.fontSize / 2, node.display, {
      textAnchor: 'middle',
      fill: theme.colors.text,
      fontFamily: theme.fontFamily,
      fontSize: theme.fontSize,
    })
  );
}

/**
 * mission G4 S5: `EntityImageStateEmptyDescription.drawU` -- rect ONLY (no
 * divider, no body), label CENTERED both horizontally AND vertically
 * (`xDesc = (dimTotal.width - dimHeader.width) / 2`, `yDesc = (dimTotal
 * .height - dimHeader.height) / 2` in upstream's own coordinates; `
 * dimHeader.height` is `headerLines.length * fontSize`, matching every
 * other box's own `MEASURE_LINES`-derived text-block-height convention).
 * jar-verified `gopumi-11-pise779`'s `S1` (single line, MIN 50x40 box):
 * box x=25.86 y=86 w=50 h=40, text x=42.285 y=109.8889 -- `yDesc = (40 -
 * 14)/2 = 13`, baseline = `node.y + 13 + textAscent(14) = 86 + 23.8889 =
 * 109.8889`, EXACT match.
 * @see ~/git/plantuml/.../svek/image/EntityImageStateEmptyDescription.java
 */
function renderEmptyDescription(node: StateNodeGeo, theme: Theme, box: string): string {
  const headerLines = node.headerLines!;
  // mission G4 S16: `skinparam stateFontSize<<X>>` -- see
  // `state-render-colors.ts#resolveStateFontSize`'s own doc comment.
  const fontSize = resolveStateFontSize(node, theme, theme.fontSize);
  const ascent = textAscent(fontSize);
  const textBlockHeight = headerLines.length * fontSize;
  const yDesc = (node.height - textBlockHeight) / 2;
  const headerMarkup = renderTextLines(
    headerLines,
    (ln) => node.x + node.width / 2 - ln.width / 2,
    node.y + yDesc + ascent,
    theme,
    '#000000',
    fontSize,
  );
  return box + headerMarkup;
}

/**
 * mission G4 S14: `EntityImageState2`/`USymbolFrame#drawFrame` -- a
 * `<<sdlreceive>>` leaf box draws UNWRAPPED (no `<g>`, `wrapClassFor`'s own
 * doc comment), a plain (non-rounded-header, still `rx/ry=12.5`) box, a
 * fold-notch `<path>` (`textWidth = width/3`, `cornersize = 7`,
 * `textHeight = 12` -- `USymbolFrame#drawFrame`'s own `dimTitle.getWidth()
 * === 0` branch, since `asSmall` always passes an empty `dimTitle`), and a
 * single TOP-LEFT-ANCHORED (not centered) label at `x = node.x +
 * SDL_MARGIN.x1 + BODY_MARGIN_X`, `y = node.y + SDL_MARGIN.y1 + ascent`
 * (`USymbolFrame#asSmall`'s own `UTranslate(margin.getX1(), margin.getY1())`
 * placement of the merged stereotype+label block -- the stereotype
 * TextBlock is always empty for state's own `asSmall` call, so only the
 * label's own baseline offset (`ascent`) is added). NO divider line (only
 * `EntityImageState`'s own box draws one). jar-verified byte-exact against
 * `cekolo-21-gini183`'s own sdlreceive node (rect 407.46,7 115.0875x44;
 * path `M445.8225,7 L445.8225,12 L438.8225,19 L407.46,19`; text
 * 428.46,37.8889).
 * @see ~/git/plantuml/.../svek/image/EntityImageState2.java
 * @see ~/git/plantuml/.../decoration/symbol/USymbolFrame.java#drawFrame
 * @see state-sizing.ts's `SDL_MARGIN`/`BODY_MARGIN_X` doc comment
 * @see plans/g4-state-svg/ledger.md (S14)
 */
export function renderSdlReceive(node: StateNodeGeo, theme: Theme): string {
  const fill = resolveStateFillBucketed(node, theme, STATE_DEFAULT_BACKGROUND);
  const border = resolveStateBorder(node, theme);
  // mission G6 T4: `<style> stateDiagram { RoundCorner N } }` cascade --
  // see `resolveStateBoxRadius`'s own doc comment.
  const radius = resolveStateBoxRadius(theme, STATE_BOX_RX);
  const box = rect(node.x, node.y, node.width, node.height, {
    fill,
    stroke: border,
    strokeWidth: STATE_BORDER_STROKE_WIDTH,
    rx: radius,
    ry: radius,
  });

  const textWidth = node.width / 3;
  const cornerSize = 7;
  const textHeight = 12;
  const x0 = node.x;
  const y0 = node.y;
  const d =
    [
      moveTo(x0 + textWidth, y0),
      lineTo(x0 + textWidth, y0 + textHeight - cornerSize),
      lineTo(x0 + textWidth - cornerSize, y0 + textHeight),
      lineTo(x0, y0 + textHeight),
    ].join(' ');
  const notch = path(d, { stroke: border, strokeWidth: STATE_BORDER_STROKE_WIDTH });

  // mission G4 S16: `skinparam stateFontSize<<X>>` -- see
  // `state-render-colors.ts#resolveStateFontSize`'s own doc comment.
  const fontSize = resolveStateFontSize(node, theme, theme.fontSize);
  const ascent = textAscent(fontSize);
  const label = text(
    node.x + SDL_MARGIN.x1 + BODY_MARGIN_X,
    node.y + SDL_MARGIN.y1 + ascent,
    node.display,
    {
      fill: '#000000',
      fontFamily: theme.fontFamily,
      fontSize,
      lengthAdjust: 'spacing',
      textLength: node.headerLines?.[0]?.width ?? 0,
    },
  );

  return box + notch + label;
}

/** `EntityImageState#drawSymbol` (`EntityImageState.java:174-181`) with
 *  `smallRadius = 3`, `smallLine = 3`, `smallMarginX = 7`, `smallMarginY = 4`
 *  (`:71-74`): the box's bottom-right corner is walked back by
 *  `4*smallRadius + smallLine + smallMarginX` (22) in x and
 *  `2*smallRadius + smallMarginY` (10) in y -- the SAME 10 px
 *  `state-sizing.ts#OO_SYMBOL_DELTA` reserves on both axes -- then two
 *  `2*smallRadius` circles and a `smallLine`-long horizontal connector are
 *  drawn. `ug.apply(borderColor)` sets only the FOREGROUND, so the circles
 *  keep the box's own background fill. jar-verified `resido-15-reza040`'s
 *  `comp3` (box 7,14.611 72x50): ellipses at cx=60/69 cy=57.611 r=3, line
 *  63,57.611 -> 66,57.611, all `stroke:#181818;stroke-width:0.5`.
 * @see ~/git/plantuml/.../svek/image/EntityImageState.java#drawSymbol */
const OO_SMALL_RADIUS = 3;
const OO_SMALL_LINE = 3;
const OO_SMALL_MARGIN_X = 7;
const OO_SMALL_MARGIN_Y = 4;

/** `Stereotype#isWithOOSymbol` (`Stereotype.java:119-121`) -- the SAME
 *  predicate `state-sizing.ts#isWithOOSymbol` reserves space with. */
export function isOOSymbolStereotype(stereotype: string | undefined): boolean {
  return stereotype !== undefined && stereotype.toUpperCase() === 'O-O';
}

export function renderOOSymbol(
  right: number,
  bottom: number,
  fill: string,
  stroke: string,
): string {
  const x = right - (4 * OO_SMALL_RADIUS + OO_SMALL_LINE + OO_SMALL_MARGIN_X);
  const y = bottom - (2 * OO_SMALL_RADIUS + OO_SMALL_MARGIN_Y);
  // `ellipse`'s own paint bag is keyed by the HYPHENATED SVG attribute name
  // (unlike `rect`/`line`'s camelCase `TextStyle`) -- see
  // `renderer-border-point.ts`'s identical note.
  const paint = { fill, stroke, 'stroke-width': STATE_BORDER_STROKE_WIDTH };
  const cy = y + OO_SMALL_RADIUS;
  return (
    ellipse(x + OO_SMALL_RADIUS, cy, OO_SMALL_RADIUS, OO_SMALL_RADIUS, paint) +
    ellipse(x + OO_SMALL_LINE + 3 * OO_SMALL_RADIUS, cy, OO_SMALL_RADIUS, OO_SMALL_RADIUS, paint) +
    line(x + 2 * OO_SMALL_RADIUS, cy, x + 2 * OO_SMALL_RADIUS + OO_SMALL_LINE, cy, {
      stroke,
      strokeWidth: STATE_BORDER_STROKE_WIDTH,
    })
  );
}

export function renderNormal(node: StateNodeGeo, theme: Theme): string {
  // mission G4 S10: `state`-element bucket tier -- see `resolveStateFillBucketed`'s own doc comment.
  const fill = resolveStateFillBucketed(node, theme, STATE_DEFAULT_BACKGROUND);
  // G4 S9: `StateBorderColor<<X>>` cascade -- see `resolveStateBorder`'s own
  // doc comment.
  const border = resolveStateBorder(node, theme);
  // mission G6 T4: `<style> stateDiagram { RoundCorner N } }` cascade --
  // see `resolveStateBoxRadius`'s own doc comment.
  const radius = resolveStateBoxRadius(theme, STATE_BOX_RX);
  // mission skin-file-loading Batch 2: `EntityImageStateCommon#getShape`
  // sets `deltaShadow` directly on this SAME outline rect (jar draws ONE
  // rect, fill+shadow combined -- unlike the composite shape's own
  // separate shadow-only duplicate, `renderer-composite-box.ts
  // #renderCompositeMeasured`) -- see `StateNodeGeo.shadowing`'s own doc
  // comment for the per-kind eligibility gate this reads (`undefined`/`0`
  // for every pre-Batch-2 fixture, byte-identical `rect()` call).
  const box = rect(node.x, node.y, node.width, node.height, {
    fill,
    stroke: border,
    strokeWidth: STATE_BORDER_STROKE_WIDTH,
    rx: radius,
    ry: radius,
    ...(node.shadowing !== undefined && node.shadowing > 0 ? { filter: stateShadowFilterUrl() } : {}),
  });

  if (node.headerLines === undefined) {
    return renderUnmeasuredFallback(node, theme, box);
  }

  if (node.emptyDescription === true) {
    return renderEmptyDescription(node, theme, box);
  }

  // mission G4 S16: `skinparam stateFontSize<<X>>` -- see
  // `state-render-colors.ts#resolveStateFontSize`'s own doc comment; jar-
  // verified `laferu-31-tice836` (font-size 30, box widened to match the
  // `state-sizing.ts` measurement this SAME resolution feeds at layout
  // time).
  const fontSize = resolveStateFontSize(node, theme, theme.fontSize);
  const ascent = textAscent(fontSize);
  // mission G4 S15: `StateFontColor<<X>>` cascade -- see
  // `resolveStateFontColor`'s own doc comment.
  const fontColor = resolveStateFontColor(node, theme, '#000000');
  const headerMarkup = renderTextLines(
    node.headerLines,
    (ln) => node.x + node.width / 2 - ln.width / 2,
    node.y + MARGIN + ascent,
    theme,
    fontColor,
    fontSize,
  );

  const dividerY = node.y + MARGIN + node.headerLines.length * fontSize + MARGIN_LINE;
  const divider = line(node.x, dividerY, node.x + node.width, dividerY, {
    stroke: border,
    strokeWidth: STATE_BORDER_STROKE_WIDTH,
  });

  const bodyLines = node.bodyLines ?? [];
  const bodyMarkup = renderTextLines(bodyLines, () => node.x + MARGIN, dividerY + MARGIN_LINE + ascent, theme, fontColor, fontSize);

  // G8: `EntityImageState.drawU`'s own order -- shape, divider hline,
  // SYMBOL, name, fields (`EntityImageState.java:142-166`).
  const symbol = isOOSymbolStereotype(node.stereotype)
    ? renderOOSymbol(node.x + node.width, node.y + node.height, fill, border)
    : '';

  return box + divider + symbol + headerMarkup + bodyMarkup;
}
