/**
 * Unit tests for the structural DOT comparator (mission dot-oracle-sync D1).
 *
 * Each new/tightened check (rankdir, nodesep, ranksep, medianSizeDeltaIn) is
 * exercised in isolation via small hand-written svek DOT strings, flipping a
 * single perturbation at a time so a regression pinpoints exactly which check
 * broke. One existing-check regression (minlen) is included as a control to
 * confirm the bar didn't get *looser* while being tightened.
 */
import { describe, it, expect } from 'vitest';
import { parseSvekDot, compareStructural, dotInputToStructural } from './svek-dot.js';
import type { DotInputGraph } from '../../src/core/graph-layout.js';

/** Minimal two-node, one-edge svek DOT, with overridable graph attrs. */
function dot(opts: {
  rankdir?: string;
  nodesep?: number;
  ranksep?: number;
  minlen?: number;
  /** Raw `splines=...;forcelabels=true;` line, verbatim (mirrors the jar's
   *  single-line emission for the ortho arm — see `dot-splines.ts`). */
  splinesLine?: string;
}): string {
  const lines = ['digraph unix {'];
  if (opts.rankdir !== undefined) lines.push(`rankdir=${opts.rankdir};`);
  if (opts.nodesep !== undefined) lines.push(`nodesep=${opts.nodesep.toFixed(6)};`);
  if (opts.ranksep !== undefined) lines.push(`ranksep=${opts.ranksep.toFixed(6)};`);
  if (opts.splinesLine !== undefined) lines.push(opts.splinesLine);
  const minlen = opts.minlen ?? 1;
  lines.push(`sh0007->sh0006[arrowtail=none,arrowhead=none,minlen=${minlen},color="#000008"];`);
  lines.push('sh0006 [shape=rect,label="",width=2.141873,height=0.985786,color="#000006"];');
  lines.push('sh0007 [shape=rect,label="",width=0.901204,height=1.402452,color="#000007"];');
  lines.push('}');
  return lines.join('\n');
}

