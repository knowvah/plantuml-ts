/**
 * Unit tests for `resolveCoverageReportsDirectory`, the seam
 * `vitest.config.ts` uses to keep two concurrent `vitest run --coverage`
 * invocations off one another's scratch directory.
 *
 * Why this exists at all: vitest derives its raw-coverage scratch directory
 * from `reportsDirectory` -- `coverageFilesDirectory = resolve(reportsDirectory,
 * '.tmp')` -- and `clean()` does an unconditional `rm -rf` + `mkdir` of it at
 * run start. Two runs sharing `reportsDirectory` therefore share `.tmp`, and
 * the second run's start-of-run clean deletes the first run's shards
 * mid-flight. Vitest ships a dedicated error for precisely this
 * ("Make sure you are not running multiple Vitests with the same
 * `coverage.reportsDirectory` at the same time"), so it is a documented usage
 * constraint, not an upstream defect. See `.agent-notes/coverage-tmp-race.md`.
 */
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  DEFAULT_COVERAGE_REPORTS_DIRECTORY,
  resolveCoverageReportsDirectory,
} from './coverage-reports-directory.js';

const TMP = '/tmp-fixture';

describe('resolveCoverageReportsDirectory -- default (single-run) behaviour', () => {
  it('returns the plain default when the isolate flag is unset', () => {
    expect(resolveCoverageReportsDirectory({ isolate: undefined, pid: 4242, tmpDir: TMP })).toBe(
      DEFAULT_COVERAGE_REPORTS_DIRECTORY,
    );
  });

  it("keeps the default literally 'coverage', so an ordinary run writes exactly where it always did", () => {
    expect(DEFAULT_COVERAGE_REPORTS_DIRECTORY).toBe('coverage');
  });

  // The whole point of the opt-in gate: CI and every ordinary `npm test`
  // must be byte-identical to before this seam existed.
  it.each(['', '0', 'false'])('treats %o as "not isolating"', (value) => {
    expect(resolveCoverageReportsDirectory({ isolate: value, pid: 4242, tmpDir: TMP })).toBe(
      DEFAULT_COVERAGE_REPORTS_DIRECTORY,
    );
  });
});

describe('resolveCoverageReportsDirectory -- isolated (concurrent) behaviour', () => {
  it('returns a per-process directory outside the repo when the flag is set', () => {
    expect(resolveCoverageReportsDirectory({ isolate: '1', pid: 4242, tmpDir: TMP })).toBe(
      join(TMP, 'plantuml-ts-coverage-4242'),
    );
  });

  it.each(['1', 'true', 'yes', 'on'])('treats %o as "isolating"', (value) => {
    expect(resolveCoverageReportsDirectory({ isolate: value, pid: 7, tmpDir: TMP })).toBe(
      join(TMP, 'plantuml-ts-coverage-7'),
    );
  });

  // The property that actually closes the race: two concurrently-running
  // processes never resolve to the same directory, so they never share the
  // `.tmp` scratch dir vitest derives from it.
  it('gives two different pids two different directories', () => {
    const a = resolveCoverageReportsDirectory({ isolate: '1', pid: 101, tmpDir: TMP });
    const b = resolveCoverageReportsDirectory({ isolate: '1', pid: 102, tmpDir: TMP });

    expect(a).not.toBe(b);
  });

  it('is stable for one pid, so a single run resolves one directory throughout', () => {
    const first = resolveCoverageReportsDirectory({ isolate: '1', pid: 55, tmpDir: TMP });
    const second = resolveCoverageReportsDirectory({ isolate: '1', pid: 55, tmpDir: TMP });

    expect(first).toBe(second);
  });

  // Isolated runs are throwaway, and putting them under the repo's own
  // `coverage/` would leave a per-pid directory behind on every concurrent
  // run. The OS temp dir is reaped by the OS instead.
  it('places the isolated directory outside the repository', () => {
    const resolved = resolveCoverageReportsDirectory({ isolate: '1', pid: 9, tmpDir: TMP });

    // Rooted at the OS temp dir, and NOT the repo-relative default -- a
    // substring check for 'coverage' would pass trivially against
    // 'plantuml-ts-coverage-9', so assert the path shape instead.
    expect(resolved.startsWith(`${TMP}/`)).toBe(true);
    expect(resolved).not.toBe(DEFAULT_COVERAGE_REPORTS_DIRECTORY);
    expect(resolved.split('/').includes(DEFAULT_COVERAGE_REPORTS_DIRECTORY)).toBe(false);
  });
});
