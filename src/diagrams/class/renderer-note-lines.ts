/**
 * renderer-note-lines.ts — draws the two note/label draw-metadata kinds
 * `note-layout-measure(-rows).ts` MEASURES (T10, diagnosis `E13` +
 * `jovigo-38-tuni063`): a block-separator's `<line>` (`----`/`==`/`..`,
 * `BodyEnhancedAbstract#decorate`/`TextBlockLineBefore`/`UHorizontalLine`)
 * and a creole-table's grid + cell text (`| a | b |`, `StripeTable`/
 * `AtomTable`). Both mechanisms are measured — and jar-verified — at
 * LAYOUT time, where the `StringMeasurer` is in scope
 * (`note-layout-measure(-rows).ts`'s own doc comments carry the
 * citations); this file is the DRAW-time consumer, reading only the
 * already-resolved `NoteGeo.lineDividers`/`.lineTables`, never
 * re-measuring.
 *
 * cdd-T10 follow-up (wiring fix): the original cut of this file APPENDED
 * every extra after the note's full text block (`renderNoteExtras`,
 * called once per note). That cannot reproduce the jar's real child
 * order — a block-separator's divider draws INTERLEAVED, immediately
 * before its own block's content (`BodyEnhancedAbstract.java:107-121`),
 * not after the whole note — jar-verified regression on `fomofi-36-lova857`
 * (structural diff count RISE, `1→2`, once the append-based wiring landed:
 * the line now existed but at the wrong tree position). Fixed by giving
 * `renderer-note.ts#renderNoteText`'s own per-row loop (the ONE place
 * with the correct cumulative `lineTop`) a THIRD per-row push,
 * {@link renderNoteRowExtra} — this file now owns only the pure
 * per-row/per-cell PRIMITIVES that call needs, no top-level per-note
 * orchestration, and no import of `renderer-note.ts` (breaks what would
 * otherwise be an import cycle now that `renderer-note.ts` imports FROM
 * here).
 */
import type { NoteGeo } from './note-layout-types.js';
import type { NoteDividerDraw, NoteDividerTitle, NoteTableDraw } from './note-layout-measure-rows.js';
import type { MemberRenderAtom } from './class-member-creole.js';
import type { ScaledTheme } from './class-scale-geo.js';
import { line, text, linkWrap, attrs } from '../../core/svg.js';
import { getFont, FontStyle } from '../../core/klimt/shape/UText.js';
import { OPALE_MARGIN_X1 as NOTE_MARGIN_X1 } from '../../core/svek/image/Opale.js';

/**
 * T2d (colede-79-give418): a table's grid rules never set their OWN stroke
 * width -- `AtomTable.java:143-152`'s `drawU` applies only the resolved
 * LINE COLOR (`ug.apply(getLineColor(ug))`) before drawing the grid
 * `<line>`s, never a stroke -- so the grid inherits whatever stroke was
 * ALREADY active on the `ug` the enclosing note's own `drawU` handed to the
 * text block, which differs by note SHAPE:
 *
 * - A FREESTANDING note (`drawNormal`, `EntityImageNote.java:274-282`)
 *   draws its text block on the plain, UNSTROKED `ug` (only `.bg()`/border
 *   COLOR applied, never `.apply(stroke)`) -- so the grid inherits the
 *   diagram's own ambient default, jar-verified `colede-79-give418`: all
 *   four freestanding `note as X` tables draw `stroke-width:1`.
 * - An OPALE note (`Opale.java:105-127`'s `drawU`: `if (stroke != null) ug
 *   = ug.apply(stroke);` BEFORE `textBlock.drawU(...)`) draws its text
 *   block on the note's OWN resolved style stroke -- jar-verified
 *   `jovigo-38-tuni063` (an attached `note right of B`, `stroke-width:0.5`,
 *   the `renderer-note-stroke.ts#NOTE_STROKE_WIDTH` default). The former
 *   port hard-coded this SECOND case's value for BOTH shapes -- this is the
 *   FREESTANDING case's own literal; the opale case now passes its real
 *   `resolveNoteStroke(theme).strokeWidth` in instead (`renderer-note.ts`'s
 *   three call sites).
 */
export const FREESTANDING_TABLE_STROKE_WIDTH = 1;

/** `FontStyle` set -> the SVG `text-decoration` value -- duplicated from
 *  `renderer-note.ts#noteAtomDecoration` (private, read-only for this
 *  task), which itself duplicates `renderer-classifier-box.ts`'s own
 *  identical helper — this file's copy is the THIRD instance of an
 *  already-twice-duplicated project convention, not a new one. */
