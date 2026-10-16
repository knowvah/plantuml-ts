# Standard batch close (batches 1–3)

Agent: the orchestrator. `N` = batch; `prev` = previous close (`b0` first).
`$M` = `plans/description-url-wrappers/measurements/`, `$T` = `plans/class-divergence-drive/tools/`.

## Steps
1. **Merge.** `git status` on the mission checkout must be clean (a dirty main checkout after an agent
   run means Serena wrote it: move the change to its branch and journal it; unattributable = stop 9).
   Verify each branch in its worktree (targeted vitest + collected count), read `<worktree>/Tn-report.md`
   and copy it to `$M/Tn-report.md`. Merge `--no-ff` in dependency order; a `docs/catalog.md` conflict
   resolves with `git checkout --theirs docs/catalog.md && npm run catalog`. Remove worktrees and branches.
2. **Formatting.** `npx prettier --check` on every `.ts/.mts/.md/.json` changed since the batch base.
3. **Gates.** `bash $M/gates.sh bN` in the background; collected must equal on-disk (stop 9). On
   timeouts, grep "timed out" first. Typecheck before committing anything.
4. **Survey.** `bash $M/chain.sh bN-eng` (never the positional-only survey form). No merges into the
   main checkout while it runs. Re-run any engine with `timeout` verdicts before diffing.
5. **Diff.** `node $M/diff-eng.mjs $M/<prev>-eng $M/bN-eng > $M/bN-movers.txt`. A conformant loss is
   stop 4; a class/object/state `dotEqual` flip is stop 5. Every other mover gets a journal row with a
   mechanism (attribute by task: each task carried its own surveys).
6. **Census.** `npx tsx scripts/svg-conformance-census.ts component --json $M/bN-census.json` and the
   same for usecase (`$M/bN-usecase-census.json`); `--per-fixture`/`--families` to `.txt`. Record Σ,
   zero-diff, buckets. List every row whose count ROSE vs `prev`, each with a mechanism (stop 6).
7. **Targets.** Render-diff every row in `fixtures.md` into `$M/bN-rd/` and fill the batch column.
8. **Journal and commit.** SLIs against b0 (conformant per engine, census, target rows, pins), one row
   per mover/riser/flip with its mechanism. Tick the batch in `README.md` and its overview. Commit
   `chore(dur-bN): close batch N — <headline counts>`.

Pins run once, at T6 (`batch-4/T6-remeasure-repin.md`).

## Write-set
`$M/**`, `decision-journal.md`, `fixtures.md`, `README.md`, `batch-*/overview.md`.

## Acceptance
- Given the gates, then all four pass and collected = on-disk.
- Given the all-engine diff, then losses = 0 and every mover has a journal row with a mechanism.
- Given the census, then every risen row has a mechanism.
