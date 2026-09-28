/**
 * `npx jiti plans/class-divergence-drive/tools/pin-goldens.mts [--tree <class|unknown>] <source-tag> <close-label> <slug...>`
 *
 * Pins survey-conformant AND census-0-diff class fixtures into the svg-class
 * ratchet (promoted from cdd2's scratch `pin.mjs`, cdd3 D7). `--tree`
 * defaults to `class`, preserving every pre-cdd5-T2 invocation unchanged.
 * Per slug:
 *
 * 1. copies `test-results/dot-cache/<tree>/<slug>/{in.svg,in.puml}` to
 *    `oracle/goldens/svg-class/<slug>/{golden.svg,in.puml}` (`class`) or
 *    `oracle/goldens/svg-class/unknown/<slug>/{golden.svg,in.puml}`
 *    (`unknown`) and re-reads both to prove byte equality;
 * 2. APPENDS `{ slug, addedAt, source }` to `ratchet.json` — never
 *    re-sorted (the ratchet tamper test mutates `fixtures[0]`); a `--tree
 *    unknown` entry additionally carries `tree: 'unknown'` (D4) so
 *    `class.golden.ratchet.test.ts` resolves its golden one directory
 *    level deeper;
 * 3. clones the slug's `dot-cache`/`<tree>` twin row in
 *    `routing-baseline.json` and `refusal-baseline.json` as
 *    `tree: goldens, type: svg-class` with fresh `measuredAt` /
 *    `measuredAgainstCommit`, and extends each file's `$comment`.
 *
 * `--tree unknown` exists to reach CLASS-routed corpus fixtures our router
 * currently misfiles as `unknown` (`oracle/goldens/svg-conformance/
 * routing-baseline.json`'s `type: 'unknown'` rows carrying `ourType:
 * 'CLASS'`); a slug whose routing row is NOT `ourType: 'CLASS'` is refused
 * before anything is written (`assertRoutedAsClass`) — pinning it as a class
 * golden would be pinning a fixture this port doesn't even route as CLASS.
 *
 * Everything is validated before anything is written: an already-pinned
 * slug, a missing cache file, a twin row that is absent or not `agree`/`ok`,
 * or (for `--tree unknown`) a non-CLASS-routed slug aborts the whole run
 * with no file touched.
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

// cdd5-T2: bumped from 'class-divergence-drive-3' -- this tool's own MISSION
// tag is updated by whichever mission first pins through it (cdd3-T0's
// commit is the only prior touch; cdd4 never called this tool, so the
// constant was still cdd3's when T5 of THIS mission was about to reuse it).
const MISSION = 'class-divergence-drive-5';
const GOLDEN_DIR = 'oracle/goldens/svg-class';
const RATCHET = `${GOLDEN_DIR}/ratchet.json`;
const BASELINES = [
  { file: 'oracle/goldens/svg-conformance/routing-baseline.json', okStatus: 'agree', kind: 'routing' },
  { file: 'oracle/goldens/svg-conformance/refusal-baseline.json', okStatus: 'ok', kind: 'refusal' },
] as const;

export type Tree = 'class' | 'unknown';

type Row = Record<string, unknown> & { tree: string; type: string; slug: string; status: string };
interface Baseline { $comment: string; fixtures: Row[] }
interface RatchetRow { slug: string; addedAt: string; source: string; tree?: 'unknown' }
interface Ratchet { fixtures: RatchetRow[] }

export interface PinOptions {
  root: string;
  tree: Tree;
  sourceTag: string;
  closeLabel: string;
  slugs: string[];
  date: string;
  commit: string;
}

/** `test-results/dot-cache/<tree>/<slug>/`. */
function cacheDir(tree: Tree): string {
  return `test-results/dot-cache/${tree}`;
}

/** `oracle/goldens/svg-class/` (`class`) or `oracle/goldens/svg-class/unknown/`
 *  (`unknown`, D4). */
function goldenDir(tree: Tree): string {
  return tree === 'unknown' ? `${GOLDEN_DIR}/unknown` : GOLDEN_DIR;
}

const readJson = <T,>(root: string, rel: string): T =>
  JSON.parse(readFileSync(join(root, rel), 'utf8')) as T;
const writeJson = (root: string, rel: string, data: unknown): void =>
  writeFileSync(join(root, rel), `${JSON.stringify(data, null, 2)}\n`);

/** Finds the one `dot-cache`/`treeArg` twin row for `slug`; throws unless it
 *  is healthy and no goldens row exists yet. `treeArg` is the `--tree` value
 *  (`class` or `unknown`), matching the baseline rows' own `type` field —
 *  see `routing-baseline.json`'s `type: 'unknown'` rows (D4). */
export function findTwin(b: Baseline, slug: string, treeArg: Tree, okStatus: string, file: string): Row {
  if (b.fixtures.some((r) => r.tree === 'goldens' && r.slug === slug)) {
    throw new Error(`${file}: ${slug} already has a goldens row`);
  }
  const twins = b.fixtures.filter((r) => r.tree === 'dot-cache' && r.type === treeArg && r.slug === slug);
  if (twins.length !== 1) throw new Error(`${file}: ${slug} has ${twins.length} dot-cache twins`);
  const twin = twins[0]!;
  if (twin.status !== okStatus) throw new Error(`${file}: ${slug} twin status ${twin.status}`);
  return twin;
}

