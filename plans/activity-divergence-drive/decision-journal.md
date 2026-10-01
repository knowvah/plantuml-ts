# Decision journal: add1

Append one row per decision, mover, halt or batch close. Never edit past rows;
correct with a new row that cites the old one.

| # | when | task | kind (decision / mover / halt / close) | what | mechanism (Java file:line) |
|---|---|---|---|---|---|
| 1 | 2026-09-30 | T0a | decision | b0 on `dd5e93af9`: probe Σ 60988 over 311 baseline rows; classify 311 rows, 0 errors, 9 position-only, 7 uniform-shift; family/ws/shift identical to plan-classify on all 311; cohort ws≤100 = 75 (≤50: 39, ≤20: 9), ledger unchanged | measurement only |
| 2 | 2026-09-30 | T0a | decision | `activity-probe-classify.ts` passes `{ includeStore }` (the gate's shape); the planning scratch passed the store as the options object. Re-run with the fix: 311 rows byte-identical to b0-classify (no activity fixture uses `!include`), so b0 stands | `render-fixture-activity.ts:131-134` options = `PreprocessOptions & ParseOptions`; `activity-probe.ts:265` already correct |
| 3 | 2026-09-30 | T0a | decision | b0-eng (27 engines, 0 timeouts at load ~4.4) vs the committed `parity-*.json`: 13 verdict changes, all gains (c4 1, component 2, object 4, sequence 6 errored->diverged); 0 losses. The committed files lag main's code; `b0-eng/` is the reference from here | measurement only |
| 4 | 2026-09-30 | T0b | decision | merged `7aabdeea8` (merge `599034c8e`). Write-set + `tools/vitest.config.mts` (pre-authorised) + `tools/tsconfig.json` (ad-hoc typecheck, mirrors class tools; not gated). Agent report quoted 268/82 baseline/error; actual 311/39 — comment fixed in a fix commit, assertion (sum 373) was already right. Style/text/swimlane baseline tests read only their own files (agent: `activity.style-baseline.test.ts:125`, `text-baseline:84`, `swimlane-baseline:124`) | D5 |
| 5 | 2026-09-30 | b0 | close | four gates green: npm test 1003 collected = 1003 on disk, 0 failed; typecheck, lint, build exit 0 | — |
| 6 | 2026-09-30 | T1b | decision | T1b first commit `0e7938b69`: Σ 60988→60186 (agent-measured), textLength-diff fixtures 301→204. Residual sites `core/svg#text` in `activity-renderer-{if-shapes:73,signal-shapes:43,swimlanes:125}.ts` — hook-forced helper splits outside the literal write-set. Push-forward: T1b's write-set extended to those three files + their unit tests (none is T1a's) so D1 holds ("no second text path"); resumed T1b for one more commit | D1; README push-forward 'helper splits' |
