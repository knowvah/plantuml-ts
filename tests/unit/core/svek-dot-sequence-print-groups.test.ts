/**
 * cdd3-T14 (E1-1): `GraphvizImageBuilder#printGroups` mutes an EMPTY package
 * to `LeafType.EMPTY_PACKAGE` and prints it as an entity AT ITS GROUP SLOT
 * (`svek/GraphvizImageBuilder.java:408-420`) -- so its ColorSequence value
 * is drawn between its sibling clusters' `openCluster` reservations, not
 * after every cluster with the unpackaged leaves (`:227`). Inside a cluster
 * `printGroup` prints the group's own leaves first, then `printGroups(g)`
 * (`:429-433`), so a nested muted package follows the leaves and
 * interleaves with the child clusters.
 */
import { describe, it, expect } from 'vitest';
import { assignSequence, buildClusterTree } from '../../../src/core/svek-dot-sequence.js';
import type { DotInputGraph } from '../../../src/core/graph-layout.js';

const node = (id: string) => ({ id, width: 10, height: 10 });

function shOf(input: DotInputGraph): Record<string, string> {
  const { recs } = assignSequence(input, buildClusterTree(input.clusters ?? []));
  return Object.fromEntries([...recs].map(([id, r]) => [id, r.sh]));
}

describe('assignSequence — printGroups slot for muted EMPTY_PACKAGE nodes', () => {
  it('root: a muted package ordered before a cluster takes its value before openCluster (java:416-418)', () => {
    const input: DotInputGraph = {
      nodes: [node('empty'), node('leaf'), node('member')],
      edges: [],
      clusters: [{ id: 'cluster0', nodeIds: ['member'] }],
      printGroupsOrder: ['empty', 'cluster0'],
    };
    // root ctor 2..5, empty 6, cluster0 7..10, member 11, leaf 12.
    expect(shOf(input)).toEqual({ empty: 'sh0006', member: 'sh0011', leaf: 'sh0012' });
  });

  it('root: a muted package ordered after a cluster keeps the cluster first', () => {
    const input: DotInputGraph = {
      nodes: [node('empty'), node('leaf'), node('member')],
      edges: [],
      clusters: [{ id: 'cluster0', nodeIds: ['member'] }],
      printGroupsOrder: ['cluster0', 'empty'],
    };
    expect(shOf(input)).toEqual({ member: 'sh0010', empty: 'sh0011', leaf: 'sh0012' });
  });

  it('nested: a muted package follows its parent cluster own leaves, before a later child cluster (java:429-433)', () => {
    const input: DotInputGraph = {
      nodes: [node('inner'), node('a'), node('b')],
      edges: [],
      clusters: [
        { id: 'p', nodeIds: ['inner', 'a'] },
        { id: 'c', parentId: 'p', nodeIds: ['b'] },
      ],
      printGroupsOrder: ['p', 'inner', 'c'],
    };
    // root 2..5, p 6..9, a 10, inner 11, c 12..15, b 16.
    expect(shOf(input)).toEqual({ a: 'sh0010', inner: 'sh0011', b: 'sh0016' });
  });

  it('no printGroupsOrder: clusters first, then root nodes in array order (unchanged)', () => {
    const input: DotInputGraph = {
      nodes: [node('empty'), node('member')],
      edges: [],
      clusters: [{ id: 'cluster0', nodeIds: ['member'] }],
    };
    expect(shOf(input)).toEqual({ member: 'sh0010', empty: 'sh0011' });
  });
});
