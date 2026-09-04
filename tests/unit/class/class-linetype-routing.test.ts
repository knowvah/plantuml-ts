/**
 * Mission `linetype-ortho-routing` T5: `theme.linetype` forwarded onto the
 * `DotInputGraph` assembled by `class-dot-graph.ts#buildDotGraph`
 * (decisions.md D3 — same expression, `theme.linetype`, the label half
 * already reads at `class-dot-graph.ts:401`).
 *
 * The five class fixtures that carry `splines=` in their pinned jar DOT
 * (`.agent-notes/lor-containment.md`): three ortho
 * (`bujedi-30-cize673`, `dimisi-54-dula946`, `jakapi-64-tine258`), two
 * polyline (`gamevo-26-runo973`, `kuxato-79-muno809` — D4: no
 * `forcelabels` on the polyline arm).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderSync } from '../../../src/index.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { setLayoutInputObserver } from '../../../src/core/graph-layout.js';
import type { DotInputGraph } from '../../../src/core/graph-layout.js';
import { toSvekDot } from '../../../src/core/svek-dot-emit.js';

const GOLDENS = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../oracle/goldens/class',
);

const measurer = new WidthTableMeasurer();

function captureFirst(puml: string): DotInputGraph {
  const captured: DotInputGraph[] = [];
  setLayoutInputObserver((g) => captured.push(g));
  try {
    renderSync(puml, { measurer });
  } finally {
    setLayoutInputObserver(undefined);
  }
  return captured[0]!;
}

/** The single `splines`/`forcelabels` line of a fixture's own pinned jar
 *  DOT (`svek-1.dot`), or `undefined` if it carries none. */
function jarSplinesLine(slug: string): string | undefined {
  const dot = readFileSync(join(GOLDENS, slug, 'svek-1.dot'), 'utf8');
  return dot.split('\n').find((l) => l.includes('splines') || l.includes('forcelabels'));
}

/** The single `splines`/`forcelabels` line our own `toSvekDot` emits for a
 *  fixture's captured `DotInputGraph`, or `undefined` if it carries none. */
function ourSplinesLine(slug: string): string | undefined {
  const puml = readFileSync(join(GOLDENS, slug, 'input.puml'), 'utf8');
  const dot = toSvekDot(captureFirst(puml));
  return dot.split('\n').find((l) => l.includes('splines') || l.includes('forcelabels'));
}

describe('class-dot-graph.ts buildDotGraph — forwards theme.linetype', () => {
  it('carries linetype: "ortho" on the DotInputGraph', () => {
    const puml = [
      '@startuml',
      'skinparam linetype ortho',
      'class A',
      'class B',
      'A --> B',
      '@enduml',
    ].join('\n');
    expect(captureFirst(puml).linetype).toBe('ortho');
  });

  it('carries linetype: "polyline" on the DotInputGraph', () => {
    const puml = [
      '@startuml',
      'skinparam linetype polyline',
      'class A',
      'class B',
      'A --> B',
      '@enduml',
    ].join('\n');
    expect(captureFirst(puml).linetype).toBe('polyline');
  });

  it('leaves linetype absent (not explicit undefined) with no skinparam set', () => {
    const puml = ['@startuml', 'class A', 'class B', 'A --> B', '@enduml'].join('\n');
    expect('linetype' in captureFirst(puml)).toBe(false);
  });
});

describe.each([
  ['bujedi-30-cize673', 'ortho'],
  ['dimisi-54-dula946', 'ortho'],
  ['jakapi-64-tine258', 'ortho'],
] as const)('%s (ortho): emitted splines line matches the pinned jar DOT', (slug, mode) => {
  it(`splines=${mode};forcelabels=true; on one line, matching svek-1.dot`, () => {
    const jar = jarSplinesLine(slug);
    const ours = ourSplinesLine(slug);
    expect(jar).toBe('splines=ortho;forcelabels=true;');
    expect(ours).toBe(jar);
  });
});

describe.each([
  ['gamevo-26-runo973'],
  ['kuxato-79-muno809'],
] as const)('%s (polyline): emitted splines line matches the pinned jar DOT, no forcelabels', (slug) => {
  it('splines=polyline; alone, matching svek-1.dot, forcelabels absent', () => {
    const jar = jarSplinesLine(slug);
    const ours = ourSplinesLine(slug);
    expect(jar).toBe('splines=polyline;');
    expect(ours).toBe(jar);
    expect(ours).not.toMatch(/forcelabels/);
  });
});
