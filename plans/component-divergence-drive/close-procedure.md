# Standard batch close (batches 1–4)

Agent: the orchestrator.
- `N` is the batch; `prev` is the previous close (`b0` for the first close).
- `$M` = `plans/component-divergence-drive/measurements/`
- `$T` = `plans/class-divergence-drive/tools/`

## Steps

1. **Merge.**
   - `git status` on the mission checkout must be clean. A dirty main checkout after an agent run
     means Serena wrote it ([[agents-write-main-via-serena]]). Move the change to the branch and
     journal it. If the change cannot be attributed, that is stop 12.
   - Verify each branch in its worktree before merging: targeted vitest plus the collected count.
     Then read `<worktree>/Tn-report.md`.
   - Merge `--no-ff` in dependency order. A `docs/catalog.md` conflict resolves with
     `git checkout --theirs docs/catalog.md && npm run catalog`.
   - Remove the worktrees and branches.
2. **Formatting.** Run `npx prettier --check` on every `.ts/.mts/.md/.json` changed since the batch base.
3. **Gates.** Run `bash $M/gates.sh bN` in the background. Collected must equal on-disk (stop 12).
   - On timeouts, grep "timed out" first ([[vitest-timeouts-under-agent-load]]).
   - **Typecheck before committing anything.**
4. **Survey all engines.** Run `bash $M/chain.sh bN-eng`.
   - Never use the positional-only form; it clobbers `parity.json`
     ([[svg-survey-positional-arg-writes-parity-json]]).
   - No merges while the survey runs.
5. **Diff.** Run `node $M/diff-eng.mjs $M/<prev>-eng $M/bN-eng > $M/bN-movers.txt`.
   - A conformant loss anywhere is stop 4.
   - A class/object/state `dotEqual` flip is stop 5.
   - Every other mover needs a mechanism in the journal.
6. **Census.** Run `npx tsx scripts/svg-conformance-census.ts component --json $M/bN-census.json`,
   `… component --per-fixture > $M/bN-perfix.txt` and `… component --families > $M/bN-families.txt`.
   `--json` takes a path and never overwrites the pinned `census-*.json`.
   - Record Σ diffs, zero-diff and the bucket counts.
   - Per-row: list every row whose count ROSE vs `prev`, and every attribute that moved AWAY from
     the jar ([[census-away-from-jar-catches-hidden-regressions]]). Each needs a mechanism (stop 6).
     Check the @id/childCount pairing first (D2).
   - Do the same for usecase (collateral).
7. **Named fixtures.** For every row in `fixtures.md`, run `npx jiti $T/render-diff.mts
   <tree>/<slug>` and fill the batch column.
8. **Re-rank.** Re-run the family classification on the 1–10-diff rows (`node $M/classify.mjs` over
   fresh render-diffs in `$M/bN-rd/`). Re-slot residuals to later tasks per push-forward, and journal
   each re-slot.
9. **Pins.** Run `npx jiti $M/pin-description.mts $M/bN-eng bN` as a dry run, then with `--write`.
   - This step only runs once T1a has landed.
   - Pins are additive. Diff the baseline JSON after the write: a pin that ROSE is stop 6
     ([[repin-script-raises-preexisting-red-pin]]).
   - Re-measure the diff-baseline ratchet (`npx jiti $M/measure-diff-baseline.mts`). Tighten only
     where a value fell.
10. **Dashboard.** Run `npm run parity:dashboard` when goldens, per-type parity or `dot-parity.json`
    changed, and commit `docs/parity-report.md`. Run `npm run catalog` if exports changed.
11. **Journal.** Record the SLIs against b0: conformant per engine, census Σ/zero-diff, layoutEqual,
    pin counts, and one row per riser, loss or flip with its mechanism.
12. **Ticks and commit.** Tick the batch in `README.md` and its overview. Commit
    `chore(codd-bN): close batch N — component <c>/<s>/<d>, census Σ <x>`. The body gives the counts
    before → after, the flips with mechanisms, and the named-fixture movement.

## Write-set
- `$M/**`, `decision-journal.md`, `fixtures.md`, `README.md`, `batch-*/overview.md`
- `tests/oracle/svg-conformance/parity-*.json` and `census-*.json` (only pins that exist and moved)
- `oracle/goldens/svg-description/**`, and the routing/refusal baselines (pin twins only)
- `docs/parity-report.md`, `docs/catalog.md`

## Acceptance
- Given the gates on the full suite, then all four pass and collected = on-disk.
- Given the all-engine diff, then every mover has a journal row with a mechanism, and conformant
  losses = 0.
- Given the census, then every risen row and every away-from-jar attribute has a mechanism.
