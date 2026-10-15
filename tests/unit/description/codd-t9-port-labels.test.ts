/**
 * codd T9 part 2. `SvekEdge.java:447-468` emits `taillabel`/`headlabel`
 * TABLEs for a link's quantifiers (`purevo-74-pamo264` svek-1.dot:6, 7x13).
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { setLayoutInputObserver } from '../../../src/core/graph-layout.js';
import type { DotInputEdge, DotInputGraph } from '../../../src/core/graph-layout.js';

const measurer = new DeterministicMeasurer();
const QUANTIFIER_BOX_WIDTH = 7;
const QUANTIFIER_BOX_HEIGHT = 13;

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

describe('description quantifiers reach the DOT as taillabel/headlabel text', () => {
  it('carries both quantifier texts and the 7x13 boxes (purevo-74-pamo264)', () => {
    const edges = outerEdges(
      '@startuml\nnode n1 {\ncomponent c1\n}\nnode n2 {\ncomponent c2\n}\nn1 "1"-right-"1" n2\n@enduml',
    );
    const edge = edges.find((e) => e.attributes?.tailLabel !== undefined);
    expect(edge?.attributes?.tailLabel).toBe('1');
    expect(edge?.attributes?.headLabel).toBe('1');
    expect(edge?.attributes?.tailLabelWidth).toBe(QUANTIFIER_BOX_WIDTH);
    expect(edge?.attributes?.tailLabelHeight).toBe(QUANTIFIER_BOX_HEIGHT);
  });
});
