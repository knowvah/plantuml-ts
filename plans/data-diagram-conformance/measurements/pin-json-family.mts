/**
 * `npx jiti plans/data-diagram-conformance/measurements/pin-json-family.mts <json|yaml|hcl> <slug>... [--write] [--repo <root>] [--goldens <dir>]`
 *
 * The orchestrator's pin path for the svg-json / svg-yaml / svg-hcl golden
 * ratchets (data-diagram-conformance T0a, D1), the twin of
 * `plans/gantt-divergence-drive/measurements/pin-gantt.mts` with the family
 * TYPE as the first argument: `CACHE_DIR = test-results/dot-cache/<type>`,
 * goldens `oracle/goldens/svg-<type>`, accepted-id prefix `svg-<type>/`,
 * stock-error prefix `<type>/`. `pin-files.mts` reuses {@link pinFamily} with
 * `type = 'files'`. Per slug:
 *
 * 1. copies `<repo>/test-results/dot-cache/<type>/<slug>/{in.puml,in.svg}` to
 *    `<goldens>/<slug>/{in.puml,golden.svg}` and re-reads both sides to
 *    prove byte equality, throwing on any mismatch;
 * 2. APPENDS `{ slug, addedAt, source: "dot-cache" }` to
 *    `<goldens>/ratchet.json` -- the `RatchetFixture` shape of
 *    `tests/oracle/svg-conformance/json-family-ratchet.ts:31-35`, never
 *    re-sorted (the tamper test reads `fixtures[0]`, `:93`).
 *
 * DRY-RUN BY DEFAULT (the gantt rule): without `--write` the script validates
 * and prints which slugs it would pin and which are already pinned, and
 * touches nothing.
 *
 * REFUSED, before validation: a survey calls a row "conformant" when it is
 * byte-equal OR listed in `oracle/accepted-divergences.json` OR a jar error
 * page we also error on, but the golden ratchet demands byte equality. So a
 * slug is refused (`REFUSED <slug>: <reason>`, nothing copied, exit 1 after
 * the others are processed) when `svg-<type>/<slug>` is a `match.id` in
 * `<repo>/oracle/accepted-divergences.json`, or `<type>/<slug>` is a key of
 * `<repo>/oracle/goldens/stock-error-pages.json` -- decided by the survey's own
 * `loadStockErrorRecord` (`scripts/lib/survey-error-verdict.ts:38`).
 *
 * A slug already in `ratchet.json` is reported as already pinned and
 * skipped: no copy, no duplicate entry; a run that pins nothing leaves
 * `ratchet.json` byte-unchanged. Every new slug's cache files are checked
 * before anything is written. `--repo` defaults to the git toplevel;
 * `--goldens` defaults to `oracle/goldens/svg-<type>`, a relative value
 * resolving against `--repo`. Authored fixtures (`tests/fixtures/<type>/`)
 * are never pinned here: the structural gate's authored root (json family,
 * T1e) and `svg-files/authored-baseline.json` (files, T0b) track them.
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { loadStockErrorRecord } from '../../../scripts/lib/survey-error-verdict.js';

export const FAMILY_TYPES = ['json', 'yaml', 'hcl', 'files'] as const;
export type FamilyType = (typeof FAMILY_TYPES)[number];

const RATCHET_FILE = 'ratchet.json';
const SOURCE = 'dot-cache';
const ACCEPTED_FILE = 'oracle/accepted-divergences.json';
const STOCK_ERRORS_FILE = 'oracle/goldens/stock-error-pages.json';
/** cache file -> golden file, as `oracle/goldens/svg-json/README.md` lays out. */
const COPIES = [
  ['in.puml', 'in.puml'],
  ['in.svg', 'golden.svg'],
] as const;

export const defaultGoldens = (type: FamilyType): string => `oracle/goldens/svg-${type}`;
const cacheDir = (type: FamilyType): string => `test-results/dot-cache/${type}`;

interface RatchetRow {
  slug: string;
  addedAt: string;
  source: string;
}
interface Ratchet {
  fixtures: RatchetRow[];
}

export type Copier = (src: string, dst: string) => void;

export interface PinFamilyOptions {
  type: FamilyType;
  repo: string;
  goldens: string;
  slugs: readonly string[];
  date: string;
  /** Validate and report only: nothing is copied or appended. */
  dryRun?: boolean;
  /** Test seam for the mismatch branch; defaults to `copyFileSync`. */
  copy?: Copier;
}

export interface Refusal {
  slug: string;
  reason: string;
}

export interface PinFamilyResult {
  pinned: string[];
  alreadyPinned: string[];
  refused: Refusal[];
}

export interface PinFamilyArgs {
  type: FamilyType;
  repo: string;
  goldens: string;
  slugs: string[];
  write: boolean;
}

function acceptedIds(repo: string): ReadonlySet<string> {
  const { entries: rows } = JSON.parse(readFileSync(join(repo, ACCEPTED_FILE), 'utf8')) as {
    entries: { match?: { id?: string } }[];
  };
  return new Set(rows.flatMap((r) => (r.match?.id === undefined ? [] : [r.match.id])));
}

/** The rule-conformant slugs among `slugs`: a survey's "conformant" that byte equality cannot honour. */
function refusals(type: FamilyType, repo: string, slugs: readonly string[]): Refusal[] {
  const accepted = acceptedIds(repo);
  const stock = loadStockErrorRecord(join(repo, STOCK_ERRORS_FILE));
  const out: Refusal[] = [];
  for (const slug of slugs) {
    if (accepted.has(`svg-${type}/${slug}`)) {
      out.push({ slug, reason: `svg-${type}/${slug} is an accepted divergence (${ACCEPTED_FILE}), not byte-equal` });
    } else if (stock.has(`${type}/${slug}`)) {
      out.push({ slug, reason: `${type}/${slug} is a stock jar error page (${STOCK_ERRORS_FILE}), not byte-equal` });
    }
  }
  return out;
}

