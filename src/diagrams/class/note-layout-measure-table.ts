/**
 * The A12 creole-table grid row (`StripeTable`/`AtomTable` geometry), split
 * out of `note-layout-measure-rows.ts` (500-line module cap, T2d) -- a pure
 * move for every symbol except the `<#color>` capture the module doc
 * comment on {@link NoteTableCell.backColor}/{@link NoteTableDraw.rowBackColor}
 * describes; `note-layout-measure-rows.ts` re-exports `NoteRow`/
 * `NoteLineBuildContext` this file still needs, avoiding a cycle (it never
 * imports back).
 */
import { resolveTextEscapes } from '../../core/text-escapes.js';
import { CreoleParser } from '../../core/klimt/creole/legacy/CreoleParser.js';
import { buildMemberAtoms, resolveMemberAtoms, memberBaseFont, type MemberRenderAtom } from './class-member-creole.js';
import { resolveColorToSvgHex } from '../../core/klimt/color/HColorSet.js';
import { shortenColor } from '../../core/svg-format.js';
import type { NoteRow, NoteLineBuildContext } from './note-layout-measure-rows.js';
import { noteLineHeight } from './note-layout-measure-rows.js';

/** `StripeTable.java:85` — `new AtomWithMargin(table, 2, 2)`: the whole
 *  table grid carries a 2px top + 2px bottom margin. */
const TABLE_MARGIN_Y = 2;
/** `StringUtils.PRIVATE_BLOCK` (`StripeTable.java:128`) — escaped `\|`
 *  cells hide the bar behind this sentinel during tokenization. */
const HIDDEN_BAR = '\u{e000}';

/** T10: one table cell's own drawable content, relative to the TABLE
 *  row's own origin (`colBounds[col]`/`rowBounds[row]` below already carry
 *  the absolute-within-row offset; a cell's atoms draw at exactly
 *  `(colBounds[col], rowBounds[row] + baselineOffset)` for its FIRST
 *  subline, shifted by its own `dx` when a `<r>`/`<c>` marker aligns it --
 *  cdd6 T3f, colede-79-give418). `lines` holds one entry per `\n`-split subline within the
 *  cell (`splitTableCellLines`) -- `y` is each subline's own cumulative
 *  offset from the cell's (and so the row's) own top. */
export interface NoteTableCell {
  readonly col: number;
  readonly row: number;
  /** `dx` (cdd6 T3f): the line's own horizontal-alignment shift from the
   *  cell's left edge -- see {@link cellLineShifts}; absent means 0. */
  readonly lines: readonly TableCellLine[];
  /** T2d (colede-79-give418): this cell's OWN leading `<#color>` tag
   *  (`AtomTable.java:120,124-125`'s `line.cellsBackColor.get(j)`) -- an
   *  already-resolved SVG hex, NOT the raw color name/token, matching
   *  {@link NoteTableDraw.lineColor}'s own pre-resolved convention.
   *  `undefined` for the overwhelming majority of cells, which paint no
   *  background rect at all. */
  readonly backColor?: string;
}

/** T10: one creole-table grid's full draw geometry -- `AtomTable.ts`'s own
 *  `getStartingX`/`getStartingY` cumulative-sum convention (col/row N's
 *  start is the sum of every earlier col/row's own max width/height),
 *  computed ONCE at layout time (measurer-free at render time, matching
 *  every other `NoteGeo` field's "measured once, drawn many" contract).
 *  Bounds are relative to the TABLE's own origin: `colBounds[0] === 0`
 *  (flush with the row's left margin, `note.x + NOTE_MARGIN_X1`, same as
 *  plain text) and `rowBounds[0] === TABLE_MARGIN_Y` (the grid's own top
 *  margin, `StripeTable.java:85`'s `AtomWithMargin(table, 2, 2)`). */
export interface NoteTableDraw {
  readonly colBounds: readonly number[];
  readonly rowBounds: readonly number[];
  readonly lineColor: string;
  readonly cells: readonly NoteTableCell[];
  /** T2d (colede-79-give418): row index -> its own leading, OUTSIDE-the-
   *  `|`-delimiters `<#color>` tag (`AtomTable.java:106-109`'s
   *  `line.lineBackColor`, drawn as ONE rect spanning every column -- see
   *  `StripeTable#analyzeAndAddInternal`'s own `getBackOrFrontColor(line,
   *  1)` call BEFORE the `|`-tokenizer runs). Already-resolved SVG hex.
   *  Rows with no such tag have no entry. `undefined` (every hand-built
   *  `NoteTableDraw` test literal predating T2d) means no row carries one --
   *  the SAME "no data ⇒ no rect" reading an empty map would give. */
  readonly rowBackColor?: ReadonlyMap<number, string>;
}