/** `--tree unknown` guard (D4): refuses a slug whose routing-baseline row is
 *  not `ourType: 'CLASS'` — the whole point of `unknown` is to reach
 *  CLASS-routed fixtures our router currently misfiles as `unknown`, so a
 *  slug the router (correctly or not) never called CLASS has no business in
 *  this ratchet. */
export function assertRoutedAsClass(routing: Baseline, slug: string): void {
  const twin = routing.fixtures.find((r) => r.tree === 'dot-cache' && r.type === 'unknown' && r.slug === slug);
  const ourType = twin?.ourType;
  if (ourType !== 'CLASS') {
    throw new Error(`${slug}: not routed as CLASS (ourType=${ourType === undefined ? 'missing' : String(ourType)})`);
  }
}

function validate(o: PinOptions, ratchet: Ratchet): void {
  if (o.slugs.length === 0) throw new Error('no slugs given');
  if (new Set(o.slugs).size !== o.slugs.length) throw new Error('duplicate slug in arguments');
  const pinned = new Set(ratchet.fixtures.map((f) => f.slug));
  for (const slug of o.slugs) {
    if (pinned.has(slug)) throw new Error(`${slug} is already in the ratchet`);
    for (const f of ['in.svg', 'in.puml']) {
      if (!existsSync(join(o.root, cacheDir(o.tree), slug, f))) throw new Error(`${slug}: missing ${f}`);
    }
  }
}

function copyVerified(root: string, tree: Tree, slug: string): void {
  const dst = join(root, goldenDir(tree), slug);
  mkdirSync(dst, { recursive: true });
  for (const [from, to] of [['in.svg', 'golden.svg'], ['in.puml', 'in.puml']] as const) {
    const src = join(root, cacheDir(tree), slug, from);
    copyFileSync(src, join(dst, to));
    if (!readFileSync(src).equals(readFileSync(join(dst, to)))) {
      throw new Error(`${slug}: ${to} is not byte-identical to ${from}`);
    }
  }
}

/** Pins `o.slugs`; returns the number pinned. */
export function pinGoldens(o: PinOptions): number {
  const ratchet = readJson<Ratchet>(o.root, RATCHET);
  validate(o, ratchet);
  const baselines = BASELINES.map((spec) => ({ spec, data: readJson<Baseline>(o.root, spec.file) }));
  if (o.tree === 'unknown') {
    const routing = baselines.find(({ spec }) => spec.kind === 'routing')!.data;
    for (const slug of o.slugs) assertRoutedAsClass(routing, slug);
  }
  const clones = baselines.map(({ spec, data }) =>
    o.slugs.map((slug) => ({
      ...findTwin(data, slug, o.tree, spec.okStatus, spec.file),
      tree: 'goldens',
      type: 'svg-class',
      measuredAt: o.date,
      measuredAgainstCommit: o.commit,
    })),
  );
  for (const slug of o.slugs) copyVerified(o.root, o.tree, slug);
  for (const slug of o.slugs) {
    const row: RatchetRow = { slug, addedAt: o.date, source: o.sourceTag };
    if (o.tree === 'unknown') row.tree = 'unknown';
    ratchet.fixtures.push(row);
  }
  writeJson(o.root, RATCHET, ratchet);
  const note = ` Re-pinned ${o.date} at ${o.commit} by ${MISSION} / ${o.closeLabel}, ADDITIVE ONLY (${o.slugs.length} "svg-class" golden rows appended, clones of their byte-identical dot-cache twins).`;
  baselines.forEach(({ spec, data }, i) => {
    data.fixtures.push(...clones[i]!);
    data.$comment += note;
    writeJson(o.root, spec.file, data);
  });
  return o.slugs.length;
}

/* v8 ignore start -- CLI entry point; exercised via the acceptance run. */
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const argv = process.argv.slice(2);
  let tree: Tree = 'class';
  if (argv[0] === '--tree') {
    const t = argv[1];
    if (t !== 'class' && t !== 'unknown') {
      console.error('--tree must be "class" or "unknown"');
      process.exit(2);
    }
    tree = t;
    argv.splice(0, 2);
  }
  const [sourceTag, closeLabel, ...slugs] = argv;
  if (!sourceTag || !closeLabel) {
    console.error('usage: pin-goldens.mts [--tree <class|unknown>] <source-tag> <close-label> <slug...>');
    process.exit(2);
  }
  const commit = execFileSync('git', ['rev-parse', '--short=8', 'HEAD'], { encoding: 'utf8' }).trim();
  const d = new Date();
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const n = pinGoldens({ root: process.cwd(), tree, sourceTag, closeLabel, slugs, date, commit });
  console.log(`pinned ${n} fixture(s) as ${sourceTag} at ${commit} (tree=${tree})`);
}
/* v8 ignore stop */
