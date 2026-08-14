import { describe, it, expect } from 'vitest';
import { createGraph } from '@knowvah/dot-engine';
import type { Graph } from '@knowvah/dot-engine';
import { addClusters, addNodes, firstEncounterOrder } from '../../../src/core/graph-layout-build.js';
import type { DotInputGraph } from '../../../src/core/graph-layout.js';

/**
 * G7 T7 (`plans/g7-borderpoint-rank/decision-journal.md`, T5 root-cause row +
 * T7 row): white-box structural tests for `addClusters`'s port of jar's full
 * `ClusterDotString` 4-layer protection nesting (outer "a"/"p0" ancestor
 * pair, inner "i"/"p1" pair — `~/git/plantuml/.../svek/ClusterDotString
 * .java:91-201`) and the parent-resolution fix (a child cluster nests inside
 * the parent's INNERMOST active wrapper, not its outer `main` handle).
 *
 * Asserts the exact `subgraph` name tree @knowvah/dot-engine's builder receives —
 * the numeric px consequences of this same mechanism are covered
 * black-box in `graph-layout.test.ts`'s "cluster inner margin levels"
 * describe block (that file also owns the DOT-parity/issue-08 blindness
 * proof via the public `layoutGraph()`/`DotLayoutResult.clusters` surface;
 * this file additionally proves it at the subgraph-name level, since
 * `layoutGraph()` filters unmapped names before a caller could observe
 * them either way).
 */

/** Collects every subgraph name reachable from `g`, depth-first, as a flat
 *  list of `parent > child > ...` path strings — cheap, order-preserving,
 *  and easy to assert exact nesting on without hand-walking `Map`s. */
function subgraphPaths(g: Graph, prefix = ''): string[] {
  const paths: string[] = [];
  for (const [name, sub] of g.subgraphs) {
    const path = prefix === '' ? name : `${prefix} > ${name}`;
    paths.push(path);
    paths.push(...subgraphPaths(sub, path));
  }
  return paths;
}

function build(input: DotInputGraph): Graph {
  const b = createGraph({ directed: true });
  addClusters(b, input);
  return b.graph;
}

describe('addClusters — protection-wrapper firing conditions (G7 T7)', () => {
  it('no innerMarginLevels: emits only the plain cluster subgraph, no wrappers', () => {
    const input: DotInputGraph = {
      nodes: [{ id: 'a', width: 1, height: 1 }],
      edges: [],
      clusters: [{ id: 'grp', nodeIds: ['a'] }],
    };
    expect(subgraphPaths(build(input))).toEqual(['cluster0']);
  });

  it('innerMarginLevels: 1 (untouched): wraps with "p0" (outer) and "p1" (inner) only — no "a"/"i"', () => {
    const input: DotInputGraph = {
      nodes: [{ id: 'a', width: 1, height: 1 }],
      edges: [],
      clusters: [{ id: 'grp', nodeIds: ['a'], innerMarginLevels: 1 }],
    };
    expect(subgraphPaths(build(input))).toEqual([
      'cluster0p0',
      'cluster0p0 > cluster0',
      'cluster0p0 > cluster0 > cluster0p1',
    ]);
  });

  it('innerMarginLevels: 2 (touched): wraps with the full "a" > "p0" > main > "i" > "p1" chain', () => {
    const input: DotInputGraph = {
      nodes: [{ id: 'a', width: 1, height: 1 }],
      edges: [],
      clusters: [{ id: 'grp', nodeIds: ['a'], innerMarginLevels: 2 }],
    };
    expect(subgraphPaths(build(input))).toEqual([
      'cluster0a',
      'cluster0a > cluster0p0',
      'cluster0a > cluster0p0 > cluster0',
      'cluster0a > cluster0p0 > cluster0 > cluster0i',
      'cluster0a > cluster0p0 > cluster0 > cluster0i > cluster0p1',
    ]);
  });
});