/**
 * A12: one creole-table grid row — the flat measurement-side port of
 * `StripeTable#analyzeAndAddInternal` (java:130-163) + `AtomTable
 * #calculateDimensionSlow` (java:91-96: width = sum of per-column max cell
 * widths, height = sum of per-row max cell heights) + the grid's own
 * `AtomWithMargin(table, 2, 2)` (java:85). NOT wired through the klimt
 * `StripeTable`/`SheetBlock1` object model: this file is class's flat
 * `MemberRenderAtom` adapter over the SAME shared creole primitives
 * (`class-member-creole.ts`'s own module doc comment precedent — a second,
 * structurally different adapter, not a re-port). Jar-verified against
 * `jovigo-38-tuni063` + F-C probe `table` (<0.01px). Cell text is NOT
 * trimmed (upstream tokenizes raw between `|`s), `=`-prefixed cells are
 * bold headers, `\|` escapes hide behind `StringUtils.PRIVATE_BLOCK`.
 *
 * T2d (colede-79-give418): a leading `<#color>` tag — either OUTSIDE the
 * `|`s (whole-row `lineBackColor`) or INSIDE one cell's own `|...|` span
 * (per-cell `cellsBackColor`) — no longer just strips size-inert; both are
 * now CAPTURED (`tableRowCellDims`'s own doc comment) and threaded onto
 * {@link NoteTableDraw.rowBackColor}/{@link NoteTableCell.backColor}.
 */
export function buildTableRow(runLines: readonly string[], ctx: NoteLineBuildContext): NoteRow {
  const built = runLines.map((line) => tableRowCellDims(line, ctx));
  const cellDims = built.map((b) => b.cells);
  const { colBounds, rowBounds, cells } = tableGridBounds(cellDims);
  const rowBackColor = new Map<number, string>();
  built.forEach((b, r) => {
    if (b.lineBackColor !== undefined) rowBackColor.set(r, b.lineBackColor);
  });
  const width = colBounds[colBounds.length - 1]!;
  const height = rowBounds[rowBounds.length - 1]! - TABLE_MARGIN_Y;
  // `StripeTable.java:79-82`'s `getBackOrFrontColor(line, 1)` per-table
  // `<#color>` override (checked against the FIRST run line only) is a
  // named, zero-corpus-reach gap (`jovigo-38-tuni063` carries none) -- the
  // grid always falls back to `fontConfiguration.getColor()`, i.e. this
  // row's own resolved font color, mirroring the SAME `?? '#000000'`
  // fallback `renderNoteLineAtoms`'s text fill already applies.
  const lineColor = ctx.font.color ?? '#000000';
  return {
    text: runLines.join('\n'),
    width,
    atoms: [],
    height: height + TABLE_MARGIN_Y * 2,
    table: { colBounds, rowBounds, lineColor, cells, rowBackColor },
  };
}

/** {@link buildTableRow}'s own `AtomTable.ts#getStartingX`/`getStartingY`
 *  cumulative-sum + cell-flattening pass, split out purely to keep that
 *  function's own NLOC under this project's complexity cap. */
function tableGridBounds(cellDims: readonly (readonly TableCellDims[])[]): {
  colBounds: number[];
  rowBounds: number[];
  cells: NoteTableCell[];
} {
  const nbCols = cellDims.reduce((max, row) => Math.max(max, row.length), 0);
  const colBounds = [0];
  for (let c = 0; c < nbCols; c++) {
    const colW = cellDims.reduce((max, row) => Math.max(max, row[c]?.w ?? 0), 0);
    colBounds.push(colBounds[c]! + colW);
  }
  const rowBounds = [TABLE_MARGIN_Y];
  for (const row of cellDims) {
    const rowH = row.reduce((max, cell) => Math.max(max, cell.h), 0);
    rowBounds.push(rowBounds[rowBounds.length - 1]! + rowH);
  }
  const cells: NoteTableCell[] = [];
  cellDims.forEach((row, r) =>
    row.forEach((cell, c) => {
      const lines = cell.alignRight === true ? rightAlignedLines(cell, colBounds[c + 1]! - colBounds[c]!) : cell.lines;
      cells.push({ col: c, row: r, lines, ...(cell.backColor !== undefined ? { backColor: cell.backColor } : {}) });
    }),
  );

  return { colBounds, rowBounds, cells };
}

