# Batch 0 — probe and pre-change record

One task, orchestrator-executed. Nothing may change source until it lands.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T0 | Probe and pre-change record | orchestrator | `.agent-notes/akc-T0.md` | — | [x] |

## The probe

The `activity-parallel-connectors` scratch `probe.ts` (pattern: render each
of the 268 `status:"baseline"` fixtures of
`oracle/goldens/svg-activity/diff-baseline.json` through
`tests/oracle/svg-conformance/render-fixture-activity.ts#renderFixtureActivity`
with `DeterministicMeasurer` and `fixtureIncludeStore()`, `compareSvg(ours,
golden, 'deterministic')`, `weightedScore(diffs)`), reporting the aggregate
(42511 at `fa578b8a`), the 32-fixture split/fork subset (6752), per-family
weight (positional indices replaced by `[]`), per-fixture families, risers and
fallers against the pinned score, and `--dump <slug>` for ours-vs-jar
`<line>/<rect>/<polygon>/<ellipse>` lists. After T5 it also reports each
fixture's removed length per axis (T4's `removed`).
