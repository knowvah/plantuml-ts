/**
 * T21 (A5 M3a/M3b) — badge glyph table widened from 9 to 17 captured
 * letters (R/J/O/W/D/Q/S/X, scraped from cached oracle SVGs per
 * `class-badge-glyph-data.ts`'s own doc comment), plus the `entity`
 * kind->letter mapping fix (`class-badge.ts#badgeLetter`, M3b).
 *
 * Every `<path d>` literal below is hardcoded independently of
 * `badgeGlyphPath`'s own implementation (not derived by calling the
 * function under test) -- each was captured directly from the cited
 * fixture's `test-results/dot-cache/class/<slug>/in.svg` and verified to
 * round-trip byte-for-byte back through `badgeGlyphPath` before being
 * committed to `class-badge-glyph-data.ts`.
 */
import { describe, it, expect } from 'vitest';
import { resolveBadgeLetter, badgeGlyphPath, badgeLetter } from '../../../src/diagrams/class/class-badge.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderFixtureClass } from '../../oracle/svg-conformance/render-fixture-class.js';

const measurer = new DeterministicMeasurer();

describe('resolveBadgeLetter — T21 letters', () => {
  it('resolves all 8 newly-captured letters unchanged', () => {
    expect(resolveBadgeLetter('class', 'r')).toBe('R');
    expect(resolveBadgeLetter('class', 'J')).toBe('J');
    expect(resolveBadgeLetter('class', 'o')).toBe('O');
    expect(resolveBadgeLetter('class', 'W')).toBe('W');
    expect(resolveBadgeLetter('class', 'd')).toBe('D');
    expect(resolveBadgeLetter('class', 'Q')).toBe('Q');
    expect(resolveBadgeLetter('class', 's')).toBe('S');
    expect(resolveBadgeLetter('class', 'X')).toBe('X');
  });
});