function lineAtomDecoration(styles: ReadonlySet<FontStyle>): string | undefined {
  const parts: string[] = [];
  if (styles.has(FontStyle.UNDERLINE)) parts.push('underline');
  if (styles.has(FontStyle.STRIKE)) parts.push('line-through');
  if (styles.has(FontStyle.WAVE)) parts.push('wavy underline');
  return parts.length > 0 ? parts.join(' ') : undefined;
}

/** One `UHorizontalLine#drawHLine` (`UHorizontalLine.java:143-147`): the
 *  `[x1, x2]` rule at `y`, plus its `doubleLine` twin 2px below for `==`. */
function hline(x1: number, x2: number, y: number, d: NoteDividerDraw, theme: ScaledTheme): string {
  const style = {
    stroke: theme.colors.border,
    strokeWidth: d.strokeWidth,
    ...(d.strokeDasharray !== undefined ? { strokeDasharray: d.strokeDasharray } : {}),
  };
  const one = line(x1, y, x2, y, style);
  return d.doubleLine === true ? one + line(x1, y + 2, x2, y + 2, style) : one;
}

/** Draws one block-separator's `<line>` (plus its `doubleLine` twin for a
 *  `==` separator, `UHorizontalLine#drawHLine`'s style=='=' branch) at
 *  `rowTop + dividerYOffset` -- `note.x + 1` / `note.x + note.width - 1`
 *  matches `class-body-enhanced-layout.ts#renderDividerPart`'s identical
 *  1px inset, jar-verified against `sodizo-26-salo123` (`UHorizontalLine
 *  .infinite(th, 1, 1, ...)`'s skipAtStart/skipAtEnd, `TextBlockLineBefore
 *  .java:91,99`). A titled one goes through {@link renderTitledDivider}. */
function renderDividerLine(
  note: NoteGeo,
  rowTop: number,
  d: NoteDividerDraw,
  theme: ScaledTheme,
  baselineOffset: number,
): string {
  // cdd-B8FU: the 1px inset is a render-time pixel-literal constant, not
  // geo-sourced -- scaled here like `class-body-enhanced-layout.ts
  // #renderDividerPart`'s identical inset (`renderer-classifier-box.ts`,
  // T29 round 2).
  const x1 = note.x + theme.scaleK;
  const x2 = note.x + note.width - theme.scaleK;
  const y = rowTop + d.dividerYOffset;
  if (d.title !== undefined) return renderTitledDivider({ x1, x2, y, baselineOffset }, d, d.title, theme);
  return hline(x1, x2, y, d, theme);
}

/**
 * cdd6 T3f (nuveji-19-jabi587): `UHorizontalLine#drawLineInternal`'s title
 * arm (`UHorizontalLine.java:84-98`) -- `firstHalf` rule, the title at
 * `drawTitleInternal`'s `x1 = start + (end - start - titleW) / 2`,
 * `y1 = y - titleH / 2 - 0.5` (`:154-166`, `clearArea` false here), then the
 * `secondHalf` rule, in that order. Title lines baseline at their own top +
 * the note's `baselineOffset` (same creole engine and font as a note row).
 * The title's width/height/atoms are layout-time values: `class-scale-geo-
 * note.ts#scaleLineDivider` does not scale them (outside cdd6 T3f's
 * write-set; exact at scale 1).
 */
function renderTitledDivider(
  at: { x1: number; x2: number; y: number; baselineOffset: number },
  d: NoteDividerDraw,
  title: NoteDividerTitle,
  theme: ScaledTheme,
): string {
  const len = (at.x2 - at.x1 - title.width) / 2;
  const titleX = at.x1 + len;
  const titleTop = at.y - title.height / 2 - 0.5;
  let out = hline(at.x1, at.x1 + len, at.y, d, theme);
  for (const sub of title.lines)
    out += renderTableCellLine(titleX, titleTop + sub.y + at.baselineOffset, sub.atoms, theme);
  return out + hline(at.x2 - len, at.x2, at.y, d, theme);
}

/** `atom.font.styles` -> the optional-spread fields {@link
 *  renderTableCellAtom} adds on top of its own base style object -- split
 *  out purely to keep that function's own CCN under this project's
 *  complexity cap (each independent optional field is one branch). */
