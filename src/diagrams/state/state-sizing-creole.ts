/**
 * state-sizing-creole — the state engine's consumer of the ONE core creole
 * seam (`core/svek/image/creole-text-lines.ts`, mission
 * `state-declared-size-fix` D1).
 *
 * SI28 G1/G23: every piece of a state's text (name, description/fields, a
 * composite's own attribute block) is sized by the jar through
 * `Display.create8(fc, align, skinParam, CreoleMode.FULL, wrapWidth)`
 * (`EntityImageStateCommon.java:80-81` for the name,
 * `EntityImageState.java:98-99` for the fields) or `Display.create(fc,
 * align, skinParam)` (`InnerStateAutonom.java:97`'s title, `Entity.java:631`'s
 * `getStateDescription`) — this port measured the RAW source string, so
 * markup counted as glyphs, `skinparam wrapWidth` never applied and tab
 * stops never snapped.
 *
 * This module turns the seam's per-line styled runs into the ONE structure
 * both halves of the state engine consume:
 *   - the SIZER (`state-sizing.ts`, `state-composite-sizing.ts`) reads
 *     {@link StateCreoleBlock.width}/`.height`;
 *   - the RENDERER (`renderer-box.ts`, `renderer-composite-box.ts`) draws
 *     {@link StateCreoleBlock.lines}`[].runs`, one `<text>` per run at its
 *     own measured advance — the SAME per-run element sequence the jar
 *     emits (jar-verified `xasoka-58-temi462`: `foo` @12/19.425, the
 *     `http://plantuml.com` link run @31.425/118.038 `text-decoration=
 *     "underline"` `fill="#00F"` inside its own `<a>`, `bar` @149.463).
 * Sizer/renderer lockstep is therefore by construction: one call, one
 * structure, two readers.
 *
 * The renderer has no `StringMeasurer` of its own (`state-sizing.ts`'s own
 * "Render-time text metrics" doc comment), which is why per-run advances
 * are computed HERE, at layout time, and threaded through.
 *
 * NOT closed by this module (T1's own report; journaled, not silent):
 * `<math>`/`<sup>`/`<sub>` are unported in this port's
 * `CommandCreoleBuilder.ts` (`CommandCreoleBuilder.java:104-105,111`
 * registers `CommandCreoleExposantChange`/`CommandCreoleMath`), so such
 * markup still measures as literal, tag-inclusive text.
 */
import type { FontSpec, StringMeasurer } from '../../core/measurer.js';
import type { CreoleTextLine, CreoleTextRun } from '../../core/svek/image/creole-text-lines.js';
import { creoleTextLines } from '../../core/svek/image/creole-text-lines.js';
import {
  hasTabulation,
  tabStopWidth,
  advanceToTabStop,
  BLOCK_E1_REAL_TABULATION,
  TAB_STRING,
} from '../../core/klimt/creole/legacy/AtomText.js';
import { JAR_DEFAULT_TEXT_COLOR } from '../../core/decoration/symbol/usymbol-resolve.js';
import type { Theme } from '../../core/theme.js';
import type { StateTextLine } from './state-geo-types.js';

/** `SkinParam#getTabSize` default (`SkinParam.java:1073`,
 *  `getAsInt("tabsize", 8)`) — the same default the core seam applies when
 *  `opts.tabSize` is absent, restated here because this module resolves the
 *  value from `Theme` before the call. */
const DEFAULT_TAB_SIZE = 8;

/**
 * One drawable styled run of a state text line: the seam's own
 * {@link CreoleTextRun} plus the measured advance the renderer needs to
 * place the NEXT run (`AtomText#getWidth`, `AtomText.java:239-256`).
 *
 * `color` is present ONLY when the creole actually set one — a run whose
 * resolved color is the seam's own `JAR_DEFAULT_TEXT_COLOR` default reports
 * none, so the caller's `skinparam StateFontColor<<X>>`/`<style>` cascade
 * still wins (the SAME precedence `class/renderer-classifier-rows.ts
 * #renderRowAtoms` documents: "an atom's OWN creole-resolved color still
 * wins when set; this only replaces the innermost hardcoded default").
 */
