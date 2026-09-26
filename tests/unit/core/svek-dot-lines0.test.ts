/**
 * `svek-dot-lines0.ts#orderLines0Edges` — E3-18
 * (`plans/class-divergence-drive-3/diagnosis/E3.md` § cobumi-83-bapu892).
 *
 * `Bibliotekon#addLine` (`~/git/plantuml/src/main/java/net/sourceforge/
 * plantuml/svek/Bibliotekon.java:87-106`): a note-labelled `lines0` edge
 * (`hasNoteLabelText()`, `SvekEdge.java:383-385`) is spliced in just BEFORE
 * the first unlabelled `lines0` edge already collected that shares its
 * connections (`Link#sameConnections`, `abel/Link.java:462-469` — endpoints
 * equal in either order); everything else is appended, in declaration order.
 */
import { describe, it, expect } from 'vitest';
import { orderLines0Edges } from '../../../src/core/svek-dot-lines0.js';
import type { DotInputEdge } from '../../../src/core/graph-layout.types.js';

const unlabelled = (id: string, from: string, to: string): DotInputEdge => ({
  id,
  from,
  to,
  attributes: { minLen: 0 },
});

const labelled = (id: string, from: string, to: string, label: string): DotInputEdge => ({
  id,
  from,
  to,
  attributes: { minLen: 0, label, labelWidth: 40, labelHeight: 14 },
});

describe('orderLines0Edges — Bibliotekon#addLine (E3-18)', () => {
  it('a labelled edge is spliced in ahead of the first same-connections unlabelled one', () => {
    const edges = [unlabelled('e0', 'a', 'b'), labelled('e1', 'b', 'a', 'children')];
    expect(orderLines0Edges(edges).map((e) => e.id)).toEqual(['e1', 'e0']);
  });

  it('sameConnections is undirected: from/to reversed still matches', () => {
    const edges = [unlabelled('e0', 'x', 'y'), labelled('e1', 'x', 'y', 'note')];
    expect(orderLines0Edges(edges).map((e) => e.id)).toEqual(['e1', 'e0']);
  });

  it('a labelled edge with NO matching unlabelled connections is appended, not spliced', () => {
    const edges = [unlabelled('e0', 'a', 'b'), labelled('e1', 'c', 'd', 'note')];
    expect(orderLines0Edges(edges).map((e) => e.id)).toEqual(['e0', 'e1']);
  });

  it('two unlabelled edges with no note text keep plain declaration order (no regression)', () => {
    const edges = [unlabelled('e0', 'a', 'b'), unlabelled('e1', 'b', 'a')];
    expect(orderLines0Edges(edges).map((e) => e.id)).toEqual(['e0', 'e1']);
  });

  it('a labelled edge finds the FIRST matching unlabelled edge, not the last', () => {
    const edges = [unlabelled('e0', 'a', 'b'), unlabelled('e1', 'a', 'b'), labelled('e2', 'a', 'b', 'note')];
    expect(orderLines0Edges(edges).map((e) => e.id)).toEqual(['e2', 'e0', 'e1']);
  });

  it('two labelled edges: the second finds its own match, independent of the first insertion', () => {
    const edges = [
      unlabelled('e0', 'a', 'b'),
      unlabelled('e1', 'c', 'd'),
      labelled('e2', 'a', 'b', 'n1'),
      labelled('e3', 'c', 'd', 'n2'),
    ];
    expect(orderLines0Edges(edges).map((e) => e.id)).toEqual(['e2', 'e0', 'e3', 'e1']);
  });

  it('non-lines0 edges (minLen !== 0) are excluded entirely', () => {
    const edges: DotInputEdge[] = [unlabelled('e0', 'a', 'b'), { id: 'e1', from: 'c', to: 'd', attributes: {} }];
    expect(orderLines0Edges(edges).map((e) => e.id)).toEqual(['e0']);
  });

  it('a labelled edge with no OTHER lines0 edge yet is simply appended', () => {
    const edges = [labelled('e0', 'a', 'b', 'note')];
    expect(orderLines0Edges(edges).map((e) => e.id)).toEqual(['e0']);
  });

  it('does not mutate the input array', () => {
    const edges = [unlabelled('e0', 'a', 'b'), labelled('e1', 'b', 'a', 'children')];
    const snapshot = [...edges];
    orderLines0Edges(edges);
    expect(edges).toEqual(snapshot);
  });
});
