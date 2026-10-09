/**
 * cdd3-T18: `together { }` in the description engine goes through the same
 * `CucaDiagram` methods as class (`CommandTogether` is registered at
 * `DescriptionDiagramFactory.java:97`; membership per
 * `atmp/CucaDiagram.java:188-194,232,339-353`) and prints through the same
 * `Cluster#printCluster2` (`svek/Cluster.java:550-583`).
 * `jecici-56-bimu826`'s jar DOT holds two root `cluster2tK` subgraphs.
 */
import { describe, it, expect } from 'vitest';
import { parseDescription } from '../../../src/diagrams/description/parser.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import type { DescriptionDiagramAST } from '../../../src/diagrams/description/ast.js';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { setLayoutInputObserver } from '../../../src/core/graph-layout.js';
import type { DotInputGraph } from '../../../src/core/graph-layout.js';
import { descriptionAst } from './parse-description-ast.js';

function parse(source: string): DescriptionDiagramAST {
  const lines = source
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const block: UmlSource = { lines, type: 'description' };
  return descriptionAst(parseDescription(block));
}

const membersOf = (ast: DescriptionDiagramAST): Array<[string, string | undefined, string[]]> =>
  (ast.togethers ?? []).map((t) => [t.id, t.parentId, t.members.map((m) => m.id)]);

describe('description together membership (CucaDiagram.java:188-194,232,339-353)', () => {
  it('entities created in the block join it; the block adds no node or container', () => {
    const ast = parse('component A\ntogether {\ncomponent B\ncomponent C\n}\ncomponent D');
    expect(membersOf(ast)).toEqual([['__together_0', undefined, ['B', 'C']]]);
    expect(ast.nodes.map((n) => n.id)).toEqual(['A', 'B', 'C', 'D']);
  });

  it('a container opened in the block joins it; its own children do not', () => {
    const ast = parse('together {\nnode N {\ncomponent X\n}\ncomponent Y\n}');
    expect(membersOf(ast)).toEqual([['__together_0', undefined, ['N', 'Y']]]);
  });

  it('a nested block takes the enclosing one as parent', () => {
    const ast = parse('together {\ntogether {\ncomponent X\n}\n}');
    expect(membersOf(ast)).toEqual([
      ['__together_0', undefined, []],
      ['__together_1', '__together_0', ['X']],
    ]);
  });

  it('the DOT input carries the membership', () => {
    const inputs: DotInputGraph[] = [];
    setLayoutInputObserver(({ graph: input }) => inputs.push(input));
    try {
      renderSync('@startuml\ncomponent A\ntogether {\ncomponent B\n}\nA --> B\n@enduml\n', {
        measurer: new DeterministicMeasurer(),
      });
    } finally {
      setLayoutInputObserver(undefined);
    }
    const graph = inputs[0]!;
    expect(graph.togethers).toEqual([{ id: '__together_0' }]);
    expect(graph.nodes.filter((n) => n.together !== undefined).map((n) => n.id)).toEqual(['B']);
  });
});
