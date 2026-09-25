/**
 * note-freestanding.ts — G2/N16 Kind B: a freestanding note (`note "text"
 * as N1`, no host classifier/position) connected to a REAL classifier via a
 * plain relationship line (`N1 .. Bar`), NOT the note-attachment `of
 * <Entity>` syntax `note-layout.ts` otherwise handles. Upstream draws this
 * via the SAME `EntityImageNote#opaleLine`/`isOpalisable` mechanism as an
 * attached single-link note (Kind C, `note-opale.ts`) — ANY note leaf with
 * EXACTLY ONE non-invisible connection to a NON-NOTE entity is "opalisable"
 * (`GraphvizImageBuilder.java:133-148`: `single.getOther(entity)
 * .getLeafType() != LeafType.NOTE` is the ONLY "other end" condition — no
 * further exclusion); its connecting `Link` is suppressed from drawing
 * entirely (`SvekEdge#drawU`'s `if (opale) return;`) and the note's own
 * outline merges the connector into a zigzag notch instead (jar-verified
 * via `doseko-41-mavu661`/`sevaxa-72-pudi231`: the jar SVG has no separate
 * `<g class="link">` for the `N1 .. Bar` relationship at all, just the
 * note's own two merged `<path>`s; and via `temise-16-neco018`: `N1 ..
 * (Reporter, Queue)` opalises against the synthetic assoc-circle point the
 * SAME way).
 *
 * G2/N13-N14 already built the Opale mechanism for Kind A (member-tip) and
 * Kind C (attached single-link note, `note-layout.ts#mapGroupNoteGeos`'s
 * own singleton-group branch already tries `buildOpaleNoteGeo` given a
 * `connectorPoints` array — it just never RECEIVES one for a freestanding
 * note, since `groupEdge` returns `undefined` when a note has no `target`/
 * `position`, N9's own doc comment). This module supplies THAT connector,
 * in two halves (the SAME "exactly one connection" eligibility gate, run
 * twice — once PRE-layout, once POST-layout, see each function's own doc
 * comment for why one pass isn't enough):
 *  - {@link findFreestandingNoteRelationshipIndices} (PRE-layout, on raw
 *    `ast.relationships`) — `class-dot-graph.ts` uses this to set
 *    `noArrow: true` on an eligible relationship's DOT edge BEFORE layout
 *    runs, mirroring N14's identical fix for the synthetic note-attachment
 *    edge (`note-layout.ts#groupEdge`) — without it, @knowvah/dot-engine reserves
 *    its default ~10-11px arrow-clip gap when trimming the spline to the
 *    note's box boundary, landing `resolveOpaleConnector`'s notch anchor
 *    short of the real edge (jar-verified wrong against `doseko-41-
 *    mavu661` before this fix).
 *  - {@link findFreestandingNoteConnectors} (POST-layout, on the already-
 *    routed `EdgeGeo[]`) — `layout.ts` uses this to supply
 *    `mapNoteGeos`/`mapGroupNoteGeos` with the note's real connector
 *    points, and to know which edge to drop from the final visible set
 *    once its note resolves via Opale.
 *
 * cdd3-T15 (E3-21): a synthetic-entity SCOPE GUARD used to exclude an
 * assoc-circle/lollipop other-end here, added against a 3->234 regression
 * measured on `temise-16-neco018` BEFORE the DOT creation-order fix (C-14
 * = E3-7, `cdd3-T14`) and this task's own bezier-count guard (C-15 =
 * E3-19) had landed. Upstream's `isOpalisable` has no such exclusion (see
 * above) — re-measured on the post-T14/T15 tree, temise now needs the
 * guard REMOVED to match the jar's own opalised `N1 .. (Reporter, Queue)`.
 *
 * Kept separate from `note-layout.ts` (already at the project's 500-line
 * cap) and `layout.ts` (near cap).
 * @see ~/git/plantuml/.../svek/GraphvizImageBuilder.java:133-148,245-263
 */
import type { ClassNote, Relationship } from './ast.js';
import type { EdgeGeo } from './layout.js';

function freestandingNoteIds(notes: readonly ClassNote[]): ReadonlySet<string> {
  return new Set(notes.filter((n) => n.target === undefined).map((n) => n.id));
}

/**
 * Groups `items` by which freestanding note (if any) each one's `from`/`to`
 * endpoints touch, keeping only groups of size exactly 1 (`isOpalisable`'s
 * own uniqueness gate) — an item touching a NOTE at both ends (note-to-note)
 * or NEITHER end doesn't count. `isInvisible` excludes an invisible
 * relationship the same way `buildEdgeGeos` already does for the
 * post-layout case (there, always `false` — `EdgeGeo[]` is ALREADY
 * invis-filtered).
 */
function findUniqueTouching<T>(
  items: readonly T[],
  noteIds: ReadonlySet<string>,
  endpoints: (item: T) => readonly [string, string],
  isInvisible: (item: T) => boolean,
): Map<string, T> {
  const touching = new Map<string, T[]>();
  for (const item of items) {
    if (isInvisible(item)) continue;
    const [from, to] = endpoints(item);
    const fromIsNote = noteIds.has(from);
    const toIsNote = noteIds.has(to);
    if (fromIsNote === toIsNote) continue; // both or neither -> not a candidate
    const noteEnd = fromIsNote ? from : to;
    const list = touching.get(noteEnd) ?? [];
    list.push(item);
    touching.set(noteEnd, list);
  }
  const out = new Map<string, T>();
  for (const [noteId, list] of touching) {
    if (list.length === 1) out.set(noteId, list[0]!);
  }
  return out;
}

/**
 * PRE-layout: the set of `ast.relationships` INDICES that are Kind-B
 * candidates — `class-dot-graph.ts#buildDotEdges` maps 1:1 by index to
 * `edge-${i}` DOT edge ids, so the caller can set `noArrow: true` on
 * exactly these before handing the graph to the layout engine. See the
 * module doc comment for why this must run BEFORE layout, not just once
 * post-layout.
 */
export function findFreestandingNoteRelationshipIndices(
  notes: readonly ClassNote[],
  relationships: readonly Relationship[],
): ReadonlySet<number> {
  const noteIds = freestandingNoteIds(notes);
  if (noteIds.size === 0) return new Set();
  const indexed = relationships.map((rel, i) => ({ rel, i }));
  const matched = findUniqueTouching(
    indexed,
    noteIds,
    (x) => [x.rel.from, x.rel.to],
    (x) => x.rel.invis === true,
  );
  return new Set([...matched.values()].map((x) => x.i));
}

/**
 * POST-layout: maps a freestanding note's id to the ONE already-routed
 * `EdgeGeo` connecting it to a non-note entity. `edges` is already
 * invis-filtered by `buildEdgeGeos`, so every edge here is a real
 * candidate connection.
 */
export function findFreestandingNoteConnectors(
  notes: readonly ClassNote[],
  edges: readonly EdgeGeo[],
): Map<string, EdgeGeo> {
  const noteIds = freestandingNoteIds(notes);
  if (noteIds.size === 0) return new Map();
  return findUniqueTouching(
    edges,
    noteIds,
    (e) => [e.from, e.to],
    () => false,
  );
}
