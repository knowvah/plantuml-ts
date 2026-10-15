/**
 * codd-T8 -- container classification under a namespace separator.
 *
 * gerebe: `!pragma useIntermediatePackages false` packs a single-group-child package into its child
 * (`AbstractEntityDiagram#packSomePackage`, called from `DescriptionDiagram#checkFinalError`): the jar
 * emits ONE cluster titled "foo1.foo2", ours emitted two.
 * jafexe: with a separator set, an undotted container declaration is a child of the CURRENT group
 * (`CucaDiagram#quarkInContextSafe`, :274), so `node physical1 {` inside `second` is a new group, not a
 * reopening of `first.physical1`; an undotted link endpoint reuses an existing entity only when exactly
 * one quark carries that name (:267-273).
 *
 * Expected values are the jar's own svek-1.dot (tests/fixtures/description-separator/*.svek-1.dot).
 *
 * @see ~/git/plantuml/src/main/java/net/atmp/CucaDiagram.java:251-275
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/classdiagram/AbstractEntityDiagram.java:85-106
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { setLayoutInputObserver } from '../../../src/core/graph-layout.js';
import type { DotInputGraph } from '../../../src/core/graph-layout.types.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { layoutParity } from '../../oracle/layout-parity.js';

const FIXTURES = join(import.meta.dirname, '../../fixtures/description-separator');

function capture(name: string): { graph: DotInputGraph; jarDot: string } {
  const source = readFileSync(join(FIXTURES, `${name}.puml`), 'utf8');
  const graphs: DotInputGraph[] = [];
  setLayoutInputObserver(({ graph }) => graphs.push(graph));
  try {
    renderSync(source, { measurer: new DeterministicMeasurer() });
  } finally {
    setLayoutInputObserver(undefined);
  }
  return { graph: graphs[0]!, jarDot: readFileSync(join(FIXTURES, `${name}.svek-1.dot`), 'utf8') };
}

describe('container classification under a separator (codd-T8)', () => {
  it('gerebe: packs foo1 into foo2 -- one cluster, as in the jar', () => {
    const { graph, jarDot } = capture('gerebe');
    expect(graph.clusters?.map((c) => c.nodeIds)).toEqual([['foo3']]);
    expect(layoutParity(jarDot, graph).firstDiff?.component).not.toBe('clusterTree');
  });

  it('jafexe: second.physical1 is a new group, so the tree has three clusters (first, first.physical1, second)', () => {
    const { graph, jarDot } = capture('jafexe');
    expect(graph.clusters).toHaveLength(3);
    // The jar also has the self link sh0015->sh0015; layout-dot-tree.ts drops every self link (T9's file),
    // which is why the first cluster's bb still differs. The tree itself (count and nesting) is the jar's.
    expect(layoutParity(jarDot, graph).firstDiff?.detail).toMatch(/^jar 3 vs ours 3; /);
    expect(graph.clusters?.map((c) => c.parentId !== undefined)).toEqual([false, true, false]);
  });
});
