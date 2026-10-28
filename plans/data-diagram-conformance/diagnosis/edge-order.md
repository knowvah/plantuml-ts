# T1a diagnosis — json/yaml edge emission order (D2)

Written before any source edit (diagnosis mode). Measured 2026-10-28 on
`ddc/T1a` off `4f4822ee5`, `DeterministicMeasurer`, through
`renderFixtureJson` (the gate's path).

## Mechanism
The jar builds — and draws — its edge list in **post-order**: inside
`SmetanaForJson#manageOneNode` the recursive call for a child
(`SmetanaForJson.java:139`) returns before that child's own edge is created
(`:140`, `createEdge` → `agedge` at `:218`) and appended (`:141`); `drawMe`
draws every node first (`:166-168`), then every edge in list order
(`:172-176`). This port emits one edge per non-root `FlatNode` in `walkTree`'s
**pre-order** (`buildJsonDotEdges`, `src/diagrams/json/layout.ts:319-342`,
iterating the list `walkTree` returns at `src/diagrams/json/json-layout-prep.ts:73-100`),
so a parent→child edge is emitted before the edges of the child's own subtree.

## Origin
`src/diagrams/json/layout.ts:321` — `return flatNodes.filter(...).map(...)`:
the edge sequence is the pre-order node sequence, where upstream's is the
post-order completion sequence (`SmetanaForJson.java:139-141`).

## Causal chain
1. `layoutJson` (`layout.ts:436`) hands `buildJsonDotEdges(flatNodes, measured)`
   to the engine as `dotInput.edges`, in pre-order.
2. The engine returns `dotResult.edges` in that same order (measured below:
   identical id sequence on all 18 rows); `buildJsonEdgeGeometries`
   (`layout.ts:393-402`) maps them 1:1, order kept.
3. `renderJson` draws `geo.edges` in array order with no sort
   (`src/diagrams/json/renderer.ts:443-445`); each edge is a curve `<path>`
   plus an arrowhead `<path>`, so edge k occupies `path[2k+1]`/`path[2k+2]`.
4. The jar's edge k is the k-th POST-order edge, so the same edge sits at a
   different `path[]` index. `compareSvg` pairs paths by index, so the pair
   compares two different edges; whenever their bezier segment counts differ
   the `@d` diff carries no numeric `delta`, and the survey calls the row
   `diverged` (the gate's `isPositionalDiff` drops `@d`, so `--structural`
   prints 0 for these rows today).

Instrumented (scratch `trace-edges.mts`: observer-captured `dotInput.edges`
vs `layoutGraph(..., {read:'exact'}).edges` vs a post-order recursion over the
same tree; our curve paths matched to the jar's by rounded start point):

- `json/tivuru-65-vezu313` (root → `options[]` → 4 objects):
  ours `n0->n1 | n1->n5 | n1->n4 | n1->n3 | n1->n2`; jar post-order
  `n1->n5 | n1->n4 | n1->n3 | n1->n2 | n0->n1`. Ours `path[1]` (99,82, the
  root edge) = jar `path[9]`; ours `path[3,5,7,9]` = jar `path[1,3,5,7]`.
  The task's symptom (ours `path[9]` = jar `path[7]`) is this shift.
- `yaml/poxedu-72-bite327` (3 levels): ours
  `n0->n3 | n0->n2 | n2->n4 | n0->n1 | n1->n5`; jar post-order
  `n0->n3 | n2->n4 | n0->n2 | n1->n5 | n0->n1`. Ours `path[1,3,5,7,9]` = jar
  `path[1,5,3,9,7]` — exactly the post-order permutation.

## Ruled out
- **dot-engine reordering edges.** `layoutGraph` output id sequence equals
  the input sequence on all 16 rows plus `json/bidire-98-kege137` and
  `yaml/coxima-79-gano159` (`enginePreserves=true` × 18). The reorder is
  entirely port-controlled — hypothesis CONFIRMED, not refuted.
- **`JsonCurve` / spot geometry.** Counterfactual (scratch
  `counterfactual.mts`): same layout, `geo.edges` permuted into post-order
  before `renderJson`, survey re-counted. 15 of 16 rows go to 0 survey diffs
  (the `d` strings' segment shapes match once re-indexed); the raw count
  remains as numeric positional residue only.
- **Node order.** Jar nodes are pre-order (`nodes.add` at `:133` precedes the
  child loop at `:136`); ours are `walkTree`'s pre-order. Every pre-fix
  survey diff on the 16 rows (137 total) is `svg/g[]/path[]/@d`; none is on a
  node element.
- **Render-time sort.** `renderer.ts:443` iterates `geo.edges` as given.

## Before (survey = diffs with no numeric delta; raw = all)
| row | survey | raw | post-order counterfactual survey |
|---|---|---|---|
| json/bogiku-88-nano204 | 7 | 502 | 0 |
| json/civofu-04-loku952 | 9 | 1665 | 0 |
| json/devime-19-toze896 | 8 | 1617 | 0 |
| json/gejena-99-veme626 | 4 | 490 | 0 |
| json/gibego-39-pelu609 | 4 | 496 | 0 |
| json/kidoki-70-fala224 | 2 | 1073 | 0 |
| json/mudumo-73-foli040 | 2 | 329 | 0 |
| json/nofuvo-36-muxe040 | 4 | 751 | 0 |
| json/nopoku-31-cisi925 | 4 | 1263 | 0 |
| json/tivuru-65-vezu313 | 2 | 137 | 0 |
| json/zasitu-09-lise302 | 7 | 503 | 0 |
| json/zevaka-35-zova441 | 2 | 326 | 0 |
| yaml/bafemu-96-luji978 | 8 | 1834 | **1** |
| yaml/jozapu-14-datu953 | 70 | 3207 | 0 |
| yaml/poxedu-72-bite327 | 2 | 192 | 0 |
| yaml/xubife-72-runi076 | 2 | 206 | 0 |
| json/bidire-98-kege137 | 0 | 0 | 0 |
| yaml/coxima-79-gano159 | 0 | 0 | 0 |

## Separate family (not fixed here): spline piece count
`yaml/bafemu-96-luji978` keeps one survey diff after re-indexing,
`svg/g[1]/path[57]/@d` — the SAME edge on both sides (start ≈(861–863,
950–1035), end ≈(1385–1387, 1098–1108)), but the jar's spline has three
cubic pieces, the first a sub-pixel stub (`C873.189,958.737 873.345,958.869
873.5,959`), where ours has two. That is the engine's routing output
(Smetana vs `@knowvah/dot-engine`), not an ordering effect — a geometry
residue on a Smetana path that the survey's no-delta rule happens to flag.
Note: the fix also reorders the engine's INPUT (mirroring `agedge` at
`:140`), which may move layout; the post-fix measurement is authoritative.

## After the fix (`buildJsonDotEdges` post-order)
Every row's post-fix survey AND raw count equals the counterfactual column
above exactly (e.g. tivuru 0/132, bafemu 1/1905, jozapu 0/3541): reordering
the engine's input did not move any layout on these 18 rows, and
`layoutGraph` still returns edges in input (now post-order) order on all 18.
`json/bidire-98-kege137` and `yaml/coxima-79-gano159` stay raw 0.