/** One `\n`-split subline of a table cell (a `StripeSimple` of the cell's
 *  `SheetBlock1`, `StripeTable.java:143-153`). */
export interface TableCellLine {
  readonly y: number;
  readonly atoms: readonly MemberRenderAtom[];
  readonly dx?: number;
}

/** `AtomTable.java:128-133`: a single-line RIGHT cell draws at
 *  `dx = cellWidth - dimCell.getWidth()` inside its column. */
function rightAlignedLines(cell: TableCellDims, colWidth: number): readonly TableCellLine[] {
  const dx = colWidth - cell.w;
  return dx > 0 ? cell.lines.map((l) => ({ ...l, dx })) : cell.lines;
}

interface TableCellDims {
  readonly w: number;
  readonly h: number;
  readonly lines: readonly TableCellLine[];
  readonly backColor?: string;
  /** A single-line `RIGHT` cell: `AtomTable.java:119-133`'s column-level
   *  `dx = cellWidth - dimCell.getWidth()`, applied once the column width
   *  is known ({@link tableGridBounds}). */
  readonly alignRight?: true;
}

type CellAlign = 'left' | 'center' | 'right';

/** `StripeSimple#manageCellAlignment` (`StripeSimple.java:161-197`): ONE
 *  leading `<l>`/`<left>`/`<c>`/`<center>`/`<r>`/`<right>` marker is
 *  stripped and overrides the alignment (if/else chain -- only one). */
const CELL_ALIGN_MARKERS: readonly (readonly [string, CellAlign])[] = [
  ['<l>', 'left'],
  ['<left>', 'left'],
  ['<center>', 'center'],
  ['<c>', 'center'],
  ['<right>', 'right'],
  ['<r>', 'right'],
];

/** One cell subline's alignment: `StripeTable.java:147-150` strips a
 *  leading `<r>` (RIGHT) before `StripeSimple#analyzeAndAdd`'s own
 *  `manageCellAlignment` (`StripeSimple.java:148`) may strip one more. */
function cellLineAlignment(line: string): { align: CellAlign; text: string } {
  let align: CellAlign = 'left';
  let text = line;
  if (text.startsWith('<r>')) {
    align = 'right';
    text = text.slice('<r>'.length);
  }
  const marker = CELL_ALIGN_MARKERS.find(([m]) => text.startsWith(m));
  return marker === undefined ? { align, text } : { align: marker[1], text: text.slice(marker[0].length) };
}

/** `SheetBlock1#getCoef` (`SheetBlock1.java:172-193`): CENTER 2, RIGHT 1. */
function alignCoef(align: CellAlign): number {
  if (align === 'center') return 2;
  return align === 'right' ? 1 : 0;
}

/** Intra-cell shifts of a MULTI-line cell: `SheetBlock1#initMap`
 *  (`SheetBlock1.java:160-170`) moves each stripe right by
 *  `(maxWidth - stripeWidth) / coef`. A single-line cell has no intra-cell
 *  diff; its RIGHT alignment is `AtomTable`'s column shift instead
 *  (`SheetBlock1#getCellAlignment` returns LEFT unless there is exactly one
 *  stripe, `SheetBlock1.java:101-110`). */
function cellLineShifts(lines: readonly { width: number; align: CellAlign }[], w: number): number[] {
  if (lines.length === 1) return [0];
  return lines.map((l) => {
    const coef = alignCoef(l.align);
    return coef > 0 && w > l.width ? (w - l.width) / coef : 0;
  });
}

/**
 * `CreoleParser.STARTS_BY_COLOR_PATTERN` (`^=?\s*(<#\w+(?:,#?\w+)?>).*`) --
 * this file's own extraction of the SAME leading tag `doesStartByColor`
 * only booleans: the captured token between `<#` and the first `,`/`>` is
 * the BACKGROUND color name (`StripeTable#getBackOrFrontColor(line, 1)` --
 * position 1). A `,frontColor` second half (`AtomTable.java:120`'s
 * `cellsBackColor`/font-color pair) has zero corpus reach and is not
 * captured. Resolved to an SVG hex + shortened (`resolveColorToSvgHex`/
 * `shortenColor`, the SAME pair `style-cascade-class.ts` already composes)
 * so the renderer never re-resolves a color name.
 */
function leadingColorTag(s: string): string | undefined {
  const m = /^=?\s*<#([^,>]+)/.exec(s);
  return m === undefined || m === null ? undefined : shortenColor(resolveColorToSvgHex(m[1]!));
}

