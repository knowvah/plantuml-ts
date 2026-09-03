/**
 * Unit tests for the golden-SVG conformance comparator (T1).
 *
 * Ports the acceptance-criteria checks from @knowvah/dot-engine's in-source Vitest
 * block (`test/golden/compare.ts`) into this project's standalone
 * `*.test.ts` convention, plus additional coverage for the `d`/`points`/
 * `viewBox`/`transform` structural comparators and the exported tolerance
 * table (D7: `deterministic` band is 0.01, no other classes).
 */
import { describe, test, expect } from 'vitest';
import { compareSvg, TOLERANCES, weightedScore } from './compare.js';
import type { Diff } from './compare.js';

const MINIMAL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
  <g><ellipse cx="50.0" cy="50.0" rx="20" ry="10"/></g>
</svg>`;

describe('TOLERANCES', () => {
  test('D7: exposes only the deterministic 0.01 band', () => {
    expect(TOLERANCES).toEqual({ deterministic: 0.01 });
  });
});

describe('compareSvg', () => {
  // AC1: byte-identical SVGs compare with pass: true, diffs: []
  test('AC1: identical SVGs pass with no diffs', () => {
    const { pass, diffs } = compareSvg(MINIMAL_SVG, MINIMAL_SVG, 'deterministic');
    expect(pass).toBe(true);
    expect(diffs).toEqual([]);
  });

  // AC2: cx drift of 0.009 (within the 0.01 band) passes
  test('AC2: cx drift of 0.009 is within tolerance and passes', () => {
    const actual = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
  <g><ellipse cx="50.009" cy="50.0" rx="20" ry="10"/></g>
</svg>`;
    const { pass, diffs } = compareSvg(actual, MINIMAL_SVG, 'deterministic');
    expect(pass).toBe(true);
    expect(diffs).toEqual([]);
  });

  // AC2: cx drift of 0.011 (beyond the 0.01 band) fails with exactly one
  // diff carrying a delta and an @cx path.
  test('AC2: cx drift of 0.011 exceeds tolerance and fails with one @cx diff', () => {
    const actual = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
  <g><ellipse cx="50.011" cy="50.0" rx="20" ry="10"/></g>
</svg>`;
    const { pass, diffs } = compareSvg(actual, MINIMAL_SVG, 'deterministic');
    expect(pass).toBe(false);
    expect(diffs).toHaveLength(1);
    expect(diffs[0]?.path).toBe('svg/g[1]/ellipse[1]/@cx');
    expect(diffs[0]?.delta).toBeCloseTo(0.011, 5);
    expect(diffs[0]?.tolerance).toBe(0.01);
  });

  test('a text-node child compared against an element child is a type mismatch', () => {
    const actual = `<svg xmlns="http://www.w3.org/2000/svg">hello<g/></svg>`;
    const reference = `<svg xmlns="http://www.w3.org/2000/svg"><rect/><g/></svg>`;
    const { pass, diffs } = compareSvg(actual, reference, 'deterministic');
    expect(pass).toBe(false);
    expect(diffs[0]?.actual).toBe('text');
    expect(diffs[0]?.expected).toBe('element');
  });

  test('missing child element produces a structural childCount diff', () => {
    const actual = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
</svg>`;
    const { pass, diffs } = compareSvg(actual, MINIMAL_SVG, 'deterministic');
    expect(pass).toBe(false);
    const structuralDiff = diffs.find((d) => d.path.includes('childCount'));
    expect(structuralDiff).toBeDefined();
    expect(structuralDiff?.actual).toBe('0');
    expect(structuralDiff?.expected).toBe('1');
  });

  test('mismatched tag name produces a structural diff and stops recursion', () => {
    const actual = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
  <g><rect cx="50.0" cy="50.0" rx="20" ry="10"/></g>
</svg>`;
    const { pass, diffs } = compareSvg(actual, MINIMAL_SVG, 'deterministic');
    expect(pass).toBe(false);
    expect(diffs).toEqual([
      {
        path: 'svg/g[1]/rect[1]',
        actual: 'rect',
        expected: 'ellipse',
        tolerance: 0.01,
        // rect{cx,cy,rx,ry} = 5 units, ellipse{cx,cy,rx,ry} = 5.
        weight: 10,
      },
    ]);
  });

  test('path `d` command letters must match structurally', () => {
    const actual = `<svg xmlns="http://www.w3.org/2000/svg"><path d="M0,0 L1,1"/></svg>`;
    const reference = `<svg xmlns="http://www.w3.org/2000/svg"><path d="M0,0 C1,1 2,2 3,3"/></svg>`;
    const { pass, diffs } = compareSvg(actual, reference, 'deterministic');
    expect(pass).toBe(false);
    expect(diffs[0]?.path).toBe('svg/path[1]/@d');
  });

  test('path `d` numeric arguments within tolerance pass, beyond it fail', () => {
    const reference = `<svg xmlns="http://www.w3.org/2000/svg"><path d="M0,0 L10,10"/></svg>`;
    const within = `<svg xmlns="http://www.w3.org/2000/svg"><path d="M0,0 L10.005,10"/></svg>`;
    const beyond = `<svg xmlns="http://www.w3.org/2000/svg"><path d="M0,0 L10.5,10"/></svg>`;

    expect(compareSvg(within, reference, 'deterministic').pass).toBe(true);
    const beyondResult = compareSvg(beyond, reference, 'deterministic');
    expect(beyondResult.pass).toBe(false);
    expect(beyondResult.diffs[0]?.path).toBe('svg/path[1]/@d[2]');
    expect(beyondResult.diffs[0]?.delta).toBeCloseTo(0.5, 5);
  });

  test('path `d` with matching commands but mismatched numeric arg count fails', () => {
    const actual = `<svg xmlns="http://www.w3.org/2000/svg"><path d="M0,0 L1,1 2,2"/></svg>`;
    const reference = `<svg xmlns="http://www.w3.org/2000/svg"><path d="M0,0 L1,1"/></svg>`;
    const { pass, diffs } = compareSvg(actual, reference, 'deterministic');
    expect(pass).toBe(false);
    expect(diffs[0]?.path).toBe('svg/path[1]/@d');
    expect(diffs[0]?.actual).toBe('M0,0 L1,1 2,2');
    expect(diffs[0]?.expected).toBe('M0,0 L1,1');
  });

  test('points/viewBox mismatched length produces a single diff', () => {
    const actual = `<svg xmlns="http://www.w3.org/2000/svg"><polygon points="0,0 1,1"/></svg>`;
    const reference = `<svg xmlns="http://www.w3.org/2000/svg"><polygon points="0,0 1,1 2,2"/></svg>`;
    const { pass, diffs } = compareSvg(actual, reference, 'deterministic');
    expect(pass).toBe(false);
    expect(diffs).toHaveLength(1);
    expect(diffs[0]?.path).toBe('svg/polygon[1]/@points');
  });

  test('viewBox numeric drift beyond tolerance is reported per-number', () => {
    const actual = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100.5 200"></svg>`;
    const reference = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 200"></svg>`;
    const { pass, diffs } = compareSvg(actual, reference, 'deterministic');
    expect(pass).toBe(false);
    expect(diffs[0]?.path).toBe('svg/@viewBox[2]');
  });

  test('transform with mismatched function type produces a .type diff', () => {
    const actual = `<svg xmlns="http://www.w3.org/2000/svg"><g transform="scale(2)"/></svg>`;
    const reference = `<svg xmlns="http://www.w3.org/2000/svg"><g transform="translate(2)"/></svg>`;
    const { pass, diffs } = compareSvg(actual, reference, 'deterministic');
    expect(pass).toBe(false);
    expect(diffs[0]?.path).toBe('svg/g[1]/@transform[0].type');
  });

  test('transform param drift beyond tolerance is reported per-param', () => {
    const actual = `<svg xmlns="http://www.w3.org/2000/svg"><g transform="translate(10.5,0)"/></svg>`;
    const reference = `<svg xmlns="http://www.w3.org/2000/svg"><g transform="translate(10,0)"/></svg>`;
    const { pass, diffs } = compareSvg(actual, reference, 'deterministic');
    expect(pass).toBe(false);
    expect(diffs[0]?.path).toBe('svg/g[1]/@transform[0].param[0]');
  });

  test('transform with mismatched function count fails with an @transform diff', () => {
    const actual = `<svg xmlns="http://www.w3.org/2000/svg"><g transform="translate(1,1) scale(2)"/></svg>`;
    const reference = `<svg xmlns="http://www.w3.org/2000/svg"><g transform="translate(1,1)"/></svg>`;
    const { pass, diffs } = compareSvg(actual, reference, 'deterministic');
    expect(pass).toBe(false);
    expect(diffs[0]?.path).toBe('svg/g[1]/@transform');
  });

  test('transform with mismatched param count (same type) fails at [i]', () => {
    const actual = `<svg xmlns="http://www.w3.org/2000/svg"><g transform="matrix(1,0,0,1,5,5)"/></svg>`;
    const reference = `<svg xmlns="http://www.w3.org/2000/svg"><g transform="matrix(1,0,0,1,5)"/></svg>`;
    const { pass, diffs } = compareSvg(actual, reference, 'deterministic');
    expect(pass).toBe(false);
    expect(diffs[0]?.path).toBe('svg/g[1]/@transform[0]');
  });

  test('a non-numeric value on a numeric attr falls through to exact match', () => {
    // width="auto" fails parseNumber (isNaN branch), so the numeric-attr
    // fast path is skipped and the values are compared for exact equality.
    const actual = `<svg xmlns="http://www.w3.org/2000/svg" width="auto"/>`;
    const reference = `<svg xmlns="http://www.w3.org/2000/svg" width="100"/>`;
    const { pass, diffs } = compareSvg(actual, reference, 'deterministic');
    expect(pass).toBe(false);
    expect(diffs).toEqual([
      { path: 'svg/@width', actual: 'auto', expected: '100', tolerance: 0.01 },
    ]);
  });

  test('path `d` with no command letters is compared via the empty-commands fallback', () => {
    // Malformed/degenerate d values (no MLZC... letters) exercise
    // extractPathCommands's `?? []` fallback rather than a crash.
    const actual = `<svg xmlns="http://www.w3.org/2000/svg"><path d="1,2"/></svg>`;
    const reference = `<svg xmlns="http://www.w3.org/2000/svg"><path d="3,4"/></svg>`;
    const { pass, diffs } = compareSvg(actual, reference, 'deterministic');
    // both sides have zero command letters, so the structural check passes;
    // numeric args (1,2) vs (3,4) both exceed tolerance
    expect(pass).toBe(false);
    expect(diffs.some((d) => d.path === 'svg/path[1]/@d[0]')).toBe(true);
  });

  test('attribute present on only one side compares against an empty string', () => {
    const actual = `<svg xmlns="http://www.w3.org/2000/svg"><rect fill="red"/></svg>`;
    const reference = `<svg xmlns="http://www.w3.org/2000/svg"><rect fill="red" opacity="0.5"/></svg>`;
    const { pass, diffs } = compareSvg(actual, reference, 'deterministic');
    expect(pass).toBe(false);
    expect(diffs).toEqual([
      { path: 'svg/rect[1]/@opacity', actual: '', expected: '0.5', tolerance: 0.01 },
    ]);
  });

  test('non-numeric attribute mismatch (e.g. fill color) fails exactly', () => {
    const actual = `<svg xmlns="http://www.w3.org/2000/svg"><rect fill="#FFFFFF"/></svg>`;
    const reference = `<svg xmlns="http://www.w3.org/2000/svg"><rect fill="#000000"/></svg>`;
    const { pass, diffs } = compareSvg(actual, reference, 'deterministic');
    expect(pass).toBe(false);
    expect(diffs).toEqual([
      {
        path: 'svg/rect[1]/@fill',
        actual: '#FFFFFF',
        expected: '#000000',
        tolerance: 0.01,
      },
    ]);
  });

  test('unknown tolerance class falls back to deterministic (0.01)', () => {
    const actual = `<svg xmlns="http://www.w3.org/2000/svg"><ellipse cx="50.011"/></svg>`;
    const reference = `<svg xmlns="http://www.w3.org/2000/svg"><ellipse cx="50.0"/></svg>`;
    const { pass, diffs } = compareSvg(actual, reference, 'nonexistent-class');
    expect(pass).toBe(false);
    expect(diffs[0]?.tolerance).toBe(0.01);
  });

  test('toleranceOverride takes precedence over the named class', () => {
    const actual = `<svg xmlns="http://www.w3.org/2000/svg"><ellipse cx="50.5"/></svg>`;
    const reference = `<svg xmlns="http://www.w3.org/2000/svg"><ellipse cx="50.0"/></svg>`;
    const { pass, diffs } = compareSvg(actual, reference, 'deterministic', 1);
    expect(pass).toBe(true);
    expect(diffs).toEqual([]);
  });

  test('text node content mismatch is reported at the text() path', () => {
    const actual = `<svg xmlns="http://www.w3.org/2000/svg"><text>foo</text></svg>`;
    const reference = `<svg xmlns="http://www.w3.org/2000/svg"><text>bar</text></svg>`;
    const { pass, diffs } = compareSvg(actual, reference, 'deterministic');
    expect(pass).toBe(false);
    expect(diffs[0]?.path).toBe('svg/text[1]/text()[1]');
    expect(diffs[0]?.actual).toBe('foo');
    expect(diffs[0]?.expected).toBe('bar');
  });

  // G1 I0: image/@xlink:href is a DELIBERATE byte divergence (DIVERGENCES.md
  // "Sprite and img rasters -- pass-through and browser scaling") -- both
  // sides present-and-nonempty is a match regardless of the actual bytes.
  describe('image/@xlink:href (deliberate raster pass-through divergence)', () => {
    test('differing but both-nonempty data-URI hrefs on an <image> are not a diff', () => {
      const actual = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><image width="10" height="10" x="0" y="0" xlink:href="data:image/png;base64,AAAA"/></svg>`;
      const reference = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><image width="10" height="10" x="0" y="0" xlink:href="data:image/png;base64,ZZZZZZZZ"/></svg>`;
      const { pass, diffs } = compareSvg(actual, reference, 'deterministic');
      expect(pass).toBe(true);
      expect(diffs).toEqual([]);
    });

    test('geometry (x/y/width/height) on an <image> is still strictly compared', () => {
      const actual = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><image width="10" height="10" x="0" y="0" xlink:href="data:image/png;base64,AAAA"/></svg>`;
      const reference = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><image width="20" height="10" x="0" y="0" xlink:href="data:image/png;base64,ZZZZ"/></svg>`;
      const { pass, diffs } = compareSvg(actual, reference, 'deterministic');
      expect(pass).toBe(false);
      expect(diffs).toEqual([
        { path: 'svg/image[1]/@width', actual: '10', expected: '20', tolerance: 0.01, delta: 10 },
      ]);
    });

    test('an href present on one side but missing on the other IS a diff (not exempted)', () => {
      const actual = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><image width="10" height="10" x="0" y="0"/></svg>`;
      const reference = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><image width="10" height="10" x="0" y="0" xlink:href="data:image/png;base64,ZZZZ"/></svg>`;
      const { pass, diffs } = compareSvg(actual, reference, 'deterministic');
      expect(pass).toBe(false);
      expect(diffs).toEqual([
        { path: 'svg/image[1]/@xlink:href', actual: '', expected: 'data:image/png;base64,ZZZZ', tolerance: 0.01 },
      ]);
    });

    test('a same-named href on a NON-image element is still compared exactly (scoped to tag=image only)', () => {
      const actual = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><a xlink:href="http://example.com/one"><rect/></a></svg>`;
      const reference = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><a xlink:href="http://example.com/two"><rect/></a></svg>`;
      const { pass, diffs } = compareSvg(actual, reference, 'deterministic');
      expect(pass).toBe(false);
      expect(diffs).toEqual([
        {
          path: 'svg/a[1]/@xlink:href',
          actual: 'http://example.com/one',
          expected: 'http://example.com/two',
          tolerance: 0.01,
        },
      ]);
    });
  });

  // -------------------------------------------------------------------------
  // Tolerance boundary. A pair whose TRUE decimal difference equals the band
  // exactly is one the strict `>` accepts by construction — but IEEE-754
  // subtraction of the parsed decimals lands ~5.1e-15 above 0.01, so the
  // naive `Math.abs(a - b) > tolerance` rejected it on representation error.
  // See `exceedsTolerance` in compare.ts. Both directions are pinned: the
  // boundary passes, and a hair beyond it still fails.
  // -------------------------------------------------------------------------
  describe('tolerance boundary (float representation, not band width)', () => {
    const svgWith = (d: string): string =>
      `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
  <g><path d="${d}"/></g>
</svg>`;

    // The real numbers from class/bipudo-23-xavu432, the fixture this fixed.
    test('a path param differing by exactly the band passes', () => {
      const { pass, diffs } = compareSvg(
        svgWith('M 10,10 L 75.194,20'),
        svgWith('M 10,10 L 75.184,20'),
        'deterministic',
      );
      expect(pass).toBe(true);
      expect(diffs).toEqual([]);
    });

    test('the same boundary on a plain numeric attribute passes', () => {
      const attrSvg = (cx: string): string =>
        `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
  <g><ellipse cx="${cx}" cy="50.0" rx="20" ry="10"/></g>
</svg>`;
      const { pass, diffs } = compareSvg(attrSvg('50.194'), attrSvg('50.184'), 'deterministic');
      expect(pass).toBe(true);
      expect(diffs).toEqual([]);
    });

    // Discrimination: the slack is ~1.7e-14 at this magnitude, so a genuine
    // 1e-4 overshoot is still caught. Without this the fix would be a band
    // widening rather than a boundary correction.
    test('a param 0.0001 BEYOND the band still fails', () => {
      const { pass, diffs } = compareSvg(
        svgWith('M 10,10 L 75.1941,20'),
        svgWith('M 10,10 L 75.184,20'),
        'deterministic',
      );
      expect(pass).toBe(false);
      expect(diffs).toHaveLength(1);
      expect(diffs[0]!.path).toBe('svg/g[1]/path[1]/@d[2]');
      expect(diffs[0]!.delta!).toBeGreaterThan(0.01);
    });
  });
});

