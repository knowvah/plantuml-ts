/**
 * graphviz-ts builder construction for `layoutGraph()` — split from
 * `graph-layout.ts` (500-line file cap). Owns the input→builder projection:
 * graph attrs, node declarations (shape mirroring `svek-dot-emit.ts#nodeLine`),
 * rank subgraphs, cluster subgraphs, and edge declarations with the
 * (tail,head)→id EdgeIndex the snapshot mapper consumes.
 */
import type { GvGraphBuilder } from '@knowvah/dot-engine';
import type {
  DotInputCluster,
  DotInputEdge,
  DotInputGraph,
  DotInputNode,
} from './graph-layout.types.js';

/** graphviz width/height/nodesep/ranksep attrs are in inches; our measured
 *  sizes are in pixels. getLayout returns points (inches × 72), so dividing px
 *  by 72 on the way in round-trips: output points == original pixel value. */
export const PX_PER_INCH = 72;


/** `plantuml.skin`'s `arrow { FontSize 13 }` block (`svek/GraphvizImageBuilder
 *  .java#getStyleArrowCardinality` resolves the `arrow.cardinality` style,
 *  which falls through to the plain `arrow` block — no diagram in the corpus
 *  overrides `cardinality` specifically) — the font graphviz-ts must measure
 *  `tailLabel`/`headLabel` text with so its `xladjust` placement search uses
 *  the same box size jar's own `cardinalityFont` would. */
export const CARDINALITY_FONT_SIZE = 13;

/** Maps graphviz-ts (tail,head)-keyed edges back to our edge ids. */
export interface EdgeIndex {
  /** (tail,head) → our edge ids, in input order (consumed left-to-right). */
  idQueues: Map<string, string[]>;
  inputEdgeById: Map<string, DotInputEdge>;
}

export const edgeKey = (tail: string, head: string): string => `${tail} ${head}`;

export function applyGraphAttrs(b: GvGraphBuilder, input: DotInputGraph): void {
  if (input.rankDir !== undefined) b.setAttr('rankdir', input.rankDir);
  if (input.nodeSep !== undefined) {
    b.setAttr('nodesep', (input.nodeSep / PX_PER_INCH).toString());
  }
  if (input.rankSep !== undefined) {
    b.setAttr('ranksep', (input.rankSep / PX_PER_INCH).toString());
  }
  if (input.aspect !== undefined) b.setAttr('aspect', input.aspect.toString());
}

/** Layout-side mirror of `svek-dot-emit.ts#nodeLine`'s shape handling: the
 *  jar feeds graphviz the emitter's DOT, so layout must feed the SAME shape
 *  or spline clipping at node boundaries solves differently (proven on
 *  bunuce-10-vere519: laying the 4px `circle` couple points out as `box`
 *  reproduces the exact 0.03-1.1px path/@d drift previously mis-attributed
 *  to graphviz-ts getLayout; honoring `circle` matches the jar byte-exact).
 *  `plaintext` and title-label nodes still lay out as boxes — their emitter
 *  form is an HTML label table, which layout does not model yet. */
function layoutShape(n: DotInputNode): string {
  const shape = n.shape ?? 'rect';
  if (shape === 'rect' || shape === 'rounded' || shape === 'plaintext') return 'box';
  return shape;
}

