# T0a — branch and tooling

Agent: orchestrator (no worktree). Commit: `chore(jff): mission brief and tooling (T0a)`.

## Steps
1. `git status` clean apart from this brief. `git checkout main && git pull --ff-only`
   → `b9b309894`; `git checkout -b feat/json-family-followons`.
2. Copy from `plans/json-family-parity/` with `jfp` → `jff` and the plan path
   changed (30 references; `grep -rn 'json-family-parity\|jfp' $M $T` must
   print nothing afterwards except provenance comments):
   `measurements/{gates,chain,mkwt,merge-one,close-measure}.sh`,
   `measurements/vitest.config.mts`, `measurements/pin-json-family{.mts,.test.mts}`,
   `measurements/repin-family-routing.mts` (its `MISSION` constant),
   `tools/{diff-one.mts,verdict-diff.mjs,residue.mts,extended-baseline.mts,extended-baseline.test.mts}`.
   `mkwt.sh` branches `jff/<Tn>` off `feat/json-family-followons` into
   `.claude/worktrees/jff-<Tn>` with jfp's symlinks.
3. `cp plans/json-family-followons/settings.autonomous.json .claude/settings.autonomous.json`.
4. `npx vitest run --config $M/vitest.config.mts` green (pin + baseline tool tests).
5. `bash $M/gates.sh b0`; `cp dist/plantuml-ts.d.ts $M/b0-plantuml-ts.d.ts.txt`;
   `npx tsx $T/extended-baseline.mts --write $M/extended-baseline.json`;
   `npx tsx $T/residue.mts --all --json $M/b0-residue.json`;
   chain `b0-eng` (all 28 engines).
6. Commit the brief and tooling with explicit paths; `$M/b0-eng/` lands in the close.

## Acceptance
- Given main `b9b309894`, when T0a finishes, then `git merge-base main HEAD` is `b9b309894` and `git diff HEAD` is empty.
- Given `$M/b0-eng/`, then it holds a `parity-<engine>.json` per `test-results/dot-cache/` directory, and json/yaml/hcl read 14/7/1 conformant.
- Given `$M/b0-residue.json`, then its corpus rows equal `oracle/goldens/json-family-positional.json` (70 rows) within the 0.001 print precision.
- Given `extended-baseline.mts --check $M/extended-baseline.json` on an unchanged tree, then 0 MOVED.

Observability: N/A. Rollback: Reversible (delete the branch).
