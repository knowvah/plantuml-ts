/**
 * codd-T8 -- DOT node emission order. GraphvizImageBuilder.java:226-227 calls `printGroups(root)` before
 * `printEntities(getUnpackagedEntities())`, so root groups (an empty group is an entity, :416-418) precede
 * root leaves; inside a group, its leaves precede its sub-groups (:431-433). component/misube-65-seni576's
 * jar DOT: sh0006=B, sh0007=C, sh0008=A.
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { setLayoutInputObserver } from '../../../src/core/graph-layout.js';
import type { DotInputGraph } from '../../../src/core/graph-layout.types.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

function nodeOrder(src: string): string[] {
  const graphs: DotInputGraph[] = [];
  setLayoutInputObserver(({ graph }) => graphs.push(graph));
  try {
    renderSync(src, { measurer: new DeterministicMeasurer() });
  } finally {
    setLayoutInputObserver(undefined);
  }
  return graphs[0]!.nodes.map((n) => n.id);
}

describe('DOT node emission order', () => {
  it('emits empty root groups before the unpackaged leaf', () => {
    const src = '@startuml\ncomponent A\ncomponent B {\n}\ncomponent C {\n}\nB -- C\n@enduml';
    expect(nodeOrder(src)).toEqual(['B', 'C', 'A']);
  });

  it('emits a group leaves before its sub-groups, and root groups before root leaves', () => {
    const src = '@startuml\ncomponent R\npackage P {\npackage Q {\ncomponent q\n}\ncomponent p\n}\n@enduml';
    expect(nodeOrder(src)).toEqual(['p', 'q', 'R']);
  });
});
