# activity-divergence-drive (add1)

**Read first, every start and after every compaction:**
`~/.claude/docs/reference/autonomous-execution.md`, then this file, then
`decisions.md`, then the current batch's `overview.md`. Tail
`decision-journal.md` for where you stopped.

## Objective

Put the first activity fixtures into a byte-frozen golden ratchet. Activity is
0 of 373 conformant today; the class family went 412 → 982 over seven drives
with exactly this shape. add1 (a) builds the freeze gate activity lacks, (b)
lands the systemic mechanisms every fixture shares — canvas origin, text
emission through the klimt driver, stop/end circles, `strictuml` arrowheads —
and (c) runs two per-fixture drive rounds on the closest cohort, pinning every
fixture that reaches zero-diff. Target: **≥ 30 activity pins** (D10).

Starting state (main `d4e29cc8c`, clean, 2026-09-30; `measurements/plan-*.json`):
- survey 0 conformant / 4 structural-match / 369 diverged of 373;
- diff-baseline 311 `baseline` / 39 `error` / 23 `jar-error`; Σ weightedScore
  **60988**; `ratchet.json` empty; no `activity.golden.ratchet.test.ts`;
- cohort ws ≤ 100: **75 rows** (`fixtures.md`); ≤ 50: 39; ≤ 20: 9;
- all 311 carry `svg/@width|height|viewBox` diffs (one mechanism, D2).

Batch 0's b0 (`measurements/b0.json`, `b0-eng/`) is the reference for every
"loss" and "rise". `measurements/plan-*.json` are planning-time only.

## Branch

`feat/activity-divergence-drive` off main. Merge commit at close (never squash;
the journal cites per-task commits). **Never push** anything: not main, not the
plantuml fork, not dot-engine. `plans/` is tracked — commit the brief.

## Quality gates (all four before any commit lands on the branch)

```sh
npm test -- --maxWorkers=6 --reporter=default --reporter=json --outputFile.json=<path>
npm run typecheck
npm run lint
npm run build
```
Collected (JSON reporter) must equal `find tests -name '*.test.ts' | wc -l`.
Check load first (`uptime`); above ~10 wait. New src module ⇒ `npm run catalog`.

Measurement (activity has NO DOT gate — it never emits `svek-N.dot`):
- Survey: `npm run svg:survey -- activity --out <path>` (never positional).
- Probe: `npx tsx scripts/activity-probe.ts --json <path>` (Σ weightedScore,
  per-row scores); `--dump <slug>`, `--align <slug>`.
- Classify: `npx tsx scripts/activity-probe-classify.ts --json <path>` (T0a).
- Oracle renders: `scripts/oracle-render.sh <out-dir> <puml>` only.
- `$T` = `plans/activity-divergence-drive/tools/`: `pin-goldens.mts` (T0b).
- Batch close: [close-procedure.md](close-procedure.md).

## Stop conditions (halt, journal, report)

1. A task needs a file another task in the same batch owns.
2. The same gate fails on 2 consecutive fix attempts, or one code location
   changes 3 times without resolving the same check.
3. A finding contradicts D1–D11: amend `decisions.md`, then halt.
4. A conformant fixture in **any** engine leaves conformant without a stated
   mechanism (all-engine survey at every close).
5. A `weightedScore` rise on any un-pinned activity row with no mechanism (a
   structural fall beside a numeric rise is a reveal, not a stop).
6. A pinned activity golden stops being byte-equal.
7. Collected ≠ on-disk after a `--maxWorkers=6` rerun, or a survey timeout at
   load below 8.
8. Any edit under `src/core/klimt/**`, `~/git/knowvah/dot-engine`, or the
   plantuml fork; any push.
9. Any change to the oracle jar or cached oracle bytes.
10. Signing any entry in `oracle/accepted-divergences.json` (D8: none).
11. A public API change (`renderSync`/`render`/`renderAll` signatures or
    exported option types).
12. T1a's margin mechanism not isolated with a Java quote inside the 2-fix
    budget (D2) — halt with the ruled-out list; never a retuned constant.
13. A fitted constant: any numeric change without an upstream `file:line` in
    the same commit.
