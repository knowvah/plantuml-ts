/**
 * Node sizing for the json family — the port of upstream's `TextBlockJson`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/jsondiagram/TextBlockJson.java
 *
 * Split out of `layout.ts` by mission A5 / T6b, which is when this stopped
 * being a handful of constants and became a real port. Upstream keeps it as
 * its own class for the same reason T5 found empirically: how a node MEASURES
 * is separable from how the graph is SOLVED, and they are the two independent
 * halves of this family's conformance gap. Re-mirroring the graph (T6) moved
 * the mean document-dimension error only 111.88 → 101.83 and left ZERO
 * fixtures exact; this is the other half.
 *
 * Everything here is shared by `@startjson`, `@startyaml` and `@starthcl` —
 * yaml and hcl have no layout of their own.
 */
import type { StringMeasurer } from '../../core/measurer.js';
import { emittedTextForm } from '../../core/svg.js';
import { splitStripe } from './Fission.js';
import { tabStopWidth, tabAwareWidth, walkTabs, hasTab } from './tab-stops.js';
import { getDisplayValue, containerEntries } from './json-layout-prep.js';
import { splitDisplayLines } from '../../core/klimt/creole/DisplayNewlines.js';
import type { FlatNode, BuildRowsOptions } from './json-layout-prep.js';
import type { JsonStyleSet } from './json-style-resolve.js';
import { rowMeasureOf } from './text-block-style.js';
import type { CellFont, CellMeasure, RowMeasure } from './text-block-style.js';

/**
 * Per-CELL margins. `TextBlockJson#getTextBlock` wraps every cell's text block
 * in `TextBlockUtils.withMargin(result, 5, 2)` (`TextBlockJson.java:348`) — 5
 * horizontal per side, 2 vertical per side. A cell therefore measures
 * `text + 10` wide and `text + 4` tall, and the node's width is simply
 * colA + colB with no further padding.
 *
 * Replaces this port's unsourced `H_PAD = 8` (applied as `2 * H_PAD` = 16 per
 * COLUMN against upstream's 10) and a `V_PAD` added at the node's top and
 * bottom that upstream does not have at all.
 */
const CELL_MARGIN_X = 5;
const CELL_MARGIN_Y = 2;

/**
 * `TextBlockJson.java:74-75`. Both apply to the WHOLE node, and only when the
 * measured value would otherwise be zero — `drawU`'s `if (y == 0) y =
 * MIN_HEIGHT` / `if (trueWidth == 0) trueWidth = JSON_CELL_MIN_WIDTH` (:277-280).
 * Never per column: this port used to floor `maxKeyWidth` AND `maxValueWidth`
 * at 30 each, so an empty node came out 60 + 32 wide where the jar draws 30.
 */
const JSON_CELL_MIN_WIDTH = 30;
const MIN_HEIGHT = 15;

