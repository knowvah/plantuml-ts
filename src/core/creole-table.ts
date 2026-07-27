/**
 * Creole table parsing, measurement, and SVG rendering.
 *
 * A sibling of `src/core/creole.ts` (kept in a separate module: creole.ts
 * exceeded this repo's 500-line-per-file cap; see
 * `~/.claude/hooks/check-complexity.py`). This file owns the Creole table
 * syntax end to end:
 *
 *   |= Header 1 |= Header 2 |
 *   | Cell 1    | Cell 2    |
 *
 * `|=` prefix marks a header cell; trailing `|` is optional. `creole.ts`
 * composes `isTableLine`/`parseTableRow` into its multi-line
 * `parseCreoleTokens` and re-exports `measureTable`/`tableTokenToSvg`.
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** A single cell in a Creole table. */
export interface TableCell {
  header: boolean;
  content: string;
}

/** A parsed Creole table — one or more consecutive `|…|` lines. */
export interface TableToken {
  kind: 'table';
  rows: Array<Array<TableCell>>;
}

// ---------------------------------------------------------------------------
// Table row parser
// ---------------------------------------------------------------------------

/**
 * Parse a single `|cell|cell|` line into an array of TableCell objects.
 *
 * Rules:
 * - Split on `|` delimiter.
 * - First element before the leading `|` is discarded (empty).
 * - Trailing `|` is optional — a trailing empty segment is discarded.
 * - `|= content` marks a header cell; `| content` is a data cell.
 * - Cell content is trimmed of leading/trailing whitespace.
 */
export function parseTableRow(line: string): TableCell[] {
  // Remove optional leading whitespace before the first `|`
  const trimmed = line.trimStart();
  // Split on `|`; first segment (before leading `|`) is always empty — drop it
  const segments = trimmed.split('|');
  segments.shift(); // drop empty segment before leading `|`

  // Drop trailing empty segment if trailing `|` was present
  if (segments.length > 0 && segments[segments.length - 1]?.trim() === '') {
    segments.pop();
  }

  const cells: TableCell[] = [];
  for (const seg of segments) {
    if (seg.startsWith('=')) {
      cells.push({ header: true, content: seg.slice(1).trim() });
    } else {
      cells.push({ header: false, content: seg.trim() });
    }
  }
  return cells;
}

/**
 * Returns true if `line` is a Creole table row (starts with `|` after
 * optional leading whitespace).
 */
export function isTableLine(line: string): boolean {
  return /^\s*\|/.test(line);
}

// ---------------------------------------------------------------------------
// Table measurement
// ---------------------------------------------------------------------------

/** Padding applied to each side of a cell (pixels). */
const CELL_PADDING = 4;

/** Default line height used when no fontSize is provided. */
export const DEFAULT_LINE_HEIGHT = 14;

/** Approximate character width as a fraction of fontSize. */
const CHAR_WIDTH_RATIO = 0.6;

/** Width of the 1px border strokes between / around cells (pixels). */
const BORDER_STROKE = 1;

/** Number of columns in a table — the widest row across all rows. */
function countColumns(rows: Array<Array<TableCell>>): number {
  let numCols = 0;
  for (const row of rows) {
    if (row.length > numCols) numCols = row.length;
  }
  return numCols;
}

/** Per-column max content pixel width (before padding), across all rows. */
function computeContentColWidths(
  rows: Array<Array<TableCell>>,
  numCols: number,
  charWidth: number,
): number[] {
  const colWidths: number[] = Array.from({ length: numCols }, () => 0);
  for (const row of rows) {
    for (let c = 0; c < row.length; c++) {
      const cell = row[c];
      if (cell === undefined) continue;
      const contentPx = cell.content.length * charWidth;
      const colW = colWidths[c];
      if (colW !== undefined && contentPx > colW) {
        colWidths[c] = contentPx;
      }
    }
  }
  return colWidths;
}

