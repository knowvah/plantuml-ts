# asr-T7 — activity-swimlane-rendering close-out

Full scoring in `plans/activity-swimlane-rendering/README.md` (Close-out).
This file carries only what is reusable beyond the mission.

## Observation: a re-pin generator must share the gate's instrument

- **Context**: re-pinning four activity baselines in one measurement.
- **Finding**: the swimlane census lives in a pure module
  (`tests/oracle/svg-conformance/swimlane-census.ts`, no vitest import) so
  a plain `npx jiti` script drives it; the style census does NOT
  (`censusOf` is exported from the `.test.ts`, which vitest's `describe`
  makes un-importable outside a runner), so the re-pin script carries a
  copy of it. The copy was validated by reproducing the prior pin exactly
  on the 209 fixtures the mission did not touch.
- **Impact**: when a census is added, put its core in a non-test module
  from the start; a copy in a scratch script is a second instrument
  waiting to drift.
- **Confidence**: High.

## Observation: `TaskOutput` with a long block dumps the subagent transcript

- **Context**: waiting for a long-running task agent.
- **Finding**: a `TaskOutput` call that times out before the agent
  finishes returns a truncated JSONL transcript into the orchestrator's
  context. A background `until git log -1 | grep -q '<task-id>'` loop
  followed by a short `TaskOutput` once the commit exists returns the
  final report cleanly.
- **Impact**: orchestration hygiene for every mission run this way.
- **Confidence**: High — happened once, avoided thereafter.

## Observation: the correct width formula exposed a wrong input

- **Finding**: porting `Swimlanes#computeSizeInternal` exactly made 25
  swimlane fixtures WORSE at T5, because their content widths come from
  the unsourced `ACTION_MIN_WIDTH = 120`. The old equal-division overlay
  was closer by accident. T6's chrome then recovered the aggregate to
  −8.13% overall.
- **Impact**: a mission whose task is a formula must expect its inputs'
  pre-existing errors to surface, and budget named risers for them.
- **Confidence**: High.

## Observation: positional pairing rewards mirroring draw order, not just elements

- **Finding**: `svg/g[][childCount]` fell 24911 → 19771 only once the
  renderer emitted the jar's ORDER (band, per-lane shapes each followed by
  that lane's divider, all edges, titles last), not merely the same
  elements. `compareSvg` pairs siblings positionally.
- **Impact**: when porting a `drawU`, port its sequence of `draw` calls,
  not the set.
- **Confidence**: High — measured before and after the order change.