14. More than 30 non-activity movers at a close.
15. Counting an `error` row that starts rendering as a silent win (D8: report
    and promote it; the transition itself is not a stop).

## Push-forward (decide, journal, continue)

- Helper splits forced by the 500-line hook (`activity-renderer-shapes.ts`,
  `activity-style-defaults.ts`, `activity-probe.ts`) that extend a write-set —
  journal the new file.
- Unit-pin and baseline re-pins explained by a measured mechanism with a Java
  quote (diff the JSON before/after; any row that ROSE needs its own line).
- Pinning any slug that is zero-diff against its golden at a close
  (orchestrator-only, `$T/pin-goldens.mts`).
- Adding/dropping a batch-2/3 family (T2x/T3x) when the ledger names a
  mechanism no planned family owns, or a planned family has no cohort row.
- Re-slotting a row between batches; `final = open -> add2` when the mechanism
  is found but not fixable in the write-set.
- Collapsing two tasks that turn out to share a file.
- Routing arrowheads through `DriverPolygonSvg` in T1b if attribute-form
  residue survives T1a (D1).
- Promoting an `error` row to `baseline` via `repin-activity-promote.ts`.
- Regenerating the catalog or dashboard.

## Execution rules (D11)

- Parallel tasks run in `git worktree`s made by `measurements/mkwt.sh <Tn>`
  (links the gitignored dependencies and the `test-results` children).
- Agents run targeted tests + typecheck + eslint only; the orchestrator merges
  and runs the four gates.
- Agents: no Serena edit tools (they write the MAIN checkout), no `git stash`.
  Orchestrator: `git diff HEAD` on main is empty before every merge.

## Batches

| Batch | Scope | Tasks | Parallel | Done |
|---|---|---|---|---|
| [0](batch-0/overview.md) | branch + b0 + ledger + classify tool; freeze gate + pin tool | T0a, T0b | both ∥ | [ ] |
| [1](batch-1/overview.md) | canvas origin (D2); text via klimt driver + strictuml arrows (D1/D4) | T1a, T1b | both ∥ | [ ] |
| [1b](batch-1b/overview.md) | stop/end circles (D3) after b1 | T1c | — | [ ] |
| [2](batch-2/overview.md) | drive round 1 on the b1b cohort; pin round 1 | T2a–T2d (+T2x), T2-close | all ∥ | [ ] |
| [3](batch-3/overview.md) | drive round 2 on the b2 cohort; pin round 2 | T3a–T3n, T3-close | all ∥ | [ ] |
| [4](batch-4/overview.md) | exit + close-out + merge | T-exit, T-close-out | — | [ ] |

## Documents

- [decisions.md](decisions.md): D1–D11, locked
- [close-procedure.md](close-procedure.md): standard batch close
- [fixtures.md](fixtures.md): row ledger (seeded at planning, settled by closes)
- [diagrams/data-flow.md](diagrams/data-flow.md) ·
  [diagrams/component-map.md](diagrams/component-map.md)
- [decision-journal.md](decision-journal.md): one row per decision, mover, halt
- `measurements/`: probe/survey/classify JSON per checkpoint; `mkwt.sh`
- `tools/`: `pin-goldens.mts` (T0b); `classify-scratch.mts` (planning-time
  source for `scripts/activity-probe-classify.ts`)

## Prior context (read only what a task points at)

- `oracle/goldens/svg-activity/README.md` — the diff-baseline ratchet, its
  three statuses, the Add rule
- `planning/next-missions.md` — every `activity-*` filing (the batch-2/3
  families cite them by name)
- `plans/activity-loop-lane-translate/` — the last activity mission (ledger,
  tools, `stop-1-edgemeta-zip.md`)
- `tests/oracle/svg-conformance/mindmap.golden.ratchet.test.ts` — T0b's template
- Memories: activity-loop-lane-translate-status, oracle-score-blind-to-magnitude,
  weightedscore-can-rise-on-a-correct-fix, repin-script-raises-preexisting-red-pin,
  batch-parallelism-needs-worktrees, verify-agent-claims-si31,
  coverage-tmp-silent-undercollect, subagent-handback-single-shot,
  activity-canvas-margin-premise-was-false, segment-compare-beats-align-counts

## Status

(filled by T-exit)
