# Batch 0 — pin the text census

One task. **Nothing may change source until this lands.** Four sequenced
changes land on the same fixtures; the existing pins record width, height,
stroke and text COUNT, never a text's fill, anchor or where it sits inside
its box, so T4 and T5 would be individually unattributable.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T0 | Pin the pre-change text census | orchestrator | `oracle/goldens/svg-activity/text-baseline.json`, `tests/oracle/svg-conformance/text-census.ts`, `tests/oracle/svg-conformance/activity.text-baseline.test.ts`, `.agent-notes/amb-T0.md` | — | [ ] |

**Orchestrator-executed.** `scripts/repin-sequence-baselines.ts:3-8`
reserves baseline JSON writes to the orchestrator.

## The probe

The orchestrator measures after every task with a scratch script that
renders each of the 268 `status:"baseline"` fixtures of
`oracle/goldens/svg-activity/diff-baseline.json` through
`tests/oracle/svg-conformance/render-fixture-activity.ts#renderFixtureActivity`
with `DeterministicMeasurer` and `fixtureIncludeStore()`, runs
`compareSvg(ours, golden, 'deterministic')`, sums `weightedScore(diffs)`,
lists risers/fallers against the pinned `weightedScore`, and sums weight
per path family (positional indices replaced by `[]`). At `8aad71eb` it
prints `aggregate 48291`, `svg/g[][childCount]=19771`,
`rect[]/@width=821`, `text[]/@text-anchor=1253`, `text[]/@fill=1288`,
`rect[]/@stroke-width=846`. `plans/activity-swimlane-rendering/
decision-journal.md` shows the pattern in use.
