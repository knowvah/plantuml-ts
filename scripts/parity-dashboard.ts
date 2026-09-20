#!/usr/bin/env node
/**
 * Unified parity dashboard (mission parity-dashboard-refresh, T6) — composes
 * every committed measurement artifact into `docs/parity-report.md`, the
 * page `docs-site/copy-reports.mjs` mirrors as `/parity` (D1). Replaces the
 * DOT-only report that had been stale since 2026-07-18.
 *
 * D2: compose, never render. Every input is a committed JSON/manifest file;
 * this script never invokes `renderSync` or the oracle jar, so regeneration
 * is sub-second (`npm run parity:dashboard`). D9: `tests/unit/scripts/
 * parity-dashboard.test.ts` rebuilds the markdown from disk and asserts
 * byte-equality with the committed report — the staleness this replaces
 * becomes a test failure instead of a silent drift.
 *
 * Pure core (`buildMatrix`, `buildFreshness`, `renderReport`) lives here;
 * IO is confined to `loadInputs` and the two `parity-dashboard-*.ts` loader
 * modules (functional core / imperative shell, testability.md).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { dotParityMarkdown, type TypeRow, type DotParityJson } from './dot-parity-rows.js';
import {
  manifestBuckets,
  corpusCountsOf,
  registeredEngineTypes,
  oracleCountsOf,
  jarUnsupportedCountsOf,
  loadDotParity,
  loadSurveyByType,
  loadCensusByType,
  type SurveySummary,
  type CensusSummary,
} from './parity-dashboard-inputs.js';
import {
  loadRatchetByType,
  loadDiffBaselineByType,
  loadRoutingByType,
  loadRefusalByType,
  type RatchetSummary,
  type DiffBaselineSummary,
  type GroupSummary,
} from './parity-dashboard-goldens.js';
import {
  engineCell,
  oracleColumn,
  isPlantumlTsOnly,
  noEngineColumn,
  PLANTUML_TS_ONLY,
  type ColumnResult,
  dotColumn,
  surveyColumn,
  censusColumn,
  ratchetColumn,
  diffBaselineColumn,
  routingColumn,
  refusalColumn,
} from './parity-dashboard-matrix.js';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = join(REPO, 'tests', 'visual', 'data');
const CACHE_DIR = join(REPO, 'test-results', 'dot-cache');
const SVG_CONFORMANCE_DIR = join(REPO, 'tests', 'oracle', 'svg-conformance');
const GOLDENS_DIR = join(REPO, 'oracle', 'goldens');
/** `routing-baseline.json`/`refusal-baseline.json` live under `oracle/
 *  goldens/svg-conformance/`, NOT `tests/oracle/svg-conformance/` — a
 *  same-named sibling directory that holds the survey/dot-parity/census
 *  artifacts instead. Kept as its own constant so the two never get
 *  confused again at a call site. */
const GOLDENS_CONFORMANCE_DIR = join(GOLDENS_DIR, 'svg-conformance');
const DOT_PARITY_PATH = join(SVG_CONFORMANCE_DIR, 'dot-parity.json');
const INDEX_TS_PATH = join(REPO, 'src', 'index.ts');
const REPORT_OUT = join(REPO, 'docs', 'parity-report.md');

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

export interface RawInputs {
  buckets: string[];
  corpusCounts: Record<string, number>;
  registeredEngines: string[];
  oracleCounts: Record<string, number>;
  /** Per type, cached goldens that are the jar's unsupported-diagram page. */
  jarUnsupportedCounts: Record<string, number>;
  dotParity: DotParityJson;
  surveyByType: Record<string, SurveySummary>;
  censusByType: Record<string, CensusSummary>;
  ratchetByType: Record<string, RatchetSummary>;
  diffBaselineByType: Record<string, DiffBaselineSummary>;
  routingByType: Record<string, GroupSummary>;
  refusalByType: Record<string, GroupSummary>;
}

/** Impure shell: every field reads a committed artifact (D2) — no renderer,
 *  no jar, no `Date.now()`. */
