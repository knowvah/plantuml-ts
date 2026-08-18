# Mission: state-declared-size-diagnosis (SI28)

**Diagnose, to a `file:line` mechanism each, every state-engine node whose
DECLARED graphviz size differs from the jar's, and re-partition them by TRUE
shared cause so a fix mission can be planned straight off the output.** This
mission writes **no source code** (decisions.md ADR-2). Chosen 2026-08-18 from
`planning/next-missions.md §4` after S1L-e/i/j were found already done
(`d9f0ddda`). Precedent for shape and schema: `plans/s1l-tail-diagnosis/`.
Register row **SI28** at T14.

**Branch:** `docs/state-declared-size-diagnosis` · **Merge:** merge commit ·
**Agents run no git** — the orchestrator commits each task by pathspec
(ADR-8; SI27's shared-index incident).

## The oracle

`scripts/measure-composite-declared-size.ts` (T1 of the halted
`plans/state-composite-inner-canvas/` — read its HALT banner first): for
every state fixture in `test-results/dot-cache/state/<slug>/`, compares the
`width`/`height` (inches) this port DECLARES per svek scope against the jar's
cached `svek-N.dot`. Scopes pair by index; nodes pair by SORTED value per
axis, so a mis-pairing is possible and every row carries both values.
`npx jiti scripts/measure-composite-declared-size.ts --mismatched-only`.

## Starting state (pre-planning 2026-08-18 at `d9f0ddda`; T0 re-measures)

272 fixtures · **2654** declarations · **2481** exact · 173 inexact =
**120 rows / 63 fixtures** with |Δ| ≥ 0.05 px + **53 sub-pixel rows / 27
fixtures** with only |Δ| < 0.05 px (29 last-digit) + **4 unmatched** fixtures
(scope count differs). First-match labels (provenance only, ADR-3):
composite 20 · concurrent-region 8 · pseudo-state 7 · skinparam-style 7 ·
attribute-line 6 · stereotype 5 · other 4 · note 3 · creole-sprite+escape 3.
Repeated |Δ|: 36 px ×7, 28 ×6, 10 ×5, 12/40/21 ×3, 445 ×2, 80 ×2 — an
identical delta is ONE shared cause until evidence says otherwise.
Preview slices: [findings/PARTITION-preview.md](findings/PARTITION-preview.md).

## Exit bar (score clause by clause; do not reword)

1. Every one of the 94 fixtures (63 + 27 + 4) has exactly one record in
   `findings/*.md` on `findings/SCHEMA.md`: `originFileLine` is a real
   `file:line`, a Java citation, non-empty `ruledOut`; `unresolved` records
   carry `nextStep`.
2. `findings/SYNTHESIS.md` re-partitions all 94 by TRUE mechanism; every
   repeated |Δ| is either one group or explicitly reconciled; each group has a
   proposed write-set + size estimate; a fix-mission batch proposal with
   disjoint write-sets.
3. `findings/METRIC-AUDIT.md` gives every mismatched fixture a `pairingRisk`
   and a proposed (not implemented) id-aware pairing.
4. `git diff --name-only <branch-point>` contains no `src/`, `tests/`,
   `oracle/`, `scripts/` path; the close-out harness run is byte-identical to
   the T0 baseline.
5. Four quality gates green (unchanged, docs-only tree); SI28 row in
   `planning/mission-index.md`; `planning/next-missions.md §4` updated.

## Batches

| Batch | What | Tasks | Done |
|---|---|---|---|
| [0](batch-0/overview.md) | Baseline + PARTITION + SCHEMA check | T0 | [ ] |
| [1a](batch-1a/overview.md) | Bucket diagnosis (parallel) | T1 T2 T3 T4 T5 T6 T7 | [ ] |
| [1b](batch-1b/overview.md) | Bucket diagnosis + precision + unmatched + audit (parallel) | T8 T9 T10 T11 T12 T13 | [ ] |
| [2](batch-2/overview.md) | SYNTHESIS + close-out | T14 | [ ] |

1a and 1b are disjoint and MAY run as one 13-way batch.

## Quality gates

```
- command: npm test
  pass: exit 0
  on_fail: fix_and_rerun   # docs-only tree — a failure means src drift: STOP
- command: npm run typecheck
  pass: exit 0
  on_fail: stop
- command: npm run lint
  pass: exit 0
  on_fail: stop
- command: npm run build
  pass: exit 0
  on_fail: stop
- command: git diff --name-only <branch-point>..HEAD | grep -E '^(src|tests|oracle|scripts)/' ; test $? -eq 1
  pass: no output (grep finds nothing)
  on_fail: stop
- command: npx jiti scripts/measure-composite-declared-size.ts --mismatched-only > /tmp/sds-now.jsonl && cmp /tmp/sds-now.jsonl test-results/state-declared-size-baseline.jsonl
  pass: cmp silent (byte-identical to T0)
  on_fail: stop
- command: python3 plans/state-declared-size-diagnosis/findings/check-schema.py   # written by T0
  pass: "94 records, 0 violations"
  on_fail: fix_and_rerun
```

## Stop conditions

1. Any path under `src/`, `tests/`, `oracle/`, `scripts/` in the diff.
2. A task must write outside its own `findings/<name>.md` (T0/T14 excepted).
3. Close-out harness run ≠ T0 baseline — do not re-baseline.
4. Two consecutive schema-check failures on the same file after one fix.
5. A finding contradicts a locked ADR (declaring a divergence; editing the
   harness for id-aware pairing).
6. > 10 % of a bucket `unresolved` with the same `nextStep` — a missing tool,
   not per-fixture work.
7. `.claude/catalog.md` absent — do NOT create it.
8. Same fixture re-diagnosed 3× to a different `originFileLine`.

## Push forward (journal the call)

Re-slicing a fixture whose label is obviously wrong (keep `bucketLabel` as
provenance) · `<slug>#a/#b` split on distinct causes · merging buckets under
one `sharedCauseWith` in SYNTHESIS · `already-conformant` if T0 re-measure
differs from the preview · probes under `scripts_scratch/` (deleted before
commit); gated temporary tracing in `src/` ONLY if reverted before commit ·
recording proposed harness improvements in METRIC-AUDIT · choosing among
several plausible Java owners by reading them all and citing the method body
that produces the number.

## Index

- [decisions.md](decisions.md) — ADR-1…ADR-9 · [decision-journal.md](decision-journal.md)
- [findings/SCHEMA.md](findings/SCHEMA.md) — the record format (T0 adds `check-schema.py`)
- [diagrams/component-map.md](diagrams/component-map.md) · [diagrams/data-flow.md](diagrams/data-flow.md)
- Precedents: `plans/s1l-tail-diagnosis/` (shape), `plans/state-composite-inner-canvas/`
  (harness, HALT banner, `layout-ink-extent.ts:391` finding), `plans/transition-label-ink/`,
  `plans/shared-seam-extraction/` (SI27 T1 `\t` note, `.agent-notes/si27-t1-*`).
