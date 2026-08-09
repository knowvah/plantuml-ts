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
import {
  getDisplayValue,
  containerEntries,
  splitDisplayLines,
} from './json-layout-prep.js';
import type { FlatNode, BuildRowsOptions } from './json-layout-prep.js';

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
 * MIN_HEIGHT` / `if (trueWidth == 0) trueWidth = MIN_WIDTH` (:277-280).
 * Never per column: this port used to floor `maxKeyWidth` AND `maxValueWidth`
 * at 30 each, so an empty node came out 60 + 32 wide where the jar draws 30.
 */
const MIN_WIDTH = 30;
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

interface FontSpec {
  family: string;
  size: number;
  weight?: 'bold';
}

/** The key- and value-cell fonts. Upstream resolves these per cell through the
 *  style cascade (`getStyleToUse(header, highlighted)`); this port carries the
 *  same header-vs-body distinction on `BuildRowsOptions`. */
function fontsFor(
  fontSize: number,
  options: BuildRowsOptions | undefined,
): { keyFont: FontSpec; valFont: FontSpec } {
  const family = options?.fontFamily ?? 'sans-serif';
  const bold = { family, size: fontSize, weight: 'bold' as const };
  const plain = { family, size: fontSize };
  return {
    keyFont: (options?.headerFontBold ?? options?.fontBold) ? bold : plain,
    valFont: options?.fontBold ? bold : plain,
  };
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
function heightOfRow(textHeight: number, valueLineCount: number, arrayEntry: boolean): number {
  const valueCell = valueLineCount * textHeight + 2 * CELL_MARGIN_Y;
  // An array line has no b2, so `getHeightOfRow` returns b1's height alone --
  // and b1 IS the value cell.
  if (arrayEntry) return valueCell;
  const keyCell = textHeight + 2 * CELL_MARGIN_Y;
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
  measurer: StringMeasurer,
  keyFont: FontSpec,
  valFont: FontSpec,
  maximumWidth: number | undefined,
): { keyColWidth: number; valueColWidth: number } {
  let keyColWidth = 0;
  let valueColWidth = 0;
  for (const row of rows) {
    // For multi-line values, the widest individual line.
    const vw = Math.max(
      ...row.valueLines.map((l) => measurer.measure(l, valFont).width + 2 * CELL_MARGIN_X),
    );
    if (row.arrayEntry) {
      // b1 IS the value, and there is no b2 to widen column B.
      if (vw > keyColWidth) keyColWidth = vw;
      continue;
    }
    const kw = measurer.measure(row.key, keyFont).width + 2 * CELL_MARGIN_X;
    if (kw > keyColWidth) keyColWidth = kw;
    if (vw > valueColWidth) valueColWidth = vw;
  }
  // Cap the value column when word-wrap is active.
  if (maximumWidth !== undefined) {
    valueColWidth = Math.min(valueColWidth, maximumWidth + 2 * CELL_MARGIN_X);
  }
  return { keyColWidth, valueColWidth };
}

/** The display text of one value cell, split into the lines it will draw on:
 *  PlantUML escape interpretation, then `\n` splitting, then word-wrap when
 *  `maximumWidth` is active. Only string values do any of this. */
function cellLines(
  v: unknown,
  measurer: StringMeasurer,
  font: FontSpec,
  maximumWidth: number | undefined,
): { processed: string; valueLines: string[]; atomLines: string[][]; valueType: JsonRowGeo['valueType'] } {
  const { display, valueType } = getDisplayValue(v);
  // Split via upstream's own single pass, NOT by rewriting the escape to a
  // newline and splitting on that — a real U+000A in the value must stay
  // inside its line. See `json-layout-prep.ts#splitDisplayLines`.
  const rawLines: string[] = valueType === 'string' ? splitDisplayLines(display) : [display];
  const processed = rawLines.join('\n');
  // Each raw line is a stripe, and WRAPPING breaks a stripe into lines of
  // ATOMS (`Fission.ts`) — one `<text>` per atom, not per line. A non-string
  // display value is a single token with nothing to wrap, and `splitStripe`
  // with a 0 width returns its input untouched, which is also the
  // no-`MaximumWidth` case for strings.
  const wrap = valueType === 'string' ? (maximumWidth ?? 0) : 0;
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
  // The space measures 0 wide under deterministic text metrics, so this adds
  // an element without moving any geometry -- which is why the jar's box for
  // `{}` is 10 wide (0 + 2x the 5pt cell margin), a number no MIN_WIDTH
  // produces. CLAUDE.md cites that box as a case where hours went into fitting
  // a constant instead of reading this branch.
  const blanked = atomLines.map((a) => (a.length === 0 ? [' '] : a));
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
    wrap: number;
  },
  textHeight: number,
  measurer: StringMeasurer,
  keyFont: FontSpec,
  valFont: FontSpec,
): Pick<
  JsonRowGeo,
  'keyWidth' | 'valueLineWidths' | 'keyBaselineY' | 'valueBaselineYs' | 'keyTextLength' | 'valueTextLengths' | 'valueAtoms' | 'keyAtoms'
