/**
 * dsw-T9 mechanism B -- a `-left->`/`-up->` link is built by `Link#getInv()`
 * (abel/Link.java:145-147, `result.inverted = !this.inverted`;
 * descdiagram/command/CommandLinkElement.java:325-326), and
 * `Cluster#printCluster1` (svek/Cluster.java:195-212,515-523) declares the
 * tail node of every inverted link FIRST (`firsts.add(0, sh)`, so reversed).
 *
 * Expected order is the jar's own svek-1.dot for the probe below (rendered
 * with scripts/oracle-render.sh): node lines `sh0008 sh0006 sh0007`, i.e.
 * C (tail of `B -up-> C` inverted to C->B), A (tail of `C -left-> A`
 * inverted to A->C), then B -- NOT creation order A, B, C.
 */
import { describe, it, expect } from 'vitest';

import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { setLayoutInputObserver } from '../../../src/core/graph-layout.js';
import type { DotInputGraph } from '../../../src/core/graph-layout.js';
import { toSvekDot } from '../../../src/core/svek-dot-emit.js';

const PROBE = [
  '@startuml',
  'component A',
  'component B',
  'component C',
  'A --> B',
  'C -left-> A',
  'B -up-> C',
  '@enduml',
].join('\n');

const JAR_NODE_ORDER = ['sh0008', 'sh0006', 'sh0007'];

function capture(): DotInputGraph {
  const inputs: DotInputGraph[] = [];
  setLayoutInputObserver(({ graph }) => inputs.push(graph));
  try {
    renderSync(PROBE, { measurer: new DeterministicMeasurer() });
  } finally {
    setLayoutInputObserver(undefined);
  }
  return inputs[0]!;
}

describe('inverted description links declare their tail first (Cluster.java:195-212)', () => {
  it('marks exactly the -left-/-up- edges inverted on the layout input', () => {
    const inverted = capture().edges.filter((e) => e.inverted === true);
    expect(inverted).toHaveLength(2);
    expect(capture().edges.filter((e) => e.inverted !== true)).toHaveLength(1);
  });

  it('emits node shape lines in the jar order', () => {
    const dot = toSvekDot(capture());
    const order = [...dot.matchAll(/^(sh\d+) \[/gm)].map((m) => m[1]);
    expect(order).toEqual(JAR_NODE_ORDER);
  });
});
