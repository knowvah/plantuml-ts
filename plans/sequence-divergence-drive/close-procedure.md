# Standard batch close (batches 1b, 2, 3b, 4)

Agent: orchestrator. `N` = batch label, `prev` = the previous close's
measurement (`b0` for batch 1b). `$T` = `plans/sequence-divergence-drive/
tools/`, `$M` = `plans/sequence-divergence-drive/measurements/`.

## Steps

1. **Merge.** Merge each task branch (`--no-ff`) after `git diff HEAD` on the
   mission branch is empty (D9). Resolve a `docs/catalog.md` conflict with
   `npm run catalog`. Remove the worktrees and branches.
2. **Four gates.** `bash $M/gates.sh bN`. Collected = on-disk (stop 15). A
   red test that pinned pre-fix behaviour is updated only with a Java quote.
3. **Classify.** `npx tsx $T/classify.mts $M/bN-classify.json`. Diff per-row
   `ws` against `prev`: list every riser.
4. **Survey sequence** (save the prior file first): `npm run svg:survey --
   sequence --out tests/oracle/svg-conformance/parity-sequence.json`; copy
   to `$M/bN-survey.json`. Every fixture the survey and the classify disagree
   on (conformant vs zero-diff) gets a journal row (D6; stop 13).
5. **All engines (D7).** Survey every other engine into `$M/bN-eng/parity-
   <e>.json`; diff verdicts against `prev`'s files. > 30 movers or any
   conformant loss = stop 14/4.
6. **Journal movers.** One row per sequence riser and per non-sequence mover,
   with its mechanism. No mechanism = stop 4/5.
7. **Re-pin baselines.** `npx tsx scripts/repin-sequence-baselines.ts`; also
   `npx jiti tests/oracle/svg-conformance/sequence-diff-census.ts`. Diff the
   JSON before/after (memory `repin-script-raises-preexisting-red-pin`):
   every row that ROSE gets its own journal line or the re-pin is reverted.
8. **Pin.** Every fixture whose classify `n === 0`:
   `npx jiti $T/pin-goldens.mts sdd1-bN close-bN <slug...>`. Run
   `sequence.golden.ratchet.test.ts` and `sequence.diff-baseline.ratchet
   .test.ts`.
9. **Re-cut the ledger.** `fixtures.md`: pinned rows get `final = pinned
   (<commit>)`; every still-open paint-only row names its next mechanism
   (the diff, the Java) and the owning task or `sdd2`.
10. **Dashboard.** `npm run parity:dashboard`; `npm run catalog` if exports
    changed.
11. **Ledger + brief.** Tick the batch in `README.md` and its `overview.md`;
    for the batch-3b close, write `batch-4/overview.md`'s T4x families from
    step 9.
12. **Commit.** Full gates again (pins changed), then
    `chore(sdd1-bN): close batch N — <pins> pinned, Σ <score>`. The body
    carries counts before → after, pins, risers' mechanisms and the
    non-sequence movers.

Batch 1b's close adds one check before step 3: every corpus fixture renders
byte-identical to b0 (both paths) — stop 7 otherwise. It pins nothing.

## Write-set

`$M/bN*`, `$M/bN-eng/`, `decision-journal.md`, `fixtures.md`, `README.md`,
`batch-N/overview.md`, `batch-4/overview.md` + T4x specs (3b close only),
`oracle/goldens/svg-sequence/**`,
`tests/oracle/svg-conformance/parity-sequence.json`,
`docs/parity-report.md`, `docs/catalog.md`.

## Acceptance

- Given the gates on the full suite, then all four pass and collected = on-disk.
- Given the classify diff vs `prev` and the all-engine diff, then every rise,
  flip and loss has a journal row with a mechanism.
- Given the golden ratchet, then it holds no fixture that is not zero-diff.
- Given `fixtures.md`, then every row the batch touched has a mechanism and
  every pinned row a `final`.

Observability: N/A (measurement task). Rollback: Reversible (revert the close
commit).
