/**
 * codd-T3 -- `CommandCreateElementFull.java:316,324` reuses `quark.getData()`
 * for a leaf declared again in the same scope: ONE entity, ONE uid. Expected
 * ids are the jar's, from component/kizobu-64-rozo458/in.svg (`!define F H` /
 * `!define G H` make both `circle` lines declare H): A ent0001, E ent0002,
 * H ent0003, B ent0004, C ent0005.
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

const SRC = [
  '@startuml',
  'component "A" as A {',
  '  component "E" as E {',
  '    !define F H',
  '    circle "TBD" as F',
  '    !define G H',
  '    circle "TBD" as G',
  '  }',
  '}',
  'component "B" as B {',
  '  control "C" as C',
  '}',
  '@enduml',
].join('\n');

describe('leaf redeclaration in one scope', () => {
  it('draws a single H with the next uid, then B and C', () => {
    const svg = renderSync(SRC, { measurer: new DeterministicMeasurer() });
    const seen = [...svg.matchAll(/<g class="(?:entity|cluster)" data-qualified-name="([^"]+)" id="(ent\d+)"/g)].map(
      (m) => `${m[1]}:${m[2]}`,
    );
    expect(seen).toEqual(['A:ent0001', 'E:ent0002', 'B:ent0004', 'H:ent0003', 'C:ent0005']);
  });
});
