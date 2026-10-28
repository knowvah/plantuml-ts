# Standard batch close (batches 0–2)

Agent: orchestrator. `N` = batch label, `prev` = the previous close's
measurement (`b0` for batch 1). `$T`/`$M` as in README.

## Steps
1. **Merge.** Commit any pending `plans/` edit first (`merge-one.sh` refuses
   a dirty tree; never chain `git branch -D` on the same line). Then `bash
   $M/merge-one.sh <Tn> "<subject>" <task test paths>`: `--no-ff` merge,
   typecheck, the gantt ratchets, the task's tests. Resolve a
   `docs/catalog.md` conflict with `npm run catalog`. Before removing
   worktrees: `ps -Ao pid,command | grep worktrees/gdd-` and kill leftovers.
2. **Four gates.** `bash $M/gates.sh bN`. Collected = on-disk (stop 10). A
   "Test timed out" with no diff is load: `uptime`, rerun at `--maxWorkers=4`.
   `cmp dist/plantuml-ts.d.ts $M/b0-plantuml-ts.d.ts` (stop 6).
3. **All engines (D6).** `bash $M/chain.sh bN-eng`; `node $T/verdict-diff.mjs
   $M/<prev>-eng $M/bN-eng`. Only gantt may gain; a conformant loss elsewhere
   is stop 4; a row elsewhere moving AWAY from the jar after T1a is stop 15; a
   move toward the jar is a journal row with its mechanism.
4. **Gantt measurement.** The chain writes `$M/bN-eng/parity-gantt.json`;
   list verdict counts, `errored`, and firstDiff families (`jq -r
   '.fixtures[].firstDiff' | sed -E 's/\[[0-9]+\]//g' | sort | uniq -c`).
   Re-pin `tests/oracle/svg-conformance/parity-gantt.json`, the goldens
   (`npx jiti $M/pin-gantt.mts <slug> --write`, then `repin-gantt-routing.mts
   --write`), the diff baseline (`repin-gantt-baseline.mts`) and the authored
   baseline only when every changed row moved toward the jar. Diff the
   baseline JSON before and after: a pin that ROSE is an adopted regression.
5. **Ledger.** `fixtures.md`: counts row for `bN`; family table rows closed
   with the commit and the Java quote.
6. **Dashboard.** `npm run parity:dashboard` after any `parity-*.json`
   re-pin; `npm run catalog` if exports changed.
7. **Brief.** Tick the batch in `README.md` and its `overview.md`.
8. **Commit.** Full gates again if anything under `oracle/` or `tests/`
   changed in steps 4–6, then `chore(gdd-bN): close batch N — <summary>`
   with explicit paths (never `git add plans/` while a chain writes
   `bN-eng/`). Body: what merged, gate counts, movers, pins.

## Write-set
`$M/bN*`, `$M/bN-eng/`, `decision-journal.md`, `fixtures.md`, `README.md`,
`batch-N/overview.md`, `tests/oracle/svg-conformance/parity-gantt.json`,
`oracle/goldens/svg-gantt/**` (goldens, `ratchet.json`, `diff-baseline.json`,
`authored-baseline.json`), the routing/refusal/freshness pins,
`docs/parity-report.md`, `docs/catalog.md`.

## Acceptance
- Given the gates on the full suite, then all four pass and collected = on-disk.
- Given the all-engine diff, then every change has a journal row with a
  mechanism and no other engine lost a conformant row.
- Given every non-gantt golden ratchet, then it is green with no pin edited.

Observability: N/A (measurement task). Rollback: Reversible.