> {
  // `withMargin(_, 5, 2)` — the text block's top edge sits CELL_MARGIN_Y below
  // the row's, and its baseline `descent` above its own bottom.
  const descent = measurer.getDescent(valFont, cell.key);
  const firstBaseline = cell.rowY + CELL_MARGIN_Y + textHeight - descent;
  // See `JsonRowGeo.valueTextLengths` for why the emitted form is measured
  // separately from the raw one.
  const emitted = (t: string, f: FontSpec) => measurer.measure(emittedTextForm(t), f).width;
  // Atoms advance by their SIZING width, exactly as consecutive text runs do.
  const atomsOf = (atoms: readonly string[]): CellAtom[] => {
    let dx = 0;
    return atoms.map((text) => {
      const atom = { text, dx, textLength: emitted(text, valFont) };
      dx += measurer.measure(text, valFont).width;
      return atom;
    });
  };
  return {
    keyWidth: cell.arrayEntry ? 0 : measurer.measure(cell.key, keyFont).width,
    valueLineWidths: cell.valueLines.map((l) => measurer.measure(l, valFont).width),
    keyTextLength: cell.arrayEntry ? 0 : emitted(cell.key, keyFont),
    valueTextLengths: cell.valueLines.map((l) => emitted(l, valFont)),
    valueAtoms: cell.atomLines.map(atomsOf),
    keyAtoms: cell.arrayEntry
      ? []
      : atomsOf(splitStripe(cell.key, cell.wrap, (t) => measurer.measure(t, keyFont).width)[0] ?? [cell.key]),
    keyBaselineY: firstBaseline,
    valueBaselineYs: cell.valueLines.map((_, i) => firstBaseline + textHeight * i),
  };
}

/** The measurer plus the two resolved cell fonts — one bundle so {@link buildRow}
 *  stays inside this repo's 5-parameter cap. */
interface RowFonts {
  measurer: StringMeasurer;
  keyFont: FontSpec;
  valFont: FontSpec;
  maximumWidth: number | undefined;
}

/** One `TextBlockJson.Line`, measured and positioned. */
function buildRow(
  cell: { key: string; value: unknown; rowY: number; arrayEntry: boolean },
  fonts: RowFonts,
  highlightKeys: ReadonlyMap<string, string>,
): JsonRowGeo {
  const { measurer, keyFont, valFont } = fonts;
  const { processed, valueLines, atomLines, valueType } = cellLines(cell.value, measurer, valFont, fonts.maximumWidth);
  const textHeight = measurer.measure(cell.key, valFont).height;
  const positioned = {
    key: cell.key, valueLines, atomLines, rowY: cell.rowY, arrayEntry: cell.arrayEntry,
    wrap: fonts.maximumWidth ?? 0,
  };
  return {
    arrayEntry: cell.arrayEntry,
    key: cell.key,
    value: processed,
    valueLines,
    valueType,
    highlight: highlightKeys.get(cell.key) ?? false,
    y: cell.rowY,
    height: heightOfRow(textHeight, valueLines.length, cell.arrayEntry),
    ...cellMetrics(positioned, textHeight, measurer, keyFont, valFont),
  };
}

export function buildRows(
  node: FlatNode,
  highlightKeys: ReadonlyMap<string, string>,
  measurer: StringMeasurer,
  fontSize: number,
  options?: BuildRowsOptions,
): JsonRowGeo[] {
  const { keyFont, valFont } = fontsFor(fontSize, options);
  const fonts: RowFonts = { measurer, keyFont, valFont, maximumWidth: options?.maximumWidth };
  const arrayEntry = Array.isArray(node.value);
  const rows: JsonRowGeo[] = [];
  // Rows start at the node's top edge: upstream's `drawU` walks
  // `y = 0; for (line) y += heightOfRow` (:267-275). No leading pad, and
  // `getTotalHeight` is a plain sum with no trailing one either.
  let currentY = 0;

  for (const [key, value] of containerEntries(node.value)) {
    const row = buildRow({ key, value, rowY: currentY, arrayEntry }, fonts, highlightKeys);
    rows.push(row);
    currentY += row.height;
  }

  return rows;
}

