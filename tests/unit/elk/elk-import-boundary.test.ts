/**
 * cdd8 D1 as a fitness function: `src/core/elk/load-elk.ts` is the ONLY module
 * under `src/` that names elkjs, and it reaches it only through a dynamic
 * `import()`. The worker is 1.6 MB; a static import anywhere would put it in
 * the core bundle for every diagram type.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const SRC = join(REPO, 'src');
const ELKJS_SPECIFIER = /(?:from\s*|import\s*\(\s*|require\s*\(\s*)['"]elkjs(?:\/[^'"]*)?['"]/g;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return name.endsWith('.ts') ? [path] : [];
  });
}

/** Comments stripped first, so a doc comment quoting an import cannot forge an edge. */
function withoutComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

describe('elkjs import boundary (cdd8 D1)', () => {
  const importers = sourceFiles(SRC)
    .map((path) => ({
      path: relative(REPO, path).split(sep).join('/'),
      text: withoutComments(readFileSync(path, 'utf8')),
    }))
    .filter(({ text }) => text.match(ELKJS_SPECIFIER) !== null);

  it('has exactly one importer of elkjs under src/', () => {
    expect(importers.map((i) => i.path)).toEqual(['src/core/elk/load-elk.ts']);
  });

  it('reaches elkjs only through a dynamic import() of the worker', () => {
    const matches = importers.flatMap(({ text }) => [...text.matchAll(ELKJS_SPECIFIER)].map((m) => m[0]));
    expect(matches).toEqual(["import('elkjs/lib/elk-worker.min.js'"]);
  });
});
