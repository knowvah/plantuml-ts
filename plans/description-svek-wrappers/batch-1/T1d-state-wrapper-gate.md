# T1d — state composite wrappers at any font size; gopudo title width

Added 2026-10-14 by user ruling (journal row 14) after T1b raised stop 5.

Prepend [../task-preamble.md](../task-preamble.md). The task-preamble's "Do not edit those core files"
still applies; this task edits **state** files, not core.

## Task
T1b's tightened `dotEqual` (`clusterNestingOk`, commit b358ca18f on `dsw/T1b`) flips two pinned rows
of `tests/oracle/state-dot-parity.test.ts`. Make both match the jar again **by fixing the state port**.
Do not loosen the check.

1. **niveno-60-tiro789** (`skin debug`, font size ≠ 14): the jar has `cluster<N>p0 > cluster<N>`
   (104×38 TABLE) `> cluster<N>p1`. Ours has no wrappers, because
   `titleTableEligible = ctx.theme.fontSize === 14` (`src/diagrams/state/state-composite-cluster.ts:389`)
   drops `titleTable*` and `innerMarginLevels`. The jar has no font-size condition
   (`ClusterDotString.java:107-125,299-314`). Remove the gate at its origin. Read the comment block at
   `:370-389` and the history it cites, and quote the Java that makes the gate unnecessary.
   Then re-measure every state row whose font size is not 14.
2. **gopudo-91-bego999**: the wrapper chains are equal, but the title TABLE is 38×28 ours vs 40×28 jar
   (`A : * a list`, an attribute with a creole bullet). Diagnose first, per `~/.claude/rules/diagnosis.md`.
   Produce mechanism, origin `file:line`, causal chain and ruled-out, with the Java quoted
   (`ClusterHeader.java`, the attribute/bullet text block). Fix it only if the origin is in a state
   file or a description-free creole/measure file that no other dsw task owns. Otherwise stop and
   report the artifact (stop 1).

## Worktree base
`dsw/T1d` is branched off **`dsw/T1b`**, not the mission branch, so the tightened check is live.
It merges together with T1b at the batch 2 close.

## Write-set
- `src/diagrams/state/state-composite-cluster.ts`
- other `src/diagrams/state/**` files, only where the stated mechanism lives (journal each)
- `tests/unit/state/**` (new or updated tests; pin values from the jar DOT)
- `oracle/goldens/svg-state/**`, `tests/oracle/svg-conformance/parity-state.json`, census/diff-baseline
  state pins: **only** to tighten a pin that moved TOWARD the jar. Report every one. A pin that would
  rise or a conformant row that would be lost is stop 4: report it, do not edit.

## Read-set
- `src/diagrams/state/state-composite-cluster.ts:300-440`
- `src/core/svek-dot-wrappers.ts`, `src/core/graph-layout-cluster.types.ts:60-170` (read-only; stop 7)
- `src/core/cluster-title-table.ts` (`computeTitleTableHeight`, `titleAndAttributeWidth` if it lives there)
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ClusterDotString.java:85-204,299-314`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ClusterHeader.java` (whole)
- `test-results/dot-cache/state/{niveno-60-tiro789,gopudo-91-bego999}/{in.puml,svek-1.dot,in.svg}`
- `tests/oracle/state-dot-parity.test.ts`, `tests/oracle/svek-dot.ts` (T1b's `clusterNestingOk`)

## Acceptance
- Given `npx vitest run --maxWorkers=4 tests/oracle/state-dot-parity.test.ts`, then it is green, with niveno
  and gopudo included, and the collected count is reported.
- Given the state survey (`npm run -s svg:survey -- state --out <scratch>/parity-state.json`), compared with
  `plans/description-svek-wrappers/measurements/b0-eng/parity-state.json` (main checkout), then there
  are zero conformant losses. Every verdict or `dotEqual` mover is listed with its mechanism.
- Given `tests/oracle/svg-conformance/state*.test.ts`, the state golden ratchet and
  `tests/unit/state`, then all are green.
- Given niveno, report render-diff before → after (`npx jiti plans/class-divergence-drive/tools/render-diff.mts state/niveno-60-tiro789`).

**Observability:** N/A. **Rollback:** Reversible.
