/**
 * `npx jiti plans/utility-factories-port/measurements/pin-utility.mts <slug>... [--repo <root>] [--goldens <dir>]`
 *
 * The orchestrator's pin path for the svg-utility golden ratchet
 * (utility-factories-port T0b, D9), modelled on
 * `plans/class-divergence-drive/tools/pin-goldens.mts` (its argv handling,
 * its validate-then-copy-then-append order, its byte-equality re-read). Wbs
 * has no `--tree`, and the routing/refusal twin-row clones the class tool
 * appends live in `repin-utility-routing.mts` instead (run it after every pin:
 * both gates walk `oracle/goldens/svg-utility/` and demand a row per golden
 * dir; salt-engine-port batch-4 close, journal row 34). Per slug:
 *
 * 1. copies `<repo>/test-results/dot-cache/unknown/<slug>/{in.puml,in.svg}` to
 *    `<goldens>/<slug>/{in.puml,golden.svg}` and re-reads both sides to
 *    prove byte equality, throwing on any mismatch;
 * 2. APPENDS `{ slug, addedAt, source: "dot-cache" }` to
 *    `<goldens>/ratchet.json` — never re-sorted (the ratchet tamper test
 *    reads `fixtures[0]`).
 *
 * A slug already in `ratchet.json` is reported as already pinned and
 * skipped: no copy, no duplicate entry; a run that pins nothing leaves
 * `ratchet.json` byte-unchanged. Every new slug's cache files are checked
 * before anything is written. `--repo` defaults to the git toplevel;
 * `--goldens` defaults to `oracle/goldens/svg-utility`, a relative value
 * resolving against `--repo`.
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { UTILITY_SLUGS } from '../../../tests/oracle/svg-conformance/render-fixture-utility.js';

export const DEFAULT_GOLDENS = 'oracle/goldens/svg-utility';
const CACHE_DIR = 'test-results/dot-cache/unknown';
const RATCHET_FILE = 'ratchet.json';
const SOURCE = 'dot-cache';
/** cache file -> golden file, as `oracle/goldens/svg-utility/README.md` lays out. */
const COPIES = [
  ['in.puml', 'in.puml'],
  ['in.svg', 'golden.svg'],
] as const;

interface RatchetRow {
  slug: string;
  addedAt: string;
  source: string;
}
interface Ratchet {
  fixtures: RatchetRow[];
}

export type Copier = (src: string, dst: string) => void;

export interface PinUtilityOptions {
  repo: string;
  goldens: string;
  slugs: readonly string[];
  date: string;
  /** Test seam for the mismatch branch; defaults to `copyFileSync`. */
  copy?: Copier;
}

export interface PinUtilityResult {
  pinned: string[];
  alreadyPinned: string[];
}

export interface PinUtilityArgs {
  repo: string;
  goldens: string;
  slugs: string[];
}

function validate(o: PinUtilityOptions, fresh: readonly string[]): void {
  if (o.slugs.length === 0) throw new Error('no slugs given');
  const stray = o.slugs.find((s) => !UTILITY_SLUGS.includes(s));
  if (stray !== undefined) throw new Error(`${stray}: not one of the ${UTILITY_SLUGS.length} UTILITY_SLUGS`);
  const dup = o.slugs.find((s, i) => o.slugs.indexOf(s) !== i);
  if (dup !== undefined) throw new Error(`duplicate slug in arguments: ${dup}`);
  for (const slug of fresh) {
    for (const [from] of COPIES) {
      const rel = `${CACHE_DIR}/${slug}/${from}`;
      if (!existsSync(join(o.repo, rel))) throw new Error(`${slug}: missing ${rel}`);
    }
  }
}

function copyVerified(o: PinUtilityOptions, slug: string): void {
  const dst = join(o.goldens, slug);
  mkdirSync(dst, { recursive: true });
  const copy = o.copy ?? copyFileSync;
  for (const [from, to] of COPIES) {
    const rel = `${CACHE_DIR}/${slug}/${from}`;
    const src = join(o.repo, rel);
    copy(src, join(dst, to));
    if (!readFileSync(src).equals(readFileSync(join(dst, to)))) {
      throw new Error(`${slug}: ${to} is not byte-identical to ${rel}`);
    }
  }
}

/** Pins `o.slugs` into `<o.goldens>/ratchet.json`; see the file doc comment. */
export function pinUtility(o: PinUtilityOptions): PinUtilityResult {
  const ratchetPath = join(o.goldens, RATCHET_FILE);
  const ratchet = JSON.parse(readFileSync(ratchetPath, 'utf8')) as Ratchet;
  const present = new Set(ratchet.fixtures.map((f) => f.slug));
  const alreadyPinned = o.slugs.filter((s) => present.has(s));
  const pinned = o.slugs.filter((s) => !present.has(s));
  validate(o, pinned);
  for (const slug of pinned) copyVerified(o, slug);
  if (pinned.length > 0) {
    for (const slug of pinned) ratchet.fixtures.push({ slug, addedAt: o.date, source: SOURCE });
    writeFileSync(ratchetPath, `${JSON.stringify(ratchet, null, 2)}\n`);
  }
  return { pinned, alreadyPinned };
}

/** `<slug>... [--repo <root>] [--goldens <dir>]`, flags in any position.
 *  `toplevel` is consulted only when `--repo` is absent. */
export function parseArgs(argv: readonly string[], toplevel: () => string): PinUtilityArgs {
  const flags = new Map<string, string>();
  const slugs: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (!a.startsWith('--')) {
      slugs.push(a);
      continue;
    }
    if (a !== '--repo' && a !== '--goldens') throw new Error(`unknown option ${a}`);
    const v = argv[++i];
    if (v === undefined) throw new Error(`${a} needs a value`);
    flags.set(a, v);
  }
  const repo = flags.get('--repo') ?? toplevel();
  return { repo, goldens: resolve(repo, flags.get('--goldens') ?? DEFAULT_GOLDENS), slugs };
}

/* v8 ignore start -- CLI entry point; exercised via the acceptance run. */
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  try {
    const gitTop = (): string => execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
    const args = parseArgs(process.argv.slice(2), gitTop);
    const d = new Date();
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const { pinned, alreadyPinned } = pinUtility({ ...args, date });
    console.log(`pinned ${pinned.length} fixture(s) into ${args.goldens}: ${pinned.join(' ') || '(none)'}`);
    if (alreadyPinned.length > 0) console.log(`already pinned (skipped): ${alreadyPinned.join(' ')}`);
  } catch (err) {
    console.error(`pin-utility: ${err instanceof Error ? err.message : String(err)}`);
    console.error('usage: pin-utility.mts <slug>... [--repo <root>] [--goldens <dir>]');
    process.exit(1);
  }
}
/* v8 ignore stop */