describe('addClusters — parent-resolution into the innermost wrap (G7 T5/T7)', () => {
  it('nests a child cluster inside the PARENT innermost handle ("p1"), not the outer "main"/"a" handle', () => {
    // Mirrors pesita-10-dene726's real shape: `nasreq_auth` (touched, levels
    // 2) contains `AA` as a direct child cluster. Before the T7 fix,
    // `builderFor`'s parent lookup returned the parent's OUTER `main`
    // handle (cached before its own "i"/"p1" wrap existed), so `AA` nested
    // as a SIBLING of `nasreq_authi`/`nasreq_authp1` instead of inside them.
    const input: DotInputGraph = {
      nodes: [{ id: 'x', width: 1, height: 1 }],
      edges: [],
      clusters: [
        { id: 'parent', nodeIds: [], innerMarginLevels: 2 },
        { id: 'child', nodeIds: ['x'], parentId: 'parent' },
      ],
    };
    const paths = subgraphPaths(build(input));
    // The child ("cluster1") must appear on a path descending through
    // BOTH the parent's outer wrappers (a, p0) AND its inner wrappers
    // (i, p1) — anything less means it escaped the innermost handle.
    expect(paths).toContain(
      'cluster0a > cluster0p0 > cluster0 > cluster0i > cluster0p1 > cluster1',
    );
    // And it must NOT appear anywhere else (no stray sibling placement).
    expect(paths.filter((p) => p.includes('cluster1'))).toEqual([
      'cluster0a > cluster0p0 > cluster0 > cluster0i > cluster0p1 > cluster1',
    ]);
  });

  it('a child of an UNWRAPPED parent (no innerMarginLevels) still nests directly under it (unchanged)', () => {
    const input: DotInputGraph = {
      nodes: [{ id: 'x', width: 1, height: 1 }],
      edges: [],
      clusters: [
        { id: 'parent', nodeIds: [] },
        { id: 'child', nodeIds: ['x'], parentId: 'parent' },
      ],
    };
    expect(subgraphPaths(build(input))).toEqual(['cluster0', 'cluster0 > cluster1']);
  });
});

describe('addClusters — unwrappedNodeId stays outside the protection wrap (G7 T7 regression)', () => {
  it('places the anchor node as a direct member of "main", not inside "i"/"p1"', () => {
    const input: DotInputGraph = {
      nodes: [
        { id: 'anchor', width: 1, height: 1 },
        { id: 'a', width: 1, height: 1 },
      ],
      edges: [],
      clusters: [
        { id: 'grp', nodeIds: ['anchor', 'a'], innerMarginLevels: 2, unwrappedNodeId: 'anchor' },
      ],
    };
    const b = createGraph({ directed: true });
    addClusters(b, input);
    // main = cluster0a > cluster0p0 > cluster0; innermost = ...i > ...p1.
    const a = b.graph.subgraphs.get('cluster0a')!;
    const p0 = a.subgraphs.get('cluster0p0')!;
    const main = p0.subgraphs.get('cluster0')!;
    const i = main.subgraphs.get('cluster0i')!;
    const p1 = i.subgraphs.get('cluster0p1')!;
    // cgraph subgraph-membership semantics: a node declared in a NESTED
    // subgraph is also a transitive member of every ANCESTOR subgraph
    // (`agsubnode` walks up to root) -- so 'a' (declared at `p1`) correctly
    // shows up in `main.nodes` too. The one asymmetric, diagnostic check is
    // the reverse: 'anchor' (declared at `main` directly, never descending
    // into `p1`) must be ABSENT from `p1.nodes` -- membership never
    // propagates downward.
    expect([...main.nodes.keys()]).toContain('anchor');
    expect([...p1.nodes.keys()]).toContain('a');
    expect([...p1.nodes.keys()]).not.toContain('anchor');
  });
});

describe('addClusters — issue-08 rank-name regression lock (docs/graphviz-issues/08)', () => {
  it('every protection-wrapper subgraph name is `cluster<N><suffix>` — never bare `cluster<N>` for anything but the real cluster', () => {
    // The oracle DOT-parity comparator's `parseClusters` treats ANY subgraph
    // whose name matches `^cluster\d+$` as a real cluster
    // (tests/oracle/svek-dot.ts). Wrapper names MUST carry a trailing
    // letter suffix (a/p0/i/p1) so they never collide with that pattern —
    // this is what keeps the new outer "a"/"p0" layer (and the pre-existing
    // inner "i"/"p1" layer) structurally invisible to the DOT-parity gate,
    // same as jar's own protection wrappers.
    const input: DotInputGraph = {
      nodes: [{ id: 'a', width: 1, height: 1 }],
      edges: [],
      clusters: [{ id: 'grp', nodeIds: ['a'], innerMarginLevels: 2 }],
    };
    const paths = subgraphPaths(build(input));
    const bareClusterPattern = /^cluster\d+$/;
    const names = paths.map((p) => p.split(' > ').at(-1)!);
    const bareMatches = names.filter((n) => bareClusterPattern.test(n));
    // Exactly one bare `cluster<N>` name may exist per real input cluster —
    // the cluster's own `main` handle. Every wrapper name must be excluded.
    expect(bareMatches).toEqual(['cluster0']);
  });
});