/**
 * G7 T16: reorders `input.nodes` so the nodes touched by a `minLen===0` edge
 * (jar's `Bibliotekon.java#first`, `link.getLength()==1` — LEFT/RIGHT-
 * direction transitions, `CommandLinkStateCommon.java:176-182`) come FIRST,
 * in edge-encounter order (tail then head, first edge first, first
 * occurrence wins), followed by every other node in its pre-existing order.
 *
 * Jar's `DotStringFactory#createDotString` interleaves cluster/node
 * declarations with two GLOBAL edge batches: `lines0` (length==1 edges)
 * printed BEFORE any node's own explicit shape line or cluster subgraph,
 * `lines1` (every other edge) printed LAST, after all cluster content
 * (`~/git/plantuml/.../svek/DotStringFactory.java:187-198`). In real DOT
 * text this means a `lines0` edge statement IMPLICITLY creates its endpoint
 * nodes the moment graphviz's parser reaches it — before any later explicit
 * shape line for the SAME node changes anything but that node's attributes.
 * Graphviz's cycle-breaking DFS (`dotgen/acyclic.c`, run before rank
 * assignment) roots at the FIRST node the parser encounters, so this
 * ordering can choose a materially different DFS root — and hence a
 * different back-edge — for any pass whose edge set contains a cycle.
 *
 * This port's builder has no implicit-node-creation phase (`addNodes`
 * declares every node explicitly, in one flat pass, before any edge is
 * registered via `addEdges`) — reordering the flat declaration pass here
 * reproduces the SAME effective "first encountered" order jar's text
 * produces, without needing a textual DOT intermediate.
 *
 * Jar-verified: `pesita-10-dene726`'s `nasreq_auth` pass has a 4-node cycle
 * (`Idle -> __zaent_AA -> Reanimate -> Closing -> Idle`) closed by two
 * `-left-`-direction transitions (both `length===1`); jar's cached
 * `svek-3.dot` emits the reversed `sh0012->sh0010` (`Closing->Idle`) edge as
 * the file's literal first statement, before any node shape declaration,
 * making `Closing` graphviz's DFS root. Pre-fix, this port's flat
 * `input.nodes`-array order made `aa_ok_ex` the first-declared node instead,
 * choosing a different back-edge and producing a >2.5x-too-tall cluster bbox
 * (G7 T13 derivation, `plans/g6-cluster-geometry/batch-4/
 * withlabel-derivation.md` §4). Reordering so `Closing` (the tail of the
 * FIRST `minLen===0` edge) is declared first restores jar's DFS root.
 *
 * Deliberately narrower than jar's full rule in one respect: jar ALSO lets a
 * cluster's own `printCluster1` (`Cluster.java#getNodesOrderedTop`) bump a
 * root-DIRECT NORMAL-position node ahead of `lines0` when it is the tail of
 * an INVERTED (`-left-`/`-up-`) edge that is NOT ALSO length==1 (an `-up-`
 * transition keeps its default length, so it never enters `lines0`) —
 * unimplemented here. Every fixture examined this task (the 3 paper-gate
 * targets and the 57 pinned svg-state goldens) has that condition evaluate
 * to empty: no root-direct node in any of them is the tail of an
 * `-up-`-only inverted edge with no ALSO-length==1 edge covering it. Flagged
 * as a documented, deliberately out-of-scope residual (mission convention:
 * G7 T13 journal items 11/12) — not a silent gap.
 *
 * Edge REGISTRATION order (`addEdges`) is deliberately left unmodified:
 * `withlabel-derivation.md`'s own controlled bisection (§4 item 4,
 * experiments (b)/(d)) found DFS-root selection ALONE — not the specific
 * back-edge choice — is the dominant, sufficient term for the verified
 * defect (either back-edge choice from a corrected root resolves the same
 * cycle correctly); reordering edges too would add blast radius against the
 * 268-fixture DOT-parity gate with no verified fixture that needs it.
 * @see ~/git/plantuml/.../svek/Bibliotekon.java#addLine (`first`, lines0/1 split)
 * @see ~/git/plantuml/.../svek/DotStringFactory.java#createDotString (statement order)
 * @see ~/git/plantuml/.../svek/Cluster.java#getNodesOrderedTop (residual, not ported)
 * @see ~/git/plantuml/.../statediagram/command/CommandLinkStateCommon.java#executeArg (length==1)
 */
export function firstEncounterOrder(input: DotInputGraph): DotInputNode[] {
  const byId = new Map(input.nodes.map((n) => [n.id, n]));
  const first: DotInputNode[] = [];
  const seen = new Set<string>();
  for (const e of input.edges) {
    if (e.attributes?.minLen !== 0) continue;
    for (const id of [e.from, e.to]) {
      if (seen.has(id)) continue;
      const n = byId.get(id);
      // Dangling edges (unknown endpoint) are `addEdges`'s own concern
      // (`nodeIds.has` filter) — nothing to reorder for one here.
      if (n === undefined) continue;
      seen.add(id);
      first.push(n);
    }
  }
  if (first.length === 0) return input.nodes;
  const rest = input.nodes.filter((n) => !seen.has(n.id));
  return [...first, ...rest];
}

