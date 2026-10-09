/**
 * Manifest of every committed artifact that is a render of the pinned oracle
 * jar (mission instrument-space-width, T0b). One row per re-capturable target
 * `{kind, dir, puml, outputs}`; the rows are built by a PURE function over a
 * list of repo-relative file paths so the classification is unit-testable
 * without a filesystem (testability.md #1/#2). The only I/O is
 * `listRepoFiles`.
 *
 * Paths are repo-relative, POSIX-separated.
 */
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { posix } from 'node:path';

/** What a target's committed bytes are. */
export const TARGET_KIND = {
  /** `test-results/dot-cache/<engine>/<slug>/`: `in.svg` + `svek-*.dot`. */
  dotCache: 'dot-cache',
  /** `oracle/goldens/svg-*` `golden.svg` beside its `in.puml`. */
  svgGolden: 'svg-golden',
  /** `oracle/goldens/{class,object,state,description}/<slug>/svek-*.dot`. */
  dotGolden: 'dot-golden',
  /** `tests/fixtures/**` `<name>.svg` beside `<name>.puml`. */
  fixtureSvg: 'fixture-svg',
} as const;

export type TargetKind = (typeof TARGET_KIND)[keyof typeof TARGET_KIND];

export interface Target {
  readonly kind: TargetKind;
  /** Directory holding the outputs (fixture-svg: the directory of the svg). */
  readonly dir: string;
  /** The `.puml` the jar renders. */
  readonly puml: string;
  /** Committed output file names (relative to `dir`), sorted. */
  readonly outputs: readonly string[];
}

export const DOT_CACHE_ROOT = 'test-results/dot-cache';
export const GOLDENS_ROOT = 'oracle/goldens';
export const FIXTURES_ROOT = 'tests/fixtures';
const DOT_GOLDEN_ENGINES: ReadonlySet<string> = new Set(['class', 'object', 'state', 'description']);
const SVEK_DOT = /^svek-\d+\.dot$/;
const CACHE_PUML = 'in.puml';
const CACHE_SVG = 'in.svg';
const GOLDEN_PUML = 'in.puml';
const GOLDEN_SVG = 'golden.svg';
const DOT_GOLDEN_PUML = 'input.puml';

export function isSvekDot(name: string): boolean {
  return SVEK_DOT.test(name);
}

function byDir(files: readonly string[]): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const f of files) {
    const dir = posix.dirname(f);
    const names = out.get(dir) ?? [];
    names.push(posix.basename(f));
    out.set(dir, names);
  }
  return out;
}

function under(dir: string, root: string): boolean {
  return dir.startsWith(`${root}/`);
}

function topSegment(dir: string, root: string): string {
  return dir.slice(root.length + 1).split('/')[0] ?? '';
}

function dotCacheTarget(dir: string, names: readonly string[]): Target | undefined {
  if (!under(dir, DOT_CACHE_ROOT) || !names.includes(CACHE_PUML) || !names.includes(CACHE_SVG)) return undefined;
  const outputs = [CACHE_SVG, ...names.filter(isSvekDot)].sort();
  return { kind: TARGET_KIND.dotCache, dir, puml: posix.join(dir, CACHE_PUML), outputs };
}

function svgGoldenTarget(dir: string, names: readonly string[]): Target | undefined {
  if (!under(dir, GOLDENS_ROOT) || !topSegment(dir, GOLDENS_ROOT).startsWith('svg-')) return undefined;
  if (!names.includes(GOLDEN_SVG) || !names.includes(GOLDEN_PUML)) return undefined;
  return { kind: TARGET_KIND.svgGolden, dir, puml: posix.join(dir, GOLDEN_PUML), outputs: [GOLDEN_SVG] };
}

function dotGoldenTarget(dir: string, names: readonly string[]): Target | undefined {
  if (!under(dir, GOLDENS_ROOT) || !DOT_GOLDEN_ENGINES.has(topSegment(dir, GOLDENS_ROOT))) return undefined;
  const dots = names.filter(isSvekDot).sort();
  if (!names.includes(DOT_GOLDEN_PUML) || dots.length === 0) return undefined;
  return { kind: TARGET_KIND.dotGolden, dir, puml: posix.join(dir, DOT_GOLDEN_PUML), outputs: dots };
}

function fixtureSvgTargets(dir: string, names: readonly string[]): Target[] {
  if (!under(dir, FIXTURES_ROOT)) return [];
  const pumls = new Set(names.filter((n) => n.endsWith('.puml')));
  return names
    .filter((n) => n.endsWith('.svg') && pumls.has(`${n.slice(0, -'.svg'.length)}.puml`))
    .sort()
    .map((svg) => ({
      kind: TARGET_KIND.fixtureSvg,
      dir,
      puml: posix.join(dir, `${svg.slice(0, -'.svg'.length)}.puml`),
      outputs: [svg],
    }));
}

/** Pure: every re-capturable target among `files` (repo-relative paths). */
export function buildManifest(files: readonly string[]): Target[] {
  const out: Target[] = [];
  for (const [dir, names] of [...byDir(files)].sort(([a], [b]) => (a < b ? -1 : 1))) {
    for (const t of [dotCacheTarget(dir, names), svgGoldenTarget(dir, names), dotGoldenTarget(dir, names)]) {
      if (t) out.push(t);
    }
    out.push(...fixtureSvgTargets(dir, names));
  }
  return out;
}

/** The id `--only` globs match against: the output directory, or for a
 *  fixture-svg the svg path itself. */
export function targetId(t: Target): string {
  return t.kind === TARGET_KIND.fixtureSvg ? posix.join(t.dir, t.outputs[0] ?? '') : t.dir;
}

function globToRegExp(glob: string): RegExp {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i]!;
    if (c === '*' && glob[i + 1] === '*') {
      re += '.*';
      i += 1;
    } else if (c === '*') re += '[^/]*';
    else if (c === '?') re += '[^/]';
    else re += c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  // Unanchored on the left at a path boundary: `usecase/foo` selects
  // `test-results/dot-cache/usecase/foo`.
  return new RegExp(`(^|/)${re}$`);
}

/** Pure: keep targets whose id matches ANY of the globs (all when empty). */
export function filterTargets(targets: readonly Target[], globs: readonly string[]): Target[] {
  if (globs.length === 0) return [...targets];
  const res = globs.map(globToRegExp);
  return targets.filter((t) => res.some((r) => r.test(targetId(t))));
}

/** I/O: every file under the three roots, repo-relative POSIX paths. */
export function listRepoFiles(repo: string): string[] {
  const out: string[] = [];
  for (const root of [DOT_CACHE_ROOT, GOLDENS_ROOT, FIXTURES_ROOT]) {
    let entries: string[];
    try {
      entries = readdirSync(join(repo, root), { recursive: true, encoding: 'utf8' });
    } catch {
      continue; // a missing root (e.g. an unpopulated dot-cache) is no targets
    }
    for (const e of entries) {
      if (/\.(puml|svg|dot)$/.test(e)) out.push(posix.join(root, e.split('\\').join('/')));
    }
  }
  return out.sort();
}