/** One table line's cell dims — `StripeTable#analyzeAndAddInternal`'s
 *  tokenizer (`StringTokenizer(line, "|")` skips empty tokens) with the
 *  `\|`-hiding, line/cell `<#color>` capture (T2d, {@link leadingColorTag}),
 *  `=` header detection, and per-cell literal-`\n` split
 *  (`getWithNewlinesInternal`, java:166-197). T10: also captures each
 *  subline's own resolved `atoms` (`build.atoms`, already computed by the
 *  SAME `resolveMemberAtoms` call this function always made -- previously
 *  discarded, keeping only its `width`/`noteLineHeight`) so
 *  {@link buildTableRow} can hand the renderer something to actually draw,
 *  not just a cell's reserved box. */
function tableRowCellDims(line: string, ctx: NoteLineBuildContext): { cells: TableCellDims[]; lineBackColor?: string } {
  let l = line.split('\\|').join(HIDDEN_BAR);
  // T2d: captured BEFORE stripping -- `CreoleParser.doesStartByColor(l)`
  // gates the SAME strip this line always performed.
  const lineBackColor = CreoleParser.doesStartByColor(l) ? leadingColorTag(l) : undefined;
  if (CreoleParser.doesStartByColor(l)) l = l.slice(l.indexOf('>') + 1);
  const tokens = l.split('|').filter((t) => t !== '');
  const cells = tokens.map((token) => tableCellDimsOf(token, ctx));
  return lineBackColor === undefined ? { cells } : { cells, lineBackColor };
}

/** {@link tableRowCellDims}'s per-cell (post-tokenize) arm -- split out
 *  purely to keep that function's own NLOC under this project's
 *  complexity cap once the T2d color capture added a second local. */
function tableCellDimsOf(token: string, ctx: NoteLineBuildContext): TableCellDims {
  let v = token.split(HIDDEN_BAR).join('|');
  const header = v.startsWith('=');
  if (header) v = v.slice(1);
  const backColor = CreoleParser.doesStartByColor(v) ? leadingColorTag(v) : undefined;
  if (CreoleParser.doesStartByColor(v)) v = v.slice(v.indexOf('>') + 1);
  const cellFont = header ? memberBaseFont({ ...ctx.fontSpec, bold: true }, {}) : ctx.font;
  const { w, h, built } = buildCellLines(v, cellFont, ctx);
  const shifts = cellLineShifts(built, w);
  const lines = built.map((b, i) =>
    shifts[i]! > 0 ? { y: b.y, atoms: b.atoms, dx: shifts[i]! } : { y: b.y, atoms: b.atoms },
  );
  return {
    w,
    h,
    lines,
    ...(backColor !== undefined ? { backColor } : {}),
    ...(built.length === 1 && built[0]!.align === 'right' ? { alignRight: true as const } : {}),
  };
}

/** {@link tableCellDimsOf}'s per-subline build (one `StripeSimple` each,
 *  `StripeTable.java:143-153`): alignment marker, atoms, width, height. */
function buildCellLines(
  v: string,
  cellFont: NoteLineBuildContext['font'],
  ctx: NoteLineBuildContext,
): {
  w: number;
  h: number;
  built: { y: number; atoms: readonly MemberRenderAtom[]; width: number; align: CellAlign }[];
} {
  let w = 0;
  let h = 0;
  const built: { y: number; atoms: readonly MemberRenderAtom[]; width: number; align: CellAlign }[] = [];
  for (const raw of splitTableCellLines(v)) {
    const { align, text } = cellLineAlignment(raw);
    const build = resolveMemberAtoms(
      buildMemberAtoms(resolveTextEscapes(text), cellFont),
      cellFont,
      ctx.measurer,
      ctx.sprites,
    );
    built.push({ y: h, atoms: build.atoms, width: build.width, align });
    w = Math.max(w, build.width);
    h += noteLineHeight(build.atoms, ctx.fontSize);
  }
  return { w, h, built };
}

/** `StripeTable#getWithNewlinesInternal` (java:166-197, legacy branch):
 *  `\n` breaks the cell into sub-lines, `\\` is a literal backslash, any
 *  other `\x` keeps both chars. */
function splitTableCellLines(s: string): string[] {
  const result: string[] = [];
  let current = '';
  for (let i = 0; i < s.length; i++) {
    const c = s.charAt(i);
    if (c === '\\' && i < s.length - 1) {
      const c2 = s.charAt(i + 1);
      i++;
      if (c2 === 'n') {
        result.push(current);
        current = '';
      } else if (c2 === '\\') {
        current += c2;
      } else {
        current += c + c2;
      }
    } else {
      current += c;
    }
  }
  result.push(current);
  return result;
}
