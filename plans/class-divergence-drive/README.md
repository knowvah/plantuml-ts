# Mission: `class-divergence-drive`

**Branch:** `feat/class-divergence-drive` · **Planned:** 2026-09-21 ·
**Baseline commit:** `ac40492c` (main, clean) · **Task prefix:** `cdd` ·
**Merge:** merge commit (per-task commit ids are cited in the journal).

Read `~/.claude/docs/reference/autonomous-execution.md` in full at mission
start and after every compaction. Then this file, then
[`decisions.md`](decisions.md). Everything else is linked from here.

## Objective

Drive the class-diagram SVG parity survey (`npm run svg:survey class`,
`tests/oracle/svg-conformance/parity-class.json`) from
**412 conformant / 50 structural-match / 261 diverged** (723 oracle,
2026-09-21) to **`diverged` = 0 minus 7 declared ELK fixtures**, with every
`structural-match` remainder carrying a named mechanism. Seven read-only
diagnosis passes ([`diagnosis/`](diagnosis/)) traced all 311 non-conformant
fixtures to ~60 mechanisms, each cited to the Java method and our TS file;
[`fixtures.md`](fixtures.md) maps every slug to its mechanisms and bucket.
The buckets are the batches below.

The Java at `~/git/plantuml/src/main/java/net/` is the spec. Every task
re-reads the cited method bodies before editing; a diagnosis report is a
lead, not a proof (memory: subagent claims that measurement disproved).

## Exit bar (D3)

- `parity-class.json`: `diverged` = 0 except the 7 ELK slugs declared in
  `oracle/accepted-divergences.json`; each remaining `structural-match` row
  names its mechanism in `fixtures.md`
- Every fixture that is survey-`conformant` AND census 0-diff is pinned in
  `oracle/goldens/svg-class/ratchet.json`
- `tests/oracle/class-dot-parity.test.ts` still 710/711
- Description, state, sequence, activity, json/yaml/hcl suites unmoved, or
  every mover journaled with its mechanism (D5, D8, T30, T32)
- Zero UNEXPLAINED rises at every batch re-pin (D11)
- All four gates green with the JSON-reporter collected count = on-disk count

## Quality gates — all four before every commit

```sh
npm test              # vitest + 90/90/90 coverage; never a path filter
npm run typecheck     # both tsconfigs
npm run lint
npm run build
```

Plus, at every batch close: `npm run svg:survey class`,
`npx jiti scripts/svg-conformance-census.ts class`,
`npx jiti tools/pin-diff.mts measurements/<prev>.json tests/oracle/svg-conformance/parity-class.json`,
`npm run parity:dashboard`. Render oracles only with
`scripts/oracle-render.sh` and never rebuild the cache (D12).

## Batches (D2 order)

| Batch | Bucket | Tasks | Parallel | Moves layout | Done |
|---|---|---|---|---|---|
| [0](batch-0/overview.md) | B11 pre-flight + ELK ledger | T0 · T0b | T0 ∥ T0b | no | [x] |
| [1](batch-1/overview.md) | B1 ordering & uid | T1 · T2 · T3 · T4 | T1 ∥ T2, then T3, T4 | YES | [x] |
| [2](batch-2/overview.md) | B2 link render-only | T5 · T6 · T7 | sequential | no | [x] |
| [3](batch-3/overview.md) | B5 notes | T8 · T9 · T10 | T8, then T9 ∥ T10 | partly | [x] |
| [4](batch-4/overview.md) | B4 clusters | T11 · T12 · T13 · T14 | T11 ∥ T13, then T12, T14 | YES | [ ] |
| [5](batch-5/overview.md) | B3 link layout features | T15 · T16 · T17 | sequential | YES | [ ] |
| [6](batch-6/overview.md) | B6 classifier box & style | T18 · T19 · T20 · T21 · T22 · T23 | T18, then the rest ∥ | mostly no | [ ] |
| [7](batch-7/overview.md) | B7 text & creole | T24 · T25 · T26 · T27 · T28 | all ∥ (worktrees) | partly | [ ] |
| [8](batch-8/overview.md) | B8 scale / dpi | T29 · T30 | sequential | serialization | [ ] |
| [9](batch-9/overview.md) | B9 dispatch, hide, chrome | T31 · T32 · T33 · T34 | T31 ∥ T32 ∥ T33, then T34 | partly | [ ] |
| [10](batch-10/overview.md) | B10 numeric residuals + close-out | T35 · T36 · T37 · T38 | T35 ∥ T36, then T37, T38 | YES | [ ] |

