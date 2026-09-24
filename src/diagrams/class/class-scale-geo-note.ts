/**
 * class-scale-geo-note.ts — `NoteGeo` scaling for `class-scale-geo.ts`
 * (cdd-T29, D4). Split out purely to keep the parent module under this
 * project's 500-line cap; depends on `class-scale-geo-row.ts` for
 * `scaleAtom`/`scaleDashArrayString`. See that module's header for the
 * shared "scale resolved geometry as pure data" rationale.
 *
 * None of T29's seven named fixtures carry a `note`, so this module is
 * untested against a scaled jar golden this iteration -- built to the same
 * "every numeric field, multiplied by k" mechanical rule the rest of this
 * file family follows, not independently jar-verified.
 */
import type { NoteGeo } from './note-layout.js';
import type { NoteDividerDraw, NoteTableDraw, NoteTableCell } from './note-layout-measure-rows.js';
import { scaleAtom, scaleDashArrayString } from './class-scale-geo-row.js';

function scaleLineDivider(d: NoteDividerDraw | undefined, k: number): NoteDividerDraw | undefined {
  if (d === undefined) return undefined;
  return {
    ...d,
    dividerYOffset: d.dividerYOffset * k,
    strokeWidth: d.strokeWidth * k,
    ...(d.strokeDasharray !== undefined ? { strokeDasharray: scaleDashArrayString(d.strokeDasharray, k) } : {}),
  };
}

function scaleTableCell(cell: NoteTableCell, k: number): NoteTableCell {
  return {
    ...cell,
    lines: cell.lines.map((l) => ({ y: l.y * k, atoms: l.atoms.map((a) => scaleAtom(a, k)) })),
  };
}

function scaleLineTable(t: NoteTableDraw | undefined, k: number): NoteTableDraw | undefined {
  if (t === undefined) return undefined;
  return {
    ...t,
    colBounds: t.colBounds.map((c) => c * k),
    rowBounds: t.rowBounds.map((r) => r * k),
    cells: t.cells.map((c) => scaleTableCell(c, k)),
  };
}

/** A note (or member-tip) leaf's full drawn geometry, scaled. */
export function scaleNoteGeo(note: NoteGeo, k: number): NoteGeo {
  return {
    ...note,
    x: note.x * k,
    y: note.y * k,
    width: note.width * k,
    height: note.height * k,
    lineWidths: note.lineWidths.map((w) => w * k),
    connector: note.connector.map((p) => ({ x: p.x * k, y: p.y * k })),
    ...(note.lineAtoms !== undefined
      ? { lineAtoms: note.lineAtoms.map((line) => line.map((a) => scaleAtom(a, k))) }
      : {}),
    ...(note.lineHeights !== undefined ? { lineHeights: note.lineHeights.map((h) => h * k) } : {}),
    ...(note.lineDividers !== undefined ? { lineDividers: note.lineDividers.map((d) => scaleLineDivider(d, k)) } : {}),
    ...(note.lineTables !== undefined ? { lineTables: note.lineTables.map((t) => scaleLineTable(t, k)) } : {}),
    ...(note.tipRequest !== undefined
      ? {
          tipRequest: {
            ...note.tipRequest,
            baselineOffset: note.tipRequest.baselineOffset * k,
            rowHeight: note.tipRequest.rowHeight * k,
          },
        }
      : {}),
    ...(note.opale !== undefined
      ? {
          opale: {
            direction: note.opale.direction,
            pp1: { x: note.opale.pp1.x * k, y: note.opale.pp1.y * k },
            pp2: { x: note.opale.pp2.x * k, y: note.opale.pp2.y * k },
          },
        }
      : {}),
  };
}
