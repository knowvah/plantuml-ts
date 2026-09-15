# Decision journal — `activity-lane-capture`

Appended during execution. One row per non-trivial judgment call: if a
reasonable developer might have chosen differently, log it. Every riser gets
a row BEFORE its commit (stop 5).

Log the execution plan here at startup (autonomous mode replaces the
user-review step with this entry — `rules/parallelism.md`).

| Date | Task | Decision | Rationale | Evidence |
|---|---|---|---|---|
| 2026-09-15 | plan | Execution plan: B0 (T0a→T0b) → B1 T1 → B2 (T2→T3) → B3 T4 → B4 T5 → B5 T6 → B6 T7 → B7 T8. Gates + write-set diff after every batch; probe `--json` vs `measurements/base.json` after T3–T7. | Autonomous mode logs the plan instead of a user review (`rules/parallelism.md`). | README Index |
| 2026-09-15 | B0, B2 | Serialize the "parallel" pairs: T0a then T0b in one `typescript-pro` agent (two commits); T2 then T3 sequentially. | One checkout shares the git index, `docs/catalog.md` and coverage/.tmp; worktrees would each need `npm install` (memory `batch-parallelism-needs-worktrees`). Write-sets stay as briefed. | batch-0/overview.md, batch-2/overview.md |
| 2026-09-15 | T0b | Accept: `repin-activity-baselines.ts` re-measures four files and prints `SKIP diff-census.json`. | No activity diff-census gate or census function exists in `tests/`; D4 forbids re-deriving a measurement. T8 edits `diff-census.json` by hand, as prior missions did. | `27597c3b`; header of `scripts/repin-activity-baselines.ts` |
| 2026-09-15 | T0b | Accept: style census logic duplicated from `activity.style-baseline.test.ts`, not imported. | Its `censusOf` lives inside the `.test.ts` (top-level `describe` throws outside vitest); same precedent as `repin-sequence-baselines.ts` duplicating `weErroredIn`. Risk: drift between copies — T8 must see 0 CHANGED on unchanged slugs. | `27597c3b` |
| 2026-09-15 | B0 gate | PASS. Orchestrator re-ran: probe aggregate 52954, subsetSum 11783 / 40, 0 risers/fallers; re-pin dry run 0 changes, exit 0; `npm test` 709 passed + 1 skipped (710); typecheck, lint, build exit 0. Write-sets: T0a 2 files, T0b 2 files + `.agent-notes/alc-T0b.md`. | — | `ffd2634a`, `27597c3b` |
| 2026-09-15 | B0 | Untracked `plans/activity-lane-capture/{.mcp.json,.serena/,.agent-notes/.gitkeep,.gitignore}` appeared at 14:11 — a Serena scaffold from the working directory moving into the brief dir. Not staged, not deleted. | Tooling residue outside every write-set; nothing on the branch references it. | `.serena/project.yml` `project_name: activity-lane-capture` |
