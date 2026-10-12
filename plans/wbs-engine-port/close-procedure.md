# Standard batch close (batches 1–5)

Agent: orchestrator. `N` = batch, `prev` = the previous close (`b0` for batch 1).
`$M` = `plans/wbs-engine-port/measurements/`, `$T` = `plans/class-divergence-drive/tools/`.

## Steps

1. **Merge.** `git status` on the mission checkout must be clean first (memory: agents
   write main via Serena). Verify each branch in its worktree yourself (targeted vitest run,
   collected count, main untouched) before merging. Merge `--no-ff` in dependency order;
   resolve a `docs/catalog.md` conflict with `git checkout --theirs docs/catalog.md && npm run
   catalog`. Remove worktrees (`--force` if an untracked note remains, after copying it) and
   branches.
2. **Formatting.** `npx prettier --check` every file changed since the batch base.
3. **Four gates** (README) in the background with the JSON reporter; collected = on-disk
   (stop 6). Timeouts: grep "timed out" first. A red test that pinned pre-fix behaviour
   changes only with a Java quote or a jar probe.
4. **Survey all engines** `$M/chain.sh bN-eng` (measures the MAIN checkout — no merges while
   it runs; if foreign load holds it closed, run a scratch copy with the gate raised and
   journal it). Copy `parity-wbs.json` to `tests/oracle/svg-conformance/parity-wbs.json`.
5. **Diff** every engine's verdict and `dotEqual` against `$M/<prev>-eng/`. wbs movers are
   expected; a non-wbs mover needs a mechanism (stop 5); any conformant loss is stop 4; more
   than 30 non-wbs movers is stop 7.
6. **Per-row numbers.** `npx jiti $T/render-diff.mts wbs/<slug>` on every non-conformant
   wbs row and `activity/bozido-07-geze049`; record structural/numeric in `fixtures.md`.
7. **Journal movers:** one row per riser, loss or `dotEqual` flip, with its mechanism.
8. **Pin** (from batch 4 on): every wbs row that is survey-conformant and byte-identical goes
   into `oracle/goldens/svg-wbs/` via `npx jiti $M/pin-wbs.mts <slug>…`, THEN
   `npx jiti $M/repin-wbs-routing.mts --write` (re-measures the `dot-cache/wbs` routing/refusal
   rows in place and clones the goldens twins — both gates walk every golden dir), THEN
   `npx jiti $M/repin-wbs-baseline.mts --write` (diff-baseline = the unpinned rows, numeric;
   jar-crash rows carry a `jar-crash:` reason). Bump the routing/refusal count constants with
   a derivation comment (`tests/oracle/svg-conformance/{routing-conformance,refusal-coverage}
   .test.ts`). bozido moves through `scripts/repin-activity-baselines.ts --write` (a fall).
   Run the ratchet, routing, refusal, emitter-golden (accepted-divergences) and dashboard tests.
9. **Dashboard** `npm run parity:dashboard`; at the b4 close add `wbs: 'svg-wbs'` to
   `RATCHET_FAMILY`/`DIFF_BASELINE_FAMILY` (`scripts/parity-dashboard-goldens.ts`) and remove
   `wbs: 'D3'` from `NO_ENGINE_D_ID` (`parity-dashboard-matrix.ts`). `npm run catalog` if
   exports changed.
10. **Ledger + ticks.** `fixtures.md` finals; tick the batch in `README.md` and its overview.
11. **Commit** `chore(wep-bN): close batch N — wbs <conformant>/204`. Body: counts before →
    after, pins, risers' mechanisms, non-wbs movers.

## Batch-4 extras
Group every non-conformant wbs row into families by mechanism (instrument first; memory
"measurement artifacts outnumber defects"). Write `batch-5/overview.md` rows and one task
spec per family in the batch-1 format, with disjoint write-sets; a family that needs
`src/core/` is a stop-10 report for the maintainer before it runs.

## Write-set
`$M/**`, `decision-journal.md`, `fixtures.md`, `README.md`, `batch-*/overview.md`, batch-5
specs, `oracle/goldens/svg-wbs/**`, `oracle/goldens/svg-activity/*.json` (bozido),
`oracle/goldens/svg-conformance/{routing,refusal}-baseline.json`, the two gate tests'
counts, `tests/oracle/svg-conformance/parity-*.json`, `docs/parity-report.md`,
`scripts/parity-dashboard-{goldens,matrix}.ts` (b4 only), `docs/catalog.md`.

## Acceptance
- Given the gates on the full suite, then all four pass and collected = on-disk.
- Given the all-engine diff, then every mover has a journal row with a mechanism.
- Given the wbs golden ratchet, then it holds only byte-identical rows, each with routing
  and refusal twin rows.
