/**
 * A pair message's lifeline-span demand includes the autonumber block:
 * `Display#createMessageNumber` merges the number, a 4px margin and the label
 * into the arrow's text block (`Display.java:703-712`), and
 * `ComponentRoseArrow#getPreferredWidth` is that block plus paddings. The jar's
 * second participant therefore sits further right than the box-driven gap.
 * Oracle: `gadasu-04-kada675` (re-captured under oracle seam #4).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { numberTextOf } from '../../../src/diagrams/sequence/text-block-geo.js';
import { renderFixtureSequence } from '../../oracle/svg-conformance/render-fixture-sequence.js';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '../../../test-results/dot-cache/sequence/gadasu-04-kada675');
const headXs = (svg: string): string[] =>
  [...svg.matchAll(/<text x="([\d.]+)"[^>]*font-size="14"[^>]*>/g)].map((m) => String(Number(Number(m[1]).toFixed(3))));
// Rounded: the TITLE chrome (`src/core/assemble-svg.ts`) emits unformatted sums,
// e.g. x="53.32500219345093" for the jar's 53.325 -- not this engine's.

describe('autonumber in the participant span', () => {
  it('places the participant heads where the jar does', () => {
    const ours = renderFixtureSequence(readFileSync(join(DIR, 'in.puml'), 'utf8'), new DeterministicMeasurer());
    const jar = readFileSync(join(DIR, 'in.svg'), 'utf8');
    expect(headXs(jar).length).toBeGreaterThan(1);
    expect(headXs(ours)).toEqual(headXs(jar));
  });
});

describe('numberTextOf', () => {
  it('prefers the formatted label over the bare number', () => {
    expect(numberTextOf({ sequenceLabel: '[001]', sequenceNumber: 1 })).toBe('[001]');
  });

  it('stringifies a bare number and is undefined without either', () => {
    expect(numberTextOf({ sequenceNumber: 7 })).toBe('7');
    expect(numberTextOf({})).toBeUndefined();
  });
});