// ---------------------------------------------------------------------------
// Weighted diff score -- D5, `plans/sequence-root-chrome/decisions.md`.
// Child-count charging revised by `plans/svg-comparator-alignment/
// decisions.md` D1 (2026-09-03) -- see that block's own comments below.
//
// `compareNodes` short-circuits in THREE places (node-type mismatch, tag
// mismatch, child-count mismatch) and charged exactly 1 for each, however
// large the subtree it skipped. That makes the raw count non-monotonic in
// wrongness: a tag SUBSTITUTION costs 1 no matter how wrong its subtree is,
// while a tag MATCH costs one diff per differing attribute, so making a
// document MORE structurally aligned can RAISE it. Each short-circuit is now
// charged an upper bound on what descending could have cost, measured in
// `units`: one per node plus one per attribute, summed over the subtree.
//
// `path`/`actual`/`expected`/`delta`/`tolerance` on any individual `Diff`
// are untouched, and node-type/tag short-circuits still push exactly one
// diff each, because seven other engines' ratchets and five scripts read
// them. The CHILD-COUNT short-circuit is the one exception: D1 replaced its
// sum-of-both-sides charge with LCS alignment, so a `[childCount]` mismatch
// can now push MORE than one diff (the unmatched-remainder charge, plus a
// real diff from each aligned pair that recursion finds actually differs) --
// `diffs.length` for that case is no longer 1 by construction. `weightedScore`
// itself is still purely additive over whatever diffs a run produces.
// ---------------------------------------------------------------------------