function validate(o: PinFamilyOptions, fresh: readonly string[]): void {
  const dup = o.slugs.find((s, i) => o.slugs.indexOf(s) !== i);
  if (dup !== undefined) throw new Error(`duplicate slug in arguments: ${dup}`);
  for (const slug of fresh) {
    for (const [from] of COPIES) {
      const rel = `${cacheDir(o.type)}/${slug}/${from}`;
      if (!existsSync(join(o.repo, rel))) throw new Error(`${slug}: missing ${rel}`);
    }
  }
}

function copyVerified(o: PinFamilyOptions, slug: string): void {
  const dst = join(o.goldens, slug);
  mkdirSync(dst, { recursive: true });
  const copy = o.copy ?? copyFileSync;
  for (const [from, to] of COPIES) {
    const rel = `${cacheDir(o.type)}/${slug}/${from}`;
    const src = join(o.repo, rel);
    copy(src, join(dst, to));
    if (!readFileSync(src).equals(readFileSync(join(dst, to)))) {
      throw new Error(`${slug}: ${to} is not byte-identical to ${rel}`);
    }
  }
}

/** Pins `o.slugs` into `<o.goldens>/ratchet.json`; see the file doc comment.
 *  `o.dryRun` validates and reports without copying or appending. */
export function pinFamily(o: PinFamilyOptions): PinFamilyResult {
  const ratchetPath = join(o.goldens, RATCHET_FILE);
  const ratchet = JSON.parse(readFileSync(ratchetPath, 'utf8')) as Ratchet;
  const present = new Set(ratchet.fixtures.map((f) => f.slug));
  if (o.slugs.length === 0) throw new Error('no slugs given');
  const refused = refusals(o.type, o.repo, o.slugs);
  const kept = o.slugs.filter((s) => !refused.some((r) => r.slug === s));
  const alreadyPinned = kept.filter((s) => present.has(s));
  const pinned = kept.filter((s) => !present.has(s));
  validate(o, pinned);
  if (o.dryRun === true) return { pinned, alreadyPinned, refused };
  for (const slug of pinned) copyVerified(o, slug);
  if (pinned.length > 0) {
    for (const slug of pinned) ratchet.fixtures.push({ slug, addedAt: o.date, source: SOURCE });
    writeFileSync(ratchetPath, `${JSON.stringify(ratchet, null, 2)}\n`);
  }
  return { pinned, alreadyPinned, refused };
}

function isFamilyType(s: string): s is FamilyType {
  return (FAMILY_TYPES as readonly string[]).includes(s);
}

/** `[<type>] <slug>... [--write] [--repo <root>] [--goldens <dir>]`, flags in any
 *  position. The type is the first positional when `fixedType` is absent
 *  (`pin-files.mts` passes `'files'`). `toplevel` is consulted only when
 *  `--repo` is absent. */
export function parseArgs(argv: readonly string[], toplevel: () => string, fixedType?: FamilyType): PinFamilyArgs {
  const flags = new Map<string, string>();
  const positional: string[] = [];
  let write = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (!a.startsWith('--')) {
      positional.push(a);
      continue;
    }
    if (a === '--write') {
      write = true;
      continue;
    }
    if (a !== '--repo' && a !== '--goldens') throw new Error(`unknown option ${a}`);
    const v = argv[++i];
    if (v === undefined) throw new Error(`${a} needs a value`);
    flags.set(a, v);
  }
  let type: FamilyType;
  if (fixedType !== undefined) type = fixedType;
  else {
    const first = positional.shift();
    if (first === undefined || !isFamilyType(first)) throw new Error(`first argument must be one of ${FAMILY_TYPES.join('|')}`);
    type = first;
  }
  const repo = flags.get('--repo') ?? toplevel();
  return { type, repo, goldens: resolve(repo, flags.get('--goldens') ?? defaultGoldens(type)), slugs: positional, write };
}

export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** The shared CLI body (`pin-files.mts` calls it with `fixedType = 'files'`). */
export function runCli(argv: readonly string[], name: string, fixedType?: FamilyType): void {
  try {
    const gitTop = (): string => execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
    const args = parseArgs(argv, gitTop, fixedType);
    const { pinned, alreadyPinned, refused } = pinFamily({ ...args, date: todayIso(), dryRun: !args.write });
    const verb = args.write ? 'pinned' : 'would pin';
    console.log(`${verb} ${pinned.length} ${args.type} fixture(s) into ${args.goldens}: ${pinned.join(' ') || '(none)'}`);
    if (alreadyPinned.length > 0) console.log(`already pinned (skipped): ${alreadyPinned.join(' ')}`);
    for (const r of refused) console.log(`REFUSED ${r.slug}: ${r.reason}`);
    if (refused.length > 0) process.exitCode = 1;
    if (!args.write) console.log('dry run -- pass --write to copy the goldens and append to ratchet.json');
  } catch (err) {
    console.error(`${name}: ${err instanceof Error ? err.message : String(err)}`);
    const typeArg = fixedType === undefined ? '<json|yaml|hcl> ' : '';
    console.error(`usage: ${name} ${typeArg}<slug>... [--write] [--repo <root>] [--goldens <dir>]`);
    process.exit(1);
  }
}

/* v8 ignore start -- CLI entry point; exercised via the acceptance run. */
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) runCli(process.argv.slice(2), 'pin-json-family.mts');
/* v8 ignore stop */