/**
 * G8 T1b (`plans/g8-label-placement/spec.md` §T1b): `ClusterDotString
 * .printRanks` (`Cluster.RANK_SOURCE`/`RANK_SINK`,
 * `ClusterDotString.java:136-137,254-287`) -- a border-point (entry/exit
 * -point) composite's direct port children get a REAL graphviz
 * `{rank=source|sink; <ids>;}` constraint scoped to the cluster's own
 * subgraph. Pre-fix, `DotInputCluster.portRanks` was wired to the Svek-DOT
 * TEXT emitter only; `addClusters` (the REAL @knowvah/dot-engine layout seam) never
 * read it, so every border-point composite's real graphviz rank constraint
 * was silently absent from actual layout -- the root cause of
 * pesita-10-dene726's mincross-order defect (jar-verified: this constraint
 * ALONE, independent of the "ee"/"i"/"a" wrapper nesting, flips the
 * `Idle`/`Reanimate`/`Closing` cycle's mincross order to jar-exact).
 */
describe('addClusters — portRanks rank constraint (G8 T1b)', () => {
  it('no portRanks: no rank-group subgraph is created (backward compatible)', () => {
    const input: DotInputGraph = {
      nodes: [{ id: 'a', width: 1, height: 1 }],
      edges: [],
      clusters: [{ id: 'grp', nodeIds: ['a'] }],
    };
    expect(subgraphPaths(build(input))).toEqual(['cluster0']);
  });

  it('one portRanks entry (portRanksLabelOnEe): the border-point branch adds the rank subgraph AND an "ee" title wrapper under "main"', () => {
    // G7 T14b: `portRanksLabelOnEe: true` now selects the FULL ee/i-wrapped
    // border-point branch (`ClusterDotString.java:91-201,254-287`), which
    // SUPERSEDES G8/T1b's own bare-rank-subgraph-only wiring for this exact
    // case -- `main` therefore carries TWO subgraphs (the rank group AND
    // `cluster0ee`), not one; genuine PORTIN/PORTOUT ports (`portRanks`
    // WITHOUT `portRanksLabelOnEe`, the next two tests below) still take the
    // unchanged, bare-rank-subgraph-only path this test previously asserted.
    const input: DotInputGraph = {
      nodes: [
        { id: 'exitPoint', width: 1, height: 1 },
        { id: 'anchor', width: 1, height: 1 },
      ],
      edges: [],
      clusters: [
        {
          id: 'grp',
          nodeIds: ['exitPoint', 'anchor'],
          portRanks: [{ rank: 'sink', nodeIds: ['exitPoint'] }],
          portAnchorId: 'anchor',
          portRanksLabelOnEe: true,
        },
      ],
    };
    const b = createGraph({ directed: true });
    addClusters(b, input);
    const main = b.graph.subgraphs.get('cluster0')!;
    const subs = [...main.subgraphs.values()];
    expect(subs).toHaveLength(2);
    const ee = main.subgraphs.get('cluster0ee')!;
    expect(ee).toBeDefined();
    const rankSub = subs.find((sg) => sg !== ee)!;
    // Never "cluster"-prefixed -- @knowvah/dot-engine's cluster detection is a bare
    // `name.toLowerCase().startsWith('cluster')` check
    // (@knowvah/dot-engine/src/layout/dot/rank.ts): an earlier attempt named this
    // subgraph `cluster0ranksink`, which itself starts with "cluster" and so
    // was silently promoted to a real nested CLUSTER, reproducing the wrong
    // mincross order despite the constraint being present.
    expect(rankSub.name.toLowerCase().startsWith('cluster')).toBe(false);
    expect(rankSub.attrs.get('rank')).toBe('sink');
    expect([...rankSub.nodes.keys()]).toEqual(['exitPoint']);
    // Membership propagates up to `main` too (cgraph subgraph semantics).
    expect([...main.nodes.keys()]).toContain('exitPoint');
    // The anchor (non-port remainder) lands in `ee`, not `main` directly --
    // no `borderPointAncestorWrap`, so `innermost === ee` (no "i" nesting).
    expect([...ee.nodes.keys()]).toContain('anchor');
  });

  it('two portRanks entries (source + sink): each gets its own rank-group subgraph', () => {
    const input: DotInputGraph = {
      nodes: [
        { id: 'entryPoint', width: 1, height: 1 },
        { id: 'exitPoint', width: 1, height: 1 },
      ],
      edges: [],
      clusters: [
        {
          id: 'grp',
          nodeIds: ['entryPoint', 'exitPoint'],
          portRanks: [
            { rank: 'source', nodeIds: ['entryPoint'] },
            { rank: 'sink', nodeIds: ['exitPoint'] },
          ],
        },
      ],
    };
    const b = createGraph({ directed: true });
    addClusters(b, input);
    const main = b.graph.subgraphs.get('cluster0')!;
    const ranks = [...main.subgraphs.values()].map((sg) => sg.attrs.get('rank'));
    expect(ranks.sort()).toEqual(['sink', 'source']);
  });

  it('multiple clusters with portRanks get distinct rank-group subgraph names (no id collision)', () => {
    const input: DotInputGraph = {
      nodes: [
        { id: 'x1', width: 1, height: 1 },
        { id: 'x2', width: 1, height: 1 },
      ],
      edges: [],
      clusters: [
        { id: 'grp1', nodeIds: ['x1'], portRanks: [{ rank: 'sink', nodeIds: ['x1'] }] },
        { id: 'grp2', nodeIds: ['x2'], portRanks: [{ rank: 'sink', nodeIds: ['x2'] }] },
      ],
    };
    const b = createGraph({ directed: true });
    addClusters(b, input);
    const main1 = b.graph.subgraphs.get('cluster0')!;
    const main2 = b.graph.subgraphs.get('cluster1')!;
    const name1 = [...main1.subgraphs.keys()][0]!;
    const name2 = [...main2.subgraphs.keys()][0]!;
    expect(name1).not.toEqual(name2);
  });
});