describe('badgeGlyphPath — R/J/O/W/D/Q/S/X exact scraped outlines', () => {
  // Fixture sources (A5-geometry.md M3a's 16-fixture reach list):
  //   R — vegubu-29-bomu147 `Conformance << (R, #FF7700) Resource >>`
  //   J — dacisu-77-paca840 `BluetoothRetransmitter << (J,orchid) >>`
  //   O — gamevo-26-runo973 `osgGroup << OSG >>` (`!define OSG (O,lightblue)`)
  //   W — befasi-62-vimu310 `EWSMainWindow << (W,orange) >>`
  //   D — jikase-93-tipa633 `Class foo2 <<(D,orange)ABC>>`
  //   Q — befasi-62-vimu310 `WaveMedium <<(Q,orchid)>>`
  //   S — bejeli-39-sina124 `NamedStereotype <<(S,#FF7700)Stereotype>>`
  //   X — rideze-59-lizu265 `Dwelling <<(X,#FF7700)>>`
  it('R matches vegubu-29-bomu147 (translated to reference center 22,23)', () => {
    expect(badgeGlyphPath('class', 22, 23, 'R')).toBe(
      'M22.699,23.648 Q23.064,23.723 23.334,23.992 Q23.604,24.262 23.994,25.042 L26.235,29.5 ' +
        'L23.546,29.5 L22.052,26.371 Q21.985,26.238 21.877,26.005 Q21.221,24.603 20.333,24.603 ' +
        'L19.553,24.603 L19.553,29.5 L17.104,29.5 L17.104,17.107 L20.64,17.107 Q23.031,17.107 ' +
        '24.073,17.954 Q25.115,18.8 25.115,20.709 Q25.115,21.988 24.492,22.743 Q23.869,23.499 ' +
        '22.699,23.648 Z M19.553,19.166 L19.553,22.544 L20.707,22.544 Q21.711,22.544 22.147,22.15 ' +
        'Q22.583,21.755 22.583,20.851 Q22.583,19.946 22.151,19.556 Q21.719,19.166 20.707,19.166 Z',
    );
  });

  it('J matches dacisu-77-paca840 (translated to reference center 22,23)', () => {
    expect(badgeGlyphPath('class', 22, 23, 'J')).toBe(
      'M17.655,28.386 L17.655,25.547 Q18.369,26.277 19.178,26.659 Q19.987,27.041 20.809,27.041 ' +
        'Q21.772,27.041 22.22,26.56 Q22.668,26.078 22.668,25.024 L22.668,18.765 L19.672,18.765 ' +
        'L19.672,16.607 L25.117,16.607 L25.117,25.024 Q25.117,27.29 24.167,28.265 Q23.216,29.241 ' +
        '21.033,29.241 Q20.245,29.241 19.385,29.025 Q18.526,28.809 17.655,28.386 Z',
    );
  });

  it('O matches gamevo-26-runo973 (translated to reference center 22,23)', () => {
    expect(badgeGlyphPath('class', 22, 23, 'O')).toBe(
      'M21.613,19.083 Q20.675,19.083 20.244,20.083 Q19.812,21.083 19.812,23.316 Q19.812,25.541 ' +
        '20.244,26.541 Q20.675,27.541 21.613,27.541 Q22.56,27.541 22.991,26.541 Q23.423,25.541 ' +
        '23.423,23.316 Q23.423,21.083 22.991,20.083 Q22.56,19.083 21.613,19.083 Z M17.264,23.316 ' +
        'Q17.264,20.137 18.364,18.51 Q19.463,16.883 21.613,16.883 Q23.771,16.883 24.871,18.51 ' +
        'Q25.971,20.137 25.971,23.316 Q25.971,26.487 24.871,28.114 Q23.771,29.741 21.613,29.741 ' +
        'Q19.463,29.741 18.364,28.114 Q17.264,26.487 17.264,23.316 Z',
    );
  });

  it('W matches befasi-62-vimu310 EWSMainWindow (translated to reference center 22,23)', () => {
    expect(badgeGlyphPath('class', 22, 23, 'W')).toBe(
      'M18.5,19.252 L20.012,19.252 L20.639,25.674 L21.395,21.52 L22.83,21.52 L23.709,25.674 ' +
        'L24.201,19.252 L25.725,19.252 L24.717,28 L23.105,28 L22.109,23.406 L21.178,28 L19.578,28 Z',
    );
  });

  it('D matches jikase-93-tipa633 (translated to reference center 22,23)', () => {
    expect(badgeGlyphPath('class', 22, 23, 'D')).toBe(
      'M21.086,19.315 L21.086,27.292 L21.75,27.292 Q23.194,27.292 23.809,26.383 Q24.423,25.474 ' +
        '24.423,23.291 Q24.423,21.125 23.809,20.22 Q23.194,19.315 21.75,19.315 Z M18.637,17.107 ' +
        'L21.26,17.107 Q24.298,17.107 25.635,18.555 Q26.971,20.004 26.971,23.291 Q26.971,26.586 ' +
        '25.635,28.043 Q24.298,29.5 21.26,29.5 L18.637,29.5 Z',
    );
  });

  it('Q matches befasi-62-vimu310 WaveMedium (translated to reference center 22,23)', () => {
    expect(badgeGlyphPath('class', 22, 23, 'Q')).toBe(
      'M21.344,27.135 Q21.262,27.152 21.206,27.161 Q21.15,27.17 21.098,27.17 Q19.592,27.17 ' +
        '18.815,26.021 Q18.039,24.873 18.039,22.635 Q18.039,20.391 18.815,19.242 Q19.592,18.094 ' +
        '21.109,18.094 Q22.633,18.094 23.409,19.242 Q24.186,20.391 24.186,22.635 Q24.186,24.176 ' +
        '23.816,25.216 Q23.447,26.256 22.744,26.701 L23.834,27.768 L22.65,28.646 Z M21.109,19.646 ' +
        'Q20.447,19.646 20.143,20.353 Q19.838,21.059 19.838,22.635 Q19.838,24.205 20.143,24.911 ' +
        'Q20.447,25.617 21.109,25.617 Q21.777,25.617 22.082,24.911 Q22.387,24.205 22.387,22.635 ' +
        'Q22.387,21.059 22.082,20.353 Q21.777,19.646 21.109,19.646 Z',
    );
  });

  it('S matches bejeli-39-sina124 (translated to reference center 22,23)', () => {
    expect(badgeGlyphPath('class', 22, 23, 'S')).toBe(
      'M21.733,24.063 Q19.882,23.357 19.227,22.581 Q18.571,21.805 18.571,20.494 Q18.571,18.809 ' +
        '19.65,17.846 Q20.729,16.883 22.613,16.883 Q23.468,16.883 24.323,17.078 Q25.178,17.273 ' +
        '26.017,17.655 L26.017,20.045 Q25.228,19.489 24.415,19.199 Q23.601,18.908 22.804,18.908 ' +
        'Q21.916,18.908 21.443,19.265 Q20.97,19.622 20.97,20.286 Q20.97,20.801 21.314,21.137 ' +
        'Q21.659,21.473 22.754,21.88 L23.809,22.278 Q25.303,22.826 26.008,23.731 Q26.714,24.636 ' +
        '26.714,26.014 Q26.714,27.89 25.606,28.815 Q24.498,29.741 22.256,29.741 Q21.335,29.741 ' +
        '20.409,29.521 Q19.484,29.301 18.621,28.869 L18.621,26.337 Q19.6,27.035 20.517,27.375 ' +
        'Q21.435,27.715 22.331,27.715 Q23.236,27.715 23.734,27.304 Q24.232,26.894 24.232,26.155 ' +
        'Q24.232,25.599 23.9,25.179 Q23.568,24.76 22.937,24.52 Z',
    );
  });

  it('X matches rideze-59-lizu265 (translated to reference center 22,23)', () => {
    expect(badgeGlyphPath('class', 22, 23, 'X')).toBe(
      'M26.511,29.5 L23.98,29.5 L21.614,25.399 L19.256,29.5 L16.725,29.5 L20.36,23.208 ' +
        'L16.824,17.107 L19.356,17.107 L21.614,21.05 L23.88,17.107 L26.412,17.107 L22.892,23.208 Z',
    );
  });
});

