# Standard batch close (batches 0–8)

Agent: orchestrator. `N` = batch label, `prev` = the previous close's
measurement (`b0` for batch 1). `$T`/`$M` as in README.

## Steps
1. **Merge.** Commit any pending `plans/` edit first (`merge-one.sh` refuses
   a dirty tree; never chain `git branch -D` on the same line). Then `bash
   $M/merge-one.sh <Tn> "<subject>" tests/unit/gantt/<task paths>`: `--no-ff`
   merge, typecheck, the gantt ratchets (dormant before batch 7), the task's
   tests. Batch 5 merges its chain branch once. Resolve a `docs/catalog.md`
   conflict with `npm run catalog`. Before removing worktrees: `ps -Ao
   pid,command | grep worktrees/gep-` and kill leftovers.
2. **Four gates.** `bash $M/gates.sh bN`. Collected = on-disk (stop 10). A
   "Test timed out" with no diff is load: `uptime`, rerun at `--maxWorkers=4`.
3. **All engines (D9).** `bash $M/chain.sh bN-eng`; `node $T/verdict-diff.mjs
   $M/<prev>-eng $M/bN-eng`. Before batch 7, every engine must show 0 movers
   (gantt still refuses). From batch 7, only gantt may move; any conformant
   loss elsewhere is stop 4.
4. **Gantt measurement (from batch 7).** `npm run svg:survey -- gantt --out
   $M/bN-eng/parity-gantt.json` is part of the chain; list verdict counts,
   `errored`, and firstDiff families (`jq -r '.fixtures[].firstDiff' | sed
   -E 's/\[[0-9]+\]//g' | sort | uniq -c`). Re-pin
   `tests/oracle/svg-conformance/parity-gantt.json` and the gantt
   golden/diff-baseline pins only when every changed row moved toward the jar.
5. **Ledger.** `fixtures.md`: counts row for `bN`; per-family table from
   batch 7 on.
6. **Dashboard.** `npm run parity:dashboard` after any `parity-*.json`
   re-pin; `npm run catalog` if exports changed.
7. **Brief.** Tick the batch in `README.md` and its `overview.md`.
8. **d.ts snapshot (b6 only).** After the build gate, `cp dist/plantuml-ts.d.ts $M/b6-plantuml-ts.d.ts` — T7c diffs against it (stop 6).
9. **Commit.** Full gates again if anything under `oracle/` or `tests/`
   changed in steps 4–6, then `chore(gep-bN): close batch N — <summary>`
   with explicit paths (never `git add plans/` while a chain writes
   `bN-eng/`). Body: what merged, gate counts, movers, pins.

## Write-set
`$M/bN*`, `$M/bN-eng/`, `decision-journal.md`, `fixtures.md`, `README.md`,
`batch-N/overview.md`, `tests/oracle/svg-conformance/parity-gantt.json` and
the gantt golden/diff-baseline pins (batch 7+), `docs/parity-report.md`,
`docs/catalog.md`.

## Acceptance
- Given the gates on the full suite, then all four pass and collected = on-disk.
- Given the all-engine diff, then every change has a journal row with a
  mechanism and no other engine lost a conformant row.
- Given every non-gantt golden ratchet, then it is green with no pin edited.

Observability: N/A (measurement task). Rollback: Reversible.
