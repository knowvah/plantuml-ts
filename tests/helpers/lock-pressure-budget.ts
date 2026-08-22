/**
 * test-budget-invariant T1 -- the one named budget for every vitest test
 * that acquires the stdlib build lock (`withStdlibBuildLock`,
 * `acquireBuildLock`, or a same-file helper wrapping either), directly or
 * transitively. See `plans/test-budget-invariant/diagrams/budget-invariant.md`
 * for why a lock-using test needs a budget at all: vitest's default 5,000ms
 * fires before `acquireBuildLock` can throw its own diagnosis, so the test
 * dies wearing the lock's failure as a generic timeout instead.
 *
 * Derivation (`plans/test-budget-invariant/decisions.md` D3):
 *   - lock `maxWaitMs` = 30,000ms (`DEFAULT_MAX_WAIT_MS`,
 *     `scripts/build-stdlib-packages/build-lock.ts:64`) -- the longest a
 *     test may legitimately queue before the lock itself gives up.
 *   - plus the worst measured critical section, `maxHoldMs` = 20,029ms,
 *     concurrent-pair configuration (`.agent-notes/lsh-T4.md`, SI36 T4) --
 *     the longest another holder has been observed to keep the lock.
 *   - sums to a legitimate worst case of ~50,000ms (wait + hold); this
 *     constant adds margin on top of that rather than tracking it exactly,
 *     landing at 120,000ms, ~2.4x the derived worst case.
 *
 * The value does not move without new measurement: D3 explicitly rejects
 * lowering it against a wait-only reading, because a lock-using test's
 * budget must cover wait AND hold, not wait alone.
 */
export const LOCK_PRESSURE_BUDGET_MS = 120_000;