export interface StateTextRun {
  readonly text: string;
  readonly width: number;
  /** Extra advance BEFORE this run, i.e. the gap a `\t` snapped over.
   *  `AtomText` splits measuring (`#getWidth`, `AtomText.java:239-256`,
   *  which reports one aggregate advance) from drawing (`#drawU`, `:210-233`,
   *  which re-tokenizes and positions each token at its own tab stop);
   *  a tabbed atom therefore becomes SEVERAL runs here, each carrying the
   *  advance its preceding tab(s) consumed. jar-verified `lokija-02-dipe348`:
   *  `line2` drawn at x=68 (12 + 56), `line3` at x=124 (12 + 112). */
  readonly dx?: number;
  readonly bold: boolean;
  readonly italic: boolean;
  readonly underline: boolean;
  readonly strike: boolean;
  readonly color?: string;
  readonly url?: string;
}

/** One laid-out creole table cell: its styled runs plus the cell's own
 *  top-left corner RELATIVE to the table's own origin
 *  (`AtomTable#initMap`'s `Position(getStartingX(j), getStartingY(i))`,
 *  `AtomTable.java:186-196`). Cell content is drawn LEFT-aligned with no
 *  padding (`AtomTable#drawU`'s `dx = 0` branch, `:133-137`). */
export interface StateTableCell {
  readonly runs: readonly StateTextRun[];
  readonly x: number;
  readonly y: number;
}

/** A laid-out creole table (`AtomTable`): the cells plus the grid's own
 *  column/row boundaries (`getStartingX`/`getStartingY`, one entry per
 *  boundary including both outer edges) the renderer draws rules along
 *  (`AtomTable#drawU`'s `hline`/`vline` pass, `AtomTable.java:150-158`).
 *  Coordinates are relative to the table's own origin, i.e. AFTER
 *  `AtomWithMargin`'s own `marginY1` shift (`AtomWithMargin.java:65`). */
export interface StateTableGeo {
  readonly width: number;
  readonly height: number;
  readonly cells: readonly StateTableCell[];
  readonly colX: readonly number[];
  readonly rowY: readonly number[];
}

/** A measured state text line — `StateTextLine`'s established `{text,width}`
 *  contract (so it drops straight into `StateNodeGeo.headerLines`/
 *  `bodyLines` unchanged) widened with the styled runs the renderer draws
 *  and the line's own measured height. `text` is the VISIBLE text (every
 *  run's text concatenated), never the raw markup.
 *
 *  `table` replaces `runs` for a creole TABLE stripe (`StripeTable`): the
 *  line's `height` then includes `AtomWithMargin`'s own 2+2 vertical pad
 *  and the renderer draws {@link StateTableGeo} instead of a run sequence. */
export interface StateStyledTextLine extends StateTextLine {
  readonly runs: readonly StateTextRun[];
  readonly height: number;
  readonly table?: StateTableGeo;
}

/** A whole creole text block: `width` = widest line, `height` = summed line
 *  heights (`XDimension2D#mergeTB`'s own max-width/sum-height contract). */
export interface StateCreoleBlock {
  readonly width: number;
  readonly height: number;
  readonly lines: readonly StateStyledTextLine[];
}

export interface StateCreoleOpts {
  readonly wrapWidth?: number;
  readonly tabSize?: number;
}

/**
 * `skinparam tabSize` always applies (`FontConfiguration#getTabSize`);
 * `skinparam wrapWidth` applies ONLY where upstream threads
 * `getStyleState().wrapWidth()` into the text block — the leaf
 * `EntityImageState`/`EntityImageStateEmptyDescription` name and fields
 * (`create8`, `EntityImageStateCommon.java:80-81`,
 * `EntityImageState.java:98-99`). A composite's own title and attribute
 * block go through `Display.create` (`InnerStateAutonom.java:97`,
 * `Entity.java:631`), which is `create7`/`create0` with
 * `LineBreakStrategy.NONE` (`Display.java:614-623`) — no wrap.
 */
export function stateCreoleOpts(theme: Theme, wrap: boolean): StateCreoleOpts {
  return {
    ...(wrap && theme.wrapWidth !== undefined ? { wrapWidth: theme.wrapWidth } : {}),
    tabSize: theme.tabSize ?? DEFAULT_TAB_SIZE,
  };
}

/** `AtomText#tabString` (`AtomText.java:258-264`): `substring(0, nb)` for
 *  `1 <= nb < 7`, else the full 8 spaces. Local port for the same reason
 *  `creole-text-lines.ts` carries its own — `AtomText.ts`'s exported
 *  `atomTextWidth` only ever reaches the port-wide-constant `nb=8` path. */
