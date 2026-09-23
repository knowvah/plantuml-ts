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
import type { NoteDividerDraw, NoteTableDraw } from './note-layout-measure-rows.js';
import type { MemberRenderAtom } from './class-member-creole.js';
import type { ScaledTheme } from './class-scale-geo.js';
import { line, text, linkWrap } from '../../core/svg.js';
import { getFont, FontStyle } from '../../core/klimt/shape/UText.js';
import { OPALE_MARGIN_X1 as NOTE_MARGIN_X1 } from '../../core/svek/image/Opale.js';

/** `AtomTable.ts#drawGrid`'s own grid rule width -- jar-verified against
 *  `jovigo-38-tuni063`'s ONLY table (`<line ... stroke-width:0.5;>` on
 *  every one of its 7 grid rules); no second corpus fixture to cross-check
 *  a table grid against, so this is a single-fixture-verified constant,
 *  not a derived one. */
/** cdd-B8FU: render-time literal, scaled at its one call site
 *  ({@link renderTableGrid}) by `theme.scaleK` -- `table.colBounds`/
 *  `.rowBounds` are already scaled (`class-scale-geo-note.ts`). */
const TABLE_GRID_STROKE_WIDTH = 0.5;

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

/** Draws one block-separator's `<line>` (plus its `doubleLine` twin for a
 *  `==` separator, `UHorizontalLine#drawHLine`'s style=='=' branch) at
 *  `rowTop + dividerYOffset` -- `note.x + 1` / `note.x + note.width - 1`
 *  matches `class-body-enhanced-layout.ts#renderDividerPart`'s identical
 *  1px inset, jar-verified against `sodizo-26-salo123`. */
function renderDividerLine(note: NoteGeo, rowTop: number, d: NoteDividerDraw, theme: ScaledTheme): string {
  // cdd-B8FU: the 1px inset is a render-time pixel-literal constant, not
  // geo-sourced -- scaled here like `class-body-enhanced-layout.ts
  // #renderDividerPart`'s identical inset (`renderer-classifier-box.ts`,
  // T29 round 2).
  const x1 = note.x + theme.scaleK;
  const x2 = note.x + note.width - theme.scaleK;
  const y = rowTop + d.dividerYOffset;
  const dashField = d.strokeDasharray !== undefined ? { strokeDasharray: d.strokeDasharray } : {};
  const one = line(x1, y, x2, y, { stroke: theme.colors.border, strokeWidth: d.strokeWidth, ...dashField });
  return d.doubleLine === true
    ? one + line(x1, y + 2, x2, y + 2, { stroke: theme.colors.border, strokeWidth: d.strokeWidth, ...dashField })
    : one;
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

/** Every cell's own text, in `AtomTable.ts#drawU`'s draw order (row-major,
 *  cells before the grid rules — `table.cells` is already built in that
 *  order by `note-layout-measure-rows.ts#tableGridBounds`). */
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
  let out = '';
  for (const cell of table.cells) {
    const cellX = x0 + table.colBounds[cell.col]!;
    const cellTop = rowTop + table.rowBounds[cell.row]!;
    for (const sub of cell.lines) out += renderTableCellLine(cellX, cellTop + sub.y + baselineOffset, sub.atoms, theme);
  }
  return out;
}

/** The grid's `nbRows+1` horizontal then `nbCols+1` vertical rules, full
 *  span each — `AtomTable.ts#drawGrid`'s own draw order and geometry. */
function renderTableGrid(note: NoteGeo, rowTop: number, table: NoteTableDraw, k: number): string {
  const x0 = note.x + NOTE_MARGIN_X1 * k;
  const yTop = rowTop + table.rowBounds[0]!;
  const yBottom = rowTop + table.rowBounds[table.rowBounds.length - 1]!;
  const xLeft = x0 + table.colBounds[0]!;
  const xRight = x0 + table.colBounds[table.colBounds.length - 1]!;
  const style = { stroke: table.lineColor, strokeWidth: TABLE_GRID_STROKE_WIDTH * k };
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
export function renderNoteRowExtra(
  note: NoteGeo,
  lineTop: number,
  i: number,
  baselineOffset: number,
  theme: ScaledTheme,
): string {
  const divider = note.lineDividers?.[i];
  const table = note.lineTables?.[i];
  const dividerOut = divider !== undefined ? renderDividerLine(note, lineTop, divider, theme) : '';
  const tableOut =
    table !== undefined
      ? renderTableCells(note, lineTop, table, baselineOffset, theme) + renderTableGrid(note, lineTop, table, theme.scaleK)
      : '';
  return dividerOut + tableOut;
}
