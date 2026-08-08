/**
 * Tests for the OpenIconic `<&glyph>` inline-atom geometry engine
 * (src/core/openiconic-glyphs.ts) and its span recognizer
 * (src/core/creole-atoms-openicon.ts) / measurement wiring
 * (src/core/creole-atoms.ts#measureInlineAtom).
 *
 * G2 N41. Every `buildOpenIconicPathD` expectation below is copied VERBATIM
 * from a real jar-cached fixture's own `<path d>` output (`plans/g2-class-
 * svg/ledger.md` N41's byte-verification table) -- not synthesized.
 *
 * T8: re-derived at 3-decimal precision. The pre-T8 expectations here were
 * 4-decimal (this file's own private `fmt`, `javaFixed4`), which never
 * matched the jar's real `<path d>` output -- upstream's `SvgOption.decimal`
 * defaults to 3 for EVERY path segment (`SvgGraphics#svgPath` calls the SAME
 * `format()` every other coordinate goes through, `DriverPathSvg.java` ->
 * `SvgGraphics.java:823-876`; verified directly against
 * `~/git/plantuml/src/main/java/net/atmp/SvgOption.java:61`). Values below
 * are the geometrically-identical, correctly-3-decimal-rounded numbers
 * (re-derived from the unchanged upstream-verified op stream, not
 * re-measured against a new fixture).
 */
import { describe, it, expect } from 'vitest';
import {
  buildOpenIconicPathD,
  isKnownOpenIconicGlyph,
  openIconicDims,
  openIconicFactor,
  openIconicOriginY,
} from '../../src/core/openiconic-glyphs.js';
import { RAW_GLYPHS } from '../../src/core/openiconic-glyphs-data.js';
import { scanLineForAtoms, matchAtomAt } from '../../src/core/creole-atoms.js';
import { measureInlineAtom } from '../../src/core/creole-atoms-measure.js';
import { measureLeafNode } from '../../src/diagrams/description/leaf-sizing.js';
import { WidthTableMeasurer } from '../../src/core/measurer.js';
import type { DescriptiveNode } from '../../src/diagrams/description/ast.js';

describe('isKnownOpenIconicGlyph', () => {
  it('recognizes all 6 corpus-reach glyph names', () => {
    for (const name of ['x', 'key', 'ban', 'caret-right', 'link-intact', 'thumb-up']) {
      expect(isKnownOpenIconicGlyph(name)).toBe(true);
    }
  });

  it('rejects an unrecognized name', () => {
    // F1-c extended `RAW_GLYPHS` to upstream's full ~223-icon set, so
    // 'pencil' -- the ORIGINAL fixture's placeholder for an unrecognized
    // name -- is now itself a real, resolvable glyph; a genuinely fake name
    // is required to exercise this branch (AC4: "unknown -> no atom" must
    // stay provably true for whatever names remain absent, not merely
    // assumed unchanged).
    expect(isKnownOpenIconicGlyph('not-a-real-icon')).toBe(false);
    expect(isKnownOpenIconicGlyph('')).toBe(false);
  });
});

describe('openIconicFactor', () => {
  it('is scale * fontSize / 12 (AtomOpenIconic ctor)', () => {
    expect(openIconicFactor(1, 12)).toBe(1);
    expect(openIconicFactor(1, 24)).toBe(2);
    expect(openIconicFactor(2.25, 14)).toBeCloseTo(2.625, 10);
  });
});

describe('openIconicDims', () => {
  it('adds the flat 2px (1px each side) margin to width only', () => {
    expect(openIconicDims(1)).toEqual({ width: 10, height: 8 });
    expect(openIconicDims(2)).toEqual({ width: 18, height: 16 });
  });
});

