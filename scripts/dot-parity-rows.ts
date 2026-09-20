/**
 * DOT parity rows — one row per manifest diagram type for `docs/parity-report.md`.
 * Split out of `scripts/dot-sync-report.ts` (mission parity-dashboard-refresh,
 * T4) when that file crossed the 500-line complexity cap; the split boundary
 * is "how a row's numbers and note are computed" vs. "how the CLI drives the
 * render/compare pipeline that produces them" — `buildAgg` stays in
 * `dot-sync-report.ts` and is imported back here.
 *
 * Seven diagram types never emit PlantUML's svek-N.dot dump, so a DOT-parity
 * row for them is structurally undefined rather than merely unmeasured:
 * sequence and activity never call graphviz for their own diagram; json,
 * yaml and hcl (all via `jsondiagram/SmetanaForJson.java`) and gitgraph
 * (`gitlog/SmetanaForGit.java`) route through Smetana with no svek
 * intermediate (DIVERGENCES.md "Smetana-backed diagram types"; CLAUDE.md
 * "One layout engine"); dot passes its fixture's own DOT body straight to
 * graphviz with no svek intermediate either. Reporting "not yet measured"
 * for these read as unfinished work rather than the structural fact that it
 * is — that ambiguity is what this module's `note` vocabulary removes.
 */
import { existsSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { DATA_DIR, CANON_DIR, enumerateFixtures } from './dot-sync-fixtures.js';
import { CACHE, buildAgg } from './dot-sync-report.js';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Expected PlantUML data-diagram-type per corpus bucket we know how to classify. Override with --type-tag. */
export const EXPECTED_TAG: Record<string, string> = {
  component: 'DESCRIPTION',
  usecase: 'DESCRIPTION',
  class: 'CLASS',
  object: 'CLASS', // no separate object engine upstream (ClassDiagramFactory.java)
  state: 'STATE',
};

/** Diagram types with no DOT stage upstream — see module doc comment. No
 *  amount of oracle caching or classification gives one of these a row. */
export const NON_SVEK_TYPES: ReadonlySet<string> = new Set([
  'sequence',
  'activity',
  'json',
  'yaml',
  'hcl',
  'dot',
  'gitgraph',
]);

export interface TypeRow {
  type: string;
  comparable: number;
  equal: number;
  pct: string;
  oracleBlind: number;
  note: string;
}

/** Filesystem roots `dotParityRows` reads. Defaults to the real repo state;
 *  tests inject a temp tree so a row's note never depends on ambient
 *  `test-results/` contents that vary machine-to-machine and worktree-to-worktree.
 *
 *  The default is an inline parameter-default expression on `dotParityRows`, not a
 *  module-level constant: `CACHE` is a live binding of the circular import from
 *  `dot-sync-report.ts` (this module exports `dotParityRows`/`dotParityMarkdown`
 *  back to it), and when `dot-sync-report.ts` is the ESM entry point, its own
 *  `export const CACHE` has not run yet at the point THIS module's top level would
 *  evaluate — reading it there yields `undefined`. A parameter default is
 *  re-evaluated on every call that omits the argument, i.e. after both modules'
 *  top-level code has finished, when `CACHE` is guaranteed to be initialized. */
export interface DotParityRoots {
  dataDir: string;
  cacheDir: string;
  canonDir: string;
}

const NOT_MEASURED = (type: string, note: string): TypeRow => ({
  type,
  comparable: 0,
  equal: 0,
  pct: '—',
  oracleBlind: 0,
  note,
});

/** All diagram types with a fixture manifest, sorted for a stable report. */
function manifestTypes(dataDir: string): string[] {
  return readdirSync(dataDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''))
    .sort();
}

/** One report row for `type`. Unlike ensureCanonical, never invokes the oracle jar's batch
 *  build — reads only what is already cached. Non-svek types (D8: every n/a carries a
 *  reason) short-circuit before any cache or classification check runs. */
function rowForType(jar: string, type: string, roots: DotParityRoots): TypeRow {
  if (NON_SVEK_TYPES.has(type)) return NOT_MEASURED(type, 'n/a (no DOT stage)');
  const cacheDir = join(roots.cacheDir, type);
  if (!existsSync(cacheDir) || readdirSync(cacheDir).length === 0) return NOT_MEASURED(type, 'no oracle captured');
  const fixtures = enumerateFixtures(type, roots.dataDir);
  if (fixtures === undefined) return NOT_MEASURED(type, 'no oracle captured');
  const tag = EXPECTED_TAG[type];
  const canonDir = join(roots.canonDir, type);
  const hasCanon = tag !== undefined && existsSync(canonDir) && readdirSync(canonDir).some((f) => f.endsWith('.svg'));
  if (!hasCanon) return NOT_MEASURED(type, 'no data-diagram-type classification');
  const a = buildAgg(jar, type, fixtures, tag, false);
  const pct = a.total > 0 ? ((100 * a.equal) / a.total).toFixed(0) + '%' : '—';
  return { type, comparable: a.total, equal: a.equal, pct, oracleBlind: a.oracleBlind, note: '—' };
}