describe('compareStructural — rankdir/nodesep/ranksep parity bar (T1)', () => {
  it('identical DOT on both sides: every check true, structurallyEqual true', () => {
    const both = dot({ nodesep: 0.486111, ranksep: 0.833333, minlen: 0 });
    const diff = compareStructural(parseSvekDot(both), parseSvekDot(both));

    expect(diff.rankdirOk).toBe(true);
    expect(diff.nodesepOk).toBe(true);
    expect(diff.ranksepOk).toBe(true);
    expect(diff.nodeCountOk).toBe(true);
    expect(diff.edgeCountOk).toBe(true);
    expect(diff.degreeOk).toBe(true);
    expect(diff.minlenOk).toBe(true);
    expect(diff.shapeOk).toBe(true);
    expect(diff.labelOk).toBe(true);
    expect(diff.clusterOk).toBe(true);
    expect(diff.structurallyEqual).toBe(true);
    expect(diff.maxSizeDeltaIn).toBe(0);
    expect(diff.medianSizeDeltaIn).toBe(0);
  });

  it('oracle has no rankdir, candidate emits rankdir=LR: rankdirOk false (babafi-51)', () => {
    const oracle = parseSvekDot(dot({ nodesep: 0.486111, ranksep: 0.833333, minlen: 0 }));
    const candidate = parseSvekDot(dot({ rankdir: 'LR', nodesep: 0.486111, ranksep: 0.833333, minlen: 0 }));
    const diff = compareStructural(oracle, candidate);

    expect(diff.rankdirOk).toBe(false);
    expect(diff.structurallyEqual).toBe(false);
    // All other checks still pass — this proves the failure is isolated to rankdir.
    expect(diff.nodeCountOk).toBe(true);
    expect(diff.edgeCountOk).toBe(true);
    expect(diff.degreeOk).toBe(true);
    expect(diff.minlenOk).toBe(true);
    expect(diff.shapeOk).toBe(true);
    expect(diff.labelOk).toBe(true);
    expect(diff.clusterOk).toBe(true);
    expect(diff.nodesepOk).toBe(true);
    expect(diff.ranksepOk).toBe(true);
  });

  it('both sides emit the same rankdir: rankdirOk true', () => {
    const oracle = parseSvekDot(dot({ rankdir: 'LR', minlen: 0 }));
    const candidate = parseSvekDot(dot({ rankdir: 'LR', minlen: 0 }));
    expect(compareStructural(oracle, candidate).rankdirOk).toBe(true);
  });

  it('nodesep 0.486111 vs 0.833333: nodesepOk false, structurallyEqual false', () => {
    const oracle = parseSvekDot(dot({ nodesep: 0.486111, minlen: 0 }));
    const candidate = parseSvekDot(dot({ nodesep: 0.833333, minlen: 0 }));
    const diff = compareStructural(oracle, candidate);

    expect(diff.nodesepOk).toBe(false);
    expect(diff.structurallyEqual).toBe(false);
    expect(diff.ranksepOk).toBe(true);
    expect(diff.rankdirOk).toBe(true);
  });

  it('ranksep off by 0.01: ranksepOk false, structurallyEqual false', () => {
    const oracle = parseSvekDot(dot({ ranksep: 0.833333, minlen: 0 }));
    const candidate = parseSvekDot(dot({ ranksep: 0.843333, minlen: 0 }));
    const diff = compareStructural(oracle, candidate);

    expect(diff.ranksepOk).toBe(false);
    expect(diff.structurallyEqual).toBe(false);
    expect(diff.nodesepOk).toBe(true);
    expect(diff.rankdirOk).toBe(true);
  });

  it('nodesep within epsilon (1e-7 apart): nodesepOk stays true', () => {
    const oracle = parseSvekDot(dot({ nodesep: 0.4861111, minlen: 0 }));
    const candidate = parseSvekDot(dot({ nodesep: 0.4861112, minlen: 0 }));
    expect(compareStructural(oracle, candidate).nodesepOk).toBe(true);
  });

  it('nodesep/ranksep both absent on both sides: ok, equal to absent==absent', () => {
    const oracle = parseSvekDot(dot({ minlen: 0 }));
    const candidate = parseSvekDot(dot({ minlen: 0 }));
    const diff = compareStructural(oracle, candidate);
    expect(diff.nodesepOk).toBe(true);
    expect(diff.ranksepOk).toBe(true);
  });

  it('nodesep present on one side only: nodesepOk false (absent vs present)', () => {
    const oracle = parseSvekDot(dot({ minlen: 0 }));
    const candidate = parseSvekDot(dot({ nodesep: 0.486111, minlen: 0 }));
    expect(compareStructural(oracle, candidate).nodesepOk).toBe(false);
  });

  it('existing-check regression control: minlen multiset mismatch still fails', () => {
    const oracle = parseSvekDot(dot({ minlen: 0 }));
    const candidate = parseSvekDot(dot({ minlen: 1 }));
    const diff = compareStructural(oracle, candidate);

    expect(diff.minlenOk).toBe(false);
    expect(diff.structurallyEqual).toBe(false);
    // Confirms tightening the bar did not loosen the pre-existing minlen check.
    expect(diff.rankdirOk).toBe(true);
    expect(diff.nodesepOk).toBe(true);
    expect(diff.ranksepOk).toBe(true);
  });
});

