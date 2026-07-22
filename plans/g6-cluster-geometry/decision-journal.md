# G6 Decision Journal

| Date | Task | Decision | Rationale | Flagged for review? |
|------|------|----------|-----------|---------------------|
| 2026-07-21 | Batch 1 | Execution plan: T1 (debugger, sync) → T2 (typescript-pro), strictly sequential; no parallelism (T2's write-set is conditional on T1's verdict per D1). Branch `feat/g6-cluster-geometry` created off main. | Batch has a hard T1→T2 dependency; nothing to parallelize. | No |
| 2026-07-21 | T1 | Fixture-location note: the 6 named cluster fixtures live under `tests/corpus/class/` (corpus classifier), while their goldens are `oracle/goldens/state/`. Passed to agents to avoid re-discovery. | Corpus classification diverges from golden layout; costs agents time otherwise. | No |

## T1 mechanism artifact (2026-07-21, debugger agent, CONFIRMED)

- **mechanism**: The seam emits the cluster HTML title table with `HEIGHT="3"` (`CLUSTER_TITLE_TABLE_HEIGHT = 3`) into graphviz-ts layout via `DotInputCluster.titleTableHeight`; jar's real DOT emission uses `HEIGHT="9"` — a verified constant, content-independent across 70+ cached svek-*.dot samples. graphviz-ts's cluster-label border formula (`border[TOP_IX] = label.dimen.y + 2*GAP`, GAP=4 — graph-label.ts:113, faithful port of `lib/common/input.c:885-892`) is fed dimen.y=3 instead of 9, so the TOP-only cluster margin (`position.c:714`, `ht2 += GD_border[TOP_IX].y`) is short by exactly 6pt per titleTableEligible cluster, compounding by nesting depth (6 × (1 + titleTableEligible descendants on direct chain)).
- **origin**: `src/diagrams/state/state-composite-cluster.ts:96` (`CLUSTER_TITLE_TABLE_HEIGHT = 3`), consumed at :316 and `src/core/graph-layout-build.ts:174-178`.
- **fixLocation**: `seam`
- **formula**: `CLUSTER_TITLE_TABLE_HEIGHT` 3 → 9. Pure DOT-layout-input correction; independent of `CLUSTER_HEADER_HEIGHT = 19` (renderer-side, unrelated, no change).
- **ruledOut** (evidence in T1 run, agent af020abad7fd2ec1d):
  1. graphviz-ts layout/rank-sep diverging from C — REFUTED: feeding jar's literal svek-N.dot reproduces real dot 15.1.0 byte-for-byte (gojuja A: 85 both).
  2. jar adding vertical margin outside graphviz layout — REFUTED: real dot on cached svek-N.dot alone reproduces jar oracle heights (85/181/240/99).
  3. position.c:780 cluster-sep hypothesis (the prior suspect) — REFUTED as primary cause: minimal no-label repro gives identical symmetric 24pt margins in both engines.
  4. builder-API HTML mishandling — REFUTED: doGraphLabel correctly measures what it is given; the input value was wrong.
  5. cakaxu's residual: separate edge-label internal-rank-spacing divergence (graphviz-ts 1.5pt more than dot for one labeled edge) — DIFFERENT mechanism, NOT part of this fix; expect cakaxu at −1.5 after fix.
  6. Nested-cluster margin composition (kideju-07-gero206 B/A residuals 48/96 after fix) — separate, additive, confirmed still present, OUT OF SCOPE here.
- **coverage** (predicted → verified by monkey-patch replay): gojuja A 79→85 (jar 85, resid 0); fevida example 175→181 (jar 181, resid 0); cakaxu AbstractState 235.5→241.5 (jar 240, resid −1.5, mechanism 5); decede E →99 (jar 99, resid 0; prior svg/@height gap-1 was sibling A which never reaches the titleTable path); zaloga/zumuje comp2 raw +6 verified at graphviz-ts layer (full pipeline blocked by separate class="entity"-routing gap — Batch 2/D3 territory); kideju C/B/A deltas +6/+12/+18 exact per compounding rule, C resid 0, B/A retain separate mechanism-6 residual.

| 2026-07-21 | T1 | Verdict: fixLocation=seam, one-line constant fix. Note: this does not conflict with D2 — HEIGHT="9" is jar's actual DOT emission (not a recalibration); D2's Batch-3 formula work concerns the multi-line/action-text title-table cases and remains open. | Jar emission is the spec; matching it is faithful porting. | No |
