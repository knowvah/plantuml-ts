/**
 * lgm-T1b (A3): a cluster-anchored transition clips against the rectangle
 * `Cluster#manageEntryExitPoint` left, in the jar's line order.
 *
 * `SvekEdge.java:660-663` runs `projectionCluster.manageEntryExitPoint` before
 * `:671-672`'s `simulateCompound`, and `Cluster.java:430` reassigns the shared
 * `rectangleArea` — so the Nth line through a border-point composite clips
 * against the result of N calls. Each fixture under `tests/fixtures/lgm-T1b/`
 * sits beside its jar render (`scripts/oracle-render.sh`, deterministic text);
 * every link end of ours must equal the jar's.
 *
 * `state-titled-ensure-min-width` is the case where the order is observable
 * in the output: its title is wider than the frontier box, so each call moves
 * the box by half the remaining shortfall (graphviz cluster x -33.98; after
 * the three lines' calls minX is 12.52, 24.77, 30.895).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { linkEndsById, mismatchedLinks } from '../../helpers/link-endpoints.js';
import { clipLinesInSolveOrder, type SolveLine } from '../../../src/diagrams/state/state-transition-clip.js';
import { clipSplineStart } from '../../../src/core/spline-clip.js';
import { zaentId } from '../../../src/diagrams/state/state-composite-classify.js';
import type { DotLayoutResult } from '../../../src/core/graph-layout.js';
import type { PassAccumulator } from '../../../src/diagrams/state/state-composite-pass-types.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const FIXTURES = join(ROOT, 'tests/fixtures/lgm-T1b');
const CASES = readdirSync(FIXTURES)
  .filter((f) => f.startsWith('state-') && f.endsWith('.puml'))
  .map((f) => f.slice(0, -'.puml'.length))
  .sort();

describe('lgm-T1b — state composite-anchored clip against the jar', () => {
  it('has the fixtures it names', () => {
    expect(CASES).toEqual([
      'state-entrypoint-lines',
      'state-exitpoint-three-lines',
      'state-lr',
      'state-nested',
      'state-titled-ensure-min-width',
      'state-two-port-composites',
    ]);
  });

  it.each(CASES)('%s: every link end equals the jar’s', (name) => {
    const ours = renderSync(readFileSync(join(FIXTURES, `${name}.puml`), 'utf8'), {
      measurer: new DeterministicMeasurer(),
    });
    const jar = readFileSync(join(FIXTURES, `${name}.svg`), 'utf8');
    expect(linkEndsById(jar).size).toBeGreaterThan(3);
    expect(mismatchedLinks(ours, jar)).toEqual([]);
  });

  it('pesita-10-dene726 (AA, three lines through an exit-point composite): every link end equals the jar’s', () => {
    const dir = join(ROOT, 'test-results/dot-cache/state/pesita-10-dene726');
    const ours = renderSync(readFileSync(join(dir, 'in.puml'), 'utf8'), { measurer: new WidthTableMeasurer() });
    const jar = readFileSync(join(dir, 'in.svg'), 'utf8');
    expect(linkEndsById(jar).size).toBe(16);
    expect(mismatchedLinks(ours, jar)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// clipLinesInSolveOrder: the Bibliotekon#allLines() order, not the array order
// ---------------------------------------------------------------------------

/** Composite `A` (graphviz box x 0..200, y 0..200) with an inside node
 *  (40..60 square) and an exit point whose centre is (10, 50). Its title is
 *  300 wide, so `ensureMinWidth` shifts the box on every
 *  `manageEntryExitPoint` call (FrontierCalculator.java:154-167). */
const ACC: PassAccumulator = {
  nodes: [],
  edges: [],
  edgeSources: [],
  clusters: [{ id: 'cluster0', nodeIds: ['n', 'p', zaentId('A')] }],
  borderPointClusters: [
    {
      stateId: 'A',
      clusterId: 'cluster0',
      portNodeIds: ['p'],
      titleAndAttributeWidth: 300,
      titleAndAttributeHeight: 20,
      rankdir: 'TB',
    },
  ],
};
const RESULT: DotLayoutResult = {
  nodes: [
    { id: 'n', x: 40, y: 40, width: 20, height: 20 },
    { id: 'p', x: 5, y: 45, width: 10, height: 10 },
  ],
  edges: [],
  width: 400,
  height: 400,
  clusters: [{ id: 'cluster0', x: 0, y: 0, width: 200, height: 200 }],
};
/** Leaves the composite through its right side, which `ensureMinWidth` moves:
 *  the box's maxX is 200 (graphviz), 310 after the first call, 315 after the
 *  second (FrontierCalculator.java:154-167, derived in the comment above). */
const FROM_A_SPLINE = [
  { x: 100, y: 100 },
  { x: 150, y: 100 },
  { x: 250, y: 100 },
  { x: 400, y: 100 },
];
const lineOf = (key: string, creationIndex: number): SolveLine => ({
  key,
  from: zaentId('A'),
  to: 'X',
  points: FROM_A_SPLINE.map((p) => ({ ...p })),
  creationIndex,
});

describe('clipLinesInSolveOrder (DotStringFactory.java:465-466)', () => {
  it('clips each line against the rectangle the lines before it left', () => {
    const clipped = clipLinesInSolveOrder(ACC, RESULT, [lineOf('first', 0), lineOf('second', 1)]);
    // Same spline, same cluster: only the shared rectangle differs between the two calls.
    expect(clipped.get('first')).not.toEqual(clipped.get('second'));
    const exitX = (key: string): number => clipped.get(key)![0]!.x;
    // The clip lands within a bezier subdivision of the box edge (spline-clip.ts: 8 midpoint splits).
    expect(exitX('first')).toBeGreaterThan(310);
    expect(exitX('first')).toBeLessThan(311);
    expect(exitX('second')).toBeGreaterThan(315);
    expect(exitX('second')).toBeLessThan(317);
  });

  it('orders by creation index, not by position in the array', () => {
    const forward = clipLinesInSolveOrder(ACC, RESULT, [lineOf('first', 0), lineOf('second', 1)]);
    const backward = clipLinesInSolveOrder(ACC, RESULT, [lineOf('second', 1), lineOf('first', 0)]);
    expect(backward.get('first')).toEqual(forward.get('first'));
    expect(backward.get('second')).toEqual(forward.get('second'));
  });

  it('keeps a composite without border points on its graphviz rectangle for every line', () => {
    const plain: PassAccumulator = { ...ACC, borderPointClusters: [] };
    const clipped = clipLinesInSolveOrder(plain, RESULT, [lineOf('first', 0), lineOf('second', 1)]);
    expect(clipped.get('second')).toEqual(clipped.get('first'));
    expect(clipped.get('first')).toEqual(clipSplineStart(FROM_A_SPLINE, { x: 0, y: 0, width: 200, height: 200 }));
  });
});
