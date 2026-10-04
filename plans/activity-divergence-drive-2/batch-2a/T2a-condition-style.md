# T2a — ConditionStyle, ConditionEndStyle hline, nested assembly order

Agent: typescript-pro, worktree `add2-T2a`. Depends on T1b (b1 close).

## Context
add1 rows 42/44 (`plans/activity-divergence-drive/decision-journal.md`):
`skinparam ConditionStyle InsideDiamond` selects `FtileDiamondSquare`
(`svek/ConditionStyle.java:41-64`, `skin/SkinParam.java:997-1004`,
`ConditionalBuilder.getShape1` `:251-277`; `Hexagon.asPolygonSquare` unclosed,
own size formula, east label +5 y `FtileDiamondSquare.java:104`) — carapo,
novata, perate. `ConditionEndStyle hline`: `ConditionalBuilder.getShape2`
(`:287-288`) returns `FtileEmpty`; the branches join by a plain line, no merge
diamond (`FtileIfDown.java:147-150`) — saxeku. fivama: nested `FtileAssemblySimple`
order (`InstructionList.java:140-160`) vs our flat top-down children when the
else-branch is a nested if.

## Task
For each row: `--dump`/`--align`, read the Java (quote file:line), port at the origin, apply to every fixture the mechanism governs, pin with a test. Measure the full corpus before/after (probe + elements).

## Write-set
`src/diagrams/activity/layout/{conditional-builder,walk-if-down}.ts`, `src/diagrams/activity/tiles/gtile-diamond*.ts` (+ a new square tile), `src/diagrams/activity/activity-renderer-if-shapes.ts`. `SkinParam.getConditionStyle`/`getConditionEndStyle` (`SkinParam.java:997-1011`) read a RAW skinparam value: read it through the raw skinparam map the activity pipeline already receives (find it — `preprocessed.skinparam` reaches the theme builder); core handler/theme files are T2c's, so if a core field is unavoidable, re-slot.

## Acceptance
- Given each named row, then the diffs from this mechanism go to 0 (or the row is re-slotted with mechanism + owning file).
- Given the full corpus, then 0 unexplained risers.
- Given the pinned goldens and harness-parity test, then green.

## Rules
Worktree only (`measurements/mkwt.sh T2a`); NO Serena MCP tools, no `git stash`,
scratch files named with `T2a`; never write `oracle/**` JSON (repin dry-run only);
67+ pinned goldens byte-equal (stop and report otherwise); every riser shown from
the diff; every number carries an upstream `file:line`; anything outside the
write-set is re-slotted, never forced. Quality bar: targeted vitest + the
activity golden/diff-baseline/harness-parity tests + typecheck + eslint; files
≤ 500 lines, functions ≤ 30 NLOC / CCN ≤ 10. One commit per mechanism.
Observability: N/A (gated measurements only). Rollback: Reversible.