Every batch ends with its **close task** (`batch-N/close.md`): gates,
survey + census, pin-diff, re-pin, dashboard regeneration, journal rows for
every riser, and the `after Bn` column of `fixtures.md` for the batch's
fixtures. Parallel tasks run in separate worktrees (memory: batch
parallelism needs worktrees; never Serena edit tools inside a worktree).

## Stop conditions

1. A task needs a file outside its write-set and outside every other task's
   in the batch (pre-authorised: a 500-line split re-export of a write-set
   file, and the per-task test files)
2. The same gate fails on two consecutive fix attempts
3. A finding contradicts D1–D12 — amend `decisions.md` and halt
4. Another engine's ratchet/diff-baseline/routing/refusal pin moves without a
   journaled mechanism
5. A re-pin shows a `dotEqual true→false` flip, a conformant fixture leaving
   conformant, or an unnamed diff-count rise the batch cannot mechanise
6. DOT parity drops below 710/711
7. Any survey `timeout`, or JSON-reporter collected count ≠ on-disk count
8. A mechanism lives in `@knowvah/dot-engine` — file `docs/graphviz-issues/`
   + `TRACKER.md`, halt the task only
9. Anything that would change the pinned oracle (jar symlink, `pin.json`,
   cache `--rebuild`)
10. The nested renderer (T27) cannot be bounded or needs an async path
11. A HIGH-confidence report mechanism is disproved — journal the
    measurement before a new approach; the fix counter does not reset
12. T18's `Paint` audit finds an output-changing consumer outside
    `src/core` and `src/diagrams/class`

Push-forward conditions are in [`decisions.md#push-forward`](decisions.md#push-forward).

## Documents

- [`decisions.md`](decisions.md) — D1–D12, locked; push-forward list
- [`fixtures.md`](fixtures.md) — 311 rows: slug · verdict · mechanisms · bucket · after-Bn
- [`diagnosis/`](diagnosis/) — the seven reports (`A1`…`A6`), `mechanisms.json`
  (id → slugs), `attribution.json` (slug → ids), `buckets.md`
- [`diagrams/component-map.md`](diagrams/component-map.md),
  [`diagrams/data-flow.md`](diagrams/data-flow.md)
- [`tools/`](tools/) — `render-diff.mts`, `render-all.mts`, `pin-diff.mts`
  (built by T0b; `diagnosis/scratch-render-one.ts` is the seed)
- [`measurements/`](measurements/) — `base.json`, one `bN.json` per close
- [`decision-journal.md`](decision-journal.md) — append-only
- `settings.autonomous.json` — project autonomous profile (already tailored)

## Prior work this mission stands on

`plans/g2-class-svg/ledger.md` (N0–N70, the class render-side history and
its N67 survey), `plans/note-leaf-model/`, `plans/leaf-draw-order/`,
`plans/si17-class-row-ports/`, `planning/next-missions.md` (edge draw
order, uid-numbering follow-ons), `.agent-notes/parity-repin-2026-09-05.md`,
and the memories on re-pin regressions, non-monotone diff counts, and
agents correcting the orchestrator.

## Recommended execution model

`fable` (long-horizon, 1M context) via
`~/.claude/hooks/autonomous-toggle.sh on .`, then
"Execute the mission brief at plans/class-divergence-drive/README.md".
The batches are independently pausable; the maintainer may stop after any
close task with a consistent tree.
