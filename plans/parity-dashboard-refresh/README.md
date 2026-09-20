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
| [2](batch-2/overview.md) | T5 capture five families, re-pin routing/refusal, freshness sentinels | orchestrator, sequential | [ ] |
| [3](batch-3/overview.md) | T6 unified dashboard + drift test | 1 agent | [ ] |
| [4](batch-4/overview.md) | T7 regenerate everything · T8 bookkeeping | orchestrator then 1 agent | [ ] |

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
