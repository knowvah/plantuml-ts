# T0a — branch and tooling

Agent: orchestrator (no worktree). Commit: `chore(gdd): mission brief and tooling (T0a)`.

## Steps
1. `git status` clean. `git checkout main && git pull --ff-only` → `01fe0c79b`
   (PR #94 merged). `npm ci` (dependabot bumped typescript-eslint and vite).
   `git checkout -b feat/gantt-divergence-drive`.
2. Tooling, copied from `plans/gantt-engine-port/` with `gep` → `gdd` and the
   plan path changed: `measurements/{gates,chain,mkwt,merge-one}.sh`,
   `measurements/{pin-gantt,pin-gantt.test,repin-gantt-baseline,repin-gantt-routing,vitest.config}.mts`,
   `tools/verdict-diff.mjs`. `mkwt.sh` branches `gdd/<Tn>` off
   `feat/gantt-divergence-drive` into `.claude/worktrees/gdd-<Tn>`.
3. `tools/diff-one.mts`: renders `<slug>` (corpus `test-results/dot-cache/gantt/<slug>/in.puml`
   or authored `tests/fixtures/gantt/<slug>.puml`) through `renderFixtureGantt`
   + `ganttRenderOptions` with `DeterministicMeasurer`, runs `compareSvg`
   against the oracle, prints the diff list and both `<svg>` headers. Model:
   `plans/sequence-divergence-drive-3/tools/diff-one.mts`.
4. `cp plans/gantt-divergence-drive/settings.autonomous.json .claude/settings.autonomous.json`.
5. After the build gate in T0b: `cp dist/plantuml-ts.d.ts $M/b0-plantuml-ts.d.ts`.
6. Commit the brief directory and tooling with explicit paths.

## Acceptance
- Given origin/main `01fe0c79b`, when T0a finishes, then `git merge-base main HEAD` is `01fe0c79b`, the brief is committed and `git diff HEAD` is empty.
- Given `npx tsx $T/diff-one.mts xureco-57-lene839`, then it prints 3 diffs, all `svg/g/path/@style`.

Observability: N/A. Rollback: Reversible (delete the branch).
