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
function heightOfRow(textHeight: number, valueLineCount: number): number {
  const keyCell = textHeight + 2 * CELL_MARGIN_Y;
  const valueCell = valueLineCount * textHeight + 2 * CELL_MARGIN_Y;
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
    const kw = measurer.measure(row.key, keyFont).width + 2 * CELL_MARGIN_X;
    // For multi-line values, the widest individual line.
    const vw = Math.max(
      ...row.valueLines.map((l) => measurer.measure(l, valFont).width + 2 * CELL_MARGIN_X),
    );
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
  const maximumWidth = options?.maximumWidth;

  const rows: JsonRowGeo[] = [];
  // Rows start at the node's top edge: upstream's `drawU` walks
  // `y = 0; for (line) y += heightOfRow` (:267-275). No leading pad, and
  // `getTotalHeight` is a plain sum with no trailing one either.
  let currentY = 0;

  for (const [k, v] of containerEntries(node.value)) {
    const { processed, valueLines, valueType } = cellLines(v, measurer, font, maximumWidth);
    const rowHeight = heightOfRow(measurer.measure(k, font).height, valueLines.length);

    rows.push({
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
