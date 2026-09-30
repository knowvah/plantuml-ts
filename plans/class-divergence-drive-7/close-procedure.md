# Standard batch close (batches 1, 2)

Agent: orchestrator. `N` = batch number, `prev` = the previous close's measurement
(`b0.json` for batch 1). `$T` = `plans/class-divergence-drive/tools/`,
`$M` = `plans/class-divergence-drive-7/measurements/`.

## Steps

1. **Merge.** Merge each task branch (`--no-ff`) after `git diff HEAD` on main is
   empty (D11). Resolve a `docs/catalog.md` conflict by `npm run catalog`. Remove
   the worktrees and branches.
2. **Residual round.** `npx jiti $T/render-diff.mts <tree/slug...>` on the batch's
   rows. Fix a residual only if its mechanism is stated (journal or `diagnosis/`),
   one commit with a test. Otherwise set its `final`.
3. **Four gates** (README). Collected = on-disk (stop 7). A red test that pinned
   pre-fix behaviour is updated only with a Java quote (push-forward).
4. **Survey class and unknown** (save the prior files first):
   `npm run svg:survey -- class --out tests/oracle/svg-conformance/parity-class.json`,
   same for `unknown` into `parity-unknown.json`. Timeouts at load ≥ 8: re-survey.
5. **Census.** `npx jiti scripts/svg-conformance-census.ts class --json
   tests/oracle/svg-conformance/census-class.json` (covers both trees).
6. **Render-all.** `npx jiti $T/render-all.mts $M/bN.json --tree all`. Its CLASS
   verdicts must equal the surveys'.
7. **Diff.** `npx jiti $T/pin-diff.mts $M/<prev>.json $M/bN.json`, plus a `dotEqual`
   diff of the old vs new parity files.
8. **Journal movers.** One row per riser, `dotEqual` flip or conformant loss, with its
   mechanism. A structural fall with a numeric rise is a reveal. No mechanism =
   stop 4/5.
9. **All engines (D7).** Description and sequence movers from T1e/T1f are expected: verify each against the task's journal row.
    Survey every other engine into `$M/bN-eng/parity-<e>.json`;
   diff verdicts + `dotEqual` against the previous close's engine files (`b0-eng/`
   for batch 1). Journal each mover's mechanism. > 30 movers or any conformant loss
   = stop 8/4.
10. **Pin.** Every CLASS fixture that is survey-conformant, census 0-diff,
    `dotEqual: true` (or `dotEqualExempt` per D6), still CLASS-routed and not yet pinned:
    `npx jiti $T/pin-goldens.mts --tree <class|unknown> cdd7-bN close-bN <slug...>`.
    Bump the hard-coded counts in
    `tests/oracle/svg-conformance/{refusal-coverage,routing-conformance}.test.ts`
    with a derivation comment. Re-pin any row the gates flag `[FIXED]`/`[CHANGED]`
    from a fresh measurement. Run the ratchet, routing, refusal and DOT-parity tests.
11. **Dashboard.** `npm run parity:dashboard`; `npm run catalog` if exports changed.
12. **Ledger.** `fixtures.md`: `fixed (<commit>)` for every row now conformant;
    residuals get their measured mechanism and a new owner or `open -> cdd8`. Tick the
    batch in `README.md` and its `overview.md`.
13. **Commit.** Full `npm test` again (pins changed), then
    `chore(cdd7-bN): close batch N — <CLASS conformant>, ratchet <n>`. The body carries
    counts before → after, pins, risers' mechanisms and the non-class movers.

## Write-set

- `$M/bN.json`, `$M/bN-eng/`, `decision-journal.md`, `fixtures.md`, `README.md`,
  `batch-N/overview.md`, later batches' task specs (re-slotting)
- `oracle/goldens/svg-class/**`, `oracle/goldens/svg-conformance/{routing,refusal}-baseline.json`
- `tests/oracle/svg-conformance/{parity-class,parity-unknown,census-class}.json` and
  the two gate tests' counts
- `docs/parity-report.md`, `docs/catalog.md`; the residual round's fix files

## Acceptance

- Given the gates on the full suite, then all four pass and collected = on-disk.
- Given pin-diff vs `prev` and the all-engine diff, then every rise, flip and loss
  has a journal row with a mechanism.
- Given the ratchet, then it holds no fixture that is not survey-conformant, census
  0-diff and `dotEqual: true` (or a D6 `dotEqualExempt` entry).
- Given `fixtures.md`, then every row the batch touched has a non-empty `final`.

Observability: N/A (measurement task). Rollback: Reversible (revert the close commit).
