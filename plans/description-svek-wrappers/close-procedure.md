# Standard batch close (batches 1–3, 5)

Agent: orchestrator. `N` = batch, `prev` = the previous close (`b0` first).
`$M` = `plans/description-svek-wrappers/measurements/`, `$T` = `plans/class-divergence-drive/tools/`.

## Steps

1. **Merge.**
   - `git status` on the mission checkout must be clean. A dirty main checkout after an agent run
     means Serena wrote it ([[agents-write-main-via-serena]]); move the change to the branch and
     journal it.
   - Verify each branch in its worktree (targeted vitest, collected count) before merging.
   - Merge `--no-ff` in dependency order.
   - A `docs/catalog.md` conflict: `git checkout --theirs docs/catalog.md && npm run catalog`.
   - Remove worktrees and branches.
2. **Formatting.** `npx prettier --check` every `.ts/.mts/.md/.json` changed since the batch base.
3. **Four gates** (README) in the background with the JSON reporter; collected = on-disk (stop 12).
   - On timeouts, grep "timed out" first ([[vitest-timeouts-under-agent-load]]).
   - **Typecheck before committing anything.**
4. **Survey all engines**: `bash $M/chain.sh bN-eng` (written at T0; one `svg:survey -- <type> --out`
   per `test-results/dot-cache/*` tree, gated on load < 8).
   - Never use the positional-only form; it clobbers `parity.json`
     ([[svg-survey-positional-arg-writes-parity-json]]).
   - No merges while the survey runs.
5. **Diff** every engine's verdict, `dotEqual` and `layoutEqual` (from batch 2 on) against `$M/<prev>-eng/`.
   - A conformant loss anywhere is stop 4.
   - A class/object/state `dotEqual` flip is stop 5.
   - Every other mover needs a mechanism in the journal.
6. **Per-row numbers.** On every named fixture (fixtures.md), run `npx jiti $T/render-diff.mts
   <tree>/<slug>` and record structural/numeric plus layoutParity in fixtures.md.
7. **Journal** one row per riser, loss or flip, with its mechanism.
8. **Dashboard** `npm run parity:dashboard` when goldens or `dot-parity.json` changed; commit
   `docs/parity-report.md`. Run `npm run catalog` if exports changed.
9. **Ticks.** Tick the batch in `README.md` and its overview.
10. **Commit** `chore(dsw-bN): close batch N — component <c>/<s>/<d>, usecase <c>/<s>/<d>`. The body
    gives counts before → after, flips with mechanisms, and named-fixture movement.

## Write-set
`$M/**`, `decision-journal.md`, `fixtures.md`, `README.md`, `batch-*/overview.md`,
`tests/oracle/svg-conformance/parity-*.json` (only pins that exist and moved), `docs/parity-report.md`,
`docs/catalog.md`.

## Acceptance
- Given the gates on the full suite, then all four pass and collected = on-disk.
- Given the all-engine diff, then every mover has a journal row with a mechanism, and conformant
  losses = 0.
