/**
 * Every harness measures with `DeterministicMeasurer`.
 *
 * `DeterministicMeasurer` (`src/core/measurer-deterministic.ts`) is the
 * jar-deterministic metric the oracle uses; it may diverge from the raw
 * `WidthTableMeasurer` table port (U+0020 width). A harness that constructs
 * or imports `WidthTableMeasurer` directly would measure with a different
 * metric than the oracle. Only `src/core/` and the explicit allow-list below
 * (tests of the verbatim table port, and this guard) may reference it.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const SCANNED_ROOTS = ['scripts', 'tests', 'plans'];
const SCANNED_EXTENSIONS = ['.ts', '.mts', '.js', '.mjs', '.tsx'];
const SKIPPED_DIRS = new Set(['node_modules', '.git']);

/** Files that legitimately name `WidthTableMeasurer`, each with its reason. */
export const ALLOW_LIST: Readonly<Record<string, string>> = {
  'tests/unit/core/measurer-width-table.test.ts': 'tests the verbatim table port itself',
  'tests/architecture/isw-measurer.test.ts': 'this guard (synthetic offenders)',
};

const CONSTRUCTION = /\bnew\s+WidthTableMeasurer\b/;
const STATIC_IMPORT = /\bimport\s*(?:type\s*)?\{[^}]*\bWidthTableMeasurer\b[^}]*\}/;
const DYNAMIC_IMPORT = /\{[^}]*\bWidthTableMeasurer\b[^}]*\}\s*=\s*await\s+import\b/;

export interface ScannedFile {
  readonly path: string;
  readonly content: string;
}

/** True when `content` constructs or imports `WidthTableMeasurer`. */
export function usesWidthTableMeasurer(content: string): boolean {
  return CONSTRUCTION.test(content) || STATIC_IMPORT.test(content) || DYNAMIC_IMPORT.test(content);
}

/** Pure scanner: paths (repo-relative) of files that break the rule. */
export function findViolations(files: readonly ScannedFile[], allow: ReadonlySet<string>): string[] {
  return files
    .filter((f) => !f.path.startsWith('src/core/') && !allow.has(f.path))
    .filter((f) => usesWidthTableMeasurer(f.content))
    .map((f) => f.path);
}

function collect(dir: string, out: string[]): void {
  for (const name of readdirSync(dir)) {
    if (SKIPPED_DIRS.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) collect(p, out);
    else if (SCANNED_EXTENSIONS.some((e) => name.endsWith(e))) out.push(p);
  }
}

function loadRepoFiles(): ScannedFile[] {
  const paths: string[] = [];
  for (const root of SCANNED_ROOTS) collect(join(REPO, root), paths);
  return paths.map((p) => ({ path: p.slice(REPO.length + 1), content: readFileSync(p, 'utf-8') }));
}

describe('isw-measurer: harnesses use DeterministicMeasurer', () => {
  const allow = new Set(Object.keys(ALLOW_LIST));

  it('flags a scripts/ file that constructs WidthTableMeasurer', () => {
    const files = [{ path: 'scripts/x.ts', content: 'const m = new WidthTableMeasurer();' }];
    expect(findViolations(files, allow)).toEqual(['scripts/x.ts']);
  });

  it('flags static and dynamic imports', () => {
    const files = [
      { path: 'tests/a.test.ts', content: "import { WidthTableMeasurer } from '../src/core/measurer.js';" },
      { path: 'plans/p/b.mts', content: "const { WidthTableMeasurer } = await import('x/measurer.ts');" },
    ];
    expect(findViolations(files, allow)).toEqual(['tests/a.test.ts', 'plans/p/b.mts']);
  });

  it('accepts DeterministicMeasurer, prose mentions, src/core, and the allow-list', () => {
    const offender = 'const m = new WidthTableMeasurer();';
    const files = [
      { path: 'scripts/ok.ts', content: 'const m = new DeterministicMeasurer(); // wraps WidthTableMeasurer' },
      { path: 'src/core/measurer-x.ts', content: offender },
      { path: 'tests/unit/core/measurer-width-table.test.ts', content: offender },
    ];
    expect(findViolations(files, allow)).toEqual([]);
  });

  it('no file under scripts/, tests/, plans/ uses WidthTableMeasurer outside the allow-list', () => {
    expect(findViolations(loadRepoFiles(), allow)).toEqual([]);
  });
});