/** @see .../jsondiagram/TextBlockJson.java#calculateDimensionSlow */
export function measureNode(
  flatNode: FlatNode,
  highlightKeys: ReadonlyMap<string, string>,
  measurer: StringMeasurer,
  fontSize: number,
  options?: BuildRowsOptions,
): MeasuredNode {
  const { keyFont, valFont } = fontsFor(fontSize, options);
  const rows = buildRows(flatNode, highlightKeys, measurer, fontSize, options);

  const { keyColWidth, valueColWidth } = columnWidths(
    rows, measurer, keyFont, valFont, options?.maximumWidth,
  );

  const lastRow = rows.at(-1);
  const summedHeight = lastRow !== undefined ? lastRow.y + lastRow.height : 0;
  const summedWidth = keyColWidth + valueColWidth;

  return {
    flatNode,
    rows,
    keyColWidth,
    valueColWidth,
    totalWidth: summedWidth === 0 ? MIN_WIDTH : summedWidth,
    totalHeight: summedHeight === 0 ? MIN_HEIGHT : summedHeight,
  };
}

/**
 * graphviz's `#define GAP 4` — "whitespace in POINTS around labels and between
 * peripheries" (`~/git/graphviz/lib/common/const.h:251`). A record field adds
 * it on each side, which is why upstream pre-subtracts `2 * GAP` from the
 * column widths it encodes: `getDotLabelArray(colAwidth - 8, colBwidth - 8, …)`
 * (`SmetanaForJson.java:249-252`).
 */
const RECORD_FIELD_GAP = 4;

/**
 * The graphviz record label for one node, carrying a `<Pn>` port per row.
 *
 * @see ~/git/plantuml/.../jsondiagram/SmetanaForJson.java#getDotLabelArray
 * @see ~/git/plantuml/.../jsondiagram/SmetanaForJson.java#getDotLabelMap
 *
 * Cell sizes travel as `_dim_<height>_<width>_` sentinels rather than as real
 * text: the caller already knows every dimension and must not have graphviz
 * re-derive it from the label. `core/dot-engine-measurer.ts` decodes them,
 * exactly as `smetana/core/Macro.java#hackInitDimensionFromLabel` does for
 * upstream. Group order is upstream's — height first.
 *
 * An ARRAY node is a flat row of ported cells; a MAP node is column A (one
 * full-height cell) beside a nested stack of ported column-B cells.
 */
export function recordLabelFor(m: MeasuredNode): string {
  // Compensate for the padding OUR engine applies, on BOTH axes.
  //
  // `size_reclbl` pads every leaf field by `XPAD` (`d.x += 4*GAP` = 16) and
  // `YPAD` (`d.y += 2*GAP` = 8) — `~/git/graphviz/lib/common/macros.h:27-29`.
  // Encoding a cell at its intended size therefore overshoots by exactly that,
  // so the encoded value is the intended size MINUS the padding.
  //
  // Upstream subtracts only the `YPAD` half (`colAwidth - 8`), and that is not
  // an oversight on its part: Smetana does not reproduce `XPAD`, so upstream
  // has nothing to compensate there. `@knowvah/dot-engine` DOES — verified
  // against the installed `dot` 15.1.1, which returns byte-identical record
  // geometry for the same label. Per CLAUDE.md ("Smetana is NOT a porting
  // target") this port follows the faithful engine, which means compensating
  // both axes rather than copying a compensation calibrated to a transpile
  // that pads once.
  //
  // Sourced, not fitted: both terms come from `macros.h`, the same place
  // upstream's own `- 8` comes from.
  const heightPad = 4 * RECORD_FIELD_GAP;
  const widthA = m.keyColWidth - 2 * RECORD_FIELD_GAP;
  const widthB = m.valueColWidth - 2 * RECORD_FIELD_GAP;
  const cell = (height: number, width: number): string =>
    `_dim_${height - heightPad}_${width}_`;
  const ported = (i: number, height: number, width: number): string =>
    `<P${i}>${cell(height, width)}`;

  if (m.rows.length === 0) return '';
  if (m.rows[0]!.arrayEntry) {
    return m.rows.map((r, i) => ported(i, r.height, widthA)).join('|');
  }
  const totalHeight = m.rows.reduce((acc, r) => acc + r.height, 0);
  const colB = m.rows.map((r, i) => ported(i, r.height, widthB)).join('|');
  return `{${cell(totalHeight, widthA)}|{${colB}}}`;
}