/**
 * G7 T16 (`plans/g7-borderpoint-rank/batch-6/overview.md`, T16 row;
 * `plans/g6-cluster-geometry/batch-4/withlabel-derivation.md` §4 has the full
 * jar-verified derivation): `firstEncounterOrder` mirrors jar's
 * `Bibliotekon.java#addLine`/`DotStringFactory.java#createDotString`
 * `lines0`-before-everything-else statement order — every node touched by a
 * `minLen===0` edge (`link.getLength()==1`, `CommandLinkStateCommon.java:
 * 176-182`'s LEFT/RIGHT-direction rule) is declared to @knowvah/dot-engine's builder
 * BEFORE any other node, in edge-encounter order, so this port's node
 * CREATION order matches the order graphviz's cycle-breaking DFS
 * (`dotgen/acyclic.c`) would see in jar's real DOT text.
 */
describe('firstEncounterOrder — jar lines0 node-creation order (G7 T16)', () => {
  it('no minLen===0 edges: returns the input node array unchanged (acyclic-pass regression guard)', () => {
    const input: DotInputGraph = {
      nodes: [{ id: 'a', width: 1, height: 1 }, { id: 'b', width: 1, height: 1 }],
      edges: [{ id: 'e1', from: 'a', to: 'b', attributes: { minLen: 1 } }],
      // clusters/other fields absent -- irrelevant to this pure function.
    };
    // G9/T4: compared by VALUE, not identity. The function now walks the
    // cluster tree to reproduce jar's full declaration order, so it always
    // builds a fresh array; the property this guards — an input with no
    // `minLen === 0` edge and no clusters keeps its array order — is
    // unchanged, and is what `acyclic.c`'s DFS root actually depends on.
    expect(firstEncounterOrder(input).map((n) => n.id)).toEqual(input.nodes.map((n) => n.id));
  });

  it('one minLen===0 edge: its tail then its head come first, remaining nodes keep their existing order', () => {
    const input: DotInputGraph = {
      nodes: [
        { id: 'first', width: 1, height: 1 },
        { id: 'tail', width: 1, height: 1 },
        { id: 'head', width: 1, height: 1 },
        { id: 'last', width: 1, height: 1 },
      ],
      edges: [{ id: 'e1', from: 'tail', to: 'head', attributes: { minLen: 0 } }],
    };
    expect(firstEncounterOrder(input).map((n) => n.id)).toEqual(['tail', 'head', 'first', 'last']);
  });

  it('pesita/AA shape: two minLen===0 reversed edges reorder the 4-node cycle to jar\'s DFS-root order', () => {
    // Mirrors pesita-10-dene726's `nasreq_auth` pass (G7 T13 derivation):
    // `Closing->Idle` and `__zaent_AA->Reanimate`, both T12-reversed
    // (`-left-`) transitions with length===1/minLen===0. Jar's cached
    // `svek-3.dot` declares `sh0012->sh0010` (Closing->Idle) as the file's
    // literal first statement, making `Closing` the DFS root.
    const input: DotInputGraph = {
      nodes: [
        { id: 'aa_ok_ex', width: 1, height: 1 },
        { id: '__zaent_AA', width: 1, height: 1 },
        { id: 'Idle', width: 1, height: 1 },
        { id: 'Reanimate', width: 1, height: 1 },
        { id: 'Closing', width: 1, height: 1 },
      ],
      edges: [
        { id: 'e1', from: 'Closing', to: 'Idle', attributes: { minLen: 0 } },
        { id: 'e2', from: '__zaent_AA', to: 'Reanimate', attributes: { minLen: 0 } },
        { id: 'e3', from: 'Idle', to: '__zaent_AA', attributes: { minLen: 1 } },
      ],
    };
    expect(firstEncounterOrder(input).map((n) => n.id)).toEqual([
      'Closing',
      'Idle',
      '__zaent_AA',
      'Reanimate',
      'aa_ok_ex',
    ]);
  });

  it('a node touched by multiple minLen===0 edges is placed once, at its first occurrence', () => {
    const input: DotInputGraph = {
      nodes: [
        { id: 'a', width: 1, height: 1 },
        { id: 'b', width: 1, height: 1 },
        { id: 'c', width: 1, height: 1 },
      ],
      edges: [
        { id: 'e1', from: 'a', to: 'b', attributes: { minLen: 0 } },
        { id: 'e2', from: 'b', to: 'c', attributes: { minLen: 0 } },
      ],
    };
    expect(firstEncounterOrder(input).map((n) => n.id)).toEqual(['a', 'b', 'c']);
  });

  it('a dangling minLen===0 edge (unknown endpoint) is skipped without throwing — addEdges owns dropping it', () => {
    const input: DotInputGraph = {
      nodes: [{ id: 'a', width: 1, height: 1 }, { id: 'b', width: 1, height: 1 }],
      edges: [{ id: 'e1', from: 'a', to: 'ghost', attributes: { minLen: 0 } }],
    };
    expect(firstEncounterOrder(input).map((n) => n.id)).toEqual(['a', 'b']);
  });

  it('addNodes declares reordered nodes to the builder before any other node (integration)', () => {
    const input: DotInputGraph = {
      nodes: [
        { id: 'first', width: 10, height: 10 },
        { id: 'tail', width: 10, height: 10 },
        { id: 'head', width: 10, height: 10 },
      ],
      edges: [{ id: 'e1', from: 'tail', to: 'head', attributes: { minLen: 0 } }],
    };
    const b = createGraph({ directed: true });
    addNodes(b, input);
    expect([...b.graph.nodes.keys()]).toEqual(['tail', 'head', 'first']);
  });
});

