/**
 * cdd4-T6 (E3-10b): white-box tests for the layout builder's port of
 * `ClusterDotString`'s `hasPort()` branch (`svek/ClusterDotString.java:
 * 117-184,254-287`) and `Link#getEntityPort`'s `:P` (`abel/Link.java:227-231`).
 * The shapes asserted are the jar's own `sokevu-87-toce485` `svek-1.dot`:
 *
 *     subgraph cluster6 {style=solid;color=..;labeljust="c";{rank=source;sh0010;sh0011;sh0012;}
 *     ...
 *     sh0010->sh0011->sh0012 [arrowhead=none];
 *     sh0012->zaent0002;
 *     subgraph cluster6ee {label="";
 *     zaent0002 [shape=rect,width=.01,height=.01,label=<<TABLE ... WIDTH="67" HEIGHT="14">...>];
 *     }}
 *     sh0013:h->sh0010:P[...];
 */
import { describe, it, expect } from 'vitest';
import { createGraph } from '@knowvah/dot-engine';
import type { Graph } from '@knowvah/dot-engine';

import { addClusters, addEdges, addNodes } from '../../../src/core/graph-layout-build.js';
import { isHasPortCluster } from '../../../src/core/graph-layout-build-portcluster.js';
import type { DotInputGraph, DotInputNode } from '../../../src/core/graph-layout.js';

const ANCHOR: DotInputNode = {
  id: 'za',
  width: 1,
  height: 1,
  shape: 'rect',
  titleLabelWidth: 67.9,
  titleLabelHeight: 14,
};

function port(id: string): DotInputNode {
  return { id, width: 12, height: 12, shape: 'rect', isPort: true, attributes: { rank: 'source' } };
}

function sokevuShape(extra: Partial<DotInputGraph> = {}): DotInputGraph {
  return {
    nodes: [
      { id: 'i', width: 18, height: 18 },
      port('p'),
      port('q'),
      port('r'),
      ANCHOR,
      { id: 'm', width: 30, height: 20 },
    ],
    edges: [
      { id: 'e1', from: 'i', to: 'p' },
      { id: 'e2', from: 'r', to: 'q' },
    ],
    clusters: [
      {
        id: 'n',
        label: 'n',
        nodeIds: ['p', 'q', 'r', 'm', 'za'],
        portRanks: [{ rank: 'source', nodeIds: ['p', 'q', 'r'] }],
        portAnchorId: 'za',
      },
    ],
    ...extra,
  };
}

function build(input: DotInputGraph): Graph {
  const b = createGraph({ directed: true });
  addNodes(b, input);
  addClusters(b, input);
  addEdges(b, input);
  return b.graph;
}

const edgePairs = (g: Graph): string[] => g.edges.map((e) => `${e.tail.name}->${e.head.name}`);

describe('addClusters -- hasPort() cluster (ClusterDotString.java:117-184)', () => {
  it('writes no label on the cluster itself (:121-141 moves it onto empty())', () => {
    const main = build(sokevuShape()).subgraphs.get('cluster0')!;
    expect(main.attrs.has('label')).toBe(false);
  });

  it('opens the rank group, then a no-label `ee` cluster, directly under main (:136-139)', () => {
    const main = build(sokevuShape()).subgraphs.get('cluster0')!;
    const names = [...main.subgraphs.keys()];
    expect(names).toEqual(['__portrank_0', 'cluster0ee']);
    expect(main.subgraphs.get('__portrank_0')!.attrs.get('rank')).toBe('source');
    expect(main.subgraphs.get('cluster0ee')!.attrs.has('label')).toBe(false);
  });

  it('keeps ports in main and puts the anchor and NORMAL members in ee (:174)', () => {
    const main = build(sokevuShape()).subgraphs.get('cluster0')!;
    const ee = main.subgraphs.get('cluster0ee')!;
    expect([...main.subgraphs.get('__portrank_0')!.nodes.keys()]).toEqual(['p', 'q', 'r']);
    expect([...ee.nodes.keys()].sort()).toEqual(['m', 'za']);
  });

  it('chains consecutive rank entries with arrowhead=none, then the last to the anchor, bare (:267-284)', () => {
    const g = build(sokevuShape());
    const pairs = edgePairs(g);
    // printRanks runs inside addClusters, before the diagram's own edges.
    expect(pairs.slice(0, 3)).toEqual(['p->q', 'q->r', 'r->za']);
    expect(g.edges[0]!.attrs.get('arrowhead')).toBe('none');
    expect(g.edges[1]!.attrs.get('arrowhead')).toBe('none');
    expect(g.edges[2]!.attrs.has('arrowhead')).toBe(false);
  });

  it('a single-entry rank writes no chain edge, only the link to the anchor', () => {
    const input = sokevuShape();
    input.clusters![0]!.portRanks = [{ rank: 'source', nodeIds: ['p'] }];
    expect(edgePairs(build(input)).filter((p) => p.endsWith('->za'))).toEqual(['p->za']);
    expect(edgePairs(build(input))).not.toContain('p->q');
  });

  it('nests a child cluster inside the parent ee (printCluster2 runs after ee opens, :176)', () => {
    const input = sokevuShape();
    input.nodes.push({ id: 'c1', width: 10, height: 10 });
    input.clusters!.push({ id: 'child', nodeIds: ['c1'], parentId: 'n' });
    const ee = build(input).subgraphs.get('cluster0')!.subgraphs.get('cluster0ee')!;
    expect([...ee.subgraphs.keys()]).toEqual(['cluster1']);
  });

  it('without portAnchorId (kermor) keeps the prior bare rank group and flat membership', () => {
    const input = sokevuShape();
    delete input.clusters![0]!.portAnchorId;
    const g = build(input);
    const main = g.subgraphs.get('cluster0')!;
    expect([...main.subgraphs.keys()]).toEqual(['__portrank_0']);
    expect(main.attrs.get('label')).toBe('n');
    expect(edgePairs(g).some((p) => p.endsWith('->za'))).toBe(false);
  });
});