export function loadInputs(): RawInputs {
  const buckets = manifestBuckets(DATA_DIR);
  return {
    buckets,
    corpusCounts: corpusCountsOf(DATA_DIR, buckets),
    registeredEngines: registeredEngineTypes(readFileSync(INDEX_TS_PATH, 'utf-8')),
    oracleCounts: oracleCountsOf(CACHE_DIR),
    jarUnsupportedCounts: jarUnsupportedCountsOf(CACHE_DIR),
    dotParity: loadDotParity(DOT_PARITY_PATH),
    surveyByType: loadSurveyByType(SVG_CONFORMANCE_DIR),
    censusByType: loadCensusByType(SVG_CONFORMANCE_DIR),
    ratchetByType: loadRatchetByType(GOLDENS_DIR),
    diffBaselineByType: loadDiffBaselineByType(GOLDENS_DIR),
    routingByType: loadRoutingByType(GOLDENS_CONFORMANCE_DIR),
    refusalByType: loadRefusalByType(GOLDENS_CONFORMANCE_DIR),
  };
}

// ---------------------------------------------------------------------------
// Matrix + freshness (pure)
// ---------------------------------------------------------------------------

export interface MatrixRow {
  type: string;
  engine: string;
  corpus: number;
  oracle: string;
  dot: string;
  survey: string;
  census: string;
  ratchet: string;
  diffBaseline: string;
  routing: string;
  refusal: string;
}

export interface FreshnessRow {
  type: string;
  dot: string | undefined;
  survey: string | undefined;
  census: string | undefined;
  ratchet: string | undefined;
  diffBaseline: string | undefined;
  routing: string | undefined;
  refusal: string | undefined;
}

interface RowColumns {
  oracle: ReturnType<typeof oracleColumn>;
  dot: ReturnType<typeof dotColumn>;
  survey: ReturnType<typeof surveyColumn>;
  census: ReturnType<typeof censusColumn>;
  ratchet: ReturnType<typeof ratchetColumn>;
  diffBaseline: ReturnType<typeof diffBaselineColumn>;
  routing: ReturnType<typeof routingColumn>;
  refusal: ReturnType<typeof refusalColumn>;
}

/** Every comparison cell of a `plantuml-ts only` type: the jar declined the
 *  source, so there is nothing to compare and no source date to report. */
function plantumlTsOnlyColumns(): RowColumns {
  const c = PLANTUML_TS_ONLY;
  return { oracle: c, dot: c, survey: c, census: c, ratchet: c, diffBaseline: c, routing: c, refusal: c };
}

/** A no-engine bucket keeps its real oracle count; every comparison cell
 *  repeats the engine reason (`parity-dashboard-matrix.ts#noEngineColumn`). */
function noEngineColumns(c: ColumnResult, oracle: ColumnResult): RowColumns {
  return { oracle, dot: c, survey: c, census: c, ratchet: c, diffBaseline: c, routing: c, refusal: c };
}

function columnsFor(type: string, inputs: RawInputs, dotByType: ReadonlyMap<string, TypeRow>): RowColumns {
  if (isPlantumlTsOnly(type, inputs.oracleCounts, inputs.jarUnsupportedCounts)) return plantumlTsOnlyColumns();
  const noEngine = noEngineColumn(engineCell(type, inputs.registeredEngines));
  if (noEngine !== undefined) return noEngineColumns(noEngine, oracleColumn(type, inputs.oracleCounts));
  return {
    oracle: oracleColumn(type, inputs.oracleCounts),
    dot: dotColumn(dotByType.get(type), inputs.dotParity.generatedAt),
    survey: surveyColumn(inputs.surveyByType[type]),
    census: censusColumn(inputs.censusByType[type]),
    ratchet: ratchetColumn(inputs.ratchetByType[type]),
    diffBaseline: diffBaselineColumn(inputs.diffBaselineByType[type]),
    routing: routingColumn(inputs.routingByType[type]),
    refusal: refusalColumn(inputs.refusalByType[type]),
  };
}

function matrixRowOf(type: string, inputs: RawInputs, c: RowColumns): MatrixRow {
  return {
    type,
    engine: engineCell(type, inputs.registeredEngines),
    corpus: inputs.corpusCounts[type] ?? 0,
    oracle: c.oracle.cell,
    dot: c.dot.cell,
    survey: c.survey.cell,
    census: c.census.cell,
    ratchet: c.ratchet.cell,
    diffBaseline: c.diffBaseline.cell,
    routing: c.routing.cell,
    refusal: c.refusal.cell,
  };
}