function tableCellAtomStyleExtras(atom: Extract<MemberRenderAtom, { kind: 'text' }>): {
  fontWeight?: '700';
  fontStyle?: 'italic';
  textDecoration?: string;
} {
  const decoration = lineAtomDecoration(atom.font.styles);
  return {
    ...(atom.font.styles.has(FontStyle.BOLD) ? { fontWeight: '700' as const } : {}),
    ...(atom.font.styles.has(FontStyle.ITALIC) ? { fontStyle: 'italic' as const } : {}),
    ...(decoration !== undefined ? { textDecoration: decoration } : {}),
  };
}

/** One table cell atom's own `<text>` -- the 'text'-only mirror of
 *  `renderer-note.ts#renderNoteLineAtoms`'s identical branch (table cells
 *  carry zero corpus reach for a bullet/image/vector atom — grep-verified
 *  against every `CreoleParser.isTableLine`-tagged fixture — so this
 *  function only handles 'text', unlike that file's full per-kind switch). */
function renderTableCellAtom(
  x: number,
  y: number,
  atom: Extract<MemberRenderAtom, { kind: 'text' }>,
  theme: ScaledTheme,
): string {
  const rendered = text(x, y, atom.renderText ?? atom.text, {
    fontFamily: atom.font.family,
    fontSize: getFont(atom.font).size,
    fill: atom.font.color ?? theme.colors.graph.noteCascadeFontColor ?? '#000000',
    lengthAdjust: 'spacing',
    textLength: atom.renderWidth ?? atom.width,
    ...tableCellAtomStyleExtras(atom),
  });
  return atom.url !== undefined ? linkWrap(rendered, atom.url) : rendered;
}

/** One table cell's own subline run -- x-advances by each atom's LAYOUT
 *  `width` (never `renderWidth`), matching `renderNoteLineAtoms`'s
 *  identical convention. */
function renderTableCellLine(x: number, y: number, atoms: readonly MemberRenderAtom[], theme: ScaledTheme): string {
  let cx = x;
  let out = '';
  for (const atom of atoms) {
    if (atom.kind !== 'text') continue;
    out += renderTableCellAtom(cx, y, atom, theme);
    cx += atom.width;
  }
  return out;
}

/**
 * T2d (colede-79-give418): a `<#color>` background rect -- `AtomTable.java
 * :106-109` (whole-row `lineBackColor`, drawn spanning EVERY column) /
 * `:120,124-125` (per-cell `cellsBackColor`, ONE column). Both branches draw
 * `ug.apply(HColors.none()).apply(color.bg()).draw(URectangle.build(w,h))`
 * -- `HColors.none()` is the "no stroke" paint, which this port's real
 * `core/svg.ts#rect` helper cannot reproduce byte-for-byte (it always emits
 * a `stroke=` ATTRIBUTE; jar's own raw `URectangle` drive here emits a
 * `style="stroke:none;"` STRING instead, jar-verified `colede-79-give418`)
 * -- a small dedicated builder rather than forcing that helper's shape.
 */
function tableBackRect(x: number, y: number, w: number, h: number, fill: string): string {
  const a = attrs([
    ['x', x],
    ['y', y],
    ['width', w],
    ['height', h],
    ['fill', fill],
  ] as const);
  return `<rect${a} style="stroke:none;"/>`;
}

/** {@link renderTableCells}'s per-row leading `<#color>` rect
 *  ({@link NoteTableDraw.rowBackColor}) -- spans every column, drawn BEFORE
 *  that row's own cells (`AtomTable.java:106-116`'s draw order: the
 *  whole-line rect, THEN the per-column loop). `''` for a row with no such
 *  tag (`rowBackColor` unset or missing this row's entry) -- the common
 *  case. */
function renderRowBackRect(note: NoteGeo, rowTop: number, table: NoteTableDraw, row: number, k: number): string {
  const color = table.rowBackColor?.get(row);
  if (color === undefined) return '';
  const x0 = note.x + NOTE_MARGIN_X1 * k;
  const y = rowTop + table.rowBounds[row]!;
  const h = table.rowBounds[row + 1]! - table.rowBounds[row]!;
  const w = table.colBounds[table.colBounds.length - 1]! - table.colBounds[0]!;
  return tableBackRect(x0 + table.colBounds[0]!, y, w, h, color);
}

/** Every cell's own `<#color>` rect (if any, {@link NoteTableCell.backColor})
 *  plus its text, in `AtomTable.ts#drawU`'s draw order (row-major, cells
 *  before the grid rules — `table.cells` is already built in that order by
 *  `note-layout-measure-table.ts#tableGridBounds`). */
