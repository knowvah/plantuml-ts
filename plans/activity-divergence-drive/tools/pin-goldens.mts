/**
 * `npx jiti plans/activity-divergence-drive/tools/pin-goldens.mts
 *   <source-tag> <close-label> <slug...>`
 *
 * Freezes zero-diff activity fixtures into the svg-activity golden ratchet
 * (T0b, D5 of `plans/activity-divergence-drive/decisions.md`). Adapted from
 * `plans/class-divergence-drive/tools/pin-goldens.mts`, but SINGLE TREE (no
 * `--tree` option — activity has no router-misclassification case this
 * mission needs to reach, unlike class's `unknown` tree). The routing/refusal
 * clone step IS needed (add1-b1, journal row 17): `routing-conformance` and
 * `refusal-coverage` walk every `oracle/goldens/svg-*` dir, so a golden dir
 * without its `goldens`/`svg-activity` clone rows turns both gates red.
 *
 * Per slug:
 *
 * 1. renders `test-results/dot-cache/activity/<slug>/in.puml` through the
 *    EXACT seam the golden ratchet gate uses
 *    (`activity.golden.ratchet.test.ts`'s own `renderFixtureActivity` +
 *    `DeterministicMeasurer` + `fixtureIncludeStore()`) and compares it
 *    against the cached `in.svg` with the SAME comparator
 *    (`compareSvg(ours, golden, 'deterministic')`) — a slug whose render is
 *    not zero-diff is refused before anything is written;
 * 2. copies `in.svg`/`in.puml` to `oracle/goldens/svg-activity/<slug>/
 *    {golden.svg,in.puml}` and re-reads both to prove byte equality;
 * 3. APPENDS `{ slug, addedAt, source }` to `ratchet.json` — never
 *    re-sorted (the golden ratchet's own tamper test mutates `fixtures[0]`,
 *    mirroring mindmap/class precedent);
 * 4. flips the slug's `oracle/goldens/svg-activity/diff-baseline.json` row
 *    to `status: "pinned"`, leaving its `weightedScore`/`diffCount` exactly
 *    as last measured — `scripts/repin-activity-baselines.ts` owns
 *    re-deriving those numbers (it only re-measures `status: "baseline"`
 *    rows), never this tool;
 * 5. clones the slug's `dot-cache`/`activity` twin row in
 *    `routing-baseline.json` (`agree`) and `refusal-baseline.json` (`ok`)
 *    as `tree: goldens, type: svg-activity`, fresh `measuredAt` /
 *    `measuredAgainstCommit`, and extends each file's `$comment` (the
 *    class tool's step 3, `plans/class-divergence-drive/tools/
 *    pin-goldens.mts:149-180`).
 *
 * Everything is validated before anything is written: an already-pinned
 * slug, a missing cache file, a missing or non-`"baseline"` diff-baseline
 * row, or a non-zero-diff render aborts the WHOLE run with no file touched.
 *
 * PINNING IS ORCHESTRATOR-ONLY, AT BATCH CLOSES (decisions.md D5, D10) —
 * T0b itself pins nothing real; this tool's own acceptance test exercises
 * `pinGoldens` against a synthetic fixture written to a temp root, never
 * the committed corpus.
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { fixtureIncludeStore } from '../../../tests/helpers/fixture-include-store.js';
import { compareSvg } from '../../../tests/oracle/svg-conformance/compare.js';
import { renderFixtureActivity } from '../../../tests/oracle/svg-conformance/render-fixture-activity.js';

const CACHE_DIR = 'test-results/dot-cache/activity';
const GOLDEN_DIR = 'oracle/goldens/svg-activity';
const RATCHET = `${GOLDEN_DIR}/ratchet.json`;
const DIFF_BASELINE = `${GOLDEN_DIR}/diff-baseline.json`;
const MISSION = 'activity-divergence-drive';
const CORPUS_BASELINES = [
  { file: 'oracle/goldens/svg-conformance/routing-baseline.json', okStatus: 'agree' },
  { file: 'oracle/goldens/svg-conformance/refusal-baseline.json', okStatus: 'ok' },
] as const;

type CorpusRow = Record<string, unknown> & { tree: string; type: string; slug: string; status: string };
interface CorpusBaseline {
  $comment: string;
  fixtures: CorpusRow[];
}

interface DiffBaselineRow extends Record<string, unknown> {
  slug: string;
  status: string;
}
interface DiffBaselineFile {
  fixtures: DiffBaselineRow[];
}
interface RatchetRow {
  slug: string;
  addedAt: string;
  source: string;
}
interface Ratchet {
  fixtures: RatchetRow[];
}

export interface PinOptions {
  readonly root: string;
  readonly sourceTag: string;
  readonly slugs: readonly string[];
  readonly date: string;
  readonly commit: string;
  readonly closeLabel: string;
}

const readJson = <T,>(root: string, rel: string): T => JSON.parse(readFileSync(join(root, rel), 'utf8')) as T;
const writeJson = (root: string, rel: string, data: unknown): void =>
  writeFileSync(join(root, rel), `${JSON.stringify(data, null, 2)}\n`);

/** Finds `slug`'s `diff-baseline.json` row; throws unless present and
 *  `status: "baseline"` — a missing, already-pinned, error, or jar-error
 *  row has no business being frozen into the golden ratchet. */
