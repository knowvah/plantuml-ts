# Standard batch close (batches 1a/1b, 2, 3)

Agent: orchestrator. `N` = batch, `prev` = the previous close (`b0` first).
`$M` = `plans/utility-factories-port/measurements/`, `$T` = `plans/class-divergence-drive/tools/`.

## Steps

1. **Merge.** `git status` on the mission checkout must be clean (only foreign files you never
   stage). Verify each branch in its worktree (targeted vitest, collected count, main untouched)
   before merging. Merge `--no-ff` in dependency order; a `docs/catalog.md` conflict →
   `git checkout --theirs docs/catalog.md && npm run catalog`. Remove worktrees and branches.
2. **Formatting.** `npx prettier --check` every `.ts/.mts/.md/.json` changed since the batch base.
3. **Four gates** (README) in the background with the JSON reporter; collected = on-disk (stop 6).
   Timeouts: grep "timed out" first. A red test that pinned pre-fix behaviour changes only with a
   Java quote or a jar probe. **Typecheck before committing anything** (wep row 34).
4. **Survey all engines** `$M/chain.sh bN-eng` (measures the MAIN checkout — no merges while it
   runs; foreign load → scratch copy with the gate raised, journal it). From batch 2 on copy
   `parity-unknown.json` to `tests/oracle/svg-conformance/parity-unknown.json` only if that pin
   exists and the survey moved it.
5. **Diff** every engine's verdict and `dotEqual` against `$M/<prev>-eng/`. Movers among the 17
   rows are expected; any other mover needs a mechanism (stop 5); any conformant loss is stop 4;
   any routing-owner change outside the 17 is stop 7.
6. **Per-row numbers.** `npx jiti $T/render-diff.mts unknown/<slug>` on every non-conformant
   in-scope row; record structural/numeric in `fixtures.md`.
7. **Journal movers:** one row per riser, loss or `dotEqual` flip, with its mechanism.
8. **Pin** (from batch 2 on): every in-scope row that is survey-conformant AND compareSvg
   zero-diff goes into `oracle/goldens/svg-utility/` via `npx jiti $M/pin-utility.mts <slug>…`,
   THEN `npx jiti $M/repin-utility-routing.mts --write` (re-measures the 17 rows' routing/refusal
   rows in place, fixes the record reasons, clones goldens twins — both gates walk every golden
   dir), THEN `npx jiti $M/repin-utility-baseline.mts --write`. Bump the routing/refusal count
   constants with a derivation comment (`tests/oracle/svg-conformance/{routing-conformance,
   refusal-coverage}.test.ts`: agree/misroute/total, gaps/erroring/rendering). Run the ratchet,
   routing, refusal, `emitter.golden` (accepted-divergences AC4: retire any entry that is now
   conformant — never sign one) and dashboard tests.
9. **Dashboard** `npm run parity:dashboard`; at the b2 close add the `svg-utility` family to
   `scripts/parity-dashboard-goldens.ts` if the dashboard keys families by bucket (read it first;
   the rows live in the `unknown` bucket). `npm run catalog` if exports changed.
10. **Ledger + ticks.** `fixtures.md` finals; tick the batch in `README.md` and its overview.
11. **Commit** `chore(ufp-bN): close batch N — utility <conformant>/17`. Body: counts before →
    after, pins, risers' mechanisms, non-utility movers.

## Batch-2 extras
Group every non-conformant in-scope row into families by mechanism (instrument first; memory
"measurement artifacts outnumber defects"). Write `batch-3/overview.md` rows and one task spec
per family in the batch-1 format, with disjoint write-sets; a family that needs `src/core/` is a
stop-10 report for the maintainer before it runs.

## Write-set
`$M/**`, `decision-journal.md`, `fixtures.md`, `README.md`, `batch-*/overview.md`, batch-3 specs,
`oracle/goldens/svg-utility/**`, `oracle/goldens/svg-conformance/{routing,refusal}-baseline.json`,
the two gate tests' counts, `oracle/accepted-divergences.json` (retirements only),
`tests/oracle/svg-conformance/parity-*.json`, `docs/parity-report.md`,
`scripts/parity-dashboard-{goldens,matrix}.ts` (b2 only), `docs/catalog.md`.

## Acceptance
- Given the gates on the full suite, then all four pass and collected = on-disk.
- Given the all-engine diff, then every mover has a journal row with a mechanism.
- Given the utility golden ratchet, then it holds only byte-identical rows, each with routing and
  refusal twin rows.
