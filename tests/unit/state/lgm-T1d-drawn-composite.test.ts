/**
 * lgm-T1d: a border-point composite is DRAWN at the rectangle after L + 2
 * `Cluster#manageEntryExitPoint` calls (L projecting lines in the solve loop,
 * then the ink and render `drawU` passes) -- `Cluster.java:344-345,430`,
 * `SvekResult.java:130-136`. `ensureMinWidth` is not idempotent, so a titled
 * composite's x depends on that count. Fixtures sit beside their jar render
 * (`scripts/oracle-render.sh`, deterministic text).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { compositeOutlines } from '../../helpers/composite-outlines.js';
import { linkEndsById, mismatchedLinks } from '../../helpers/link-endpoints.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const DIRS = ['lgm-T1b', 'lgm-T1d'].map((d) => join(ROOT, 'tests/fixtures', d));
const CASES = DIRS.flatMap((dir) =>
  readdirSync(dir)
    .filter((f) => f.startsWith('state-') && f.endsWith('.puml'))
    .map((f) => ({ name: f.slice(0, -'.puml'.length), dir })),
);
const render = (src: string): string => renderSync(src, { measurer: new DeterministicMeasurer() });

describe('lgm-T1d -- drawn border-point composite rectangle', () => {
  it('covers both fixture directories', () => {
    expect(CASES.length).toBe(8);
  });

  it.each(CASES)('$name: composite outlines equal the jar’s', ({ name, dir }) => {
    const ours = render(readFileSync(join(dir, `${name}.puml`), 'utf8'));
    const jar = readFileSync(join(dir, `${name}.svg`), 'utf8');
    expect(compositeOutlines(jar).length).toBeGreaterThan(0);
    expect(compositeOutlines(ours)).toEqual(compositeOutlines(jar));
    expect(mismatchedLinks(ours, jar)).toEqual([]);
    expect(linkEndsById(jar).size).toBeGreaterThan(0);
  });

  it('pesita-10-dene726: AA is drawn at x=620.906 like the jar', () => {
    const dir = join(ROOT, 'test-results/dot-cache/state/pesita-10-dene726');
    const ours = render(readFileSync(join(dir, 'in.puml'), 'utf8'));
    const jar = readFileSync(join(dir, 'in.svg'), 'utf8');
    expect(compositeOutlines(jar)).toContain('620.906,148,126,104.72');
    expect(compositeOutlines(ours)).toContain('620.906,148,126,104.72');
  });
});
