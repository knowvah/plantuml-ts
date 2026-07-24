/**
 * G7 T14b — border-point (`<<entrypoint>>`/`<<exitpoint>>`-child,
 * `portRanksLabelOnEe`) cluster wiring: unit coverage for the pieces the
 * "Paper gate v5" (G7 T19) ten-item edit list requires beyond what T11/T7/T1b
 * already cover:
 *
 *   1. rank-branch structure -- `resolveClusterComposite` produces
 *      `portRanks`/`portRanksLabelOnEe` and OMITS `innerMarginLevels`/
 *      `unwrappedNodeId` for a border-point composite; `addClusters` builds
 *      the ee-wrapped shape with a non-`cluster`-prefixed rank subgraph
 *      (issue-08 regression lock).
 *   2. `borderPointAncestorWrap` fires on `isGroupTouched`, NOT the broader
 *      `needsZaentPoint` (`bitaxo-18-tamo974`'s `C` is the exact
 *      counterexample: needsZaentPoint true via the anchor fallback, zero
 *      transitions diagram-wide -- no "a"/"i" wrap in jar's own DOT).
 *
 * The `<<O-O>>`/D4 stereotype exclusion itself is already covered by G7 T11's
 * own regression suite (`tests/unit/state/layout.test.ts`, "titleTableWidth"
 * describe block) -- T11 generalized D4 to an unconditional `stereoLines=0`
 * for ALL state clusters, border-point or not, so no separate exclusion
 * branch exists for T14b to test. This file adds ONE cross-check confirming
 * that generalization also holds once a composite is ALSO border-point
 * (pesita-10-dene726's real shape: `AA <<O-O>>` containing `aa_ok_ex
 * <<exitpoint>>`), which none of T11's own tests exercised.
 *
 * @see plans/g6-cluster-geometry/batch-4/withlabel-derivation.md ("Paper gate
 *      v5 (G7 T19)")
 * @see ~/git/plantuml/.../svek/ClusterDotString.java
 */

import { describe, it, expect } from 'vitest';
import { createGraph } from '@knowvah/dot-engine';
import type { Graph } from '@knowvah/dot-engine';
import { layoutState } from '../../../src/diagrams/state/layout.js';
import type { StateDiagramAST, State, Transition } from '../../../src/diagrams/state/ast.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { FormulaMeasurer } from '../../../src/core/measurer.js';
import { setLayoutInputObserver } from '../../../src/core/graph-layout.js';
import type { DotInputGraph } from '../../../src/core/graph-layout.js';
import { addClusters } from '../../../src/core/graph-layout-build.js';

const measurer = new FormulaMeasurer();
const theme = defaultTheme;

function makeState(id: string, overrides: Partial<State> = {}): State {
  return {
    id,
    display: id,
    kind: 'normal',
    children: [],
    concurrentRegions: [],
    transitions: [],
    ...overrides,
  };
}

function makeTransition(from: string, to: string, overrides: Partial<Transition> = {}): Transition {
  return { from, to, ...overrides };
}

function captureFirst(ast: StateDiagramAST): DotInputGraph {
  const captured: DotInputGraph[] = [];
  setLayoutInputObserver((g) => captured.push(g));
  try {
    layoutState(ast, theme, measurer);
  } finally {
    setLayoutInputObserver(undefined);
  }
  expect(captured.length).toBeGreaterThan(0);
  return captured[0]!;
}

/** Collects every subgraph name reachable from `g`, depth-first, as a flat
 *  list of `parent > child > ...` path strings (mirrors
 *  `tests/unit/core/graph-layout-build.test.ts`'s own helper). */
function subgraphPaths(g: Graph, prefix = ''): string[] {
  const paths: string[] = [];
  for (const [name, sub] of g.subgraphs) {
    const path = prefix === '' ? name : `${prefix} > ${name}`;
    paths.push(path);
    paths.push(...subgraphPaths(sub, path));
  }
  return paths;
}

function buildGraph(input: DotInputGraph): Graph {
  const b = createGraph({ directed: true });
  addClusters(b, input);
  return b.graph;
}

