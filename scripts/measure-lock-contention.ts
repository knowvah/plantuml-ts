#!/usr/bin/env node
/**
 * stdlib-lock-sharing T0 -- reproducible baseline for the stdlib build
 * lock's reader-vs-reader contention (`.agent-notes/stdlib-lock-budget.md`,
 * the hand-measurement this script exists to promote to a committed,
 * reusable harness). MEASUREMENT ONLY -- writes no fix, changes no lock
 * behavior (`plans/stdlib-lock-sharing/decisions.md` D4).
 *
 * ## Mechanism
 *
 * `acquireBuildLock` (`build-stdlib-packages/build-lock.ts`) accepts an
 * env-gated tracing hook, OFF by default: when `STDLIB_LOCK_TRACE_DIR`
 * names a directory, every acquisition appends one JSON line to
 * `<dir>/lock-trace-<pid>.jsonl` recording how long the caller waited and
 * (on success) how long it then held the lock. That hook is the ONLY
 * seam available here -- every production caller
 * (`build-stdlib-packages.ts`, `tests/helpers/with-stdlib-build-lock.ts`,
 * and its 8 reader call sites, all out of this task's write-set) invokes
 * `acquireBuildLock`/`withStdlibBuildLock` with no `now`/`log` override, so
 * there is no way to observe a REAL, unmodified `npm test` run from
 * outside without it. This script never reaches into `build-lock.ts`'s
 * internals (D4) -- it only sets the env var and reads the files that
 * public entry point writes.
 *
 * Each `npm test` run is a separate OS process (`npm` -> vitest), and
 * vitest's default pool for the v8 coverage provider is `forks`
 * (`node_modules/vitest/dist/chunks/coverage.*.js`: `resolved.pool ??=
 * "forks"`) -- every worker is its own child process with its own pid, so
 * two concurrent `npm test` invocations sharing one trace directory never
 * share a pid and never race on the same trace file (mirrors
 * `tests/helpers/coverage-reports-directory.ts`'s per-pid isolation, which
 * this script also sets for the concurrent-pair configuration --
 * `.agent-notes/coverage-tmp-race.md`).
 *
 * ## Usage
 *
 *   npx jiti scripts/measure-lock-contention.ts --config single
 *   npx jiti scripts/measure-lock-contention.ts --config concurrent-pair
 *   npx jiti scripts/measure-lock-contention.ts            # both, in turn
 *
 * Output: one JSON line per configuration, matching {@link LockContentionSummary}.
 * Always exits 0 -- this is a report, not a gate; a non-zero `npm test`
 * exit (e.g. a genuine lock timeout) is logged to stderr but does not
 * abort the measurement, since a failed run's partial trace data is
 * exactly what a contention baseline needs to see.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Must match `LOCK_TRACE_DIR_ENV_VAR` in
 * `scripts/build-stdlib-packages/build-lock.ts` -- duplicated rather than
 * imported because the constant is deliberately unexported (D4: keep the
 * hook's footprint on that module's public surface at zero). */
const LOCK_TRACE_DIR_ENV_VAR = 'STDLIB_LOCK_TRACE_DIR';

/** Must match `COVERAGE_ISOLATE_ENV_VAR`
 * (`tests/helpers/coverage-reports-directory.ts`). */
const COVERAGE_ISOLATE_ENV_VAR = 'COVERAGE_ISOLATE';

export type Configuration = 'single' | 'concurrent-pair';

export interface LockContentionSummary {
  readonly configuration: Configuration;
  readonly acquisitions: number;
  readonly totalWaitMs: number;
  readonly totalHoldMs: number;
  readonly meanHoldMs: number;
  readonly maxHoldMs: number;
  readonly maxWaitMs: number;
  readonly timeouts: number;
}

interface AcquiredRecord {
  readonly kind: 'acquired';
  readonly pid: number;
  readonly acquiredAtMs: number;
  readonly waitMs: number;
  readonly holdMs: number;
}

interface TimeoutRecord {
  readonly kind: 'timeout';
  readonly pid: number;
  readonly waitMs: number;
}