describe('buildOpenIconicPathD -- byte-exact against jar-cached fixtures', () => {
  it('x glyph (bidusa-22-jutu505, factor=14/12=1.16667)', () => {
    const factor = openIconicFactor(1, 14);
    const y = openIconicOriginY(53.8889, 14, factor);
    const d = buildOpenIconicPathD('x', factor, 14, y);
    expect(d).toBe(
      'M15.645,44.167 L14,45.812 L14.84,46.652 L16.917,48.763 L14.84,50.84 L14,51.645 L15.645,53.325 ' +
        'L16.485,52.485 L18.597,50.373 L20.673,52.485 L21.478,53.325 L23.158,51.645 L22.318,50.84 ' +
        'L20.207,48.763 L22.318,46.652 L23.158,45.812 L21.478,44.167 L20.673,45.007 L18.597,47.083 ' +
        'L16.485,45.007 L15.645,44.167',
    );
  });

  it('key glyph, two subpaths (gekope-01-ricu859, factor=1)', () => {
    const factor = openIconicFactor(1, 12);
    const y = openIconicOriginY(45.8889, 14, factor);
    const d = buildOpenIconicPathD('key', factor, 14, y);
    expect(d).toBe(
      'M19.5,38 C18.12,38 17,39.12 17,40.5 C17,40.66 17,40.82 17.03,40.97 L14,44 L14,46 L17,46 L17,44 L19,44 ' +
        'L19,43 L19.03,42.97 C19.18,43 19.34,43 19.5,43 C20.88,43 22,41.88 22,40.5 C22,39.12 20.88,38 19.5,38 ' +
        'M20,39 C20.55,39 21,39.45 21,40 C21,40.55 20.55,41 20,41 C19.45,41 19,40.55 19,40 C19,39.45 19.45,39 20,39',
    );
  });

  it('caret-right glyph, source transform="translate(2)" (gekope-01-ricu859, factor=1)', () => {
    const factor = openIconicFactor(1, 12);
    const y = openIconicOriginY(201.8889, 14, factor);
    const d = buildOpenIconicPathD('caret-right', factor, 14, y);
    expect(d).toBe('M16,194 L16,202 L20,198 L16,194');
  });

  it('ban glyph, three subpaths, S-command mirroring (rideze-59-lizu265, factor=2)', () => {
    const factor = openIconicFactor(1, 24);
    const y = openIconicOriginY(61.8889, 14, factor);
    const d = buildOpenIconicPathD('ban', factor, 28, y);
    expect(d).toBe(
      'M36,43 C31.6,43 28,46.6 28,51 C28,55.4 31.6,59 36,59 C40.4,59 44,55.4 44,51 C44,46.6 40.4,43 36,43 ' +
        'M36,45 C37.32,45 38.52,45.42 39.5,46.12 L31.12,54.5 C30.42,53.52 30,52.32 30,51 C30,47.68 32.68,45 36,45 ' +
        'M40.88,47.5 C41.58,48.48 42,49.68 42,51 C42,54.32 39.32,57 36,57 C34.68,57 33.48,56.58 32.5,55.88 L40.88,47.5',
    );
  });

  it('link-intact glyph, arc + null-mirror S fallback (gekope-01-ricu859, factor=1)', () => {
    const factor = openIconicFactor(1, 12);
    const y = openIconicOriginY(59.8889, 14, factor);
    const d = buildOpenIconicPathD('link-intact', factor, 14, y);
    expect(d).toBe(
      'M19.88,52.03 C19.7,52.04 19.52,52.06 19.35,52.12 C19.08,52.22 18.82,52.37 18.6,52.59 A0.5,0.5 0 1 0 ' +
        '19.29,53.28 C19.4,53.17 19.53,53.11 19.67,53.06 C20.02,52.94 20.45,52.99 20.73,53.28 C21.12,53.67 ' +
        '21.12,54.32 20.73,54.72 L19.23,56.22 C18.79,56.66 18.43,56.7 18.17,56.69 C17.91,56.68 17.76,56.56 ' +
        '17.76,56.56 A0.5,0.5 0 1 0 17.26,57.44 C17.6,57.66 17.6,57.66 18.1,57.69 C18.6,57.72 19.3,57.53 ' +
        '19.91,56.91 L21.41,55.41 C22.19,54.63 22.19,53.37 21.41,52.6 C21.13,52.32 20.8,52.15 20.44,52.07 ' +
        'C20.26,52.03 20.06,52.03 19.88,52.04 M17.88,54.34 C17.38,54.32 16.69,54.49 16.1,55.09 L14.6,56.59 ' +
        'C13.82,57.37 13.82,58.63 14.6,59.4 C15.16,59.96 15.96,60.12 16.66,59.87 C16.93,59.77 17.19,59.62 ' +
        '17.41,59.4 A0.5,0.5 0 1 0 16.72,58.71 C16.61,58.82 16.48,58.88 16.34,58.93 C15.99,59.05 15.56,59 ' +
        '15.28,58.71 C14.89,58.32 14.89,57.67 15.28,57.27 L16.78,55.77 C17.18,55.37 17.53,55.32 17.81,55.33 ' +
        'C18.09,55.34 18.28,55.42 18.28,55.42 A0.5,0.5 0 1 0 18.72,54.54 C18.38,54.34 18.38,54.34 17.88,54.32',
    );
  });

  it('thumb-up glyph, two subpaths (rideze-59-lizu265, factor=14/12)', () => {
    const factor = openIconicFactor(1, 14);
    const y = openIconicOriginY(61.8889, 14, factor);
    const d = buildOpenIconicPathD('thumb-up', factor, 118.3625, y);
    expect(d).toBe(
      'M123.578,52.167 C123.356,52.19 123.146,52.342 123.029,52.563 C122.878,52.867 121.758,55.118 ' +
        '121.536,55.34 C121.314,55.562 121.023,55.667 120.696,55.667 L120.696,60.333 L124.779,60.333 ' +
        'C125.024,60.333 125.234,60.182 125.328,59.972 C125.328,59.972 126.529,56.577 126.529,56.25 ' +
        'C126.529,55.923 126.273,55.667 125.946,55.667 L124.196,55.667 C123.869,55.667 123.613,55.375 ' +
        '123.613,55.083 C123.613,54.792 124.068,53.24 124.161,52.937 C124.254,52.633 124.102,52.307 ' +
        '123.799,52.202 C123.718,52.178 123.659,52.155 123.578,52.167 M118.363,55.667 L118.363,60.333 ' +
        'L119.529,60.333 L119.529,55.667 L118.363,55.667',
    );
  });

  it('returns undefined for an unrecognized glyph name', () => {
    expect(buildOpenIconicPathD('not-a-real-icon', 1, 0, 0)).toBeUndefined();
  });
});

