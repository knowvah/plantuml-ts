# T1b — the clock seam (D3a) and harness wiring (D3b)

Agent: `typescript-pro` (sonnet), worktree `gep-T1b`. Commit:
`feat(core): one injected clock for TIM and gantt`.
Read [../task-contract.md](../task-contract.md), decisions D3, and
`plans/lengthadjust-document-wide/decisions.md` Amendment 1 (the
`InternalRenderOptions` pattern). Core task: survey every engine vs b0.

## Task
1. `src/core/clock.ts`: `interface Clock { nowMillis(): number; zone:
   string }`, `DEFAULT_CLOCK` (0, `'UTC'`), and the accessor gantt will call.
   No `Date` (stop 11): a zone is a name passed to T1a's
   `src/core/time` zone support (land T1a's zone API name in your hand-back if
   you need it; do not write `src/core/time`).
2. `TimEnvironment.clock` (`src/core/tim/builtin/TimEnvironment.ts:33,121`)
   reads the seam; `%now()`/`%date()` output with no setter is byte-identical.
3. `src/core/internal-render-options.ts`: add `clock?: Clock` beside
   `jarCompatibleStyleInput` (not re-exported); `prepareBlock` / the
   preprocessor environment pick it up; nested `{{ }}` renders inherit it.
4. Harness: `render-fixture-gantt.ts#ganttRenderOptions(slug)`, the survey
   (`scripts/svg-parity-survey.ts#surveyRenderOptions`), the census and every
   caller that passes `jarCompatibleStyleInput` also pass the clock from
   `oracle/capture-clock.json` for that slug (one shared loader in
   `tests/oracle/svg-conformance/capture-clock.ts`).
5. Prove `dist/*.d.ts` unchanged (build before/after, `diff -r`).

## Write-set
`src/core/clock.ts`, `src/core/tim/builtin/TimEnvironment.ts`,
`src/core/internal-render-options.ts`, `src/index.ts` (prepareBlock only),
`src/core/preprocessor.ts` (environment construction only),
`scripts/svg-parity-survey.ts`, `scripts/svg-conformance-census.ts`,
`tests/oracle/svg-conformance/{capture-clock.ts,render-fixture-gantt.ts}`,
`tests/unit/core/clock.test.ts`, `docs/catalog.md`.

## Acceptance
- Given no setter, then every existing `%now`/`%date` test and pin is green
  unchanged and the 28-engine survey shows 0 movers.
- Given the setter with `{ nowMillis: 1602288000000, zone: 'UTC' }`, then
  `%now()` = 1602288000.
- Given `npm run build`, then `dist/*.d.ts` is byte-identical (stop 6).
- Given the `unknown` `%date` row in jar mode with its recorded clock, then
  its survey verdict is reported (moving toward the jar is expected; report
  firstDiff before/after).

Observability: N/A. Rollback: Reversible.
