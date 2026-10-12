# Standard batch close (batches 1–5)

Agent: orchestrator. `N` = batch, `prev` = the previous close (`b0` for batch 1).
`$M` = `plans/salt-engine-port/measurements/`, `$T` = `plans/class-divergence-drive/tools/`.

## Steps

1. **Merge.** `git status` on the mission checkout must be clean first (memory: agents
   write main via Serena). Merge each task branch `--no-ff` in dependency order; resolve a
   `docs/catalog.md` conflict with `npm run catalog`. Remove worktrees and branches.
2. **Formatting.** Worktrees skip git hooks: `npx prettier --check` every file changed since
   the batch base; format and commit (`style(sep-bN): …`) anything unformatted.
3. **Four gates** (README). Collected = on-disk (stop 6). A red test that pinned pre-fix
   behaviour changes only with a Java quote or a jar probe. Timeouts: grep "timed out" first.
4. **Survey all engines** into `$M/bN-eng/parity-<e>.json` (`npm run svg:survey -- <e>
   --out …`, waiting for load < 10). Copy `parity-salt.json` to
   `tests/oracle/svg-conformance/parity-salt.json`.
5. **Diff** every engine's verdict and `dotEqual` against `$M/<prev>-eng/`. Salt movers are
   expected; a non-salt mover needs a mechanism (stop 5); any conformant loss is stop 4;
   more than 30 non-salt movers is stop 7.
6. **Per-row numbers.** `npx jiti $T/render-diff.mts salt/<slug>…` on every salt row and the
   5 embed rows; record structural/numeric in `fixtures.md`.
7. **Journal movers:** one row per riser, loss or `dotEqual` flip, with its mechanism.
8. **Pin** (from batch 4 on): every salt fixture that is survey-conformant, render-diff 0/0,
   routed SALT and not yet pinned goes into `oracle/goldens/svg-salt/` through T0b's pin path;
   update fallen `diff-baseline.json` rows from a fresh measurement. Embed rows in the class /
   unknown trees pin through `$T/pin-goldens.mts --tree <class|unknown> sep-bN close-bN …`.
   Bump the routing/refusal count constants with a derivation comment (`tests/oracle/
   svg-conformance/{routing-conformance,refusal-coverage}.test.ts`). Run ratchet, routing,
   refusal tests.
9. **Dashboard** `npm run parity:dashboard`; `npm run catalog` if exports changed.
10. **Ledger + ticks.** `fixtures.md` finals; tick the batch in `README.md` and its overview.
11. **Commit.** Full `npm test` again if pins changed, then
    `chore(sep-bN): close batch N — salt <conformant>/51`. Body: counts before → after, pins,
    risers' mechanisms, non-salt movers.

## Batch-4 extras
Group every non-conformant salt row into families by mechanism (instrument first; memory
"measurement artifacts outnumber defects"). Write `batch-5/overview.md` and one task spec
per family in the batch-2 format, with disjoint write-sets.

## Write-set
`$M/**`, `decision-journal.md`, `fixtures.md`, `README.md`, `batch-*/overview.md`, batch-5
specs, `oracle/goldens/svg-salt/**`, `oracle/goldens/svg-class/**` (embed pins),
`oracle/goldens/svg-conformance/{routing,refusal}-baseline.json`, the two gate tests'
counts, `tests/oracle/svg-conformance/parity-*.json`, `docs/parity-report.md`,
`docs/catalog.md`, style-only formatting commits.

## Acceptance
- Given the gates on the full suite, then all four pass and collected = on-disk.
- Given the all-engine diff, then every mover has a journal row with a mechanism.
- Given the salt golden ratchet, then it holds no fixture that is not conformant and 0/0.
