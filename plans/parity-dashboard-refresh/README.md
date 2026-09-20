# parity-dashboard-refresh

**Objective.** Regenerate the parity dashboard (stale since 2026-07-18 /
2026-07-31) and make it cover every diagram type: one unified per-type
matrix at `docs/parity-report.md` (the path plantuml.knowvah.com/parity
already publishes), composed from committed JSON, with `n/a (<reason>)` in
every cell no artifact can fill. Along the way: survey and census every
cached type, capture the jar oracle for the five engine-bearing types that
never had one (board, chart, chronology, files, packet), and add a drift
test so the report can never silently go stale again.

**Branch:** `feat/parity-dashboard-refresh` off `main` (`a012be16`).
Merge with a merge commit, never squash.

**Model:** `claude-fable-5-1` for execution; task agents on `sonnet`.

## Read first

- [`decisions.md`](decisions.md) — D1–D10, all locked.
- [`decision-journal.md`](decision-journal.md) — append every judgment call.
- Memory hazards that bite this mission: a new `dot-cache/<type>/` tree
  turns `routing-conformance` and `refusal-coverage` RED on contact (re-pin
  BEFORE the capture commit, orchestrator-only); any `timeout` survey row is
  a defect; `vitest run <paths>` can collect zero tests — check the
  collected-file count; `coverage/.tmp` can silently under-collect.

## Batches

| Batch | Tasks | Mode | Status |
|---|---|---|---|
| [1](batch-1/overview.md) | T1 capture script · T2 census `--json` + activity · T3 survey/dashboard all types · T4 DOT rows n/a + export | 4 parallel agents (separate worktrees) | [x] |
| [2](batch-2/overview.md) | T5 capture five families, re-pin routing/refusal, freshness sentinels | orchestrator, sequential | [x] |
| [3](batch-3/overview.md) | T6 unified dashboard + drift test | 1 agent | [x] |
| [4](batch-4/overview.md) | T7 regenerate everything · T8 bookkeeping | orchestrator then 1 agent | [x] |

Batch 3 needs T2, T3, T4. Batch 4 needs T5 and T6.

## Quality gates (run after every batch)

```
- command: npm test
  pass: exit 0, and the vitest summary reports the same file count ±new
        files (a lower count means coverage/.tmp under-collected — rerun)
  on_fail: fix_and_rerun
- command: npm run typecheck
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run lint
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run build
  pass: exit 0
  on_fail: fix_and_rerun
- command: git diff --name-only <batch-base>..HEAD
  pass: every path is in the batch's declared write-set
  on_fail: stop
```

Baseline at planning time (2026-09-20, `a012be16`): recorded in
`decision-journal.md` row 0 once Phase 8 finishes.

## Stop conditions

1. A task needs a file outside its write-set that no task owns.
2. Two consecutive failures of the same gate.
3. A change would contradict D1–D10.
4. The jar misbehaves on the five new families beyond the two documented
   findings (exit 200 with output written; a named block writes
   `<name>.svg` instead of `in.svg`).
5. Any `timeout` row in a survey after one re-run at
   `SVG_PARITY_CONCURRENCY=2`.
6. A routing/refusal re-pin would flip an EXISTING `agree`/`ok` entry
   (diff the baseline JSON before committing).
7. A golden ratchet goes red because of the D4 survey layout change.
8. Census (activity now dispatched) disagrees with the committed activity
   `diff-baseline.json` by more than the error cohort.
9. The drift test cannot be made deterministic after sourcing every date
   from the artifacts.

## Push-forward conditions

- New word needed in the D8 `n/a` vocabulary (log it).
- Column order, table formatting, section ordering.
- One more informational field in the census JSON.
- Fewer than 41 captured because a manifest entry is a jar error page
  (record `jar-error`, as activity did).
- Freshness sentinel slug choice.
- Minor/patch dependency bump.
- A task is simpler than specced (log why).

## Diagrams

- [`diagrams/data-flow.md`](diagrams/data-flow.md) — producers → JSON →
  dashboard → docs site.
- [`diagrams/component-map.md`](diagrams/component-map.md) — scripts,
  artifacts and tests touched.

## Commit discipline

One commit per task, `type(pdr-TN): …`, per `~/.claude/rules/commits.md`.
Fix commits reference the task: `fix(pdr-T3): …`. No attribution lines.

## Session summary (2026-09-20)

**Tasks:** 8 of 8 planned completed (T1–T8), plus two fix commits
(`fix(pdr-T4)` hermetic row tests; `fix(pdr-T7)` five families non-svek),
one `style(pdr)` commit and per-batch bookkeeping commits. 18 commits on
`feat/parity-dashboard-refresh` over `a012be16`.

**Decisions:** 29 journal rows. Flagged for review: row 15 (T5 write-set
widened to the two gate test files, per the activity T0b precedent),
row 12 (T6 reads DOT rows from committed `dot-parity.json`, not a live
call — D2/D9), row 16/22 (chronology's oracle is the jar's own
unsupported-diagram page; `PSystemBuilder.java:184`), row 20 (D8 gains
`no data-diagram-type classification` and `no diff-baseline yet`), rows 11
and 28 (worktree/agent-tooling hazards).

**Quality gates (final, `00b39d73`):** `npm test` 734 files passed / 1
skipped, 20194 tests, coverage 96.14 / 91.56 / 97.26 / 97.11 (baseline
96.00 / 91.37 / 97.08 / 96.97); typecheck 0; lint 0; build 0. Every batch
gate re-run from scratch after its fix.

**Headline:** `docs/parity-report.md` regenerated at `9f095acc` — 28 rows,
zero bare `n/a`; five families captured for the first time (41 fixtures,
0 jarFailed); routing 3402/139/31 over 3572 and refusal 3572/31/105/3467,
both additive; 16 per-type surveys with zero timeouts; 11 censuses.

**Known issues / follow-ups:**
- 40 `known-misroute` pins share one mechanism: board, chart, files and
  packet renderers return no `diagramType` (`.agent-notes/pdr-T5.md`); a
  one-line change per engine closes them.
- chronology cannot be measured against this jar (no factory upstream);
  its freshness sentinel flips when a supporting jar is pinned.
- `svg-parity-dashboard.ts` / `svg-parity-survey.ts` were prettier-warned
  on main before this mission and remain so.
- The survey's per-fixture timeout is load-sensitive (journal row 24);
  run producers alone. Stop 5 never triggered on a quiet box.
- Worktree recipe corrections and the Serena-root hazard are in
  `.agent-notes/pdr-batch1-worktrees.md` and the `batch-parallelism-needs-worktrees` memory.
