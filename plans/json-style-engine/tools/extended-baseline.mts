/** jse T0b (D6): extended-mode byte baseline for json/yaml/hcl.
 *  Every json-family gate except `extensions.ratchet.test.ts` measures
 *  jar-compatible mode; this mission rewrites style resolution in BOTH modes,
 *  so an extended-mode mover elsewhere would be invisible. This tool hashes the
 *  EXTENDED render (no `withJarCompatibleStyleInput`) of every row.
 *
 *  Mechanism: `renderSync(markup, { measurer: DeterministicMeasurer, assetStore,
 *  includeStore, filename: 'in.puml', clock? })` -- the survey's option set
 *  (`scripts/svg-parity-survey.ts:302-313`) minus `jarCompatibleStyleInput` and
 *  `elk`; the asset store is the survey's SURVEY_ASSET_STORE (`:77-86`: sprites +
 *  emoji + utility + remote-image fixtures), without which emoji/sprite rows hash
 *  differently from what users see. Row hash = sha256 of the SVG bytes (a render
 *  that throws hashes `ERROR:<message>`).
 *
 *  Usage (from the repo root):
 *    npx tsx plans/json-style-engine/tools/extended-baseline.mts --write <map.json>
 *    npx tsx plans/json-style-engine/tools/extended-baseline.mts --check <map.json>
 *  `--check` prints MOVED/ADDED/GONE <id> and a count line; exit 1 on MOVED or GONE.
 *  Rows: dot-cache/<type>/<slug>/in.puml -> `<type>/<slug>`; fixtures/<type>/<slug>.puml
 *  with a .svg -> `fixtures/<type>/<slug>`; fixtures/extensions/{type}-*.puml
 *  (incl. .plain.puml) -> `extensions/<name>`. */
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { combineAssetStores } from '../../../src/core/asset-store.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderSync } from '../../../src/index.js';
import { buildEmojiAssetsStore } from '../../../tests/helpers/emoji-assets-store.js';
import { fixtureIncludeStore } from '../../../tests/helpers/fixture-include-store.js';
import { buildSpriteAssetsStore } from '../../../tests/helpers/sprite-assets-store.js';
import { buildUtilityAssetsStore } from '../../../scripts/utility-assets-store.js';
import { clockForPath } from '../../../tests/oracle/svg-conformance/capture-clock.js';
import { remoteImageFixtureStore } from '../../../tests/oracle/svg-conformance/remote-image-fixtures.js';

export interface Row {
  readonly id: string;
  readonly markup: string;
  /** Path of the row's `in.puml`-equivalent, for the capture clock (corpus rows only). */
  readonly clockPath?: string;
}
export type HashMap = Readonly<Record<string, string>>;
export interface Comparison {
  readonly moved: readonly string[];
  readonly added: readonly string[];
  readonly gone: readonly string[];
}

const TYPES = ['json', 'yaml', 'hcl'] as const;
const PUML = '.puml';
const SVG = '.svg';
const SURVEY_FILENAME = 'in.puml';
const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const sha256 = (text: string): string => createHash('sha256').update(text).digest('hex');
const byId = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

/** Pure core: hash every row with `render`; the result is sorted by id. */
export function hashRows(rows: readonly Row[], render: (row: Row) => string): HashMap {
  const out: Record<string, string> = {};
  for (const row of [...rows].sort((a, b) => byId(a.id, b.id))) {
    let svg: string;
    try {
      svg = render(row);
    } catch (err) {
      svg = `ERROR:${err instanceof Error ? err.message : String(err)}`;
    }
    out[row.id] = sha256(svg);
  }
  return out;
}

/** Pure core: classify the difference between a saved map and a fresh one. */
export function compareMaps(saved: HashMap, fresh: HashMap): Comparison {
  const ids = (pred: (id: string) => boolean): string[] => Object.keys(saved).concat(Object.keys(fresh)).filter((id, i, all) => all.indexOf(id) === i && pred(id)).sort(byId);
  return {
    moved: ids((id) => id in saved && id in fresh && saved[id] !== fresh[id]),
    added: ids((id) => !(id in saved) && id in fresh),
    gone: ids((id) => id in saved && !(id in fresh)),
  };
}

