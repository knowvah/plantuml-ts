/**
 * `computeLeafDrawOrder` -- the jar's leaf-print order (D1/D2,
 * `plans/leaf-draw-order/decisions.md`), computed purely from the parsed
 * AST: no geometry, no new parse-time tick. `layout.ts` (T4) consumes the
 * returned id list to build `ClassGeometry.leaves` in this order (D3).
 *
 * Upstream draws leaves in `Bibliotekon` insertion order: `printGroups`
 * walks each namespace's OWN leaves before its subgroups, then every leaf
 * with no namespace prints last, in flat quark-registration order. This
 * port has no quark tick; D1's substitute is the existing entity-creation
 * counter (`Classifier.creationIndex` / `ClassNote.creationIndex` /
 * `ClassNote.tipGroupPhantomIndex` / `Namespace.creationIndex`), which
 * already reproduces jar's `ent%04d` numbering everywhere the corpus
 * reaches. Where a counter value is absent (hand-built ASTs, unwired
 * creation paths), the fallback is the id's position in its containing
 * array -- `Namespace.classifiers` for a namespace's own members, sibling
 * declaration order for namespaces, and `[...classifiers, ...notes]` order
 * for unpackaged leaves -- via a STABLE sort (ties keep their input-array
 * relative order, so an all-`undefined`-rank AST reproduces today's order
 * byte-for-byte).
 *
 * @see ~/git/plantuml/.../svek/GraphvizImageBuilder.java:226-227 buildImage
 *   -- `printGroups(root); printEntities(getUnpackagedEntities());`
 */
import type { ClassDiagramAST, ClassNote, Namespace } from './ast.js';

/** Stable sort of `ids` by `rank.get(id)`, `undefined` treated as
 *  `+Infinity` -- ranked entries first (ascending), unranked entries keep
 *  their relative position among themselves, mirroring state's own
 *  `sortSpecsByCreationIndex` (`state-composite-pseudo.ts:59-61`). */
function sortByRank(ids: readonly string[], rank: ReadonlyMap<string, number>): string[] {
  return [...ids].sort((a, b) => {
    const ra = rank.get(a) ?? Number.POSITIVE_INFINITY;
    const rb = rank.get(b) ?? Number.POSITIVE_INFINITY;
    return ra - rb;
  });
}

/**
 * A member-tip note's (`targetPort !== undefined`) rank is its (target,
 * position) group's LEADER's `tipGroupPhantomIndex` -- every later tip on
 * the same host+side reuses the leader's already-created TIPS entity and
 * burns no rank of its own, so it must draw at the leader's slot (array
 * order breaks ties among a group's own members). Grouping key mirrors
 * `note-layout-groups.ts#mergeKey`'s `target|position` shape, restricted to
 * tip notes only -- the exact key the parser itself groups by.
 * @see ~/git/plantuml/.../command/note/CommandFactoryTipOnEntity.java:214-231
 *   `identTip` Quark dedup: first tip per (target, position) creates the
 *   TIPS entity; every later member reuses it via `tips.putTip(...)`.
 * @see class-notes.ts:219 `${resolvedHostId}|${position}` -- the same key,
 *   computed at parse time when `tipGroupPhantomIndex` is stamped.
 */
function tipLeaderRanks(notes: readonly ClassNote[]): Map<string, number> {
  const leaderRankByKey = new Map<string, number>();
  const result = new Map<string, number>();
  for (const note of notes) {
    if (note.targetPort === undefined || note.target === undefined || note.position === undefined) {
      continue;
    }
    const key = `${note.target}|${note.position}`;
    if (note.tipGroupPhantomIndex !== undefined) leaderRankByKey.set(key, note.tipGroupPhantomIndex);
    const leaderRank = leaderRankByKey.get(key);
    if (leaderRank !== undefined) result.set(note.id, leaderRank);
  }
  return result;
}

/** Creation rank for every classifier and note id -- `creationIndex`,
 *  tip-group-adjusted for member-tip notes ({@link tipLeaderRanks}). */
