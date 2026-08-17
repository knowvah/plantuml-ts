/**
 * SI27 T0 (`decisions.md#d5`) — the shared-seam-extraction fitness function.
 *
 * Rule 1: nothing under `src/core/` imports from `src/diagrams/`.
 * Rule 2: nothing under `src/diagrams/X/` imports from `src/diagrams/Y/`
 * for `X !== Y`. Both are textual static-import scans over every `.ts` file
 * under `src/`, the same shape as `tests/architecture/cucadiagram-base-imports.test.ts`,
 * with comments stripped first so a doc comment that happens to quote an
 * import statement (this codebase has several — see `render-options.ts`,
 * `dot-sync-report.ts`) cannot forge an edge.
 *
 * `ALLOWLIST` documents deliberate, upstream-justified exceptions.
 * `KNOWN_DEBT` documents the edges measured at T0 that later tasks retire —
 * asserted non-stale so a task that lands without actually removing its edge
 * cannot silently leave the debt list wrong.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = join(REPO, 'src');
const CORE_PREFIX = 'src/core/';
const DIAGRAMS_PREFIX = 'src/diagrams/';

export interface ImportEdge {
  readonly from: string;
  readonly to: string;
}

export interface AllowlistEntry extends ImportEdge {
  readonly why: string;
}

export interface DebtEntry extends ImportEdge {
  readonly retiredBy: string;
}

/**
 * Seeded exceptions (decisions.md#d5). `src/index.ts` is the measured
 * (2026-08-17) sole importer of `diagrams/*\/index.js` — `src/core/
 * dispatcher.ts` declares `DiagramRegistry`'s type but every engine's
 * `registry.register(...)` call lives in `src/index.ts`, the composition
 * root, not under `src/core/`. Rule 1 as scoped below never flags
 * `src/index.ts` (it is neither `src/core/**` nor `src/diagrams/X/**`), so
 * this entry documents the exception without being exercised by a real
 * offender — kept for when the registry itself moves under `src/core/`.
 */
export const ALLOWLIST: readonly AllowlistEntry[] = [
  {
    from: 'src/index.ts',
    to: 'src/diagrams/',
    why:
      'upstream PSystem*Factory dispatch — the composition root registers ' +
      'every engine plugin (registry.register(...)) and must import each ' +
      "engine's index.ts to do so.",
  },
  {
    from: 'src/diagrams/hcl/',
    to: 'src/diagrams/json/',
    why:
      'CLAUDE.md JsonDiagram ruling — hcl renders VIA the json engine ' +
      '(parser/layout/renderer); upstream JsonDiagram is one class shared ' +
      'by json/yaml/hcl.',
  },
  {
    from: 'src/diagrams/yaml/',
    to: 'src/diagrams/json/',
    why:
      'CLAUDE.md JsonDiagram ruling — yaml renders VIA the json engine ' +
      '(parser/layout/renderer); upstream JsonDiagram is one class shared ' +
      'by json/yaml/hcl.',
  },
];

/** Measured 2026-08-17 at 321bfb8b (T0). Each entry names the task that
 *  retires its edge; T10 (README batch 3) empties this array. */
