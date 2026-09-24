/**
 * class-scale-geo-edge.ts — `EdgeGeo` scaling helpers for `class-scale-
 * geo.ts` (cdd-T29, D4). Split out purely to keep the parent module under
 * this project's 500-line cap; see `class-scale-geo-row.ts`'s header for
 * the shared "scale resolved geometry as pure data" rationale this module
 * inherits unchanged.
 */
import type {
  EdgeGeo,
  QuantifierLineGeo,
  QuantifierLinesGeo,
  RoleLinesGeo,
  VisibilityIconGeo,
  EdgeNoteBoxGeo,
  EdgeConstraintGeo,
  EdgeKalBoxes,
  KalBox,
  SametailGeo,
} from './class-geo-types.js';
import { scaleAtom } from './class-scale-geo-row.js';

function scalePoints(points: ReadonlyArray<{ x: number; y: number }>, k: number): Array<{ x: number; y: number }> {
  return points.map((p) => ({ x: p.x * k, y: p.y * k }));
}

function scaleQuantifierLine(line: QuantifierLineGeo, k: number): QuantifierLineGeo {
  return { ...line, x: line.x * k, y: line.y * k, width: line.width * k };
}

function scaleQuantifierLines(lines: QuantifierLinesGeo, k: number): QuantifierLinesGeo {
  return [lines[0].map((l) => scaleQuantifierLine(l, k)), lines[1].map((l) => scaleQuantifierLine(l, k))];
}

function scaleRoleLines(lines: RoleLinesGeo, k: number): RoleLinesGeo {
  return [lines[0].map((l) => scaleQuantifierLine(l, k)), lines[1].map((l) => scaleQuantifierLine(l, k))];
}

function scaleVisibilityIcon(icon: VisibilityIconGeo, k: number): VisibilityIconGeo {
  return { ...icon, x: icon.x * k, y: icon.y * k };
}

function scaleNoteBox(box: EdgeNoteBoxGeo, k: number): EdgeNoteBoxGeo {
  return {
    // cdd2-T19c: `position`/`back`/`line` are non-geometric (an enum and
    // raw colour tokens), so they carry through unscaled -- same "copy
    // unchanged" rule `scaleConstraint`'s own `text` field below follows.
    ...box,
    x: box.x * k,
    y: box.y * k,
    width: box.width * k,
    height: box.height * k,
    inkBox: {
      x: box.inkBox.x * k,
      y: box.inkBox.y * k,
      width: box.inkBox.width * k,
      height: box.inkBox.height * k,
    },
    noteLines: box.noteLines.map((l) => ({ ...l, width: l.width * k })),
    // cdd2-T19c: same per-atom scaling `class-scale-geo-note.ts#scaleNoteGeo`
    // already applies to a freestanding/attached note's own `lineAtoms`.
    ...(box.lineAtoms !== undefined
      ? { lineAtoms: box.lineAtoms.map((line) => line.map((a) => scaleAtom(a, k))) }
      : {}),
  };
}

function scaleConstraint(c: EdgeConstraintGeo, k: number): EdgeConstraintGeo {
  return {
    text: c.text,
    line: { x1: c.line.x1 * k, y1: c.line.y1 * k, x2: c.line.x2 * k, y2: c.line.y2 * k },
  };
}

function scaleKalBox(box: KalBox, k: number): KalBox {
  return {
    ...box,
    x: box.x * k,
    y: box.y * k,
    width: box.width * k,
    height: box.height * k,
    textX: box.textX * k,
    textY: box.textY * k,
    textWidth: box.textWidth * k,
  };
}

function scaleKalBoxes(boxes: EdgeKalBoxes, k: number): EdgeKalBoxes {
  return {
    ...(boxes.start !== undefined ? { start: scaleKalBox(boxes.start, k) } : {}),
    ...(boxes.end !== undefined ? { end: scaleKalBox(boxes.end, k) } : {}),
  };
}