function freshnessRowOf(type: string, c: RowColumns): FreshnessRow {
  return {
    type,
    dot: c.dot.freshness,
    survey: c.survey.freshness,
    census: c.census.freshness,
    ratchet: c.ratchet.freshness,
    diffBaseline: c.diffBaseline.freshness,
    routing: c.routing.freshness,
    refusal: c.refusal.freshness,
  };
}

/** Shared computation for `buildMatrix`/`buildFreshness` — one pass over the
 *  28 buckets, both views read off the same per-column result so a cell's
 *  text and its freshness date can never disagree. */
function buildRows(inputs: RawInputs): { matrix: MatrixRow[]; freshness: FreshnessRow[] } {
  const dotByType = new Map(inputs.dotParity.rows.map((r) => [r.type, r] as const));
  const matrix: MatrixRow[] = [];
  const freshness: FreshnessRow[] = [];
  for (const type of inputs.buckets) {
    const c = columnsFor(type, inputs, dotByType);
    matrix.push(matrixRowOf(type, inputs, c));
    freshness.push(freshnessRowOf(type, c));
  }
  return { matrix, freshness };
}

export function buildMatrix(inputs: RawInputs): MatrixRow[] {
  return buildRows(inputs).matrix;
}

export function buildFreshness(inputs: RawInputs): FreshnessRow[] {
  return buildRows(inputs).freshness;
}

// ---------------------------------------------------------------------------
// Rendering (pure)
// ---------------------------------------------------------------------------

export interface ReportModel {
  matrix: MatrixRow[];
  freshness: FreshnessRow[];
  dotParitySection: string;
}

/** Glues `buildMatrix`/`buildFreshness` to the verbatim DOT-parity section
 *  (item 5 of the T6 amendment: `dotParityMarkdown(json.rows, <date from
 *  json.generatedAt>)`). Exported so the D9 drift test can compose the full
 *  pipeline as `renderReport(buildReportModel(loadInputs()))` without
 *  reaching into `RawInputs.dotParity` itself. */
export function buildReportModel(inputs: RawInputs): ReportModel {
  return {
    matrix: buildMatrix(inputs),
    freshness: buildFreshness(inputs),
    dotParitySection: dotParityMarkdown(inputs.dotParity.rows, inputs.dotParity.generatedAt.slice(0, 10)),
  };
}

const PREAMBLE = [
  '# Parity dashboard',
  '',
  'One row per manifest bucket in `tests/visual/data/*.json` (28, alphabetical — D7, ' +
    'plans/parity-dashboard-refresh/decisions.md). **engine** names the plugin that owns the ' +
    "bucket, or the still-unbuilt Phase D mission that will; **corpus** is the bucket's fixture " +
    'count; **oracle** is how many of those fixtures have a cached PlantUML jar SVG under ' +
    '`test-results/dot-cache/<type>/`; **DOT equal** reads `tests/oracle/svg-conformance/dot-' +
    'parity.json`; **ratchet pins**, **diff-baseline**, **routing** and **refusal** read the ' +
    'committed goldens under `oracle/goldens/`. Every empty cell names why it is empty, per the ' +
    'vocabulary in decisions.md D8 — a bare `n/a` never appears. `n/a (plantuml-ts only)` marks ' +
    'a type whose every cached jar SVG is PlantUML\'s own "Diagram not supported by this ' +
    'release" page: the port draws it, the pinned jar declines it, so nothing can be compared ' +
    'until a jar that supports the type is pinned. A bucket with no engine keeps its real ' +
    '**oracle** count but repeats its `no engine (Dn todo)` reason in every comparison cell: ' +
    "this port answers such a source with the dispatcher's error sentinel, so a routing or " +
    'refusal count there would measure nothing.',
  '',
  '**survey** and **census** differ by RENDER PATH, not measurer. Both already measure text ' +
    'through the same system — `WidthTableMeasurer`, re-exported as `DeterministicMeasurer` ' +
    '(`src/core/measurer-deterministic.ts`) — over the SAME cached corpus. Survey renders ' +
    'through production `renderSync`; the ratchet and census render through the low-level ' +
    '`renderFixture*` helpers instead. A `diverged` survey verdict beside a passing byte-exact ' +
    'ratchet is that path difference, never a text-metric mismatch.',
  '',
].join('\n');