function renderTableCells(
  note: NoteGeo,
  rowTop: number,
  table: NoteTableDraw,
  baselineOffset: number,
  theme: ScaledTheme,
): string {
  // cdd-B8FU: `NOTE_MARGIN_X1` (imported from the SHARED `core/svek/image/
  // Opale.ts`, used here as a plain number) is scaled locally -- `note.x`/
  // `table.colBounds`/`.rowBounds` are already scaled.
  const x0 = note.x + NOTE_MARGIN_X1 * theme.scaleK;
  const nbRows = table.rowBounds.length - 1;
  let out = '';
  for (let r = 0; r < nbRows; r++) {
    out += renderRowBackRect(note, rowTop, table, r, theme.scaleK);
    for (const cell of table.cells.filter((c) => c.row === r)) {
      const cellX = x0 + table.colBounds[cell.col]!;
      const cellTop = rowTop + table.rowBounds[cell.row]!;
      if (cell.backColor !== undefined) {
        const w = table.colBounds[cell.col + 1]! - table.colBounds[cell.col]!;
        const h = table.rowBounds[cell.row + 1]! - table.rowBounds[cell.row]!;
        out += tableBackRect(cellX, cellTop, w, h, cell.backColor);
      }
      for (const sub of cell.lines) {
        out += renderTableCellLine(cellX + (sub.dx ?? 0), cellTop + sub.y + baselineOffset, sub.atoms, theme);
      }
    }
  }
  return out;
}

/** The grid's `nbRows+1` horizontal then `nbCols+1` vertical rules, full
 *  span each — `AtomTable.ts#drawGrid`'s own draw order and geometry.
 *  `strokeWidth` is the CALLER's already-resolved, already-scaled inherited
 *  stroke ({@link FREESTANDING_TABLE_STROKE_WIDTH} or
 *  `resolveNoteStroke(theme).strokeWidth` -- this constant's own doc
 *  comment). */
function renderTableGrid(note: NoteGeo, rowTop: number, table: NoteTableDraw, k: number, strokeWidth: number): string {
  const x0 = note.x + NOTE_MARGIN_X1 * k;
  const yTop = rowTop + table.rowBounds[0]!;
  const yBottom = rowTop + table.rowBounds[table.rowBounds.length - 1]!;
  const xLeft = x0 + table.colBounds[0]!;
  const xRight = x0 + table.colBounds[table.colBounds.length - 1]!;
  const style = { stroke: table.lineColor, strokeWidth };
  let out = '';
  for (const y of table.rowBounds) out += line(xLeft, rowTop + y, xRight, rowTop + y, style);
  for (const x of table.colBounds) out += line(x0 + x, yTop, x0 + x, yBottom, style);
  return out;
}

/**
 * One row's own divider `<line>` and/or table grid+cells — the per-row
 * entry point `renderer-note.ts#renderNoteText`'s loop calls at EACH
 * row's own `lineTop`, BEFORE advancing to the next row (see that
 * function's own doc comment for why this must be interleaved, not
 * appended once per note). A no-op ('') for a row with neither
 * `note.lineDividers[i]` nor `note.lineTables[i]` set — the common case.
 */
/** {@link renderNoteRowExtra}'s row-position inputs, bundled to stay under
 *  this project's per-function param cap once `tableStrokeWidth` (T2d)
 *  needed a slot. */
export interface NoteRowExtraPosition {
  readonly lineTop: number;
  readonly i: number;
  readonly baselineOffset: number;
}

export function renderNoteRowExtra(
  note: NoteGeo,
  pos: NoteRowExtraPosition,
  theme: ScaledTheme,
  // T2d (colede-79-give418): the CALLER's already-resolved, already-scaled
  // inherited table-grid stroke -- {@link FREESTANDING_TABLE_STROKE_WIDTH}
  // for a freestanding note, `resolveNoteStroke(theme).strokeWidth` for an
  // opale one (that constant's own doc comment; `renderer-note.ts`'s three
  // call sites resolve which).
  tableStrokeWidth: number,
): string {
  const { lineTop, i, baselineOffset } = pos;
  const divider = note.lineDividers?.[i];
  const table = note.lineTables?.[i];
  const dividerOut = divider !== undefined ? renderDividerLine(note, lineTop, divider, theme, baselineOffset) : '';
  const tableOut =
    table !== undefined
      ? renderTableCells(note, lineTop, table, baselineOffset, theme) +
        renderTableGrid(note, lineTop, table, theme.scaleK, tableStrokeWidth)
      : '';
  return dividerOut + tableOut;
}