describe('buildOpenIconicPathD -- F1-c full-set extension, byte-exact against 7 new jar-cached spot-checks', () => {
  // Every fixture below is the same isolated single-icon probe
  // (`rectangle "aa<&NAME>"`, factor = 14/12 default font, no DOT since a
  // single-entity diagram emits none -- `plans/s1l-tail-diagnosis/findings/
  // sprite.md`'s `vivido-49-nisu863` isolation) -- oracle-generated 2026-08-07
  // (`java -DPLANTUML_DETERMINISTIC_TEXT=true -jar oracle/dist/plantuml-
  // oracle.jar -tsvg`). `originX`/`originY` are derived from each probe's own
  // jar SVG (`text x="17" textLength="15.575"` -> `originX = 17+15.575+1`;
  // `text y="27.8889"` -> `originY = openIconicOriginY(27.8889, 14, factor)`),
  // never hand-rounded -- rounding `originY` by hand (as an earlier draft of
  // this verification did) drifts the LAST digit of some ops by 0.0001
  // against the jar, a test-harness artifact, not a `buildOpenIconicPathD`
  // defect; routing through the real `openIconicOriginY` avoids it entirely.
  const factor = openIconicFactor(1, 14);
  const originX = 33.575;
  const originY = openIconicOriginY(27.8889, 14, factor);

  it('cloud glyph, Y-only translate (transform="translate(0 1)") -- the vivido-49-nisu863 node-2 glyph', () => {
    expect(buildOpenIconicPathD('cloud', factor, originX, originY)).toBe(
      'M38.825,19.333 C37.413,19.333 36.177,20.337 35.908,21.667 C34.625,21.667 33.575,22.717 33.575,24 ' +
        'C33.575,25.283 34.625,26.333 35.908,26.333 L41.158,26.333 C42.127,26.333 42.908,25.552 42.908,' +
        '24.583 C42.908,23.825 42.418,23.078 41.742,22.833 L41.742,22.25 C41.742,20.64 40.435,19.333 ' +
        '38.825,19.333',
    );
  });

  it('euro glyph -- reproduces the upstream regex bug: source declares transform="translate(-1)" but the jar' +
    ' drops it (no translateX applied)', () => {
    expect(buildOpenIconicPathD('euro', factor, originX, originY)).toBe(
      'M40.575,18.167 C38.405,18.167 36.608,19.66 36.095,21.667 L33.867,21.667 L33.575,22.833 L35.92,22.833 ' +
        'C35.92,23.242 36.002,23.627 36.107,24 L33.808,24 L33.587,25.167 L36.573,25.167 C37.39,26.555 ' +
        '38.872,27.5 40.587,27.5 C41.438,27.5 42.232,27.255 42.92,26.847 L42.92,25.423 C42.302,25.983 ' +
        '41.497,26.333 40.587,26.333 C39.548,26.333 38.638,25.878 37.997,25.167 L40.587,25.167 ' +
        'L40.773,24 L37.308,24 C37.18,23.627 37.087,23.253 37.087,22.833 L40.983,22.833 L41.17,21.667 ' +
        'L37.308,21.667 C37.787,20.313 39.07,19.333 40.587,19.333 C41.357,19.333 42.057,19.578 ' +
        '42.628,19.987 L42.815,18.75 C42.15,18.388 41.403,18.167 40.587,18.167',
    );
  });

  it('media-play glyph, both X and Y translate (transform="translate(1 1)")', () => {
    expect(buildOpenIconicPathD('media-play', factor, originX, originY)).toBe(
      'M34.742,19.333 L34.742,26.333 L41.742,22.833 L34.742,19.333',
    );
  });

  it('loop-circular glyph, Y-only translate, C-curve heavy two-subpath path', () => {
    expect(buildOpenIconicPathD('loop-circular', factor, originX, originY)).toBe(
      'M38.242,19.333 C36.317,19.333 34.742,20.908 34.742,22.833 L33.575,22.833 L35.325,25.167 ' +
        'L37.075,22.833 L35.908,22.833 C35.908,21.538 36.947,20.5 38.242,20.5 L38.242,19.333 ' +
        'M41.158,20.5 L39.408,22.833 L40.575,22.833 C40.575,24.128 39.537,25.167 38.242,25.167 ' +
        'L38.242,26.333 C40.167,26.333 41.742,24.758 41.742,22.833 L42.908,22.833 L41.158,20.5',
    );
  });

  it('account-login glyph, no transform at all', () => {
    expect(buildOpenIconicPathD('account-login', factor, originX, originY)).toBe(
      'M37.075,18.167 L37.075,19.333 L41.742,19.333 L41.742,25.167 L37.075,25.167 L37.075,26.333 ' +
        'L42.908,26.333 L42.908,18.167 L37.075,18.167 M38.242,20.5 L38.242,21.667 L33.575,21.667 ' +
        'L33.575,22.833 L38.242,22.833 L38.242,24 L40.575,22.25 L38.242,20.5',
    );
  });

  it('cart glyph, arc commands + Y-only translate', () => {
    expect(buildOpenIconicPathD('cart', factor, originX, originY)).toBe(
      'M33.972,19.333 A0.583,0.583 0 0 0 34.158,20.5 L35.908,20.5 L36.013,20.792 L36.492,22.25 ' +
        'L36.97,23.708 C37.017,23.86 37.215,24 37.367,24 L41.45,24 C41.613,24 41.8,23.86 41.847,23.708 ' +
        'L42.792,20.792 C42.838,20.64 42.768,20.5 42.605,20.5 L37.425,20.5 L36.982,19.66 ' +
        'A0.583,0.583 0 0 0 36.468,19.333 L34.135,19.333 A0.583,0.583 0 0 0 34.03,19.333 ' +
        'A0.583,0.583 0 0 0 33.96,19.333 M37.658,25.167 C37.332,25.167 37.075,25.423 37.075,25.75 ' +
        'C37.075,26.077 37.332,26.333 37.658,26.333 C37.985,26.333 38.242,26.077 38.242,25.75 ' +
        'C38.242,25.423 37.985,25.167 37.658,25.167 M41.158,25.167 C40.832,25.167 40.575,25.423 ' +
        '40.575,25.75 C40.575,26.077 40.832,26.333 41.158,26.333 C41.485,26.333 41.742,26.077 ' +
        '41.742,25.75 C41.742,25.423 41.485,25.167 41.158,25.167',
    );
  });

  it('browser glyph, arc commands, no transform', () => {
    expect(buildOpenIconicPathD('browser', factor, originX, originY)).toBe(
      'M33.972,18.167 A0.583,0.583 0 0 0 33.575,18.75 L33.575,26.917 A0.583,0.583 0 0 0 34.158,27.5 ' +
        'L42.325,27.5 A0.583,0.583 0 0 0 42.908,26.917 L42.908,18.75 A0.583,0.583 0 0 0 42.325,18.167 ' +
        'L34.158,18.167 A0.583,0.583 0 0 0 34.053,18.167 A0.583,0.583 0 0 0 33.983,18.167 ' +
        'M35.325,19.333 C35.652,19.333 35.908,19.59 35.908,19.917 C35.908,20.243 35.652,20.5 ' +
        '35.325,20.5 C34.998,20.5 34.742,20.243 34.742,19.917 C34.742,19.59 34.998,19.333 ' +
        '35.325,19.333 M37.658,19.333 L41.158,19.333 C41.485,19.333 41.742,19.59 41.742,19.917 ' +
        'C41.742,20.243 41.485,20.5 41.158,20.5 L37.658,20.5 C37.332,20.5 37.075,20.243 37.075,19.917 ' +
        'C37.075,19.59 37.332,19.333 37.658,19.333 M34.742,21.667 L41.742,21.667 L41.742,26.333 ' +
        'L34.742,26.333 L34.742,21.667',
    );
  });

  it('total glyph count is upstream\'s full 223-icon OpenIconic resource set', () => {
    // `~/git/plantuml/src/main/resources/openiconic/*.svg` -- 223 files;
    // `all.txt` (the directory's only other entry) is not an icon.
    expect(Object.keys(RAW_GLYPHS).length).toBe(223);
  });
});

