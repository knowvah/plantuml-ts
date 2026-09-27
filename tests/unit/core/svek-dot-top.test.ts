/**
 * cdd3-T16 (E2-4 = C-16 = E3-15): `Cluster#printCluster1` /
 * `getNodesOrderedTop` / `getNodesOrderedWithoutTop`
 * (`~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/Cluster.java
 * :195-238,515-523`). Every cluster -- the root included -- first declares
 * the tail (`SvekEdge#getStartUidPrefix`) of every INVERTED link whose tail
 * is one of its own NORMAL-position nodes, prepended one at a time
 * (`firsts.add(0, sh)`, so newest first and repeated per link), and then its
 * other nodes minus those tails. For the root this runs BEFORE `lines0`
 * (`DotStringFactory.java:188-190`); for a cluster, after its `za` anchor
 * and wrappers (`ClusterDotString.java:148-176`).
 *
 * The expected DOT is the jar's own `svek-1.dot` for {@link JAR_SOURCE}
 * (rendered with `scripts/oracle-render.sh`), reproduced in {@link JAR_DOT}.
 */
import { describe, it, expect } from 'vitest';

import { renderSync } from '../../../src/index.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { setLayoutInputObserver } from '../../../src/core/graph-layout.js';
import type { DotInputGraph } from '../../../src/core/graph-layout.js';
import { firstEncounterOrder } from '../../../src/core/svek-dot-order.js';
import { toSvekDot } from '../../../src/core/svek-dot-emit.js';
import { nodesOrderedTop, nodesOrderedWithoutTop } from '../../../src/core/svek-dot-top.js';

const node = (id: string) => ({ id, width: 10, height: 10 });

const JAR_SOURCE = `@startuml
class A
class B
class C
package P {
class D
class E
}
A o-up-> B
A -left-> C
D -up-> E
A -up-> C
@enduml
`;

/** The jar's node/edge statement order for {@link JAR_SOURCE} (ids only). */
const JAR_DOT_ORDER = [
  'sh0014 [', // C: tail of `A -up-> C` (newest first)
  'sh0014 [', // C again: tail of `A -left-> C` -- one line per link
  'sh0013 [', // B: tail of `A o-up-> B`
  'sh0014->sh0012', // lines0 (`-left->` is length 1)
  'sh0014->sh0012',
  'sh0012 [', // A: printCluster2's remainder
  'sh0011 [', // cluster P: E (tail of `D -up-> E`) first
  'sh0010 [', // then D
  'sh0013->sh0012', // lines1
  'sh0011->sh0010',
];

