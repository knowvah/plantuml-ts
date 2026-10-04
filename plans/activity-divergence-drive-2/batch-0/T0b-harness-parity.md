# T0b — harness-parity gate (D4)

Agent: typescript-pro, worktree `add2-T0b`. Commit:
`test(add2-T0b): renderSync and the conformance harness agree on activity`.

## Context
`tests/oracle/svg-conformance/render-fixture-activity.ts` rebuilds the activity
pipeline instead of calling `renderSync`; in add1 it missed T3j's chrome
composition and every activity gate measured the drift (add1 journal row 52;
memory `conformance-harness-mirrors-index-ts`). D4 makes that drift a red test.

## Task
`tests/oracle/svg-conformance/activity.harness-parity.test.ts`: for every
`baseline`/`pinned` activity fixture whose `in.puml` carries title/legend/
caption/header/footer, plus a deterministic stratified sample (every 8th slug
of `diff-baseline.json`), assert `renderSync(markup, {measurer: Deterministic…})`
(whatever options make it equivalent — read `src/index.ts` and the harness)
equals `renderFixtureActivity(...)` byte-for-byte after `normalizeSvg`. Name the
slug on failure. Prove it bites: revert the harness's activity-chrome branch
locally (do not commit) and show the test fails on cifafo-49-jazi415.

## Write-set
`tests/oracle/svg-conformance/activity.harness-parity.test.ts` (NEW).

## Read-set
`tests/oracle/svg-conformance/render-fixture-activity.ts` (whole),
`src/index.ts:200-260`, `tests/oracle/svg-conformance/activity.golden.ratchet.test.ts`
(fixture loading conventions), `decisions.md#D4`.

## Acceptance
- Given main, then the test passes and collects > 0 cases.
- Given the harness without its activity-chrome branch, then it fails naming cifafo.
- Given `npm test` wall time, then the new file adds < 20 s (report the time).

Quality bar: targeted vitest + typecheck + eslint. No Serena tools, no stash.
Observability: N/A. Rollback: Reversible.