export type TraceRecord = AcquiredRecord | TimeoutRecord;

// ---------------------------------------------------------------------------
// Parsing -- external data (a file this process did not itself just write,
// in the concurrent-pair case) crossing a boundary: narrowed through a type
// guard, never cast.
// ---------------------------------------------------------------------------

function isAcquiredRecord(value: unknown): value is AcquiredRecord {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<AcquiredRecord>;
  return (
    v.kind === 'acquired' &&
    typeof v.pid === 'number' &&
    typeof v.acquiredAtMs === 'number' &&
    typeof v.waitMs === 'number' &&
    typeof v.holdMs === 'number'
  );
}

function isTimeoutRecord(value: unknown): value is TimeoutRecord {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<TimeoutRecord>;
  return v.kind === 'timeout' && typeof v.pid === 'number' && typeof v.waitMs === 'number';
}

/** One trace line -> a validated {@link TraceRecord}, or `undefined` for a
 * blank line or a shape that doesn't match either kind (defensive: a
 * partially-written line from a killed process must not crash the report). */
export function parseTraceLine(line: string): TraceRecord | undefined {
  if (line.trim() === '') return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(line);
  } catch {
    return undefined;
  }
  if (isAcquiredRecord(parsed)) return parsed;
  if (isTimeoutRecord(parsed)) return parsed;
  return undefined;
}

function readTraceRecords(dir: string): TraceRecord[] {
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir).filter((name) => name.startsWith('lock-trace-') && name.endsWith('.jsonl'));
  const records: TraceRecord[] = [];
  for (const file of files) {
    const content = readFileSync(join(dir, file), 'utf8');
    for (const line of content.split('\n')) {
      const record = parseTraceLine(line);
      if (record !== undefined) records.push(record);
    }
  }
  return records;
}

// ---------------------------------------------------------------------------
// Summary -- pure, unit-testable in isolation from process spawning.
// ---------------------------------------------------------------------------

function sumBy(records: readonly AcquiredRecord[], select: (r: AcquiredRecord) => number): number {
  return records.reduce((sum, r) => sum + select(r), 0);
}

function maxBy(records: readonly AcquiredRecord[], select: (r: AcquiredRecord) => number): number {
  return records.reduce((max, r) => Math.max(max, select(r)), 0);
}

function sumWaitMs(records: readonly TraceRecord[]): number {
  return records.reduce((sum, r) => sum + r.waitMs, 0);
}

function maxOfWaitMs(records: readonly TraceRecord[]): number {
  return records.reduce((max, r) => Math.max(max, r.waitMs), 0);
}

/**
 * The production budget every real caller uses -- MUST match
 * `DEFAULT_MAX_WAIT_MS` in `build-stdlib-packages/build-lock.ts` (kept a
 * separate literal, not imported, for the same reason
 * `LOCK_TRACE_DIR_ENV_VAR` is duplicated above: D4 keeps that module's
 * exported surface at zero for this task).
 *
 * `build-stdlib-lock.test.ts` deliberately drives two acquisitions to
 * THROW with a far shorter budget (`maxWaitMs: 100`, `maxWaitMs: 150`) to
 * unit-test the timeout path itself -- both real `'timeout'` trace
 * records, both inherited into every trace file because the hook fires
 * for every `acquireBuildLock` call process-wide, not only the real
 * stdlib-lock ones. Counting "exceeded maxWaitMs" against a FIXED 30,000ms
 * threshold (task instruction, and the module's own default) rather than
 * "did throw" is what keeps those two intentional, ~100-150ms unit-test
 * timeouts from being misreported as production-budget contention in an
 * otherwise fully uncontended single run.
 */
const PRODUCTION_MAX_WAIT_MS = 30_000;

/** Builds the {@link LockContentionSummary} contract row for one
 * configuration from its raw trace records. `timeouts` counts every
 * record (successful or thrown) whose `waitMs` reached
 * {@link PRODUCTION_MAX_WAIT_MS} -- see that constant's comment for why a
 * fixed 30s threshold, not "any throw", is correct here. */
