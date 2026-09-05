/**
 * Persistent-worker pool for `svg-parity-survey.ts`.
 *
 * The survey used to spawn ONE `jiti` subprocess per fixture. That is correct
 * and pathologically slow: a worker spends **~8.9 s importing
 * `src/index.js`** and then **~7 ms rendering**, so a 1,351-fixture corpus
 * paid ~3.5 CPU-hours of module loading to do ~9 s of work (measured, not
 * estimated — see the survey's own header for the import figure and this
 * module's landing commit for the per-fixture one).
 *
 * Here each worker imports ONCE and then services fixtures from a queue over
 * stdin/stdout. Isolation moves from per-fixture to per-worker: a render that
 * hangs or crashes still cannot wedge the survey — the parent kills that
 * worker, records `timeout`/`errored` for the fixture it was on, and respawns
 * — but the blast radius of a crash is now one worker restart (~9 s) rather
 * than free. That is the whole trade, and it is worth it twice over: eight
 * other harnesses in `scripts/` already render hundreds of fixtures in one
 * process, and shrinking a 30-minute run to seconds removes the contention
 * window that produced 48 spurious `timeout` rows on a loaded machine.
 *
 * Protocol, deliberately line-oriented and one-in-flight-per-worker:
 *   parent -> worker  `<fixture dir>\n`
 *   worker -> parent  one line of JSON, `{ svg, dotEqual, oracleBlind }`
 *                     or `{ error: "..." }`
 * stdout carries the protocol and NOTHING else; the renderer's own warnings
 * go to stderr, where they cannot corrupt a frame.
 */

import type { ChildProcess } from 'node:child_process';

/** One fixture's render, as the worker reports it. */
export interface RenderedFixture {
  svg: string;
  dotEqual: boolean;
  oracleBlind: boolean;
}

/** What the pool observed for one fixture. Mirrors the three outcomes the
 *  per-fixture spawn model produced, so callers map them unchanged. */
export type WorkerOutcome =
  | { kind: 'ok'; rendered: RenderedFixture }
  | { kind: 'timeout' }
  | { kind: 'errored'; message: string };

export interface PoolOptions {
  /** Fixture directories, in output order. */
  dirs: string[];
  /** Spawns a fresh worker in `--render-many` mode. Called once per lane and
   *  again after every kill, so it must be side-effect free. */
  spawn: () => ChildProcess;
  /** Wall-clock budget for ONE fixture, not for the worker's lifetime. */
  timeoutMs: number;
  concurrency: number;
  onProgress?: (done: number, total: number) => void;
}

/** A worker plus the single in-flight request it is servicing. */
interface Lane {
  child: ChildProcess;
  stdout: string;
  stderr: string;
  settle?: ((o: WorkerOutcome) => void) | undefined;
}

function attach(lane: Lane): void {
  lane.child.stdout?.setEncoding('utf-8');
  lane.child.stderr?.setEncoding('utf-8');
  lane.child.stdout?.on('data', (chunk: string) => {
    lane.stdout += chunk;
    const nl = lane.stdout.indexOf('\n');
    if (nl === -1) return;
    const line = lane.stdout.slice(0, nl);
    lane.stdout = lane.stdout.slice(nl + 1);
    lane.settle?.(parseFrame(line, lane.stderr));
  });
  lane.child.stderr?.on('data', (chunk: string) => {
    lane.stderr += chunk;
  });
  // A worker that dies mid-request fails only that fixture; the lane respawns.
  lane.child.on('exit', () => lane.settle?.({ kind: 'errored', message: errLine(lane.stderr) }));
}

function parseFrame(line: string, stderr: string): WorkerOutcome {
  try {
    const parsed = JSON.parse(line) as Partial<RenderedFixture> & { error?: string };
    if (typeof parsed.error === 'string') return { kind: 'errored', message: parsed.error };
    if (typeof parsed.svg !== 'string') return { kind: 'errored', message: errLine(stderr) };
    return {
      kind: 'ok',
      rendered: {
        svg: parsed.svg,
        dotEqual: parsed.dotEqual === true,
        oracleBlind: parsed.oracleBlind === true,
      },
    };
  } catch {
    return { kind: 'errored', message: `unparseable worker frame: ${line.slice(0, 120)}` };
  }
}

/** First non-empty stderr line — the renderer's own message when it threw. */
function errLine(stderr: string): string {
  const hit = stderr
    .split('\n')
    .map((l) => l.replace('__RENDER_ERROR__', '').trim())
    .find((l) => l.length > 0);
  return hit ?? 'worker exited without a result';
}

function newLane(spawn: () => ChildProcess): Lane {
  const lane: Lane = { child: spawn(), stdout: '', stderr: '' };
  attach(lane);
  return lane;
}

/** Dispatch one fixture and settle on the worker's frame, its death, or the
 *  budget — whichever lands first. The timer is per FIXTURE, matching the
 *  semantics the per-spawn model had. */
function dispatch(lane: Lane, dir: string, timeoutMs: number): Promise<WorkerOutcome> {
  return new Promise<WorkerOutcome>((resolve) => {
    let settled = false;
    const timer = setTimeout(() => finish({ kind: 'timeout' }), timeoutMs);
    function finish(outcome: WorkerOutcome): void {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      lane.settle = undefined;
      resolve(outcome);
    }
    lane.settle = finish;
    lane.stderr = '';
    lane.child.stdin?.write(`${dir}\n`);
  });
}

/**
 * Runs every `dirs` entry through a pool of persistent workers, preserving
 * input order. A `timeout` or `errored` outcome kills and replaces that
 * worker before the lane takes its next fixture, so one bad fixture cannot
 * poison the ones behind it.
 */
export async function runPersistentPool(o: PoolOptions): Promise<WorkerOutcome[]> {
  const results: WorkerOutcome[] = new Array(o.dirs.length) as WorkerOutcome[];
  let next = 0;
  let done = 0;

  const lane = async (): Promise<void> => {
    let worker = newLane(o.spawn);
    for (let i = next++; i < o.dirs.length; i = next++) {
      const outcome = await dispatch(worker, o.dirs[i]!, o.timeoutMs);
      results[i] = outcome;
      if (outcome.kind !== 'ok') {
        worker.child.kill('SIGKILL');
        worker = newLane(o.spawn);
      }
      o.onProgress?.(++done, o.dirs.length);
    }
    worker.child.stdin?.end();
    worker.child.kill('SIGKILL');
  };

  const n = Math.max(1, Math.min(o.concurrency, o.dirs.length));
  await Promise.all(Array.from({ length: n }, lane));
  return results;
}