/** `<svg>` wrapper so each pair below differs only in its body. */
function svg(body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
}

describe('weightedScore', () => {
  test('an empty diff list scores 0', () => {
    expect(weightedScore([])).toBe(0);
  });

  test('an absent weight counts 1; a present one counts its own value', () => {
    const diffs: Diff[] = [
      { path: 'svg/@width', actual: '1', expected: '2', tolerance: 0.01 },
      {
        path: 'svg/g[1]/rect[1]',
        actual: 'rect',
        expected: 'text',
        tolerance: 0.01,
        weight: 6,
      },
    ];
    expect(weightedScore(diffs)).toBe(7);
  });
});

describe('compareSvg — short-circuit weights', () => {
  // AC1. rect{x,y} is 1 node + 2 attrs = 3 units; text{fill} + its text node
  // is 1 + 1 + 1 = 3 units. One diff, as before, weighted 6.
  test('a tag mismatch is weighted units(actual) + units(expected)', () => {
    const { diffs } = compareSvg(
      svg('<g><rect x="1" y="2"/></g>'),
      svg('<g><text fill="red">hi</text></g>'),
      'deterministic',
    );
    expect(diffs).toHaveLength(1);
    expect(diffs[0]?.path).toBe('svg/g[1]/rect[1]');
    expect(diffs[0]?.weight).toBe(6);
    expect(weightedScore(diffs)).toBe(6);
  });

  // D1: actual=[rect{x,y}], expected=[rect{x}, line{x1,y1,x2,y2}]. `rect`
  // LCS-matches `rect` (both sides have exactly one), so it RECURSES --
  // surfacing the real `@y` diff (actual has y, expected doesn't) -- rather
  // than being swallowed. Only the unmatched `line{x1,y1,x2,y2}` (1 node +
  // 4 attrs = 5 units) is charged at the `[childCount]` path.
  test('a child-count mismatch aligns matched children and weights only the unmatched remainder', () => {
    const { diffs } = compareSvg(
      svg('<g><rect x="1" y="2"/></g>'),
      svg('<g><rect x="1"/><line x1="0" y1="0" x2="1" y2="1"/></g>'),
      'deterministic',
    );
    expect(diffs).toHaveLength(2);
    const yDiff = diffs.find((d) => d.path === 'svg/g[1]/rect[1]/@y');
    expect(yDiff?.weight).toBeUndefined(); // an ordinary attribute diff, scores 1
    const childCountDiff = diffs.find((d) => d.path === 'svg/g[1][childCount]');
    expect(childCountDiff?.weight).toBe(5); // unmatched line only, not both sides
    expect(weightedScore(diffs)).toBe(6); // 5 (unmatched line) + 1 (the @y diff)
  });

  // The third short-circuit, distinct from the tag one above: SVG has a
  // `<text>` ELEMENT, so `line` vs `text` is a tag mismatch between two
  // elements, while this fires on a text NODE aligned against an element.
  // units(text node) = 1, units(rect{x,y}) = 3.
  test('a node-type mismatch is weighted units(actual) + units(expected)', () => {
    const { diffs } = compareSvg(
      svg('hello<g/>'),
      svg('<rect x="1" y="2"/><g/>'),
      'deterministic',
    );
    expect(diffs).toHaveLength(1);
    expect(diffs[0]?.actual).toBe('text');
    expect(diffs[0]?.expected).toBe('element');
    expect(diffs[0]?.weight).toBe(4);
  });

  // AC3.
  test('an attribute diff carries no weight and scores 1', () => {
    const { diffs } = compareSvg(
      svg('<rect x="1"/>'),
      svg('<rect x="9"/>'),
      'deterministic',
    );
    expect(diffs).toHaveLength(1);
    expect(diffs[0]?.weight).toBeUndefined();
    expect(weightedScore(diffs)).toBe(1);
  });

  test('a text diff carries no weight and scores 1', () => {
    const { diffs } = compareSvg(
      svg('<text>a</text>'),
      svg('<text>b</text>'),
      'deterministic',
    );
    expect(diffs).toHaveLength(1);
    expect(diffs[0]?.weight).toBeUndefined();
    expect(weightedScore(diffs)).toBe(1);
  });
});

