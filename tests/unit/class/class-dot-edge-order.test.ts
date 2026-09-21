/**
 * `class-dot-edge-order.ts#getOrderedLinks` — SB2
 * (`plans/class-divergence-drive/diagnosis/A1-order.md`,
 * `plans/class-divergence-drive/batch-1/T2-ordered-links.md`).
 *
 * Mirrors `CucaDiagramFileMakerSvek.java:90-113` (`getOrderedLinks`/
 * `addLinkNew`), keyed by `abel/Link.java:462-470` (`sameConnections`).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { getOrderedLinks } from '../../../src/diagrams/class/class-dot-edge-order.js';
import type { Relationship } from '../../../src/diagrams/class/class-relationship-ast.js';
import { renderSync } from '../../../src/index.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { setLayoutInputObserver } from '../../../src/core/graph-layout.js';
import type { DotInputGraph } from '../../../src/core/graph-layout.js';

const CACHE = join(dirname(fileURLToPath(import.meta.url)), '../../../test-results/dot-cache/class');

/** Minimal `Relationship` fixture -- only `from`/`to`/`type` participate in
 *  `sameConnections`; `id` is test-only bookkeeping to assert on order. */
function rel(id: string, from: string, to: string): Relationship & { id: string } {
  return { id, from, to, type: 'association' };
}

function ids(list: readonly Relationship[]): readonly string[] {
  return list.map((r) => (r as Relationship & { id: string }).id);
}

describe('class-dot-edge-order.ts getOrderedLinks', () => {
  it('replays bicabi-42-coto932: lnk12 (AddObjectWindow,DrawOptionsBox) lands ' +
    'right after lnk10 (DrawOptionsBox,AddObjectWindow) and before lnk11 ' +
    '(AddObjectWindow,Gtk), matching the jar document order exactly', () => {
    // Declaration order recovered from oracle/goldens/class/bicabi-42-coto932/
    // input.puml source lines 3,4,6,7,8,18,19,21,22,23.
    const declared = [
      rel('lnk3', 'MainWindow', 'Gtk'),
      rel('lnk5', 'MainWindow', 'Viewport'),
      rel('lnk7', 'DrawOptionsBox', 'Gtk'),
      rel('lnk8', 'DrawOptionsBox', 'MainWindow'),
      rel('lnk10', 'DrawOptionsBox', 'AddObjectWindow'),
      rel('lnk11', 'AddObjectWindow', 'Gtk'),
      rel('lnk12', 'AddObjectWindow', 'DrawOptionsBox'),
      rel('lnk13', 'Viewport', 'Gtk'),
      rel('lnk15', 'Viewport', 'Viewwindow'),
      rel('lnk17', 'Viewport', 'DisplayFile'),
    ];

    const ordered = getOrderedLinks(declared);

    // Jar's own svek-1.dot/SVG document order (oracle/goldens/class/
    // bicabi-42-coto932/svek-1.dot's `<g class="link">` sequence).
    expect(ids(ordered)).toEqual([
      'lnk3',
      'lnk5',
      'lnk7',
      'lnk8',
      'lnk10',
      'lnk12',
      'lnk11',
      'lnk13',
      'lnk15',
      'lnk17',
    ]);
  });

  it('does not mutate the input array (pure function)', () => {
    const declared = [rel('a', 'X', 'Y'), rel('b', 'Y', 'X')];
    const snapshot = [...declared];
    getOrderedLinks(declared);
    expect(declared).toEqual(snapshot);
  });

  it('leaves declaration order untouched when no two links share a connection pair', () => {
    const declared = [rel('a', 'A', 'B'), rel('b', 'C', 'D'), rel('c', 'E', 'F')];
    expect(ids(getOrderedLinks(declared))).toEqual(['a', 'b', 'c']);
  });

  it('groups a three-way same-connection cluster contiguously, each new ' +
    'member inserted right after the last member placed so far -- not a ' +
    'sort by key', () => {
    const declared = [
      rel('L1', 'A', 'B'),
      rel('L2', 'C', 'D'),
      rel('L3', 'B', 'A'), // sameConnections(L1) -- reversed
      rel('L4', 'E', 'F'),
      rel('L5', 'A', 'B'), // sameConnections(L1, L3) -- exact
    ];

    const ordered = getOrderedLinks(declared);

    // L1's group (L1, L3, L5) sits contiguously at the front, in the order
    // each member was placed (L3 right after L1, L5 right after L3);
    // L2/L4 -- each in a singleton group -- keep their relative order,
    // pushed after the group that formed ahead of them.
    expect(ids(ordered)).toEqual(['L1', 'L3', 'L5', 'L2', 'L4']);
  });

  it('handles an empty relationship list', () => {
    expect(getOrderedLinks([])).toEqual([]);
  });
});

describe('class-dot-edge-order.ts getOrderedLinks — wired into class-dot-graph.ts', () => {
  const measurer = new WidthTableMeasurer();

  function captureGraphs(puml: string): DotInputGraph[] {
    const captured: DotInputGraph[] = [];
    setLayoutInputObserver((g) => captured.push(g));
    try {
      renderSync(puml, { measurer });
    } finally {
      setLayoutInputObserver(undefined);
    }
    return captured;
  }

  it('emits DOT edge "draw_options_box" immediately after "add_object_window" ' +
    '(bicabi-42-coto932): declaration order alone would put the unlabeled ' +
    'AddObjectWindow<|--Gtk edge (lnk11) between them', () => {
    const puml = readFileSync(join(CACHE, 'bicabi-42-coto932', 'in.puml'), 'utf8');
    const edges = captureGraphs(puml).flatMap((g) => g.edges);
    const addIdx = edges.findIndex((e) => e.attributes?.label === 'add_object_window');
    const drawIdx = edges.findIndex((e) => e.attributes?.label === 'draw_options_box');
    expect(addIdx).toBeGreaterThanOrEqual(0);
    expect(drawIdx).toBe(addIdx + 1);
  });
});
