# T6i report: port-cluster-title-min-width

Commit 0a832f062 (unsigned). Files: src/diagrams/description/layout-cluster-boxes.ts, src/diagrams/description/layout.ts, tests/unit/description/gtc-t6i-port-cluster-title-width.test.ts (new). Description-only; no core file. No catalog change.
Write-set: census listed layout-cluster-boxes.ts + layout.ts; nothing else touched.

## Render-diff unknown/deroxu-29-gude369
Before 4 structural / 5 numeric. After 4 / 0 (g[19] rect widths and x's are exact).

## Diagnosis
- Mechanism: `Cluster#manageEntryExitPoint` runs `ensureMinWidth(getTitleAndAttributeWidth() + 10)` (Cluster.java:427-428). `getTitleAndAttributeWidth` is the width of ClusterHeader's merged stereo+title block (ClusterHeader.java:79-92) plus `suppWidthBecauseOfShape`, floored at `ceil(MinimumWidth)` (Cluster.java:261-264) -- the number the cluster's own DOT label table prints. `buildPortClusterInfoByAstId` (layout-cluster-boxes.ts:41) measured the RAW display with `measureTitleLabel` instead: one plain-font line, the literal `\n` two characters included (299 vs the jar's 261 unscaled for ent0174).
- Origin (port): layout-cluster-boxes.ts:41 `measureTitleLabel(c.display, ...)`; the DOT side (`clusterTitleDimsById` -> `descriptionClusterTitleTable`, which splits the display lines and uses the bold group font) was already right, so this is post-layout only: layoutEqual/dotEqual unchanged, no `dot -Tdot` needed. Layout hand-off: the port-cluster frontier only reads `titleWidth/titleHeight`.
- Fix: `buildPortClusterInfoByAstId` takes the D5 dims map (`clusterTitleDimsById(ctx, wrapperInputs)` at the layout.ts call site); a group with no label gets 0/0 (`Cluster.java:671-673`).
- Ruled out: DOT table (already D5); `ensureMinWidth` port (FrontierCalculator.ts:193 matches java:154-167); stereotype and `hide` handling (the D5 dims already use the filtered list).

## Reduced oracles (/private/tmp/claude-501/gtc-T6i)
- `two` (two-line `\n` title + port): IDENTICAL after the change; before: cluster x=7 width=273 vs jar x=19.11 width=223, canvas 294 vs 256.
- `st` (`Site\nSvc` + `<<package>>`): IDENTICAL before and after.
- `one` (single-line title, no `\n`): NOT identical before or after, same 5 tokens: cluster rect x ours 11.61 vs jar 15.36 (width 277 both) and the port symbol rects (+3.75). Not caused by this family: the width equals minWidth in both; ours computes core 123.5..385.5 (width 262), initial -16.5..385.5, minWidth 277, so a 7.5 difference in the jar's core width (or its centring) would produce the 3.75. Not diagnosed further (the jar's dot also warns "table size too small for content" for this fixture, so the DOT table/measurer interplay may be involved). Filed as a residual.

## Tests
gtc-t6i-port-cluster-title-width.test.ts, 3 tests (2 fail with the change reverted: cluster/port rects, canvas; the stereotyped case passed before and after). Full `vitest run tests/unit tests/architecture tests/oracle/svg-conformance`: 1285 files collected, 26292 passed, 0 failed (ratchets green). typecheck, eslint, prettier clean.

## Surveys (before -> after; conformant/structural-match/diverged)
component 214/12/40, usecase 67/7/19 (+1 oracle-error), unknown 505/17/303: all unchanged; no movers, no losses (deroxu's numerics were already inside a diverged verdict). No re-pin owed.

## Residuals
- deroxu 4 structural / 0 numeric: the last family T6j multi-stereotype-tie-order: svg/g[1]/g[106]/rect[1..4]/@fill exp=#8FF act=#FF0 (an entity with two stereotypes; first-defined style wins on a tie, StyleStorage.java:49 / Style.java:132 / DarkString.java:55-57). After it deroxu should be conformant and the close ticks 28.
- `one` case above (single-line port cluster title, 3.75 px x offset), not in deroxu; a candidate separate defect in the port frontier core width.
- Nothing traces into dot-engine.