// AC4 -- the property the ratchet needs: aligning a subtree that previously
// short-circuited can never RAISE the weighted score, even though it raises
// `diffs.length`. Each case asserts both, so a regression that restores the
// old behaviour fails on the score rather than passing quietly.
describe('compareSvg — weighted score is monotone in alignment', () => {
  const tagExpected = svg('<g><text fill="green" stroke="black">hi</text></g>');

  test('aligning a mismatched TAG cannot raise the weighted score', () => {
    const before = compareSvg(
      svg('<g><rect fill="red" stroke="blue"/></g>'),
      tagExpected,
      'deterministic',
    ).diffs;
    const after = compareSvg(
      svg('<g><text fill="red" stroke="blue">bye</text></g>'),
      tagExpected,
      'deterministic',
    ).diffs;

    expect(weightedScore(before)).toBe(7);
    expect(weightedScore(after)).toBe(3);
    expect(weightedScore(after)).toBeLessThanOrEqual(weightedScore(before));
    // The defect this replaces: the raw count moves the wrong way.
    expect(before).toHaveLength(1);
    expect(after).toHaveLength(3);
  });

  test('aligning a mismatched CHILD COUNT cannot raise the weighted score', () => {
    const expected = svg('<g><rect x="9"/><line x1="0"/></g>');
    const before = compareSvg(
      svg('<g><rect x="1"/></g>'),
      expected,
      'deterministic',
    ).diffs;
    const after = compareSvg(
      svg('<g><rect x="1"/><line x1="5"/></g>'),
      expected,
      'deterministic',
    ).diffs;

    // `before`: actual=[rect{x=1}] vs expected=[rect{x=9},line{x1=0}] (1v2,
    // takes the childCount branch). `rect` LCS-matches `rect` and recurses
    // (surfacing the real @x diff, weight 1); the unmatched `line{x1}`
    // (1 node + 1 attr = 2 units) is charged at [childCount]. Total: 1 + 2.
    expect(weightedScore(before)).toBe(3);
    expect(before).toHaveLength(2);
    // `after`: actual=[rect{x=1},line{x1=5}] vs expected -- 2v2, SAME length
    // as expected, so this takes the untouched equal-length positional
    // loop, not the branch under test. Unaffected by D1; kept here to show
    // the full alignment-vs-parity range stays monotone end to end.
    expect(weightedScore(after)).toBe(2);
    expect(after).toHaveLength(2);
  });

  test('aligning a mismatched NODE TYPE cannot raise the weighted score', () => {
    const expected = svg('<text>hello</text><g/>');
    const before = compareSvg(svg('hello<g/>'), expected, 'deterministic').diffs;
    const after = compareSvg(expected, expected, 'deterministic').diffs;

    expect(weightedScore(before)).toBe(3);
    expect(weightedScore(after)).toBe(0);
    expect(before).toHaveLength(1);
    expect(after).toHaveLength(0);
  });
});