/** A single row within a JSON node block */
export interface JsonRowGeo {
  key: string;
  value: string;
  /** Value split on literal \n for multi-line string display. Always ≥ 1 element. */
  valueLines: readonly string[];
  valueType: 'string' | 'number' | 'boolean' | 'null' | 'nested';
  /**
   * Highlight state:
   *   false        — not highlighted
   *   '' (empty)   — highlighted with no named style class (default highlight color)
   *   'h1', 'h2'   — highlighted with a named style class
   */
  highlight: string | false;
  /**
   * True when this row is an ARRAY entry, i.e. upstream's `Line` with a null
   * `b2` (`TextBlockJson.java:127-134` builds array lines via the one-arg
   * constructor, putting the VALUE in `b1`).
   *
   * Three consequences, all of them upstream's `drawU` (:307-314):
   *  - the single cell is the VALUE and it occupies column A, styled as a
   *    value (`getStyleToUse(false, …)`), not as a header;
   *  - column B contributes nothing to the node's width — `getWidthColB`
   *    skips lines whose `b2` is null (:251-258);
   *  - no vertical divider is drawn for the row, since upstream draws it
   *    inside the `if (line.b2 != null)` branch.
   *
   * `key` still holds the array INDEX, because upstream still resolves
   * highlights by it (`isHighlighted("" + i, …)`) — it is simply never drawn.
   */
  arrayEntry: boolean;
  /** y offset within the node (top of row) */
  y: number;
  height: number;
  /**
   * Measured width of the key cell's text, WITHOUT the `withMargin(_, 5, 2)`
   * horizontal margin — i.e. the text's own advance width.
   *
   * The renderer needs this for the jar's `textLength` attribute, and only the
   * layout stage holds a `StringMeasurer`. Carrying it here rather than
   * re-measuring downstream is what keeps the sizer and the renderer measuring
   * the SAME thing; `planning/sizer-renderer-parity.md` catalogues what happens
   * when they drift.
   *
   * Zero for an array row, which draws no key (see {@link JsonRowGeo.arrayEntry}).
   */
  keyWidth: number;
  /** Measured width of each value line, index-aligned with `valueLines`. */
  valueLineWidths: readonly number[];
  /**
   * The width the SVG driver measures, which is NOT always the one above.
   *
   * Upstream measures twice, on two different strings. Layout calls
   * `TextBlock#calculateDimension` on the raw text; the driver first swaps
   * every space for NBSP in a whitespace-ONLY label and only then measures
   * (`DriverTextSvg.java:115-116` precedes its `calculateDimension` at :126).
   * Under `PLANTUML_DETERMINISTIC_TEXT` an ASCII space is 0 wide and an NBSP
   * is 0.275·size, so for json's three-space nested cell the two answers are
   * 0 and 11.55 — the jar's node width reflects the former, its `textLength`
   * attribute the latter.
   *
   * Index-aligned with `valueLines`; `keyTextLength` is the same for the key.
   */
  valueTextLengths: readonly number[];
  keyTextLength: number;
  /** The atoms the KEY is drawn as. `getTextBlock` applies the style's
   *  `wrapWidth()` to column A exactly as it does to column B
   *  (`TextBlockJson.java:341-349` builds both the same way), so a multi-word
   *  key splits under wrap too. */
  keyAtoms: readonly CellAtom[];
  /**
   * The atoms each value line is DRAWN as — one `<text>` element per entry.
   *
   * With wrap active upstream splits a line into words and inter-word spaces
   * and draws each separately (`Fission.ts`); with wrap off a line stays one
   * atom, so this is `[[wholeLine]]` and the renderer is unchanged. `dx` is
   * the offset from the line's own start x, accumulated from the SIZING
   * widths exactly as consecutive runs advance.
   */
  valueAtoms: readonly (readonly CellAtom[])[];
  /**
   * Baseline y of the key text, relative to the NODE's top edge.
   *
   * Upstream never positions text by a midpoint: `withMargin(result, 5, 2)`
   * (`TextBlockJson.java:348`) puts the cell's text block at `rowTop + 2`, and
   * the block's own baseline sits `height - descent` below its top. Verified
   * against the jar: `dometa-86-jepe218` draws its first row's key at
   * `y="31.889"` for a node at `y="19"` — an offset of 12.889 = 2 + 14 −
   * 14/4.5, the last term being `StringBounder#getDescent`.
   */
  keyBaselineY: number;
  /** Baseline y of each value line, relative to the node's top edge. */
  valueBaselineYs: readonly number[];
}

/** One drawn text run — upstream's `Neutron`, once it has become an `Atom`. */
export interface CellAtom {
  text: string;
  /** Offset from the line's start x. */
  dx: number;
  /** Width of the EMITTED form, for `textLength` — see `valueTextLengths`. */
  textLength: number;
}

export interface MeasuredNode {
  flatNode: FlatNode;
  rows: JsonRowGeo[];
  keyColWidth: number;
  valueColWidth: number;
  totalWidth: number;
  totalHeight: number;
}

/**
 * @see .../jsondiagram/TextBlockJson.java#Line.getHeightOfRow
 *
 * `max(b1.height, b2.height)`, where each cell is its text block wrapped in
 * `withMargin(_, 5, 2)` — so the vertical margin is added once per CELL, not
 * once per wrapped line.
 *
 * Replaces two unsourced behaviours: a `max(20, …)` row-height floor upstream
 * does not have, and sizing the row from the KEY alone, which let a multi-line
 * value overflow its own row.
 */
function heightOfRow(heights: { key: number; value: number }, valueLineCount: number, arrayEntry: boolean): number {
  const valueCell = valueLineCount * heights.value + 2 * CELL_MARGIN_Y;
  // An array line has no b2, so `getHeightOfRow` returns b1's height alone --
  // and b1 IS the value cell.
  if (arrayEntry) return valueCell;
  // Each cell is measured with ITS OWN style's font (`getTextBlock`), so the
  // key and value text heights differ whenever their styles do.
  const keyCell = heights.key + 2 * CELL_MARGIN_Y;
  return Math.max(keyCell, valueCell);
}