function buildLeafRankMap(ast: ClassDiagramAST): Map<string, number> {
  const rank = new Map<string, number>();
  for (const c of ast.classifiers) {
    if (c.creationIndex !== undefined) rank.set(c.id, c.creationIndex);
  }
  const tipRank = tipLeaderRanks(ast.notes);
  for (const n of ast.notes) {
    const r = tipRank.get(n.id) ?? n.creationIndex;
    if (r !== undefined) rank.set(n.id, r);
  }
  return rank;
}

/** `Namespace.creationIndex` for every namespace, keyed by id -- a separate
 *  numeric space from leaf ranks (used only to order sibling namespaces). */
function buildNamespaceRankMap(namespaces: readonly Namespace[]): Map<string, number> {
  const rank = new Map<string, number>();
  for (const ns of namespaces) {
    if (ns.creationIndex !== undefined) rank.set(ns.id, ns.creationIndex);
  }
  return rank;
}

/**
 * One namespace's contribution: its OWN member leaves (by creation rank)
 * THEN its child namespaces, recursively, in that fixed structural order --
 * `printGroup` never interleaves a group's leaves with its subgroups.
 * @see ~/git/plantuml/.../svek/GraphvizImageBuilder.java:425-435 printGroup
 *   -- `printEntities(g.leafs())` then `printGroups(g)`.
 * @see ~/git/plantuml/.../svek/GraphvizImageBuilder.java:408-422 printGroups
 *   -- iterates `getChildrenGroups(parent)`, D1's namespace-rank substitute
 *   for quark-children insertion order (`abel/Entity.java:659-667`).
 */
function drawNamespace(
  ns: Namespace,
  allNamespaces: readonly Namespace[],
  leafRank: ReadonlyMap<string, number>,
  nsRank: ReadonlyMap<string, number>,
): string[] {
  const ownLeaves = sortByRank(ns.classifiers, leafRank);
  const childIds = sortByRank(
    allNamespaces.filter((n) => n.parentId === ns.id).map((n) => n.id),
    nsRank,
  );
  const childLeaves = childIds.flatMap((childId) => {
    const child = allNamespaces.find((n) => n.id === childId)!;
    return drawNamespace(child, allNamespaces, leafRank, nsRank);
  });
  return [...ownLeaves, ...childLeaves];
}

/** Every classifier/note id NOT claimed by any namespace's `.classifiers`
 *  member list, in `[...classifiers, ...notes]` declaration order (the
 *  fallback a hand-built AST with no namespaces and no `creationIndex`
 *  reduces to). */
function unpackagedIds(ast: ClassDiagramAST): string[] {
  const namespaced = new Set(ast.namespaces.flatMap((ns) => ns.classifiers));
  return [...ast.classifiers.map((c) => c.id), ...ast.notes.map((n) => n.id)].filter(
    (id) => !namespaced.has(id),
  );
}

/**
 * Jar's leaf draw order: every root namespace's subtree (own leaves, then
 * child namespaces, recursively -- {@link drawNamespace}), root namespaces
 * ordered by `Namespace.creationIndex`, THEN every leaf claimed by no
 * namespace, by creation rank ({@link unpackagedIds}).
 * @see ~/git/plantuml/.../svek/GraphvizImageBuilder.java:226-227 buildImage
 * @see ~/git/plantuml/.../svek/GraphvizImageBuilder.java:399-405
 *   getUnpackagedEntities -- `dotData.getLeafs()` filtered to the root
 *   parent, D1's rank substitute for `CucaDiagram#leafs()`'s flat quark
 *   registration order (`net/atmp/CucaDiagram.java:852-862`,
 *   `plasma/Plasma.java:56-64`).
 */
export function computeLeafDrawOrder(ast: ClassDiagramAST): readonly string[] {
  const leafRank = buildLeafRankMap(ast);
  const nsRank = buildNamespaceRankMap(ast.namespaces);
  const rootIds = sortByRank(
    ast.namespaces.filter((ns) => ns.parentId === undefined).map((ns) => ns.id),
    nsRank,
  );
  const grouped = rootIds.flatMap((id) => {
    const ns = ast.namespaces.find((n) => n.id === id)!;
    return drawNamespace(ns, ast.namespaces, leafRank, nsRank);
  });
  return [...grouped, ...sortByRank(unpackagedIds(ast), leafRank)];
}
