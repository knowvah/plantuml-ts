/**
 * `census-<type>.json` serialisation for `svg-conformance-census.ts --json
 * <path>` (pdr-T2 / mission architecture decision D5). Extracted from
 * svg-conformance-census.ts because adding this inline would have pushed
 * that file past the 500-line hook limit (433 lines before this task).
 *
 * `toCensusJson` is the pure serialiser: `runJsonMode` (the impure shell
 * `main()` calls) supplies the two non-deterministic inputs — `generatedAt`
 * and `measuredAgainstCommit` — as `meta`, so `toCensusJson` itself stays
 * data-in/data-out (testability.md's "inject non-determinism"): the same
 * `rows` and `meta` always produce the same `CensusJson`.
 *
 * `Bucket`/`bucketOf` live here, not in svg-conformance-census.ts, because
 * that script imports `toCensusJson`/`jsonPathArg`/`runJsonMode` from THIS
 * module — owning the bucket helpers here too keeps the dependency
 * one-directional (census.ts -> this file) instead of circular.
 */
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import type { CensusResult } from './svg-conformance-census.js';

export type Bucket = '0' | '1-3' | '4-10' | '11-30' | '31+';

export function bucketOf(diffCount: number): Bucket {
  if (diffCount === 0) return '0';
  if (diffCount <= 3) return '1-3';
  if (diffCount <= 10) return '4-10';
  if (diffCount <= 30) return '11-30';
  return '31+';
}

export interface CensusJsonFixture {
  readonly slug: string;
  readonly status: 'ok' | 'error';
  readonly diffCount: number | null;
  readonly bucket: Bucket | null;
  readonly reason?: string;
}

export interface CensusJsonMeta {
  readonly generatedAt: string;
  readonly measuredAgainstCommit: string;
}

export interface CensusJson {
  readonly generatedAt: string;
  readonly measuredAgainstCommit: string;
  readonly type: string;
  readonly measurer: 'deterministic';
  readonly fixtures: readonly CensusJsonFixture[];
}

function toCensusJsonFixture(r: CensusResult): CensusJsonFixture {
  if (r.diffCount === 'error') {
    return { slug: r.slug, status: 'error', diffCount: null, bucket: null, reason: r.reason ?? 'unknown error' };
  }
  return { slug: r.slug, status: 'ok', diffCount: r.diffCount, bucket: bucketOf(r.diffCount) };
}

/**
 * Pure: serialises one diagram `type`'s census `rows` into the
 * `census-<type>.json` contract (pdr-T2 interface contract — no extra
 * top-level keys, fixtures sorted by slug). Calling this twice with the same
 * `rows` and the same `type` produces byte-identical output except whatever
 * differs in `meta` (AC4).
 */
export function toCensusJson(type: string, rows: readonly CensusResult[], meta: CensusJsonMeta): CensusJson {
  const fixtures = rows.map(toCensusJsonFixture).sort((a, b) => a.slug.localeCompare(b.slug));
  return {
    generatedAt: meta.generatedAt,
    measuredAgainstCommit: meta.measuredAgainstCommit,
    type,
    measurer: 'deterministic',
    fixtures,
  };
}

/**
 * Pure: extracts the `<path>` argument following `--json` in `argv`, or
 * `undefined` if the flag is absent. Throws if `--json` is present with no
 * following argument.
 */
export function jsonPathArg(argv: readonly string[]): string | undefined {
  const idx = argv.indexOf('--json');
  if (idx === -1) return undefined;
  const path = argv[idx + 1];
  if (path === undefined) throw new Error('--json requires a <path> argument');
  return path;
}

/**
 * Impure shell (testability.md's "functional core, imperative shell"): reads
 * the current commit and time, builds the `CensusJson` via the pure
 * `toCensusJson`, and writes it to `jsonPath`. `repoDir` is the `cwd` for
 * `git rev-parse` so this is runnable from anywhere, not just the repo root.
 */
export function runJsonMode(jsonPath: string, type: string, rows: readonly CensusResult[], repoDir: string): void {
  const meta: CensusJsonMeta = {
    generatedAt: new Date().toISOString(),
    measuredAgainstCommit: execSync('git rev-parse --short HEAD', { cwd: repoDir }).toString().trim(),
  };
  const json = toCensusJson(type, rows, meta);
  writeFileSync(jsonPath, JSON.stringify(json, null, 2) + '\n');
}