/**
 * @see .../jsondiagram/TextBlockJson.java#getWidthColA
 * @see .../jsondiagram/TextBlockJson.java#getWidthColB
 *
 * Both are plain `max` folds over the cells, starting at **zero**, each cell
 * being its text plus the horizontal margin. There is no per-column floor.
 */
function columnWidths(
  rows: readonly JsonRowGeo[],
  valueWraps: readonly number[],
): { keyColWidth: number; valueColWidth: number } {
  let keyColWidth = 0;
  let valueColWidth = 0;
  rows.forEach((row, i) => {
    // For multi-line values, the widest individual line -- taken from the
    // widths `cellMetrics` already computed rather than re-measured here.
    // Those are TAB-AWARE (`tab-stops.ts`): a `\t` advances to the next stop
    // instead of contributing its table width, which is zero. Re-measuring
    // lost that, so a tab-only cell sized to nothing.
    let vw = Math.max(...row.valueLineWidths.map((w) => w + 2 * CELL_MARGIN_X));
    // Cap a cell at its own style's `MaximumWidth` when word-wrap is active.
    // This port's cap, not upstream's (`getWidthColB` is a plain max); applied
    // per row because the wrap width is per style (`getTextBlock`'s
    // `style.wrapWidth()`) -- identical to one node-wide cap when it is uniform.
    const wrap = valueWraps[i] ?? 0;
    if (wrap > 0) vw = Math.min(vw, wrap + 2 * CELL_MARGIN_X);
    if (row.arrayEntry) {
      // b1 IS the value, and there is no b2 to widen column B.
      if (vw > keyColWidth) keyColWidth = vw;
      return;
    }
    const kw = row.keyWidth + 2 * CELL_MARGIN_X;
    if (kw > keyColWidth) keyColWidth = kw;
    if (vw > valueColWidth) valueColWidth = vw;
  });
  return { keyColWidth, valueColWidth };
}

/** The display text of one value cell, split into the lines it will draw on:
 *  PlantUML escape interpretation, then `\n` splitting, then word-wrap when
 *  `maximumWidth` is active. Only string values do any of this. */
function cellLines(
  v: unknown,
  measurer: StringMeasurer,
  { font, wrap }: CellMeasure,
): { processed: string; valueLines: string[]; atomLines: string[][]; valueType: JsonRowGeo['valueType'] } {
  const { display, valueType } = getDisplayValue(v);
  // Split via upstream's own single pass, NOT by rewriting the escape to a
  // newline and splitting on that — a real U+000A in the value must stay
  // inside its line. `Display#getWithNewlines(Pragma, String)` is the one
  // `getTextBlock` calls (`TextBlockJson.java:342`); its `else` branch keeps an
  // unrecognised escape's backslash AND character (`Display.java:310-312`), so
  // `back\slash` is drawn as written.
  const rawLines: string[] = valueType === 'string' ? [...splitDisplayLines(display).lines] : [display];
  const processed = rawLines.join('\n');
  // Each raw line is a stripe, and WRAPPING breaks a stripe into lines of
  // ATOMS (`Fission.ts`) — one `<text>` per atom, not per line.
  //
  // Applied to EVERY value type, not just strings. Upstream makes no such
  // distinction: `getShortString` hands `getTextBlock` a display string and
  // the style's `wrapWidth()` applies to it whatever the JSON type was
  // (`TextBlockJson.java:341-349`). A boolean's display is `"☑ true"`, which
  // contains a space and therefore splits — the jar draws `'☑'`, NBSP,
  // `'true'` as three elements (`json/vogeku-38-soxe333`). Gating this on
  // `valueType === 'string'` cost exactly that.
  //
  // Harmless for the others: a number, a null (`␀`) and a nested cell
  // (three spaces) each survive as one atom, and `splitStripe` with a 0
  // width returns its input untouched, which is the no-`MaximumWidth` case.
  const atomLines: string[][] = [];
  for (const segment of rawLines) {
    for (const atoms of splitStripe(segment, wrap, (t) => measurer.measure(t, font).width)) {
      atomLines.push(atoms);
    }
  }
  // `StripeSimple#getAtoms` (`StripeSimple.java:124-129`): a stripe that
  // collected NO atoms is given a single-space one --
  //
  //     if (atoms.size() == 0)
  //         atoms.add(AtomTextUtils.createLegacy(" ", fontConfiguration));
  //
  // so an empty cell is not an absent cell: it draws a space, which the SVG
  // driver's whitespace-only rule then writes as NBSP. Each drawn line is one
  // stripe, hence the per-line map. Jar-verified -- `{"a": ""}` emits
  // `<text …> </text>` for the value, and `{}` (which
  // `JsonDiagram.java:78-88` rewrites to an array holding one empty string)
  // emits exactly that one text inside a 10x18 box.
  //
  // That space has a real width (seam #4: U+0020 is measured as U+0021), so
  // the jar's box for `{}` is 13.85 wide (3.85 + 2x the 5pt cell margin), a
  // number no JSON_CELL_MIN_WIDTH produces. CLAUDE.md cites that box as a case
  // where hours went into fitting a constant instead of reading this branch.
  // `splitStripe('')` yields ONE empty atom, not none: an empty text builds no
  // atom upstream, so an all-empty list is the "no atoms" case.
  const blanked = atomLines.map((a) => (a.every((t) => t === '') ? [' '] : a));
  return { processed, valueLines: blanked.map((a) => a.join('')), atomLines: blanked, valueType };
}

