# T1d — A3 remainder: draw the border-point composite at the mutated rect

**Agent:** typescript-pro (sonnet, high). Added by the orchestrator after T1b
(journal row 11). Worktree `measurements/mkwt.sh T1d`.

## Why (T1b's finding — re-verify)
`Cluster.java:430` reassigns the shared `rectangleArea` on every
`manageEntryExitPoint` call. The jar draws the composite from the rect after
L solve-loop calls + 2 draw passes (`SvekResult.java:130-136`,
`Cluster.java:344-345`); ours materializes it after 1 call. pesita-10-dene726
`AA`: minX 587 → 588.5 → 589.25 → 589.625 (4 lines) → 589.8125 → 589.90625;
jar x = 589.90625 + 31 = 620.906, ours 618. `state-composite-geo.ts#materializeCluster`
runs before `buildLevelTransitionGeos` (5 call sites).

## Write-set
`src/diagrams/state/state-composite-geo.ts`, `state-composite-pass.ts`,
`state-composite-pass-types.ts`, `state-composite-transition-geo.ts`,
`state-composite-cluster.ts` (512 lines — no net growth; split if you must add),
`state-composite-frontier.ts`, `src/core/svek/FrontierCalculator.ts`,
`src/core/svek/Cluster.ts`, `tests/fixtures/lgm-T1d/`, its tests.
Forbidden (T1c running): `src/diagrams/state/{layout,renderer,index,layout-ink-extent,state-geo-types}.ts`,
`src/diagrams/description/**`, `src/core/document-margin.ts`, `src/index.ts`,
`src/core/annotations/**`, harnesses.

## Exit
pesita `AA` and every T1b titled fixture draw the composite box where the jar
does; clipped endpoints unchanged (T1b's tests stay green); 0 conformant losses;
pinned rows that fall listed for re-pin. Also replace `state-composite-geo.ts#borderPointBox`'s
private frontier+ensureMinWidth with core `entryExitPointRect` if the Java is the same call.
