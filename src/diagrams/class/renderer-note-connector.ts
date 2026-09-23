/**
 * cdd-T9b — a plain note's dashed connector to its host is upstream's OWN
 * ordinary `Link`, not part of the note's own `EntityImageNote` styling
 * (`command/note/CommandFactoryNoteOnEntity.java:342`: `new LinkType
 * (LinkDecor.NONE, LinkDecor.NONE).goDashed()`, added via `diagram.addLink`
 * right after the note's own `Entity` is created). T9 already moved the
 * connector's EMISSION site out of the note's own `<g class="entity">` and
 * into `renderer.ts`'s edges phase, as its own `<g class="link">` — this
 * module owns everything that separate `Link` needs that the note's own
 * `EntityImageNote`-mirroring code in `renderer-note.ts` must NOT: the
 * connector's own path geometry + stroke (an ordinary dashed edge, never
 * the note's `NOTE_STROKE_WIDTH`/`'4 4'`), its `Link#idCommentForSvg()`-
 * equivalent `<path id>`, and its entity1/entity2 order
 * (`Link.java:106-113`, `CommandFactoryNoteOnEntity.java:342-357`).
 *
 * Split out of `renderer-note.ts` (500-line file cap) — same "purely for
 * size, no behavior change to the split itself" precedent that file's own
 * header doc comment already establishes for `renderer-bullet-atom.ts`/
 * `renderer-note-dispatch.ts`.
 */
import type { NoteGeo } from './note-layout.js';
import type { ScaledTheme } from './class-scale-geo.js';
import { scaleDashArrayString } from './class-scale-geo-row.js';
import type { ClassUidPlan } from './renderer-uid.js';
import type { NoteConnector } from './renderer-note-dispatch.js';
import { path } from '../../core/svg.js';
import { moveTo, lineTo, cubicTo } from '../../core/svg-path-builder.js';
import { leafPortion, wrapLink } from './renderer-group.js';
import { uniqLinkId } from './renderer-edge.js';

/**
 * Bezier-spline or polyline path data for a routed connector — the SAME
 * shape `renderer-edge.ts#buildPathData` builds for a normal relationship
 * edge (`(points.length - 1) % 3 === 0` and `>= 4` points ⇒ well-formed
 * cubic bezier chain, else a plain polyline fallback for the degenerate
 * 2-point case). Moved here verbatim from `renderer-note.ts` (T9b) — its
 * own doc comment there explained the duplication-not-import choice
 * against `renderer.ts#buildPathData`; unchanged by the move.
 */
function buildConnectorPathData(points: NoteGeo['connector']): string {
  if (points.length === 0) return '';
  const [first, ...rest] = points;
  if (first === undefined) return '';
  const start = moveTo(first.x, first.y);

  const isBezierSpline = points.length >= 4 && (points.length - 1) % 3 === 0;
  if (isBezierSpline) {
    const segments: string[] = [];
    for (let i = 1; i < points.length; i += 3) {
      const c1 = points[i]!;
      const c2 = points[i + 1]!;
      const end = points[i + 2]!;
      segments.push(cubicTo(c1, c2, end));
    }
    return [start, ...segments].join(' ');
  }

  const segments = rest.map((p) => lineTo(p.x, p.y));
  return [start, ...segments].join(' ');
}

/**
 * cdd-T9b (E6 mechanism a, point 1): the connector's own drawn stroke — the
 * SAME default dashed-edge style `renderer-edge.ts#renderEdge` gives every
 * OTHER dashed relationship (`strokeWidth: 1`, `strokeDasharray: '7,7'`,
 * G2 N8), colored with the diagram's own arrow color (never the note's
 * `theme.colors.border`/`NOTE_STROKE_WIDTH` — those style the BOX outline
 * only, `EntityImageNote.java:275-289`). `id` is the caller's own dedup'd
 * `Link#idCommentForSvg()` value (`renderer.ts`'s `noteConnectors.forEach`,
 * computed AFTER the real edges populate the shared collision `Set` — same
 * ordering `linkIdForSvg`'s own doc comment establishes for a real edge).
 * Returns `undefined` for a note with no connector geometry (opalised
 * note / tips leaf / freestanding note — see `NoteGeo.connector`'s own
 * doc comment) — the caller must not push a `<g class="link">` for it.
 * @see ~/git/plantuml/.../command/note/CommandFactoryNoteOnEntity.java:342
 */
export function renderNoteConnectorPath(note: NoteGeo, theme: ScaledTheme, id: string): string | undefined {
  const d = buildConnectorPathData(note.connector);
  if (d === '') return undefined;
  // cdd-B8FU: matches `renderer-edge.ts#renderEdge`'s identical dashed-edge
  // default, scaled the same way (`class-scale-geo-row.ts#scaleDashArrayString`).
  return path(d, {
    stroke: theme.colors.arrow,
    strokeWidth: theme.scaleK,
    strokeDasharray: scaleDashArrayString('7,7', theme.scaleK),
    id,
  });
}

/**
 * cdd-T9b (point 3 groundwork / point 2): `NoteGeo` carries no `position`
 * field at render time — `note-layout-groups.ts#groupEdge` already
 * consumes `NotePosition` to decide the synthetic DOT edge's `from`/`to`
 * (`NOTE_EDGE[position].fromNote`, mirroring `CommandFactoryNoteOnEntity`'s
 * own `Link(cl1, note, ...)` vs `Link(note, cl1, ...)` choice one-for-one),
 * but that decision is not threaded onto the produced `NoteGeo`. Recovered
 * here from the ALREADY-ROUTED spline's own endpoints instead of touching
 * that file (outside this task's write-set): a DOT-routed edge's point
 * list starts at its `from` node's boundary, so `note.connector[0]` sits
 * at (or touching) the NOTE's own box for a note-first order and away from
 * it for a host-first order — squared distance to the note's bounding-box
 * CENTER (cheap, no host geometry needed) distinguishes the two ends.
 * Jar-verified against `fogexa-30-zupo141`/`pecabi-95-demu756` (`note top
 * of`, LEFT/TOP ⇒ note-first): `connector[0]` lands within a few px of the
 * note's own bottom edge in both, `connector.at(-1)` far off at the host.
 */
