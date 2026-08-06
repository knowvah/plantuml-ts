/**
 * SI1 T13 — the cucadiagram base must stay import-clean of the diagram
 * engines: `src/core/{plasma,abel,cucadiagram}` and the decoration link
 * types are the SHARED model (planning/cucadiagram-contract.md); an import
 * from `src/diagrams/**` would invert the dependency the Track SI-1
 * contract exists to guarantee (engines consume the base, never the
 * reverse). Guard is textual over static imports — the same shape as this
 * directory's other architecture guards.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const BASE_DIRS = [
  'src/core/plasma',
  'src/core/abel',
  'src/core/cucadiagram',
  'src/core/decoration',
];

function tsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...tsFiles(p));
    else if (name.endsWith('.ts')) out.push(p);
  }
  return out;
}

describe('cucadiagram base import hygiene (SI1 T13)', () => {
  it('never imports from src/diagrams/**', () => {
    const offenders: string[] = [];
    for (const dir of BASE_DIRS) {
      for (const file of tsFiles(join(REPO, dir))) {
        const src = readFileSync(file, 'utf8');
        if (/from\s+'[^']*\/diagrams\//.test(src)) offenders.push(file.slice(REPO.length + 1));
      }
    }
    expect(offenders).toEqual([]);
  });
});
