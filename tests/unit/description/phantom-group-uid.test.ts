/**
 * codd-T8 M4b -- `set separator` phantom groups take their uids LAST. `CucaDiagram#getTextBlock` runs
 * `eventuallyBuildPhantomGroups` (CucaDiagram.java:325-336,464) after parsing, so each phantom `Entity`
 * draws from the shared `cpt1` counter after every parse-time entity and link; it walks `quarks()` in
 * quark REGISTRATION order (plasma/Plasma.java:57-67), not a depth-first walk of the finished tree.
 * Expected ids are the jar's (scripts/oracle-render.sh on this exact source): a=6 b=7 d=8 e=9 g=10.
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

const SRC = [
  '@startuml',
  'set separator .',
  'component a.b.c',
  'component d.e.f',
  'component a.g.h',
  'component a.b.i',
  'a.b.c -- d.e.f',
  '@enduml',
].join('\n');

function uidsByName(svg: string): Record<string, string> {
  const pairs = [...svg.matchAll(/<g class="(?:cluster|entity)" data-qualified-name="([^"]+)"[^>]* id="([^"]+)"/g)];
  return Object.fromEntries(pairs.map((m) => [m[1]!, m[2]!]));
}

describe('phantom namespace group uids (M4b)', () => {
  it('numbers parse-time entities and links first, then phantom groups in quark registration order', () => {
    const uids = uidsByName(renderSync(SRC, { measurer: new DeterministicMeasurer() }));
    expect(uids).toEqual({
      'a.b.c': 'ent0001',
      'd.e.f': 'ent0002',
      'a.g.h': 'ent0003',
      'a.b.i': 'ent0004',
      a: 'ent0006',
      'a.b': 'ent0007',
      d: 'ent0008',
      'd.e': 'ent0009',
      'a.g': 'ent0010',
    });
  });
});