const MATRIX_HEADER =
  '| type | engine | corpus | oracle | DOT equal | survey conformant / structural / diverged | ' +
  'census 0-diff | ratchet pins | diff-baseline (n · ΣweightedScore) | routing agree | refusal ok |';
const MATRIX_SEP = '| --- | --- | ---: | --- | --- | --- | --- | --- | --- | --- | --- |';

function matrixRowLine(r: MatrixRow): string {
  return (
    `| ${r.type} | ${r.engine} | ${r.corpus} | ${r.oracle} | ${r.dot} | ${r.survey} | ` +
    `${r.census} | ${r.ratchet} | ${r.diffBaseline} | ${r.routing} | ${r.refusal} |`
  );
}

function matrixSection(matrix: readonly MatrixRow[]): string {
  return ['## Matrix', '', MATRIX_HEADER, MATRIX_SEP, ...matrix.map(matrixRowLine), ''].join('\n');
}

const FRESH_HEADER = '| type | DOT | survey | census | ratchet | diff-baseline | routing | refusal |';
const FRESH_SEP = '| --- | --- | --- | --- | --- | --- | --- | --- |';
const dash = (s: string | undefined): string => s ?? '—';

function freshnessRowLine(r: FreshnessRow): string {
  return (
    `| ${r.type} | ${dash(r.dot)} | ${dash(r.survey)} | ${dash(r.census)} | ${dash(r.ratchet)} | ` +
    `${dash(r.diffBaseline)} | ${dash(r.routing)} | ${dash(r.refusal)} |`
  );
}

function freshnessSection(freshness: readonly FreshnessRow[]): string {
  return ['## Freshness', '', FRESH_HEADER, FRESH_SEP, ...freshness.map(freshnessRowLine), ''].join('\n');
}

/** Upstream `DiagramType` members with neither a manifest bucket nor an
 *  engine (D7) — named once here instead of leaving them unaccounted for. */
const D7_FOOTNOTE_MEMBERS = [
  'HELP',
  'BPM',
  'JCCKIT',
  'COMPOSITE',
  'CREOLE',
  'MATH',
  'LATEX',
  'DEFINITION',
  'FLOW',
  'SPRITES',
  'CRASH',
];

function footnoteSection(): string {
  return [
    '## Footnote: upstream types with neither a bucket nor an engine',
    '',
    'Upstream `DiagramType` members with no manifest bucket and no engine (D7): ' +
      D7_FOOTNOTE_MEMBERS.join(', ') +
      '.',
    '',
  ].join('\n');
}

/** The newest date any input carries — every date sourced from a committed
 *  artifact (never `Date.now()`), so this is the freshest MEASUREMENT, not
 *  the render time. `undefined` only if every column were `n/a`, which
 *  cannot happen while DOT parity covers all 28 buckets. */
function latestDate(freshness: readonly FreshnessRow[]): string | undefined {
  const dates = freshness
    .flatMap((r) => [r.dot, r.survey, r.census, r.ratchet, r.diffBaseline, r.routing, r.refusal])
    .filter((d): d is string => d !== undefined);
  return dates.length > 0 ? dates.sort().at(-1) : undefined;
}

export function renderReport(model: ReportModel): string {
  const parts = [
    '<!-- GENERATED by scripts/parity-dashboard.ts — do not edit by hand -->',
    '',
    `Freshest measurement across every source below: ${latestDate(model.freshness) ?? 'unknown'}.`,
    '',
    PREAMBLE,
    matrixSection(model.matrix),
    freshnessSection(model.freshness),
    model.dotParitySection.replace(/\n+$/, ''),
    '',
    footnoteSection(),
  ];
  return `${parts.join('\n')}\n`;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function main(): void {
  const report = renderReport(buildReportModel(loadInputs()));
  writeFileSync(REPORT_OUT, report, 'utf-8');
  console.log('Wrote ' + REPORT_OUT);
}

/* v8 ignore start -- CLI entry point; exercised by the real dashboard run and
 * by the D9 drift test's own call to loadInputs()/renderReport(). */
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main();
}
/* v8 ignore stop */
