/**
 * layout-geo-post-opale.test.ts — T1e (opale note port, tefeco-12-rato895
 * mechanism (b)): pins `layout-geo-post.ts#applyOpaleNote`, the
 * `buildEdgeGeos`-internal step that mirrors `GraphvizImageBuilder.java
 * #isOpalisable` (:133-146) — minus its `strictUmlStyle()` guard, a
 * documented residual, see `applyOpaleNote`'s own doc comment — and marks
 * a note-attachment edge with `consumedByOpaleNote`/`opale` when it
 * resolves via `Opale.ts#resolveOpaleConnector`.
 *
 * @see ~/git/plantuml/.../svek/GraphvizImageBuilder.java#isOpalisable (:133-146)
 */
import { describe, it, expect } from 'vitest';
import { buildEdgeGeos, type EdgeMapping, type ResultEdge } from '../../../src/diagrams/description/layout-geo-post.js';
import type { DescriptiveLink } from '../../../src/diagrams/description/ast.js';
import type { DescriptionNodeGeo } from '../../../src/diagrams/description/layout-helpers.js';

function makeNode(overrides: Partial<DescriptionNodeGeo> & { id: string }): DescriptionNodeGeo {
  return {
    symbol: 'component',
    display: overrides.id,
    x: 0,
    y: 0,
    width: 40,
    height: 20,
    children: [],
    ...overrides,
  };
}

function makeMapping(nodes: readonly DescriptionNodeGeo[], resultEdges: readonly ResultEdge[]): EdgeMapping {
  const dotEdgeToLinkIdx = new Map(resultEdges.map((re, i) => [re.id, i]));
  return {
    dotEdgeToLinkIdx,
    edgeContainerEndpoints: new Map(),
    geoIndex: new Map(nodes.map((n) => [n.id, n])),
    dx: 0,
    dy: 0,
  };
}

describe('buildEdgeGeos — Opale note-attachment marking (T1e)', () => {
  it('a note with exactly one link to a non-note entity resolves the Opale connector', () => {
    const note = makeNode({ id: 'note1', symbol: 'note', width: 40, height: 20 });
    const entity = makeNode({ id: 'e1', x: 100, y: 0 });
    const link: DescriptiveLink = { from: 'note1', to: 'e1', style: 'dashed', arrowHead: 'none', length: 1 };
    // 2-point "spline" from the note's own right edge (40,10) out toward e1
    // (50,10) -- hand-computed expectation below.
    const re: ResultEdge = {
      id: 'e0',
      points: [
        { x: 40, y: 10 },
        { x: 50, y: 10 },
      ],
    };
    const mapping = makeMapping([note, entity], [re]);

    const [geo] = buildEdgeGeos([link], [re], mapping);

    expect(geo!.consumedByOpaleNote).toBe(true);
    // getOpaleStrategy(40, 20, {x:40,y:10}): right-edge orthoDistance = 0,
    // the minimum of the four -- 'right' wins.
    expect(geo!.opale).toEqual({
      direction: 'right',
      pp1: { x: 40, y: 10 },
      pp2: { x: 50, y: 10 },
    });
  });

  it('a note linked to ANOTHER note does not opalise (isOpalisable: other end not NOTE)', () => {
    const note1 = makeNode({ id: 'note1', symbol: 'note' });
    const note2 = makeNode({ id: 'note2', symbol: 'note', x: 100 });
    const link: DescriptiveLink = { from: 'note1', to: 'note2', style: 'dashed', arrowHead: 'none', length: 1 };
    const re: ResultEdge = {
      id: 'e0',
      points: [
        { x: 40, y: 10 },
        { x: 100, y: 10 },
      ],
    };
    const mapping = makeMapping([note1, note2], [re]);

    const [geo] = buildEdgeGeos([link], [re], mapping);

    expect(geo!.consumedByOpaleNote).toBeUndefined();
    expect(geo!.opale).toBeUndefined();
  });

  it('a note touched by TWO links does not opalise (isOpalisable: onlyOneLink)', () => {
    const note = makeNode({ id: 'note1', symbol: 'note' });
    const e1 = makeNode({ id: 'e1', x: 100 });
    const e2 = makeNode({ id: 'e2', x: -100 });
    const links: DescriptiveLink[] = [
      { from: 'note1', to: 'e1', style: 'dashed', arrowHead: 'none', length: 1 },
      { from: 'e2', to: 'note1', style: 'dashed', arrowHead: 'none', length: 1 },
    ];
    const resultEdges: ResultEdge[] = [
      {
        id: 'e0',
        points: [
          { x: 40, y: 10 },
          { x: 100, y: 10 },
        ],
      },
      {
        id: 'e1',
        points: [
          { x: -100, y: 10 },
          { x: 0, y: 10 },
        ],
      },
    ];
    const mapping = makeMapping([note, e1, e2], resultEdges);

    const geos = buildEdgeGeos(links, resultEdges, mapping);

    for (const geo of geos) {
      expect(geo.consumedByOpaleNote).toBeUndefined();
      expect(geo.opale).toBeUndefined();
    }
  });

  it('an ordinary entity-to-entity link (no note endpoint) is untouched', () => {
    const e1 = makeNode({ id: 'e1' });
    const e2 = makeNode({ id: 'e2', x: 100 });
    const link: DescriptiveLink = { from: 'e1', to: 'e2', style: 'solid', length: 1 };
    const re: ResultEdge = {
      id: 'e0',
      points: [
        { x: 40, y: 10 },
        { x: 100, y: 10 },
      ],
    };
    const mapping = makeMapping([e1, e2], [re]);

    const [geo] = buildEdgeGeos([link], [re], mapping);

    expect(geo!.consumedByOpaleNote).toBeUndefined();
    expect(geo!.opale).toBeUndefined();
  });
});
