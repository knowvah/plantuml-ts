# T8 report (state composite title Y from clusters[].label, D3)
Commit: 01aa71430 on gtc/S "fix(state): read the composite title Y from the cluster label". Files: src/diagrams/state/{state-composite-geo.ts,state-composite-cluster.ts,state-geo-types.ts,state-composite-pass-types.ts}; tests/unit/state/state-composite-title-margin.test.ts (new); docs/catalog.md (npm run catalog; new export clusterTitleBaselineMargin; outside write-set but generated + drift-gated).

## Java quoted
- DotStringFactory.java:436-439 + Cluster.java:274-276: `cluster.setTitlePosition(SvekUtils.getMinXY(pointsTitle))` -> `this.xyTitle = pos`.
- Cluster.java:496-498 (drawUState): `clusterHeader.getTitleHorizontalAlignment().draw(ug.apply(new UTranslate(rectangleArea.getMinX(), xyTitle.getY())), clusterHeader.getTitle(), IEntityImage.MARGIN, 0, rectangleArea.getWidth())`. HorizontalAlignment.java:79-88 `draw` adds only (xpadding or centring, ypadding): ypadding is 0, so drawUState adds NOTHING in Y after xyTitle.getY(): the title block TOP = label min Y; baseline = top + first-line ascent (the renderer's existing `node.y + margin + textAscent`).
- Null xyTitle: Cluster.java:497 dereferences `xyTitle.getY()` with no guard; only the border-point path (Cluster.java:435, `minY + IEntityImage.MARGIN`) sets it otherwise (DotStringFactory.java:441-442 `continue`s when title size is 0). So there is no upstream fallback value (a NullPointerException); ours returns undefined and the renderer's existing default (MARGIN) applies.

## Mechanism / change
- Before: spec.titleBaselineMargin = CLUSTER_TITLE_BASELINE_MARGIN (4) for plain composites (state-composite-cluster.ts:471) fed node.clusterTitleBaselineMargin.
- After: plain family: `clusterTitleBaselineMargin(real) = real.label.y - real.label.height/2 - real.y` (state-composite-geo.ts, new, exported), applied in materializeCluster via titleMarginField. The label survives the trip unchanged: graph-layout.ts mapClusters copies c.label, svekCluster/svekClusterTitle publishes it, DotLayoutResult.clusters[].label reaches materializeCluster as `real.label` (no carry-through code needed). Border-point family keeps BORDER_POINT_TITLE_BASELINE_MARGIN (Cluster.java:435). CLUSTER_TITLE_BASELINE_MARGIN constant removed; no remaining reference outside a historical doc comment in tests/unit/state/composite-title-baseline.test.ts:9.
- Observed value: decede-10-buvu414 cluster E: real y 16.5, label centre y 25, height 9 -> margin 4; the derived value equals the old constant on every fixture (title table height 9 + y-4 geometry), so output is byte-identical.
- Swimlane drawSwinLinesState x path and class/description packages untouched.

## Surveys / census (before -> after)
State survey: conformant 99 -> 99, structural-match 14 -> 14, diverged 160 -> 160, errored 0. Zero verdict or maxDelta changes on any of the 273 rows.
State census (273 rows): zero rows changed (every slug's diffCount/bucket identical); no row rose, none moved toward or away from the jar. Per-row change list: empty.
Files: /private/tmp/claude-501/gtc-T8/state-{before,after}.json, state-census-{before,after}.json. Tick per D3: zero conformant losses, zero census rises -> OK.

## Tests
`vitest run tests/unit/state tests/architecture tests/oracle/svg-conformance`: 132 files collected, all pass after `npm run catalog` (first run: catalog drift test failed, fixed); 7904 tests, 1 skipped; state.golden ratchet included and green. New test: 4 tests (3 unit on clusterTitleBaselineMargin incl. absent label and a non-4 case proving it reads the rect; 1 integration, decede-10-buvu414 E baseline 38.389). typecheck, eslint, prettier clean. Red-before: the new import did not exist; the unit cases fail on the old constant for the margin-7 case.
No out-of-write-set test pinned a closed residual. No write-set extensions other than the generated docs/catalog.md.

## Notes
Because no row moves, the value of T8 is structural (derivation mirrors solve); any future fixture whose title table height differs from 9 (multi-line / attribute titles) will now follow graphviz instead of the constant. No such fixture exists in the 273 state rows.