function scaleSametail(s: SametailGeo, k: number): SametailGeo {
  return { parentId: s.parentId, contact: { x: s.contact.x * k, y: s.contact.y * k } };
}

/** Label/quantifier/role/visibility-icon fields, scaled -- split out of
 *  {@link scaleEdgeGeo} so neither half of that assembly exceeds this
 *  project's per-function CCN cap. */
function scaleEdgeGeoLabels(edge: EdgeGeo, k: number): Partial<EdgeGeo> {
  return {
    ...(edge.label !== undefined
      ? {
          label: {
            ...edge.label,
            x: edge.label.x * k,
            y: edge.label.y * k,
            width: edge.label.width * k,
            ...(edge.label.fontSize !== undefined ? { fontSize: edge.label.fontSize * k } : {}),
          },
        }
      : {}),
    ...(edge.labelLines !== undefined
      ? {
          labelLines: edge.labelLines.map((l) => ({
            ...l,
            x: l.x * k,
            y: l.y * k,
            width: l.width * k,
            ...(l.glyph !== undefined ? { glyph: { points: scalePoints(l.glyph.points, k) } } : {}),
          })),
        }
      : {}),
    ...(edge.arrowGlyph !== undefined ? { arrowGlyph: { points: scalePoints(edge.arrowGlyph.points, k) } } : {}),
    ...(edge.tailLabel !== undefined
      ? {
          tailLabel: {
            ...edge.tailLabel,
            x: edge.tailLabel.x * k,
            y: edge.tailLabel.y * k,
            width: edge.tailLabel.width * k,
          },
        }
      : {}),
    ...(edge.headLabel !== undefined
      ? {
          headLabel: {
            ...edge.headLabel,
            x: edge.headLabel.x * k,
            y: edge.headLabel.y * k,
            width: edge.headLabel.width * k,
          },
        }
      : {}),
    ...(edge.quantifierLines !== undefined ? { quantifierLines: scaleQuantifierLines(edge.quantifierLines, k) } : {}),
    ...(edge.roleLines !== undefined ? { roleLines: scaleRoleLines(edge.roleLines, k) } : {}),
    ...(edge.visibilityIcon !== undefined ? { visibilityIcon: scaleVisibilityIcon(edge.visibilityIcon, k) } : {}),
  };
}

/** Box/decoration fields (note-on-link, constraint, qualifier boxes,
 *  sametail), scaled -- see {@link scaleEdgeGeoLabels}'s own doc comment
 *  for why this is split from the label half. */
function scaleEdgeGeoBoxes(edge: EdgeGeo, k: number): Partial<EdgeGeo> {
  return {
    ...(edge.noteBox !== undefined ? { noteBox: scaleNoteBox(edge.noteBox, k) } : {}),
    ...(edge.constraint !== undefined ? { constraint: scaleConstraint(edge.constraint, k) } : {}),
    ...(edge.kalBox !== undefined ? { kalBox: scaleKalBoxes(edge.kalBox, k) } : {}),
    ...(edge.strokeWidth !== undefined ? { strokeWidth: edge.strokeWidth * k } : {}),
    ...(edge.strokeDasharray !== undefined
      ? { strokeDasharray: [edge.strokeDasharray[0] * k, edge.strokeDasharray[1] * k] as const }
      : {}),
    ...(edge.sametail !== undefined ? { sametail: scaleSametail(edge.sametail, k) } : {}),
    ...(edge.leafContacts !== undefined ? { leafContacts: edge.leafContacts.map((c) => scaleSametail(c, k)) } : {}),
  };
}

/** One relationship's full drawn geometry, scaled. */
export function scaleEdgeGeo(edge: EdgeGeo, k: number): EdgeGeo {
  return {
    ...edge,
    points: scalePoints(edge.points, k),
    ...scaleEdgeGeoLabels(edge, k),
    ...scaleEdgeGeoBoxes(edge, k),
  };
}
