# Standard batch close (batches 1–8)

Agent: orchestrator. `N` = batch label, `prev` = the previous close's
measurement (`b0` for batch 1). `$T` = `plans/sequence-divergence-drive-3/
tools/`, `$M` = `plans/sequence-divergence-drive-3/measurements/`.

## Steps

1. **Merge.** Merge each task branch (`--no-ff`) after `git diff HEAD` on the
   mission branch is empty. After **each** merge: golden ratchet
   (`sequence.golden.ratchet.test.ts`) + `npx tsx $T/classify.mts` — two green
   branches can break a pin only when merged. Resolve a `docs/catalog.md`
   conflict with `npm run catalog`. Remove the worktrees and branches.
2. **Four gates.** `bash $M/gates.sh bN`. Collected = on-disk (stop 14). A red
   test that pinned pre-fix behaviour is updated only with a Java quote. A
   "Test timed out" with no diff is load, not a regression: check `uptime`,
   rerun at `--maxWorkers=4` (budgets: `tests/helpers/ci-test-budgets.ts`).
3. **Classify.** `npx tsx $T/classify.mts $M/bN-classify.json`. Diff per-row
   `ws` against `prev`: list every riser and every row that reached zero.
4. **Survey sequence** (save the prior file first): `npm run svg:survey --
   sequence --out tests/oracle/svg-conformance/parity-sequence.json`; copy to
   `$M/bN-survey.json`; record wall-clock + `uptime` (stop 15 vs b0). Every
   fixture survey and classify disagree on gets a journal row (stop 12).
5. **All engines (D1).** `bash $M/chain.sh bN-eng`; diff verdicts against
   `prev` with `$T/verdict-diff.mjs`. > 30 movers or any conformant loss =
   stop 13/4. Every batch (all batches 2–8 touch `src/core` or the export path).
6. **Journal movers.** One row per sequence riser and per non-sequence mover,
   with its mechanism. No mechanism = stop 4/5.
7. **Re-pin baselines.** `npx jiti scripts/sequence-repin-snapshot.ts
   $M/bN-snap.json` then `npx jiti scripts/repin-sequence-baselines.ts
   $M/bN-snap.json`. Diff the baseline JSON before/after: every row
   that ROSE gets its own journal line or the re-pin is reverted. The census
   runs AFTER the pin (8b): it enumerates `status: baseline` rows (b1 close,
   journal row 28).
8. **Pin.** Every fixture whose classify `n === 0`:
   `npx jiti $T/pin-goldens.mts sdd3-bN close-bN <slug...>`; check the
   `$comment` it appends to `routing-baseline.json`/`refusal-baseline.json`
   names sdd3 (the tool's text says sdd2 — T0a fixes it). Bump the running
   counts in `routing-conformance.test.ts` and `refusal-coverage.test.ts`
   (three literals: the manifest total in both files, `pinnedAgree`,
   `pinnedRendering`), each with a dated derivation comment. Run the golden
   and diff-baseline ratchets.
   8b. `npx jiti tests/oracle/svg-conformance/sequence-diff-census.ts`, then
   `sequence-diff-census.test.ts`.
9. **Ledger.** `fixtures.md`: counts row for `bN`; pinned rows get
   `final = pinned (<commit>)`; every row a task targeted and missed names its
   remaining mechanism and owner.
10. **Dashboard.** `npm run parity:dashboard` AFTER every `parity-*.json`
    re-pin of step 5 (the D9 drift gate reads every engine's pin — b1 close,
    journal row 30) AND after the census of 8b (it reads the census row
    count — b6 close, journal row 85); `npm run catalog` if exports changed.
11. **Brief.** Tick the batch in `README.md` and its `overview.md`.
12. **Commit.** Full gates again (pins changed), then
    `chore(sdd3-bN): close batch N — <pins> pinned, sum <score>`. Body:
    cohort counts before → after, pins, risers' mechanisms, non-sequence
    movers.

Batch 0's close replaces steps 3–8 with: every corpus fixture (all engines)
renders hash-identical to the pre-split hashes — stop 7 otherwise. It pins
nothing. Batch 8's move tasks (T8b–T8e) use the same hash check per merge.

## Write-set

`$M/bN*`, `$M/bN-eng/`, `decision-journal.md`, `fixtures.md`, `README.md`,
`batch-N/overview.md`, `oracle/goldens/svg-sequence/**`,
`oracle/goldens/svg-conformance/{routing,refusal}-baseline.json`,
`tests/oracle/svg-conformance/parity-*.json`,
`tests/oracle/**/routing-conformance.test.ts`,
`tests/oracle/**/refusal-coverage.test.ts`, `docs/parity-report.md`,
`docs/catalog.md`.

## Acceptance

- Given the gates on the full suite, then all four pass and collected = on-disk.
- Given the classify diff vs `prev` and the all-engine diff, then every rise,
  flip and loss has a journal row with a mechanism.
- Given the golden ratchet, then it holds no fixture that is not zero-diff,
  and every zero-diff fixture is pinned.
- Given `fixtures.md`, then every row the batch targeted has a mechanism and
  every pinned row a `final`.

Observability: N/A (measurement task). Rollback: Reversible (revert the close
commit).