export function noteIsConnectorSource(note: NoteGeo): boolean {
  const first = note.connector[0];
  const last = note.connector.at(-1);
  if (first === undefined || last === undefined) return true;
  const cx = note.x + note.width / 2;
  const cy = note.y + note.height / 2;
  const distSq = (p: { x: number; y: number }): number => (p.x - cx) ** 2 + (p.y - cy) ** 2;
  return distSq(first) <= distSq(last);
}

/**
 * cdd-T9b (point 2): the note's own `Entity.getName()` — upstream mints it
 * as `diagram.getUniqueSequence("GMN")`, the SAME shared `cpt1` counter
 * `class-notes.ts#addNote`'s `phantomSlot` burn already tracks (its own
 * doc comment: the GMN slot is consumed ONE tick before the note's own
 * `Entity` ctor slot) — so the GMN value is always `creationIndex - 1`.
 * Falls back to the note's own port-local id for a note somehow missing a
 * `creationIndex` (a hand-built test `NoteGeo` bypassing `class-notes.ts`'s
 * counter) — never reached by production geometry, since a connector
 * (`note.connector.length > 0`) only exists for a note that DID burn the
 * GMN phantom slot (`renderer-uid.ts#assignExact`'s G2 N68 entry).
 */
export function noteGmnName(note: NoteGeo): string {
  return note.creationIndex !== undefined ? `GMN${note.creationIndex - 1}` : note.id;
}

/** entity1/entity2 NAMEs for the connector's `<path id>` (bare `ent1-ent2`
 *  — a note connector's `LinkType(NONE, NONE)` always satisfies `Link
 *  #looksLikeNoDecorAtAllSvg()`, `abel/Link.java:106-113`) and the best-
 *  effort `<!--link X to Y-->` comment text, plus which side is the note
 *  (for the caller's own uid resolution — `renderer.ts`). */
export interface NoteConnectorEndpoints {
  readonly entity1Name: string;
  readonly entity2Name: string;
  readonly noteIsEntity1: boolean;
}

/**
 * cdd-T9b (point 2/3): resolves the connector `Link`'s entity1/entity2
 * NAMEs in upstream's own order — `Position.RIGHT`/`BOTTOM` ⇒ host-then-
 * note, `LEFT`/`TOP` ⇒ note-then-host
 * (`CommandFactoryNoteOnEntity.java:342-357`, see {@link noteIsConnectorSource}
 * for how that order is recovered without a `position` field). The host's
 * name is its bare (unqualified) id — `leafPortion`, the SAME best-effort
 * `<!--...-->`-comment convention `renderer-group.ts` already documents as
 * not conformance-relevant; a package/namespace target (`note top of
 * <package>`) uses its own plain id too, never the `zaent-*` DOT anchor
 * (jar-verified `pecabi-95-demu756`'s `GMN3-oft_openflow_types`).
 */
export function resolveNoteConnectorEndpoints(note: NoteGeo): NoteConnectorEndpoints {
  const noteName = noteGmnName(note);
  const hostName = leafPortion(note.target ?? '');
  return noteIsConnectorSource(note)
    ? { entity1Name: noteName, entity2Name: hostName, noteIsEntity1: true }
    : { entity1Name: hostName, entity2Name: noteName, noteIsEntity1: false };
}

/**
 * cdd-T9b (points 1-3, whole mechanism): the note connector's complete
 * `<g class="link">` markup — path geometry/style, `<path id>`,
 * `data-entity-1/2`, and the group's own `id`, all resolved together since
 * they share ONE entity1/entity2 order decision ({@link
 * resolveNoteConnectorEndpoints}). `ids` is the SAME diagram-wide
 * collision `Set` `renderer.ts`'s real-edge loop populates
 * (`linkIdForSvg`'s own doc comment) — this must run AFTER that loop so
 * the connector's dedup'd id lands in the same sequence a real `Link`'s
 * would upstream. Returns `''` for a note with no connector geometry
 * (cannot occur for an entry `renderer.ts` pushed onto `noteConnectors` —
 * `renderer-note-dispatch.ts#renderOneNote` only does that when
 * `note.connector.length > 0`).
 */
export function renderNoteConnectorLink(
  connector: NoteConnector,
  theme: ScaledTheme,
  uidPlan: ClassUidPlan,
  ids: Set<string>,
): string {
  const { note } = connector;
  const { entity1Name, entity2Name, noteIsEntity1 } = resolveNoteConnectorEndpoints(note);
  const pathId = uniqLinkId(ids, `${entity1Name}-${entity2Name}`);
  const body = renderNoteConnectorPath(note, theme, pathId);
  if (body === undefined) return '';
  const noteUid = uidPlan.noteUid.get(note.id) ?? '';
  const hostUid = note.target !== undefined ? uidPlan.resolveEntityUid(note.target) : '';
  return wrapLink(
    {
      from: entity1Name,
      to: entity2Name,
      uid: uidPlan.noteConnectorUid.get(note.id) ?? '',
      fromUid: noteIsEntity1 ? noteUid : hostUid,
      toUid: noteIsEntity1 ? hostUid : noteUid,
      decor1: undefined,
      decor2: undefined,
    },
    body,
  );
}
