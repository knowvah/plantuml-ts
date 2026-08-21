/**
 * stdlib-build-race, T1 -- promotes the T0 diagnosis harness into a real
 * test, spawning the committed harness at
 * `tests/helpers/stdlib-build-race-writer.ts` + `stdlib-build-race-reader.ts`
 * (originally proved out in `scripts_scratch/T0/`; see `.agent-notes/
 * sre-T0.md`).
 *
 * Mechanism under test (full artifact: `.agent-notes/sre-T0.md`):
 * `buildStdlibPackages()`'s `freshGeneratedDir` helper
 * (`scripts/build-stdlib-packages.ts`) unconditionally `rmSync`s the
 * fixed, repo-absolute `packages/<pkg>/generated/` directory and
 * repopulates it with several sequential `writeFileSync` calls before any
 * reader can observe a complete tree again. A second, independently
 * scheduled OS process running the same rebuild (e.g. a second concurrent
 * `npm test`/`vitest` invocation's `globalSetup`) has no coordination with
 * the first, so its `rmSync`-to-rewrite window can overlap another
 * process's import of a generated file, producing
 * `Cannot find module '.../tupadr3.remote.js'` / `ENOENT`.
 *
 * **What this harness does and does not cover (updated after stdlib-build-race
 * T2 landed the content-derived up-to-date skip).** T2 makes
 * `buildStdlibPackages()` skip its destructive `rmSync`+rewrite entirely
 * when `generated/` already hash-matches the current build inputs. That
 * closes exactly the case this harness exercises -- a writer rebuilding
 * UNCHANGED inputs against a reader importing concurrently -- so this test
 * is expected to PASS on a tree with T2's skip in place. It does NOT cover
 * the case where inputs genuinely changed mid-run (the writer then still
 * `rmSync`s a partial tree underneath a reader): that residual window is
 * closed by the build lock (T4), not by anything this harness simulates.
 * A PASS here is evidence the unchanged-inputs case stays fixed; it is not
 * evidence the changed-inputs case is fixed too.
 *
 * **Guarded behind STDLIB_BUILD_RACE_REPRO, skipped by default.** This is
 * not a unit test: it spawns two real OS processes and deliberately forces
 * a genuine inter-process race against this repo's actual
 * `packages/*​/generated/` tree (D2, `plans/stdlib-build-race/decisions.md`).
 * That makes it both slow relative to the rest of the suite (a real
 * writer/reader loop, not a mock) and inherently timing-dependent. Neither
 * property belongs in every `npm test` run, so it must stay opt-in. Do not
 * remove this guard "to get more coverage" -- it exists precisely so this
 * file's cost and any residual flakiness never land on the default suite.
 *
 * Run explicitly: `STDLIB_BUILD_RACE_REPRO=1 npx vitest run
 * tests/integration/stdlib-build-race.test.ts`
 *
 * @see .agent-notes/sre-T0.md -- full diagnosis artifact and repro data
 * @see .agent-notes/sre-T1.md -- this file's fix-commits (reader
 *      termination, iteration count, orphan cleanup)
 * @see tests/helpers/stdlib-build-race-writer.ts -- writer half (real buildStdlibPackages loop)
 * @see tests/helpers/stdlib-build-race-reader.ts -- reader half (cache-busted import loop)
 */
import { describe, it, expect, afterEach } from 'vitest';
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const WRITER_SCRIPT = join(REPO_ROOT, 'tests', 'helpers', 'stdlib-build-race-writer.ts');
const READER_SCRIPT = join(REPO_ROOT, 'tests', 'helpers', 'stdlib-build-race-reader.ts');

// T0 measured 300/2ms as reliably reproducing the race pre-T2. Reduced
// here to 275, WITH margin, not tuned to a razor's edge: every recorded
// pre-fix failure (T0's 334-1297, mean 700.6; this mission's 888, 1036
// reader attempts) exposed the race well before the writer's loop needed
// to run all 300 real iterations -- the coordinator's read of that data
// puts the observed floor at writer iteration ~250. 275 keeps 25
// iterations (10%) of margin above that floor while cutting real,
// measured wall-clock (see RACE_TEST_TIMEOUT_MS below): each iteration
// pays T2's `isGeneratedDirUpToDate` content-hash check over the whole
// generated tree even when it skips the destructive rewrite, so cost is
// ~linear in iteration count. This is NOT independently re-verified
// against the pre-fix builder here (would require reverting T2, which
// needs git writes out of this task's scope) -- if 275 proves
// insufficient, the orchestrator's own re-verification against the old
// builder will show it.
const WRITER_ITERATIONS = 275;
const WRITER_DELAY_MS = 2;

