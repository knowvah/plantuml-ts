# unknown-bucket-routing-repair

**Objective.** Land the 825 `unknown`-bucket jar oracles under
`test-results/dot-cache/unknown/` with both routing and refusal baselines
pinned, and repair the routing/refusal defects the measured disagreements
reveal — so the dashboard's `unknown` row shows numbers and the routing gate's
misroute set shrinks rather than grows. Every one of the 157 disagreements ends
as a **fix** (the fixture lands on the jar's engine) or a **pin** whose reason
names the refusing line and the upstream Command or factory as `File.java:line`.

**Branch:** `feat/unknown-bucket-routing-repair` off `main` (`19b0d90b`).
Merge with a merge commit, never squash.

**Model:** `claude-fable-5-1` executes; task agents on `sonnet`
(`typescript-pro`; `documentation-engineer` for T15 — it has Edit,
`technical-writer` does not).

## Read first

- `~/.claude/rules/autonomous-execution.md` (startup sequence, gates, journal).
- [`decisions.md`](decisions.md) — D1–D10, all locked.
- [`decision-journal.md`](decision-journal.md) — append every judgment call.
- [`measured-at-base.json`](measured-at-base.json) — the 825 fixtures measured
  through the gates' seams at `19b0d90b`; [`cohorts/`](cohorts/) splits it per
  task. Do not re-derive by guessing; re-MEASURE when a fix lands (D3).
- The renders are PARKED at `test-results/dot-cache-unknown-2026-09-20/`
  (gitignored). Moving them under `dot-cache/` turns both gates red until
  pinned; only T14 moves them (D6).
- Hazards that bit the last three missions: a whole-dir symlink of
  `test-results/` lands inside the committed cache — link its CHILDREN; Serena
  edit tools write to the MAIN checkout from a worktree — reads only, absolute
  paths; `vitest run <paths>` can collect zero files — check the count; survey
  `timeout` rows are load artifacts — run producers alone.

## Batches

| Batch | Tasks | Mode | Status |
|---|---|---|---|
| [0](batch-0/overview.md) | T0 pin generator · T1 settled ledger (668 rows) | 2 agents, worktrees | [ ] |
| [1](batch-1/overview.md) | T2–T6 diagnosis, one per jar-type cohort (157 rows) | 5 agents, worktrees, read-only on `src/` | [ ] |
| [2](batch-2/overview.md) | T7–T12 fixes by seam · T13 dashboard `unknown` row | up to 7 agents, worktrees, disjoint seams | [ ] |
| [3](batch-3/overview.md) | T14 pin + move + regenerate · T15 bookkeeping | orchestrator, then 1 agent | [ ] |

Batch 2's fixture-to-seam assignment is decided by the orchestrator from
batch 1's ledger fragments (journal it); a seam with no fixtures is skipped.

## Quality gates (after every batch)

```
- command: npm test
  pass: exit 0; vitest file count ≥ previous batch's count + new files
        (lower means coverage/.tmp under-collected — rerun)
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

Baseline at planning (2026-09-20, `19b0d90b`): 735 test files, 21204 tests,
coverage 96.14/91.58/97.27/97.11; routing 3424/987/73 over 4484 (censused
986); refusal 4484/73/237/4247, gaps 133; typecheck, lint, build 0.

## Stop conditions

1. A task needs a file outside its write-set that no task owns.
2. Two consecutive failures of the same gate.
3. A change would contradict D1–D10.
4. A fix flips any EXISTING `agree` pin in `routing-baseline.json`, or turns
   any existing `ok` refusal row into an error (the gate names the slug).
5. A fix lands a fixture on a third engine — neither the jar's nor the one it
   was on (D3).
6. The generator, or `git diff --numstat`, shows a deletion in either
   baseline beyond the single `$comment` line.
7. Any `timeout` survey row after one re-run at `SVG_PARITY_CONCURRENCY=2`,
   run alone.
8. A diagnosis finds a cohort whose fix touches a shared seam AND a second
   engine's parser at once — an undeclared cross-seam dependency
   (`routing-heuristic-repair` found three).
9. `npm test` wall-clock more than 2× the planning baseline.
10. The drift test cannot be made green by regeneration alone.

## Push-forward conditions

- A cohort collapses to fewer mechanisms than estimated (log it).
- A fix-candidate exceeds D2's size bar and becomes a pin naming the upstream
  command (log the size).
- A batch-2 seam has no fixtures (skip it, journal it).
- Wording of reasons, table formatting, section order.
- A new D8 word is needed (log it).
- The `unknown` freshness-sentinel slug.
- A minor or patch dependency bump.

## Diagrams

- [`diagrams/data-flow.md`](diagrams/data-flow.md) — measurement → ledger →
  generator → baselines → gates → dashboard.
- [`diagrams/component-map.md`](diagrams/component-map.md) — seams, tools,
  artifacts touched.

## Commit discipline

One commit per task, `type(ubrr-TN): …`, per `~/.claude/rules/commits.md`;
fix commits `fix(ubrr-TN): …`. No attribution lines. T14 is ONE commit
(pins + tree + regenerated artifacts) so no commit is ever red.
