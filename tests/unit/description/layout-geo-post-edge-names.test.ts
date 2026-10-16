/**
 * layout-geo-post-edge-names.test.ts — pins `fromName`/`toName` on the edge
 * geo: the jar names an edge by its entities' LEAF names
 * (`Link.java:106-120` `idCommentForSvg()` -> `Entity.java:686-688`
 * `getName()` -> `Quark.java:84-86`). Expected values are the jar's
 * component/fidati-41-kofe029 output: `<!--link ccc03 to ccc05-->`,
 * `<path id="ccc03-ccc05">`.
 */
import { describe, it, expect } from 'vitest';
import { buildEdgeGeos, type EdgeMapping, type ResultEdge } from '../../../src/diagrams/description/layout-geo-post.js';
import type { DescriptiveLink } from '../../../src/diagrams/description/ast.js';
import { SCOPE_KEY_SEP } from '../../../src/diagrams/description/namespace-groups.js';

const RE: ResultEdge = {
  id: 'e0',
  points: [
    { x: 0, y: 0 },
    { x: 10, y: 10 },
  ],
};

function geoFor(link: DescriptiveLink, namespaceSeparator?: string | null) {
  const m: EdgeMapping = {
    dotEdgeToLinkIdx: new Map([[RE.id, 0]]),
    edgeContainerEndpoints: new Map(),
    geoIndex: new Map(),
    dx: 0,
    dy: 0,
    ...(namespaceSeparator === undefined ? {} : { namespaceSeparator }),
  };
  return buildEdgeGeos([link], [RE], m)[0]!;
}

const link = (from: string, to: string): DescriptiveLink => ({ from, to, style: 'solid', length: 1 });

describe('buildEdgeGeos — edge leaf names', () => {
  it('splits a qualified endpoint at the namespace separator', () => {
    const g = geoFor(link('aaa.bbb1.ccc03', 'aaa.bbb1.ccc05'), '.');
    expect(g.fromName).toBe('ccc03');
    expect(g.toName).toBe('ccc05');
    expect(g.from).toBe('aaa.bbb1.ccc03');
    expect(g.to).toBe('aaa.bbb1.ccc05');
  });

  it('leaves the names equal to the ids without a separator', () => {
    const g = geoFor(link('a.b', 'c'), null);
    expect(g.fromName).toBe('a.b');
    expect(g.toName).toBe('c');
  });

  it('strips the scope key before splitting', () => {
    const g = geoFor(link(`pkg${SCOPE_KEY_SEP}x.y`, `pkg${SCOPE_KEY_SEP}z`), '.');
    expect(g.fromName).toBe('y');
    expect(g.toName).toBe('z');
  });

  it('a self-loop names both ends by the same leaf', () => {
    const g = geoFor(link('a.b', 'a.b'), '.');
    expect([g.fromName, g.toName]).toEqual(['b', 'b']);
  });
});
