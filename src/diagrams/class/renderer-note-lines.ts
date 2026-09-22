/**
 * renderer-note-lines.ts — draws the two note/label draw-metadata kinds
 * `note-layout-measure(-rows).ts` now MEASURES (T10, diagnosis `E13` +
 * `jovigo-38-tuni063`) but that were never PAINTED before this task: a
 * block-separator's `<line>` (`----`/`==`/`..`, `BodyEnhancedAbstract
 * #decorate`/`TextBlockLineBefore`/`UHorizontalLine`) and a creole-table's
 * grid + cell text (`| a | b |`, `StripeTable`/`AtomTable`). Both
 * mechanisms are measured — and jar-verified — at LAYOUT time, where the
 * `StringMeasurer` is in scope (`note-layout-measure(-rows).ts`'s own doc
 * comments carry the citations); this file is the DRAW-time consumer,
 * reading only the already-resolved `NoteGeo.lineDividers`/`.lineTables`,
 * never re-measuring.
 *
 * `renderer-note.ts` (T8's write-set) is READ-ONLY for this task — its
 * `renderNoteText` is the only place that already walks `note.lines` with
 * the correct cumulative Y, and it is private (unexported), so this file
 * reimplements that same cumulative-Y walk independently: small, pure, and
 * driven only by PUBLIC `NoteGeo` fields (`note.x`, `note.y`,
 * `note.lineHeights`) plus the SAME `OPALE_MARGIN_*`/`NOTE_FONT_SIZE`
 * constants `renderer-note.ts` itself imports — not a re-derivation of
 * private state, a second reader of the same public contract.
 *
 * {@link renderPlainNoteWithLines} wraps T8's EXPORTED `renderPlainNote`
 * (this task's write-set note: "consumes T8's exported renderPlainNote
 * builder only through this new file") and APPENDS the extra markup as new
 * `entityParts` entries rather than interleaving it into the existing
 * per-line text block: `tests/oracle/svg-conformance/compare.ts
 * #alignChildrenByKey` keys sibling alignment by TAG only (`childKey`,
 * that file's own doc comment — `text`/`line` are independent keys), so a
 * `<line>`'s position in DOCUMENT order relative to the `<text>` runs it
 * visually sits between does not affect fidelity scoring; only its own
 * attributes and the intra-tag order among `<line>`s (or `<text>`s) do.
 *
 * NOT WIRED (this task's stop condition 1 — see the task report for the
 * exact call sites and minimal edits needed): nothing in
 * `renderer.ts`/`renderer-note.ts` calls any export of this file yet.
 */
import type { NoteGeo } from './note-layout-types.js';
import type { NoteDividerDraw, NoteTableDraw } from './note-layout-measure-rows.js';
import type { MemberRenderAtom } from './class-member-creole.js';
import type { TipShape } from './note-tips-resolve.js';
import type { Theme } from '../../core/theme.js';
import { line, text, linkWrap } from '../../core/svg.js';
import { getFont, FontStyle } from '../../core/klimt/shape/UText.js';
import { NOTE_FONT_SIZE } from '../../core/klimt/font/FontParam.js';
import { OPALE_MARGIN_X1 as NOTE_MARGIN_X1 } from '../../core/svek/image/Opale.js';
import { OPALE_MARGIN_Y as NOTE_MARGIN_Y } from '../../core/svek/image/Opale.js';
import { renderPlainNote, renderTipNote, renderOpaleNote } from './renderer-note.js';

/** `AtomTable.ts#drawGrid`'s own grid rule width -- jar-verified against
 *  `jovigo-38-tuni063`'s ONLY table (`<line ... stroke-width:0.5;>` on
 *  every one of its 7 grid rules); no second corpus fixture to cross-check
 *  a table grid against, so this is a single-fixture-verified constant,
 *  not a derived one. */
const TABLE_GRID_STROKE_WIDTH = 0.5;

/** `EntityImageNote.java:275-289`'s own `note { FontSize 13 }`-aware
 *  baseline formula, duplicated from `renderer-note.ts#renderNoteText`'s
 *  identical local (that file is read-only for this task — see the module
 *  doc comment). */