export const KNOWN_DEBT: readonly DebtEntry[] = [
  { from: 'src/core/edge-label-box.ts', to: 'src/diagrams/class/class-layout-edge-labels.ts', retiredBy: 'T1' },
  { from: 'src/core/assemble-svg.ts', to: 'src/diagrams/description/renderer.ts', retiredBy: 'T8' },
  { from: 'src/core/assemble-svg.ts', to: 'src/diagrams/class/renderer-shell.ts', retiredBy: 'T8' },
  { from: 'src/core/assemble-svg.ts', to: 'src/diagrams/state/renderer-shell.ts', retiredBy: 'T8' },
  { from: 'src/core/assemble-svg.ts', to: 'src/diagrams/json/renderer-shell.ts', retiredBy: 'T8' },
  { from: 'src/diagrams/class/class-geo-types.ts', to: 'src/diagrams/description/leaf-sizing.ts', retiredBy: 'T3' },
  { from: 'src/diagrams/class/class-layout-leaf-shapes.ts', to: 'src/diagrams/description/leaf-sizing.ts', retiredBy: 'T3' },
  { from: 'src/diagrams/class/class-layout-generic-classifier.ts', to: 'src/diagrams/description/leaf-sizing.ts', retiredBy: 'T3' },
  { from: 'src/diagrams/class/class-layout-generic-classifier.ts', to: 'src/diagrams/description/ast.ts', retiredBy: 'T3' },
  { from: 'src/diagrams/class/class-layout-helpers.ts', to: 'src/diagrams/description/leaf-sizing.ts', retiredBy: 'T3' },
  { from: 'src/diagrams/class/renderer-usymbol-entity.ts', to: 'src/diagrams/description/renderer-symbol.ts', retiredBy: 'T2' },
  { from: 'src/diagrams/class/renderer-usymbol-entity.ts', to: 'src/diagrams/description/render-atoms.ts', retiredBy: 'T2' },
  { from: 'src/diagrams/state/state-render-colors.ts', to: 'src/diagrams/class/class-color-override.ts', retiredBy: 'T4' },
];

/** `true` when `edge` is covered by `entry` — prefix match on both sides so
 *  a directory-level entry (hcl/yaml → json) covers every file under it,
 *  while a file-level entry (KNOWN_DEBT) covers only its exact edge. */
export function matchesEntry(entry: ImportEdge, edge: ImportEdge): boolean {
  return edge.from.startsWith(entry.from) && edge.to.startsWith(entry.to);
}

// ---------------------------------------------------------------------------
// Static-import scan
// ---------------------------------------------------------------------------

function toPosix(p: string): string {
  return p.split(sep).join('/');
}

function listTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...listTsFiles(p));
    else if (name.endsWith('.ts') && !name.endsWith('.test.ts')) out.push(p);
  }
  return out;
}

/** Strips block and line comments so a doc comment quoting an import
 *  statement cannot be mistaken for a real one. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

/** Resolves a relative import specifier to a `.ts` file under `src/`, or
 *  `undefined` for a package import (not relative) or a target the scan
 *  can't resolve on disk. */
function resolveSpecifier(fromFile: string, specifier: string): string | undefined {
  if (!specifier.startsWith('.')) return undefined;
  const base = join(dirname(fromFile), specifier.replace(/\.js$/, ''));
  for (const candidate of [base + '.ts', join(base, 'index.ts')]) {
    if (existsSync(candidate)) return candidate;
  }
  return undefined;
}

const FROM_CLAUSE_RE = /\bfrom\s+['"]([^'"]+)['"]/g;
const SIDE_EFFECT_IMPORT_RE = /^\s*import\s+['"]([^'"]+)['"]/gm;

function extractEdges(file: string): ImportEdge[] {
  const src = stripComments(readFileSync(file, 'utf-8'));
  const from = toPosix(relative(REPO, file));
  const specifiers = [
    ...[...src.matchAll(FROM_CLAUSE_RE)].map((m) => m[1]!),
    ...[...src.matchAll(SIDE_EFFECT_IMPORT_RE)].map((m) => m[1]!),
  ];
  const edges: ImportEdge[] = [];
  for (const specifier of specifiers) {
    const resolved = resolveSpecifier(file, specifier);
    if (resolved !== undefined) edges.push({ from, to: toPosix(relative(REPO, resolved)) });
  }
  return edges;
}

function diagramPackageOf(path: string): string | undefined {
  if (!path.startsWith(DIAGRAMS_PREFIX)) return undefined;
  return path.slice(DIAGRAMS_PREFIX.length).split('/')[0];
}

function isRule1Offender(e: ImportEdge): boolean {
  return e.from.startsWith(CORE_PREFIX) && e.to.startsWith(DIAGRAMS_PREFIX);
}

function isRule2Offender(e: ImportEdge): boolean {
  const x = diagramPackageOf(e.from);
  const y = diagramPackageOf(e.to);
  return x !== undefined && y !== undefined && x !== y;
}

