# T0b — activity freeze gate, pin tool, `status: "pinned"`

Agent: typescript-pro, in worktree `add1-T0b`. Commit format:
`test(add1-T0b): activity golden ratchet + pin tool`.

## Context
Activity has only a diff-baseline (monotone-improvement) ratchet
(`oracle/goldens/svg-activity/README.md`); `ratchet.json` is `{ "fixtures":
[] }` and nothing freezes a conformant fixture byte-for-byte. Mindmap built
exactly this gate for a DOT-less engine (`tests/oracle/svg-conformance/
mindmap.golden.ratchet.test.ts`); class has the pin tool (`plans/class-
divergence-drive/tools/pin-goldens.mts`). D5 locks the shape.

## Task
1. `tests/oracle/svg-conformance/activity.golden.ratchet.test.ts` from the
   mindmap template: render via `renderFixtureActivity` + `DeterministicMeasurer`
   + `fixtureIncludeStore()`; golden at `oracle/goldens/svg-activity/<slug>/
   golden.svg`; AC1 (every entry byte-equal after `normalizeSvg`), AC2 (tamper
   test on `fixtures[0]`), placeholder assertions while empty. No DOT clause,
   no `unknown` tree.
2. `plans/activity-divergence-drive/tools/pin-goldens.mts` (+ `.test.mts`,
   run with the class tools' `vitest.config.mts` pattern): per slug copy
   `test-results/dot-cache/activity/<slug>/{in.svg,in.puml}` →
   `oracle/goldens/svg-activity/<slug>/{golden.svg,in.puml}`, re-read to prove
   byte equality, APPEND `{ slug, addedAt, source: "dot-cache" }` to
   `ratchet.json` (never re-sort), and set the slug's `diff-baseline.json` row
   to `status: "pinned"` (keep `weightedScore`/`diffCount` as last measured).
   Refuse a slug whose render is not zero-diff (same comparator as the gate).
3. `status: "pinned"` readers: `activity.diff-baseline.ratchet.test.ts` skips
   pinned rows (they are the golden test's); `scripts/repin-activity-
   baselines.ts` and `repin-activity-promote.ts` skip them; the style/text/
   swimlane baseline tests keep gating pinned rows unchanged (they read
   their own files — verify, do not assume). Extend the three-status
   arithmetic in the diff-baseline test (`jar-error + error + baseline +
   pinned = 373`).
4. `oracle/goldens/svg-activity/README.md`: a "Pinned (golden ratchet)"
   section — the Add rule now points at `pin-goldens.mts`; Remove rule
   maintainer-only, unchanged.

## Write-set
`tests/oracle/svg-conformance/activity.golden.ratchet.test.ts` (NEW),
`tests/oracle/svg-conformance/activity.diff-baseline.ratchet.test.ts`,
`scripts/repin-activity-baselines.ts`, `scripts/repin-activity-promote.ts`,
`tests/unit/scripts/repin-activity-{baselines,promote}.test.ts`,
`plans/activity-divergence-drive/tools/pin-goldens.mts`,
`plans/activity-divergence-drive/tools/pin-goldens.test.mts`,
`oracle/goldens/svg-activity/README.md`.

## Read-set
`tests/oracle/svg-conformance/mindmap.golden.ratchet.test.ts` (whole, 148),
`plans/class-divergence-drive/tools/pin-goldens.mts:1-80` + its test,
`tests/oracle/svg-conformance/activity.diff-baseline.ratchet.test.ts:100-240`,
`scripts/repin-activity-baselines.ts:240-300`, `decisions.md#D5`, `#D8`.

## Interface contract (consumed by every close)
`ratchet.json` entry `{ slug: string, addedAt: ISO, source: "dot-cache" }`;
golden dir `oracle/goldens/svg-activity/<slug>/{golden.svg,in.puml}`;
`diff-baseline.json` row `status: "pinned"`.

## Acceptance
- Given an empty `ratchet.json`, when the golden test runs, then it passes
  with the documented placeholder assertion.
- Given `pin-goldens.mts close-test <slug>` for a zero-diff slug (use a
  fixture rendered to a temp dot-cache in the test), when run, then the golden
  dir exists byte-equal, `ratchet.json` gains the entry, and the row is
  `status: "pinned"`; for a non-zero-diff slug it refuses and writes nothing.
- Given a pinned slug whose render drifts by one byte, when the golden test
  runs, then it fails naming the slug.
- Given a `"pinned"` row, when `repin-activity-baselines` and the diff-
  baseline test run, then the row is skipped and both exit 0.

Quality bar: targeted vitest on the five test files + `npm run typecheck` +
eslint on the write-set. Boundaries: never pin a real slug here (orchestrator-
only, closes); never edit `oracle/goldens/svg-activity/*.json` beyond the
README. Observability: N/A. Rollback: Reversible.
