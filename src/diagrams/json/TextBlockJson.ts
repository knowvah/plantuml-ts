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
import {
  getDisplayValue,
  containerEntries,
  processStringDisplay,
  wordWrapLine,
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
): { processed: string; valueLines: string[]; valueType: JsonRowGeo['valueType'] } {
  const { display, valueType } = getDisplayValue(v);
  const processed = valueType === 'string' ? processStringDisplay(display) : display;
  let valueLines: string[] = valueType === 'string' ? processed.split('\n') : [display];
  if (valueType === 'string' && maximumWidth !== undefined) {
    const wrapped: string[] = [];
    for (const segment of valueLines) {
      for (const wline of wordWrapLine(segment, maximumWidth, measurer, font)) wrapped.push(wline);
    }
    valueLines = wrapped;
  }
  return { processed, valueLines, valueType };
}

export function buildRows(
  node: FlatNode,
  highlightKeys: ReadonlyMap<string, string>,
  measurer: StringMeasurer,
  fontSize: number,
  options?: BuildRowsOptions,
): JsonRowGeo[] {
  const { valFont: font } = fontsFor(fontSize, options);
  const arrayEntry = Array.isArray(node.value);
  const rows: JsonRowGeo[] = [];
  // Rows start at the node's top edge: upstream's `drawU` walks
  // `y = 0; for (line) y += heightOfRow` (:267-275). No leading pad, and
  // `getTotalHeight` is a plain sum with no trailing one either.
  let currentY = 0;

  for (const [k, v] of containerEntries(node.value)) {
    const { processed, valueLines, valueType } = cellLines(v, measurer, font, options?.maximumWidth);
    const rowHeight = heightOfRow(measurer.measure(k, font).height, valueLines.length, arrayEntry);

    rows.push({
      arrayEntry,
      key: k,
      value: processed,
      valueLines,
      valueType,
      highlight: highlightKeys.get(k) ?? false,
      y: currentY,
      height: rowHeight,
    });

    currentY += rowHeight;
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
