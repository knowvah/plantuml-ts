# Standard batch close (batches 1–8)

Agent: orchestrator. `N` = batch label, `prev` = the previous close's
measurement (`b0` for batch 1). `$T` = `plans/sequence-divergence-drive-2/
tools/`, `$M` = `plans/sequence-divergence-drive-2/measurements/`.

## Steps

1. **Merge.** Merge each task branch (`--no-ff`) after `git diff HEAD` on the
   mission branch is empty. After **each** merge: golden ratchet
   (`sequence.golden.ratchet.test.ts`) + `npx tsx $T/classify.mts` — two
   green branches can break a pin only when merged (sdd1 row 47). Resolve a
   `docs/catalog.md` conflict with `npm run catalog`. Remove the worktrees
   and branches.
2. **Four gates.** `bash $M/gates.sh bN`. Collected = on-disk (stop 15). A
   red test that pinned pre-fix behaviour is updated only with a Java quote.
3. **Classify.** `npx tsx $T/classify.mts $M/bN-classify.json`. Diff per-row
   `ws` against `prev`: list every riser and every row that reached zero.
4. **Survey sequence** (save the prior file first): `npm run svg:survey --
   sequence --out tests/oracle/svg-conformance/parity-sequence.json`; copy
   to `$M/bN-survey.json`; record wall-clock + `uptime` (stop 17 vs b0).
   Every fixture survey and classify disagree on gets a journal row (stop 13).
5. **All engines (D1, D6).** `bash $M/chain.sh bN-eng`; diff verdicts against
   `prev` with `$T/verdict-diff.mjs`. > 30 movers or any conformant loss =
   stop 14/4. Batches 2, 6, 7, 8 always; batches whose diff touched `src/core`
   always; others too (cheap insurance).
6. **Journal movers.** One row per sequence riser and per non-sequence mover,
   with its mechanism. No mechanism = stop 4/5.
7. **Re-pin baselines.** `npx tsx scripts/repin-sequence-baselines.ts`; also
   `npx jiti tests/oracle/svg-conformance/sequence-diff-census.ts`. Diff the
   JSON before/after (memory `repin-script-raises-preexisting-red-pin`):
   every row that ROSE gets its own journal line or the re-pin is reverted.
8. **Pin.** Every fixture whose classify `n === 0`:
   `npx jiti $T/pin-goldens.mts sdd2-bN close-bN <slug...>`. Bump the running
   row counts in `routing-conformance.test.ts` and `refusal-coverage.test.ts`
   (sdd1 row 6). Run the golden and diff-baseline ratchets.
9. **Ledger.** `fixtures.md`: counts row for `bN`; pinned rows get
   `final = pinned (<commit>)`; every row a task targeted and missed names
   its remaining mechanism and owner.
10. **Dashboard.** `npm run parity:dashboard`; `npm run catalog` if exports
    changed.
11. **Brief.** Tick the batch in `README.md` and its `overview.md`.
12. **Commit.** Full gates again (pins changed), then
    `chore(sdd2-bN): close batch N — <pins> pinned, sum <score>`. Body:
    cohort counts before → after, pins, risers' mechanisms, non-sequence
    movers.

Batch 0's close replaces steps 3–8 with: every corpus fixture renders
hash-identical to the pre-split hashes (both paths) — stop 7 otherwise. It
pins nothing.

## Write-set

`$M/bN*`, `$M/bN-eng/`, `decision-journal.md`, `fixtures.md`, `README.md`,
`batch-N/overview.md`, `oracle/goldens/svg-sequence/**`,
`tests/oracle/svg-conformance/parity-sequence.json`,
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