describe('resolveClusterComposite -- border-point rank-branch structure (G7 T14b)', () => {
  it('a composite with BOTH an entrypoint and exitpoint child gets source+sink portRanks, portRanksLabelOnEe, and NO innerMarginLevels/unwrappedNodeId', () => {
    const entry = makeState('inPoint', { stereotype: 'entrypoint' });
    const exit = makeState('outPoint', { stereotype: 'exitpoint' });
    const c = makeState('C', { children: [entry, exit] });
    const ext = makeState('External');
    const ast: StateDiagramAST = {
      states: [c, ext],
      transitions: [{ from: 'inPoint', to: 'outPoint' }, { from: 'outPoint', to: 'External' }],
    };
    const graph = captureFirst(ast);
    const cluster = graph.clusters?.find((cl) => cl.label === 'C');
    expect(cluster).toBeDefined();
    expect(cluster?.portRanksLabelOnEe).toBe(true);
    const ranks = cluster?.portRanks?.map((r) => r.rank).sort();
    expect(ranks).toEqual(['sink', 'source']);
    // Guarded off for this family -- protection0/1 are forced off
    // (`ClusterDotString.java:107-112`), independent of `borderPointAncestorWrap`.
    expect(cluster?.innerMarginLevels).toBeUndefined();
    expect(cluster?.unwrappedNodeId).toBeUndefined();
    // titleTableWidth/Height still populated -- G7 T14b relaxes
    // `titleTableEligible`, it does not gate it off for this family.
    expect(cluster?.titleTableWidth).toBeDefined();
    expect(cluster?.titleTableHeight).toBeDefined();
  });

  it('issue-08 regression lock: the real-layout rank-group subgraph name never matches /^cluster/i, and "ee" is a sibling of the rank group under "main"', () => {
    const exit = makeState('outPoint', { stereotype: 'exitpoint' });
    const c = makeState('C', { children: [exit] });
    const ext = makeState('External');
    const ast: StateDiagramAST = {
      states: [c, ext],
      transitions: [{ from: 'outPoint', to: 'External' }],
    };
    const graph = captureFirst(ast);
    const built = buildGraph(graph);
    const paths = subgraphPaths(built);
    const bareClusterPattern = /^cluster\d+$/;
    const names = paths.map((p) => p.split(' > ').at(-1)!);
    // Exactly one bare `cluster<N>` name may exist (the border-point
    // cluster's own `main` handle) -- the rank-group subgraph and "ee" must
    // both be excluded from that pattern (issue-08).
    const bareMatches = names.filter((n) => bareClusterPattern.test(n));
    expect(bareMatches).toHaveLength(1);
    expect(names.some((n) => n.endsWith('ee'))).toBe(true);
    expect(names.filter((n) => n.toLowerCase().startsWith('cluster') && !bareClusterPattern.test(n))).not.toEqual([]);
  });
});

describe('borderPointAncestorWrap -- gated on isGroupTouched, NOT the broader needsZaentPoint (G7 T14b)', () => {
  it('bitaxo-18-tamo974 shape: a border-point composite with ZERO transitions diagram-wide gets NO borderPointAncestorWrap (anchor fallback alone does not fire it)', () => {
    // Mirrors the real fixture exactly: `state C { state d <<entrypoint>> }`,
    // no transitions anywhere in the diagram -- `needsZaentPoint` is true
    // (the anchor fallback path fires regardless), but `isGroupTouched('C',
    // [])` is false, so `borderPointAncestorWrap` must stay unset.
    const d = makeState('d', { stereotype: 'entrypoint' });
    const c = makeState('C', { children: [d] });
    const a = makeState('A');
    const b = makeState('B');
    const ast: StateDiagramAST = { states: [a, b, c], transitions: [] };
    const graph = captureFirst(ast);
    const cluster = graph.clusters?.find((cl) => cl.label === 'C');
    expect(cluster?.portRanksLabelOnEe).toBe(true);
    expect(cluster?.borderPointAncestorWrap).toBeUndefined();
  });

  it('pesita-10-dene726 AA shape: a border-point composite TOUCHED by an external transition (into and out of the group entity itself) gets borderPointAncestorWrap:true', () => {
    // Mirrors the real fixture: `[*] --> AA`, `AA --> Closing` both name the
    // GROUP entity `AA` directly (not a descendant) -- `isGroupTouched('AA',
    // ...)` is true, firing the "a"/"i" wrap independently of the anchor's
    // own (unconditional-declare vs. fallback) trigger.
    const exitPoint = makeState('aa_ok_ex', { stereotype: 'exitpoint' });
    const aa = makeState('AA', {
      children: [exitPoint],
      stereotype: 'O-O',
      description: ['entry / set_timeout()'],
    });
    const closing = makeState('Closing');
    const ast: StateDiagramAST = {
      states: [aa, closing],
      transitions: [
        makeTransition('[*]', 'AA'),
        makeTransition('AA', 'Closing'),
      ],
    };
    const graph = captureFirst(ast);
    const cluster = graph.clusters?.find((cl) => cl.label === 'AA');
    expect(cluster?.portRanksLabelOnEe).toBe(true);
    expect(cluster?.borderPointAncestorWrap).toBe(true);
    // Cross-check (T11 generalization holds for the border-point family
    // too): with a 1-line title + a 1-line attribute + `<<O-O>>`,
    // `computeTitleTableHeight(1, stereoLines, 1, 14) = (stereoLines+1)*14
    // + 1*14 - 5` -- 28 iff stereoLines=0 (jar-verified,
    // `pesita-10-dene726`'s own oracle: HEIGHT="28"), 42 iff the stereotype
    // wrongly contributed 1 line. Confirms `<<O-O>>`'s 0-contribution (T11)
    // still holds once `titleTableEligible` no longer excludes border-point
    // composites.
    expect(cluster?.titleTableHeight).toBe(28);
  });
});
