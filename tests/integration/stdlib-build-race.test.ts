/**
 * stdlib-build-race, T1 -- promotes the T0 diagnosis harness into a real
 * test, spawning the committed harness at
 * `tests/helpers/stdlib-build-race-writer.ts` + `stdlib-build-race-reader.ts`
 * (originally proved out in `scripts_scratch/T0/`, semantics unchanged;
 * see `.agent-notes/sre-T0.md`).
 *
 * Mechanism under test (full artifact: `.agent-notes/sre-T0.md`):
 * `buildStdlibPackages()`'s `freshGeneratedDir` helper
 * (`scripts/build-stdlib-packages.ts:42-47`) unconditionally `rmSync`s the
 * fixed, repo-absolute `packages/<pkg>/generated/` directory and
 * repopulates it with several sequential `writeFileSync` calls before any
 * reader can observe a complete tree again. A second, independently
 * scheduled OS process running the same rebuild (e.g. a second concurrent
 * `npm test`/`vitest` invocation's `globalSetup`) has no coordination with
 * the first, so its `rmSync`-to-rewrite window can overlap another
 * process's import of a generated file, producing
 * `Cannot find module '.../tupadr3.remote.js'` / `ENOENT`.
 *
 * **Guarded behind STDLIB_BUILD_RACE_REPRO, skipped by default.** This is
 * not a unit test: it spawns two real OS processes and deliberately forces
 * a genuine inter-process race against this repo's actual
 * `packages/*​/generated/` tree (D2, `plans/stdlib-build-race/decisions.md`).
 * That makes it both slow (a real writer/reader loop, not a mock) and
 * inherently timing-dependent. The assertion below asserts the ABSENCE of
 * the race (clean reader exit, no `FAIL at attempt` signature), so this
 * test is EXPECTED TO FAIL RED on this unfixed tree -- that red result is
 * the evidence the bug exists -- and is expected to flip to PASS once the
 * mission's build lock (T4) lands. Neither the cost nor the flakiness
 * belongs in every `npm test` run, so it must stay opt-in. Do not remove
 * this guard "to get more coverage" -- it exists precisely so this file's
 * cost and flakiness never land on the default suite.
 *
 * Run explicitly: `STDLIB_BUILD_RACE_REPRO=1 npx vitest run
 * tests/integration/stdlib-build-race.test.ts`
 *
 * @see .agent-notes/sre-T0.md -- full diagnosis artifact and repro data
 * @see tests/helpers/stdlib-build-race-writer.ts -- writer half (real buildStdlibPackages loop)
 * @see tests/helpers/stdlib-build-race-reader.ts -- reader half (cache-busted import loop)
 */
import { describe, it, expect } from 'vitest';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const WRITER_SCRIPT = join(REPO_ROOT, 'tests', 'helpers', 'stdlib-build-race-writer.ts');
const READER_SCRIPT = join(REPO_ROOT, 'tests', 'helpers', 'stdlib-build-race-reader.ts');

// Values T0 measured as reliably reproducing (5/5 runs, mean 700.6 reader
// attempts to first failure) -- not re-tuned here.
const WRITER_ITERATIONS = 300;
const WRITER_DELAY_MS = 2;
const READER_ATTEMPTS = 100_000;
const RACE_TEST_TIMEOUT_MS = 120_000;

interface ProcResult {
  readonly stdout: string;
  readonly exitCode: number | null;
}

function runJiti(scriptPath: string, args: readonly string[]): Promise<ProcResult> {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['jiti', scriptPath, ...args], {
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
    child.on('error', reject);
    child.on('close', (exitCode) => {
      resolve({ stdout, exitCode });
    });
  });
}

describe.skipIf(!process.env.STDLIB_BUILD_RACE_REPRO)(
  'stdlib build race -- inter-process rebuild vs. import (SRE T0/T1)',
  () => {
    it(
      'a concurrent buildStdlibPackages() rebuild does not race a tupadr3.remote.js import',
      async () => {
        const [, readerResult] = await Promise.all([
          runJiti(WRITER_SCRIPT, [String(WRITER_ITERATIONS), String(WRITER_DELAY_MS)]),
          runJiti(READER_SCRIPT, [String(READER_ATTEMPTS)]),
        ]);

        expect(readerResult.stdout).not.toMatch(/FAIL at attempt \d+: (Cannot find module|ENOENT)/);
        expect(readerResult.exitCode).toBe(0);
      },
      RACE_TEST_TIMEOUT_MS,
    );
  },
);
