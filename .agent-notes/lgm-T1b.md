# lgm-T1b (A3) — projection cluster rectangle, mutated in the jar's order, before the clip

## Commits (branch lgm/T1b, off 1627f484e)
- 2425c1526 fix(state): clip composite-anchored edges in the jar's rectangle order
- 5d0b4ce00 fix(description): clip lhead/ltail in the jar's rectangle order
  (description clip site = src/diagrams/description/layout-geo-post.ts#clipEdgePoints; named in that commit message)
- (this note) docs(notes): lgm-T1b report

## Java -> ours
- `SvekEdge.java:660-663` (projectionCluster.manageEntryExitPoint before the clip), `:671-672` (simulateCompound on lhead/ltail.getRectangleArea()) -> `state-transition-clip.ts#clipLinesInSolveOrder`, `description/layout-geo-post.ts#buildEdgeGeos`.
- `Cluster.java:410-436` (manageEntryExitPoint; `:430` REASSIGNS rectangleArea; `:425` seeds FrontierCalculator with the CURRENT rectangle; `:427-428` ensureMinWidth(titleW + 10) when titleW>0 && titleH>0; `:420-421` null child skipped) -> `core/svek/FrontierCalculator.ts#entryExitPointRect` + `ClusterRectangles` (the shared mutable state, `isAdjusted`).
- `ClusterDotString.java:101-105` + `SvekEdge.java:1278-1281` (setProjectionCluster in print order, LAST touched cluster wins) -> `projectionClusterOf`; print order = `acc.borderPointClusters` order (state; recorded in resolveClusterComposite = parent-before-child) / `infoByAstId` key order (description).
- `DotStringFactory.java:465-466` (allLines() loop) -> lines sorted by `creationIndex` (state; `Transition.creationIndex` is `dotData.getLinks()` creation order, per the existing comment in state-composite-pass history `GraphvizImageBuilder.java:229`) / by link index (description).
- `Cluster.java:511-512` setPosition -> `result.clusters` rects are the seed.
- `Cluster.nodes` split (`:413-417`) -> `projectionSpecOf` (description) / `projectionSpecsOf` (state, `cluster.nodeIds` minus ports minus the `__zaent_` anchor, which is not an SvekNode).
- Reachability confirmed: `lhead/ltail` need `endUid.startsWith(CENTER_ID)` (`SvekEdge.java:253-258`), true for any line whose entity is a group; `setProjectionCluster` needs only `isLinkFromOrTo(group)` (`:1270`) and a non-normal member (`ClusterDotString.java:101`). Description reaches the same classes (note-on-group links are lines to a group; 14 projection calls over the component/usecase corpus, none changes a result).

## Mechanism measured (pesita-10-dene726 `AA`, 4 lines touch it)
graphviz rect minX..maxX 562..710 (w 148), title+attr width 116.463 -> ensureMinWidth 126. Successive `manageEntryExitPoint` results (minX): 587, 588.5, 589.25, 589.625 (one per line, clip uses each). The shared rect is NOT idempotent under ensureMinWidth: the box drifts by half the previous drift each call. The clips before this change used the raw box (562..710).
Titled authored fixture: minX 12.52, 24.77, 30.895 across its 3 lines (graphviz -33.98).

## Fixtures (tests/fixtures/lgm-T1b/, jar renders beside, deterministic text) — link-end distance to the jar, before -> after
- state-exitpoint-three-lines 14.821 -> 0 | state-nested 14.258 -> 0 | state-two-port-composites 20.041 -> 0 | state-lr 14.184 -> 0 | state-entrypoint-lines 29.447 -> 0 | state-titled-ensure-min-width: all 7 jar comparisons fail with the mutation disabled, pass with it (3 lines, ensureMinWidth binding).
- pesita-10-dene726: AA lines lnk14 start 26.70 px, lnk16 end 14.04 px -> 0; all 16 links equal. compareSvg 208 diffs / ws 967 -> 186 / 945.
- viroxo-69-fito663: compareSvg 90 / 150 -> 90 / 150 (maxDelta 18.679 -> 11). Remaining diffs are NOT the clip: our DOT differs in member order inside `comp1` (jar: `[*]` circle sh0011, chk sh0012, end circle sh0013, zaent first inside `ee`; ours: chk sh0011, `[*]` sh0012, end sh0013, zaent last inside `i`), so graphviz places chk 2 px and comp2 3 px apart from the jar's before any clip (`rects`: chk x 33 vs 31, comp2 146 vs 149, comp1 w 109 vs 112). Structural DOT parity does not see member order.
- desc-port-cluster-lines (jar render kept): cannot match yet. Our description DOT lacks the `a`/`i` wrapper subgraphs the jar writes for a port cluster that is a link endpoint (`ClusterDotString.java:91-96`; jar `subgraph cluster6a`/`cluster6i`), so layout differs before the clip. Marked `it.fails` in tests/unit/description/lgm-T1b-port-cluster-clip.test.ts (starts passing = remove the marker). Description wiring is unit-tested with hand-built geometry (order, print-order winner, plain container untouched).

## Surveys (all 27 engines, one command each) and gates
- engdiff before/after: movers=12, conformant-losses=0. All 12 are yaml `timeout` -> verdict: the BEFORE run took load ~14 (yaml 12 timeouts), the AFTER run has 0. yaml cannot reach this code (JsonDiagram/Smetana); every non-timeout yaml row is identical. No other engine moved; dotEqual moved nowhere.
- elements before/after (all engines): away=0 toward=0.
- Ratchet movers: none. `npx vitest run tests/oracle tests/unit/state tests/unit/description tests/unit/core tests/architecture` = 494 files, 15868 passed, 8 expected-fail (1 mine).
- typecheck + eslint + prettier clean on every changed file. docs/catalog.md regenerated (`npm run catalog`; generated, drift-gated).

## Exact DIVERGENCES.md text (orchestrator applies)
Replace the whole section `### Composite-anchor transitions: clip-rect family unported for border-point children` (from that heading through its `**Affects:**` paragraph, i.e. DIVERGENCES.md lines 792-~838, up to the `---` before `## Refusal error page`) with:

```
### ~~Composite-anchor transitions: clip-rect family unported for border-point children~~ — RETIRED (lgm-T1b, 2026-10-08)

`SvekEdge.java:660-663` runs `projectionCluster.manageEntryExitPoint` before each line's `simulateCompound` (`:671-672`), and `Cluster.java:430` reassigns the shared `rectangleArea`, so the Nth line through a border-point composite clips against the result of N calls. Ported once in `src/core/svek/FrontierCalculator.ts` (`ClusterRectangles`, `entryExitPointRect`, `projectionClusterOf`) and driven in `allLines()` order by `src/diagrams/state/state-transition-clip.ts#clipLinesInSolveOrder` (state) and `src/diagrams/description/layout-geo-post.ts#buildEdgeGeos` (description). Clipped link ends equal the jar's on `pesita-10-dene726` and six authored fixtures (`tests/fixtures/lgm-T1b/`).
```

## Not done, and why
1. DRAWN box of a titled border-point composite is f^1(raw); the jar draws f^(L+2)(raw), L = lines projecting to it (solve loop) + 2 draw passes (`SvekResult.java:130-136` calculateDimension drawU, then the real drawU; `Cluster.java:344-345` calls manageEntryExitPoint per drawU). Verified exactly: pesita AA after 4 solve calls minX 589.625; draw passes 589.8125, 589.90625; jar draws x 620.906 and ours f^1 is 618 (frame offset 31 => 589.90625 + 31 = 620.90625). Same for the titled fixture (5 calls -> 35.49 vs jar 35.489 after the 7 px frame offset). This is the remaining pesita AA box offset (2.906 px). Needs the clip phase's final `ClusterRectangles` handed to `state-composite-geo.ts#materializeCluster` (today materialize runs BEFORE `buildLevelTransitionGeos` in `layoutComposite`, and 5 other call sites) plus the first-pass/second-pass parent-reads-child ordering `borderPointInkOverflow` models. Changes drawn boxes + canvas => its own mission with a re-pin. Owner: state geo (A3b).
2. viroxo residual: DOT member order inside a cluster (above). Owner: state DOT emission (`state-composite-cluster.ts` member order + zaent placement `ee` vs `i`), moves dotEqual-invisible layout.
3. Description jar equality: `a`/`i` wrapper subgraphs missing for description port clusters that are link endpoints. Owner: `src/core/graph-layout-build-portcluster.ts` / `description/layout-dot-tree.ts#buildDotClusters`; moves DOT => a DOT-parity mission.
4. Description port-cluster inputs reach `buildEdgeGeos` via a `WeakMap` keyed by the geo (`frontier-cluster-bbox.ts#registerPortCluster`) because `EdgeMapping` is built in `description/layout.ts` (not in this write-set). Cleaner: one field on `EdgeMapping` set from `portClusterCtx` at layout.ts:~284; then delete the WeakMap.
5. Same one-call frontier + raw clip remains in the class engine (`class/class-geo-builders-port.ts#portFrontierBox`, `class/class-edge-geo.ts` lhead/ltail) and in `state-composite-geo.ts#borderPointBox` (own frontier+ensureMinWidth pair; the pure pair now exists as core `entryExitPointRect`). Not in the write-set / not clip.
6. State clips for a composite WITHOUT a `__zaent_` anchor in `nodeIds` (fontSize != 14, `titleTableEligible` false) are unchanged (no clip, as before).

## Observations
## Observation: the shared cluster rectangle is not idempotent under ensureMinWidth
- **Context**: porting `Cluster.manageEntryExitPoint` call order.
- **Finding**: each call seeds `FrontierCalculator` with the previous result; the untouched sides come from that seed and `ensureMinWidth`'s shift depends on `initial.minX`, so a titled box walks right by half the previous step per call (587, 588.5, 589.25, 589.625, ...). N lines + 2 draw passes is the jar's drawn box.
- **Impact**: any "adjusted rect" computed once (state `borderPointBox`, description `computePortClusterBbox`, class `portFrontierBox`) is the 1-call case only.
- **Confidence**: High (pesita AA 620.90625 and titled fixture reproduced to 3 dp).

## Observation: structural DOT parity does not see member order
- **Context**: viroxo/state fixtures with `[*]` inside a port composite.
- **Finding**: `compareStructural` reports equal while node declaration order inside `cluster6i` and the zaent position differ from the jar; graphviz lays out differently.
- **Impact**: authored state fixtures must avoid top-level `[*]` and wrapper composites to be jar-comparable; use named states.
- **Confidence**: High.

## Observation: no state `[*]`-free ordering gap for named states
- **Context**: authoring fixtures.
- **Finding**: copies of pesita's `AA`/`Idle`/`Closing` shape (no `[*]`, no wrapper) lay out identically to the jar; every authored fixture passes with zero mismatch.
- **Impact**: reuse that shape for future state clip fixtures.
- **Confidence**: High.