function tabStringFor(nb: number): string {
  return nb >= 1 && nb < 7 ? TAB_STRING.slice(0, nb) : TAB_STRING;
}

/** One `StringTokenizer` token: a run of ordinary characters, or a single
 *  tab character. A NAMED interface, not an inline object type in the
 *  signature below — an inline `{ ... }` return type desyncs lizard's
 *  brace-depth tracker and makes it merge the following declarations into
 *  one giant "function" (the same trap `creole-text-lines.ts` documents for
 *  regex literals; that file's own `TabToken` exists for this reason). */
interface TabToken {
  readonly text: string;
  readonly isTab: boolean;
}

/** `StringTokenizer(text, "\t" + Jaws.BLOCK_E1_REAL_TABULATION, true)`
 *  (`AtomText.java:242,210`). */
function splitOnTabChars(text: string): readonly TabToken[] {
  const tokens: TabToken[] = [];
  let pending = '';
  for (const ch of text) {
    if (ch !== '\t' && ch !== BLOCK_E1_REAL_TABULATION) {
      pending += ch;
      continue;
    }
    if (pending.length > 0) tokens.push({ text: pending, isTab: false });
    pending = '';
    tokens.push({ text: ch, isTab: true });
  }
  if (pending.length > 0) tokens.push({ text: pending, isTab: false });
  return tokens;
}

function toRun(run: CreoleTextRun, text: string, width: number, dx: number): StateTextRun {
  return {
    text,
    width,
    ...(dx > 0 ? { dx } : {}),
    bold: run.style.bold,
    italic: run.style.italic,
    underline: run.style.underline,
    strike: run.style.strike,
    ...(run.color !== undefined && run.color !== JAR_DEFAULT_TEXT_COLOR ? { color: run.color } : {}),
    ...(run.url !== undefined ? { url: run.url } : {}),
  };
}

/** `AtomText#drawU`'s own token walk (`AtomText.java:210-233`): a run with
 *  no tab is one drawable run; a tabbed one becomes one run per non-tab
 *  token, each carrying the advance its preceding tab(s) snapped over. The
 *  run widths still SUM to `AtomText#getWidth`'s aggregate, so the sizer's
 *  line width and the renderer's x-advance stay one number. */
function expandRun(run: CreoleTextRun, font: FontSpec, measurer: StringMeasurer, tabSizeNb: number): StateTextRun[] {
  const measure = (s: string): number => measurer.measure(s, font).width;
  if (!hasTabulation(run.text)) return [toRun(run, run.text, measure(run.text), 0)];
  const tabStop = tabStopWidth(measure(tabStringFor(tabSizeNb)), font.size);
  const out: StateTextRun[] = [];
  let x = 0;
  let pendingDx = 0;
  for (const token of splitOnTabChars(run.text)) {
    if (token.isTab) {
      const next = advanceToTabStop(x, tabStop);
      pendingDx += next - x;
      x = next;
      continue;
    }
    const width = measure(token.text);
    out.push(toRun(run, token.text, width, pendingDx));
    pendingDx = 0;
    x += width;
  }
  if (pendingDx > 0) out.push(toRun(run, '', 0, pendingDx));
  return out;
}

function toStyledLine(line: CreoleTextLine, font: FontSpec, measurer: StringMeasurer, tabSizeNb: number): StateStyledTextLine {
  const runs = line.runs.flatMap((r) => expandRun(r, font, measurer, tabSizeNb));
  return {
    text: runs.map((r) => r.text).join(''),
    width: line.width,
    height: line.height,
    runs,
  };
}

/** `EntityImageState`'s own `fields` block for a state whose description
 *  line is EMPTY: upstream still lays out one blank stripe of the font's
 *  own height. The seam reports NO line for an empty string
 *  (`creole-text-lines.ts`'s own `display === ''` short-circuit), so the
 *  blank stripe is restored here — carrying the NBSP the jar substitutes
 *  for a whitespace-only run (`state-sizing.ts#measureBodyTextLines`'s own
 *  jar-verified `gefefe-91-xoge233` doc comment, `DriverTextSvg.java`). */
const NBSP = '\u00A0';
function blankLine(font: FontSpec): StateStyledTextLine {
  return {
    text: NBSP,
    width: 0,
    height: font.size,
    runs: [{ text: NBSP, width: 0, bold: false, italic: false, underline: false, strike: false }],
  };
}

