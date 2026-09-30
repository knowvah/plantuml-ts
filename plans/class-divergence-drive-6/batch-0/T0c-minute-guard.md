# T0c: plain-minute guard for error-page captures (D9)

Return only the structured report: commit sha, files, tests.

## Context
`PSystemError.java:218-228` decorates every jar error page with a donation banner
when `currentTimeMillis()/60000 % 60` is 1, 8, 13, 15, 30, 39, 48 or 55
(`disableTimeBasedErrorDecorations()` has no caller). cdd5 found decorated oracles
in the cache and in a golden (`.agent-notes/cdd5-T0e-error-page-time-decoration.md`;
the shell precedent is `plans/class-divergence-drive-5/measurements/t0c/safe-render-one.sh`).

## Task (TDD)
1. New `scripts/lib/oracle-minute-guard.ts`: pure `isDecorationMinute(minute)` and
   an injectable-clock `runInPlainMinute(fn, clock, sleep)` that waits out a
   decoration minute and retries when the minute at start or end is decorated
   (clock injected; no real sleeping in tests).
2. Use it in `scripts/rebaseline-svg-goldens.ts` and `scripts/capture-oracle-cache.ts`
   around each jar invocation.

## Write-set
`scripts/lib/oracle-minute-guard.ts` (new), `scripts/rebaseline-svg-goldens.ts`,
`scripts/capture-oracle-cache.ts`, their tests.

## Acceptance
- Given minute 30, then `isDecorationMinute` is true; given 31, false.
- Given a render that starts at 47:59 and ends at 48:02, then it is retried.
- Given both scripts, then every jar call goes through the guard.

## Quality bar
TDD with a fake clock; targeted vitest (collected count), typecheck, eslint.
Do NOT run the jar. Worktree rules: README. Commit `fix(oracle): …`.

**Observability:** N/A. **Rollback:** Reversible.
