/**
 * codd-T3 -- `CommandFactoryNoteOnEntity.java:327` `diagram.getUniqueSequence("GMN")`
 * draws one value from the SAME `cpt1` counter the entity uid (`ent%04d`) and the
 * link uid (`lnkN`) use, BEFORE `reallyCreateLeaf` (:329) and `new Link` (:342+).
 * Expected ids below are the jar's, from component/gekato-87-lisi598/in.svg:
 * notes ent0007 and ent0010 (GMN6/GMN9), the link lnk5.
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

const SRC = [
  '@startuml',
  '() "my interface"',
  '() "a brain new interface"',
  '',
  '[component1] -- () "my other interface"',
  '',
  'note left of ()"my interface" #red : this is a note',
  'note top of () "a brain new interface" #blue',
  ' this note',
  ' is long',
  'end note',
  '@enduml',
].join('\n');

describe('note-on-entity uid sequence (GMN draws from the shared counter)', () => {
  it('numbers the note leaves ent0007 and ent0010, (draw order: leaves, then the link lnk5)', () => {
    const svg = renderSync(SRC, { measurer: new DeterministicMeasurer() });
    const ids = [...svg.matchAll(/<g class="(?:entity|link)"[^>]* id="([^"]+)"/g)].map((m) => m[1]);
    expect(ids).toEqual(['ent0001', 'ent0002', 'ent0003', 'ent0004', 'ent0007', 'ent0010', 'lnk5']);
  });
});