/** One row per manifest diagram type (`tests/visual/data/<type>.json`), in the vocabulary
 *  `docs/parity-report.md` renders. `roots` defaults to the real repo paths; tests inject a
 *  temp tree so a row's note never depends on ambient `test-results/` state. */
export function dotParityRows(
  jar: string,
  roots: DotParityRoots = { dataDir: DATA_DIR, cacheDir: CACHE, canonDir: CANON_DIR },
): TypeRow[] {
  return manifestTypes(roots.dataDir).map((t) => rowForType(jar, t, roots));
}

/** Committed shape of `tests/oracle/svg-conformance/dot-parity.json` (mission
 *  parity-dashboard-refresh, orchestrator amendment: the dashboard reads this
 *  file instead of calling `dotParityRows` live — see that amendment for why
 *  a live call breaks D2/D9). */
export interface DotParityJson {
  generatedAt: string;
  measuredAgainstCommit: string;
  rows: TypeRow[];
}

export interface DotParityMeta {
  generatedAt: string;
  measuredAgainstCommit: string;
}

/** Pure: pairs already-computed `rows` with `meta` into the committed JSON
 *  contract. `meta` is injected (testability.md's "inject non-determinism")
 *  so this function never reads the clock or the current commit itself. */
export function dotParityJson(rows: TypeRow[], meta: DotParityMeta): DotParityJson {
  return { generatedAt: meta.generatedAt, measuredAgainstCommit: meta.measuredAgainstCommit, rows };
}

/** Impure shell: computes `dotParityRows(jar)` against the real repo roots,
 *  stamps it with the current time and commit, and writes it to `jsonPath`.
 *  Never invoked by the dashboard itself (D2) — only by
 *  `dot-sync-report.ts --json`, on demand. */
export function writeDotParityJson(jsonPath: string, jar: string): void {
  const rows = dotParityRows(jar);
  const meta: DotParityMeta = {
    generatedAt: new Date().toISOString(),
    measuredAgainstCommit: execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: REPO }).toString().trim(),
  };
  const json = dotParityJson(rows, meta);
  mkdirSync(dirname(jsonPath), { recursive: true });
  writeFileSync(jsonPath, JSON.stringify(json, null, 2) + '\n', 'utf-8');
}

const MARKDOWN_LEGEND = [
  '- **comparable** — fixtures classified to this type (cached canonical SVG `data-diagram-type`) whose PlantUML svek DOT was diffable against ours. Excludes **oracle-blind**.',
  '- **equal** — of the comparable fixtures, how many are structurally EQUAL per every check in `tests/oracle/svek-dot.ts`.',
  '- **oracle-blind** — `!pragma layout elk` fixtures (smetana/vizjs are graphviz under other names and are captured normally, per DIVERGENCES.md); PlantUML only dumps svek DOT on the graphviz path, so there is no oracle DOT to diff for elk. Excluded from **comparable**.',
  '- **n/a (no DOT stage)** — sequence, activity, json, yaml, hcl, dot and gitgraph never emit PlantUML\'s svek DOT upstream (DIVERGENCES.md; CLAUDE.md "One layout engine"), so they cannot have a DOT-parity row regardless of how much oracle data is cached.',
  '- **no oracle captured** — no cached oracle DOT dump under `test-results/dot-cache/<type>/` yet, or the type has no fixture manifest; not a failure, just unmeasured.',
  "- **no data-diagram-type classification** — oracle DOT is cached but no canonical SVG carries this type's expected `data-diagram-type` tag; run with `--type-tag` to classify.",
];

/** Renders `dotParityRows`' output as the full `docs/parity-report.md` body. */
export function dotParityMarkdown(rows: TypeRow[], generatedOn: string): string {
  const table = rows.map(
    (r) => `| ${r.type} | ${r.comparable} | ${r.equal} | ${r.pct} | ${r.oracleBlind} | ${r.note} |`,
  );
  const lines: string[] = [
    '<!-- GENERATED by `npx tsx scripts/dot-sync-report.ts --markdown` — do not edit by hand. -->',
    '',
    '# DOT parity report',
    '',
    'Generated by `npx tsx scripts/dot-sync-report.ts --markdown` on ' + generatedOn + '.',
    '',
    '## Parity by diagram type',
    '',
    '| type | comparable | equal | pct | oracle-blind | note |',
    '| --- | ---: | ---: | ---: | ---: | --- |',
    ...table,
    '',
    '## Legend',
    '',
    ...MARKDOWN_LEGEND,
    '',
  ];
  return lines.join('\n') + '\n';
}
