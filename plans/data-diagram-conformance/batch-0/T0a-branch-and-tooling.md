# T0a — branch and tooling

Agent: orchestrator (no worktree). Commit: `chore(ddc): mission brief and tooling (T0a)`.

## Steps
1. `git status` clean (only `.plan-mission-progress.md` may be untracked;
   delete it — Phase 8 did). `git checkout main && git pull --ff-only` →
   `10aa35c6b`. `git checkout -b feat/data-diagram-conformance`.
2. Tooling, copied from `plans/gantt-divergence-drive/` with `gdd` → `ddc`,
   `gantt` → the family, and the plan path changed:
   `measurements/{gates,chain,mkwt,merge-one}.sh` (`merge-one.sh` runs
   `json|yaml|hcl|files.golden.ratchet.test.ts`, `files.authored.ratchet.test.ts`
   and `json-family-structural.test.ts`), `measurements/vitest.config.mts`,
   `tools/verdict-diff.mjs`. `mkwt.sh` branches `ddc/<Tn>` off
   `feat/data-diagram-conformance` into `.claude/worktrees/ddc-<Tn>`.
3. `measurements/pin-json-family.mts <json|yaml|hcl> <slug>... [--write]`:
   `pin-gantt.mts` with the type as first argument (`CACHE_DIR =
   test-results/dot-cache/<type>`, goldens `oracle/goldens/svg-<type>`,
   accepted-id prefix `svg-<type>/`, stock-error prefix `<type>/`), same
   refusals, dry-run by default, plus its `.test.mts`.
   `measurements/pin-files.mts` = the same for `files`.
   `measurements/repin-files-routing.mts [--write]` = `repin-gantt-routing.mts`
   for `files` / `svg-files` (no capture clock: files has none).
4. `tools/diff-one.mts <type> <slug> [--structural]`: corpus
   `test-results/dot-cache/<type>/<slug>/in.puml` or authored
   `tests/fixtures/<type>/<slug>.puml`; json/yaml/hcl through
   `renderFixtureJson(markup, new DeterministicMeasurer())`, files through
   `renderFixtureFiles` (T0b; until it lands, `renderSync` with
   `withJarCompatibleStyleInput`); `compareSvg(..., 'deterministic')`;
   `--structural` filters with `isPositionalDiff` from
   `json-family-structural.ts`; prints diffs and both `<svg>` headers.
5. `cp plans/data-diagram-conformance/settings.autonomous.json .claude/settings.autonomous.json`.
6. `bash $M/gates.sh b0`; `cp dist/plantuml-ts.d.ts $M/b0-plantuml-ts.d.ts`;
   `LOAD_MAX=8 … bash $M/chain.sh b0-eng` (all 28 engines; the baseline every
   later `verdict-diff` compares against).
7. Commit the brief directory and tooling with explicit paths.

## Acceptance
- Given origin/main `10aa35c6b`, when T0a finishes, then `git merge-base main HEAD` is `10aa35c6b`, the brief is committed and `git diff HEAD` is empty.
- Given `npx tsx $T/diff-one.mts json tivuru-65-vezu313 --structural`, then every printed diff is `svg/g[]/path[]/@d` (the T1a symptom); given `--structural` on `json/bidire-98-kege137`, then 0.
- Given `$M/b0-eng/`, then it holds a `parity-<engine>.json` per `test-results/dot-cache/` directory and `b0-npm-test.log` says collected = on-disk.

Observability: N/A. Rollback: Reversible (delete the branch).