function scanEdges(): ImportEdge[] {
  return listTsFiles(SRC).flatMap(extractEdges);
}

// ---------------------------------------------------------------------------
// Fitness function
// ---------------------------------------------------------------------------

describe('layering fitness function (SI27 D5)', () => {
  const edges = scanEdges();
  const offenders = edges.filter((e) => isRule1Offender(e) || isRule2Offender(e));

  it('every core→diagrams or diagrams/X→diagrams/Y offender is allowlisted or known debt', () => {
    const uncovered = offenders.filter(
      (e) => !ALLOWLIST.some((a) => matchesEntry(a, e)) && !KNOWN_DEBT.some((d) => matchesEntry(d, e)),
    );
    expect(uncovered).toEqual([]);
  });

  it('every KNOWN_DEBT entry still matches at least one real import (no stale debt)', () => {
    const stale = KNOWN_DEBT.filter((d) => !edges.some((e) => matchesEntry(d, e)));
    expect(stale).toEqual([]);
  });

  it('every ALLOWLIST entry has a non-empty why', () => {
    const empty = ALLOWLIST.filter((a) => a.why.trim().length === 0);
    expect(empty).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Matcher — fixture-free unit (no filesystem access)
// ---------------------------------------------------------------------------

describe('matchesEntry (fixture-free)', () => {
  it('covers an edge whose from/to both extend a directory-level entry', () => {
    const entry: ImportEdge = { from: 'src/diagrams/hcl/', to: 'src/diagrams/json/' };
    const edge: ImportEdge = { from: 'src/diagrams/hcl/index.ts', to: 'src/diagrams/json/ast.ts' };
    expect(matchesEntry(entry, edge)).toBe(true);
  });

  it('rejects an edge whose from does not extend the entry from prefix', () => {
    const entry: ImportEdge = { from: 'src/diagrams/hcl/', to: 'src/diagrams/json/' };
    const edge: ImportEdge = { from: 'src/diagrams/yaml/index.ts', to: 'src/diagrams/json/ast.ts' };
    expect(matchesEntry(entry, edge)).toBe(false);
  });

  it('reproduces assertion (a): an uncovered offender is reported, a covered one is not', () => {
    const allowlist: readonly AllowlistEntry[] = [{ from: 'src/diagrams/hcl/', to: 'src/diagrams/json/', why: 'test' }];
    const debt: readonly DebtEntry[] = [{ from: 'src/core/x.ts', to: 'src/diagrams/class/', retiredBy: 'T1' }];
    const offenders: ImportEdge[] = [
      { from: 'src/diagrams/hcl/index.ts', to: 'src/diagrams/json/ast.ts' }, // covered by allowlist
      { from: 'src/core/x.ts', to: 'src/diagrams/class/y.ts' }, // covered by debt
      { from: 'src/core/z.ts', to: 'src/diagrams/state/w.ts' }, // uncovered
    ];
    const uncovered = offenders.filter(
      (e) => !allowlist.some((a) => matchesEntry(a, e)) && !debt.some((d) => matchesEntry(d, e)),
    );
    expect(uncovered).toEqual([{ from: 'src/core/z.ts', to: 'src/diagrams/state/w.ts' }]);
  });

  it('reproduces assertion (b): a KNOWN_DEBT entry with no matching import is reported stale', () => {
    const debt: DebtEntry = { from: 'src/core/gone.ts', to: 'src/diagrams/class/', retiredBy: 'T99' };
    const edges: ImportEdge[] = [{ from: 'src/core/other.ts', to: 'src/diagrams/state/x.ts' }];
    const stale = [debt].filter((d) => !edges.some((e) => matchesEntry(d, e)));
    expect(stale).toEqual([debt]);
  });

  it('reproduces assertion (c): an empty why is reported', () => {
    const allowlist: readonly AllowlistEntry[] = [{ from: 'src/diagrams/hcl/', to: 'src/diagrams/json/', why: '  ' }];
    const empty = allowlist.filter((a) => a.why.trim().length === 0);
    expect(empty).toEqual(allowlist);
  });
});