// ---------------------------------------------------------------------------
// Creole TABLE stripe (`StripeTable` + `AtomTable`) — G23
// ---------------------------------------------------------------------------

/** `CreoleParser#TABLE_LINE_PATTERN` (`CreoleParser.java:117`) — the SAME
 *  rule `creole-text-lines.ts` classifies a `kind:'table-row'` line with
 *  (that module keeps its copy private). Source-string built, never a
 *  `/regex/` literal, for the brace-tracker reason that module documents. */
const TABLE_LINE_PATTERN_SOURCE = '^(<#\\w+(,#?\\w+)?>)?\\|(=)?.*\\|$';

function isTableLine(line: string): boolean {
  return new RegExp(TABLE_LINE_PATTERN_SOURCE).test(line);
}

/** `StripeTable`'s own `new AtomWithMargin(table, 2, 2)`
 *  (`StripeTable.java:82`) — VERTICAL only (`AtomWithMargin.java:56-58`
 *  deltas `(0, marginY1 + marginY2)`), so a table block is 4px taller than
 *  its grid and exactly as wide. */
const TABLE_MARGIN_Y = 2;

interface TableCellSpec {
  readonly text: string;
  readonly header: boolean;
}

/** `StripeTable#analyzeAndAddInternal` (`StripeTable.java:131-160`):
 *  `StringTokenizer(line, "|")`, whose Java semantics SKIP empty tokens; a
 *  leading `=` marks a HEADER cell (bold `getFontConfiguration(HEADER)`)
 *  and is stripped; cell text is NOT trimmed — jar-verified `kinuca-03-
 *  nice683`, whose `|= header 1 |` cell measures `" header 1 "` (51.363),
 *  spaces included. A leading `<#color>` line prefix is dropped first
 *  (`getBackOrFrontColor`/`withouBackColor`, `:104-126`); the colors
 *  themselves are not applied (no corpus fixture sets one). */
function splitTableRow(line: string): readonly TableCellSpec[] {
  const gt = line.startsWith('<#') ? line.indexOf('>') : -1;
  const body = gt >= 0 ? line.slice(gt + 1) : line;
  const out: TableCellSpec[] = [];
  for (const token of body.split('|')) {
    if (token.length === 0) continue;
    out.push(token.startsWith('=') ? { text: token.slice(1), header: true } : { text: token, header: false });
  }
  return out;
}

interface MeasuredCell {
  readonly runs: readonly StateTextRun[];
  readonly width: number;
  readonly height: number;
}

/** One cell = a `SheetBlock1` over the cell's own `StripeSimple`
 *  (`StripeTable#asAtom`, `:96-102`). Measured through the SAME seam every
 *  other state line uses; HEADER cells force `bold` on every run because
 *  this port's deterministic width table is weight-agnostic
 *  (`leaf-sizing-text.ts#creoleVisibleText`'s own doc comment), so the
 *  header font differs only in what the RENDERER draws. */
function measureCell(spec: TableCellSpec, ctx: { font: FontSpec; measurer: StringMeasurer; tabSizeNb: number }): MeasuredCell {
  const built = creoleTextLines(spec.text, ctx.font, ctx.measurer);
  const first = built[0];
  if (first === undefined) return { runs: [], width: 0, height: ctx.font.size };
  const styled = toStyledLine(first, ctx.font, ctx.measurer, ctx.tabSizeNb);
  const runs = spec.header ? styled.runs.map((r) => ({ ...r, bold: true })) : styled.runs;
  return { runs, width: styled.width, height: styled.height };
}

/** `AtomTable#getColWidth`/`getLineHeight` (`AtomTable.java:224-247`): a
 *  column is as wide as its widest cell, a row as tall as its tallest. */
function maxBy(values: readonly number[]): number {
  let out = 0;
  for (const v of values) if (v > out) out = v;
  return out;
}

function prefixSums(sizes: readonly number[]): number[] {
  const out = [0];
  for (const size of sizes) out.push((out[out.length - 1] as number) + size);
  return out;
}

