/**
 * cdd7-T2a (bonaco-71-xefu608, D4): `EntityImagePort#drawU`
 * (`svek/image/EntityImagePort.java:99-140`) -- the port leaf's group, its
 * desc text above/below the RADIUS*2 square, and the 1.5 stroke. Expected
 * strings are the jar's own (`test-results/dot-cache/unknown/
 * bonaco-71-xefu608/in.svg`).
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import {
  renderClassEntityPort,
  isClassEntityPort,
  entityPortDisplay,
} from '../../../src/diagrams/class/renderer-entity-port.js';
import type { ClassifierGeo } from '../../../src/diagrams/class/class-geo-types.js';
import type { ScaledTheme } from '../../../src/diagrams/class/class-scale-geo.js';
import { defaultTheme } from '../../../src/core/theme.js';

const measurer = new WidthTableMeasurer();
const BONACO = '@startuml\nallowmixing\n\nPackage Pa {\n    portin Pi\n    component C {\n    }\n}\n@enduml\n';

function port(overrides: Partial<ClassifierGeo> = {}): ClassifierGeo {
  return {
    id: 'Pa.Pi',
    kind: 'descriptive',
    x: 18,
    y: 33.611,
    width: 12,
    height: 12,
    dividerYs: [],
    rows: [{ text: 'Pi', y: 6, indent: 0 }],
    usymbol: 'portin',
    ...overrides,
  };
}

const THEME: ScaledTheme = { ...defaultTheme, scaleK: 1 };

describe('renderClassEntityPort (EntityImagePort#drawU)', () => {
  it('draws the desc above the symbol when upPosition()', () => {
    const { body } = renderClassEntityPort(port({ entityPortUp: true }), THEME, measurer, 'ent0002');
    expect(body).toContain('<text x="17.744" y="18.5" fill="#000" font-size="14" textLength="12.513">Pi</text>');
    expect(body).toContain(
      '<rect x="18" y="33.611" width="12" height="12" fill="#F1F1F1" style="stroke:#181818;stroke-width:1.5;"/>',
    );
    expect(body.indexOf('<text')).toBeLessThan(body.indexOf('<rect'));
    expect(body).toMatch(/^<g class="entity" data-qualified-name="Pa\.Pi" id="ent0002">/);
    expect(body).not.toContain('<!--');
  });

  it('draws the desc below the symbol otherwise (y = +2*RADIUS)', () => {
    const { body } = renderClassEntityPort(port(), THEME, measurer, 'ent0002');
    // text top 33.611 + 12 = 45.611, baseline + ascent 10.889 = 56.5
    expect(body).toContain('y="56.5"');
  });

  it('fills with the entity BACK colour over the style default', () => {
    const { body } = renderClassEntityPort(port({ color: '#red' }), THEME, measurer, 'ent0002');
    expect(body).toContain('fill="#F00"');
  });

  it('scales the symbol and stroke with scaleK', () => {
    const { body } = renderClassEntityPort(port(), { ...THEME, scaleK: 2 }, measurer, 'ent0002');
    expect(body).toContain('width="24" height="24"');
    expect(body).toContain('stroke-width:3;');
  });
});

describe('port dispatch helpers', () => {
  it('recognises portin/portout/port only', () => {
    expect(
      ['port', 'portin', 'portout', 'component', undefined].map((usymbol) =>
        isClassEntityPort(usymbol === undefined ? {} : { usymbol }),
      ),
    ).toEqual([true, true, true, false, false]);
  });
  it('reads the display from the header row, else the id', () => {
    expect(entityPortDisplay({ id: 'X', rows: [] })).toBe('X');
  });
});

describe('bonaco end to end', () => {
  it('draws EntityImagePort, not a class box', () => {
    const svg = renderSync(BONACO, { measurer });
    expect(svg).toContain(
      '<rect x="18" y="33.611" width="12" height="12" fill="#F1F1F1" style="stroke:#181818;stroke-width:1.5;"/>',
    );
    expect(svg).not.toContain('<!--class Pi-->');
    expect(svg).toContain('width="157px" height="180px"');
  });
});
