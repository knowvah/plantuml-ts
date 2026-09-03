# T0b — Pin the activity tree into the corpus-completeness gates

**Added mid-mission, 2026-09-02. Executed by the ORCHESTRATOR, not a task
agent.** See [D11](../decisions.md). T0 hit this as stop condition 1 and
correctly refused to act: `scripts/repin-sequence-baselines.ts:3-8` reserves
baseline writes to the orchestrator.

## Why this task exists
`routing-conformance.test.ts` and `refusal-coverage.test.ts` walk the whole
`test-results/dot-cache/**` tree and FAIL on any fixture absent from their
baselines. T0's capture adds 373 — so both go red, and neither baseline is in
any task's write-set across the six planned batches. Both gates' own failure
text forbids the cheap fix: *"Measure and pin them — do not narrow the walk."*

## What it did
Ran `scripts/pin-activity-baselines.ts` (in this plan directory), which
measures through the same seams both gates use — `fixtureIncludeStore()` and
`DeterministicMeasurer` — and appends. It is **additive-only** and asserts so
internally; `git diff` on both baselines shows **4103 insertions, 0 deletions**.

| baseline | added | split |
|---|---|---|
| `routing-baseline.json` | 373 | 350 `known-misroute` + 23 `jar-error` |
| `refusal-baseline.json` | 373 | 90 `weErrored` (82 of them jar-rendered) + 283 clean |

All 350 misroutes carry ONE cited mechanism, because one explains them all:
`renderActivity` returns a `RenderFragment` with no `diagramType`
(`src/diagrams/activity/renderer.ts:221-226`), so `renderSync` stamps no root
`data-diagram-type`, where upstream stamps it on every exported document
(`TextBlockExporter.java:293`). **T5 removes that**, after which all 350 fall
to `agree` and the gate logs `[FIXED]`.

The 82 refusal defects are pinned `weErrored: true, status:"ok"` — the
honest-record form, NOT `known-gap`, which would require naming a specific
unported `Command` per fixture. They are D8's tracked queue.

## Write-set
- `oracle/goldens/svg-conformance/routing-baseline.json`
- `oracle/goldens/svg-conformance/refusal-baseline.json`
- `tests/oracle/svg-conformance/routing-conformance.test.ts` (derivation counts only)
- `tests/oracle/svg-conformance/refusal-coverage.test.ts` (derivation counts only)
- `plans/activity-oracle-harness/scripts/pin-activity-baselines.ts`
- `.agent-notes/aoh-T0b.md`

## The one judgment worth reviewing
`refusal-coverage.test.ts`'s `the only non-gapped defect is nuvoja` was NOT
flattened into a list of 83. It now asserts two things: that outside activity
the set is still exactly `[nuvoja]`, and that the activity queue is exactly
82. Flattening would have let a future non-activity regression hide inside a
number that is expected to be large.

## Ordering
T0b commits **before** T0. Both gates walk the DISK tree, which already holds
the cache, so pinning first leaves every commit green; committing the cache
first would land one red commit.