// Measured (not guessed) on the current tree with NO other reader/writer
// processes running: 275 writer iterations complete in ~123s
// (`.agent-notes/sre-T1.md` has the raw JSON). ~180s leaves close to 50%
// margin over that measurement, not a round guess.
const RACE_TEST_TIMEOUT_MS = 180_000;

interface SpawnedProc {
  readonly child: ChildProcess;
  readonly done: Promise<{ readonly stdout: string; readonly exitCode: number | null }>;
}

/**
 * Resolves a runnable `jiti` with NO wrapper process in between: the local
 * `node_modules/.bin/jiti` script has a `#!/usr/bin/env node` shebang, so
 * `spawn()`-ing it directly execs node as the child itself -- there is no
 * grandchild to signal through (mirrors `scripts/svg-parity-survey.ts`'s
 * `resolveJiti`). That matters here because the test kills the reader
 * directly; an `npx jiti ...` wrapper interposes an `npx` -> `npm exec` ->
 * `sh` chain between the PID this test holds and the actual worker
 * process, and killing only the top of that chain leaves the real worker
 * running as an orphan -- reproduced directly while diagnosing this file
 * (`.agent-notes/sre-T1.md`): several `npx jiti`-spawned reader processes
 * were left running, each pegging a CPU core, after their wrapper was
 * killed.
 */
function resolveLocalJiti(): { readonly cmd: string; readonly pre: readonly string[] } {
  const local = join(REPO_ROOT, 'node_modules', '.bin', 'jiti');
  if (existsSync(local)) return { cmd: local, pre: [] };
  return { cmd: 'npx', pre: ['--no-install', 'jiti'] };
}

function spawnScript(scriptPath: string, args: readonly string[]): SpawnedProc {
  const jiti = resolveLocalJiti();
  const child = spawn(jiti.cmd, [...jiti.pre, scriptPath, ...args], {
    cwd: REPO_ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '';
  child.stdout.on('data', (chunk: Buffer) => {
    stdout += chunk.toString();
  });
  child.stderr.on('data', (chunk: Buffer) => {
    stdout += chunk.toString();
  });
  const done = new Promise<{ stdout: string; exitCode: number | null }>((resolve, reject) => {
    child.on('error', reject);
    child.on('close', (exitCode) => {
      resolve({ stdout, exitCode });
    });
  });
  return { child, done };
}

// Tracks the two children of the CURRENT test only, so `afterEach` can
// force-kill them unconditionally. This is NOT optional cleanup: a vitest
// per-test timeout does not cancel the test's in-flight promise chain (Node
// has no true cancellation), so without this, a timed-out run leaves the
// writer and/or reader as orphaned, still-running OS processes.
let liveChildren: readonly ChildProcess[] = [];

afterEach(() => {
  for (const child of liveChildren) {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill('SIGKILL');
    }
  }
  liveChildren = [];
});

describe.skipIf(!process.env.STDLIB_BUILD_RACE_REPRO)(
  'stdlib build race -- inter-process rebuild vs. import (SRE T0/T1)',
  () => {
    it(
      'a concurrent buildStdlibPackages() rebuild does not race a tupadr3.remote.js import',
      async () => {
        const writer = spawnScript(WRITER_SCRIPT, [String(WRITER_ITERATIONS), String(WRITER_DELAY_MS)]);
        const reader = spawnScript(READER_SCRIPT, []);
        liveChildren = [writer.child, reader.child];

        // Coordinate off the writer's own lifetime: once its loop of REAL
        // buildStdlibPackages() calls has finished, there is nothing left
        // for the reader to race against. Kill it with SIGKILL rather than
        // asking it to stop gracefully: the reader's cache-busted `import()`
        // calls make each successive attempt slower (a NEW, never-evicted
        // entry lands in Node's ESM loader registry every time), so by the
        // time the writer finishes, a single in-flight import can take far
        // longer than any reasonable grace period -- measured directly,
        // a `SIGTERM` + cooperative stop flag sat unactioned for 100+
        // seconds (`.agent-notes/sre-T1.md`). `SIGKILL` cannot be caught,
        // ignored, or deferred, so it bounds shutdown to the OS's signal
        // latency (measured at single-digit milliseconds) regardless of
        // what the reader is doing internally. Whatever the reader had
        // already written to stdout before the kill -- including a
        // `FAIL at attempt N:` line, if the race fired -- is captured by
        // the `data` listeners in `spawnScript` before this point.
        await writer.done;
        reader.child.kill('SIGKILL');
        const readerResult = await reader.done;

        expect(readerResult.stdout).not.toMatch(/FAIL at attempt \d+: (Cannot find module|ENOENT)/);
      },
      RACE_TEST_TIMEOUT_MS,
    );
  },
);
