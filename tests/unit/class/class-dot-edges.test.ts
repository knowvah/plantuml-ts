/**
 * `class-dot-edges.ts#buildDotEdgeAttrs` — B-1
 * (`plans/class-divergence-drive-3/diagnosis/B.md` § majuva-44-luta965).
 *
 * `@N` sets `Relationship.weight` (`CommandLinkClass.java:381-385`), and this
 * port parses it (`class-lollipop.ts#buildLinkExtras`,
 * `class-relationship-optional-fields.test.ts`). Upstream never forwards it
 * into the DOT: `Link#getWeight()` (`abel/Link.java:320-322`) has no caller
 * anywhere in `net/`, so no cached class `svek-*.dot` carries a `weight=`
 * edge attribute.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { setLayoutInputObserver } from '../../../src/core/graph-layout.js';
import type { DotInputGraph } from '../../../src/core/graph-layout.js';

const CACHE = join(dirname(fileURLToPath(import.meta.url)), '../../../test-results/dot-cache/class');

const measurer = new DeterministicMeasurer();

function captureAll(puml: string): DotInputGraph[] {
  const captured: DotInputGraph[] = [];
  setLayoutInputObserver(({ graph: g }) => captured.push(g));
  try {
    renderSync(puml, { measurer });
  } finally {
    setLayoutInputObserver(undefined);
  }
  return captured;
}

describe('buildDotEdgeAttrs — @N weight is parsed but never forwarded to the DOT edge (B-1)', () => {
  it('majuva-44-luta965: neither `@3 Dog --|> Mammal` nor `@3 Cat --|> Mammal` sets attributes.weight', () => {
    const puml = readFileSync(join(CACHE, 'majuva-44-luta965', 'in.puml'), 'utf8');
    const graphs = captureAll(puml);
    const edges = graphs.flatMap((g) => g.edges);
    const weighted = edges.filter((e) => e.attributes?.weight !== undefined);
    expect(weighted).toHaveLength(0);
    // Sanity: the two `@3` relationships are actually present as DOT edges.
    expect(edges.length).toBeGreaterThanOrEqual(3);
  });

  it('a synthetic `@5` relationship still leaves attributes.weight undefined', () => {
    const graphs = captureAll(['@startuml', 'class A', 'class B', '@5 A --|> B', '@enduml'].join('\n'));
    const edge = graphs.flatMap((g) => g.edges).find((e) => e.from === 'A' || e.to === 'A');
    expect(edge).toBeDefined();
    expect(edge!.attributes?.weight).toBeUndefined();
  });
});