/**
 * Measure the pixel dimensions of a `TableToken`.
 *
 * Column widths are determined by the widest cell content in each column
 * across all rows.  Row height is uniform: lineHeight + 2 × cellPadding.
 *
 * @param token - The table token to measure.
 * @param fontSize - Font size in px (defaults to DEFAULT_LINE_HEIGHT).
 * @returns `{ width, height, colWidths, rowHeight }` — the last two are
 *   exposed for use by the SVG renderer.
 */
export function measureTable(
  token: TableToken,
  fontSize: number = DEFAULT_LINE_HEIGHT,
): { width: number; height: number; colWidths: number[]; rowHeight: number } {
  const charWidth = fontSize * CHAR_WIDTH_RATIO;
  const rowHeight = fontSize + CELL_PADDING * 2;

  const numCols = countColumns(token.rows);
  const colWidths = computeContentColWidths(token.rows, numCols, charWidth);

  // Add horizontal padding to each column
  const paddedColWidths = colWidths.map(w => w + CELL_PADDING * 2);

  // Total width: sum of column widths + (cols+1) border strokes
  const totalWidth = paddedColWidths.reduce((sum, w) => sum + w, 0) + (numCols + 1) * BORDER_STROKE;

  // Total height: rows × rowHeight + (rows+1) border strokes
  const totalHeight = token.rows.length * rowHeight + (token.rows.length + 1) * BORDER_STROKE;

  return {
    width: totalWidth,
    height: totalHeight,
    colWidths: paddedColWidths,
    rowHeight,
  };
}

// ---------------------------------------------------------------------------
// Table SVG renderer
// ---------------------------------------------------------------------------

/** Parameters for rendering a single table row to SVG. */
interface RenderRowParams {
  row: Array<TableCell>;
  colWidths: number[];
  x: number;
  rowY: number;
  rowHeight: number;
  fontSize: number;
}

/** Render one table row (border rects + centered text) as SVG markup. */
function renderRow(params: RenderRowParams): string {
  const { row, colWidths, x, rowY, rowHeight, fontSize } = params;
  const parts: string[] = [];
  let cellX = x + BORDER_STROKE;

  for (let c = 0; c < colWidths.length; c++) {
    const colW = colWidths[c] ?? 0;
    const cell = row[c];
    const content = cell?.content ?? '';
    const isHeader = cell?.header ?? false;

    // Cell border rect
    parts.push(
      `<rect x="${cellX}" y="${rowY}" width="${colW}" height="${rowHeight}" ` +
      `fill="none" stroke="#000000" stroke-width="1"/>`,
    );

    // Cell text — centered horizontally and vertically
    const textX = cellX + colW / 2;
    const textY = rowY + rowHeight / 2;
    const weightAttr = isHeader ? ' font-weight="bold"' : '';
    parts.push(
      `<text x="${textX}" y="${textY}" font-size="${fontSize}"` +
      `${weightAttr} text-anchor="middle" dominant-baseline="central">` +
      `<tspan>${content}</tspan>` +
      `</text>`,
    );

    cellX += colW + BORDER_STROKE;
  }

  return parts.join('');
}

/**
 * Render a `TableToken` as an SVG string.
 *
 * Each cell is rendered as a `<rect>` border + `<text>` element.
 * Header cells use `font-weight="bold"`.  Text is centered horizontally and
 * vertically within the cell.
 *
 * @param token - The table token to render.
 * @param x - Left edge of the table in the containing coordinate system.
 * @param y - Top edge of the table.
 * @param fontSize - Font size in px (defaults to DEFAULT_LINE_HEIGHT).
 * @returns An SVG string (no wrapper element — caller provides context).
 */
export function tableTokenToSvg(
  token: TableToken,
  x: number,
  y: number,
  fontSize: number = DEFAULT_LINE_HEIGHT,
): string {
  const { colWidths, rowHeight } = measureTable(token, fontSize);
  const parts: string[] = [];

  let rowY = y + BORDER_STROKE;
  for (const row of token.rows) {
    parts.push(renderRow({ row, colWidths, x, rowY, rowHeight, fontSize }));
    rowY += rowHeight + BORDER_STROKE;
  }

  return parts.join('');
}