export function addNodes(b: GvGraphBuilder, input: DotInputGraph): void {
  for (const n of firstEncounterOrder(input)) {
    if (n.shape === 'point' && n.titleLabelWidth === undefined) {
      // emitter: `[shape=point,width=.01,label=""]` — width OVERRIDES the
      // caller's measured size, exactly as ClusterDotString emits anchors.
      b.addNode(n.id, { shape: 'point', width: '.01', label: '' });
      continue;
    }
    b.addNode(n.id, {
      shape: layoutShape(n),
      fixedsize: 'true',
      // Empty label: plantuml renders node text itself, so graphviz must not
      // measure the implicit name-label (its default "Times,serif" has no LUT
      // metrics and would warn). fixedsize keeps the caller's measured size.
      label: '',
      width: (n.width / PX_PER_INCH).toString(),
      height: (n.height / PX_PER_INCH).toString(),
    });
  }
  // Rank constraints (rank=source|sink|same|min|max): graphviz groups nodes by
  // a subgraph carrying `rank=`. Declaring an existing node id inside the
  // subgraph references it (DOT semantics — no duplicate node is created).
  const rankGroups = new Map<string, string[]>();
  for (const n of input.nodes) {
    const r = n.attributes?.rank;
    if (r === undefined) continue;
    const arr = rankGroups.get(r) ?? [];
    arr.push(n.id);
    rankGroups.set(r, arr);
  }
  let rankSubId = 0;
  for (const [rank, ids] of rankGroups) {
    const sub = b.addSubgraph(`__rank_${rankSubId++}`, { rank });
    for (const id of ids) sub.addNode(id);
  }
}

/** Maps graphviz-ts's own `cluster<N>` subgraph name back to OUR
 *  `DotInputCluster.id` (G5 C2: threaded so `layoutGraph()` can re-key
 *  `getLayout()`'s new `clusters` snapshot entries — graphviz-ts 0.1.26072115,
 *  docs/graphviz-issues/06-cluster-bbox-not-in-getlayout.md's RESOLVED note —
 *  into the caller's own id space; see `DotLayoutResult.clusters`). */
export interface ClusterIndex {
  /** graphviz-ts cluster name (`cluster0`, `cluster1`, …) → our cluster id. */
  idByName: Map<string, string>;
}

/** The two graphviz-ts subgraph handles a `DotInputCluster` resolves to.
 *  `main` is the real `cluster<N>` subgraph — title-table attrs and the
 *  `ClusterIndex` identity live here, and it is what jar's own
 *  `Cluster.getClusterId()` names. `innermost` is where THIS cluster's own
 *  non-anchor members AND any nested child clusters attach.
 *
 *  Jar's `ClusterDotString.printInternal` opens BOTH node children and child
 *  `subgraph cluster*` blocks (`cluster.printCluster1`/`printCluster2`,
 *  `~/git/plantuml/.../svek/ClusterDotString.java:174-176`) only AFTER its
 *  own "i"/"p1" protection wrappers are open — so a child cluster's
 *  parent-resolution must target the PARENT's `innermost` handle, never its
 *  `main` handle, or the child nests as a SIBLING of the parent's own
 *  protection wrappers instead of a descendant (G7 T5's root-cause
 *  diagnosis, `plans/g7-borderpoint-rank/decision-journal.md`). Equal to
 *  `main` when the cluster carries no wrapper (`innerMarginLevels` absent). */
interface ClusterHandles {
  main: GvGraphBuilder;
  innermost: GvGraphBuilder;
}

/**
 * Forward `input.clusters` to graphviz-ts as `cluster<N>` subgraphs so dot
 * lays out container members together (contained) and routes splines across
 * cluster boundaries — the faithful upstream model (one graph, cluster
 * subgraphs, single pass). Nesting is honored via `parentId`. Member ids
 * reference nodes already added by addNodes (DOT semantics: declaring an
 * existing id in a subgraph references it — no duplicate node), mirroring the
 * rank-subgraph code above.
 *
 * Subgraph names are assigned as `cluster0`, `cluster1`, … (a fresh numeric
 * index per cluster) rather than `cluster_${c.id}` — graphviz only requires
 * the `cluster` prefix, but a digits-only suffix additionally matches the
 * DOT-parity oracle comparator's `parseClusters` regex (`^cluster\d+$`,
 * tests/oracle/svek-dot.ts:109), keeping this emission consistent with the
 * Svek-DOT emitter's own `clusterN` naming (src/core/svek-dot-emit.ts) even
 * though that emitter is a separate code path (it serializes `input.clusters`
 * directly and never calls this function).
 *
 * G7 T7 additionally ports jar's full 4-layer `ClusterDotString` protection
 * nesting — outer "a"/"p0" (ancestor-link + always-on protection0, wrapping
 * `main` from the OUTSIDE) and inner "i"/"p1" (thereALinkFromOrToGroup1 +
 * always-on protection1, wrapping a cluster's OWN children) — see
 * `ClusterHandles`'s own doc comment for the nesting-target rationale and
 * `DotInputCluster.innerMarginLevels`'s own doc comment for the full
 * jar-source derivation of which pair fires when.
 *
 * Returns the `ClusterIndex` (G5 C2) so `layoutGraph()` can re-key the
 * `getLayout()` snapshot's own `clusters` array (graphviz-ts's `cluster<N>`
 * naming) back to `input.clusters[].id`. Additive: callers that pass no
 * `clusters` are unaffected (the field was previously emitter-only) — they
 * get back an empty `idByName` map, which `layoutGraph()` uses to omit
 * `DotLayoutResult.clusters` entirely.
 */
