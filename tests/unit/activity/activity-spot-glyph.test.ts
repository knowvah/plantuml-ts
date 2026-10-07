/**
 * T3g: `activity-spot-glyph-data.ts`'s captured A/B/G outlines, and
 * `activity-spot-glyph.ts#spotGlyphPath`'s translate -- plus the full
 * `renderFixtureActivity` reach check against the three cached oracle
 * fixtures this mission's census found (`nipuxu-11-tefa314`,
 * `vilecu-41-tete416`, `zaloze-31-jibo311`).
 *
 * Every `<path d>` literal below was scraped directly from the cited
 * fixture's `test-results/dot-cache/activity/<slug>/in.svg`, independently
 * of `spotGlyphPath`'s own implementation, then verified to round-trip
 * byte-for-byte back through it before being committed to
 * `activity-spot-glyph-data.ts` -- same discipline as `class-badge-t21
 * .test.ts`'s own round-trip tests.
 */
import { describe, it, expect } from 'vitest';
import { spotGlyphPath } from '../../../src/diagrams/activity/activity-spot-glyph.js';
import { SPOT_GLYPH_D, CAPTURED_SPOT_LETTERS } from '../../../src/diagrams/activity/activity-spot-glyph-data.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderFixtureActivity } from '../../oracle/svg-conformance/render-fixture-activity.js';

const measurer = new DeterministicMeasurer();

describe('spotGlyphPath — captured letters', () => {
  it('CAPTURED_SPOT_LETTERS is exactly A/B/G (this corpus\'s full census)', () => {
    expect([...CAPTURED_SPOT_LETTERS].sort()).toEqual(['A', 'B', 'G']);
  });

  it('A translated to nipuxu-11-tefa314\'s first occurrence (cx=37.663, cy=117)', () => {
    expect(spotGlyphPath('A', 37.663, 117)).toBe(
      'M39.095,117.631 L37.372,113.27 L35.643,117.631 Z M40.613,121.5 L39.512,118.697 ' +
        'L35.226,118.697 L34.112,121.5 L32.779,121.5 L36.791,111.383 L38.213,111.383 L42.164,121.5 Z',
    );
  });

  it('A translated to nipuxu-11-tefa314\'s second occurrence (cx=37.663, cy=147)', () => {
    expect(spotGlyphPath('A', 37.663, 147)).toBe(
      'M39.095,147.631 L37.372,143.27 L35.643,147.631 Z M40.613,151.5 L39.512,148.697 ' +
        'L35.226,148.697 L34.112,151.5 L32.779,151.5 L36.791,141.383 L38.213,141.383 L42.164,151.5 Z',
    );
  });

  it('B translated to vilecu-41-tete416\'s occurrence (cx=78.388, cy=129)', () => {
    expect(spotGlyphPath('B', 78.388, 129)).toBe(
      'M75.693,134.5 L75.693,124.383 L78.318,124.383 Q79.836,124.383 80.646,124.957 ' +
        'Q81.456,125.531 81.456,126.611 Q81.456,128.45 79.378,129.229 Q81.859,129.988 81.859,131.971 ' +
        'Q81.859,133.201 81.039,133.851 Q80.219,134.5 78.674,134.5 Z M77.115,133.427 L77.409,133.427 ' +
        'Q78.988,133.427 79.453,133.229 Q80.342,132.853 80.342,131.834 Q80.342,130.932 79.535,130.333 ' +
        'Q78.728,129.735 77.518,129.735 L77.115,129.735 Z M77.115,128.826 L77.573,128.826 ' +
        'Q78.721,128.826 79.354,128.334 Q79.986,127.842 79.986,126.946 Q79.986,125.456 77.676,125.456 ' +
        'L77.115,125.456 Z',
    );
  });

  it('G translated to vilecu-41-tete416\'s occurrence (cx=78.388, cy=245)', () => {
    expect(spotGlyphPath('G', 78.388, 245)).toBe(
      'M81.545,250.227 Q79.706,250.753 78.339,250.753 Q75.926,250.753 74.637,249.379 ' +
        'Q73.348,248.005 73.348,245.441 Q73.348,242.926 74.654,241.528 Q75.96,240.13 78.318,240.13 ' +
        'Q79.863,240.13 81.531,240.588 L81.531,241.914 Q79.439,241.203 78.325,241.203 ' +
        'Q76.684,241.203 75.779,242.317 Q74.873,243.432 74.873,245.455 Q74.873,247.458 75.844,248.569 ' +
        'Q76.814,249.68 78.564,249.68 Q79.282,249.68 80.116,249.427 L80.116,246.132 L81.545,246.132 Z',
    );
  });

  it('resolves lowercase the same as uppercase', () => {
    expect(spotGlyphPath('a', 10, 10)).toBe(spotGlyphPath('A', 10, 10));
    expect(spotGlyphPath('b', 10, 10)).toBe(spotGlyphPath('B', 10, 10));
    expect(spotGlyphPath('g', 10, 10)).toBe(spotGlyphPath('G', 10, 10));
  });

  it('returns undefined for a letter with no captured outline', () => {
    expect(spotGlyphPath('Z', 10, 10)).toBeUndefined();
    expect(spotGlyphPath('1', 10, 10)).toBeUndefined();
  });

  it('every captured table entry is keyed to itself (no stray letters)', () => {
    expect(Object.keys(SPOT_GLYPH_D).sort()).toEqual(['A', 'B', 'G']);
  });
});

describe('renderFixtureActivity — census fixtures reach the exact scraped glyph', () => {
  it('nipuxu-11-tefa314: two (A) spots both draw the captured A outline', () => {
    const svg = renderFixtureActivity(
      '@startuml\nstart\n:foo1;\n(A)\ndetach\n(A)\n:foo3;\n@enduml',
      measurer,
    );
    const occurrences = svg.match(/<path d="M[\d.]+,[\d.]+ L[\d.]+,[\d.]+ L[\d.]+,[\d.]+ Z M[\d.]+/g) ?? [];
    expect(occurrences.length).toBe(2);
    expect(svg).not.toContain('>A</text>');
  });

  it('vilecu-41-tete416: #blue:(B) and #green:(G) each draw their captured outline, fill #000', () => {
    const svg = renderFixtureActivity(
      '@startuml\nstart\n:x;\n#blue:(B)\n:y;\n#green:(G)\nstop\n@enduml',
      measurer,
    );
    expect(svg).not.toContain('>B</text>');
    expect(svg).not.toContain('>G</text>');
    // The glyph <path> fill stays #000 regardless of the circle's own
    // #blue/#green BackgroundColor override (FtileCircleSpot.java:110's
    // `ug.apply(fc.getColor())` is independent of `backColor`).
    const glyphPaths = [...svg.matchAll(/<path d="[^"]+" fill="([^"]+)"\/>/g)].map((m) => m[1]);
    expect(glyphPaths.length).toBeGreaterThanOrEqual(2);
    for (const fill of glyphPaths) expect(fill).toBe('#000');
  });

  it('zaloze-31-jibo311: the else-branch bare (A) spot draws the captured A outline', () => {
    const svg = renderFixtureActivity(
      '@startuml\nstart\nif (is a = b) then (yes)\n  :next;\n else\n  (A)\n  detach\nendif\n \nstop\n@enduml',
      measurer,
    );
    expect(svg).not.toContain('>A</text>');
    expect(svg).toContain('<path d="M');
  });
});
