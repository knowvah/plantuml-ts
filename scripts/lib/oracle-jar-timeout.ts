/**
 * Shared timeout for a single oracle-jar invocation (one `.puml` in, one
 * JVM start, one render). Used by every script that shells out to the
 * pinned oracle jar for exactly one fixture at a time.
 *
 * Value: unified from two pre-existing constants (code-review-tasks.md
 * item 3) — capture-oracle-cache.ts and dot-sync-report.ts each used
 * 25_000ms, oracle-corpus.ts used 20_000ms. `git log -S` on both
 * introducing commits (513ab128, bc0380c3) shows neither commit message
 * nor a nearby comment documents why the two differ; the difference is
 * not a considered budget, so the two are unified on the larger (safer)
 * value rather than risking a false timeout on a slow fixture.
 *
 * `oracle-render.sh` -- the shell equivalent of this same one-fixture
 * call -- hardcodes the same number in seconds (see that file's header);
 * keep the two in sync by hand, there is no shared config format between
 * bash and TypeScript here.
 */
export const ORACLE_JAR_TIMEOUT_MS = 25_000;

/**
 * Timeout for a BATCHED oracle-jar invocation (many `.puml` files handed to
 * one JVM start, e.g. dot-sync-fixtures.ts / rebaseline-svg-goldens.ts).
 * One JVM start is amortised across the whole batch, but per-fixture render
 * time still scales with batch size, so the budget must too.
 */
export function oracleJarBatchTimeoutMs(batchSize: number): number {
  return ORACLE_JAR_TIMEOUT_MS * batchSize;
}
