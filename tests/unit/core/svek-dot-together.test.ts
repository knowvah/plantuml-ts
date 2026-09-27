/**
 * cdd3-T18 (E1-6 = B-2): `together { }` as svek prints it -- an unlabelled
 * `subgraph <clusterId>t<k> {` (`Cluster#printTogether`,
 * `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/Cluster.java
 * :528-547`) placed by `Cluster#printCluster2` (`:550-583`): nodes without a
 * together first, then the togethers, then child clusters without one.
 *
 * The expected statement orders are the jar's own `svek-1.dot` for
 * `foxosa-41-bono202`, `nadono-22-gidu983` and `voluca-76-fosu617`
 * (`test-results/dot-cache/class/<slug>/svek-1.dot`), with ids reduced to
 * the class names.
 */
import { describe, it, expect } from 'vitest';

import type { DotInputCluster, DotInputGraph, DotInputNode } from '../../../src/core/graph-layout.js';
import { layoutGraph } from '../../../src/core/graph-layout.js';
import { firstEncounterOrder } from '../../../src/core/svek-dot-order.js';
import { toSvekDot } from '../../../src/core/svek-dot-emit.js';
import { togetherClusters, ROOT_TOGETHER_PREFIX } from '../../../src/core/svek-dot-together.js';

const node = (id: string, together?: string): DotInputNode => ({
  id,
  width: 40,
  height: 30,
  ...(together !== undefined ? { together } : {}),
});

/** With no real cluster, `assignSequence` gives root leaves `sh0006`
 *  onwards in `input.nodes` order (the root cluster reserves 2..5,
 *  `Cluster.java:162-165`). */
const FIRST_LEAF_SH = 6;
const idOfSh =
  (input: DotInputGraph) =>
  (sh: string): string =>
    input.nodes[Number(sh.slice(2)) - FIRST_LEAF_SH]!.id;

/** The DOT's structural statements: `{name`, `}`, and member node ids. */
function structure(dot: string, idOf: (sh: string) => string): string[] {
  const out: string[] = [];
  for (const line of dot.split('\n')) {
    const sub = /^subgraph (\S+) \{/.exec(line);
    if (sub !== null) out.push(`{${sub[1]}`);
    const sh = /^(sh\d{4}) \[/.exec(line);
    if (sh !== null) out.push(idOf(sh[1]!));
    if (line === '}') out.push('}');
  }
  return out;
}

/** foxosa-41-bono202: `class A`, `together {tog1000..1002}`, `class B`,
 *  `together {tog2000..2002}`. */
const FOXOSA: DotInputGraph = {
  nodes: [
    node('A'),
    node('tog1000', 't0'),
    node('tog1001', 't0'),
    node('tog1002', 't0'),
    node('B'),
    node('tog2000', 't1'),
    node('tog2001', 't1'),
    node('tog2002', 't1'),
  ],
  edges: [],
  togethers: [{ id: 't0' }, { id: 't1' }],
};

describe('svek-dot-together — Cluster#printCluster2/printTogether (Cluster.java:528-583)', () => {
  it('root: non-together nodes first, then one bare subgraph per together (foxosa jar DOT)', () => {
    const dot = toSvekDot(FOXOSA);
    expect(structure(dot, idOfSh(FOXOSA))).toEqual([
      'A',
      'B',
      `{${ROOT_TOGETHER_PREFIX}t0`,
      'tog1000',
      'tog1001',
      'tog1002',
      '}',
      `{${ROOT_TOGETHER_PREFIX}t1`,
      'tog2000',
      'tog2001',
      'tog2002',
      '}',
      '}',
    ]);
    // Cluster.java:531 -- `"subgraph " + getClusterId() + "t" + togetherCounter + " {"`: nothing else on the line.
    expect(dot).toContain(`subgraph ${ROOT_TOGETHER_PREFIX}t0 {\n`);
  });

  it('node creation order follows the printed order (A, B before the together members)', () => {
    expect(firstEncounterOrder(FOXOSA).map((n) => n.id)).toEqual([
      'A',
      'B',
      'tog1000',
      'tog1001',
      'tog1002',
      'tog2000',
      'tog2001',
      'tog2002',
    ]);
  });

  it('inside a cluster: the non-together node precedes `<clusterId>t0` (nadono jar DOT)', () => {
    const cluster: DotInputCluster = { id: 'cluster0', nodeIds: ['BadPix', 'RoleBadPix', 'Base'] };
    const out = togetherClusters({
      nodes: [node('BadPix', 't0'), node('RoleBadPix', 't0'), node('Base')],
      edges: [],
      clusters: [cluster],
      togethers: [{ id: 't0' }],
    });
    expect(out).toEqual([
      { id: 'cluster0', nodeIds: ['Base'] },
      { id: 'cluster0t0', nodeIds: ['BadPix', 'RoleBadPix'], parentId: 'cluster0', isTogether: true },
    ]);
  });

  it('a group created in a together nests inside its subgraph (voluca jar DOT, Cluster.java:536-538)', () => {
    const out = togetherClusters({
      nodes: [node('A'), node('t1a', 't1'), node('pp1')],
      edges: [],
      clusters: [{ id: 'cluster0', nodeIds: ['pp1'], together: 't1' }],
      togethers: [{ id: 't1' }],
    });
    expect(out.map((c) => [c.id, c.parentId, c.nodeIds])).toEqual([
      [`${ROOT_TOGETHER_PREFIX}t0`, undefined, ['t1a']],
      ['cluster0', `${ROOT_TOGETHER_PREFIX}t0`, ['pp1']],
    ]);
  });

  it('an inverted-edge tail stays out of the together (printCluster1 declared it, Cluster.java:218-238)', () => {
    const out = togetherClusters({
      nodes: [node('X', 't0'), node('Y', 't0'), node('Z')],
      edges: [{ id: 'e0', from: 'X', to: 'Z', inverted: true }],
      togethers: [{ id: 't0' }],
    });
    expect(out).toEqual([{ id: `${ROOT_TOGETHER_PREFIX}t0`, nodeIds: ['Y'], isTogether: true }]);
  });

  it('nested togethers: the counter moves after the nested call (Cluster.java:531,545)', () => {
    const out = togetherClusters({
      nodes: [node('a', 'outer'), node('b', 'inner'), node('c', 'next')],
      edges: [],
      togethers: [{ id: 'outer' }, { id: 'inner', parentId: 'outer' }, { id: 'next' }],
    });
    const p = ROOT_TOGETHER_PREFIX;
    expect(out.map((c) => [c.id, c.parentId, c.nodeIds])).toEqual([
      [`${p}t0`, undefined, ['a']],
      // `next` prints after `outer` (t0, its nested one also t0) closed at 2.
      [`${p}t2`, undefined, ['c']],
      // the jar repeats `t0` for the nested one; here the id needs a suffix.
      [`${p}t0n1`, `${p}t0`, ['b']],
    ]);
  });

  it('kermor prints no together (printCluster3_forKermor, Cluster.java:595-609)', () => {
    const clusters: DotInputCluster[] = [{ id: 'cluster0', nodeIds: ['A'] }];
    expect(togetherClusters({ ...FOXOSA, clusters, kermor: true })).toBe(clusters);
  });

  it('the layout builder nests the members but reports no cluster for a together', () => {
    const result = layoutGraph(FOXOSA);
    expect(result.clusters).toBeUndefined();
    expect(result.nodes.map((n) => n.id).sort()).toEqual(FOXOSA.nodes.map((n) => n.id).sort());
  });
});
