/**
 * `docs/parity-report.md` dashboard — corpus/engine/oracle/DOT/survey/census
 * loaders (mission parity-dashboard-refresh, T6). Split from
 * `parity-dashboard-goldens.ts` (ratchet/diff-baseline/routing/refusal —
 * everything under `oracle/goldens/`) purely to keep each file under the
 * 500-line complexity cap; both feed `parity-dashboard.ts#loadInputs`.
 *
 * D2 (plans/parity-dashboard-refresh/decisions.md): every loader here reads a
 * COMMITTED artifact — it never renders a diagram or invokes the jar. The
 * summarizer half of each pair (`tally*`/`*StatsOf`) is pure and unit-tested
 * directly; the loader half is IO-only and exercised by the D9 drift test.
 */
import { closeSync, existsSync, openSync, readFileSync, readSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import type { FixtureRow, ParityReport, Verdict } from './svg-parity-survey.js';
import type { CensusJson, CensusJsonFixture } from './svg-conformance-census-json.js';
import type { DotParityJson } from './dot-parity-rows.js';
import { assertJsonArrayShape, assertJsonObjectShape } from './lib/assert-json-shape.js';

// ---------------------------------------------------------------------------
// Manifest buckets + corpus counts
// ---------------------------------------------------------------------------

/** The 28 `tests/visual/data/*.json` buckets (D7), alphabetical. */
export function manifestBuckets(dataDir: string): string[] {
  return readdirSync(dataDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''))
    .sort();
}