export function addClusters(b: GvGraphBuilder, input: DotInputGraph): ClusterIndex {
  const idByName = new Map<string, string>();
  const clusters = input.clusters;
  if (clusters === undefined || clusters.length === 0) return { idByName };
  const byId = new Map<string, DotInputCluster>(
    clusters.map((c) => [c.id, c]),
  );
  const handlesById = new Map<string, ClusterHandles>();
  const nameById = new Map<string, string>();
  let nextIndex = 0;
  // T1b: fresh counter for port-rank grouping subgraphs (`__portrank_N`) --
  // deliberately NOT `cluster`-prefixed, see the naming-pitfall note below.
  let portRankSubId = 0;
  const nameFor = (c: DotInputCluster): string => {
    const cached = nameById.get(c.id);
    if (cached !== undefined) return cached;
    const name = `cluster${nextIndex++}`;
    nameById.set(c.id, name);
    idByName.set(name, c.id);
    return name;
  };
  const handlesFor = (c: DotInputCluster): ClusterHandles => {
    const cached = handlesById.get(c.id);
    if (cached !== undefined) return cached;
    // G7 T7 parent-resolution fix: a child cluster nests inside the
    // PARENT's `innermost` handle (the parent's own deepest active
    // protection wrapper), not its `main` handle — see `ClusterHandles`'s
    // own doc comment.
    const parentInnermost =
      c.parentId !== undefined && byId.has(c.parentId)
        ? handlesFor(byId.get(c.parentId)!).innermost
        : b;
    const outerName = nameFor(c);
    const levels = c.innerMarginLevels;
    // G7 T7: jar's OUTER ancestor-protection pair ("a"/"p0",
    // `ClusterDotString.java:91-116`) wraps `main` from the OUTSIDE, gated
    // by the SAME `innerMarginLevels` value the pre-existing inner "i"/"p1"
    // pair below already uses — jar-verified corpus-wide (307/307 cached
    // DOTs carry "p0" wherever "p1" appears; 93/93 carry "a" wherever "i"
    // appears; zero counterexamples). This holds because `protection0()`
    // and `protection1()` are BOTH unconditionally true for every
    // `titleTableEligible` composite in this port's corpus: `useSwimlanes`
    // is a distinct, unported jar feature (this port's own "swimlane"
    // concept is Activity-diagram-only, unrelated to
    // `ISkinParam.useSwimlanes(DiagramType)`) and `USymbols.NODE` never
    // applies to a state composite — and `thereALinkFromOrToGroup1` is the
    // SAME boolean `needsZaentPoint` already encodes as
    // `innerMarginLevels === 2` (`state-composite-cluster.ts`'s own doc
    // comment). "a" nests OUTSIDE "p0" (jar emits
    // `subgraphClusterNoLabel(sb,"a")` before `subgraphClusterNoLabel(sb,
    // "p0")`, `ClusterDotString.java:98-115`).
    let host = parentInnermost;
    if (levels === 2) host = host.addSubgraph(`${outerName}a`, {});
    if (levels !== undefined) host = host.addSubgraph(`${outerName}p0`, {});
    const hasTitleTable = c.titleTableWidth !== undefined && c.titleTableHeight !== undefined;
    const attrs = !hasTitleTable && c.label !== undefined ? { label: c.label } : {};
    const main = host.addSubgraph(outerName, attrs);
    // G5 C3, mechanism 16 shape half: a jar-real HTML `<TABLE FIXEDSIZE=
    // "TRUE" ...>` label, via graphviz-ts 0.1.26072117's public `setHtmlAttr`
    // (docs/graphviz-issues/07's RESOLVED note) -- ONLY for callers that
    // supply BOTH dims (`titleTableWidth`/`Height`'s own doc comment,
    // graph-layout.types.ts, has the full jar-calibration derivation).
    // Callers that don't (every pre-C3 cluster, and every C3-ineligible
    // one) keep the prior plain-text `label` attr above, unchanged.
    //
    // G8 T1c: jar TRUNCATES both dims towards zero here, it never rounds --
    // `ClusterDotString.java:124`'s `SvekEdge.appendTable(sblabel,
    // cluster.getTitleAndAttributeWidth(), cluster.getTitleAndAttributeHeight()
    // - 5, ...)` feeds `appendTable`'s own `(int)` cast on both dims
    // (`SvekEdge.java:504-507`, the SAME mechanism spec.md G8/T1 §1a already
    // verified for edge labels: `reservedWidth = Math.floor(dimNote.width)`).
    // Verified against 3 independent jar cached-DOT ground-truth values
    // (`test-results/dot-cache/state/{bajelo-54-dixe684,kotagu-43-miza629}`):
    // Run 107.8875->107 (was Math.round->108, a miss), SubComposite
    // 91.875->91 (was round->92, a miss), CompositeState-ee 99.575->99 (not
    // yet wired to this seam, but floor matches there too) -- floor is
    // correct in all 3; round is wrong in 2/3. `titleTableHeight` is already
    // an exact integer in every corpus sample (`computeTitleTableHeight`'s
    // own formula), so `Math.floor` is behavior-preserving there and is
    // applied for mechanism-fidelity (jar floors both dims from the SAME
    // `appendTable` call), not because a height regression was found.
    if (hasTitleTable) {
      main.setHtmlAttr(
        'label',
        `<TABLE FIXEDSIZE="TRUE" WIDTH="${Math.floor(c.titleTableWidth!)}" ` +
          `HEIGHT="${Math.floor(c.titleTableHeight!)}"><TR><TD></TD></TR></TABLE>`,
      );
    }
    // G5 C7, mechanism 16 margin half: mirror jar's ClusterDotString "i"/
    // "p1" protection-wrapper nesting (see DotInputCluster.innerMarginLevels'
    // own doc comment for the full jar-source derivation) -- each extra
    // `subgraph cluster*` level gets graphviz's own default CL_OFFSET(8pt)
    // margin around ITS children, compounding to jar's real 16/24px side
    // margin. Names deliberately do NOT match the oracle comparator's
    // `^cluster\d+$` pattern (tests/oracle/svek-dot.ts#parseClusters skips
    // exactly this "clusterNp0/clusterN/clusterNp1" shape, by design, per
    // that file's own doc comment) -- so this nesting (and the outer "a"/
    // "p0" pair above) is structurally invisible to the DOT-parity gate,
    // same as jar's own protection wrappers.
    let innermost = main;
    if (levels === 2) innermost = innermost.addSubgraph(`${outerName}i`, {});
    if (levels !== undefined) innermost = innermost.addSubgraph(`${outerName}p1`, {});
    // T1b: `ClusterDotString.printRanks` (`Cluster.RANK_SOURCE`/`RANK_SINK`,
    // `ClusterDotString.java:136-137,254-287`) -- a border-point (entry
    // /exit-point) composite's direct port children get a REAL graphviz
    // `{rank=source|sink; <ids>;}` constraint scoped to this cluster's own
    // subgraph, forcing them to the extremal rank WITHIN it. Pre-fix, this
    // field (`DotInputCluster.portRanks`) was wired to the Svek-DOT TEXT
    // emitter only (`svek-dot-emit.ts`, for the DOT-parity oracle) and never
    // reached the REAL graphviz-ts layout call here -- so every border-point
    // composite's rank constraint was silently absent from actual layout.
    // Jar-verified root cause of the pesita-10-dene726 mincross-order defect
    // (G8 T1b): `AA`'s exitpoint child `aa_ok_ex` needs `{rank=sink;
    // aa_ok_ex;}` inside AA's own cluster -- a disposable text-probe
    // ablation (4-way: with/without this block × with/without the sibling
    // "ee" title-wrapper) isolated this constraint alone as necessary AND
    // sufficient to flip the `Idle`/`Reanimate`/`Closing` cycle's mincross
    // order from wrong (`Idle`(138)<`Reanimate`(298)<`Closing`(645)) to
    // jar-exact (`Closing`(273)<`Reanimate`(643)<`Idle`(718)) -- a rank
    // constraint changes the network-simplex rank GRAPH itself, not merely
    // node/edge declaration order (the mechanism G7 T13/T16 already fixed
    // for this same cycle's DFS-root selection). The "ee" WithLabel wrapper
    // + FIXEDSIZE title reservation (`portRanksLabelOnEe`) is a SEPARATE,
    // additive geometry concern (jar-verified to have ZERO effect on this
    // ordering bug in the same ablation) -- deliberately NOT wired here to
    // keep this fix minimal and scoped to the ordering defect; left as a
    // documented residual for a future geometry-focused task.
    //
    // Naming pitfall this fix had to avoid (caught by a dump of the built
    // Graph model, not assumed): graphviz-ts's cluster detection is a bare
    // `name.toLowerCase().startsWith('cluster')` check
    // (graphviz-ts/src/layout/dot/rank.ts) -- an EARLIER attempt named this
    // subgraph `${outerName}rank${pr.rank}` (e.g. "cluster1ranksink"), which
    // ITSELF starts with "cluster" and so was silently promoted to a real
    // nested CLUSTER (wrong: jar's own `{rank=sink;...}` block is a bare,
    // non-cluster anonymous subgraph, `ClusterDotString.java#printRanks`) --
    // reproducing the wrong mincross order despite the constraint being
    // present. `__portrank_N` (a fresh global counter, never
    // "cluster"-prefixed) avoids this entirely.
    // @see ~/git/plantuml/.../svek/ClusterDotString.java#printRanks
    // @see ~/git/plantuml/.../svek/Cluster.java (RANK_SOURCE/RANK_SINK)
    if (c.portRanks !== undefined) {
      for (const pr of c.portRanks) {
        const rankSub = main.addSubgraph(`__portrank_${portRankSubId++}`, { rank: pr.rank });
        for (const id of pr.nodeIds) rankSub.addNode(id);
      }
    }
    const handles: ClusterHandles = { main, innermost };
    handlesById.set(c.id, handles);
    return handles;
    // #lizard forgives -- faithful port of ClusterDotString's full
    // 4-layer protection nesting (a/p0/main/i/p1) plus the RANK_SOURCE/
    // RANK_SINK port-rank constraint; each block is one independently-
    // conditional jar mechanism (ClusterDotString.java:91-201,254-287), not
    // decision complexity to simplify.
  };
  for (const c of clusters) {
    const { main, innermost } = handlesFor(c);
    if (c.innerMarginLevels === undefined) {
      for (const id of c.nodeIds) main.addNode(id);
      continue;
    }
    for (const id of c.nodeIds) {
      (id === c.unwrappedNodeId ? main : innermost).addNode(id);
    }
  }
  return { idByName };
}

