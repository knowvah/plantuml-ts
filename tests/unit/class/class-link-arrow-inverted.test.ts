/**
 * cdd3-T16 reveals, both jar-verified with `scripts/oracle-render.sh`:
 *
 * 1. Magic-arrow glyph direction. `SvekEdge#getArrowDirectionInRadian`
 *    (`svek/SvekEdge.java:201-217`) measures `dotPath`, which runs
 *    `getEntity1()` -> `getEntity2()` (the DOT edge's tail -> head), and
 *    `Link#getLinkArrow` (`abel/Link.java:423-428`) reverses the token for an
 *    inverted (`-up-`/`-left-`) link.
 * 2. `SvekEdge#manageCollision` (`:1205-1216`) walks `Bibliotekon#allNodes`
 *    in `createNode` order, entity nodes only (`Bibliotekon.java:182-184`).
 */
import { describe, it, expect } from 'vitest';

import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import type { DotInputGraph, DotLayoutResult } from '../../../src/core/graph-layout.js';
import { inNodeMapOrder } from '../../../src/diagrams/class/class-node-map-order.js';

const measurer = new DeterministicMeasurer();

/** The magic-arrow glyph: the label-arrow `<polygon>` with 4 point pairs. */
function glyphTipAndBase(svg: string): { tipY: number; baseY: number } {
  const all = [...svg.matchAll(/<polygon points="([^"]+)"/g)].map((m) => m[1]!.split(',').map(Number));
  const glyph = all.find((p) => p.length === 8)!;
  return { tipY: glyph[1]!, baseY: glyph[3]! };
}

describe('magic arrow direction (SvekEdge.java:201-217, Link.java:423-428)', () => {
  it('`A <-- B : go >` points down, A to B: jar tip y=97.5, base y=88.455', () => {
    const svg = renderSync('@startuml\nclass A\nclass B\nA <-- B : go >\n@enduml\n', { measurer });
    expect(glyphTipAndBase(svg)).toEqual({ tipY: 97.5, baseY: 88.455 });
  });

  it('`A -up- B : go >` (inverted) points up, A to B: jar tip y=87.5, base y=96.545', () => {
    const svg = renderSync('@startuml\nclass A\nclass B\nA -up- B : go >\n@enduml\n', { measurer });
    expect(glyphTipAndBase(svg)).toEqual({ tipY: 87.5, baseY: 96.545 });
  });
});

describe('inNodeMapOrder — Bibliotekon#allNodes (Bibliotekon.java:182-184)', () => {
  const box = (id: string) => ({ id, x: 0, y: 0, width: 10, height: 10 });
  it('lists entity nodes in construction (sh####) order and drops za anchors', () => {
    const dotGraph: DotInputGraph = {
      nodes: [
        { id: 'a', width: 10, height: 10 },
        { id: 'b', width: 10, height: 10 },
        { id: 'm', width: 10, height: 10 },
        { id: 'za', width: 1, height: 1, shape: 'point' },
      ],
      edges: [],
      clusters: [{ id: 'cluster0', nodeIds: ['za', 'm'], unwrappedNodeId: 'za', innerMarginLevels: 1 }],
    };
    // Construction: cluster0's leaf m first (printGroups), then a, b.
    const result: DotLayoutResult = {
      nodes: [box('b'), box('za'), box('a'), box('m')],
      edges: [],
      width: 0,
      height: 0,
    };
    expect(inNodeMapOrder(result, dotGraph).nodes.map((n) => n.id)).toEqual(['m', 'a', 'b']);
  });
});
