/**
 * codd-T2 M2 -- `skinparam packagestyle <v>` draws the `package` group as that style's USymbol, against the jar.
 * Fixtures: `tests/fixtures/description-packagestyle/<style>.{puml,svg}`, the svg rendered by
 * `scripts/oracle-render.sh` (a titled `package` around `[A]`, plus `[B] --> [A]`).
 *
 * `CommandPackageWithUSymbol.java:194` + `USymbols.java:103-104` resolve the symbol; `PackageStyle.java:69-92`
 * has none for agent/storage/component1/component2/artifact, and `Cluster.java:376` swallows the resulting
 * `UnsupportedOperationException`, so those draw no cluster at all.
 */
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'fixtures', 'description-packagestyle');
const measurer = new DeterministicMeasurer();

function fixture(name: string): { puml: string; jar: string } {
  return {
    puml: readFileSync(join(FIXTURES, `${name}.puml`), 'utf8'),
    jar: readFileSync(join(FIXTURES, `${name}.svg`), 'utf8'),
  };
}

const DRAWN = ['folder', 'node', 'frame', 'cloud', 'database', 'card'];
const NOT_DRAWN = ['agent', 'storage', 'component1', 'component2', 'artifact'];

describe('skinparam packagestyle against the jar', () => {
  it.each(DRAWN)('%s renders as the jar does', (name) => {
    const { puml, jar } = fixture(name);
    const { pass, diffs } = compareSvg(renderSync(puml, { measurer }), jar, 'deterministic');
    expect(diffs).toEqual([]);
    expect(pass).toBe(true);
  });

  it.each(NOT_DRAWN)('%s draws no cluster, like the jar (Cluster.java:376)', (name) => {
    const { puml, jar } = fixture(name);
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const ours = renderSync(puml, { measurer });
    logged.mockRestore();
    expect(ours).not.toContain('class="cluster"');
    expect(jar).not.toContain('class="cluster"');
    const { diffs } = compareSvg(ours, jar, 'deterministic');
    expect(diffs).toEqual([]);
  });

  it('rect draws the jar box (title x is the separate ClusterHeader alignment gap)', () => {
    const { puml, jar } = fixture('rect');
    const box = (svg: string): string | undefined => /<g class="cluster"[^>]*>\s*(<rect [^>]*>)/.exec(svg)?.[1];
    expect(box(renderSync(puml, { measurer }))).toBe(box(jar));
    expect(box(jar)).toContain('width="82" height="93"');
  });
});
