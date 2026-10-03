# T2e — the 38 parse error rows (D6)

Agent: typescript-pro, worktree `add2-T2e`. Depends on T1b (b1 close).

## Context
At the b1 close 34 rows remain `error` (the 4 `end merge` rows were fixed by
T1p-c); `oracle/goldens/svg-activity/diff-baseline.json` lists them. dulate-94-
bupu593 refuses on `(additional text) elseif` (its pragma line is commented out).
`decisions.md#D6`. All 38 refuse with the same generic message; the failing
lines vary (lane switch `|laneTwo|`, `fork again`, `kill`, `note left: …`,
`'=== … ===` comments, multi-line actions, `while (foo)`, `else`, `end`…; planning
list in `measurements/plan-errors.txt`). Per row: find the failing line, the
Java `Command*3` that accepts it (quote its regex), port the grammar — no
lenient fallthrough. Report each row's state (renders / still refused + why).

## Task
For each row: `--dump`/`--align`, read the Java (quote file:line), port at the origin, apply to every fixture the mechanism governs, pin with a test. Measure the full corpus before/after (probe + elements).

## Write-set
`src/diagrams/activity/{parser,node-dispatch,dispatch-support,dispatch-common-commands,if-dispatch,group-dispatch,parallel-dispatch,switch-dispatch,list-backward-dispatch}.ts`, `src/diagrams/activity/ast.ts` (new AST fields only), their tests. A construct that parses but needs new layout/render code outside this set: re-slot it with the mechanism.

## Acceptance
- Given each named row, then the diffs from this mechanism go to 0 (or the row is re-slotted with mechanism + owning file).
- Given the full corpus, then 0 unexplained risers.
- Given the pinned goldens and harness-parity test, then green.

## Rules
Worktree only (`measurements/mkwt.sh T2e`); NO Serena MCP tools, no `git stash`,
scratch files named with `T2e`; never write `oracle/**` JSON (repin dry-run only);
67+ pinned goldens byte-equal (stop and report otherwise); every riser shown from
the diff; every number carries an upstream `file:line`; anything outside the
write-set is re-slotted, never forced. Quality bar: targeted vitest + the
activity golden/diff-baseline/harness-parity tests + typecheck + eslint; files
≤ 500 lines, functions ≤ 30 NLOC / CCN ≤ 10. One commit per mechanism.
Observability: N/A (gated measurements only). Rollback: Reversible.
