/**
 * cdd6-T3d (zasuxe-15-lugo662): upstream prints a group's own leaves FIRST
 * and its muted empty child packages AFTER them
 * (`svek/GraphvizImageBuilder.java:431-433` `printEntities(g.leafs());
 * printGroups(g)`, with `printGroups` muting an empty PACKAGE and printing it
 * as an entity, :416-418). The cluster's `nodeIds` must carry that order, not
 * the source order the parse-time collapse pushed them in.
 */
import { describe, it, expect } from 'vitest';
import { parseClass } from './parse-helper.js';
import { layoutClass } from '../../../src/diagrams/class/layout.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { FormulaMeasurer } from '../../../src/core/measurer.js';
import { setLayoutInputObserver } from '../../../src/core/graph-layout.js';
import type { DotInputGraph } from '../../../src/core/graph-layout.js';

const measurer = new FormulaMeasurer();

function captureDotGraph(lines: string[]): DotInputGraph {
  const ast = parseClass({ lines, type: 'class' });
  let g: DotInputGraph | undefined;
  setLayoutInputObserver(({ graph: x }) => {
    g = x;
  });
  try {
    layoutClass(ast, defaultTheme, measurer);
  } finally {
    setLayoutInputObserver(undefined);
  }
  if (g === undefined) throw new Error('no layout input captured');
  return g;
}

describe('cluster nodeIds order: leaves before muted empty child packages', () => {
  it('puts the component before the two empty packages declared ahead of it', () => {
    const graph = captureDotGraph([
      'allow_mixing',
      'package "P" as abc {',
      'package "Example1" as def { }',
      'package "Example2" as ghj { }',
      'component [abc-service]',
      '}',
    ]);
    const abc = graph.clusters?.find((c) => c.label === 'P');
    expect(abc?.nodeIds).toEqual(['abc.abc-service', 'abc.def', 'abc.ghj']);
  });

  it('keeps plain leaves in source order and muted packages in child-group order', () => {
    const graph = captureDotGraph(['package p {', 'package e2 { }', 'class A', 'package e1 { }', 'class B', '}']);
    const p = graph.clusters?.find((c) => c.label === 'p');
    expect(p?.nodeIds).toEqual(['p.A', 'p.B', 'p.e2', 'p.e1']);
  });
});
