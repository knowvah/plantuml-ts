/**
 * cdd3-T14 — creation-order DOT emission (E1-1, E1-4, C-14 = E3-7).
 *
 * Upstream declares root DOT nodes in `printGroups(root)` then
 * `printEntities(getUnpackagedEntities())` order
 * (`svek/GraphvizImageBuilder.java:226-227`): a root EMPTY package is muted
 * and printed inside `printGroups` (`:416-418`), before every unpackaged
 * leaf, and the unpackaged leaves -- notes included -- follow
 * `dotData.getLeafs()` creation order (`:401`). Links are emitted and drawn
 * in ONE `getLinks()` walk (`:229`), where a note-on-entity link sits at its
 * `diagram.addLink` position (`command/note/CommandFactoryNoteOnEntity.java
 * :360`) and magma links come last (`classdiagram/ClassDiagram.java:87`,
 * `cucadiagram/Magma.java:61`). Every expectation below is read off the
 * jar's own `svek-1.dot`/`in.svg` for the named fixture.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderSync } from '../../../src/index.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { setLayoutInputObserver } from '../../../src/core/graph-layout.js';
import type { DotInputGraph } from '../../../src/core/graph-layout.js';

const CACHE = join(dirname(fileURLToPath(import.meta.url)), '../../../test-results/dot-cache/class');
const measurer = new WidthTableMeasurer();

function capture(puml: string): { graph: DotInputGraph; svg: string } {
  const captured: DotInputGraph[] = [];
  setLayoutInputObserver((g) => captured.push(g));
  let svg: string;
  try {
    svg = renderSync(puml, { measurer });
  } finally {
    setLayoutInputObserver(undefined);
  }
  expect(captured).toHaveLength(1);
  return { graph: captured[0]!, svg };
}

const fixture = (slug: string): string => readFileSync(join(CACHE, slug, 'in.puml'), 'utf8');
const nodeIds = (g: DotInputGraph): string[] => g.nodes.map((n) => n.id);

/** `note-layout-groups.ts#groupEdge` / `core/magma.ts` id prefixes. */
function edgeKind(id: string): 'rel' | 'note' | 'magma' {
  if (id.startsWith('__noteedge_')) return 'note';
  if (id.startsWith('magma-edge-')) return 'magma';
  return 'rel';
}

describe('cdd3-T14 E1-1: root DOT nodes in printGroups-then-creation order', () => {
  it('xitobu-41-lame230: the muted root EMPTY package precedes `class foo` (GraphvizImageBuilder.java:226,416-418)', () => {
    // jar svek-1.dot: sh0006 width=1.013021 (package), sh0007 width=0.714236 (foo).
    const { graph } = capture(fixture('xitobu-41-lame230'));
    expect(nodeIds(graph)).toEqual(['package', 'foo']);
  });

  it('nuxoni-26-xala894: floating notes keep their creation slot ahead of MyClass (GraphvizImageBuilder.java:401)', () => {
    // jar svek-1.dot: sh0006/sh0007 height=0.319444 (Note1, Note2), sh0008
    // height=0.666667 (MyClass).
    const { graph } = capture(fixture('nuxoni-26-xala894'));
    expect(nodeIds(graph)).toEqual(['Note1', 'Note2', 'MyClass']);
  });

  it('nuxoni-26-xala894: the root magma square starts at Note1 (CucaDiagram.java:708 g.leafs())', () => {
    // jar svek-1.dot: sh0006->sh0007 minlen=0, sh0006->sh0008 minlen=1.
    const { graph } = capture(fixture('nuxoni-26-xala894'));
    const magma = graph.edges.filter((e) => edgeKind(e.id) === 'magma');
    expect(magma.map((e) => [e.from, e.to, e.attributes?.minLen])).toEqual([
      ['Note1', 'Note2', 0],
      ['Note1', 'MyClass', 1],
    ]);
  });
});

describe('cdd3-T14 E1-4 / C-14: DOT links in getLinks() order', () => {
  it('dibinu-95-kavo178: relationships, then note links, then magma (ClassDiagram.java:87)', () => {
    // jar colours: 0F,13 relations; 17,1B note links; 1F,23,27 magma.
    const { graph } = capture(fixture('dibinu-95-kavo178'));
    expect(graph.edges.map((e) => edgeKind(e.id))).toEqual(['rel', 'rel', 'note', 'note', 'magma', 'magma', 'magma']);
  });

  it('a note link sits at its CommandFactoryNoteOnEntity.java:360 addLink slot, between relationships', () => {
    // Authored fixture, rendered through scripts/oracle-render.sh:
    // jar svek-1.dot nodes sh0006 A, sh0007 B, sh0008 note, sh0009 C; edges
    // A->B #00000A, note #00000E, B->C #000012.
    const puml = [
      '@startuml',
      'skinparam style strictuml',
      'class A',
      'class B',
      'A --> B',
      'note right of A : n',
      'B --> C',
      '@enduml',
    ].join('\n');
    const { graph, svg } = capture(puml);
    expect(nodeIds(graph)).toEqual(['A', 'B', '__note_0', 'C']);
    expect(graph.edges.map((e) => edgeKind(e.id))).toEqual(['rel', 'note', 'rel']);
    // jar in.svg draws lnk3 (A->B), lnk6 (A->note), lnk8 (B->C) -- ONE
    // getLinks() loop (GraphvizImageBuilder.java:229, Bibliotekon.allLines).
    const linkIds = [...svg.matchAll(/<g class="link"[^>]*id="(lnk\d+)"/g)].map((m) => m[1]);
    expect(linkIds).toEqual(['lnk3', 'lnk6', 'lnk8']);
  });
});