/** Fixture-array length per bucket — the "corpus" matrix column. */
export function corpusCountsOf(dataDir: string, buckets: readonly string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const b of buckets) {
    const bucketPath = join(dataDir, b + '.json');
    const parsed: unknown = JSON.parse(readFileSync(bucketPath, 'utf-8'));
    assertJsonArrayShape(parsed, bucketPath);
    out[b] = parsed.length;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Engine registry (parsed as DATA — never imports src/index.ts, which would
// pull in every diagram engine's full module graph just to read 14 names)
// ---------------------------------------------------------------------------

const REGISTER_RE = /registry\.register\((\w+)Plugin\)/g;

/** Pure: the plugin `type` values registered in `src/index.ts`, in
 *  registration order, parsed from its own source text rather than imported
 *  as a module. Every registered plugin here follows the `<type>Plugin`
 *  naming convention (verified against all 14 current registrations). */
export function registeredEngineTypes(indexTsSource: string): string[] {
  return [...indexTsSource.matchAll(REGISTER_RE)].map((m) => m[1]!);
}

// ---------------------------------------------------------------------------
// Oracle cache (test-results/dot-cache/<type>/*/.done)
// ---------------------------------------------------------------------------

/** Count of cached fixture dirs (a `.done` marker present) per dot-cache type. */
export function oracleCountsOf(cacheDir: string): Record<string, number> {
  if (!existsSync(cacheDir)) return {};
  const out: Record<string, number> = {};
  for (const type of readdirSync(cacheDir)) {
    const typeDir = join(cacheDir, type);
    out[type] = readdirSync(typeDir).filter((slug) => existsSync(join(typeDir, slug, '.done'))).length;
  }
  return out;
}

/**
 * The first line `PSystemUnsupported#getDescription` writes
 * (`PSystemUnsupported.java:62`), as the one whole `<text>` element the jar's
 * SVG exporter turns it into — anchored at both ends exactly the way
 * `routing-conformance.test.ts#isJarErrorPage` anchors the two error banners,
 * so a label merely mentioning the phrase cannot fire. `PSystemBuilder.java:284`
 * returns that system when no factory in the block's candidate set produced a
 * diagram; a cached golden carrying it is the jar DECLINING the source, not an
 * oracle of it. Keyed on the text PlantUML itself writes, never on a type name,
 * so pinning a jar that supports the type flips the classification by itself.
 */
const JAR_UNSUPPORTED_PAGE_RE = />Diagram not supported by this release of PlantUML<\/text>/;
/** The banner sits in the first element; the largest cached golden is 8 MB. */
const HEAD_BYTES = 4096;

export function isJarUnsupportedPage(head: string): boolean {
  return JAR_UNSUPPORTED_PAGE_RE.test(head);
}

function readHead(path: string): string {
  const fd = openSync(path, 'r');
  try {
    const buf = Buffer.alloc(HEAD_BYTES);
    return buf.subarray(0, readSync(fd, buf, 0, HEAD_BYTES, 0)).toString('utf8');
  } finally {
    closeSync(fd);
  }
}

/** Per dot-cache type: how many cached (`.done`) fixtures' `in.svg` is the jar's
 *  own unsupported-diagram page. `plantuml-ts only` in the matrix means this
 *  equals the type's whole oracle count (`parity-dashboard-matrix.ts#isPlantumlTsOnly`). */
export function jarUnsupportedCountsOf(cacheDir: string): Record<string, number> {
  if (!existsSync(cacheDir)) return {};
  const out: Record<string, number> = {};
  for (const type of readdirSync(cacheDir)) {
    const typeDir = join(cacheDir, type);
    out[type] = readdirSync(typeDir).filter((slug) => {
      const svg = join(typeDir, slug, 'in.svg');
      return existsSync(join(typeDir, slug, '.done')) && existsSync(svg) && isJarUnsupportedPage(readHead(svg));
    }).length;
  }
  return out;
}

// ---------------------------------------------------------------------------
// DOT parity (tests/oracle/svg-conformance/dot-parity.json — amendment)
// ---------------------------------------------------------------------------

export function loadDotParity(path: string): DotParityJson {
  const parsed: unknown = JSON.parse(readFileSync(path, 'utf-8'));
  assertJsonObjectShape(parsed, path, ['generatedAt', 'measuredAgainstCommit', 'rows']);
  return parsed as DotParityJson;
}

// ---------------------------------------------------------------------------
// Survey (parity-<type>.json / parity.json — production renderSync path)
// ---------------------------------------------------------------------------

export interface SurveySummary {
  conformant: number;
  structural: number;
  diverged: number;
  generatedAt: string;
}

/** Pure: verdict tally for one type's fixture rows. */
export function tallySurvey(
  rows: readonly FixtureRow[],
): Pick<SurveySummary, 'conformant' | 'structural' | 'diverged'> {
  const count = (v: Verdict): number => rows.filter((r) => r.verdict === v).length;
  return { conformant: count('conformant'), structural: count('structural-match'), diverged: count('diverged') };
}

const PARITY_FILE_RE = /^parity-([a-z0-9]+)\.json$/;

/** One entry per type covered by ANY survey file: `parity-<type>.json` files
 *  plus `parity.json`'s two embedded types (component/usecase, D4). A type
 *  present in both is unreachable in practice (D4: parity.json is exactly the
 *  types with no dedicated `parity-<type>.json`), so no merge conflict arises. */
export function loadSurveyByType(svgConformanceDir: string): Record<string, SurveySummary> {
  const out: Record<string, SurveySummary> = {};
  for (const f of readdirSync(svgConformanceDir)) {
    const m = PARITY_FILE_RE.exec(f);
    if (m === null) continue;
    const surveyPath = join(svgConformanceDir, f);
    const parsed: unknown = JSON.parse(readFileSync(surveyPath, 'utf-8'));
    assertJsonObjectShape(parsed, surveyPath, ['generatedAt', 'fixtures']);
    const report = parsed as ParityReport;
    out[m[1]!] = { ...tallySurvey(report.fixtures), generatedAt: report.generatedAt };
  }
  const legacyPath = join(svgConformanceDir, 'parity.json');
  if (existsSync(legacyPath)) {
    const legacyParsed: unknown = JSON.parse(readFileSync(legacyPath, 'utf-8'));
    assertJsonObjectShape(legacyParsed, legacyPath, ['generatedAt', 'fixtures']);
    const report = legacyParsed as ParityReport;
    for (const type of new Set(report.fixtures.map((r) => r.type))) {
      const rows = report.fixtures.filter((r) => r.type === type);
      out[type] = { ...tallySurvey(rows), generatedAt: report.generatedAt };
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Census (census-<type>.json — none committed yet, D5)
// ---------------------------------------------------------------------------

export interface CensusSummary {
  zeroDiff: number;
  generatedAt: string;
}

/** Pure: count of `bucket === '0'` among `status === 'ok'` fixtures. */
export function zeroDiffCount(fixtures: readonly CensusJsonFixture[]): number {
  return fixtures.filter((f) => f.status === 'ok' && f.bucket === '0').length;
}

const CENSUS_FILE_RE = /^census-([a-z0-9]+)\.json$/;

export function loadCensusByType(svgConformanceDir: string): Record<string, CensusSummary> {
  const out: Record<string, CensusSummary> = {};
  if (!existsSync(svgConformanceDir)) return out;
  for (const f of readdirSync(svgConformanceDir)) {
    const m = CENSUS_FILE_RE.exec(f);
    if (m === null) continue;
    const censusPath = join(svgConformanceDir, f);
    const parsed: unknown = JSON.parse(readFileSync(censusPath, 'utf-8'));
    assertJsonObjectShape(parsed, censusPath, ['generatedAt', 'measuredAgainstCommit', 'type', 'measurer', 'fixtures']);
    const census = parsed as CensusJson;
    out[m[1]!] = { zeroDiff: zeroDiffCount(census.fixtures), generatedAt: census.generatedAt };
  }
  return out;
}