describe('isHasPortCluster -- the branch gate (ClusterDotString.java:228-234)', () => {
  it('needs rank entries, an anchor, and not the border-point family', () => {
    const base = sokevuShape().clusters![0]!;
    expect(isHasPortCluster(base)).toBe(true);
    const { portRanks: _unused, ...noRanks } = base;
    expect(isHasPortCluster(noRanks)).toBe(false);
    expect(isHasPortCluster({ ...base, portRanks: [] })).toBe(false);
    expect(isHasPortCluster({ ...base, portRanksLabelOnEe: true })).toBe(false);
  });

  it('an empty rank entry writes nothing (printRanks `if (entries.size() > 0)`, :256)', () => {
    const input = sokevuShape();
    input.clusters![0]!.portRanks = [
      { rank: 'source', nodeIds: [] },
      { rank: 'sink', nodeIds: ['p'] },
    ];
    const main = build(input).subgraphs.get('cluster0')!;
    const ranks = [...main.subgraphs.values()].filter((g) => g.name !== 'cluster0ee');
    expect(ranks.map((g) => g.attrs.get('rank'))).toEqual(['sink']);
  });
});

describe('addNodes -- the empty() anchor (ClusterDotString.java:178-181)', () => {
  it('is shape=rect .01x.01, NOT fixedsize, labelled with the truncated title table', () => {
    const n = build(sokevuShape()).nodes.get('za')!;
    expect(n.attrs.get('shape')).toBe('rect');
    expect(n.attrs.get('width')).toBe('.01');
    expect(n.attrs.get('height')).toBe('.01');
    expect(n.attrs.has('fixedsize')).toBe(false);
    expect(n.attrs.get('label')).toContain('FIXEDSIZE="TRUE" WIDTH="67" HEIGHT="14"');
  });
});

describe('addEdges -- :P on port ends (Link.java:227-231, EntityPort.forPort)', () => {
  it('sets headport=P on an edge into a port and tailport=P out of one', () => {
    const g = build(sokevuShape());
    const into = g.edges.find((e) => e.tail.name === 'i' && e.head.name === 'p')!;
    const between = g.edges.find((e) => e.tail.name === 'r' && e.head.name === 'q')!;
    expect(into.attrs.get('headport')).toBe('P');
    expect(into.attrs.has('tailport')).toBe(false);
    expect(between.attrs.get('tailport')).toBe('P');
    expect(between.attrs.get('headport')).toBe('P');
  });

  it('overrides a caller-supplied port on a port end (usePortP wins)', () => {
    const input = sokevuShape();
    input.edges[0]!.attributes = { headport: 'h' };
    const into = build(input).edges.find((e) => e.tail.name === 'i' && e.head.name === 'p')!;
    expect(into.attrs.get('headport')).toBe('P');
  });
});