describe('compareStructural — medianSizeDeltaIn', () => {
  it('is 0 when both sides have identical node dimensions', () => {
    const both = dot({ minlen: 0 });
    const diff = compareStructural(parseSvekDot(both), parseSvekDot(both));
    expect(diff.medianSizeDeltaIn).toBe(0);
    expect(diff.maxSizeDeltaIn).toBe(0);
  });

  it('is the median of the paired, sorted per-index size deltas', () => {
    // Oracle sizes sorted: [0.9, 0.99, 2.14, 1.40] -> sorted [0.9,0.99,1.4,2.14]
    // Candidate: width/height both bumped by a fixed amount per node.
    const oracle = parseSvekDot(
      [
        'digraph unix {',
        'sh0007->sh0006[arrowtail=none,arrowhead=none,minlen=0,color="#000008"];',
        'sh0006 [shape=rect,label="",width=1.000000,height=2.000000,color="#000006"];',
        'sh0007 [shape=rect,label="",width=3.000000,height=4.000000,color="#000007"];',
        '}',
      ].join('\n'),
    );
    const candidate = parseSvekDot(
      [
        'digraph unix {',
        'sh0007->sh0006[arrowtail=none,arrowhead=none,minlen=0,color="#000008"];',
        'sh0006 [shape=rect,label="",width=1.100000,height=2.500000,color="#000006"];',
        'sh0007 [shape=rect,label="",width=3.300000,height=5.000000,color="#000007"];',
        '}',
      ].join('\n'),
    );
    // Oracle sorted sizes: [1,2,3,4]; candidate sorted: [1.1,2.5,3.3,5]
    // Per-index deltas: [0.1, 0.5, 0.3, 1.0] -> sorted [0.1,0.3,0.5,1.0]
    // Median of 4 values = (0.3+0.5)/2 = 0.4; max = 1.0
    const diff = compareStructural(oracle, candidate);
    expect(diff.maxSizeDeltaIn).toBeCloseTo(1.0, 6);
    expect(diff.medianSizeDeltaIn).toBeCloseTo(0.4, 6);
  });

  it('is 0 when either side has no nodes', () => {
    const empty = parseSvekDot('digraph unix {\n}');
    const withNodes = parseSvekDot(dot({ minlen: 0 }));
    const diff = compareStructural(empty, withNodes);
    expect(diff.medianSizeDeltaIn).toBe(0);
    expect(diff.maxSizeDeltaIn).toBe(0);
  });
});

describe('parseSvekDot — splines/forcelabels (linetype-ortho-routing T7)', () => {
  it('splines=ortho;forcelabels=true; parses to splines "ortho", forcelabels true', () => {
    const g = parseSvekDot(dot({ minlen: 0, splinesLine: 'splines=ortho;forcelabels=true;' }));
    expect(g.splines).toBe('ortho');
    expect(g.forcelabels).toBe(true);
  });

  it('no splines attribute parses to splines undefined, forcelabels false', () => {
    const g = parseSvekDot(dot({ minlen: 0 }));
    expect(g.splines).toBeUndefined();
    expect(g.forcelabels).toBe(false);
  });

  it('splines=polyline; parses to splines "polyline", forcelabels false', () => {
    const g = parseSvekDot(dot({ minlen: 0, splinesLine: 'splines=polyline;' }));
    expect(g.splines).toBe('polyline');
    expect(g.forcelabels).toBe(false);
  });
});

describe('compareStructural — splinesOk (linetype-ortho-routing D5)', () => {
  it('both sides ortho+forcelabels: splinesOk true, structurallyEqual true', () => {
    const both = dot({ minlen: 0, splinesLine: 'splines=ortho;forcelabels=true;' });
    const diff = compareStructural(parseSvekDot(both), parseSvekDot(both));
    expect(diff.splinesOk).toBe(true);
    expect(diff.structurallyEqual).toBe(true);
  });

  it('oracle ortho, candidate no splines: splinesOk false, structurallyEqual false', () => {
    const oracle = parseSvekDot(dot({ minlen: 0, splinesLine: 'splines=ortho;forcelabels=true;' }));
    const candidate = parseSvekDot(dot({ minlen: 0 }));
    const diff = compareStructural(oracle, candidate);

    expect(diff.splinesOk).toBe(false);
    expect(diff.structurallyEqual).toBe(false);
    // All other checks still pass — the failure is isolated to splines.
    expect(diff.nodeCountOk).toBe(true);
    expect(diff.edgeCountOk).toBe(true);
    expect(diff.degreeOk).toBe(true);
    expect(diff.minlenOk).toBe(true);
    expect(diff.shapeOk).toBe(true);
    expect(diff.labelOk).toBe(true);
    expect(diff.clusterOk).toBe(true);
    expect(diff.rankdirOk).toBe(true);
    expect(diff.nodesepOk).toBe(true);
    expect(diff.ranksepOk).toBe(true);
  });

  it('oracle polyline, candidate ortho: splinesOk false (both present, values differ)', () => {
    const oracle = parseSvekDot(dot({ minlen: 0, splinesLine: 'splines=polyline;' }));
    const candidate = parseSvekDot(dot({ minlen: 0, splinesLine: 'splines=ortho;forcelabels=true;' }));
    expect(compareStructural(oracle, candidate).splinesOk).toBe(false);
  });

  it('both sides no splines: splinesOk true (absent==absent)', () => {
    const oracle = parseSvekDot(dot({ minlen: 0 }));
    const candidate = parseSvekDot(dot({ minlen: 0 }));
    expect(compareStructural(oracle, candidate).splinesOk).toBe(true);
  });
});

