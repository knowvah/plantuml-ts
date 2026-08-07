/**
 * Tests for the OpenIconic `<&glyph>` inline-atom geometry engine
 * (src/core/openiconic-glyphs.ts) and its span recognizer
 * (src/core/creole-atoms-openicon.ts) / measurement wiring
 * (src/core/creole-atoms.ts#measureInlineAtom).
 *
 * G2 N41. Every `buildOpenIconicPathD` expectation below is copied VERBATIM
 * from a real jar-cached fixture's own `<path d>` output (`plans/g2-class-
 * svg/ledger.md` N41's byte-verification table) -- not synthesized.
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
      'M15.645,44.1667 L14,45.8117 L14.84,46.6517 L16.9167,48.7633 L14.84,50.84 L14,51.645 L15.645,53.325 ' +
        'L16.485,52.485 L18.5967,50.3733 L20.6733,52.485 L21.4783,53.325 L23.1583,51.645 L22.3183,50.84 ' +
        'L20.2067,48.7633 L22.3183,46.6517 L23.1583,45.8117 L21.4783,44.1667 L20.6733,45.0067 L18.5967,47.0833 ' +
        'L16.485,45.0067 L15.645,44.1667',
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
      'M123.5775,52.1667 C123.3558,52.19 123.1458,52.3417 123.0292,52.5633 C122.8775,52.8667 121.7575,55.1183 ' +
        '121.5358,55.34 C121.3142,55.5617 121.0225,55.6667 120.6958,55.6667 L120.6958,60.3333 L124.7792,60.3333 ' +
        'C125.0242,60.3333 125.2342,60.1817 125.3275,59.9717 C125.3275,59.9717 126.5292,56.5767 126.5292,56.25 ' +
        'C126.5292,55.9233 126.2725,55.6667 125.9458,55.6667 L124.1958,55.6667 C123.8692,55.6667 123.6125,55.375 ' +
        '123.6125,55.0833 C123.6125,54.7917 124.0675,53.24 124.1608,52.9367 C124.2542,52.6333 124.1025,52.3067 ' +
        '123.7992,52.2017 C123.7175,52.1783 123.6592,52.155 123.5775,52.1667 M118.3625,55.6667 L118.3625,60.3333 ' +
        'L119.5292,60.3333 L119.5292,55.6667 L118.3625,55.6667',
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
      'M38.825,19.3333 C37.4133,19.3333 36.1767,20.3367 35.9083,21.6667 C34.625,21.6667 33.575,22.7167 33.575,24 ' +
        'C33.575,25.2833 34.625,26.3333 35.9083,26.3333 L41.1583,26.3333 C42.1267,26.3333 42.9083,25.5517 42.9083,' +
        '24.5833 C42.9083,23.825 42.4183,23.0783 41.7417,22.8333 L41.7417,22.25 C41.7417,20.64 40.435,19.3333 ' +
        '38.825,19.3333',
    );
  });

  it('euro glyph -- reproduces the upstream regex bug: source declares transform="translate(-1)" but the jar' +
    ' drops it (no translateX applied)', () => {
    expect(buildOpenIconicPathD('euro', factor, originX, originY)).toBe(
      'M40.575,18.1667 C38.405,18.1667 36.6083,19.66 36.095,21.6667 L33.8667,21.6667 L33.575,22.8333 L35.92,22.8333 ' +
        'C35.92,23.2417 36.0017,23.6267 36.1067,24 L33.8083,24 L33.5867,25.1667 L36.5733,25.1667 C37.39,26.555 ' +
        '38.8717,27.5 40.5867,27.5 C41.4383,27.5 42.2317,27.255 42.92,26.8467 L42.92,25.4233 C42.3017,25.9833 ' +
        '41.4967,26.3333 40.5867,26.3333 C39.5483,26.3333 38.6383,25.8783 37.9967,25.1667 L40.5867,25.1667 ' +
        'L40.7733,24 L37.3083,24 C37.18,23.6267 37.0867,23.2533 37.0867,22.8333 L40.9833,22.8333 L41.17,21.6667 ' +
        'L37.3083,21.6667 C37.7867,20.3133 39.07,19.3333 40.5867,19.3333 C41.3567,19.3333 42.0567,19.5783 ' +
        '42.6283,19.9867 L42.815,18.75 C42.15,18.3883 41.4033,18.1667 40.5867,18.1667',
    );
  });

  it('media-play glyph, both X and Y translate (transform="translate(1 1)")', () => {
    expect(buildOpenIconicPathD('media-play', factor, originX, originY)).toBe(
      'M34.7417,19.3333 L34.7417,26.3333 L41.7417,22.8333 L34.7417,19.3333',
    );
  });

  it('loop-circular glyph, Y-only translate, C-curve heavy two-subpath path', () => {
    expect(buildOpenIconicPathD('loop-circular', factor, originX, originY)).toBe(
      'M38.2417,19.3333 C36.3167,19.3333 34.7417,20.9083 34.7417,22.8333 L33.575,22.8333 L35.325,25.1667 ' +
        'L37.075,22.8333 L35.9083,22.8333 C35.9083,21.5383 36.9467,20.5 38.2417,20.5 L38.2417,19.3333 ' +
        'M41.1583,20.5 L39.4083,22.8333 L40.575,22.8333 C40.575,24.1283 39.5367,25.1667 38.2417,25.1667 ' +
        'L38.2417,26.3333 C40.1667,26.3333 41.7417,24.7583 41.7417,22.8333 L42.9083,22.8333 L41.1583,20.5',
    );
  });

  it('account-login glyph, no transform at all', () => {
    expect(buildOpenIconicPathD('account-login', factor, originX, originY)).toBe(
      'M37.075,18.1667 L37.075,19.3333 L41.7417,19.3333 L41.7417,25.1667 L37.075,25.1667 L37.075,26.3333 ' +
        'L42.9083,26.3333 L42.9083,18.1667 L37.075,18.1667 M38.2417,20.5 L38.2417,21.6667 L33.575,21.6667 ' +
        'L33.575,22.8333 L38.2417,22.8333 L38.2417,24 L40.575,22.25 L38.2417,20.5',
    );
  });

  it('cart glyph, arc commands + Y-only translate', () => {
    expect(buildOpenIconicPathD('cart', factor, originX, originY)).toBe(
      'M33.9717,19.3333 A0.5833,0.5833 0 0 0 34.1583,20.5 L35.9083,20.5 L36.0133,20.7917 L36.4917,22.25 ' +
        'L36.97,23.7083 C37.0167,23.86 37.215,24 37.3667,24 L41.45,24 C41.6133,24 41.8,23.86 41.8467,23.7083 ' +
        'L42.7917,20.7917 C42.8383,20.64 42.7683,20.5 42.605,20.5 L37.425,20.5 L36.9817,19.66 ' +
        'A0.5833,0.5833 0 0 0 36.4683,19.3333 L34.135,19.3333 A0.5833,0.5833 0 0 0 34.03,19.3333 ' +
        'A0.5833,0.5833 0 0 0 33.96,19.3333 M37.6583,25.1667 C37.3317,25.1667 37.075,25.4233 37.075,25.75 ' +
        'C37.075,26.0767 37.3317,26.3333 37.6583,26.3333 C37.985,26.3333 38.2417,26.0767 38.2417,25.75 ' +
        'C38.2417,25.4233 37.985,25.1667 37.6583,25.1667 M41.1583,25.1667 C40.8317,25.1667 40.575,25.4233 ' +
        '40.575,25.75 C40.575,26.0767 40.8317,26.3333 41.1583,26.3333 C41.485,26.3333 41.7417,26.0767 ' +
        '41.7417,25.75 C41.7417,25.4233 41.485,25.1667 41.1583,25.1667',
    );
  });

  it('browser glyph, arc commands, no transform', () => {
    expect(buildOpenIconicPathD('browser', factor, originX, originY)).toBe(
      'M33.9717,18.1667 A0.5833,0.5833 0 0 0 33.575,18.75 L33.575,26.9167 A0.5833,0.5833 0 0 0 34.1583,27.5 ' +
        'L42.325,27.5 A0.5833,0.5833 0 0 0 42.9083,26.9167 L42.9083,18.75 A0.5833,0.5833 0 0 0 42.325,18.1667 ' +
        'L34.1583,18.1667 A0.5833,0.5833 0 0 0 34.0533,18.1667 A0.5833,0.5833 0 0 0 33.9833,18.1667 ' +
        'M35.325,19.3333 C35.6517,19.3333 35.9083,19.59 35.9083,19.9167 C35.9083,20.2433 35.6517,20.5 ' +
        '35.325,20.5 C34.9983,20.5 34.7417,20.2433 34.7417,19.9167 C34.7417,19.59 34.9983,19.3333 ' +
        '35.325,19.3333 M37.6583,19.3333 L41.1583,19.3333 C41.485,19.3333 41.7417,19.59 41.7417,19.9167 ' +
        'C41.7417,20.2433 41.485,20.5 41.1583,20.5 L37.6583,20.5 C37.3317,20.5 37.075,20.2433 37.075,19.9167 ' +
        'C37.075,19.59 37.3317,19.3333 37.6583,19.3333 M34.7417,21.6667 L41.7417,21.6667 L41.7417,26.3333 ' +
        'L34.7417,26.3333 L34.7417,21.6667',
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
