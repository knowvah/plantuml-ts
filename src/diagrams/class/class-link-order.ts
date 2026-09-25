/**
 * cdd3-T14 (C-14 = E3-7, E1-4): a class diagram's links in upstream's ONE
 * `getLinks()` order -- the list `GraphvizImageBuilder.java:229` walks to
 * build every `SvekEdge`, which fixes both the DOT edge order (and each
 * edge's ColorSequence values) and the `<g class="link">` draw order
 * (`Bibliotekon#allLines`, `SvekResult.java:97-101`).
 *
 * That list is built by `diagram.addLink` in creation order: a relationship
 * at its own command, a note-on-entity link right after its note
 * (`command/note/CommandFactoryNoteOnEntity.java:360`), a member-tip link
 * when its TIPS entity is first created
 * (`command/note/CommandFactoryTipOnEntity.java:229`), and the magma
 * chaining links LAST, at `checkFinalError` time (`classdiagram/
 * ClassDiagram.java:87` -> `cucadiagram/Magma.java:61`). The export then
 * re-orders the WHOLE list through `getOrderedLinks`
 * (`svek/CucaDiagramFileMakerSvek.java:90-96`).
 *
 * This port keeps relationships (`ast.relationships`) and note links
 * (`note-layout-groups.ts#groupEdge`) in separate structures, so the merged
 * order is computed here once and handed out as (a) the relationship
 * subsequence, which `class-dot-graph.ts` writes back to
 * `ast.relationships` as SB2 already did, and (b) each note link's SLOT:
 * the number of relationships ahead of it. Both DOT emission and the
 * renderer's link loop interleave through {@link interleaveNoteLinks}, so
 * the two sites cannot drift. Magma links are not modelled here: they are
 * appended after this list by `class-dot-graph.ts` and never draw.
 */
import type { Relationship } from './class-relationship-ast.js';
import type { NoteGroup } from './note-layout-groups.js';
import { getOrderedLinks } from './class-dot-edge-order.js';

/** `class-dot-edges.ts`'s DOT edge id for `ast.relationships[i]`; the SAME id
 *  `class-edge-geo.ts` copies onto the relationship's `EdgeGeo`. */
const DOT_EDGE_ID_PREFIX = 'edge-';

export function dotEdgeId(relIndex: number): string {
  return `${DOT_EDGE_ID_PREFIX}${relIndex}`;
}

/** Inverse of {@link dotEdgeId}; `undefined` for any other id. */
export function relIndexOfDotEdgeId(id: string): number | undefined {
  if (!id.startsWith(DOT_EDGE_ID_PREFIX)) return undefined;
  const n = Number(id.slice(DOT_EDGE_ID_PREFIX.length));
  return Number.isInteger(n) && n >= 0 ? n : undefined;
}

type LinkItem =
  | { readonly kind: 'rel'; readonly from: string; readonly to: string; readonly rel: Relationship }
  | { readonly kind: 'note'; readonly from: string; readonly to: string; readonly groupId: string };

export interface ClassLinkOrder {
  /** `ast.relationships` in `getLinks()` + `getOrderedLinks` order. */
  readonly relationships: Relationship[];
  /** Note group id -> relationships ahead of its link in that order. */
  readonly noteLinkSlots: Map<string, number>;
}

/**
 * The `addLink` creation order: relationships keep their array (parse)
 * order, each note link is placed ahead of the first relationship created
 * after its note. A missing rank on either side keeps the relationship
 * first -- the pre-T14 "note links after relationships" order.
 */
function mergeByCreation(
  relationships: readonly Relationship[],
  notes: readonly { groupId: string; target: string; rank: number | undefined }[],
): LinkItem[] {
  const out: LinkItem[] = [];
  let n = 0;
  const noteFirst = (rel: Relationship): boolean => {
    const rank = notes[n]?.rank;
    return rank !== undefined && rel.creationIndex !== undefined && rank < rel.creationIndex;
  };
  for (const rel of relationships) {
    while (n < notes.length && noteFirst(rel)) out.push(noteItem(notes[n++]!));
    out.push({ kind: 'rel', from: rel.from, to: rel.to, rel });
  }
  while (n < notes.length) out.push(noteItem(notes[n++]!));
  return out;
}

function noteItem(n: { groupId: string; target: string }): LinkItem {
  return { kind: 'note', from: n.groupId, to: n.target, groupId: n.groupId };
}

/**
 * Upstream's `getOrderedLinks(getLinks())` over relationships and note
 * links together. `groups` is `note-layout-groups.ts#groupNotes`' output;
 * only a group with a host and position carries a link (`groupEdge`).
 * `leafRank` is `class-leaf-order.ts#buildLeafRankMap` -- a group's id is
 * its first member's note id, whose rank is the note's (or, for member
 * tips, the TIPS leader's) creation tick.
 */
export function orderClassLinks(
  relationships: readonly Relationship[],
  groups: readonly NoteGroup[],
  leafRank: ReadonlyMap<string, number>,
): ClassLinkOrder {
  const notes = groups.flatMap((g) =>
    g.target !== undefined && g.position !== undefined
      ? [{ groupId: g.id, target: g.target, rank: leafRank.get(g.id) }]
      : [],
  );
  const ordered = getOrderedLinks(mergeByCreation(relationships, notes));
  const out: Relationship[] = [];
  const noteLinkSlots = new Map<string, number>();
  for (const item of ordered) {
    if (item.kind === 'rel') out.push(item.rel);
    else noteLinkSlots.set(item.groupId, out.length);
  }
  return { relationships: out, noteLinkSlots };
}

export type InterleavedLink<R, N> = { readonly rel: R } | { readonly note: N };

/**
 * Merge note links into a relationship-ordered list: every note whose slot
 * is <= a relationship's index goes ahead of it; notes with no slot, or a
 * slot past the last relationship, go last. `notes` keep their relative
 * order within a slot (stable sort). `relIndexOf` returning `undefined`
 * flushes nothing before that entry.
 */
export function interleaveNoteLinks<R, N>(
  rels: readonly R[],
  relIndexOf: (rel: R) => number | undefined,
  notes: readonly N[],
  slotOf: (note: N) => number | undefined,
): InterleavedLink<R, N>[] {
  const slot = (note: N): number => slotOf(note) ?? Number.POSITIVE_INFINITY;
  const pending = [...notes].sort((a, b) => (slot(a) === slot(b) ? 0 : slot(a) - slot(b)));
  const out: InterleavedLink<R, N>[] = [];
  let next = 0;
  for (const rel of rels) {
    const index = relIndexOf(rel);
    if (index !== undefined)
      while (next < pending.length && slot(pending[next]!) <= index) out.push({ note: pending[next++]! });
    out.push({ rel });
  }
  while (next < pending.length) out.push({ note: pending[next++]! });
  return out;
}
