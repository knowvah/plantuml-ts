import { describe, it, expect } from 'vitest';
import { layoutGraph } from '../../../src/core/graph-layout.js';
import { toSvekDot } from '../../../src/core/svek-dot-emit.js';
import type { DotInputGraph } from '../../../src/core/graph-layout.types.js';

/** `ClusterDotStringKermor.java:81-153`: alpha (only with a TOP/BOTTOM note) > beta > gamma. */
function graph(notes: NonNullable<DotInputGraph['clusters']>[number]['kermorNotes']): DotInputGraph {
  return {
    kermor: true,
    nodes: [{ id: 'n', width: 40, height: 30 }],
    edges: [],
    clusters: [
      {
        id: 'cluster0',
        nodeIds: ['n'],
        labelWidth: 60,
        labelHeight: 14,
        titleTableWidth: 60,
        titleTableHeight: 14,
        ...(notes === undefined ? {} : { kermorNotes: notes }),
      },
    ],
  };
}

describe('kermor cluster nesting', () => {
  it('prints beta > gamma only when the group has no note (:102,:126)', () => {
    const dot = toSvekDot(graph(undefined));
    expect(dot).not.toMatch(/cluster0alpha/);
    expect(dot).toMatch(
      /subgraph cluster0beta \{labelloc="b";color="#FFFF00";label="";\s*subgraph cluster0gamma \{labelloc="t";/,
    );
  });

  it('prints alpha (TOP table) > beta (BOTTOM table) > gamma when notes exist (:81-115)', () => {
    const dot = toSvekDot(graph({ top: { width: 282, height: 46 }, bottom: { width: 10, height: 20 } }));
    expect(dot).toMatch(/subgraph cluster0alpha \{color="#FFFF00";label=<<TABLE[^>]*WIDTH="282" HEIGHT="46"/);
    expect(dot).toMatch(
      /subgraph cluster0beta \{labelloc="b";color="#FFFF00";label=<<TABLE[^>]*WIDTH="10" HEIGHT="20"/,
    );
    expect(dot.match(/\}/g)?.length).toBeGreaterThanOrEqual(4);
  });

  it('reports the gamma box under the caller id; a note-top label shifts the origin', () => {
    const plain = layoutGraph(graph(undefined));
    const noted = layoutGraph(graph({ top: { width: 200, height: 50 } }));
    expect(plain.clusters!.map((c) => c.id)).toEqual(['cluster0']);
    // the TOP note's alpha subgraph is published under its own id, with the placed label table (200 x 50)
    expect(noted.clusters!.map((c) => c.id).sort()).toEqual(['cluster0', 'cluster0#kermor-note-top']);
    const gamma = noted.clusters!.find((c) => c.id === 'cluster0')!;
    const alpha = noted.clusters!.find((c) => c.id === 'cluster0#kermor-note-top')!;
    expect(gamma.width).toBeCloseTo(plain.clusters![0]!.width, 6);
    expect(alpha.label?.width).toBe(200);
    expect(alpha.label?.height).toBe(50);
    // alpha/beta reserve room around gamma: the whole graph is shifted further from the origin.
    expect(noted.originShift!.y).toBeGreaterThan(plain.originShift!.y);
  });
});
