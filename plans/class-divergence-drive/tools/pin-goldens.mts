/**
 * `npx jiti plans/class-divergence-drive/tools/pin-goldens.mts <source-tag> <close-label> <slug...>`
 *
 * Pins survey-conformant AND census-0-diff class fixtures into the svg-class
 * ratchet (promoted from cdd2's scratch `pin.mjs`, cdd3 D7). Per slug:
 *
 * 1. copies `test-results/dot-cache/class/<slug>/{in.svg,in.puml}` to
 *    `oracle/goldens/svg-class/<slug>/{golden.svg,in.puml}` and re-reads
 *    both to prove byte equality;
 * 2. APPENDS `{ slug, addedAt, source }` to `ratchet.json` — never
 *    re-sorted (the ratchet tamper test mutates `fixtures[0]`);
 * 3. clones the slug's `dot-cache`/`class` twin row in
 *    `routing-baseline.json` and `refusal-baseline.json` as
 *    `tree: goldens, type: svg-class` with fresh `measuredAt` /
 *    `measuredAgainstCommit`, and extends each file's `$comment`.
 *
 * Everything is validated before anything is written: an already-pinned
 * slug, a missing cache file, or a twin row that is absent or not
 * `agree`/`ok` aborts the whole run with no file touched.
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const MISSION = 'class-divergence-drive-3';
const CACHE_DIR = 'test-results/dot-cache/class';
const GOLDEN_DIR = 'oracle/goldens/svg-class';
const RATCHET = `${GOLDEN_DIR}/ratchet.json`;
const BASELINES = [
  { file: 'oracle/goldens/svg-conformance/routing-baseline.json', okStatus: 'agree' },
  { file: 'oracle/goldens/svg-conformance/refusal-baseline.json', okStatus: 'ok' },
] as const;

type Row = Record<string, unknown> & { tree: string; type: string; slug: string; status: string };
interface Baseline { $comment: string; fixtures: Row[] }
interface Ratchet { fixtures: { slug: string; addedAt: string; source: string }[] }

export interface PinOptions {
  root: string;
  sourceTag: string;
  closeLabel: string;
  slugs: string[];
  date: string;
  commit: string;
}

const readJson = <T,>(root: string, rel: string): T =>
  JSON.parse(readFileSync(join(root, rel), 'utf8')) as T;
const writeJson = (root: string, rel: string, data: unknown): void =>
  writeFileSync(join(root, rel), `${JSON.stringify(data, null, 2)}\n`);

/** Finds the one dot-cache twin row for `slug`; throws unless it is healthy
 *  and no goldens row exists yet. */
export function findTwin(b: Baseline, slug: string, okStatus: string, file: string): Row {
  if (b.fixtures.some((r) => r.tree === 'goldens' && r.slug === slug)) {
    throw new Error(`${file}: ${slug} already has a goldens row`);
  }
  const twins = b.fixtures.filter((r) => r.tree === 'dot-cache' && r.type === 'class' && r.slug === slug);
  if (twins.length !== 1) throw new Error(`${file}: ${slug} has ${twins.length} dot-cache twins`);
  const twin = twins[0]!;
  if (twin.status !== okStatus) throw new Error(`${file}: ${slug} twin status ${twin.status}`);
  return twin;
}

function validate(o: PinOptions, ratchet: Ratchet): void {
  if (o.slugs.length === 0) throw new Error('no slugs given');
  if (new Set(o.slugs).size !== o.slugs.length) throw new Error('duplicate slug in arguments');
  const pinned = new Set(ratchet.fixtures.map((f) => f.slug));
  for (const slug of o.slugs) {
    if (pinned.has(slug)) throw new Error(`${slug} is already in the ratchet`);
    for (const f of ['in.svg', 'in.puml']) {
      if (!existsSync(join(o.root, CACHE_DIR, slug, f))) throw new Error(`${slug}: missing ${f}`);
    }
  }
}

function copyVerified(root: string, slug: string): void {
  const dst = join(root, GOLDEN_DIR, slug);
  mkdirSync(dst, { recursive: true });
  for (const [from, to] of [['in.svg', 'golden.svg'], ['in.puml', 'in.puml']] as const) {
    const src = join(root, CACHE_DIR, slug, from);
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
  const clones = baselines.map(({ spec, data }) =>
    o.slugs.map((slug) => ({
      ...findTwin(data, slug, spec.okStatus, spec.file),
      tree: 'goldens',
      type: 'svg-class',
      measuredAt: o.date,
      measuredAgainstCommit: o.commit,
    })),
  );
  for (const slug of o.slugs) copyVerified(o.root, slug);
  for (const slug of o.slugs) ratchet.fixtures.push({ slug, addedAt: o.date, source: o.sourceTag });
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
  const [sourceTag, closeLabel, ...slugs] = process.argv.slice(2);
  if (!sourceTag || !closeLabel) {
    console.error('usage: pin-goldens.mts <source-tag> <close-label> <slug...>');
    process.exit(2);
  }
  const commit = execFileSync('git', ['rev-parse', '--short=8', 'HEAD'], { encoding: 'utf8' }).trim();
  const d = new Date();
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const n = pinGoldens({ root: process.cwd(), sourceTag, closeLabel, slugs, date, commit });
  console.log(`pinned ${n} fixture(s) as ${sourceTag} at ${commit}`);
}
/* v8 ignore stop */
