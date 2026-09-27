/**
 * cdd4-T6: `ClusterDotString.java:121-130` writes `labeljust` on the cluster
 * line whenever `cluster.isLabel()` -- the SAME condition that makes `label`
 * a title table rather than `""`. On the `hasPort()` branch that table rides
 * on the `empty()` anchor (`:178-181`), which is where this port carries the
 * title dims (`DotInputNode.titleLabelWidth`/`Height`); description never sets
 * `DotInputCluster.labelWidth`, so gating on it alone dropped `labeljust` from
 * every description port cluster (`sokevu-87-toce485`'s jar DOT has it).
 */
import { describe, it, expect } from 'vitest';

import { toSvekDot } from '../../../src/core/svek-dot-emit.js';
import type { DotInputGraph, DotInputNode } from '../../../src/core/graph-layout.js';

const PORT: DotInputNode = {
  id: 'p',
  width: 12,
  height: 12,
  shape: 'rect',
  isPort: true,
  attributes: { rank: 'source' },
};

function portGraph(anchor: DotInputNode): DotInputGraph {
  return {
    nodes: [PORT, anchor],
    edges: [],
    clusters: [
      {
        id: 'cluster0',
        nodeIds: ['p', anchor.id],
        portRanks: [{ rank: 'source', nodeIds: ['p'] }],
        portAnchorId: anchor.id,
      },
    ],
  };
}

describe('toSvekDot -- hasPort cluster labeljust (ClusterDotString.java:128-130)', () => {
  it('writes labeljust="c" when the anchor carries the title table, with no cluster labelWidth', () => {
    const dot = toSvekDot(
      portGraph({ id: 'za', width: 1, height: 1, shape: 'rect', titleLabelWidth: 67, titleLabelHeight: 14 }),
    );
    expect(dot).toMatch(/subgraph cluster0 \{style=solid;color="#[0-9a-f]{6}";labeljust="c";\n\{rank=source;/);
  });

  it('writes no labeljust when the anchor has no title table (isLabel() false)', () => {
    const dot = toSvekDot(portGraph({ id: 'za', width: 1, height: 1, shape: 'point' }));
    expect(dot).toMatch(/subgraph cluster0 \{style=solid;color="#[0-9a-f]{6}";\n\{rank=source;/);
  });
});
