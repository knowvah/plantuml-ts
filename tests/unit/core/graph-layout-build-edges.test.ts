import { describe, it, expect } from 'vitest';
import { createGraph } from '@knowvah/dot-engine';
import type { Graph } from '@knowvah/dot-engine';
import { addEdges } from '../../../src/core/graph-layout-build-edges.js';
import type { DotInputGraph } from '../../../src/core/graph-layout.js';

/**
 * SI31 T1 (`docs/graphviz-issues/16-edge-xlabel-position-not-in-getlayout.md`):
 * `addEdges` had no `xlabel` branch, so a transition moved to `xlabel` under
 * `linetype ortho` (`state-dot-graph.ts#moveLabelToXlabel`,
 * `class-dot-edges.ts#moveLabelToXlabel` -- both mirror `SvekEdge.java
 * :433-437`'s `dotSplines == ORTHO` fork) reached @knowvah/dot-engine with NO
 * label text at all -- the attribute was declared on `DotInputEdge
 * .attributes` but never read here. These tests are white-box, mirroring
 * `graph-layout-build.test.ts`'s pattern of inspecting the built `Graph`
 * directly.
 */

const twoNodes: DotInputGraph['nodes'] = [
  { id: 'a', width: 1, height: 1 },
  { id: 'b', width: 1, height: 1 },
];

function build(input: DotInputGraph): Graph {
  const b = createGraph({ directed: true });
  addEdges(b, input);
  return b.graph;
}

describe('addEdges — xlabel forwarding (SI31 T1, docs/graphviz-issues/16)', () => {
  it('forwards xlabel as a FIXEDSIZE HTML table when xlabelWidth/xlabelHeight are set (moveLabelToXlabel always sets both)', () => {
    const input: DotInputGraph = {
      nodes: twoNodes,
      edges: [
        {
          id: 'e0',
          from: 'a',
          to: 'b',
          attributes: { xlabel: 'go', xlabelWidth: 30.8, xlabelHeight: 12 },
        },
      ],
    };
    const g = build(input);
    const attr = g.edges[0]!.attrs.get('xlabel')!;
    expect(attr).toBeDefined();
    // Math.trunc, mirroring `fixedSizeTable`'s own `appendTable` (int) cast
    // (SvekEdge.java:504-521) -- the SAME reservation-box mechanism
    // label/tailLabel/headLabel already use for their own box variants.
    expect(attr).toContain('WIDTH="30"');
    expect(attr).toContain('HEIGHT="12"');
    expect(attr).toContain('FIXEDSIZE="TRUE"');
  });

  it('forwards a plain-text xlabel (fontname Times) when no box dims are given', () => {
    const input: DotInputGraph = {
      nodes: twoNodes,
      edges: [{ id: 'e0', from: 'a', to: 'b', attributes: { xlabel: 'go' } }],
    };
    const g = build(input);
    expect(g.edges[0]!.attrs.get('xlabel')).toBe('go');
    expect(g.edges[0]!.attrs.get('fontname')).toBe('Times');
  });

  it('a non-ortho edge (plain `label`, no xlabel) never gains an xlabel attr — no regression on the label path', () => {
    const input: DotInputGraph = {
      nodes: twoNodes,
      edges: [
        { id: 'e0', from: 'a', to: 'b', attributes: { label: 'go', labelWidth: 20, labelHeight: 12 } },
      ],
    };
    const g = build(input);
    expect(g.edges[0]!.attrs.has('xlabel')).toBe(false);
    expect(g.edges[0]!.attrs.get('label')).toBe('go');
  });
});
