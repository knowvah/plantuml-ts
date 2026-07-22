# Cluster-scoped {rank=source|sink} subgraph: bbox effect unresolved (contradictory repros)

**Status: INVESTIGATION REQUESTED — not a verified finding.** Two
independent probe sessions ran what should be the same minimal repro
against graphviz-ts's programmatic builder and got contradictory
results (details below). Filed by maintainer direction (2026-07-22) so
graphviz-ts can investigate, despite failing this tracker's normal
"verified" bar; do not treat either claimed behavior as established.

**Impact:** blocks the entire PlantUML entrypoint/exitpoint border-point
family (~20 state fixtures, incl. `pesita-10-dene726`,
`bitaxo-18-tamo974`, `kotagu-43-miza629`) from real cluster geometry.
Jar's DOT for these clusters puts each border-point node in an
anonymous `{rank=source;...}` / `{rank=sink;...}` subgraph that is a
direct child of the cluster (sibling of the `${id}ee` inner subgraph),
forcing the port node to the cluster's topmost/bottommost rank. Until
graphviz-ts's behavior for this shape is pinned down, plantuml-ts
cannot thread its (already-computed) `DotInputCluster.portRanks` into
the real-layout builder, and the family's clusters collapse (e.g.
pesita's `AA` renders 36×36 vs jar's 126×104.72).

## The question for graphviz-ts

For a rank subgraph nested INSIDE a cluster (built programmatically:
`clusterHandle.addSubgraph(name, {rank: 'source'})` + `.addNode(id)`,
with the same id also added to the cluster itself), what exactly
happens to (a) the ranked node's position and (b) the cluster's
reported bbox in `getLayout().clusters` — and does it match real
`dot` on the equivalent DOT text?

What the two sessions AGREED on (root-level placement — likely
correct already, listed for contrast): building the rank subgraph on
the ROOT builder while the node is also a cluster member prints
`Warning: <id> was already in a rankset, deleted from cluster <name>`
(`markClusterNode`, the `dotgen/rank.c` cluster/rankset conflict rule)
and the cluster bbox excludes the node.

Where they CONTRADICT (cluster-nested placement, the jar-shaped case):

- Session A (G6 T8-R2): no warning; node's rank honored; cluster bbox
  grew to include the rank-forced position (repro height
  68.72 → 108.72).
- Session B (G6 T9-retry): same described builder calls — node Y
  **unchanged** (no rank-based repositioning observed), cluster width
  grew by the rank subgraph's own CL_OFFSET margin only. Adding or
  removing unrelated top-level sibling nodes did not change this.

At least one repro is wrong, or an unnoticed variable (builder call
order, subgraph naming, node-added-to-cluster-before-vs-after-subgraph,
version) separates them. Real `dot` on jar's literal cached DOT
produces the jar-matching narrow/tall layout, so the DOT semantics
themselves are known-good ground truth.

## Repro DOT (jar-shaped, minimal)

Distilled from `test-results/dot-cache/state/pesita-10-dene726/svek-3.dot`
(cluster15/AA region) — one border-point rect on `rank=sink`, one point
anchor inside the `ee` inner subgraph:

```dot
digraph unix {
nodesep=0.486111;
ranksep=0.833333;
remincross=true;
searchsize=500;
subgraph cluster15 {style=solid;color="#000015";labeljust="c";label=<<TABLE BGCOLOR="#000016" FIXEDSIZE="TRUE" WIDTH="40" HEIGHT="9"><TR><TD></TD></TR></TABLE>>;
{rank=sink;sh0019;}
sh0019 [shape=rect,label="",width=0.693576,height=0.666667];
subgraph cluster15ee {label="";
zaent0002 [shape=point,width=.01,label=""];
}}
sh0020 [shape=rect,label="",width=0.693576,height=0.666667];
zaent0002->sh0020[arrowtail=none,arrowhead=none,minlen=1];
}
```

## Procedure

1. Ground truth: run the repro through real `dot -Tsvg` (15.x) and
   through graphviz-ts's DOT-text parser (`renderSvg(dotSource)`).
   Record `cluster15`'s bbox and `sh0019`'s y. (G6 T8-R1 found the
   text-parser path byte-matches real dot on jar's full cached DOT —
   expected to agree here.)
2. Builder path: reconstruct the same graph via the programmatic API —
   root graph attrs as above; `const c = builder.addSubgraph('cluster15',
   {style, color, labeljust})` + HTML label via `setHtmlAttr`;
   `c.addSubgraph('cluster15rank_sink', {rank:'sink'}).addNode('sh0019')`;
   `c.addNode('sh0019')` (shape/width/height as above);
   `c.addSubgraph('cluster15ee', {label:''}).addNode('zaent0002')`
   (point); root-level `sh0020` + edge. Compare `getLayout()`'s
   cluster bbox and node positions against step 1.
3. Toggle the variables the two sessions may have differed on: order
   of `addNode` vs `addSubgraph` calls, rank-subgraph name, node
   declared on the cluster handle vs only inside the rank subgraph.
   Identify which variant reproduces which session's result.
4. If the builder path cannot be made to match step 1's ground truth
   under any call order, that is the library defect: cluster-scoped
   rank subgraphs mis-integrate with cluster bbox computation
   (`csRanksetKind`/`csProcessRankset` → cluster bbox path).

Success criterion for closing: the builder-constructed graph's
`getLayout()` cluster bbox matches real dot on the repro (sh0019
forced to the cluster's bottom rank, bbox includes it), and
plantuml-ts's border-point fixtures re-measure to T8's FrontierCalculator
predictions (pesita `AA` 126×104.72, kotagu `CompositeState` 289×358,
bitaxo `C` 42×~101.4).

## Evidence trail

- `plans/g6-cluster-geometry/batch-4/withlabel-derivation.md` — Round 2
  `rankSpec` section (Session A's repro claim + `csRanksetKind`/
  `markClusterNode` code references) and Round 1 §3b/§4
  (FrontierCalculator predictions).
- `plans/g6-cluster-geometry/decision-journal.md` — 2026-07-22 rows:
  T9-retry permanent stop, measured misses with both mechanisms wired
  (pesita 83×124.36 vs 126×104.72; kotagu 237×365 vs 289×358; bitaxo
  75×33.36 vs 42×101.36), and Session B's contradicting repro note.
- Unwired-but-tested FrontierCalculator port ready to consume a fixed
  layout: `src/diagrams/state/state-composite-frontier.ts` (commit
  60fe88a).
