/**
 * Unit tests for the south-cap OPACITY GATE — SI31 T4 (G5), the half that
 * decides whether `layout-ink-extent.ts#addSouthCapInk`'s 1 px applies at
 * all. See `StateNodeGeo.southCapInk`'s own doc comment (state-geo-types.ts)
 * for the full jar derivation.
 *
 * `Cluster.java:459-471` resolves `southBackcolor` from an explicit
 * `ColorType.BACK` override on the group, else the
 * `stateDiagram.state.body` style bucket, which
 * `~/git/plantuml/src/main/resources/skin/plantuml.skin:266-271` defaults to
 * `transparent`. `StyleSignatureBasic#matchAll`
 * (`~/git/plantuml/.../style/StyleSignatureBasic.java:212-216`) admits any
 * declaration whose style names are a SUBSET of that query's
 * `{root, element, stateDiagram, state, body}` — which is why a `state`- or
 * `stateDiagram`-scoped user declaration reaches the SOUTH cap, not just the
 * north/centre bands.
 *
 * The default-skin case (no background set anywhere) is the one SI29 T9
 * regressed by folding the +1 unconditionally, so it is asserted first and
 * asserted as an ABSENT field, not merely a falsy one.
 */
import { describe, it, expect } from 'vitest';
import { layoutState } from '../../../src/diagrams/state/layout.js';
import type { StateDiagramAST, State } from '../../../src/diagrams/state/ast.js';
import type { StateNodeGeo } from '../../../src/diagrams/state/state-geo-types.js';
import { defaultTheme, type Theme } from '../../../src/core/theme.js';
import { FormulaMeasurer } from '../../../src/core/measurer.js';

const measurer = new FormulaMeasurer();

function state(id: string, overrides: Partial<State> = {}): State {
  return { id, display: id, kind: 'normal', children: [], concurrentRegions: [], transitions: [], ...overrides };
}

/** `state C { m n }` plus an outside state, so `C` is a real composite. */
function diagram(compositeOverrides: Partial<State> = {}): StateDiagramAST {
  return {
    states: [state('C', { children: [state('m'), state('n')], ...compositeOverrides }), state('X')],
    transitions: [{ from: 'm', to: 'n' }, { from: 'X', to: 'm' }],
  };
}

function find(nodes: readonly StateNodeGeo[], id: string): StateNodeGeo | undefined {
  for (const n of nodes) {
    if (n.id === id) return n;
    const hit = find(n.children, id);
    if (hit !== undefined) return hit;
  }
  return undefined;
}

function southCapOf(theme: Theme, compositeOverrides: Partial<State> = {}): boolean | undefined {
  return find(layoutState(diagram(compositeOverrides), theme, measurer).states, 'C')?.southCapInk;
}

/** `theme.colors.elements['state'].background` — the bucket a bare
 *  `<style> state { BackGroundColor X }`, `<style> stateDiagram {
 *  BackgroundColor X }` cascade alias, or `skinparam stateBackgroundColor X`
 *  all populate (`state-render-colors.ts#resolveStateFillBucketed`). */
function withStateBackground(background: string): Theme {
  return {
    ...defaultTheme,
    colors: { ...defaultTheme.colors, elements: { ...defaultTheme.colors.elements, state: { background } } },
  };
}

function withGraph(patch: Record<string, unknown>): Theme {
  return { ...defaultTheme, colors: { ...defaultTheme.colors, graph: { ...defaultTheme.colors.graph, ...patch } } };
}

describe('south-cap gate — the transparent default (plantuml.skin:266-271)', () => {
  it('leaves the field ABSENT on a default-skin composite', () => {
    expect(southCapOf(defaultTheme)).toBeUndefined();
  });

  it('stays absent when only RoundCorner is set (T9 ruled RoundCorner out as the gate)', () => {
    expect(southCapOf(withGraph({ stateCascadeRoundCorner: 2 }))).toBeUndefined();
  });

  it('stays absent when a tier resolves to an explicitly transparent colour', () => {
    // `HColorSimple#isTransparent()` — `RoundedSouth.drawU:66-67` still
    // early-returns, so no cap and no extra ink.
    expect(southCapOf(withStateBackground('transparent'))).toBeUndefined();
  });
});

describe('south-cap gate — a resolved, non-transparent south', () => {
  it('fires for the bare `state`/`stateDiagram` BackGroundColor bucket', () => {
    expect(southCapOf(withStateBackground('cyan'))).toBe(true);
  });

  it('fires for an explicit `ColorType.BACK` inline override on the group', () => {
    expect(southCapOf(defaultTheme, { color: 'yellow' })).toBe(true);
  });

  it('fires for `skinparam stateBackgroundColor<<stereo>>`, keyed lowercased', () => {
    const theme = withGraph({ stateBackgroundColorByStereo: { statemachine: 'LightYellow' } });
    expect(southCapOf(theme, { stereotype: 'statemachine' })).toBe(true);
    // …and not for a composite carrying a DIFFERENT stereotype.
    expect(southCapOf(theme, { stereotype: 'other' })).toBeUndefined();
  });

  it('fires for the universal `skin <name>`/`root {}`/`element {}` cascade', () => {
    // `rose.skin:13`'s `root { BackGroundColor #FEFECE }` reaches the body
    // query because rose.skin declares no `state.body` bucket at all and
    // `TitledDiagram#loadSkin:167` REPLACES the whole style builder.
    expect(southCapOf(withGraph({ rootElementBackground: '#FEFECE' }))).toBe(true);
  });
});

describe('south-cap gate — RoundedSouth.drawU`s `rounded == 0` branch', () => {
  it('does not fire at RoundCorner 0 (URectangle, hence drawRectangle`s -1 inset)', () => {
    expect(southCapOf(withGraph({ stateCascadeRoundCorner: 0 }), { color: 'yellow' })).toBeUndefined();
  });

  it('does not fire under strictuml, which forces rounded to 0 (Cluster.java:323-324)', () => {
    const theme = { ...withStateBackground('cyan'), strictUml: true };
    expect(southCapOf(theme)).toBeUndefined();
  });
});

describe('south-cap gate — scope', () => {
  it('never lands on a LEAF state, which jar wraps in no RoundedContainer', () => {
    const leaf = find(layoutState(diagram(), withStateBackground('cyan'), measurer).states, 'X');
    expect(leaf?.southCapInk).toBeUndefined();
  });
});
