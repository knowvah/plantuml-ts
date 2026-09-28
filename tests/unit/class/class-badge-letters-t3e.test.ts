/**
 * cdd5-T3e (badge-glyph-letter-uncaptured, `diagnosis/S2-edge.md`) --
 * `<< (T,color) >>`/`<< (H,color) >>` custom stereotype-char badges
 * (`EntityImageClassHeader.java:179-183`, `stereotype.getCharacter() != 0`)
 * fell through `resolveBadgeLetter`'s captured-table check to the kind's
 * own default letter ('C') for want of a T/H entry -- the SAME mechanism
 * T21 (`class-badge-t21.test.ts`) already fixed for R/J/O/W/D/Q/S/X.
 *
 * Every `<path d>` literal below is hardcoded independently of
 * `badgeGlyphPath`'s own implementation -- captured directly from the
 * cited fixture's `test-results/dot-cache/unknown/<slug>/in.svg`, per
 * `class-badge-glyph-data.ts`'s own doc comment for the T/H entries.
 */
import { describe, it, expect } from 'vitest';
import { resolveBadgeLetter, badgeGlyphPath } from '../../../src/diagrams/class/class-badge.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderFixtureClass } from '../../oracle/svg-conformance/render-fixture-class.js';

const measurer = new DeterministicMeasurer();

describe('resolveBadgeLetter — T3e T/H letters', () => {
  it('resolves both newly-captured letters unchanged', () => {
    expect(resolveBadgeLetter('class', 't')).toBe('T');
    expect(resolveBadgeLetter('class', 'H')).toBe('H');
  });

  it('still falls back to the kind default for an un-captured char (no regression)', () => {
    expect(resolveBadgeLetter('class', 'Z')).toBe('C');
  });
});

describe('badgeGlyphPath — T/H exact scraped outlines', () => {
  // Fixture sources:
  //   T — dedumo-33-paco879 `class user_role << (T,#FFAAAA) >>`
  //   H — fepoko-61-fona364 `<< (H,#E6FFE6) >>`
  it('T matches dedumo-33-paco879 (translated to reference center 22,23)', () => {
    expect(badgeGlyphPath('class', 22, 23, 'T')).toBe(
      'M23.342,30.25 L20.893,30.25 L20.893,19.999 L17.747,19.999 L17.747,17.857 L26.488,17.857 ' +
        'L26.488,19.999 L23.342,19.999 Z',
    );
  });

  it('H matches fepoko-61-fona364 (translated to reference center 22,23)', () => {
    expect(badgeGlyphPath('class', 22, 23, 'H')).toBe(
      'M17.637,17.107 L20.086,17.107 L20.086,21.83 L23.149,21.83 L23.149,17.107 L25.598,17.107 ' +
        'L25.598,29.5 L23.149,29.5 L23.149,23.988 L20.086,23.988 L20.086,29.5 L17.637,29.5 Z',
    );
  });
});

describe('renderFixtureClass — T/H reach the rendered <path> byte-exact', () => {
  it.each([
    ['T', 'class user_role << (T,#FFAAAA) >>'],
    ['H', 'class Foo << (H,#E6FFE6) >>'],
  ])('%s: single-classifier fixture draws the exact scraped glyph at (22,23)', (letter, decl) => {
    const svg = renderFixtureClass(`@startuml\nhide empty members\n${decl}\n@enduml`, measurer);
    expect(svg).toContain(`d="${badgeGlyphPath('class', 22, 23, letter)}"`);
  });
});

// ---------------------------------------------------------------------------
// jar-scraped byte-exact rows -- single classifiers, no dot-engine geometry.
// ---------------------------------------------------------------------------

describe('dedumo-33-paco879 — T badge fill + glyph (reduced reproduction)', () => {
  // A faithful byte-for-byte position match needs the original fixture's
  // `!define`-expanded bold/underlined member line; this reduced form
  // proves the T3e mechanism (fill + glyph dispatch through the real
  // parse -> layout -> render pipeline) self-consistently instead, mirroring
  // `renderFixtureClass — T/H reach the rendered <path> byte-exact` above at
  // a DIFFERENT (non-(22,23)) badge position.
  it('user_role draws the T badge fill/glyph wherever the header places it', () => {
    const svg = renderFixtureClass(
      ['@startuml', 'class user_role << (T,#FFAAAA) >> {', '  id : BIGINTEGER', '}', '@enduml'].join('\n'),
      measurer,
    );
    const m = /<ellipse cx="([^"]*)" cy="([^"]*)"[^>]*fill="([^"]*)"[^>]*\/><path d="([^"]*)"/.exec(svg);
    expect(m).not.toBeNull();
    // #FFAAAA shortens to #FAA (every pair -- FF/AA/AA -- has two identical
    // digits); jar-scraped (dedumo-33-paco879) confirms `fill="#FAA"`.
    expect(m![3]).toBe('#FAA');
    expect(m![4]).toBe(badgeGlyphPath('class', Number(m![1]), Number(m![2]), 'T'));
  });
});

describe('fepoko-61-fona364 — H badge fill + glyph (reduced reproduction)', () => {
  it('H-stereotyped classifier draws the H badge fill/glyph wherever the header places it', () => {
    const svg = renderFixtureClass(
      ['@startuml', 'class Foo << (H,#E6FFE6) >> {', '  x : int', '}', '@enduml'].join('\n'),
      measurer,
    );
    const m = /<ellipse cx="([^"]*)" cy="([^"]*)"[^>]*fill="([^"]*)"[^>]*\/><path d="([^"]*)"/.exec(svg);
    expect(m).not.toBeNull();
    // #E6FFE6 has no 3-digit shorthand (E6's two digits differ).
    expect(m![3]).toBe('#E6FFE6');
    expect(m![4]).toBe(badgeGlyphPath('class', Number(m![1]), Number(m![2]), 'H'));
  });
});
