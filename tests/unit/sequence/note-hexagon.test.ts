/**
 * sdd1 T3e item 1: `hnote` is `ComponentRoseNoteHexagonal`, a 7-point
 * `UPolygon` whose middle vertices sit at `textHeight / 2` in INTEGER
 * division (`ComponentRoseNoteHexagonal.java:89,99-106`).
 *
 * Every expected point list was rendered by the jar with
 * `scripts/oracle-render.sh` on 2026-10-20 (deterministic text); the jar
 * writes `style="stroke:…"`, which the port's klimt drivers now write too; only
 * `points` and the paint values are asserted, through `attrsOf`.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderFixtureSequence } from '../../oracle/svg-conformance/render-fixture-sequence.js';
import { attrsOf } from '../../helpers/svg-tags.js';

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '../../fixtures/isw-T2b-seq');

function render(source: string): string {
  return renderFixtureSequence(source, new DeterministicMeasurer());
}

/** Every `<polygon>` filled with the note background, in document order. */
function notePolygons(svg: string): string[] {
  return [...svg.matchAll(/<polygon [^>]*>/g)].map((m) => m[0]).filter((t) => t.includes('#FEFFDD'));
}

function pointsOf(tag: string): string | undefined {
  return /\spoints="([^"]*)"/.exec(tag)?.[1];
}

describe('hnote hexagon (ComponentRoseNoteHexagonal.java:87-115)', () => {
  it('draws every hnote of note-hnote as the jar polygon, vertex for vertex', () => {
    const source = readFileSync(join(FIXTURES, 'note-hnote.puml'), 'utf8');
    const jar = readFileSync(join(FIXTURES, 'note-hnote.svg'), 'utf8');
    const ours = notePolygons(render(source));
    expect(ours.map(pointsOf)).toEqual(notePolygons(jar).map(pointsOf));
    expect(ours).toHaveLength(6);
  });

  it('halves an odd textHeight in integer division: 21 -> 10, not 10.5 (:89,102,105)', () => {
    // One line at note { FontSize 13 }: textHeight = 13 + 4 + 4 = 21 (jar
    // `note-hnote`: `25,79 … 80,89 … 15,89` -- the middle row 10 below 79).
    const [poly] = notePolygons(render('@startuml\nparticipant A\nhnote over A : odd\n@enduml\n'));
    const ys = pointsOf(poly!)!
      .split(',')
      .filter((_, i) => i % 2 === 1)
      .map(Number);
    const top = ys[0]!;
    expect(ys.map((y) => y - top)).toEqual([0, 0, 10, 21, 21, 10, 0]);
  });

  it('scales every vertex at emission, cornersize and the integer half included (scale 1.5)', () => {
    // jar: `hx-scale.puml` (`scale 1.5`, `skinparam shadowing true`).
    const svg = render('@startuml\nscale 1.5\nskinparam shadowing true\nparticipant A\nhnote over A : odd\n@enduml\n');
    const [poly] = notePolygons(svg);
    expect(pointsOf(poly!)).toBe('37.5,82.5,75,82.5,90,97.5,75,114,37.5,114,22.5,97.5,37.5,82.5');
    expect(attrsOf(poly!)['stroke-width']).toBe('0.75');
    expect(attrsOf(poly!).filter).toMatch(/^url\(#[^)]+\)$/);
  });

  it('draws hnote across as a hexagon too (FactorySequenceNoteAcrossCommand.java:227)', () => {
    // jar `hx-across.puml` (this source).
    const svg = render('@startuml\nparticipant A\nparticipant B\nhnote across : wide\n@enduml\n');
    expect(notePolygons(svg).map(pointsOf)).toEqual(['25,52,55,52,65,62,55,73,25,73,15,62,25,52']);
  });

  it('draws an hnote under a message as the Opale NOTE (CommunicationTileNoteBottomTopAbstract.java:108)', () => {
    // jar `hx-under.puml`: `hnote bottom` draws the folded-corner pair of paths.
    const svg = render('@startuml\nparticipant A\nparticipant B\nA -> B : hi\nhnote bottom : under\n@enduml\n');
    expect(notePolygons(svg)).toEqual([]);
    expect([...svg.matchAll(/<path [^>]*fill="#FEFFDD"/g)]).toHaveLength(2);
  });

  it('keeps rnote a rounded URectangle (ComponentRoseNoteBox.java:99-102)', () => {
    const svg = render('@startuml\nparticipant A\nrnote over A : box\n@enduml\n');
    expect(notePolygons(svg)).toEqual([]);
    expect(svg).toMatch(/<rect [^>]*fill="#FEFFDD"/);
  });
});
