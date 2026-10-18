/**
 * gtc-T4 -- a note attached to a CLUSTER is never opalised, and a generated note's
 * quark name is `GMN<n>`.
 *
 * - `GraphvizImageBuilder.java:245-259` opalises only `if (other != null)`, where
 *   `other = Bibliotekon#getNode(entity)` (`Bibliotekon.java:120-122`) -- `nodeMap` holds
 *   leaf nodes, so a group has none. The note is then drawn by `EntityImageNote#drawNormal`
 *   (:272-286) and the dashed link by `SvekEdge#drawU` (:833).
 * - `CommandFactoryNoteOnEntity.java:327` names the note quark `GMN<n>` with `n` drawn from
 *   the shared uid counter before the leaf's own uid; the link path id is `<from>-<to>`.
 *
 * Expected values: component/repoge-41-demu604/in.svg (jar), and a jar probe
 * (scripts/oracle-render.sh) of the interleaved fixture below: GMN2/ent0003, GMN7/ent0008,
 * GMN12/ent0013, GMN16/ent0017, link `C-GMN12`.
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';

const render = (src: string): string => renderSync(src, { measurer: new DeterministicMeasurer() });

const REPOGE = [
  '@startuml',
  'component "Temperature Sensor" as tempSensor <<block>> {',
  '    note as tempSensor_TVs',
  '        1some tagged value table',
  '        would be here',
  '        usually.',
  '    end note',
  '    portin in1withalongname',
  '    portin in2withalongname',
  '    portout out1withalongname',
  '    portout out2withalongname',
  '}',
  'note bottom of tempSensor',
  '2note bottom',
  'end note',
  '@enduml',
].join('\n');

const INTERLEAVED = [
  '@startuml',
  'component A',
  'note right of A : n1',
  'component B',
  'interface I',
  'note left of B : n2',
  'component C {',
  '  component D',
  '}',
  'note bottom of C : n3',
  'A --> B',
  'note top of D : n4',
  '@enduml',
].join('\n');

const ids = (svg: string): (string | undefined)[] =>
  [...svg.matchAll(/<g class="(?:entity|cluster|link)"[^>]* id="([^"]+)"/g)].map((m) => m[1]);

describe('note on a cluster', () => {
  it('draws the plain note polygon (no Opale connector) and the dashed link', () => {
    const svg = render(REPOGE);
    expect(svg).toContain(
      '<path d="M419.64,233.111 L419.64,256.111 L516.365,256.111 L516.365,243.111 L506.365,233.111 L419.64,233.111" style="stroke:#181818;stroke-width:0.5;" fill="#FEFFDD"/>',
    );
    expect(svg).toContain(
      '<path d="M331.61,157.941 C364.12,178.361 421.91,214.661 450.7,232.741" style="stroke:#181818;stroke-width:1;stroke-dasharray:7,7;" fill="none" id="tempSensor-GMN7"/>',
    );
    expect(ids(svg)).toEqual(['ent0001', 'ent0002', 'ent0003', 'ent0004', 'ent0005', 'ent0006', 'ent0008', 'lnk9']);
  });
});

describe('generated note names (GMN<n>)', () => {
  it('numbers GMN from the shared counter across interleaved declarations', () => {
    const svg = render(INTERLEAVED);
    expect(ids(svg)).toEqual([
      'ent0010',
      'ent0011',
      'ent0001',
      'ent0003',
      'ent0005',
      'ent0006',
      'ent0008',
      'ent0013',
      'ent0017',
      'lnk14',
      'lnk15',
    ]);
    expect(svg).toContain('id="C-GMN12"');
    expect([...svg.matchAll(/data-qualified-name="(GMN\d+)"/g)].map((m) => m[1])).toEqual([
      'GMN2',
      'GMN7',
      'GMN12',
      'GMN16',
    ]);
  });
});
