# Batch close (orchestrator)

`$M` = `plans/activity-error-page-parity/measurements/`; `N` = batch label;
`prev` = previous close's dir (`b0` for batch 1).

0. **Clean checkout.** `test -z "$(git status --porcelain)"` and
   `git stash list` empty before every merge.
1. **Merge** each task branch `--no-ff` into the mission branch. Resolve a
   `docs/catalog.md` conflict with `npm run catalog`. Remove worktrees/branches.
2. **Four gates** (README) + the full conformance/activity/architecture set +
   typecheck. Collected = on-disk.
3. **Survey all engines:** `$M/survey-all.sh $M/bN-eng`;
   `python3 $M/engdiff.py $M/<prev>-eng $M/bN-eng`. Every mover journalled
   with its mechanism. Conformant loss → stop 4.
4. **Re-pin** only when a batch moved activity bytes: copy the four
   `oracle/goldens/svg-activity/*-baseline.json` to `/private/tmp/claude-501/aepp/pre-bN/`,
   `npx tsx scripts/repin-activity-baselines.ts --write`, diff the JSON (any
   pin that ROSE gets a journal row or the re-pin is reverted), then
   `python3 $M/census-away.py /private/tmp/claude-501/aepp/pre-bN` (stop 5).
5. **Journal** a `close` row: counts per engine, gates, collected count.
6. Tick the batch in README.md; commit `chore(aepp-bN): close batch N`.
