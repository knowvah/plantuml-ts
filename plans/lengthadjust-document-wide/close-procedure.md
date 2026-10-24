# Standard batch close (batches 0–2)

Agent: orchestrator. `N` = batch label, `prev` = the previous close's
measurement (`b0` for batch 1). `$T` = `plans/lengthadjust-document-wide/
tools/`, `$M` = `plans/lengthadjust-document-wide/measurements/`.

## Steps

1. **Merge.** Commit any pending `plans/` edit first (`merge-one.sh` refuses
   a dirty tree and never chain `git branch -D` on the same line — sdd3 row
   104). Then `bash $M/merge-one.sh <Tn> "<subject>" [<engine golden ratchet
   test> ...]`: `--no-ff` merge, the authored gate, the named ratchets. Resolve
   a `docs/catalog.md` conflict with `npm run catalog`. Remove the worktree
   and branch after a green merge.
2. **Four gates.** `bash $M/gates.sh bN`. Collected = on-disk (stop 14). A
   "Test timed out" with no diff is load, not a regression: check `uptime`,
   rerun at `--maxWorkers=4`.
3. **Authored baseline.** `npx jiti $T/build-authored-baseline.mts <merge sha>`
   (dry run): list every row whose `rootExact`/`textLengthMatch` changed or
   whose score moved. Falls and false→true are adopted (`--write`); any
   true→false or rise is stop 6. Diff the JSON before/after.
4. **All engines (D7).** `bash $M/chain.sh bN-eng`; `node $T/verdict-diff.mjs
   $M/<prev>-eng $M/bN-eng`. Any conformant loss is stop 4; movers outside
   board/files/packetdiag/chart, or more than 4 engines moving, is stop 8.
   Every mover gets a journal row with its mechanism.
5. **Pins.** Every golden ratchet (`tests/oracle/svg-conformance/*.golden.
   ratchet.test.ts`) and diff-baseline ratchet ran inside the gates; a red
   one is stop 5 unless its source sets `skinparam lengthAdjust`. Re-pin
   `tests/oracle/svg-conformance/parity-<engine>.json` only for the four D2
   engines after T2f (copy from `$M/bN-eng/`), journaling the row counts.
6. **Ledger.** `fixtures.md`: counts row for `bN`; every row that became
   exact gets `exact (<commit>)`; every row still open names its mechanism and
   owning task.
7. **Dashboard.** `npm run parity:dashboard` after any `parity-*.json` re-pin
   (the drift gate reads every engine's pin); `npm run catalog` if exports
   changed.
8. **Brief.** Tick the batch in `README.md` and its `overview.md`.
9. **Commit.** Full gates again if anything under `oracle/` or `tests/`
   changed in steps 3–7, then `chore(lad-bN): close batch N — <exact>/64
   exact` with explicit paths (never `git add plans/` while a chain writes
   `bN-eng/`). Body: authored counts before → after, movers, pins.

## Write-set

`$M/bN*`, `$M/bN-eng/`, `decision-journal.md`, `fixtures.md`, `README.md`,
`batch-N/overview.md`, `oracle/goldens/svg-lengthadjust/authored-baseline.json`,
`tests/oracle/svg-conformance/parity-{board,files,packet,chart}.json` (batch 2
only), `docs/parity-report.md`, `docs/catalog.md`.

## Acceptance

- Given the gates on the full suite, then all four pass and collected = on-disk.
- Given the authored baseline diff and the all-engine diff, then every change
  has a journal row with a mechanism and nothing got worse.
- Given every golden ratchet, then it is green with no pin edited.
- Given `fixtures.md`, then every open row has a mechanism and an owner.

Observability: N/A (measurement task). Rollback: Reversible (revert the close
commit).
