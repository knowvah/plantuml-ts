/**
 * `ElkGraphUtil#findBestEdgeContainment` for simple edges (ELK 0.12.0,
 * elk-worker.js:78655-78694): which node an edge's coordinates are relative to.
 */
import { describe, expect, it } from 'vitest';

import { ElkjsEdge, ElkjsNode, findBestEdgeContainment } from '../../../src/core/elk/elkjs-graph.js';

const OWNER = {};

/** root ─ a ─ a1 ─ a11, root ─ b ─ b1. */
function tree(): Record<'root' | 'a' | 'a1' | 'a11' | 'b' | 'b1', ElkjsNode> {
  const root = new ElkjsNode(OWNER, null);
  const a = new ElkjsNode(OWNER, root);
  const a1 = new ElkjsNode(OWNER, a);
  const a11 = new ElkjsNode(OWNER, a1);
  const b = new ElkjsNode(OWNER, root);
  const b1 = new ElkjsNode(OWNER, b);
  return { root, a, a1, a11, b, b1 };
}

describe('findBestEdgeContainment', () => {
  const t = tree();

  it.each([
    ['siblings', t.a, t.b, t.root],
    ['a self-loop', t.a1, t.a1, t.a],
    ['source is the target’s parent', t.a, t.a1, t.a],
    ['target is the source’s parent', t.a1, t.a, t.a],
    ['target is a deeper descendant of the source', t.a, t.a11, t.a],
    ['source is a deeper descendant of the target', t.a11, t.a, t.a],
    ['unrelated nodes at different depths', t.a11, t.b1, t.root],
    ['unrelated nodes at equal depth', t.a1, t.b1, t.root],
  ])('contains an edge between %s in the right node', (_case, source, target, expected) => {
    expect(findBestEdgeContainment(source, target)).toBe(expected);
  });

  it('finds no containment for nodes of two graphs, and the proxy then throws', () => {
    const other = new ElkjsNode(OWNER, null);
    const stray = new ElkjsNode(OWNER, other);
    expect(findBestEdgeContainment(t.a1, stray)).toBeNull();
    const edge = new ElkjsEdge(t.a1, stray, null);
    expect(() => edge.getContainingNode()).toThrow('NullPointerException');
    expect(t.root.containedEdges).not.toContain(edge);
  });

  it('roots: two graph roots share a null parent', () => {
    expect(findBestEdgeContainment(t.root, new ElkjsNode(OWNER, null))).toBeNull();
  });
});
