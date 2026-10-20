/**
 * sdd1 T3e item 6: the lifeline group's `<title>` is
 * `UGroup.singletonMap(TITLE, display.toTooltipText())`
 * (`ComponentRoseLine.java:82`) over `participant.getDisplay(...)`
 * (`MutingLine.java:107-108`). `getDisplay` puts a shown stereotype FIRST
 * (`Participant.java:125-135`), `toTooltipText` is the first element
 * (`Display.java:601-605`), and `UGroup#fix` writes every `[^-\w ]` as `.`
 * (`UGroup.java:70-74`).
 *
 * Expected titles from the jar (`scripts/oracle-render.sh`, 2026-10-20,
 * `tt.puml` = SOURCE below, `hs2.puml` for `hide stereotype`).
 */
import { describe, expect, it } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderFixtureSequence } from '../../oracle/svg-conformance/render-fixture-sequence.js';

function titles(body: string): string[] {
  const svg = renderFixtureSequence(`@startuml\n${body}\n@enduml\n`, new DeterministicMeasurer());
  return [...svg.matchAll(/<title>([^<]*)<\/title>/g)].map((m) => m[1]!).filter((t) => t !== '');
}

const SOURCE = [
  'participant A <<s>>',
  'participant B <<(X,#pink) s>>',
  'participant "Foo:Bar\\nline2" as F',
  'participant D <<a>><<b>>',
  'A -> F',
].join('\n');

describe('lifeline title (ComponentRoseLine.java:82, MutingLine.java:107-108)', () => {
  it('is the shown stereotype, else the first display line, through UGroup#fix', () => {
    expect(titles(SOURCE)).toEqual(['..s..', '...X..pink. s..', 'Foo.Bar', '..a....b..']);
  });

  it('is the name once hide stereotype drops the stereotype from the display (Participant.java:125-135)', () => {
    expect(titles('participant A <<s>>\nparticipant B\nB -> A\nhide stereotype')).toEqual(['A', 'B']);
  });

  it('reads the DECORATED stereotype for title and style (CommandParticipant.java:176-181, MutingLine.java:105)', () => {
    // jar `tt-spot.puml`: a 6-hex spot colour parses (`StereotypeDecoration
    // .circleChar`), so the title is `C <<T>>` and `.T { lifeLine }` paints.
    const body = [
      '<style>',
      '.T {',
      '  lifeLine {',
      '    LineColor blue',
      '  }',
      '}',
      '</style>',
      'participant A << (C,#FF0000) T >>',
      'participant B',
      'A -> B',
    ].join('\n');
    expect(titles(body)).toEqual(['C .. T ..', 'B']);
    const svg = renderFixtureSequence(`@startuml\n${body}\n@enduml\n`, new DeterministicMeasurer());
    const [first] = [...svg.matchAll(/<line [^>]*stroke-dasharray="5,5"[^>]*>/g)].map((m) => m[0]);
    expect(first).toContain('stroke="#00F"');
  });

  it('keeps an undecoratable spot raw: `#red` is no circleChar COLOR (jar tt-spot with #red)', () => {
    expect(titles('participant A << (C,#red) T >>\nparticipant B\nA -> B')).toEqual(['.. .C..red. T ..', 'B']);
  });
});
