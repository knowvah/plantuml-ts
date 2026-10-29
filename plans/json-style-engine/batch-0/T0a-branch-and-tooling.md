# T0a — branch and tooling

Agent: orchestrator (no worktree). Commit: `chore(jse): mission brief and tooling (T0a)`.

## Steps
1. `git status` clean apart from this brief and `.plan-mission-progress.md`
   (deleted by Phase 8) and the uncommitted `docs/architecture/` refresh (moved
   to its own `docs/architecture-refresh` branch first — push-forward rule).
   `git checkout main && git pull --ff-only` → `d0d37ec18`;
   `git checkout -b feat/json-style-engine`.
2. Copy from `plans/data-diagram-conformance/` with `ddc` → `jse`, the plan path
   changed: `measurements/{gates,chain,mkwt,merge-one}.sh`,
   `measurements/vitest.config.mts`, `measurements/pin-json-family{.mts,.test.mts}`,
   `measurements/repin-files-routing.mts` → `repin-family-routing.mts` (its
   `--type` argument; drop `files` from the default, require `--type`),
   `tools/{diff-one,verdict-diff}.mjs|mts`. `merge-one.sh` runs the json/yaml/hcl
   golden ratchets, `json-family-structural.test.ts` and
   `extensions.ratchet.test.ts`; `mkwt.sh` branches `jse/<Tn>` off
   `feat/json-style-engine` into `.claude/worktrees/jse-<Tn>`.
3. `cp plans/json-style-engine/settings.autonomous.json .claude/settings.autonomous.json`.
4. `npx vitest run --config $M/vitest.config.mts` green (pin tool tests).
5. `bash $M/gates.sh b0`; `cp dist/plantuml-ts.d.ts $M/b0-plantuml-ts.d.ts.txt`
   (`.txt`: lint-staged runs typed eslint on `.d.ts`); chain `b0-eng` (all 28 engines).
6. Commit the brief and tooling with explicit paths; `$M/b0-eng/` lands in the close.

## Acceptance
- Given main `d0d37ec18`, when T0a finishes, then `git merge-base main HEAD` is `d0d37ec18` and `git diff HEAD` is empty.
- Given `npx tsx $T/diff-one.mts json theme-cerulean --structural`, then it prints 23 diffs (the plan's count).
- Given `$M/b0-eng/`, then it holds a `parity-<engine>.json` per `test-results/dot-cache/` directory.

Observability: N/A. Rollback: Reversible (delete the branch).
