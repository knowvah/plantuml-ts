/**
 * Resolves vitest's `coverage.reportsDirectory`, so that two concurrent
 * `vitest run --coverage` invocations against one checkout do not destroy
 * each other's raw coverage shards.
 *
 * ## The mechanism this exists for
 *
 * Vitest does not expose the raw-coverage scratch directory as its own
 * option -- it derives it:
 *
 * ```
 * const tempDirectory = `.tmp${shard ? `-${shard.index}-${shard.count}` : ''}`;
 * this.coverageFilesDirectory = resolve(this.options.reportsDirectory, tempDirectory);
 * ```
 *
 * and its `clean()` unconditionally `rm -rf`s and recreates that directory at
 * **run start**, then writes per-worker shards into it as
 * `coverage-${uniqueId++}.json`. So two runs sharing `reportsDirectory` share
 * `.tmp`, and whichever starts second deletes the first run's shards while the
 * first is still writing them. The first run then dies during report
 * generation with `ENOENT ... coverage/.tmp/coverage-<n>.json`.
 *
 * This is a **documented usage constraint, not an upstream defect**: vitest
 * ships a dedicated error for exactly this case, advising against "running
 * multiple Vitests with the same `coverage.reportsDirectory` at the same
 * time", and uses the same directory-suffixing trick itself for `--shard`.
 * Line references and the full diagnosis are in
 * `.agent-notes/coverage-tmp-race.md`.
 *
 * ## The contract
 *
 * Off by default. An ordinary `npm test` -- and CI -- resolves the plain
 * `'coverage'` default and behaves exactly as it did before this seam
 * existed, thresholds included. Only a caller that sets the opt-in flag gets
 * a per-process directory, and it gets one **outside the repository**:
 * isolated runs are throwaway, and writing them under `coverage/` would leave
 * a per-pid directory behind after every concurrent run.
 *
 * Every input is injected rather than read from the ambient process, so the
 * resolution is a pure function and is testable without touching `process.env`.
 */
import { join } from 'node:path';

/** Where an ordinary, non-isolated run writes -- vitest's own default, kept
 * literal so a single run is unaffected by this seam. */
export const DEFAULT_COVERAGE_REPORTS_DIRECTORY = 'coverage';

/** Environment variable that opts a run into per-process isolation. Named in
 * the repo's existing bare-UPPER_SNAKE idiom (`STDLIB_BUILD_RACE_REPRO`,
 * `ORACLE_ALLOW_DRIFT`, `SVG_PARITY_CONCURRENCY`). */
export const COVERAGE_ISOLATE_ENV_VAR = 'COVERAGE_ISOLATE';

/** Values that read as "explicitly off". Anything else non-empty is on, so a
 * caller cannot accidentally disable isolation with an unexpected spelling --
 * but the two conventional falsy spellings still mean what they look like. */
const EXPLICITLY_OFF = new Set(['', '0', 'false']);

export interface CoverageReportsDirectoryInput {
  /** Raw value of {@link COVERAGE_ISOLATE_ENV_VAR}; `undefined` when unset. */
  readonly isolate: string | undefined;
  /** The resolving process's pid -- the isolation key. */
  readonly pid: number;
  /** The OS temp directory to place isolated runs under. */
  readonly tmpDir: string;
}

/**
 * Returns the directory vitest should use for `coverage.reportsDirectory`:
 * the plain default unless isolation is requested, in which case a
 * per-process directory under `tmpDir`.
 */
export function resolveCoverageReportsDirectory(input: CoverageReportsDirectoryInput): string {
  const flag = input.isolate?.trim().toLowerCase();

  if (flag === undefined || EXPLICITLY_OFF.has(flag)) {
    return DEFAULT_COVERAGE_REPORTS_DIRECTORY;
  }

  return join(input.tmpDir, `plantuml-ts-coverage-${input.pid}`);
}