function tableGeo(rows: readonly (readonly MeasuredCell[])[], fontSize: number): StateTableGeo {
  const nbCols = maxBy(rows.map((r) => r.length));
  const colX = prefixSums(
    Array.from({ length: nbCols }, (_, j) => maxBy(rows.map((r) => r[j]?.width ?? 0))),
  );
  const rowY = prefixSums(rows.map((r) => (r.length === 0 ? fontSize : maxBy(r.map((c) => c.height)))));
  const cells: StateTableCell[] = [];
  rows.forEach((row, i) => {
    row.forEach((cell, j) => cells.push({ runs: cell.runs, x: colX[j] as number, y: rowY[i] as number }));
  });
  return { width: colX[nbCols] as number, height: rowY[rows.length] as number, cells, colX, rowY };
}

/** One `StripeTable` — a maximal run of consecutive table lines
 *  (`CreoleParser#modifyStripe`'s `lastStripe instanceof StripeTable &&
 *  isTableLine(line)` accumulation, `CreoleParser.java:91-94`). */
function tableLine(
  rows: readonly string[],
  font: FontSpec,
  measurer: StringMeasurer,
  tabSizeNb: number,
): StateStyledTextLine {
  const ctx = { font, measurer, tabSizeNb };
  const table = tableGeo(rows.map((r) => splitTableRow(r).map((c) => measureCell(c, ctx))), font.size);
  return { text: '', width: table.width, height: table.height + 2 * TABLE_MARGIN_Y, runs: [], table };
}

/** The per-call measurement context, bundled so {@link appendBlockLines}
 *  stays inside this project's 5-parameter ceiling. */
interface BlockCtx {
  readonly font: FontSpec;
  readonly measurer: StringMeasurer;
  readonly opts: StateCreoleOpts;
  readonly tabSizeNb: number;
}

/** Walks the source lines, folding each maximal run of consecutive table
 *  lines into ONE `StripeTable` stripe (`CreoleParser.java:91-94`) and every
 *  other line through the core seam (which may itself fan one physical line
 *  out into several wrapped ones). */
function appendBlockLines(out: StateStyledTextLine[], lines: readonly string[], ctx: BlockCtx): void {
  let i = 0;
  while (i < lines.length) {
    const raw = lines[i] as string;
    if (isTableLine(raw)) {
      let end = i;
      while (end < lines.length && isTableLine(lines[end] as string)) end++;
      out.push(tableLine(lines.slice(i, end), ctx.font, ctx.measurer, ctx.tabSizeNb));
      i = end;
      continue;
    }
    const built = creoleTextLines(raw, ctx.font, ctx.measurer, ctx.opts);
    if (built.length === 0) out.push(blankLine(ctx.font));
    for (const line of built) out.push(toStyledLine(line, ctx.font, ctx.measurer, ctx.tabSizeNb));
    i++;
  }
}

/**
 * Builds one creole text block from already-physical-line-split source text
 * (`splitStateDisplayLines`, i.e. `Display#getWithNewlines`'s own `\n`/`\t`
 * escape handling, which upstream performs at PARSE time before any
 * `Display` reaches `create`/`create8`).
 */
export function stateCreoleBlock(
  lines: readonly string[],
  font: FontSpec,
  measurer: StringMeasurer,
  opts: StateCreoleOpts = {},
): StateCreoleBlock {
  const out: StateStyledTextLine[] = [];
  appendBlockLines(out, lines, { font, measurer, opts, tabSizeNb: opts.tabSize ?? DEFAULT_TAB_SIZE });
  let width = 0;
  let height = 0;
  for (const line of out) {
    if (line.width > width) width = line.width;
    height += line.height;
  }
  return { width, height, lines: out };
}

/** The renderer reads `StateNodeGeo.headerLines`/`bodyLines`, typed as the
 *  narrower `StateTextLine` (`state-geo-types.ts`) — every state-engine
 *  producer of those arrays is `state-sizing.ts`, which builds them through
 *  {@link stateCreoleBlock}, so the runs are always present at runtime.
 *  This narrows back to the styled shape at the one place that needs it,
 *  falling back to a single unstyled run for any line that somehow carries
 *  none (the `kind:'json'`/unmeasured fallback paths never reach here). */
export function styledLines(lines: readonly StateTextLine[]): readonly StateStyledTextLine[] {
  return lines.map((ln) =>
    'runs' in ln
      ? (ln as StateStyledTextLine)
      : { ...ln, height: 0, runs: [{ text: ln.text, width: ln.width, bold: false, italic: false, underline: false, strike: false }] },
  );
}