export function findBaselineRow(data: DiffBaselineFile, slug: string): DiffBaselineRow {
  const row = data.fixtures.find((f) => f.slug === slug);
  if (row === undefined) throw new Error(`${slug}: no diff-baseline.json row`);
  if (row.status !== 'baseline') {
    throw new Error(`${slug}: diff-baseline status is "${row.status}", expected "baseline"`);
  }
  return row;
}

/** Renders `markup` through the EXACT seam the golden ratchet gate uses and
 *  compares it against `golden` with the SAME comparator — the zero-diff
 *  eligibility check this tool exists to enforce before anything is
 *  written. */
export function renderIsZeroDiff(markup: string, golden: string): boolean {
  const ours = renderFixtureActivity(markup, new DeterministicMeasurer(), { includeStore: fixtureIncludeStore() });
  return compareSvg(ours, golden, 'deterministic').pass;
}

/** Validates one slug against the ratchet + diff-baseline + cache-dir
 *  state; throws (writing nothing) on the first violation. */
function validateSlug(root: string, ratchetSlugs: ReadonlySet<string>, diffBaseline: DiffBaselineFile, slug: string): void {
  if (ratchetSlugs.has(slug)) throw new Error(`${slug} is already in the ratchet`);
  findBaselineRow(diffBaseline, slug);
  for (const file of ['in.svg', 'in.puml']) {
    if (!existsSync(join(root, CACHE_DIR, slug, file))) throw new Error(`${slug}: missing ${file}`);
  }
  const markup = readFileSync(join(root, CACHE_DIR, slug, 'in.puml'), 'utf8');
  const golden = readFileSync(join(root, CACHE_DIR, slug, 'in.svg'), 'utf8');
  if (!renderIsZeroDiff(markup, golden)) {
    throw new Error(`${slug}: render is not zero-diff against the jar oracle`);
  }
}

function validate(root: string, ratchet: Ratchet, diffBaseline: DiffBaselineFile, o: PinOptions): void {
  if (o.slugs.length === 0) throw new Error('no slugs given');
  if (new Set(o.slugs).size !== o.slugs.length) throw new Error('duplicate slug in arguments');
  const ratchetSlugs = new Set(ratchet.fixtures.map((f) => f.slug));
  for (const slug of o.slugs) validateSlug(root, ratchetSlugs, diffBaseline, slug);
}

