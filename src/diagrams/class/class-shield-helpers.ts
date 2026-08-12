/**
 * Port/qualifier "shield" helpers for the class diagram DOT-graph builder
 * (./class-dot-graph.ts). Split out of ./class-layout-helpers.ts (S2 — pure
 * relocation, no logic change) to keep both files under the repo's
 * 500-line-per-file cap and every function under the CCN/NLOC caps — same
 * split rationale as S1's class-object-sizing.ts. `class-layout-helpers.ts`
 * keeps `LIKE_CLASS_KINDS` (consumed by `memberPortIsP` below, imported back
 * from there) and `MeasuredClassifier`/`formatMemberText` (imported widely
 * elsewhere, not worth churning for this headroom), so every existing
 * `./class-layout-helpers.js` import site for those keeps working unchanged.
 */

import type { Classifier, ClassDiagramAST } from './ast.js';
import { LIKE_CLASS_KINDS } from './class-layout-helpers.js';

/**
 * Package/namespace ids used as a relationship endpoint OR a `note <pos> of
 * <package>` target. svek routes such an edge to a `zaent` point anchor
 * INSIDE that cluster (ClusterDotString) instead of drawing a separate node
 * for the package. Maps the endpoint id → anchor id. Only populated when a
 * namespace id actually appears as an endpoint/note-target, so the transform
 * is a no-op for every diagram that does not hit this case.
 */
export function packageEndpointAnchors(
  ast: ClassDiagramAST,
  clusterNsIds: ReadonlySet<string>,
): Map<string, string> {
  // Only a NON-EMPTY package (an actual cluster) gets an anchor; an empty
  // package used as an endpoint stays a plain rect node (oracle: mujopi p1/p3).
  const anchors = new Map<string, string>();
  for (const rel of ast.relationships) {
    if (clusterNsIds.has(rel.from)) anchors.set(rel.from, `zaent-${rel.from}`);
    if (clusterNsIds.has(rel.to)) anchors.set(rel.to, `zaent-${rel.to}`);
  }
  for (const note of ast.notes) {
    if (note.target !== undefined && clusterNsIds.has(note.target)) {
      anchors.set(note.target, `zaent-${note.target}`);
    }
  }
  return anchors;
}

/**
 * T2/ADR-2 (SI17, `.agent-notes/T8-member-ports-wrong-mechanism.md`): whether
 * a `::member` relationship TARGET still takes the PORTIN/PORTOUT ":P"
 * compass shield (`isPort`), per upstream's own discriminator --
 * `leaf.getEntityPosition().usePortP()` (`abel/Link.java:227-231`, ported at
 * `core/abel/EntityBase.ts:332`). Scoped to a `LIKE_CLASS_KINDS` target ONLY
 * (T2's write-set is this engine's generic name+members box; every other
 * kind -- `object` in particular -- keeps its PRE-EXISTING unconditional
 * `true`, since fixing it needs that kind's own row-port producer and its
 * DOT gate is a count this task must not move). Within that scope the
 * predicate is PROVABLY false, not merely computed false: `LeafType` is a
 * single discriminant upstream (Entity.java:331-337) and this port's
 * `ClassifierKind` mirrors that exclusivity -- `'class'|'abstract'|
 * 'interface'|'enum'|'annotation'|'entity'` can never simultaneously be the
 * `'descriptive'` kind `portin`/`portout`/`port` leaves are declared under
 * (`class-descriptive-leaf-keywords.ts`), so no live class-family leaf can
 * ever reach `EntityPosition.PORTIN`/`PORTOUT` in the first place.
 */
function memberPortIsP(target: Classifier | undefined): boolean {
  return target === undefined || !LIKE_CLASS_KINDS.has(target.kind);
}

/** B1 (SI17): `hasQualifier` is `SvekNode#isShielded`'s `hasKal1`/`hasKal2`
 *  half (svek/SvekNode.java:390-393) — set ONLY by `fromQualifier`/
 *  `toQualifier` below, never by a `::member` port relationship. Kept
 *  separate from `isPort` because a class-family port target ALSO lands in
 *  this map with `isPort: false` (`memberPortIsP`) yet is not shielded. */
export function shieldedClassifierIds(
  ast: ClassDiagramAST,
): Map<string, { isPort: boolean; hasQualifier: boolean }> {
  const shielded = new Map<string, { isPort: boolean; hasQualifier: boolean }>();
  const byId = new Map(ast.classifiers.map((c) => [c.id, c] as const));
  const mark = (id: string, isPort: boolean, hasQualifier: boolean): void => {
    const existing = shielded.get(id);
    if (existing === undefined) shielded.set(id, { isPort, hasQualifier });
    else {
      if (isPort) existing.isPort = true;
      if (hasQualifier) existing.hasQualifier = true;
    }
  };
  for (const rel of ast.relationships) {
    if (rel.fromPort !== undefined) mark(rel.from, memberPortIsP(byId.get(rel.from)), false);
    if (rel.toPort !== undefined) mark(rel.to, memberPortIsP(byId.get(rel.to)), false);
    if (rel.fromQualifier !== undefined) mark(rel.from, false, true);
    if (rel.toQualifier !== undefined) mark(rel.to, false, true);
  }
  return shielded;
}