export function addEdges(b: GvGraphBuilder, input: DotInputGraph): EdgeIndex {
  const nodeIds = new Set(input.nodes.map((n) => n.id));
  const idQueues = new Map<string, string[]>();
  const inputEdgeById = new Map<string, DotInputEdge>();
  for (const e of input.edges) {
    // Defensive: skip edges to/from unknown nodes (the old engine dropped
    // dangling edges in buildWorkingGraph).
    if (!nodeIds.has(e.from) || !nodeIds.has(e.to)) continue;
    // I9 mechanism (plans/g1-description-svg/ledger.md): callers that draw
    // arrowheads manually (`DotInputGraph.manualArrowheads` — currently only
    // `description`'s SvekEdge/extremity polygons) must tell graphviz-ts the
    // same `arrowhead=none`/`arrowtail=none` the Svek-DOT text emitter
    // already writes for every diagram type, or it defaults to
    // `arrowhead=normal` and reserves an arrow-length gap when clipping the
    // spline to the target node's boundary — shortening the routed edge by
    // ~10-11px versus both real graphviz and the jar's own layout (verified
    // by feeding one fixture's exact node/edge geometry to both `dot -Txdot`
    // and this seam — splines matched only once the attrs below were added).
    // NOT applied unconditionally: `class`/`state`/`dot`/`json` draw their
    // arrowhead via an SVG `marker-end` sitting at the raw spline endpoint
    // and rely on graphviz's default reservation to leave room for it
    // without overlapping the target box (see `DotInputGraph
    // .manualArrowheads`'s own doc comment) — scoped to avoid regressing
    // their already-correct, already-tested output.
    const a = e.attributes;
    const attrs: Record<string, string> = input.manualArrowheads === true || a?.noArrow === true
      ? { arrowtail: 'none', arrowhead: 'none' }
      : {};
    if (a?.weight !== undefined) attrs.weight = a.weight.toString();
    if (a?.minLen !== undefined) attrs.minlen = a.minLen.toString();
    // G8 T2 (spec.md §1a, mirrors `addClusters`' own `hasTitleTable` gate
    // above — that seam is T1c's, unmodified here): a caller that supplies
    // BOTH `labelBoxWidth`/`labelBoxHeight` (currently only the state
    // composite pipeline's own plain, note-free labels,
    // `state-composite-edge-label.ts#edgeLabelAttrs`) gets a REAL
    // jar-faithful `<TABLE FIXEDSIZE="TRUE" WIDTH=".." HEIGHT="..">` label
    // reservation instead of the plain-text `label` attr below — the SAME
    // margin+floor box `state-transition-label.ts#attachTransitionLabel`
    // independently recomputes for the draw anchor (D3's "one mechanism,
    // two consumers" shape). Every other caller (class, component, usecase,
    // the flat state pipeline, a state transition with an attached `note on
    // link`) doesn't set these two fields, so its plain-text path below is
    // byte-for-byte unchanged.
    const hasLabelBox = a?.labelBoxWidth !== undefined && a?.labelBoxHeight !== undefined;
    if (a?.label !== undefined && !hasLabelBox) {
      attrs.label = a.label;
      // Measure with a LUT-known font (graphviz's default "Times,serif" warns).
      attrs.fontname = 'Times';
    }
    // G2/N25: feed the ACTUAL text (not just DOT-gate sizing) into the real
    // layout call so graphviz-ts's own `placeLabels`/`xladjust` (`label/
    // xlabels.ts`, a faithful port of `lib/label/xlabels.c`) computes the
    // same external-label position real graphviz would — see
    // `DotInputEdge.attributes.tailLabel`'s own doc comment for why the
    // angle/distance formula never applies here. `layoutGraph()` extracts
    // the computed position back out via `extractPortLabelPositions` (no
    // public snapshot API exposes it directly — ADR-1 in graphviz-ts hides
    // the internal `Edge` model).
    if (a?.tailLabel !== undefined) {
      attrs.taillabel = a.tailLabel;
      attrs.labelfontname = 'Times';
      attrs.labelfontsize = CARDINALITY_FONT_SIZE.toString();
    }
    if (a?.headLabel !== undefined) {
      attrs.headlabel = a.headLabel;
      attrs.labelfontname = 'Times';
      attrs.labelfontsize = CARDINALITY_FONT_SIZE.toString();
    }
    const edge = b.addEdge(e.from, e.to, attrs);
    if (a?.label !== undefined && hasLabelBox) {
      // T1c precedent (addClusters' own title-table seam, above): jar
      // TRUNCATES both dims towards zero here (`appendTable`'s `(int)`
      // cast, SvekEdge.java:504-507), never rounds -- `labelBoxWidth`/
      // `labelBoxHeight` are already exact integers by construction
      // (`computeReservedLabelBox`'s own `Math.floor`/integer-arithmetic
      // formula), so `Math.floor` here is a defensive no-op matching that
      // convention, not a behavior change.
      edge.setHtmlAttr(
        'label',
        `<TABLE FIXEDSIZE="TRUE" WIDTH="${Math.floor(a.labelBoxWidth!)}" ` +
          `HEIGHT="${Math.floor(a.labelBoxHeight!)}"><TR><TD></TD></TR></TABLE>`,
      );
    }

    const k = edgeKey(e.from, e.to);
    const q = idQueues.get(k) ?? [];
    q.push(e.id);
    idQueues.set(k, q);
    inputEdgeById.set(e.id, e);
  }
  return { idQueues, inputEdgeById };
  // #lizard forgives -- pre-existing (unmodified by G5 C7) faithful mirror
  // of SvekEdge's per-edge attr assembly; each branch below is one
  // independently-conditional DOT attr (label/tailLabel/headLabel/weight/
  // minlen/arrowhead override), not decision complexity to simplify.
}
