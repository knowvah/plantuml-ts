/**
 * Feature: a BORDER-POINT composite's title sits one pixel lower than a plain
 * composite's, because the two get their title position from different places.
 *
 * A plain composite takes it from graphviz's own cluster label, which
 * `DotStringFactory` hands to `Cluster#setTitlePosition` — jar-verified at
 * `y + 4 + textAscent` (`decede-10-buvu414`'s `E`, `bajelo-54-dixe684`'s
 * `Track_FSM.Run`, plus a 98-sample corpus probe, all recorded on
 * `CLUSTER_TITLE_BASELINE_MARGIN`).
 *
 * A composite whose title moved onto its `${id}ee` subgraph never gets one:
 * `Cluster#manageEntryExitPoint` computes it as `rectangleArea.getMinY() +
 * IEntityImage.MARGIN` (`Cluster.java:435`, `IEntityImage.java:45` — 5), and
 * `drawUState` draws the title block's top there (`:496-498`). Hence 15.8889
 * against 14.8889 for the same font.
 *
 * G7 T14b measured that split and deliberately deferred it; this pins it.
 * `temuxi-28-cega322`'s four composite titles were the last shapes in that
 * fixture not matching jar, and neither the census nor the positional-error
 * metric can see them — a `childCount` recursion stop truncates first — so
 * this test is the gate.
 */
import { describe, it, expect } from 'vitest';
import { layoutState } from '../../../src/diagrams/state/layout.js';
import type { StateDiagramAST, State } from '../../../src/diagrams/state/ast.js';
import type { StateNodeGeo } from '../../../src/diagrams/state/state-geo-types.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { FormulaMeasurer } from '../../../src/core/measurer.js';

const measurer = new FormulaMeasurer();

function state(id: string, overrides: Partial<State> = {}): State {
  return { id, display: id, kind: 'normal', children: [], concurrentRegions: [], transitions: [], ...overrides };
}

/** `state C { … }` with `withPin` deciding whether one child is a border
 *  point, which is the whole difference between the two upstream paths. The
 *  plain case needs an edge crossing C's boundary, or C resolves as its own
 *  layout pass and takes the autonom title rule instead of a cluster's. */
function diagram(withPin: boolean): StateDiagramAST {
  const inner = withPin
    ? [state('pin', { stereotype: 'entrypoint' }), state('m')]
    : [state('m'), state('n')];
  return {
    states: [state('C', { children: inner }), state('X')],
    transitions: [
      { from: 'm', to: withPin ? 'pin' : 'n' },
      { from: 'X', to: 'm' },
    ],
  };
}

function findComposite(nodes: readonly StateNodeGeo[]): StateNodeGeo | undefined {
  for (const n of nodes) {
    if (n.id === 'C') return n;
    const hit = findComposite(n.children);
    if (hit !== undefined) return hit;
  }
  return undefined;
}

describe('composite title baseline — the border-point family sits 1px lower', () => {
  it('gives a border-point composite `IEntityImage.MARGIN`', () => {
    const c = findComposite(layoutState(diagram(true), defaultTheme, measurer).states)!;
    expect(c.clusterTitleBaselineMargin).toBe(5);
  });

  it('leaves a plain composite on the ClusterHeader path`s own 4', () => {
    const c = findComposite(layoutState(diagram(false), defaultTheme, measurer).states)!;
    expect(c.clusterTitleBaselineMargin).toBe(4);
  });
});
