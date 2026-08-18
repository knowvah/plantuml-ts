# Mission: state-declared-size-fix (SI29)

**Turn SI28's diagnosis into fixes: make every state-engine node's DECLARED
graphviz size match the jar's, group by group, biggest delta first, with the
declared-size harness as the exit criterion — and close the diagnosis on the
groups SI28 left `unresolved`.** Planned 2026-08-18 straight off
`plans/state-declared-size-diagnosis/findings/SYNTHESIS.md` §4 (24 true-cause
groups; 75 fixtures resolved / 14 unresolved / 4 divergence-proposed, all four
ruled: port both guards). Register row **SI29** at T20.

**Branch:** `fix/state-declared-size` · **Merge:** merge commit · **Agents run
no git** — the orchestrator commits each task by pathspec (SI27/SI28 lesson).

## The oracle and the exit

`npx jiti scripts/measure-composite-declared-size.ts --mismatched-only` vs the
pinned `test-results/state-declared-size-baseline.jsonl` (gitignored). SI28's
baseline: 272 fixtures · 2654 declarations · 2481 exact · 144 mismatched · 29
last-digit · 4 unmatched (sha `b790fabc…505e0`). **A task's exit is its named
fixtures' rows going exact; the baseline is re-pinned per task and may only
shrink** (decisions.md D4). Sub-pixel G14 (30 records, ≤0.005 px) is out of
scope by design.

## Batches

| Batch | What | Tasks | Done |
|---|---|---|---|
| [0](batch-0/overview.md) | Harness gates + baselines (pairing stays sorted, D4 amended) | T0 | [x] |
| [1](batch-1/overview.md) | Core creole seam · leaf sizing · line continuation · note-on-link · parse guards (parallel) | T1 T2 T3 T4 T5 | [x] |
| [2](batch-2/overview.md) | State text (G1+G8+G23) · note bodies (G2) — consume T1 | T6 T7 | [x] |
| [3](batch-3/overview.md) | Composite geometry: clusterPosMap (G4) · ink extent (G5+G6) | T8 T9 | [ ] |
| [4](batch-4/overview.md) | Overlapping tail: `\|\|` orientation (G11) · label position (G13) | T10 T11 | [ ] |
| [5a](batch-5a/overview.md) | Re-diagnosis D1–D4 (docs-only) | T12 T13 T14 T15 | [ ] |
| [5b](batch-5b/overview.md) | Re-diagnosis D5–D8 (docs-only) | T16 T17 T18 T19 | [ ] |
| [6](batch-6/overview.md) | Close-out | T20 | [ ] |

5a and 5b are disjoint and MAY run as one 8-way batch, and MAY run in
parallel with Batch 4 (no shared write-set: they write only `findings/`).

## Quality gates (after every batch)

```
- command: npm test
  pass: exit 0 (coverage ≥ 90/90/90)
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
- command: npx jiti scripts/measure-composite-declared-size.ts --mismatched-only > /tmp/sds-now.jsonl && python3 plans/state-declared-size-fix/scripts/harness-diff.py test-results/state-declared-size-baseline.jsonl /tmp/sds-now.jsonl
  pass: prints "OK: N rows went exact, 0 rows appeared or grew" — then re-pin: cp /tmp/sds-now.jsonl test-results/state-declared-size-baseline.jsonl
  on_fail: stop            # a row appeared or grew: README stop 3
- command: npx jiti scripts/render-manifest.ts --out /tmp/manifest-now.json && python3 plans/state-declared-size-fix/scripts/manifest-diff.py test-results/render-manifest-baseline.json /tmp/manifest-now.json plans/state-declared-size-fix/expected-moves.txt
  pass: every moved fixture is listed in expected-moves.txt for the batch — then re-pin the manifest baseline
  on_fail: stop            # collateral outside the batch's fixtures: README stop 4
- command: git diff --name-only <last-batch-commit>..HEAD
  pass: only files in the batch's declared write-sets (+ ratchet files, journal, brief)
  on_fail: stop
```
T0 writes `scripts/harness-diff.py`, `scripts/manifest-diff.py` (under the
brief, stdlib python) and pins `test-results/render-manifest-baseline.json`.
Each batch overview names its `expected-moves.txt` entries.

## Stop conditions

1. A task must write a file outside its write-set that no task owns
   (ratchet files `oracle/goldens/state/size-backlog.json`,
   `tests/oracle/dot-parity-backlog-data.ts`, the two gitignored baselines,
   `decision-journal.md` and this brief are pre-declared shared).
2. Two consecutive gate failures on the same check.
3. Harness regression: any row appears or grows vs the previous baseline.
4. `render-manifest` moves a fixture not in the batch's `expected-moves.txt`.
5. State DOT-parity EQUAL < 266/268, or class/description/object parity
   ratchets move at all.
6. `tests/architecture/layering.test.ts` needs an ALLOWLIST entry or
   `KNOWN_DEBT` becomes non-empty.
7. A numeric constant without a `~/git/plantuml` `file:line`, or a delta that
   shrinks without the mechanism explaining ALL of it (fitting).
8. A finding contradicts a locked decision (decisions.md D1–D8).
9. T6/T7: sizer and renderer are found not consuming the same runs.
10. Same location changed 3× consecutively without the check clearing.
11. Batch 5: > 10 % of D-records `unresolved` with the same `nextStep`, or a
    D-task edits `src/`.
12. `.claude/catalog.md` absent — do NOT create it (guard, not a halt).

## Push forward (journal the call)

Seam filename/shape within D1 · T4's renderer file choice · tightening a
ratchet a task made exact incidentally (log rows) · re-slicing a fixture
between tasks (keep provenance) · rewriting the stale doc comments SI28
flagged, inside the owning task · adding a regression fixture from
`test-results/dot-cache/state/<slug>/in.puml` to `tests/unit/state/` ·
journaling `jetuse-93` width / `fotuje-06` residual after T8 instead of
chasing · probes under `scripts_scratch/T<N>/` deleted before commit; gated
tracing in `src/` only if reverted · minor/patch dep bumps.

## Index

- [decisions.md](decisions.md) — D1…D8 (locked) · [decision-journal.md](decision-journal.md)
- [diagrams/component-map.md](diagrams/component-map.md) · [diagrams/data-flow.md](diagrams/data-flow.md)
- Source of truth: `plans/state-declared-size-diagnosis/findings/SYNTHESIS.md`
  (§1 groups, §4 batches, §6 rulings), per-bucket records in
  `plans/state-declared-size-diagnosis/findings/*.md`, `METRIC-AUDIT.md` §3
  (Candidate B pairing), `.agent-notes/si28-state-declared-size-observations.md`.
- Precedents: SI28 (shape, ADR-8 commit discipline), SI27
  (`plans/shared-seam-extraction/` — core-seam extraction, layering test),
  `planning/sizer-renderer-parity.md`.
