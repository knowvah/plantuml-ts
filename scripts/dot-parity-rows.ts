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
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { DATA_DIR, CANON_DIR, enumerateFixtures } from './dot-sync-fixtures.js';
import { CACHE, buildAgg } from './dot-sync-report.js';

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

const NOT_MEASURED = (type: string, note: string): TypeRow => ({
  type,
  comparable: 0,
  equal: 0,
  pct: '—',
  oracleBlind: 0,
  note,
});

/** All diagram types with a fixture manifest, sorted for a stable report. */
function manifestTypes(): string[] {
  return readdirSync(DATA_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''))
    .sort();
}

/** One report row for `type`. Unlike ensureCanonical, never invokes the oracle jar's batch
 *  build — reads only what is already cached. Non-svek types (D8: every n/a carries a
 *  reason) short-circuit before any cache or classification check runs. */
function rowForType(jar: string, type: string): TypeRow {
  if (NON_SVEK_TYPES.has(type)) return NOT_MEASURED(type, 'n/a (no DOT stage)');
  const cacheDir = join(CACHE, type);
  if (!existsSync(cacheDir) || readdirSync(cacheDir).length === 0) return NOT_MEASURED(type, 'no oracle captured');
  const fixtures = enumerateFixtures(type);
  if (fixtures === undefined) return NOT_MEASURED(type, 'no oracle captured');
  const tag = EXPECTED_TAG[type];
  const canonDir = join(CANON_DIR, type);
  const hasCanon = tag !== undefined && existsSync(canonDir) && readdirSync(canonDir).some((f) => f.endsWith('.svg'));
  if (!hasCanon) return NOT_MEASURED(type, 'no data-diagram-type classification');
  const a = buildAgg(jar, type, fixtures, tag, false);
  const pct = a.total > 0 ? ((100 * a.equal) / a.total).toFixed(0) + '%' : '—';
  return { type, comparable: a.total, equal: a.equal, pct, oracleBlind: a.oracleBlind, note: '—' };
}

/** One row per manifest diagram type (`tests/visual/data/<type>.json`), in
 *  the vocabulary `docs/parity-report.md` renders. */
export function dotParityRows(jar: string): TypeRow[] {
  return manifestTypes().map((t) => rowForType(jar, t));
}

const MARKDOWN_LEGEND = [
  '- **comparable** — fixtures classified to this type (cached canonical SVG `data-diagram-type`) whose PlantUML svek DOT was diffable against ours. Excludes **oracle-blind**.',
  '- **equal** — of the comparable fixtures, how many are structurally EQUAL per every check in `tests/oracle/svek-dot.ts`.',
  '- **oracle-blind** — `!pragma layout elk` fixtures (smetana/vizjs are graphviz under other names and are captured normally, per DIVERGENCES.md); PlantUML only dumps svek DOT on the graphviz path, so there is no oracle DOT to diff for elk. Excluded from **comparable**.',
  "- **n/a (no DOT stage)** — sequence, activity, json, yaml, hcl, dot and gitgraph never emit PlantUML's svek DOT upstream (DIVERGENCES.md; CLAUDE.md \"One layout engine\"), so they cannot have a DOT-parity row regardless of how much oracle data is cached.",
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
