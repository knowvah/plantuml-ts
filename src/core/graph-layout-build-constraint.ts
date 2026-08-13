/**
 * The two graph-level paths to `constraint=false`.
 *
 * Upstream (`abel/Link.java:443-448`):
 *
 *     return getEntity1().isGroup() == false && getEntity2().isGroup() == false
 *         && getEntity1().getEntityPosition() != EntityPosition.NORMAL
 *         && getEntity2().getEntityPosition() != EntityPosition.NORMAL
 *         && getEntity1().getParentContainer() == getEntity2().getParentContainer();
 *
 * consulted at emit time by `svek/SvekEdge.java:475-476`. It is a property of
 * the assembled graph, not of any one diagram type, so it lives here and runs
 * once for every engine rather than being restated in the class, description
 * and state edge builders.
 *
 * The three upstream terms map onto signals `DotInputGraph` already carries:
 *
 * | upstream | here |
 * |---|---|
 * | `getEntityPosition() != NORMAL` | `DotInputNode.isPort` — the same flag `svek-dot-emit.ts#edgeRef` turns into the `:P` compass suffix |
 * | `getParentContainer()` | the `DotInputCluster` that directly lists the node in `nodeIds` |
 * | `isGroup() == false` | implicit: a cluster endpoint is routed to an anchor point, and anchors are never `isPort` |
 *
 * Verified against `state/fukexa-85-cuvi894`'s oracle DOT — all five edges,
 * including both negatives (`sh0011:P->sh0017:P` is port-to-port but spans
 * cluster6 -> cluster13, and the oracle correctly omits `constraint=false`).
 *
 * KNOWN GAP: `class/sokevu-87-toce485` is the one corpus fixture of thirteen
 * where this does not reproduce the oracle (ours 0, oracle 1), and the cause
 * is entirely upstream of this predicate.
 *
 * (An earlier version of this comment said "4 edges where the oracle has 6".
 * That was a miscount: two of the oracle's six `->` lines are the port
 * rank-chain `ClusterDotString.printRanks` emits, not edges. The real edge
 * counts match at 4.)
 *
 * The actual gap is that the CLASS engine does not model `port` declarations.
 * For `node n { port p … }` the oracle emits every port endpoint as `:P`
 * (`sh0013:h->sh0010:P`) and chains them with `sh0010->sh0011->sh0012
 * [arrowhead=none]`, whereas this port's graph has `isPort: undefined` on all
 * three port nodes and `portRanks: null` on their cluster. With no `isPort`
 * there is nothing for the same-container rule to match, so the missing
 * `constraint=false` on `n.nwd -> n.firstportname` is a symptom, not a defect
 * here. It is also the only one of the thirteen NOT pinned in
 * `oracle/goldens/`, which is why no gate reports it. Model class-side ports
 * and this follows with no change to this file.
 */
import type { DotInputGraph } from './graph-layout.types.js';

/** Node id → the id of the cluster that DIRECTLY lists it. `undefined` for a
 *  top-level node. Mirrors `getParentContainer()`, which is the immediate
 *  parent, not any ancestor — a nested cluster's node does not share a
 *  container with one in its grandparent. */
function directClusterOf(input: DotInputGraph): Map<string, string> {
  const owner = new Map<string, string>();
  for (const c of input.clusters ?? []) {
    for (const id of c.nodeIds) owner.set(id, c.id);
  }
  return owner;
}

/**
 * Returns `input` with `attributes.constraint = false` set on every edge whose
 * two endpoints are both ports in the same container.
 *
 * Non-mutating: returns the SAME object when nothing qualifies (the
 * overwhelmingly common case — 10 fixtures corpus-wide), so callers that
 * identity-compare are unaffected and no allocation happens on the hot path.
 *
 * Two top-level ports count as sharing a container, matching upstream, where
 * `getParentContainer()` returns the root group rather than null.
 */
export function withSameContainerConstraints(input: DotInputGraph): DotInputGraph {
  const ports = new Set<string>();
  for (const n of input.nodes) if (n.isPort === true) ports.add(n.id);
  if (ports.size === 0) return input;

  const owner = directClusterOf(input);
  const sameContainer = (from: string, to: string): boolean =>
    ports.has(from) && ports.has(to) && owner.get(from) === owner.get(to);

  // The OTHER path to `constraint=false`, and the reason this function is not
  // named after the predicate alone: under `!pragma kermor on`, upstream's
  // `Link` constructor sets it when EXACTLY ONE endpoint is non-normal
  // (`abel/Link.java:139-141`):
  //
  //     if (getPragma().isTrue(PragmaKey.KERMOR))
  //         if (cl1.getEntityPosition().isNormal() == false
  //           ^ cl2.getEntityPosition().isNormal() == false)
  //             setConstraint(false);
  //
  // An XOR, so it is exactly complementary to the same-container rule above,
  // which needs BOTH. `component/siseda-71-napu395` is the fixture: its two
  // `constraint=false` edges (`sh0030->sh0023:P`, `sh0024:P->sh0030`) each
  // have one port end and one plain end, and its three other edges -- one
  // port-free, two port-to-port -- correctly have none.
  const kermorXor = (from: string, to: string): boolean =>
    input.kermor === true && ports.has(from) !== ports.has(to);

  const qualifies = (from: string, to: string): boolean =>
    sameContainer(from, to) || kermorXor(from, to);

  if (!input.edges.some((e) => qualifies(e.from, e.to))) return input;

  return {
    ...input,
    edges: input.edges.map((e) =>
      qualifies(e.from, e.to)
        ? { ...e, attributes: { ...e.attributes, constraint: false as const } }
        : e,
    ),
  };
}
