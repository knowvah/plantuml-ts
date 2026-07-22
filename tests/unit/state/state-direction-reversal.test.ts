/**
 * G7 T12 — `Transition.direction` DOT edge reversal (`state-composite-pass
 * .ts#addLevelEdges`/`#sweepOrphanEdges`/`#buildLevelTransitionGeos`).
 *
 * jar's `CommandLinkStateCommon#executeArg`: `if (dir == Direction.LEFT ||
 * dir == Direction.UP) link = link.getInv();` — a `-left-`/`-up-` transition
 * (or a bare reverse arrow, `A <-- B`, whose `getDefaultDirection()` is
 * LEFT) has its DOT tail/head swapped so graphviz ranks the semantic TARGET
 * above the semantic SOURCE; `-right-`/`-down-` (and every un-hinted `-->`)
 * are left exactly as parsed. `state-composite-pass.ts` un-swaps the routed
 * points/resolved endpoint ids back to semantic source->target order before
 * building the `TransitionGeo`, so `points[length-1]` (the arrowhead
 * convention `renderer-arrowhead.ts` already relies on) stays the semantic
 * TARGET regardless of the underlying DOT swap.
 *
 * Every AST here is built with a dummy composite ancestor
 * (`makeState('Dummy', { children: [...] })`) so `layoutState` routes
 * through the COMPOSITE pipeline (`hasAnyComposite`, layout.ts) — this
 * mission's write-set — rather than the separate flat pipeline, which never
 * calls `addLevelEdges`/`sweepOrphanEdges` at all.
 *
 * @see ~/git/plantuml/.../statediagram/command/CommandLinkStateCommon.java#executeArg
 * @see ~/git/plantuml/.../abel/Link.java#getInv
 */
import { describe, it, expect } from 'vitest';
import { layoutState } from '../../../src/diagrams/state/layout.js';
import type { StateDiagramAST, State, Transition } from '../../../src/diagrams/state/ast.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { FormulaMeasurer } from '../../../src/core/measurer.js';
import { setLayoutInputObserver } from '../../../src/core/graph-layout.js';
import type { DotInputGraph, DotInputEdge } from '../../../src/core/graph-layout.js';

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

/** Forces `hasAnyComposite` (layout.ts) true without affecting the edges
 *  under test — the sole purpose is routing `layoutState` through the
 *  composite pipeline (`state-composite-pass.ts`), this mission's write-set. */
const DUMMY_COMPOSITE = makeState('Dummy', { children: [makeState('DummyInner')] });

/** Captures every `DotInputGraph` `layoutGraph()` receives; returns the
 *  LAST one (the top-level pass — `buildTopLevelPass`'s own doc comment:
 *  "dumped LAST, carrying nodesep/ranksep"). Every test in this file whose
 *  transition is declared in `ast.transitions` (the true top scope) has its
 *  edge land in this LAST graph; the "[*] -up-> Composite" (kotagu shape)
 *  test below instead searches `captureAllGraphs` — its transition is
 *  declared inside an AUTONOM composite's own scope, fired as an earlier,
 *  separate pass (`resolveAllAutonomPasses`'s depth-first firing order). */
function captureTopLevelGraph(ast: StateDiagramAST): DotInputGraph {
  const captured = captureAllGraphs(ast);
  const last = captured[captured.length - 1];
  expect(last, 'expected at least one captured layout graph').toBeDefined();
  return last!;
}

/** Every `DotInputGraph` `layoutGraph()` received, in firing order (deepest
 *  autonom pass first, top-level pass last — `buildTopLevelPass`'s own doc
 *  comment). */
function captureAllGraphs(ast: StateDiagramAST): DotInputGraph[] {
  const captured: DotInputGraph[] = [];
  setLayoutInputObserver((g) => captured.push(g));
  try {
    layoutState(ast, theme, measurer);
  } finally {
    setLayoutInputObserver(undefined);
  }
  return captured;
}

function findEdge(graph: DotInputGraph, from: string, to: string): DotInputEdge | undefined {
  return graph.edges.find((e) => e.from === from && e.to === to);
}

// ---------------------------------------------------------------------------
// Un-hinted transitions — unchanged
// ---------------------------------------------------------------------------

