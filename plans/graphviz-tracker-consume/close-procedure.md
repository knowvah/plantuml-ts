# Close procedures (orchestrator)

`$M` = `plans/graphviz-tracker-consume/measurements/`. `prev` = the previous close's tag (`b0` first).

## A. Per-task close (description lane, after each task)
1. `git status` must be clean apart from the task's commit and `Tn-report.md`. Read the report, then copy it
   to `$M/Tn-report.md`.
2. `bash $M/rd.sh Tn`: target rows. Record them in [fixtures.md](fixtures.md).
3. Survey every tree the task's report names, plus every tree containing a target row:
   `npm run -s svg:survey -- <tree> --out $M/Tn-eng/parity-<tree>.json`. Copy the other engines' files
   from `prev` and run `node $M/diff-eng.mjs $M/<prev>-eng $M/Tn-eng`. A conformant loss is stop 3.
4. Re-pin per D6. Diff the baseline JSONs (`git diff --stat oracle/goldens`, then inspect each
   changed pin). Any pin that rose is stop 4.
5. Census for the tree: `npx tsx scripts/svg-conformance-census.ts <tree> --json $M/Tn-<tree>-census.json`.
   List every row and attribute moving away from the jar since `prev`, each with a mechanism.
6. If every fixture named in a TRACKER entry is conformant (D2), tick it with the dated note.
   Otherwise append a dated measurement line to the entry.
7. Journal one row per mover/riser/tick, then commit
   `chore(gtc-Tn): close Tn — <headline>`. Write-set: `$M/**`, `fixtures.md`, `decision-journal.md`,
   `docs/graphviz-issues/TRACKER.md`, pins, `README.md`, `batch-*/overview.md`.

## B. Lane close (state lane, after T8)
1. Verify in the worktree: targeted vitest (collected count), `npm run typecheck`, `npx prettier --check`
   on the changed files. Read and copy `S-report.md` / `T7a`/`T7b`/`T8` reports into `$M/`.
2. Check the main checkout is clean. A dirty main checkout after an agent run means Serena wrote it: move
   the change to its branch and journal it; unattributable is stop 9.
3. `git merge --no-ff gtc/S`. A `docs/catalog.md` conflict resolves with
   `git checkout --theirs docs/catalog.md && npm run catalog`. Remove the worktree and branch.
4. Then run steps A.2–A.7 with tag `S` and the tree `state` (and the full set if T8 touched a shared path).

## C. Full close (T9)
`bash $M/gates.sh final` in the background; collected must equal on-disk. Then `bash $M/chain.sh final-eng`
(no merges while it runs; re-run any engine with `timeout` verdicts), and
`node $M/diff-eng.mjs $M/b0-eng $M/final-eng`.
