# T5 — Re-base the measurement on asset bytes

## Context

See [ADR-3](../decisions.md#adr-3).

`tests/integration/stdlib-remote-e2e.test.ts:50` defines
`TUPADR3_EAGER_MODULE` and reads it off disk as the denominator for SI11a's
measured **99.702%** reduction, logging it as "eager tupadr3.js baseline". T1
deleted that file.

## Task

Replace the baseline with the sum of the bundle's asset bytes, read from disk.
**Re-measure and restate the reduction.** Do not carry SI11a's number forward
and do not hardcode a constant.

## Write-set — write NOTHING outside this

- `tests/integration/stdlib-remote-e2e.test.ts` (modify)

If you find a defect in `src/` or the generator, that is a fix commit against
the owning task's file. Stop, report the mechanism, let the orchestrator route
it.

## Read-set

- `tests/integration/stdlib-remote-e2e.test.ts` — `TUPADR3_EAGER_MODULE`
  (~line 50), the logging block (~line 148), the awslib14 describe (~line 163)
- `packages/stdlib-tupadr3/assets/tupadr3/**` — the new baseline's source
- [ADR-3](../decisions.md#adr-3)
- `tests/integration/sprite-split-e2e.test.ts` — SI11b's measurement block,
  the shape to mirror

## Acceptance criteria

1. Given the eager module no longer exists, then the baseline is computed by
   summing the bundle's asset bytes from disk — never a hardcoded constant.
2. Given the run, then it LOGS the re-measured reduction in a block that is
   easy to read and quote, stating plainly that the denominator is now the
   asset tree.
3. Given the walk, then fetch counts, requested keys and every existing
   assertion are unchanged — only the denominator moves.
4. Given the new baseline, then it is within a few percent of the 20.49 MB
   eager module it replaces. A large gap means content is missing rather than
   re-based — **STOP and report** (stop condition 8).

## Quality bar

`npm run typecheck`, `npm run lint`, `npx vitest run
tests/integration/stdlib-remote-e2e.test.ts` clean. Do NOT run the full
`npm test`.

Offline, no timing assertions, no dependence on fetch ordering.

## Observability

The logged measurement IS this mission's headline evidence for the remote
path. Make it easy to read and quote, not buried in an assertion message.
Record the number in the decision journal — T6 and T7 quote it.

## Rollback

**Reversible** — revert the commit. Test-only.

## Boundaries

**Never:** hardcode the baseline; carry SI11a's 99.702% forward; edit SI11a's
row in `planning/mission-index.md` (dated numbers were true when taken);
relax an assertion to make the number look better; run a git mutation.

## Method rules

1. **Trace TWO levels:** the eager-module constant may be referenced by both
   the measurement block and a describe's setup — grep before deleting.
2. **Verify against the REAL asset tree**, not a computed estimate.

## Commit

`test(T5): re-base the remote measurement on the shipped asset bytes`