/** Report lines (`MOVED <id>`...) plus the count line, and the exit code. */
export function report(c: Comparison, total: number): { lines: string[]; exitCode: number } {
  const lines = [...c.moved.map((i) => `MOVED ${i}`), ...c.added.map((i) => `ADDED ${i}`), ...c.gone.map((i) => `GONE ${i}`)];
  lines.push(`${total} rows: ${c.moved.length} MOVED, ${c.added.length} ADDED, ${c.gone.length} GONE`);
  return { lines, exitCode: c.moved.length > 0 || c.gone.length > 0 ? 1 : 0 };
}

const list = (dir: string): string[] => (existsSync(dir) ? readdirSync(dir).sort() : []);

/** Collect the three row families under `repo`. */
export function collectRows(repo: string): Row[] {
  const rows: Row[] = [];
  for (const type of TYPES) {
    const cache = join(repo, 'test-results', 'dot-cache', type);
    for (const slug of list(cache)) {
      const p = join(cache, slug, 'in.puml');
      if (existsSync(p)) rows.push({ id: `${type}/${slug}`, markup: readFileSync(p, 'utf8'), clockPath: p });
    }
    const dir = join(repo, 'tests', 'fixtures', type);
    for (const f of list(dir)) {
      if (!f.endsWith(PUML) || !existsSync(join(dir, f.slice(0, -PUML.length) + SVG))) continue;
      rows.push({ id: `fixtures/${type}/${f.slice(0, -PUML.length)}`, markup: readFileSync(join(dir, f), 'utf8') });
    }
  }
  const ext = join(repo, 'tests', 'fixtures', 'extensions');
  for (const f of list(ext)) {
    if (!f.endsWith(PUML) || !TYPES.some((t) => f.startsWith(`${t}-`))) continue;
    rows.push({ id: `extensions/${f.slice(0, -PUML.length)}`, markup: readFileSync(join(ext, f), 'utf8') });
  }
  return rows;
}

function extendedRender(): (row: Row) => string {
  const assetStore = combineAssetStores(buildSpriteAssetsStore(), buildEmojiAssetsStore(), buildUtilityAssetsStore(), remoteImageFixtureStore());
  const includeStore = fixtureIncludeStore();
  const measurer = new DeterministicMeasurer();
  return (row) => {
    const clock = row.clockPath === undefined ? undefined : clockForPath(row.clockPath);
    return renderSync(row.markup, { ...(clock === undefined ? {} : { clock }), measurer, assetStore, includeStore, filename: SURVEY_FILENAME });
  };
}

function main(argv: readonly string[]): number {
  const [mode, mapPath] = argv;
  if ((mode !== '--write' && mode !== '--check') || mapPath === undefined) {
    process.stderr.write('usage: extended-baseline.mts --write|--check <map.json>\n');
    return 2;
  }
  const rows = collectRows(REPO);
  const fresh = hashRows(rows, extendedRender());
  const counts = new Map<string, number>();
  for (const id of Object.keys(fresh)) {
    const k = id.split('/').slice(0, id.startsWith('fixtures/') ? 2 : 1).join('/');
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  process.stdout.write(`rows by family: ${[...counts].sort(([a], [b]) => byId(a, b)).map(([k, n]) => `${k}=${n}`).join(' ')}\n`);
  if (mode === '--write') {
    writeFileSync(mapPath, `${JSON.stringify(fresh, null, 2)}\n`);
    process.stdout.write(`wrote ${Object.keys(fresh).length} rows to ${mapPath}\n`);
    return 0;
  }
  const saved = JSON.parse(readFileSync(mapPath, 'utf8')) as HashMap;
  const { lines, exitCode } = report(compareMaps(saved, fresh), Object.keys(fresh).length);
  process.stdout.write(`${lines.join('\n')}\n`);
  return exitCode;
}

if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1]) process.exitCode = main(process.argv.slice(2));
