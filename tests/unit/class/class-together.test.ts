/**
 * cdd3-T18 (E1-6 = B-2): the class parser records which entities a
 * `together { }` holds, as `CucaDiagram` does
 * (`~/git/plantuml/src/main/java/net/atmp/CucaDiagram.java`):
 * `reallyCreateLeaf` stamps `currentTogether()` on each leaf it CREATES
 * (`:232`), `gotoGroup` on each group it creates (`:349-353`), and
 * `currentTogether()` is the stack top only when that top is a `Together`
 * (`:188-194`). Each case is a corpus fixture whose jar DOT shows the result.
 */
import { describe, it, expect } from 'vitest';
import { parseClass } from './parse-helper.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import type { ClassDiagramAST } from '../../../src/diagrams/class/ast.js';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { setLayoutInputObserver } from '../../../src/core/graph-layout.js';
import type { DotInputGraph } from '../../../src/core/graph-layout.js';

function parse(source: string): ClassDiagramAST {
  const lines = source
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const block: UmlSource = { lines, type: 'class' };
  return parseClass(block);
}

describe('class together membership (CucaDiagram.java:188-194,232,339-353)', () => {
  it('foxosa-41-bono202: declarations inside each block join it, others do not', () => {
    const ast = parse('class A\ntogether {\nclass t1\nclass t2\n}\nclass B\ntogether {\nclass t3\n}');
    expect(ast.togethers).toEqual([
      { id: 't0', members: ['t1', 't2'] },
      { id: 't1', members: ['t3'] },
    ]);
  });

  it('sipigu-91-baku027: naming an existing class inside the block does not join it (no `t` subgraph)', () => {
    const ast = parse('class Bar1\nclass Bar2\ntogether {\nclass Bar1\nclass Bar2\n}');
    expect(ast.togethers).toEqual([{ id: 't0', members: [] }]);
  });

  it('jakapi-64-tine258: a class created by a link inside the block joins it', () => {
    const ast = parse(
      'class Group\nGroup <|-- PLACEHOLDER\ntogether {\nPLACEHOLDER <|-- Apartment\nGroup <|-- Events\n}',
    );
    expect(ast.togethers).toEqual([{ id: 't0', members: ['Apartment', 'Events'] }]);
  });

  it('voluca-76-fosu617: a package opened inside the block joins; its own classes do not', () => {
    const ast = parse('together {\nclass t1\npackage p1 {\nclass pp1\n}\nclass t2\n}');
    expect(ast.togethers).toEqual([{ id: 't0', members: ['p1', 't1', 't2'] }]);
  });

  it('nadono-22-gidu983: a block inside a namespace; `}` closes the block, not the namespace', () => {
    const ast = parse('namespace Obs {\ntogether {\nclass BadPix\n}\nclass Base\n}');
    expect(ast.togethers).toEqual([{ id: 't0', members: ['Obs.BadPix'] }]);
    expect(ast.namespaces.find((n) => n.id === 'Obs')?.classifiers).toEqual(['Obs.BadPix', 'Obs.Base']);
  });

  it('a block opened directly inside another takes it as parent (gotoTogether, :339-341)', () => {
    const ast = parse('together {\ntogether {\nclass X\n}\nclass Y\n}');
    expect(ast.togethers).toEqual([
      { id: 't0', members: ['Y'] },
      { id: 't1', parentId: 't0', members: ['X'] },
    ]);
  });

  it('the DOT input carries the membership on nodes and on the group cluster', () => {
    const inputs: DotInputGraph[] = [];
    setLayoutInputObserver(({ graph: input }) => inputs.push(input));
    try {
      renderSync('@startuml\nclass A\ntogether {\nclass t1\npackage p1 {\nclass pp1\n}\n}\n@enduml\n', {
        measurer: new DeterministicMeasurer(),
      });
    } finally {
      setLayoutInputObserver(undefined);
    }
    const graph = inputs[0]!;
    expect(graph.togethers).toEqual([{ id: 't0' }]);
    expect(graph.nodes.filter((n) => n.together !== undefined).map((n) => n.id)).toEqual(['t1']);
    expect(graph.clusters?.map((c) => c.together)).toEqual(['t0']);
  });
});