/**
 * The per-cell TEXT metrics the renderer cannot recover on its own: measured
 * advance widths (for `textLength`) and absolute baselines.
 *
 * @see JsonRowGeo.keyBaselineY for the baseline derivation and its jar evidence.
 */
function cellMetrics(
  cell: {
    key: string;
    valueLines: readonly string[];
    atomLines: readonly (readonly string[])[];
    rowY: number;
    arrayEntry: boolean;
  },
  heights: { key: number; value: number },
  measurer: StringMeasurer,
  { key: keyCell, value: valueCell }: RowMeasure,
): Pick<
  JsonRowGeo,
  | 'keyWidth'
  | 'valueLineWidths'
  | 'keyBaselineY'
  | 'valueBaselineYs'
  | 'keyTextLength'
  | 'valueTextLengths'
  | 'valueAtoms'
  | 'keyAtoms'
> {
  const keyFont = keyCell.font;
  const valFont = valueCell.font;
  // `withMargin(_, 5, 2)` — the text block's top edge sits CELL_MARGIN_Y below
  // the row's, and its baseline `descent` above its own bottom. Each cell's
  // block is built from its own style's font (`getTextBlock`), so the key and
  // value baselines are derived separately.
  const baselineOf = (height: number, font: CellFont, text: string): number =>
    cell.rowY + CELL_MARGIN_Y + height - measurer.getDescent(font, text);
  const firstBaseline = baselineOf(heights.value, valFont, cell.key);
  // See `JsonRowGeo.valueTextLengths` for why the emitted form is measured
  // separately from the raw one.
  const emitted = (t: string, f: CellFont) => measurer.measure(emittedTextForm(t), f).width;
  // `AtomText#getTabSize` -- always `fontSize * 4` under deterministic metrics,
  // because the space its `tabString()` is made of measures 0 there.
  const measureWith = (font: CellFont) => (t: string) => measurer.measure(t, font).width;
  const valMeasure = measureWith(valFont);
  const keyMeasure = measureWith(keyFont);
  // Atoms advance by their SIZING width, exactly as consecutive text runs do
  // -- except a TAB, which advances to the next stop and draws nothing
  // (`AtomText#drawU`), so it contributes an offset but no atom.
  const atomsOf = (atoms: readonly string[], font: CellFont): CellAtom[] => {
    const measure = measureWith(font);
    const tabStop = tabStopWidth(measure, font.size, font.tabSize);
    const out: CellAtom[] = [];
    let dx = 0;
    for (const text of atoms) {
      if (!hasTab(text)) {
        out.push({ text, dx, textLength: emitted(text, font) });
        dx += measure(text);
        continue;
      }
      for (const run of walkTabs(text, measure, tabStop, dx)) {
        out.push({ text: run.text, dx: run.dx, textLength: emitted(run.text, font) });
      }
      dx += tabAwareWidth(text, measure, tabStop);
    }
    return out;
  };
  const tabStop = tabStopWidth(valMeasure, valFont.size, valFont.tabSize);
  const lineWidth = (l: string) => (hasTab(l) ? tabAwareWidth(l, valMeasure, tabStop) : valMeasure(l));
  return {
    // A key is the same creole block as a value (`TextBlockJson.java:123`,
    // `:341-345`), so `AtomText#getWidth`'s tab walk sizes it too.
    keyWidth: cell.arrayEntry
      ? 0
      : tabAwareWidth(cell.key, keyMeasure, tabStopWidth(keyMeasure, keyFont.size, keyFont.tabSize)),
    valueLineWidths: cell.valueLines.map(lineWidth),
    keyTextLength: cell.arrayEntry ? 0 : emitted(cell.key, keyFont),
    valueTextLengths: cell.valueLines.map((l) => emitted(l, valFont)),
    valueAtoms: cell.atomLines.map((a) => atomsOf(a, valFont)),
    keyAtoms: cell.arrayEntry ? [] : atomsOf(splitStripe(cell.key, keyCell.wrap, keyMeasure)[0] ?? [cell.key], keyFont),
    keyBaselineY: cell.arrayEntry ? firstBaseline : baselineOf(heights.key, keyFont, cell.key),
    valueBaselineYs: cell.valueLines.map((_, i) => firstBaseline + heights.value * i),
  };
}

