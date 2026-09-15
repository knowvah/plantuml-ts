# T0b — commit the activity baseline re-pin tool

**Agent:** `typescript-pro` · **Depends on:** —

## Context

Faithful TypeScript port of PlantUML. Read [`../README.md`](../README.md) and
[`../decisions.md#d4`](../decisions.md) (locked). Five committed files pin the
activity oracle: `oracle/goldens/svg-activity/diff-baseline.json` (the
ratchet — `weightedScore`, `diffCount`, `measuredAt` per slug),
`diff-census.json`, `style-baseline.json`, `swimlane-baseline.json` and
`text-baseline.json`. The last three are equality pins. `activity-klimt-
compress` T6 re-pinned all five from a scratch `repin-activity.ts` that no
longer exists. The swimlane gate states that the re-pin generator and the
gate share ONE implementation (`activity.swimlane-baseline.test.ts:95`):
reuse each gate's own measurement functions, never re-derive them.

**The hazard this tool exists to prevent.** `scripts/repin-sequence-
baselines.ts` compares only against the pin, so it once proposed raising a
row that was already red before the mission (433 → 543) and would have
turned a regression green. This tool must make every rise loud.

## Read-set

- `tests/oracle/svg-conformance/activity.diff-baseline.ratchet.test.ts` —
  header and `:170-230` (the fields a re-pin must write together)
- `tests/oracle/svg-conformance/activity.swimlane-baseline.test.ts:1-120`
- headers of `activity.style-baseline.test.ts` and
  `activity.text-baseline.test.ts`, and the exports of `text-census.ts` and
  `swimlane-census.ts:241-330` (`censusOf`, `checkCensus`)
- `scripts/repin-sequence-baselines.ts` — house pattern, and the hazard above
- `scripts/rebaseline-svg-goldens.ts:1-60` — pure-logic-plus-CLI layout; put
  the unit test beside that script's test

## Write-set

`scripts/repin-activity-baselines.ts`; its unit test.

## Task

Tests first for the pure functions. CLI:

`npx tsx scripts/repin-activity-baselines.ts [--write] [--accept-rises a,b] [--slugs-file <path>]`

- Re-measure all five files through the gates' own functions
- `diff-baseline.json`: for every slug, classify `same`/`fell`/`rose`; print
  `ROSE diff-baseline <slug> <old>→<new>` for each rise; exit 1 if any rise is
  not named in `--accept-rises`
- Equality pins: print `CHANGED <file> <slug>` with `in-subset` when the slug
  is in `--slugs-file` (same slug regex as T0a)
- Report-only by default; `--write` rewrites all five files, preserving key
  order, `$comment`, and the `measuredAt`/`measuredAgainstCommit` fields' conventions

Pure exports: `classifyChange(pinned: number, measured: number): 'same' | 'fell' | 'rose'`,
`plannedWrites(...)` (shape your choice, unit-tested).

## Acceptance criteria

- Given the unchanged tree, when run without `--write`, then every file
  reports 0 changes and the exit code is 0
- Given a synthetic pin below its measured value (unit test), then a `ROSE`
  line is produced and the exit code is 1; with that slug in
  `--accept-rises`, the exit code is 0
- Given `--write` on the unchanged tree, then `git diff --stat oracle/` is
  empty (byte-stable serialisation)
- Given `npm test`, then the tool does not execute

## Observability / Rollback

N/A — no new observable operations / **Reversible.**

## Quality bar

All four gates green; no fixture moves; no baseline file changes.

## Commit

`feat(alc-T0b): commit the activity baseline re-pin tool`