// ---------------------------------------------------------------------------
// LCS-aligned child-count charging -- svg-comparator-alignment D1.
//
// The property these three cases pin, that no case above exercises: a
// sibling-list length mismatch that GROWS toward the expected side WITHOUT
// reaching parity must not cost more than it did before growing. The old
// sum-of-both-sides charge failed exactly this case in production
// (`.agent-notes/aeg-T1.md` on `feat/activity-element-granularity`): a
// verified-correct port added ~2413 `<line>` elements, closing 57% of the
// element-level gap to the jar, and the gated score ROSE 7.0% anyway,
// because the charge counted the SIZE of what grew, never whether the
// growth was right.
// ---------------------------------------------------------------------------
describe('compareSvg — LCS-aligned child-count charging (D1)', () => {
  test('an unmatched element is charged alone, not both full sibling lists', () => {
    // actual has an extra <rect> the expected side lacks; both <circle>s
    // LCS-match by tag. Old formula: sumUnits(actual=11) + sumUnits(expected=8)
    // = 19. New: only the unmatched rect (1 node + x,y = 3 units).
    const { diffs } = compareSvg(
      svg('<g><circle cx="1" cy="1" r="1"/><circle cx="2" cy="2" r="2"/><rect x="9" y="9"/></g>'),
      svg('<g><circle cx="1" cy="1" r="1"/><circle cx="2" cy="2" r="2"/></g>'),
      'deterministic',
    );
    expect(diffs).toHaveLength(1);
    expect(diffs[0]?.path).toBe('svg/g[1][childCount]');
    expect(diffs[0]?.weight).toBe(3);
    expect(weightedScore(diffs)).toBe(3);
  });

  test('an element inserted in the middle still lets both flanks align', () => {
    // A <line> is inserted BETWEEN a <rect> and a <polygon> that are
    // otherwise identical on both sides -- proof this is real LCS
    // alignment, not a prefix/suffix trim that only handles insertions at
    // an end. Old formula: sumUnits(actual=9) + sumUnits(expected=4) = 13.
    // New: only the inserted line (1 node + 4 attrs = 5 units) -- which is
    // only possible if BOTH the rect AND the polygon matched across it.
    const { diffs } = compareSvg(
      svg('<g><rect x="1"/><line x1="9" y1="9" x2="9" y2="9"/><polygon points="0,0"/></g>'),
      svg('<g><rect x="1"/><polygon points="0,0"/></g>'),
      'deterministic',
    );
    expect(diffs).toHaveLength(1);
    expect(diffs[0]?.weight).toBe(5);
    expect(weightedScore(diffs)).toBe(5);
  });

  test('sibling lists past MAX_ALIGN_PRODUCT degrade to the old sum charge, not a crash', () => {
    // `sequence/zudize-61-vomi445`'s root <g> has 70093 direct children --
    // an O(n*m) DP table at that size OOM'd a 4 GB heap (measured; see
    // alignChildrenByKey's own doc comment). 2001x2001 = 4,004,001 safely
    // exceeds MAX_ALIGN_PRODUCT's 2000x2000 = 4,000,000 threshold while
    // still building and comparing in milliseconds, so this pins the
    // DEGRADED (old-formula) behaviour without needing an actually-huge
    // fixture in the test suite itself.
    const bigActual = svg(`<g>${'<rect x="1"/>'.repeat(2001)}</g>`);
    const bigExpected = svg(`<g>${'<rect x="1"/>'.repeat(2001)}<rect x="1"/></g>`);
    const { diffs } = compareSvg(bigActual, bigExpected, 'deterministic');
    expect(diffs).toHaveLength(1);
    expect(diffs[0]?.path).toBe('svg/g[1][childCount]');
    // Old formula: sumUnits(2001 rects) + sumUnits(2002 rects) = 4002 + 4004.
    expect(diffs[0]?.weight).toBe(2001 * 2 + 2002 * 2);
  });

  test('growth toward parity that does not reach it still LOWERS the score -- the T1 regression', () => {
    // expected has 4 <line> interspersed with 2 <rect> (6 children total).
    // `before` has 1 line (short by 3); `after` has 3 lines (short by 1) --
    // NEITHER step reaches exact count parity with expected, which is
    // exactly the shape T1 broke on (686/1236 units -> 902/1236 units,
    // never reaching 1236). Under the OLD sum-based formula this would
    // RISE 33 -> 43 (computed by hand from sumUnits on each side); the
    // fixed formula must FALL as more real matches are found.
    const expected = svg(
      '<g><rect x="1"/><line x1="0" y1="0" x2="1" y2="1"/>' +
        '<line x1="1" y1="1" x2="2" y2="2"/><rect x="2"/>' +
        '<line x1="2" y1="2" x2="3" y2="3"/><line x1="3" y1="3" x2="4" y2="4"/></g>',
    );
    const before = compareSvg(
      svg('<g><rect x="1"/><line x1="0" y1="0" x2="1" y2="1"/><rect x="2"/></g>'),
      expected,
      'deterministic',
    ).diffs;
    const after = compareSvg(
      svg(
        '<g><rect x="1"/><line x1="0" y1="0" x2="1" y2="1"/>' +
          '<line x1="1" y1="1" x2="2" y2="2"/><rect x="2"/>' +
          '<line x1="2" y1="2" x2="3" y2="3"/></g>',
      ),
      expected,
      'deterministic',
    ).diffs;

    expect(weightedScore(before)).toBe(19);
    expect(weightedScore(after)).toBe(9);
    expect(weightedScore(after)).toBeLessThan(weightedScore(before));
  });
});
