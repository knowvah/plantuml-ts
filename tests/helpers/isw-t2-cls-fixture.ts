/**
 * isw-T2-cls: compare our render of an authored fixture to the JAR's own svg
 * (both under tests/fixtures/isw-T2-cls/, svg rendered by
 * scripts/oracle-render.sh under oracle seam #4 v2).
 */
import { readFileSync } from 'node:fs';
import { renderSync } from '../../src/index.js';
import { DeterministicMeasurer } from '../../src/core/measurer-deterministic.js';
import { compareSvg } from '../oracle/svg-conformance/compare.js';

const DIR = new URL('../fixtures/isw-T2-cls/', import.meta.url);

/** The first `limit` compareSvg diffs of `<name>.puml` (ours) vs `<name>.svg` (jar). */
export function diffsAgainstJar(name: string, limit = 5): string[] {
  const puml = readFileSync(new URL(`${name}.puml`, DIR), 'utf8');
  const jar = readFileSync(new URL(`${name}.svg`, DIR), 'utf8');
  const ours = renderSync(puml, { measurer: new DeterministicMeasurer() });
  return compareSvg(ours, jar, 'deterministic')
    .diffs.slice(0, limit)
    .map((d) => JSON.stringify(d));
}
