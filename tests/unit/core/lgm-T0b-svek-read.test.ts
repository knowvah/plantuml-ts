/**
 * lgm-T0b (A1): every dot-engine read mirrors the jar's `-Tsvg` parse.
 *
 * The jar never sees graphviz's doubles: `DotStringFactory#solve`
 * (`svek/DotStringFactory.java:377-437`) parses the 2-dp text `dot -Tsvg`
 * prints (`gvprintdouble`, `graphviz lib/gvc/gvdevice.c:513-528`). Each
 * fixture in `tests/fixtures/lgm-T0b/` sits beside its jar render
 * (`scripts/oracle-render.sh`, deterministic text); the two `tie-port-edges-*`
 * ones carry a graphviz edge control point that is an exact binary tie
 * (`508.125`-style, odd multiples of 1/8), where `%.02f` rounds half to even
 * and `toFixed(2)` does not.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { layoutGraph, setLayoutInputObserver, type DotInputGraph } from '../../../src/core/graph-layout.js';
import { compareSvg } from '../../oracle/svg-conformance/compare.js';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '../../fixtures/lgm-T0b');
const CASES = readdirSync(DIR)
  .filter((f) => f.endsWith('.puml'))
  .map((f) => f.slice(0, -'.puml'.length))
  .sort();
const TIE_CASES = CASES.filter((c) => c.startsWith('tie-'));

/** Two decimal places of rounding noise left by the origin shift (a subtraction of 2-dp values). */
const TWO_DP_NOISE = 1e-6;

function source(name: string): string {
  return readFileSync(join(DIR, `${name}.puml`), 'utf8');
}

function capturedGraph(name: string): DotInputGraph {
  const events: DotInputGraph[] = [];
  setLayoutInputObserver((e) => events.push(e.graph));
  try {
    renderSync(source(name), { measurer: new DeterministicMeasurer() });
  } finally {
    setLayoutInputObserver(undefined);
  }
  return events[events.length - 1]!;
}

function isTwoDp(v: number): boolean {
  return Math.abs(v * 100 - Math.round(v * 100)) < TWO_DP_NOISE;
}

describe('lgm-T0b — svek read against the jar', () => {
  it('has the fixtures it names', () => {
    expect(CASES).toEqual(['bipudo-23-xavu432', 'tie-port-edges-a', 'tie-port-edges-b', 'tie-port-edges-c']);
  });

  it.each(CASES)('%s renders with zero diffs against the jar', (name) => {
    const jar = readFileSync(join(DIR, `${name}.svg`), 'utf8');
    const ours = renderSync(source(name), { measurer: new DeterministicMeasurer() });
    expect(compareSvg(ours, jar, 'deterministic').diffs.length).toBe(0);
  });

  it.each(TIE_CASES)('%s: the svek read lands every control point on a 2-dp value, the exact read does not', (name) => {
    const graph = capturedGraph(name);
    const svek = layoutGraph(graph, { read: 'svek' }).edges.flatMap((e) => e.points);
    const exact = layoutGraph(graph, { read: 'exact' }).edges.flatMap((e) => e.points);
    expect(svek.length).toBe(exact.length);
    expect(svek.every((p) => isTwoDp(p.x) && isTwoDp(p.y))).toBe(true);
    expect(exact.some((p) => !isTwoDp(p.x) || !isTwoDp(p.y))).toBe(true);
  });
});
