/**
 * Class/object package cluster wrapper level.
 *
 * `ClusterDotString.printInternal` (`ClusterDotString.java:85-201`) wraps
 * every non-packed cluster in up to four nested, label-less protection
 * subgraphs before the base `subgraph cluster<N>` — outermost `a`/`p0`, then
 * `i`/`p1` on the way back in (`:98-99`, `:114-115`, `:151-155`). `a`/`i` fire
 * together, both gated by the SAME boolean, `thereALinkFromOrToGroup1`
 * (`:91-99`, `:151-152`); `p0`/`p1` are `protection0(type)`/`protection1(type)`
 * (`:107-108,114,154`), each unconditionally `true` for a class/object package
 * — `protection1` only turns false for a `USymbols.NODE` group or swimlanes
 * (`:307-315`, neither applies here), and both are forced false only when
 * `entityPositionsExceptNormal` is non-empty (`:101-112`), state's
 * border-point/pin feature, which a class/object package never populates.
 *
 * So the level a class/object cluster gets has exactly two values: 2
 * (`a`/`p0`/base/`i`/`p1`) when `thereALinkFromOrToGroup1` is true, 1
 * (`p0`/base/`p1`) otherwise. `thereALinkFromOrToGroup1` starts as
 * `thereALinkFromOrToGroup2` (`:91-92`) — modern-graphviz-only
 * `useProtectionWhenThereALinkFromOrToGroup` (`:93-96`) is the sole thing
 * that can clear it, and this port only targets modern graphviz, so it never
 * does — and that in turn is `isThereALinkFromOrToGroup` (`:317-323`): "does
 * any line in the WHOLE diagram (the `lines` collection is threaded unchanged
 * through every `Cluster#printInternal` recursion level, `Cluster.java:538,
 * 582,608` — never re-scoped per cluster) have this cluster's OWN group
 * entity as `line.isLinkFromOrTo(cluster.getGroup())` (`SvekEdge.java:1270`:
 * `link.getEntity1() == group || link.getEntity2() == group`)". A `Link` is
 * `SvekEdge`-worthy whether it comes from a user relationship or from a note
 * attached to the group (`CommandFactoryNoteOnEntity.java:344-355` builds a
 * real `Link`), so both `ast.relationships` and `ast.notes` are in scope.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ClusterDotString.java:91-115,307-323
 */

import type { ClassDiagramAST } from './ast.js';

/** 1 = p0/base/p1, 2 = a/p0/base/i/p1. */
export type ClusterWrapperLevel = 1 | 2;

/**
 * Whether `nsId` — a namespace/package's own group entity — is itself the
 * `from`/`to` of a relationship, or the `target` of a note, anywhere in the
 * diagram. Ports `isThereALinkFromOrToGroup` (`ClusterDotString.java:317-323`)
 * for the class/object AST's flat relationship + note lists.
 */
function isLinkFromOrToGroup(nsId: string, ast: ClassDiagramAST): boolean {
  const inRelationships = ast.relationships.some(
    (rel) => rel.from === nsId || rel.to === nsId,
  );
  if (inRelationships) return true;
  return ast.notes.some((note) => note.target === nsId);
}

/**
 * The wrapper level `nsId`'s cluster resolves to. Callers pass only ids of
 * namespaces that DO get a cluster (a real, non-empty package) — the
 * predicate is a pure function of the diagram's edges and never returns
 * anything else.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ClusterDotString.java:91-115
 */
export function clusterWrapperLevel(
  nsId: string,
  ast: ClassDiagramAST,
): ClusterWrapperLevel {
  return isLinkFromOrToGroup(nsId, ast) ? 2 : 1;
}
