/**
 * codd-T5 -- `Cluster#drawU` draws a `!pragma kermor on` TOP/BOTTOM group note
 * before the cluster's own symbol (`Cluster.java:302-307`), through
 * `getCucaNote` -> `EntityImageNoteLink` -> `ComponentRoseNote`
 * (`Cluster.java:393-399`, `ComponentRoseNote.java:94-133`), at the min corner of the
 * alpha/beta label table plus the component's own padding 5
 * (`DotStringFactory.java:454,460`, `AbstractComponent.java:122-123`).
 * Expected strings are the jar's: component/fojamu-08-veku866 (TOP) and
 * component/zubujo-87-xaxa087 (BOTTOM).
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import type { UmlSource } from '../../../src/core/block-extractor.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { astOrThrow } from '../../helpers/parse-ast.js';
import { parseDescription } from '../../../src/diagrams/description/parser.js';
import { layoutDescription } from '../../../src/diagrams/description/layout.js';
import { shiftGeo } from '../../../src/diagrams/description/layout-helpers.js';

const BODY = `component "Temperature Sensor" as tempSensor <<block>> {
    note as tempSensor_TVs
        1some tagged value table
        would be here
        usually.
    end note
    portout "temp_dK_raw" as tempSensor_temp_dK_raw
}`;
const NOTE_TEXT = `    2Measure the temperature and outputs it as
    raw, unfiltered value in Kelvin.
end note`;

function render(src: string): string {
  return renderSync(src, { measurer: new DeterministicMeasurer() });
}

const NOTE_PATH = /<path d="(M[^"]*)" style="stroke:#181818;stroke-width:0\.5;" fill="#FEFFDD"\/>/g;

describe('kermor group note', () => {
  it('draws the TOP note at (6,6), 272x36, before the cluster comment', () => {
    const svg = render(`@startuml\n!pragma kermor on\n${BODY}\nnote top of tempSensor\n${NOTE_TEXT}\n@enduml`);
    const paths = [...svg.matchAll(NOTE_PATH)].map((m) => m[1]);
    expect(paths[0]).toBe('M6,6 L6,42 L278,42 L278,16 L268,6 L6,6');
    expect(paths[1]).toBe('M268,6 L268,16 L278,16 L268,6');
    expect(svg).toContain('<text x="12" y="21.111" fill="#000" font-size="13" textLength="251.712">');
    expect(svg).toContain('<text x="12" y="34.111" fill="#000" font-size="13" textLength="172.656">');
    expect(svg.indexOf('M6,6 L6,42')).toBeLessThan(svg.indexOf('<!--cluster tempSensor-->'));
    expect(svg).toContain('<rect x="10" y="67" width="186" height="146"');
  });

  it('draws the BOTTOM note below the group', () => {
    const svg = render(`@startuml\n!pragma kermor on\n${BODY}\nnote bottom of tempSensor\n${NOTE_TEXT}\n@enduml`);
    const first = [...svg.matchAll(NOTE_PATH)][0]?.[1];
    expect(first).toBe('M11,196 L11,232 L283,232 L283,206 L273,196 L11,196');
    expect(svg).toContain('<rect x="7" y="7" width="186" height="146"');
  });

  it('draws a non-kermor group note as an entity-grouped note leaf, unchanged', () => {
    const svg = render(`@startuml\n${BODY}\nnote top of tempSensor\n${NOTE_TEXT}\n@enduml`);
    expect(svg).not.toContain('M6,6 L6,42 L278,42');
    expect(svg).toMatch(
      /<g class="entity"[^>]*><path d="M[^"]*" style="stroke:#181818;stroke-width:0\.5;"[^>]*\/><path d="M[^"]*" style="stroke:#181818;stroke-width:1;"/,
    );
  });

  it('draws TOP then BOTTOM, both before the cluster comment', () => {
    const svg = render(
      `@startuml\n!pragma kermor on\n${BODY}\nnote top of tempSensor\ntopnote\nend note\nnote bottom of tempSensor\nbottomnote\nend note\n@enduml`,
    );
    const top = svg.indexOf('>topnote</text>');
    const bottom = svg.indexOf('>bottomnote</text>');
    expect(top).toBeGreaterThan(0);
    expect(bottom).toBeGreaterThan(top);
    expect(bottom).toBeLessThan(svg.indexOf('<!--cluster tempSensor-->'));
  });

  it('keeps the note origin in the geo frame: label table min (1,1), moved with the cluster', () => {
    const block: UmlSource = {
      lines: `!pragma kermor on\n${BODY}\nnote top of tempSensor\n${NOTE_TEXT}`.split('\n'),
      type: 'description',
    };
    const geo = layoutDescription(
      astOrThrow(parseDescription(block), 'description'),
      defaultTheme,
      new DeterministicMeasurer(),
    );
    const group = geo.nodes.find((n) => n.id === 'tempSensor');
    expect(group?.kermorNotes?.top?.x).toBeCloseTo(1, 3);
    expect(group?.kermorNotes?.top?.y).toBeCloseTo(1, 3);
    expect(group?.kermorNotes?.bottom).toBeUndefined();
    const moved = shiftGeo(group!, 3, 4);
    expect(moved.kermorNotes?.top?.x).toBeCloseTo(4, 3);
    expect(moved.kermorNotes?.top?.y).toBeCloseTo(5, 3);
  });

  it('places a note on a titled group with no port child', () => {
    const geo = layoutDescription(
      astOrThrow(
        parseDescription({
          lines: `!pragma kermor on\ncomponent X {\n component Y\n}\nnote top of X\nhi\nend note`.split('\n'),
          type: 'description',
        }),
        'description',
      ),
      defaultTheme,
      new DeterministicMeasurer(),
    );
    expect(geo.nodes.find((n) => n.id === 'X')?.kermorNotes?.top?.text).toBe('hi');
  });
});
