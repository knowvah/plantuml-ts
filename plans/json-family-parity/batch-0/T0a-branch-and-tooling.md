# T0a — branch and tooling

Agent: orchestrator (no worktree). Commit: `chore(jfp): mission brief and tooling (T0a)`.

## Steps
1. `git status` clean apart from this brief and `.plan-mission-progress.md`
   (deleted by plan-mission Phase 8). `git checkout main && git pull --ff-only`
   → `7d08a6592`; `git checkout -b feat/json-family-parity`.
2. Copy from `plans/json-style-engine/` with `jse` → `jfp` and the plan path
   changed: `measurements/{gates,chain,mkwt,merge-one}.sh`,
   `measurements/vitest.config.mts`, `measurements/pin-json-family{.mts,.test.mts}`,
   `measurements/repin-family-routing.mts`,
   `tools/{diff-one.mts,verdict-diff.mjs,extended-baseline.mts,extended-baseline.test.mts}`.
   `mkwt.sh` branches `jfp/<Tn>` off `feat/json-family-parity` into
   `.claude/worktrees/jfp-<Tn>` and symlinks the same gitignored paths jse's did
   (`test-results/dot-cache` is tracked, so worktrees have the oracles).
   `merge-one.sh` adds `json-family-positional.test.ts` to its ratchet list at
   the b0 close, once the pin is seeded.
3. `cp plans/json-family-parity/settings.autonomous.json .claude/settings.autonomous.json`.
4. `npx vitest run --config $M/vitest.config.mts` green (pin + baseline tool tests).
5. `bash $M/gates.sh b0`; `cp dist/plantuml-ts.d.ts $M/b0-plantuml-ts.d.ts.txt`;
   `npx tsx $T/extended-baseline.mts --write $M/extended-baseline.json`;
   chain `b0-eng` (all 28 engines).
6. Commit the brief and tooling with explicit paths; `$M/b0-eng/` lands in the close.

## Acceptance
- Given main `7d08a6592`, when T0a finishes, then `git merge-base main HEAD` is `7d08a6592` and `git diff HEAD` is empty.
- Given `npx tsx $T/diff-one.mts json bavize-88-jumu158 --structural`, then it prints 0 diffs (positional-only row).
- Given `$M/b0-eng/`, then it holds a `parity-<engine>.json` per `test-results/dot-cache/` directory, and json/yaml/hcl read 14/7/1 conformant.
- Given `extended-baseline.mts --check $M/extended-baseline.json` on an unchanged tree, then 0 MOVED.

Observability: N/A. Rollback: Reversible (delete the branch).
