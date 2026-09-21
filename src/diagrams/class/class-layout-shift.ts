/**
 * Ink-shift helpers for the class layout -- the five per-geo translate
 * functions, split out of `layout.ts` (500-line hook cap, cdd-T6). A pure
 * move apart from `shiftEdgeExtras`, which cdd-T6 added for the four new
 * `EdgeGeo` coordinate fields.
 */
import type { ClassifierGeo, EdgeGeo, NamespaceGeo } from './class-geo-types.js';
import type { NoteGeo } from './note-layout.js';

// ---------------------------------------------------------------------------
// Ink-shift application (G2/N11) — post-dot-layout, pre-render uniform
// translate. `SvekResult#calculateDimension`'s own `moveDelta(6 - minMax
// .getMinX(), 6 - minMax.getMinY())` side effect (svek/SvekResult.java:133,
// see `layout-ink-extent.ts`'s own doc comment for the full jar citation).
// Shared by `layoutSinglePage` (the real ink shift, both axes) and
// `layoutMultiPage` (the y-only, OUR-OWN `NEWPAGE_GAP` page-stacking offset
// — same shape of translate, different origin, so the SAME helpers apply
// with `dx=0`).
// ---------------------------------------------------------------------------

/** Shift a ClassifierGeo's absolute position by `(dx, dy)`. */
export function shiftClassifierGeo(c: ClassifierGeo, dx: number, dy: number): ClassifierGeo {
  return { ...c, x: c.x + dx, y: c.y + dy };
}

/** Shift a NamespaceGeo's absolute position by `(dx, dy)`. */
export function shiftNamespaceGeo(n: NamespaceGeo, dx: number, dy: number): NamespaceGeo {
  return { ...n, x: n.x + dx, y: n.y + dy };
}

/** Shift every coordinate in an EdgeGeo by `(dx, dy)` (labels included). */
export function shiftEdgeGeo(edge: EdgeGeo, dx: number, dy: number): EdgeGeo {
  return {
    ...edge,
    points: edge.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
    ...(edge.label !== undefined ? { label: { ...edge.label, x: edge.label.x + dx, y: edge.label.y + dy } } : {}),
    ...(edge.labelLines !== undefined
      ? {
          labelLines: edge.labelLines.map((l) => ({
            ...l,
            x: l.x + dx,
            y: l.y + dy,
            ...(l.glyph !== undefined
              ? { glyph: { points: l.glyph.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) } }
              : {}),
          })),
        }
      : {}),
    ...(edge.arrowGlyph !== undefined
      ? { arrowGlyph: { points: edge.arrowGlyph.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) } }
      : {}),
    ...(edge.tailLabel !== undefined
      ? { tailLabel: { ...edge.tailLabel, x: edge.tailLabel.x + dx, y: edge.tailLabel.y + dy } }
      : {}),
    ...(edge.headLabel !== undefined
      ? { headLabel: { ...edge.headLabel, x: edge.headLabel.x + dx, y: edge.headLabel.y + dy } }
      : {}),
    ...shiftEdgeExtras(edge, dx, dy),
  };
}

/** cdd-T6: the four fields A2a's render-only link mechanisms added
 *  (`visibilityIcon`, `quantifierLines`, `noteBox`, `constraint`). Split
 *  from {@link shiftEdgeGeo} purely to keep that function under the
 *  per-function NLOC cap; every coordinate here is absolute, exactly like
 *  the fields above, so all of them translate. Omitting any one of them
 *  leaves it at the pre-shift origin — measured, not assumed: the icon
 *  anchor sat 9px left and 7px high of its jar position until this existed. */
function shiftEdgeExtras(edge: EdgeGeo, dx: number, dy: number): Partial<EdgeGeo> {
  const nb = edge.noteBox;
  const c = edge.constraint;
  return {
    ...(edge.visibilityIcon !== undefined
      ? { visibilityIcon: { ...edge.visibilityIcon, x: edge.visibilityIcon.x + dx, y: edge.visibilityIcon.y + dy } }
      : {}),
    ...(edge.quantifierLines !== undefined
      ? {
          quantifierLines: [
            edge.quantifierLines[0].map((l) => ({ ...l, x: l.x + dx, y: l.y + dy })),
            edge.quantifierLines[1].map((l) => ({ ...l, x: l.x + dx, y: l.y + dy })),
          ] as const,
        }
      : {}),
    ...(nb !== undefined
      ? {
          noteBox: {
            ...nb,
            x: nb.x + dx,
            y: nb.y + dy,
            inkBox: { ...nb.inkBox, x: nb.inkBox.x + dx, y: nb.inkBox.y + dy },
          },
        }
      : {}),
    ...(c !== undefined
      ? {
          constraint: {
            ...c,
            line: { x1: c.line.x1 + dx, y1: c.line.y1 + dy, x2: c.line.x2 + dx, y2: c.line.y2 + dy },
          },
        }
      : {}),
  };
}

/** Shift every coordinate in a NoteGeo by `(dx, dy)` (connector included). */
export function shiftNoteGeo(note: NoteGeo, dx: number, dy: number): NoteGeo {
  return {
    ...note,
    x: note.x + dx,
    y: note.y + dy,
    connector: note.connector.map((p) => ({ x: p.x + dx, y: p.y + dy })),
  };
}
