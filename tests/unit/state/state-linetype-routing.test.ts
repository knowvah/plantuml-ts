/**
 * Mission `linetype-ortho-routing` T4: `theme.linetype` forwarded onto the
 * `DotInputGraph` at all THREE state assembly sites (decisions.md D3 — same
 * expression, `theme.linetype`, as each site's own label half already
 * reads):
 *   - `state-dot-graph.ts#buildDotGraph` (flat pipeline) — label half at
 *     line 238.
 *   - `state-composite-pass.ts#runPass` (per-cluster composite pass,
 *     `omitSepAttrs: true`) — label half at `state-composite-edge-label.ts
 *     :98`.
 *   - `state-composite-pass.ts#buildTopLevelPass` (the diagram's own top
 *     scope, no `omitSepAttrs`) — same label half.
 *
 * `pavuzo-79-zodu430` (`skinparam linetype ortho`) and `kejabo-83-vinu490`
 * (`skinparam linetype polyline`) both nest one composite (`state
 * NotShooting begin ... end state`), so a single render of either exercises
 * BOTH composite sites in one `captureAll` — distinguished by `omitSepAttrs`
 * (present+true only on `runPass`'s cluster-pass graph, absent on
 * `buildTopLevelPass`'s).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderSync } from '../../../src/index.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { setLayoutInputObserver } from '../../../src/core/graph-layout.js';
import type { DotInputGraph } from '../../../src/core/graph-layout.js';

const CACHE = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../test-results/dot-cache/state',
);

const measurer = new WidthTableMeasurer();

function readPuml(slug: string): string {
  return readFileSync(join(CACHE, slug, 'in.puml'), 'utf8');
}

function captureAll(puml: string): DotInputGraph[] {
  const captured: DotInputGraph[] = [];
  setLayoutInputObserver((g) => captured.push(g));
  try {
    renderSync(puml, { measurer });
  } finally {
    setLayoutInputObserver(undefined);
  }
  return captured;
}

describe('state-dot-graph.ts buildDotGraph — flat pipeline forwards theme.linetype', () => {
  it('carries linetype: "ortho" on the flat DotInputGraph', () => {
    const puml = [
      '@startuml',
      'skinparam linetype ortho',
      'state A',
      'A --> B : go',
      '@enduml',
    ].join('\n');
    const [graph] = captureAll(puml);
    expect(graph!.linetype).toBe('ortho');
  });

  it('carries linetype: "polyline" on the flat DotInputGraph', () => {
    const puml = [
      '@startuml',
      'skinparam linetype polyline',
      'state A',
      'A --> B : go',
      '@enduml',
    ].join('\n');
    const [graph] = captureAll(puml);
    expect(graph!.linetype).toBe('polyline');
  });

  it('leaves linetype absent (not explicit undefined) with no skinparam set', () => {
    const puml = ['@startuml', 'state A', 'A --> B : go', '@enduml'].join('\n');
    const [graph] = captureAll(puml);
    expect('linetype' in graph!).toBe(false);
  });
});

describe('state-composite-pass.ts runPass + buildTopLevelPass — composite sites forward theme.linetype', () => {
  it('pavuzo-79-zodu430 (ortho): both the cluster pass and the top-level pass carry linetype: "ortho"', () => {
    const graphs = captureAll(readPuml('pavuzo-79-zodu430'));
    const clusterPass = graphs.filter((g) => g.omitSepAttrs === true);
    const topLevelPass = graphs.filter((g) => g.omitSepAttrs === undefined);
    expect(clusterPass.length).toBeGreaterThan(0);
    expect(topLevelPass.length).toBeGreaterThan(0);
    for (const g of clusterPass) expect(g.linetype).toBe('ortho');
    for (const g of topLevelPass) expect(g.linetype).toBe('ortho');
  });

  it('kejabo-83-vinu490 (polyline): both the cluster pass and the top-level pass carry linetype: "polyline"', () => {
    const graphs = captureAll(readPuml('kejabo-83-vinu490'));
    const clusterPass = graphs.filter((g) => g.omitSepAttrs === true);
    const topLevelPass = graphs.filter((g) => g.omitSepAttrs === undefined);
    expect(clusterPass.length).toBeGreaterThan(0);
    expect(topLevelPass.length).toBeGreaterThan(0);
    for (const g of clusterPass) expect(g.linetype).toBe('polyline');
    for (const g of topLevelPass) expect(g.linetype).toBe('polyline');
  });
});