function noteBaselineOffset(theme: Theme): number {
  const fontSize = theme.colors.elements?.['note']?.fontSize ?? NOTE_FONT_SIZE;
  return fontSize - fontSize / 4.5;
}

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
function renderDividerLine(note: NoteGeo, rowTop: number, d: NoteDividerDraw, theme: Theme): string {
  const x1 = note.x + 1;
  const x2 = note.x + note.width - 1;
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
function tableCellAtomStyleExtras(
  atom: Extract<MemberRenderAtom, { kind: 'text' }>,
): { fontWeight?: '700'; fontStyle?: 'italic'; textDecoration?: string } {
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
function renderTableCellAtom(x: number, y: number, atom: Extract<MemberRenderAtom, { kind: 'text' }>, theme: Theme): string {
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
function renderTableCellLine(x: number, y: number, atoms: readonly MemberRenderAtom[], theme: Theme): string {
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
function renderTableCells(note: NoteGeo, rowTop: number, table: NoteTableDraw, theme: Theme): string {
  const x0 = note.x + NOTE_MARGIN_X1;
  const baselineOffset = noteBaselineOffset(theme);
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
function renderTableGrid(note: NoteGeo, rowTop: number, table: NoteTableDraw): string {
  const x0 = note.x + NOTE_MARGIN_X1;
  const yTop = rowTop + table.rowBounds[0]!;
  const yBottom = rowTop + table.rowBounds[table.rowBounds.length - 1]!;
  const xLeft = x0 + table.colBounds[0]!;
  const xRight = x0 + table.colBounds[table.colBounds.length - 1]!;
  const style = { stroke: table.lineColor, strokeWidth: TABLE_GRID_STROKE_WIDTH };
  let out = '';
  for (const y of table.rowBounds) out += line(xLeft, rowTop + y, xRight, rowTop + y, style);
  for (const x of table.colBounds) out += line(x0 + x, yTop, x0 + x, yBottom, style);
  return out;
}

/** One row's own extras -- split out of {@link renderNoteExtras} purely to
 *  keep that function's own CCN under this project's complexity cap. */
function renderNoteRowExtra(note: NoteGeo, lineTop: number, i: number, theme: Theme): string {
  const divider = note.lineDividers?.[i];
  const table = note.lineTables?.[i];
  const dividerOut = divider !== undefined ? renderDividerLine(note, lineTop, divider, theme) : '';
  const tableOut =
    table !== undefined ? renderTableCells(note, lineTop, table, theme) + renderTableGrid(note, lineTop, table) : '';
  return dividerOut + tableOut;
}

/**
 * Every divider `<line>` and table grid+cell this note's rows carry,
 * concatenated in row order — the cumulative `lineTop` walk mirrors
 * `renderer-note.ts#renderNoteText`'s own (private, unreadable from here)
 * loop exactly: `note.y + NOTE_MARGIN_Y`, then `+= note.lineHeights[i] ??
 * fontSize` per row, byte-identical formula, independently reimplemented
 * (see this module's own doc comment for why).
 */
export function renderNoteExtras(note: NoteGeo, theme: Theme): string {
  if (note.lineDividers === undefined && note.lineTables === undefined) return '';
  const fallbackHeight = theme.colors.elements?.['note']?.fontSize ?? NOTE_FONT_SIZE;
  let lineTop = note.y + NOTE_MARGIN_Y;
  let out = '';
  for (let i = 0; i < note.lines.length; i++) {
    out += renderNoteRowExtra(note, lineTop, i, theme);
    lineTop += note.lineHeights?.[i] ?? fallbackHeight;
  }
  return out;
}

/** Appends {@link renderNoteExtras}'s markup onto T8's `renderPlainNote`
 *  result as ONE MORE `entityParts` entry (see this module's own doc
 *  comment for why append rather than interleave is fidelity-neutral). */
export function renderPlainNoteWithLines(note: NoteGeo, theme: Theme): { entityParts: string[]; connector?: string } {
  const built = renderPlainNote(note, theme);
  const extras = renderNoteExtras(note, theme);
  if (extras === '') return built;
  const entityParts = [...built.entityParts, extras];
  return built.connector !== undefined ? { entityParts, connector: built.connector } : { entityParts };
}

/** `renderer.ts`'s own `renderNote(note, theme)` call shape (a plain
 *  string, `(connector ?? '') + entityParts.join('')` — T8's `renderNote`
 *  wrapper's identical formula), so the ONE-LINE wiring edit that call
 *  site needs is a drop-in import swap, not a shape change. NOT called
 *  from anywhere in production yet (this task's stop condition 1). */
export function renderNoteWithLines(note: NoteGeo, theme: Theme): string {
  const { entityParts, connector } = renderPlainNoteWithLines(note, theme);
  return (connector ?? '') + entityParts.join('');
}

/** {@link renderNoteExtras} for the two note kinds `renderPlainNote` does
 *  not cover — a resolved member-tip note (`fomofi-36-lova857`) and a
 *  resolved general "opalisable" note. Both draw UNWRAPPED, plain-string
 *  results (`renderer-note.ts`'s own doc comments), so extras simply
 *  concatenate. */
export function renderTipNoteWithLines(note: NoteGeo, tip: TipShape, theme: Theme): string {
  return renderTipNote(note, tip, theme) + renderNoteExtras(note, theme);
}

export function renderOpaleNoteWithLines(note: NoteGeo, theme: Theme): string {
  return renderOpaleNote(note, theme) + renderNoteExtras(note, theme);
}