describe('scanLineForAtoms / matchAtomAt -- <&glyph> recognition', () => {
  it('recognizes a bare <&name> atom', () => {
    const scan = scanLineForAtoms('<&x> someField');
    expect(scan.atoms).toEqual([{ kind: 'openiconic', name: 'x', scale: 1 }]);
    expect(scan.textWithoutAtoms).toBe(' someField');
  });

  it('recognizes {scale=N,color=X} options', () => {
    const scan = scanLineForAtoms('<&x{scale=2.25,color=#FF0000}>');
    expect(scan.atoms).toEqual([{ kind: 'openiconic', name: 'x', scale: 2.25, forcedColor: '#FF0000' }]);
  });

  it('recognizes the *N scale shorthand', () => {
    const scan = scanLineForAtoms('<&x*2.25,color=green>');
    expect(scan.atoms).toEqual([{ kind: 'openiconic', name: 'x', scale: 2.25, forcedColor: 'green' }]);
  });

  it('recognizes the #RRGGBB forced-color prefix (wins over an in-block color=)', () => {
    const scan = scanLineForAtoms('<#00FF00&key{color=red}>');
    // `forcedColor` stores the prefix WITHOUT its leading '#' -- matches
    // `buildSpriteSpan`'s identical `forcedPrefix.slice(1)` convention;
    // `resolveColorToSvgHex` (class-member-creole.ts) accepts bare hex too.
    expect(scan.atoms).toEqual([{ kind: 'openiconic', name: 'key', scale: 1, forcedColor: '00FF00' }]);
  });

  it('an unrecognized glyph name contributes nothing (no atom, no fallback text)', () => {
    // 'not-a-real-icon' -- see the `isKnownOpenIconicGlyph` describe block
    // above for why 'pencil' no longer serves as the unrecognized-name case.
    const scan = scanLineForAtoms('<&not-a-real-icon> rest');
    expect(scan.atoms).toEqual([]);
    expect(scan.textWithoutAtoms).toBe(' rest');
  });

  it('matchAtomAt recognizes an openiconic atom at a fixed position', () => {
    const m = matchAtomAt('x<&thumb-up>y', 1);
    expect(m).not.toBeNull();
    expect(m?.atom).toEqual({ kind: 'openiconic', name: 'thumb-up', scale: 1 });
    expect(m?.length).toBe(11);
  });

  it('matchAtomAt returns null when no atom starts exactly at pos', () => {
    expect(matchAtomAt('x<&thumb-up>y', 0)).toBeNull();
  });

  it('scanLineForAtoms recognizes multiple glyph atoms on one line', () => {
    const scan = scanLineForAtoms('<&key> and <&ban>');
    expect(scan.atoms).toEqual([
      { kind: 'openiconic', name: 'key', scale: 1 },
      { kind: 'openiconic', name: 'ban', scale: 1 },
    ]);
  });
});

