/**
 * cdd3-T28 (E3-14, gujigi-63-roki030) -- an `allowmixing` leaf declared as
 * `package "Elektronisk dokument"` is a `LeafType.DESCRIPTION` entity with
 * `USymbols.PACKAGE`, drawn by `EntityImageDescription`
 * (`svek/GeneralImageBuilder.java:160-167`) -- not the generic class box.
 * Expected values come from the jar's `in.svg` for the fixture.
 */
import { describe, it, expect } from 'vitest';

import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { usesClassUSymbolEntity } from '../../../src/diagrams/class/renderer-usymbol-entity.js';
import type { ClassifierGeo } from '../../../src/diagrams/class/class-geo-types.js';

const PUML = [
  '@startuml',
  'allowmixing',
  'class a',
  'package "Elektronisk dokument"',
  'a . "Elektronisk dokument"',
  '@enduml',
].join('\n');

function entityGroup(svg: string, name: string): string {
  const start = svg.indexOf(`<!--entity ${name}-->`);
  if (start < 0) throw new Error(`no <!--entity ${name}--> in the render`);
  return svg.slice(start, svg.indexOf('</g>', start));
}

describe('descriptive package leaf in a class diagram (cdd3-T28, E3-14)', () => {
  it('routes a descriptive+package leaf through EntityImageDescription', () => {
    const geo = { kind: 'descriptive', usymbol: 'package' } as Pick<ClassifierGeo, 'kind' | 'usymbol'>;
    expect(usesClassUSymbolEntity(geo as ClassifierGeo)).toBe(true);
  });

  it('draws the USymbolFolder tab path and bold title the jar draws (gujigi-63-roki030)', () => {
    const group = entityGroup(renderSync(PUML, { measurer: new DeterministicMeasurer() }), 'Elektronisk dokument');
    // jar (re-captured, oracle seam #4 v2): `<path d="M376.39,584.5 ... L549.678,..." fill="#F1F1F1"/>`,
    // a divider `<line>` and `<text ... textLength="133.788"
    // font-weight="700">` 10px right of the path's left edge.
    expect(group).toMatch(/<path d="M[^"]*"[^>]*fill="#F1F1F1"/);
    expect(group).toMatch(/textLength="133\.788" font-weight="700">Elektronisk dokument</);
    const xs = [...group.matchAll(/[ML](-?[\d.]+),/g)].map((m) => Number(m[1]));
    const textX = Number(/<text x="([\d.]+)"/.exec(group)![1]);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(175.788, 3);
    expect(textX - Math.min(...xs)).toBeCloseTo(10, 3);
  });
});
