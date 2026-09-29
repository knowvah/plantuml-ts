/**
 * T3c (D8, `smetana-pragma-ignored`): `buildEdgeGeos` (`class-edge-geo.ts`)
 * carries the diagram's `!pragma layout smetana` flag (`ast.layoutEngine`,
 * `ast.ts`'s doc comment) onto every `EdgeGeo.smetana` it builds --
 * `net/atmp/CucaDiagram.java:480-481`'s `getCucaDiagramFileMaker` dispatches
 * the WHOLE document onto `CucaDiagramFileMakerSmetana`/`SmetanaEdge` for
 * this one pragma, and `renderer-edge.ts#renderEdge` (T3c) reads
 * `EdgeGeo.smetana` to mirror `SmetanaEdge#drawU`'s structural draw shape.
 *
 * Exercised through the SAME `layoutFixtureClass` helper (parse + layout,
 * no dot-engine stub) the kal-overlap/fixture-level tests already use, over
 * the real corpus fixture `unknown/fakone-16-boro774` (`Entity01 }|..||
 * Entity02` under the pragma) -- not a hand-built `EdgeGeo`/AST literal.
 */
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { layoutFixtureClass } from '../../oracle/svg-conformance/render-fixture-class.js';

const measurer = new WidthTableMeasurer();

describe('buildEdgeGeos — EdgeGeo.smetana carry (T3c, D8)', () => {
  it('carries smetana: true onto every edge when the diagram has !pragma layout smetana (fakone-16-boro774)', () => {
    const markup = readFileSync('test-results/dot-cache/unknown/fakone-16-boro774/in.puml', 'utf8');
    const { geo } = layoutFixtureClass(markup, measurer);
    expect(geo.edges).toHaveLength(1);
    expect(geo.edges[0]!.smetana).toBe(true);
  });

  it('leaves EdgeGeo.smetana unset without the pragma', () => {
    const markup = '@startuml\nEntity01 }|..|| Entity02\n@enduml';
    const { geo } = layoutFixtureClass(markup, measurer);
    expect(geo.edges).toHaveLength(1);
    expect(geo.edges[0]!.smetana).toBeUndefined();
  });
});
