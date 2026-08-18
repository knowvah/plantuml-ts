/**
 * Unit tests for state-leaf-node.ts's border-point sizing (G7:
 * `EntityPosition.getDimension(Rankdir)`'s rankdir-swap for
 * EXPANSION_INPUT/EXPANSION_OUTPUT, unported for the composite pipeline's
 * `buildLeafNode`) — SI28
 * `plans/state-declared-size-diagnosis/findings/pseudo-state.md`
 * (bujuta-44-rovo666/mimaga-15-doze740/nijugi-19-jazi166/rinisi-79-peko570).
 * G9 (bitaxo-18-tamo974, `hide empty description`) is deferred — see
 * `buildLeafNode`'s comment and SI29 decision-journal T2.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/EntityPosition.java:56,120-128
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { State } from '../../../src/diagrams/state/ast.js';
import { buildLeafNode, type LeafNodeCtx } from '../../../src/diagrams/state/state-leaf-node.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { renderSync } from '../../../src/index.js';
import { setLayoutInputObserver } from '../../../src/core/graph-layout.js';
import type { DotInputGraph } from '../../../src/core/graph-layout.js';

const CACHE = join(dirname(fileURLToPath(import.meta.url)), '../../../test-results/dot-cache/state');
const measurer = new WidthTableMeasurer();

function makeState(overrides: Partial<State> = {}): State {
  return {
    id: 'entry1', display: 'entry1', kind: 'normal',
    children: [], concurrentRegions: [], transitions: [],
    ...overrides,
  };
}

function makeCtx(overrides: Partial<LeafNodeCtx> = {}): LeafNodeCtx {
  return { theme: defaultTheme, measurer, rankdir: 'TB', ...overrides };
}

function captureFirst(puml: string): DotInputGraph {
  let captured: DotInputGraph | undefined;
  setLayoutInputObserver((g) => { captured ??= g; });
  try {
    renderSync(puml, { measurer });
  } finally {
    setLayoutInputObserver(undefined);
  }
  return captured!;
}

function readFixture(slug: string): string {
  return readFileSync(join(CACHE, slug, 'in.puml'), 'utf8');
}

function nodeById(graph: DotInputGraph, id: string) {
  const node = graph.nodes.find((n) => n.id === id);
  if (node === undefined) throw new Error(`no DOT node with id "${id}"`);
  return node;
}

describe('buildLeafNode -- EXPANSION_INPUT/OUTPUT rankdir dimension (G7)', () => {
  it('sizes 48x12 (wide) under TOP_TO_BOTTOM rankdir', () => {
    const node = buildLeafNode(makeState({ stereotype: 'expansionInput' }), makeCtx({ rankdir: 'TB' }));
    expect(node.width).toBe(48);
    expect(node.height).toBe(12);
  });

  it('sizes 12x48 (tall) under LR rankdir', () => {
    const node = buildLeafNode(makeState({ stereotype: 'expansionInput' }), makeCtx({ rankdir: 'LR' }));
    expect(node.width).toBe(12);
    expect(node.height).toBe(48);
  });

  it('swaps identically for expansionOutput', () => {
    const tb = buildLeafNode(makeState({ stereotype: 'expansionOutput' }), makeCtx({ rankdir: 'TB' }));
    const lr = buildLeafNode(makeState({ stereotype: 'expansionOutput' }), makeCtx({ rankdir: 'LR' }));
    expect(tb).toMatchObject({ width: 48, height: 12 });
    expect(lr).toMatchObject({ width: 12, height: 48 });
  });

  it('leaves ENTRY_POINT/EXIT_POINT/INPUT_PIN/OUTPUT_PIN at fixed 12x12 in both rankdirs', () => {
    for (const stereotype of ['entrypoint', 'exitpoint', 'inputpin', 'outputpin']) {
      for (const rankdir of ['TB', 'LR'] as const) {
        const node = buildLeafNode(makeState({ stereotype, display: 'x' }), makeCtx({ rankdir }));
        expect(node.width).toBe(12);
        expect(node.height).toBe(12);
      }
    }
  });
});

describe('fixture-level: composite-pipeline DOT sizes match jar (SI28 findings/pseudo-state.md)', () => {
  it('bujuta-44-rovo666 (LR): entry1/entry2/exitA are 12x48 (height axis)', () => {
    const graph = captureFirst(readFixture('bujuta-44-rovo666'));
    for (const id of ['entry1', 'entry2', 'exitA']) {
      const node = nodeById(graph, id);
      expect(node.width).toBe(12);
      expect(node.height).toBe(48);
    }
  });

  it('mimaga-15-doze740 (TB, default): entry1/entry2/exitA are 48x12 (width axis)', () => {
    const graph = captureFirst(readFixture('mimaga-15-doze740'));
    for (const id of ['entry1', 'entry2', 'exitA']) {
      const node = nodeById(graph, id);
      expect(node.width).toBe(48);
      expect(node.height).toBe(12);
    }
  });

  it('nijugi-19-jazi166 (TB, single node, no tie): expansionInput is 48x12', () => {
    const graph = captureFirst(readFixture('nijugi-19-jazi166'));
    const node = nodeById(graph, 'expansionInput');
    expect(node.width).toBe(48);
    expect(node.height).toBe(12);
  });

  it('rinisi-79-peko570 (LR + set separator none): entry1/entry2/exitA are 12x48', () => {
    const graph = captureFirst(readFixture('rinisi-79-peko570'));
    for (const id of ['entry1', 'entry2', 'exitA']) {
      const node = nodeById(graph, id);
      expect(node.width).toBe(12);
      expect(node.height).toBe(48);
    }
  });
});