/** One `TextBlockJson.Line`, measured and positioned. */
function buildRow(
  cell: { key: string; value: unknown; rowY: number; arrayEntry: boolean },
  measurer: StringMeasurer,
  measure: RowMeasure,
  highlight: string | false,
): JsonRowGeo {
  const { processed, valueLines, atomLines, valueType } = cellLines(cell.value, measurer, measure.value);
  const heights = {
    key: measurer.measure(cell.key, measure.key.font).height,
    value: measurer.measure(cell.key, measure.value.font).height,
  };
  const positioned = {
    key: cell.key,
    valueLines,
    atomLines,
    rowY: cell.rowY,
    arrayEntry: cell.arrayEntry,
  };
  return {
    arrayEntry: cell.arrayEntry,
    key: cell.key,
    value: processed,
    valueLines,
    valueType,
    highlight,
    y: cell.rowY,
    height: heightOfRow(heights, valueLines.length, cell.arrayEntry),
    ...cellMetrics(positioned, heights, measurer, measure),
  };
}

/** The rows plus each row's value-cell wrap width, index-aligned (see {@link columnWidths}). */
function measureRows(
  node: FlatNode,
  highlightKeys: ReadonlyMap<string, string>,
  measurer: StringMeasurer,
  styles: JsonStyleSet,
  options: BuildRowsOptions | undefined,
): { rows: JsonRowGeo[]; valueWraps: number[] } {
  const arrayEntry = Array.isArray(node.value);
  const rows: JsonRowGeo[] = [];
  const valueWraps: number[] = [];
  // Rows start at the node's top edge: upstream's `drawU` walks
  // `y = 0; for (line) y += heightOfRow` (:267-275). No leading pad, and
  // `getTotalHeight` is a plain sum with no trailing one either.
  let currentY = 0;

  for (const [key, value] of containerEntries(node.value)) {
    // `isHighlighted(key, allHighlighteds)` picks the row's style class
    // (`TextBlockJson.java:122,130`), which both cells' styles depend on.
    const highlight = highlightKeys.get(key) ?? false;
    const measure = rowMeasureOf(styles, highlight, options?.tabSize);
    const row = buildRow({ key, value, rowY: currentY, arrayEntry }, measurer, measure, highlight);
    rows.push(row);
    valueWraps.push(measure.value.wrap);
    currentY += row.height;
  }

  return { rows, valueWraps };
}

/**
 * Every row of `node`, each measured with the font of its own jar style
 * (`getStyleToUse(header, highlighted)`).
 * @see .../jsondiagram/TextBlockJson.java#TextBlockJson (:117-135)
 */
export function buildRows(
  node: FlatNode,
  highlightKeys: ReadonlyMap<string, string>,
  measurer: StringMeasurer,
  styles: JsonStyleSet,
  options?: BuildRowsOptions,
): JsonRowGeo[] {
  return measureRows(node, highlightKeys, measurer, styles, options).rows;
}

/** @see .../jsondiagram/TextBlockJson.java#calculateDimensionSlow */
export function measureNode(
  flatNode: FlatNode,
  highlightKeys: ReadonlyMap<string, string>,
  measurer: StringMeasurer,
  styles: JsonStyleSet,
  options?: BuildRowsOptions,
): MeasuredNode {
  const { rows, valueWraps } = measureRows(flatNode, highlightKeys, measurer, styles, options);

  const { keyColWidth, valueColWidth } = columnWidths(rows, valueWraps);

  const lastRow = rows.at(-1);
  const summedHeight = lastRow !== undefined ? lastRow.y + lastRow.height : 0;
  const summedWidth = keyColWidth + valueColWidth;

  return {
    flatNode,
    rows,
    keyColWidth,
    valueColWidth,
    totalWidth: summedWidth === 0 ? JSON_CELL_MIN_WIDTH : summedWidth,
    totalHeight: summedHeight === 0 ? MIN_HEIGHT : summedHeight,
  };
}
