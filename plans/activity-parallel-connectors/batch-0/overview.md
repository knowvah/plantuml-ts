# Batch 0 — subset probe

One task, orchestrator-executed. Nothing may change source until it lands.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T0 | Subset probe and pre-change record | orchestrator | `.agent-notes/apc-T0.md` | — | [ ] |

## The probe

A scratch `npx jiti` script (extend the previous mission's
`probe-activity-score.ts`; the pattern is in
`plans/activity-min-box-width/decision-journal.md`) that renders each of
the 268 `status:"baseline"` fixtures of
`oracle/goldens/svg-activity/diff-baseline.json` through
`tests/oracle/svg-conformance/render-fixture-activity.ts#renderFixtureActivity`
with `DeterministicMeasurer` and `fixtureIncludeStore()`, runs
`compareSvg(ours, golden, 'deterministic')`, sums `weightedScore(diffs)`,
and reports BOTH the full aggregate (43977 at `b7c293c6`) and the
**subset**: fixtures whose source has a line matching `^\s*(split|fork)\b`
(32; 8218), with per-family weight (positional indices replaced by `[]`,
keyed by the path suffix), the riser/faller lists against the pinned
`weightedScore`, and a count of exact zero-length `<line>`s on our side.
At `b7c293c6`: subset families `svg/g[][childCount]=3733`, line
`@y1/@y2/@x1/@x2 ≈ 600/599/596/595`, `polygon[]/@points=313`,
`rect[]/@width=104`, `@stroke-width=87`, `@stroke=84`; our zero-length
segments: 2, on `simuti-16-lece058`.
