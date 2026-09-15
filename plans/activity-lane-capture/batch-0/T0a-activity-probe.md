# T0a — commit the activity oracle probe

**Agent:** `typescript-pro` · **Depends on:** —

## Context

Faithful TypeScript port of PlantUML; the Java at `~/git/plantuml` is the
spec. Read [`../README.md`](../README.md) and
[`../decisions.md#d4`](../decisions.md) (locked). Activity has no DOT gate:
fidelity is measured by rendering the 268 `status: "baseline"` entries of
`oracle/goldens/svg-activity/diff-baseline.json` and comparing each to its
committed jar golden. Two missions measured with a scratch probe; both copies
are gone. This task commits one. It is tooling: it must not be collected by
`npm test`, and nothing under `src/` may import it.

## Read-set

- `tests/oracle/svg-conformance/activity.diff-baseline.ratchet.test.ts:80-130`
  — how a fixture is loaded, rendered and scored (imports at `:83-85`)
- `tests/oracle/svg-conformance/render-fixture-activity.ts:122` —
  `renderFixtureActivity(markup, measurer, options?)`
- `tests/oracle/svg-conformance/compare.ts:578-620` — `compareSvg`,
  `weightedScore`, the `Diff` shape
- `src/core/measurer-deterministic.ts` (`DeterministicMeasurer`);
  `tests/helpers/fixture-include-store.ts:77` (`fixtureIncludeStore`)
- `tests/oracle/svg-conformance/swimlane-census.ts:128-260` —
  `lanesFromDividers`, `censusOf`
- `scripts/rebaseline-svg-goldens.ts:1-60` — house pattern: pure logic
  exported and unit-tested, CLI below it. Find its unit test and put yours in
  the same directory
- `vitest.config.*` — confirm `scripts/` is not in the test include glob
- `plans/activity-klimt-compress/batch-0/overview.md#the-probe` — the feature
  list the lost probe had

## Write-set

`scripts/activity-probe.ts`; its unit test (directory per the house pattern).

## Task

Tests first for the pure functions. CLI:

`npx tsx scripts/activity-probe.ts [--slugs a,b | --slugs-file <path>] [--json <out>] [--dump <slug>] [--lanes <slug>]`

- **Default:** aggregate over all 268; `subsetSum` over the selected slugs;
  per-family weight (positional indices replaced by `[]`); risers and fallers
  against the pinned `weightedScore`
- **`--slugs-file`:** every match of `/[a-z]+-\d{2}-[a-z]+\d{3}/g` in the file
  (so `plans/activity-lane-capture/fixtures.md` works as-is)
- **`--dump <slug>`:** ours vs jar `line`/`rect`/`polygon`/`ellipse`/`text`
  in document order, each with its lane index (`laneIndexOf(x, lanes)` over
  `lanesFromDividers` of THAT svg's census)
- **`--lanes <slug>`:** for each compound shape — fork/join bar, split top and
  join line, if/while diamond or hexagon, repeat condition — the lane index
  ours vs jar, paired in document order per shape kind, one row each
- **`--json <out>`:** writes the contract below

Pure exports: `familyOf(diffPath: string): string`,
`risersAndFallers(pins: Record<string, number>, measured: Record<string, number>)`,
`laneIndexOf(x: number, lanes: readonly LaneExtent[]): number | null`.

## Interface contract (consumed by T1–T8)

```ts
interface ProbeReport {
  commit: string;
  aggregate: number;
  subsetSum: number | null;
  fixtures: { slug: string; score: number; pinned: number; delta: number }[];
  families: Record<string, number>;
}
```

## Acceptance criteria

- Given the tree at `2a31a9ad`, when the probe runs with no flags, then
  `aggregate` is **52954** and every `delta` is 0
- Given `--slugs-file plans/activity-lane-capture/fixtures.md`, then
  `subsetSum` is **11783** over exactly 40 slugs
- Given `--lanes bixefi-77-moki051`, then it prints one row per fork bar with
  both lane indices
- Given `risersAndFallers({a: 5, b: 5}, {a: 7, b: 3})`, then risers `['a']`,
  fallers `['b']` (unit test, exact arrays)
- Given `npm test`, then the probe does not execute

## Observability / Rollback

N/A — no new observable operations / **Reversible.**

## Quality bar

All four gates green; no fixture moves.

## Commit

`feat(alc-T0a): commit the activity oracle probe`
