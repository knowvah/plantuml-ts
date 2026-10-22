/**
 * sdd2 T4a -- the stick-kind, queue and badge label placements, against the
 * jar's own `in.svg` values.
 *
 *   STICK  `ComponentRoseActor.java:75,78,85` (+ Boundary/Control/Entity/
 *          Database): block left = (prefW - (pure + 6)) / 2, head block top =
 *          component top + stick height, tail block top = component top.
 *   QUEUE  `USymbolQueue.java:147`: label at `margin.getX1()` = 5.
 *   BADGE  `TextBlockSprited.java:62,70-77`: rows start at the block top.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { participantLabelCy } from '../../../src/diagrams/sequence/sequence-layout-participant-sizing.js';
import { renderFixtureSequence } from '../../oracle/svg-conformance/render-fixture-sequence.js';

const CACHE = join(dirname(fileURLToPath(import.meta.url)), '../../../test-results/dot-cache/sequence');

interface Label {
  readonly x: string;
  readonly y: string;
  readonly text: string;
}

function labels(slug: string): readonly Label[] {
  const svg = renderFixtureSequence(readFileSync(join(CACHE, slug, 'in.puml'), 'utf8'), new DeterministicMeasurer());
  return [...svg.matchAll(/<text([^>]*font-size="14"[^>]*)>([^<]*)<\/text>/g)].map((m) => ({
    x: /\bx="([^"]*)"/.exec(m[1]!)![1]!,
    y: /\by="([^"]*)"/.exec(m[1]!)![1]!,
    text: m[2]!,
  }));
}

describe('participantLabelCy -- stick kinds', () => {
  const T = 16.2969;
  it('head: the block ends at the component bottom (ComponentRoseActor.java:75)', () => {
    expect(participantLabelCy('actor', 76.2969, 10, true, { labelBlockHeight: T })).toBeCloseTo(78.148, 3);
  });
  it('tail: the block starts at the component top (ComponentRoseActor.java:78)', () => {
    expect(participantLabelCy('database', 76.2969, 100, false, { labelBlockHeight: T })).toBeCloseTo(108.148, 3);
  });
});

describe('actor head and tail labels (balixa-47-mudo983)', () => {
  const alice = labels('balixa-47-mudo983').filter((l) => l.text === 'Alice');
  it('head: x = block left, baseline = stick height + ascent', () => {
    // JAR: <text x="79.931" y="80.889" ...>Alice</text>
    expect(alice[0]).toEqual({ x: '79.931', y: '80.889', text: 'Alice' });
  });
  it('tail: the text sits at the component top', () => {
    // JAR: <text x="79.931" y="166.889" ...>Alice</text>
    expect(alice[1]).toEqual({ x: '79.931', y: '166.889', text: 'Alice' });
  });
});

describe('queue label (butofu-60-kene642)', () => {
  it('draws at component x + 5 (USymbolQueue.java:147)', () => {
    const bar = labels('butofu-60-kene642').filter((l) => l.text === 'bar');
    // JAR: <text x="87.687" y="30.889" ...>bar</text> head, y=153.889 tail
    expect(bar.map((l) => [l.x, l.y])).toEqual([
      ['87.687', '30.889'],
      ['87.687', '153.889'],
    ]);
  });
});

describe('badge rows (birocu-87-xubi808)', () => {
  it('start at the block top, not centred on it (TextBlockSprited.java:76)', () => {
    const rows = labels('birocu-87-xubi808').filter((l) => l.text === '«APIGateway»' || l.text === 'OnlyLabel');
    // JAR: box 1 «APIGateway» y=63.889, OnlyLabel y=77.889; box 2 «APIGateway» y=27.889.
    expect(rows.slice(0, 3).map((l) => l.y)).toEqual(['63.889', '77.889', '27.889']);
  });
});
