# Mission: sequence-command-coverage

**Branch**: `feat/sequence-command-coverage` (merge commit to `main`, never
squash — the decision journal references per-task commit IDs).

## Objective

Close **195 sequence fixtures** that fail three conformance gates for one
shared root cause: sequence `Command`s this port does not implement. The 163
`refusal-baseline` known-gaps, the 195 sequence `routing-baseline`
known-misroutes, and the 195 `svg-sequence/diff-baseline` `status: "error"`
rows are the **same population** — closing a bucket clears all three together.
Coverage is the deliverable (D6): a bucket closes when its fixtures parse and
route to `SEQUENCE` and carry a freshly measured diff-baseline score. Lowering
those scores is a filed follow-on, not this mission.

**Out of scope as a bucket**: `kokebo-27-vafi688` (a CLASS misroute, not a
sequence defect). Note it is already **fixed** — the routing gate reports its
pin STALE and asks for a re-pin to `agree`. T19 does that cleanup; it is not a
sequence closure and must not be counted as one.
`nuvoja-46-dezu541` is in the population but is a **harness** gap —
`!includedef macro` is absent from the fixture include store — filed by T20,
not fixed by a command task.

## Start here

1. Read this file.
2. Read [`decision-journal.md`](./decision-journal.md) — it may carry entries
   from earlier in the session, before compaction.
3. Find the first unchecked batch below; read its `overview.md`.
4. Announce the batch and its tasks, then begin.

**After every compaction: re-read every file from disk.** The brief on disk is
the source of truth, never the compacted summary.

## Batches

| # | Batch | Tasks | Parallel | Done |
|---|---|---|---|---|
| 1 | [Instruments and headroom](./batch-1/overview.md) | T1–T5 | 5 ∥ | [x] |
| 2 | [AST migration](./batch-2/overview.md) | T6 | alone | [x] |
| 3 | [Parse wave](./batch-3/overview.md) | T7–T11 | 5 ∥ | [x] |
| 4 | [Dressing + exo parse](./batch-4/overview.md) | T12–T13 | 2 ∥ | [ ] |
| 5 | [Layout + arrow render](./batch-5/overview.md) | T14–T16 | 3 ∥ | [ ] |
| 6 | [Exo render](./batch-6/overview.md) | T17 | alone | [ ] |
| 7 | [Adjudicate, re-pin, close out](./batch-7/overview.md) | T18–T20 | sequential | [ ] |

Exo arrows are **strictly sequential** across batches 4 → 5 → 6 (parse →
layout → render), by ruling.

## Quality gates

Run all four at every batch close. All must be green before the batch is
marked done.

```
- command: npm test           # vitest + 90/90/90 coverage; includes the three
  pass: exit 0                # conformance gates AND tests/architecture/catalog.test.ts
  on_fail: fix_and_rerun
- command: npm run typecheck  # both tsconfigs
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run lint
  pass: exit 0
  on_fail: fix_and_rerun
- command: npm run build
  pass: exit 0
  on_fail: fix_and_rerun
- command: git diff --name-only <batch-base>..HEAD
  pass: output matches the batch's declared write-sets only
  on_fail: stop
```

**Catalog regeneration is an orchestrator step, not a task write-set.**
`tests/architecture/catalog.test.ts` gates `docs/catalog.md` drift inside
`npm test`, so every module-adding task would otherwise collide on one file.
At each batch close, before running gates:

```
npm run catalog && git add docs/catalog.md
git commit -m "chore(catalog): regenerate for batch N"
```

**Verifying gate output**: the gates report progress via `console.log`, which
vitest **hides in redirected output**. Use `--reporter=verbose` to read
`[REFUSAL SLI]`, `[ROUTING SLI]`, `[IMPROVED]`, `[FIXED]`. Never conclude a
branch did not fire from a piped run.

## Scoreboard

| quantity | baseline | target | reported by |
|---|---:|---:|---|
| `refusal-baseline` `known-gap` pins | 163 | 0 | the JSON, not the SLI line |
| refusal SLI 2 (the *reported* number) | 1 | ≤1 | `refusal-coverage.test.ts:520` |
| routing misroutes, sequence | 195 | 0 | `routing-conformance.test.ts:517` |
| `diff-baseline` `status: "error"` | 195 | 0 | `sequence.diff-baseline.ratchet.test.ts` |

**Read the first two rows together.** A `known-gap` pin is *excused* from SLI 2
by construction, so the gate reports **1**, not 163. The mission's work is
converting 163 excused pins into `ok`; SLI 2 itself barely moves. Measured
2026-08-26 with `--reporter=verbose`. Do not treat "SLI 2 is 1" as evidence
that the gaps are closed.

## Documents

- [`decisions.md`](./decisions.md) — D1–D7, all approved. **Treat as locked.**
- [`constraints.md`](./constraints.md) — stop / push-forward conditions.
- [`prior-observations.md`](./prior-observations.md) — measured hazards from
  earlier missions. Read before any measurement.
- [`diagrams/component-map.md`](./diagrams/component-map.md) — what is touched.
- [`diagrams/data-flow.md`](./diagrams/data-flow.md) — parse→layout→render for
  an exo arrow.
- [`decision-journal.md`](./decision-journal.md) — appended during execution.
- `findings/` — T20 writes `CLOSE-OUT.md` here.

## Commit discipline

One commit per task, referencing the ID: `feat(T7): rebuild CommandArrow
compositionally`. Quality-gate fixes are separate: `fix(T7): …`. Never commit
work in progress.