export function summarizeTraceRecords(
  configuration: Configuration,
  records: readonly TraceRecord[],
): LockContentionSummary {
  const acquired = records.filter((r): r is AcquiredRecord => r.kind === 'acquired');
  const totalHoldMs = sumBy(acquired, (r) => r.holdMs);
  return {
    configuration,
    acquisitions: acquired.length,
    totalWaitMs: sumWaitMs(records),
    totalHoldMs,
    meanHoldMs: acquired.length === 0 ? 0 : totalHoldMs / acquired.length,
    maxHoldMs: maxBy(acquired, (r) => r.holdMs),
    maxWaitMs: maxOfWaitMs(records),
    timeouts: records.filter((r) => r.waitMs >= PRODUCTION_MAX_WAIT_MS).length,
  };
}

// ---------------------------------------------------------------------------
// Process spawning -- the impure shell.
// ---------------------------------------------------------------------------

/** Runs `npm test` to completion. Never rejects on a non-zero test-suite
 * exit (a lock timeout failing a test is exactly the data this baseline
 * wants) -- only on a spawn failure (`npm` itself missing), which IS a
 * setup error worth aborting on. */
function runNpmTest(env: NodeJS.ProcessEnv, label: string): Promise<number | null> {
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['test'], { cwd: REPO_ROOT, env, stdio: 'inherit' });
    child.on('error', reject);
    child.on('close', (exitCode) => {
      if (exitCode !== 0) {
        process.stderr.write(`[measure-lock-contention] ${label} exited ${String(exitCode)}\n`);
      }
      resolve(exitCode);
    });
  });
}

function makeTraceDir(): string {
  return mkdtempSync(join(tmpdir(), 'plantuml-ts-lock-trace-'));
}

async function measureSingle(): Promise<LockContentionSummary> {
  const traceDir = makeTraceDir();
  try {
    await runNpmTest({ ...process.env, [LOCK_TRACE_DIR_ENV_VAR]: traceDir }, 'single');
    return summarizeTraceRecords('single', readTraceRecords(traceDir));
  } finally {
    rmSync(traceDir, { recursive: true, force: true });
  }
}

async function measureConcurrentPair(): Promise<LockContentionSummary> {
  const traceDir = makeTraceDir();
  try {
    const env = { ...process.env, [LOCK_TRACE_DIR_ENV_VAR]: traceDir, [COVERAGE_ISOLATE_ENV_VAR]: '1' };
    await Promise.all([runNpmTest(env, 'concurrent-pair[a]'), runNpmTest(env, 'concurrent-pair[b]')]);
    return summarizeTraceRecords('concurrent-pair', readTraceRecords(traceDir));
  } finally {
    rmSync(traceDir, { recursive: true, force: true });
  }
}

async function measure(configuration: Configuration): Promise<LockContentionSummary> {
  return configuration === 'single' ? measureSingle() : measureConcurrentPair();
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const ALL_CONFIGURATIONS: readonly Configuration[] = ['single', 'concurrent-pair'];

export function parseConfigurations(args: readonly string[]): readonly Configuration[] {
  const index = args.indexOf('--config');
  if (index === -1) return ALL_CONFIGURATIONS;
  const value = args[index + 1];
  if (value === 'single' || value === 'concurrent-pair') return [value];
  throw new Error(`Unknown --config value: ${value ?? '(missing)'} -- expected 'single' or 'concurrent-pair'`);
}

/* v8 ignore start -- CLI entry point; the pure functions above
 * (parseTraceLine, summarizeTraceRecords, parseConfigurations) are the
 * unit-testable surface. This is a one-shot measurement script, not
 * production code -- no test file is planned for the CLI shell. */
async function main(): Promise<void> {
  const configurations = parseConfigurations(process.argv.slice(2));
  for (const configuration of configurations) {
    const result = await measure(configuration);
    process.stdout.write(`${JSON.stringify(result)}\n`);
  }
  process.exitCode = 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((err: unknown) => {
    process.stderr.write(`${String(err)}\n`);
    process.exitCode = 1;
  });
}
/* v8 ignore stop */