describe('renderFixtureClass — T21 letters reach the rendered <path> byte-exact', () => {
  it.each([
    ['R', 'class Conformance << (R, #FF7700) >>'],
    ['J', 'class BluetoothRetransmitter << (J,orchid) >>'],
    ['O', 'class osgGroup <<(O,lightblue)>>'],
    ['W', 'class EWSMainWindow <<(W,orange)>>'],
    ['D', 'Class foo2 <<(D,orange)>>'],
    ['Q', 'class WaveMedium <<(Q,orchid)>>'],
    ['S', 'class NamedStereotype <<(S,#FF7700)>>'],
    ['X', 'class Dwelling <<(X,#FF7700)>>'],
  ])('%s: single-classifier fixture draws the exact scraped glyph at (22,23)', (letter, decl) => {
    const svg = renderFixtureClass(`@startuml\nhide empty members\n${decl}\n@enduml`, measurer);
    expect(svg).toContain(`d="${badgeGlyphPath('class', 22, 23, letter)}"`);
  });
});

describe('badgeLetter — T21 M3b: entity shares enum\'s own letter (E)', () => {
  it("badgeLetter('entity') returns 'E', not the un-surveyed default 'C'", () => {
    expect(badgeLetter('entity')).toBe('E');
    expect(badgeLetter('entity')).toBe(badgeLetter('enum'));
  });

  it('`entity ENTITY` draws the E glyph, not the class default C (reach: lilura-67-cati343, tepazu-23-zapo261, xidura-26-teki974)', () => {
    const svg = renderFixtureClass(`@startuml\nhide empty members\nentity ENTITY\n@enduml`, measurer);
    // Single-classifier fixture: badge center is (22, 23), the SAME
    // box-origin convention every other test in this file establishes.
    expect(svg).toContain(`d="${badgeGlyphPath('entity', 22, 23)}"`);
    expect(svg).not.toContain(`d="${badgeGlyphPath('class', 22, 23)}"`);
  });
});
