/**
 * codd T9. Description self-loops, values from the jar DOT.
 *
 * Self-loops: the jar emits `X->X` for `tapp ==> tapp` and for a group
 *    auto-link (`Link.isAutoLinkOfAGroup`, abel/Link.java:341-352). Jar DOT
 *    (`test-results/dot-cache/unknown/xagonu-36-sudi116/svek-1.dot:74,77`):
 *    `sh0050->sh0050 ... minlen=2 ... xlabel TABLE 139x38` and
 *    `zaent0019->zaent0019 ... minlen=1 ... xlabel TABLE 142x25`.
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { setLayoutInputObserver } from '../../../src/core/graph-layout.js';
import type { DotInputEdge, DotInputGraph } from '../../../src/core/graph-layout.js';

const measurer = new DeterministicMeasurer();

function outerEdges(puml: string): readonly DotInputEdge[] {
  const captured: DotInputGraph[] = [];
  setLayoutInputObserver(({ graph }) => captured.push(graph));
  try {
    renderSync(puml, { measurer });
  } finally {
    setLayoutInputObserver(undefined);
  }
  return captured[0]!.edges;
}

describe('description self-loops reach the DOT', () => {
  it('emits a leaf self-loop with its label box and minlen (sh0050->sh0050)', () => {
    const edges = outerEdges('@startuml\ncomponent a\ncomponent b\na ==> a : loop\na --> b\n@enduml');
    const loops = edges.filter((e) => e.from === e.to);
    expect(loops.map((e) => e.from)).toEqual(['a']);
    expect(loops[0]!.attributes?.minLen).toBe(1);
    expect(loops[0]!.attributes?.labelBoxWidth).toBeGreaterThan(0);
  });

  it('emits a group auto-link as a cluster-anchor self-loop (zaent0019->zaent0019)', () => {
    const edges = outerEdges('@startuml\nnode g {\n component c\n}\ng --> g : again\ncomponent o\no --> g\n@enduml');
    const loops = edges.filter((e) => e.from === e.to);
    expect(loops).toHaveLength(1);
    expect(loops[0]!.from).toMatch(/-anchor$/);
  });
});