/**
 * D4 of description-svek-wrappers: `clusterOk` compared membership counts only,
 * so a graph with one plain-labelled cluster equalled the jar's `p0 > cluster >
 * p1` pair carrying a title TABLE. These pin the nesting check on jar DOT
 * copied from the corpus cache.
 */
const NO_WRAPPER_CHAIN = { a: false, p0: false, i: false, p1: false };

/** `unknown/bamami-10-lava790/svek-1.dot` (jar), cluster block verbatim. */
const BAMAMI_JAR_DOT = [
  'digraph unix {',
  'sh0010->sh0011[arrowtail=none,arrowhead=none,minlen=0,color="#00000C",label=<<TABLE BGCOLOR="#00000D" FIXEDSIZE="TRUE" WIDTH="42" HEIGHT="15"><TR><TD></TD></TR></TABLE>>];',
  'subgraph cluster6p0 {label="";subgraph cluster6 {style=solid;color="#000006";labeljust="c";label=<<TABLE BGCOLOR="#000007" FIXEDSIZE="TRUE" WIDTH="17" HEIGHT="23"><TR><TD></TD></TR></TABLE>>;',
  'subgraph cluster6p1 {label="";',
  'sh0010 [shape=rect,label="",width=0.250000,height=0.250000,color="#00000A"];',
  'sh0011 [shape=rect,label="",width=0.250000,height=0.250000,color="#00000B"];',
  '',
  '}}}',
  '',
  '}',
].join('\n');

/** `state/viroxo-69-fito663/svek-1.dot` (jar): a border-point cluster whose
 *  group is touched — `a`/`i` only, the title TABLE on `ee`, and a leading
 *  `{rank=sink;…}` group whose `}` must not close the cluster. */
const VIROXO_JAR_DOT = [
  'digraph unix {',
  'subgraph cluster6a {label="";subgraph cluster6 {style=solid;color="#000006";labeljust="c";{rank=sink;sh0010;}',
  'sh0010 [shape=rect,label="",width=0.166667,height=0.166667,color="#00000A"];',
  '',
  'subgraph cluster6ee {label=<<TABLE BGCOLOR="#000007" FIXEDSIZE="TRUE" WIDTH="42" HEIGHT="9"><TR><TD></TD></TR></TABLE>>;zaent0001 [shape=point,width=.01,label=""];subgraph cluster6i {label="";',
  'sh0011 [shape=circle,label="",width=0.277778,height=0.277778,color="#00000B"];',
  '',
  '}}}}',
  '}',
].join('\n');

const pairOfNodes = [
  { id: 'a', width: 18, height: 18 },
  { id: 'b', width: 18, height: 18 },
];