describe('measureInlineAtom -- openiconic branch (D9)', () => {
  it('scales dims by scale*ambientFontSize/12', () => {
    const dims = measureInlineAtom({ kind: 'openiconic', name: 'x', scale: 1 }, undefined, 24);
    expect(dims).toEqual({ width: 18, height: 16 });
  });

  it('defaults ambientFontSize to 12 (factor === scale) when no ambient context is supplied', () => {
    const dims = measureInlineAtom({ kind: 'openiconic', name: 'x', scale: 1 });
    expect(dims).toEqual({ width: 10, height: 8 });
  });
});

describe('<&cloud> -- F1-c AC1/AC2, the vivido-49-nisu863 node-2 isolation (G11)', () => {
  it('scanLineForAtoms returns an openiconic atom for <&cloud> (AC1: not an empty span)', () => {
    const scan = scanLineForAtoms('aa<&cloud>');
    expect(scan.atoms).toEqual([{ kind: 'openiconic', name: 'cloud', scale: 1 }]);
    expect(scan.textWithoutAtoms).toBe('aa');
  });

  it('measureInlineAtom("cloud") at font 14 reproduces openIconicDims(openIconicFactor(1,14)) = 11.3333px advance (AC1)', () => {
    const dims = measureInlineAtom({ kind: 'openiconic', name: 'cloud', scale: 1 }, undefined, 14);
    expect(dims).toEqual(openIconicDims(openIconicFactor(1, 14)));
    expect(dims.width).toBeCloseTo(11.3333, 4);
  });

  it('measureLeafNode("aa<&cloud>") matches the jar isolation exactly: 46.9083 x 34 (AC1/AC2)', () => {
    // `plans/s1l-tail-diagnosis/findings/sprite.md`'s `vivido-49-nisu863`
    // isolation: `rectangle "aa<&cloud>"` -> jar 0.651505in x 0.472222in
    // (46.9083 x 34px = 20 + 15.575 + 11.3333 wide, 20 + 14 tall). Node 2's
    // own reported delta (-11.333px width) came entirely from this glyph
    // never resolving (M4); AC2 requires verifying node 2's width error
    // drops to 0px IN ISOLATION from nodes 0/1's unrelated M3 (url-label
    // sprite factor, closed in F2-c) -- this probe has no link/url markup
    // at all, so it isolates M4 alone, matching the finding's own
    // `rectangle "aa<&cloud>"` minimal repro (not the link-wrapped fixture
    // node, which also carries M3).
    const node: DescriptiveNode = { id: 'x', display: 'aa<&cloud>', symbol: 'rectangle', children: [] };
    const dim = measureLeafNode(node, { family: 'sans-serif', size: 14 }, new WidthTableMeasurer());
    expect(dim.width).toBeCloseTo(46.9083, 3);
    expect(dim.height).toBe(34);
  });
});