describe('addClusters — title-table FIXEDSIZE dims truncate, never round (G8 T1c)', () => {
  // `ClusterDotString.java:124` -> `SvekEdge.appendTable`'s own `(int)` cast
  // (`SvekEdge.java:504-507`) truncates BOTH dims towards zero before they
  // reach dot's FIXEDSIZE table -- jar never rounds. Verified against jar's
  // own cached DOT for bajelo-54-dixe684 (Run: 107.8875 -> WIDTH="107", NOT
  // "108") and kotagu-43-miza629 (SubComposite: 91.875 -> WIDTH="91", NOT
  // "92") -- see spec.md's "T1c" section for the full derivation.
  it('a fractional width/height >= .5 floors down, not up (would round up if using Math.round)', () => {
    const input: DotInputGraph = {
      nodes: [{ id: 'a', width: 1, height: 1 }],
      edges: [],
      clusters: [
        { id: 'grp', nodeIds: ['a'], titleTableWidth: 107.8875, titleTableHeight: 42 },
      ],
    };
    const b = createGraph({ directed: true });
    addClusters(b, input);
    const main = b.graph.subgraphs.get('cluster0')!;
    const label = main.attrs.get('label')!;
    expect(label).toContain('WIDTH="107"');
    expect(label).not.toContain('WIDTH="108"');
    expect(label).toContain('HEIGHT="42"');
  });

  it('reproduces the kotagu-43-miza629 SubComposite ground truth (91.875 -> 91)', () => {
    const input: DotInputGraph = {
      nodes: [{ id: 'a', width: 1, height: 1 }],
      edges: [],
      clusters: [
        { id: 'grp', nodeIds: ['a'], titleTableWidth: 91.875, titleTableHeight: 9 },
      ],
    };
    const b = createGraph({ directed: true });
    addClusters(b, input);
    const label = b.graph.subgraphs.get('cluster0')!.attrs.get('label')!;
    expect(label).toContain('WIDTH="91"');
    expect(label).toContain('HEIGHT="9"');
  });
});