describe('compareStructural — cluster nesting and title TABLE (D4)', () => {
  it('parses bamami: cluster6 is p0/p1-wrapped with a 17x23 title table', () => {
    const [cluster, ...rest] = parseSvekDot(BAMAMI_JAR_DOT).clusters;
    expect(rest).toEqual([]);
    expect(cluster).toEqual({
      memberCount: 2,
      wrapperChain: { a: false, p0: true, i: false, p1: true },
      titleTable: { w: 17, h: 23 },
    });
  });

  it('does not take an edge label TABLE for a cluster title', () => {
    const dotText = [
      'digraph unix {',
      'subgraph cluster1 {style=solid;color="#000001";label="";',
      'sh0001 [shape=rect,label="",width=0.250000,height=0.250000,color="#000002"];',
      'sh0001->sh0002[minlen=1,label=<<TABLE BGCOLOR="#000003" FIXEDSIZE="TRUE" WIDTH="42" HEIGHT="15"><TR><TD></TD></TR></TABLE>>];',
      '}',
      '}',
    ].join('\n');
    expect(parseSvekDot(dotText).clusters[0]).toEqual({ memberCount: 1, wrapperChain: NO_WRAPPER_CHAIN });
  });

  it('parses a border-point cluster: a/i wrap, no p0/p1, title taken from ee', () => {
    const [cluster] = parseSvekDot(VIROXO_JAR_DOT).clusters;
    // memberCount 0 is the historical rank-group quirk, kept on purpose (see
    // parseClusters): the nesting fields must not depend on it.
    expect(cluster).toEqual({
      memberCount: 0,
      wrapperChain: { a: true, p0: false, i: true, p1: false },
      titleTable: { w: 42, h: 9 },
    });
  });

  it('takes the title from a port anchor node when the cluster has no label of its own', () => {
    const dotText = [
      'digraph unix {',
      'subgraph cluster3 {style=solid;color="#000003";labeljust="c";',
      'subgraph cluster3ee {label="";',
      'sh0001 [shape=rect,width=.01,height=.01,label=<<TABLE BGCOLOR="#000004" FIXEDSIZE="TRUE" WIDTH="69" HEIGHT="14"><TR><TD></TD></TR></TABLE>>];',
      '}}',
      '}',
    ].join('\n');
    expect(parseSvekDot(dotText).clusters[0]?.titleTable).toEqual({ w: 69, h: 14 });
  });

  it('fails clusterNestingOk for our pre-T3 shape: one cluster, plain label, no wrappers', () => {
    // What description emitted before its cluster header was ported: the jar
    // block above has p0/p1 and a title TABLE; ours has neither.
    const ours: DotInputGraph = {
      nodes: pairOfNodes,
      edges: [],
      clusters: [{ id: 'cluster6', label: 'C', nodeIds: ['a', 'b'] }],
    };
    const diff = compareStructural(parseSvekDot(BAMAMI_JAR_DOT), dotInputToStructural(ours));
    expect(diff.clusterOk).toBe(true);
    expect(diff.clusterNestingOk).toBe(false);
    expect(diff.structurallyEqual).toBe(false);
  });

  it('passes clusterNestingOk once the candidate carries the same chain and title size', () => {
    const ours: DotInputGraph = {
      nodes: pairOfNodes,
      edges: [],
      clusters: [
        { id: 'cluster6', label: 'C', labelWidth: 17, labelHeight: 23, innerMarginLevels: 1, nodeIds: ['a', 'b'] },
      ],
    };
    const diff = compareStructural(parseSvekDot(BAMAMI_JAR_DOT), dotInputToStructural(ours));
    expect(diff.clusterNestingOk).toBe(true);
  });

  it('fails clusterNestingOk when only the title TABLE size differs', () => {
    const ours: DotInputGraph = {
      nodes: pairOfNodes,
      edges: [],
      clusters: [
        { id: 'cluster6', label: 'C', labelWidth: 17, labelHeight: 14, innerMarginLevels: 1, nodeIds: ['a', 'b'] },
      ],
    };
    const diff = compareStructural(parseSvekDot(BAMAMI_JAR_DOT), dotInputToStructural(ours));
    expect(diff.clusterNestingOk).toBe(false);
  });

  it('gives a border-point cluster the same a/i chain on both sides', () => {
    const ours: DotInputGraph = {
      nodes: [
        { id: 'p', width: 12, height: 12, isPort: true },
        { id: 'm', width: 50, height: 50 },
      ],
      edges: [],
      clusters: [
        {
          id: 'cluster6',
          label: 'C',
          labelWidth: 42,
          labelHeight: 9,
          nodeIds: ['p', 'm'],
          portRanks: [{ rank: 'sink', nodeIds: ['p'] }],
          portRanksLabelOnEe: true,
          borderPointAncestorWrap: true,
        },
      ],
    };
    const oracleCluster = parseSvekDot(VIROXO_JAR_DOT).clusters[0]!;
    const candidateCluster = dotInputToStructural(ours).clusters[0]!;
    expect(candidateCluster.wrapperChain).toEqual({ a: true, p0: false, i: true, p1: false });
    expect(candidateCluster.wrapperChain).toEqual(oracleCluster.wrapperChain);
    expect(candidateCluster.titleTable).toEqual(oracleCluster.titleTable);
  });
});