function copyVerified(root: string, slug: string): void {
  const dst = join(root, GOLDEN_DIR, slug);
  mkdirSync(dst, { recursive: true });
  for (const [from, to] of [
    ['in.svg', 'golden.svg'],
    ['in.puml', 'in.puml'],
  ] as const) {
    const src = join(root, CACHE_DIR, slug, from);
    copyFileSync(src, join(dst, to));
    if (!readFileSync(src).equals(readFileSync(join(dst, to)))) {
      throw new Error(`${slug}: ${to} is not byte-identical to ${from}`);
    }
  }
}

/** Pins `o.slugs`; returns the number pinned. */
/** The slug's single `dot-cache`/`activity` row in a corpus baseline, which
 *  must carry the file's ok status — the clone inherits it verbatim. */
export function findCorpusTwin(data: CorpusBaseline, slug: string, okStatus: string, file: string): CorpusRow {
  const twins = data.fixtures.filter((r) => r.tree === 'dot-cache' && r.type === 'activity' && r.slug === slug);
  if (twins.length !== 1) throw new Error(`${file}: ${slug} has ${twins.length} dot-cache twins`);
  const twin = twins[0]!;
  if (twin.status !== okStatus) throw new Error(`${file}: ${slug} twin status ${twin.status}`);
  return twin;
}

/** Reads both corpus baselines and builds every clone row, throwing before
 *  anything is written if a twin is absent or not ok. */
function buildCorpusClones(o: PinOptions): { file: string; data: CorpusBaseline; clones: CorpusRow[] }[] {
  return CORPUS_BASELINES.map(({ file, okStatus }) => {
    const data = readJson<CorpusBaseline>(o.root, file);
    const clones = o.slugs.map((slug) => ({
      ...findCorpusTwin(data, slug, okStatus, file),
      tree: 'goldens',
      type: 'svg-activity',
      slug,
      measuredAt: o.date,
      measuredAgainstCommit: o.commit,
    }));
    return { file, data, clones };
  });
}

export function pinGoldens(o: PinOptions): number {
  const ratchet = readJson<Ratchet>(o.root, RATCHET);
  const diffBaseline = readJson<DiffBaselineFile>(o.root, DIFF_BASELINE);
  validate(o.root, ratchet, diffBaseline, o);
  const corpus = buildCorpusClones(o);

  for (const slug of o.slugs) copyVerified(o.root, slug);
  for (const slug of o.slugs) ratchet.fixtures.push({ slug, addedAt: o.date, source: o.sourceTag });
  writeJson(o.root, RATCHET, ratchet);

  for (const slug of o.slugs) {
    // `validate` already proved this row exists and is "baseline" — the
    // non-null assertion mirrors that proof rather than re-checking it.
    const row = diffBaseline.fixtures.find((f) => f.slug === slug)!;
    row.status = 'pinned';
  }
  writeJson(o.root, DIFF_BASELINE, diffBaseline);

  const note = ` Re-pinned ${o.date} at ${o.commit} by ${MISSION} / ${o.closeLabel}, ADDITIVE ONLY (${o.slugs.length} "svg-activity" golden rows appended, clones of their byte-identical dot-cache twins).`;
  for (const { file, data, clones } of corpus) {
    data.fixtures.push(...clones);
    data.$comment += note;
    writeJson(o.root, file, data);
  }
  return o.slugs.length;
}

/* v8 ignore start -- CLI entry point; exercised via the acceptance run. */
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const argv = process.argv.slice(2);
  const [sourceTag, closeLabel, ...slugs] = argv;
  if (!sourceTag || !closeLabel || slugs.length === 0) {
    console.error('usage: pin-goldens.mts <source-tag> <close-label> <slug...>');
    process.exit(2);
  }
  const commit = execFileSync('git', ['rev-parse', '--short=9', 'HEAD'], { encoding: 'utf8' }).trim();
  const d = new Date();
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const n = pinGoldens({ root: process.cwd(), sourceTag, slugs, date, commit, closeLabel });
  console.log(`pinned ${n} fixture(s) as ${sourceTag}`);
}
/* v8 ignore stop */