describe('addLevelEdges — un-hinted transition (no Transition.direction)', () => {
  const ast: StateDiagramAST = {
    states: [DUMMY_COMPOSITE, makeState('A'), makeState('B')],
    transitions: [makeTransition('A', 'B')],
  };

  it('emits the DOT edge in literal from->to order (not reversed)', () => {
    const graph = captureTopLevelGraph(ast);
    expect(findEdge(graph, 'A', 'B')).toBeDefined();
    expect(findEdge(graph, 'B', 'A')).toBeUndefined();
  });

  it('TransitionGeo.from/to stay semantic source->target', () => {
    const geo = layoutState(ast, theme, measurer);
    const t = geo.transitions.find((tr) => tr.from === 'A' && tr.to === 'B');
    expect(t).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// -up-> — reversed (jar: dir == Direction.UP -> link.getInv())
// ---------------------------------------------------------------------------

describe('addLevelEdges — "-up->" transition (direction: "up")', () => {
  const ast: StateDiagramAST = {
    states: [DUMMY_COMPOSITE, makeState('A'), makeState('B')],
    transitions: [makeTransition('A', 'B', { direction: 'up', length: 2 })],
  };

  it('emits the DOT edge with tail/head swapped (B->A, not A->B)', () => {
    const graph = captureTopLevelGraph(ast);
    expect(findEdge(graph, 'B', 'A')).toBeDefined();
    expect(findEdge(graph, 'A', 'B')).toBeUndefined();
  });

  it('minlen is UNCHANGED by the swap (jar: LinkArg#getInv never touches length)', () => {
    const graph = captureTopLevelGraph(ast);
    const unreversed = { ...ast, transitions: [makeTransition('A', 'B', { length: 2 })] };
    const unreversedGraph = captureTopLevelGraph(unreversed);
    expect(findEdge(graph, 'B', 'A')!.attributes?.minLen).toBe(
      findEdge(unreversedGraph, 'A', 'B')!.attributes?.minLen,
    );
  });

  it('TransitionGeo.from/to stay semantic source->target despite the DOT swap', () => {
    const geo = layoutState(ast, theme, measurer);
    const t = geo.transitions.find((tr) => tr.from === 'A' && tr.to === 'B');
    expect(t, 'TransitionGeo must still report from=A (source) to=B (target)').toBeDefined();
    expect(geo.transitions.find((tr) => tr.from === 'B' && tr.to === 'A')).toBeUndefined();
  });

  it('the target (B) is ranked above the source (A) — B.y < A.y', () => {
    const geo = layoutState(ast, theme, measurer);
    const a = geo.states.find((s) => s.id === 'A');
    const b = geo.states.find((s) => s.id === 'B');
    expect(a).toBeDefined();
    expect(b).toBeDefined();
    expect(b!.y).toBeLessThan(a!.y);
  });

  it('the arrowhead-side endpoint (points[length-1]) still lands at the semantic target (B)', () => {
    const geo = layoutState(ast, theme, measurer);
    const t = geo.transitions.find((tr) => tr.from === 'A' && tr.to === 'B')!;
    const b = geo.states.find((s) => s.id === 'B')!;
    const last = t.points[t.points.length - 1]!;
    const bCenterY = b.y + b.height / 2;
    // The trimmed spline endpoint sits on B's boundary, not its center --
    // assert proximity (within B's own bounding box), not exact equality.
    expect(Math.abs(last.y - bCenterY)).toBeLessThanOrEqual(b.height / 2 + 1);
  });
});

// ---------------------------------------------------------------------------
// -left-> — reversed (jar: dir == Direction.LEFT -> link.getInv())
// ---------------------------------------------------------------------------

describe('addLevelEdges — "-left->" transition (direction: "left")', () => {
  const ast: StateDiagramAST = {
    states: [DUMMY_COMPOSITE, makeState('A'), makeState('B')],
    transitions: [makeTransition('A', 'B', { direction: 'left', length: 1 })],
  };

  it('emits the DOT edge with tail/head swapped (B->A, not A->B)', () => {
    const graph = captureTopLevelGraph(ast);
    expect(findEdge(graph, 'B', 'A')).toBeDefined();
    expect(findEdge(graph, 'A', 'B')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// -down-> / -right-> — NOT reversed (jar only inverts LEFT/UP)
// ---------------------------------------------------------------------------

describe('addLevelEdges — "-down->"/"​-right->" are jar\'s no-op directions', () => {
  it('"-down->" leaves the DOT edge in literal from->to order', () => {
    const ast: StateDiagramAST = {
      states: [DUMMY_COMPOSITE, makeState('A'), makeState('B')],
      transitions: [makeTransition('A', 'B', { direction: 'down', length: 2 })],
    };
    const graph = captureTopLevelGraph(ast);
    expect(findEdge(graph, 'A', 'B')).toBeDefined();
    expect(findEdge(graph, 'B', 'A')).toBeUndefined();
  });

  it('"-right->" leaves the DOT edge in literal from->to order', () => {
    const ast: StateDiagramAST = {
      states: [DUMMY_COMPOSITE, makeState('A'), makeState('B')],
      transitions: [makeTransition('A', 'B', { direction: 'right', length: 1 })],
    };
    const graph = captureTopLevelGraph(ast);
    expect(findEdge(graph, 'A', 'B')).toBeDefined();
    expect(findEdge(graph, 'B', 'A')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Bare reverse arrow (`A <-- B`) — defaults to direction: 'left' (reversed)
// ---------------------------------------------------------------------------

describe('addLevelEdges — bare reverse arrow default direction', () => {
  it('a Transition with direction: "left" from the parser\'s reverse-arrow default reverses the same way as an explicit "-left->"', () => {
    // `state-transitions.ts#parseTransitionLine`: `build(matchToRaw(rev,
    // true), 'left')` -- `A <-- B` parses to `{ from: 'B', to: 'A',
    // direction: 'left' }` (already semantic-order-resolved by the parser;
    // this test starts from that already-resolved shape, matching every
    // OTHER test in this file, which exercises `state-composite-pass.ts`
    // in isolation from the regex layer covered by `state-transitions
    // .test.ts`).
    const ast: StateDiagramAST = {
      states: [DUMMY_COMPOSITE, makeState('A'), makeState('B')],
      transitions: [makeTransition('B', 'A', { direction: 'left', length: 1 })],
    };
    const graph = captureTopLevelGraph(ast);
    expect(findEdge(graph, 'A', 'B')).toBeDefined();
    expect(findEdge(graph, 'B', 'A')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// crossStart/circleEnd decorations stay attached to their own entity
// regardless of the DOT-level swap
// ---------------------------------------------------------------------------

describe('buildLevelTransitionGeos — crossStart/circleEnd survive the swap unchanged', () => {
  it('crossStart (source-side) and circleEnd (target-side) both round-trip for a reversed "-up->" transition', () => {
    const ast: StateDiagramAST = {
      states: [DUMMY_COMPOSITE, makeState('A'), makeState('B')],
      transitions: [
        makeTransition('A', 'B', { direction: 'up', length: 2, crossStart: true, circleEnd: true }),
      ],
    };
    const geo = layoutState(ast, theme, measurer);
    const t = geo.transitions.find((tr) => tr.from === 'A' && tr.to === 'B');
    expect(t).toBeDefined();
    expect(t!.crossStart).toBe(true);
    expect(t!.circleEnd).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Border-point-relevant shape (kotagu-43-miza629): `[*] -up-> Composite`
// ---------------------------------------------------------------------------

describe('addLevelEdges — "[*] -up-> Composite" (kotagu-43-miza629 shape)', () => {
  // Mirrors oracle/goldens/state/kotagu-43-miza629/input.puml's own
  // `CompositeState { ...; [*] -up-> SubComposite; ... }` shape: a `'[*]'`
  // transition, from the enclosing composite's OWN scope, targeting a
  // NESTED composite (SubComposite has real children, so it renders as a
  // `'cluster'` GeoSpec, not a leaf). jar's cached `svek-1.dot:24` emits
  // `zaent0003->sh0011` — SubComposite's own group-anchor node -> `[*]`'s
  // anchor, minlen=1 (`t.length=2` per CommandLinkStateCommon#executeArg:
  // UP does not force queue="-", so length is the real dash count).
  const ast: StateDiagramAST = {
    states: [
      makeState('CompositeState', {
        children: [
          makeState('SubComposite', { children: [makeState('Inner')] }),
        ],
        transitions: [makeTransition('[*]', 'SubComposite', { direction: 'up', length: 2 })],
      }),
    ],
    transitions: [],
  };

  it('reverses the DOT edge to SubComposite-anchor -> [*]-anchor (minlen=1)', () => {
    // CompositeState is its OWN autonom pass boundary (`resolveAllAutonomPasses`
    // fires it separately, deepest-first, BEFORE the outer top-level pass --
    // `buildTopLevelPass`'s own doc comment) -- the `[*] -up-> SubComposite`
    // edge lives in THAT pass's own captured graph, not the outermost one
    // (which only carries CompositeState's own resolved-autonom placeholder
    // node). Find it by shape across every captured pass.
    const graphs = captureAllGraphs(ast);
    const reversedEdge = graphs
      .flatMap((g) => g.edges)
      .find((e) => e.to.includes('init') || e.from.includes('init'));
    expect(reversedEdge, 'expected exactly one edge touching the [*] anchor').toBeDefined();
    // jar-verified direction (`kotagu-43-miza629`'s cached `svek-1.dot:24`,
    // `zaent0003->sh0011`): the anchor for `[*]` (the SOURCE) is the DOT
    // HEAD (`.to`) once reversed -- SubComposite's own anchor (the TARGET)
    // is the DOT TAIL (`.from`).
    expect(reversedEdge!.to.includes('init')).toBe(true);
    expect(reversedEdge!.from.includes('init')).toBe(false);
    expect(reversedEdge!.attributes?.minLen).toBe(1);
  });

  it('TransitionGeo still reports from=[*]-anchor (semantic source) to=SubComposite (semantic target)', () => {
    const geo = layoutState(ast, theme, measurer);
    const sub = geo.states.find((s) => s.id === 'CompositeState')?.children.find((c) => c.id === 'SubComposite');
    expect(sub).toBeDefined();
    // The transition lives on CompositeState's own nested pass -- find it
    // among CompositeState's `.transitions` (mission G4 S5's own
    // transition-nesting field, StateNodeGeo).
    const composite = geo.states.find((s) => s.id === 'CompositeState');
    expect(composite).toBeDefined();
    const t = composite!.transitions?.find((tr) => tr.to === 'SubComposite');
    expect(t, 'expected the [*]->SubComposite transition, semantic order preserved').toBeDefined();
  });
});