function statementOrder(dot: string): string[] {
  const out: string[] = [];
  const re = /(sh\d{4}(?:->sh\d{4})?)\s*(\[)?/g;
  for (let m = re.exec(dot); m !== null; m = re.exec(dot)) {
    const id = m[1]!;
    if (id.includes('->')) out.push(id);
    else if (m[2] !== undefined) out.push(`${id} [`);
  }
  return out;
}

function captureClass(puml: string): DotInputGraph {
  const captured: DotInputGraph[] = [];
  setLayoutInputObserver((g) => captured.push(g));
  try {
    renderSync(puml, { measurer: new WidthTableMeasurer() });
  } finally {
    setLayoutInputObserver(undefined);
  }
  expect(captured).toHaveLength(1);
  return captured[0]!;
}

describe('nodesOrderedTop — Cluster.java:195-212', () => {
  it('prepends the tail of each inverted edge, newest first, once per edge', () => {
    const edges = [
      { id: 'e0', from: 'b', to: 'a', inverted: true as const },
      { id: 'e1', from: 'c', to: 'a', inverted: true as const },
      { id: 'e2', from: 'a', to: 'd' },
      { id: 'e3', from: 'c', to: 'a', inverted: true as const },
    ];
    expect(nodesOrderedTop(['a', 'b', 'c', 'd'], edges, () => true)).toEqual(['c', 'c', 'b']);
  });

  it('skips a tail that is not one of the cluster own nodes, or not NORMAL (java:206-207)', () => {
    const edges = [
      { id: 'e0', from: 'x', to: 'a', inverted: true as const },
      { id: 'e1', from: 'p', to: 'a', inverted: true as const },
    ];
    expect(nodesOrderedTop(['a', 'p'], edges, (id) => id !== 'p')).toEqual([]);
  });
});

describe('nodesOrderedWithoutTop — Cluster.java:218-238', () => {
  it('drops the tops but keeps array order for the rest', () => {
    const edges = [{ id: 'e0', from: 'c', to: 'a', inverted: true as const }];
    expect(nodesOrderedWithoutTop(['a', 'b', 'c'], edges, () => true)).toEqual(['a', 'b']);
  });
});

describe('printCluster1 in the DOT text and the builder (DotStringFactory.java:188-190)', () => {
  const input: DotInputGraph = {
    nodes: [node('a'), node('b'), node('c')],
    edges: [
      { id: 'e0', from: 'a', to: 'b', attributes: { minLen: 0 } },
      { id: 'e1', from: 'c', to: 'a', inverted: true },
    ],
  };

  it('firstEncounterOrder: a root top precedes the lines0 endpoints', () => {
    expect(firstEncounterOrder(input).map((n) => n.id)).toEqual(['c', 'a', 'b']);
  });

  it('toSvekDot: the top shape line precedes lines0 and is not repeated after it', () => {
    const order = statementOrder(toSvekDot(input));
    // root ctor 2..5, a 6, b 7, c 8.
    expect(order).toEqual(['sh0008 [', 'sh0006->sh0007', 'sh0006 [', 'sh0007 [', 'sh0008->sh0006']);
  });

  it('a cluster declares its own tops first (ClusterDotString.java:174-176)', () => {
    const clustered: DotInputGraph = {
      nodes: [node('d'), node('e')],
      edges: [{ id: 'e0', from: 'e', to: 'd', inverted: true }],
      clusters: [{ id: 'cluster0', nodeIds: ['d', 'e'] }],
    };
    expect(firstEncounterOrder(clustered).map((n) => n.id)).toEqual(['e', 'd']);
    // root 2..5, cluster0 6..9, d 10, e 11.
    expect(statementOrder(toSvekDot(clustered))).toEqual(['sh0011 [', 'sh0010 [', 'sh0011->sh0010']);
  });
});

describe('class: Link#isInverted reaches the DOT edge (CommandLinkClass.java:364-365)', () => {
  it('marks -up-/-left- links inverted and nothing else', () => {
    const graph = captureClass(JAR_SOURCE);
    expect(graph.edges.map((e) => e.inverted === true)).toEqual([true, true, true, true]);
    const plain = captureClass('@startuml\nclass A\nclass B\nA --> B\nA <-- B\n@enduml\n');
    expect(plain.edges.map((e) => e.inverted === true)).toEqual([false, false]);
  });

  it('emits the jar svek-1.dot statement order', () => {
    expect(statementOrder(toSvekDot(captureClass(JAR_SOURCE)))).toEqual(JAR_DOT_ORDER);
  });
});

describe('class: Association#createInSecond re-adds an inverted link (AbstractClassOrObjectDiagram.java:326-330)', () => {
  it('declares the inverted class edge tail before lines0 (jar svek-1.dot of bunuce-10-vere519)', () => {
    const src = '@startuml\nclass R1\nclass R2\nA-B\n(A,B) .. R1\nR2 .. (A,B)\n@enduml\n';
    const order = statementOrder(toSvekDot(captureClass(src)));
    // Jar: `sh0006 [` (R1, printCluster1) then the lines0 batch. The batch's
    // own internal order is not this test's subject.
    expect(order[0]).toBe('sh0006 [');
    expect(order.filter((s) => s === 'sh0006 [')).toHaveLength(1);
    expect(order.slice(1, 4).every((s) => s.includes('->'))).toBe(true);
  });
});
