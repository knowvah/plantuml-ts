/**
 * Bucket-rule pins for the sequence cause census (sequence-oracle-harness /
 * T4).
 *
 * D5 requires every bucket rule to be pinned by a test over a **synthetic**
 * `Diff` — a hand-built record, never a fixture — so each rule is provable
 * on its own and no number in `oracle/goldens/svg-sequence/diff-census.json`
 * depends on an agent having looked at an SVG. The corpus-level tests below
 * add the integrity checks D5 cannot get from synthetic records alone
 * (1-to-1 with T2's baseline, errors excluded, re-run stability).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

import {
  BUCKETS,
  CACHE_ROOT,
  CENSUS_PATH,
  MANIFEST_PATH,
  attributeNameOf,
  buildCensus,
  classifyDiff,
  emptyBucketCounts,
  readBaseline,
  renderCensusJson,
  tallyDiffs,
} from './sequence-diff-census.js';
import type { Bucket, Census } from './sequence-diff-census.js';
import type { Diff } from './compare.js';

/** Builds a synthetic `Diff`. Nothing here is read from a fixture. */
function synthetic(path: string, actual: string, expected: string, delta?: number): Diff {
  return delta === undefined
    ? { path, actual, expected, tolerance: 0.01 }
    : { path, actual, expected, delta, tolerance: 0.01 };
}

/**
 * Asserts the classifier puts `diff` in `bucket` **and no other** — the
 * literal wording of T4's first acceptance criterion. Tallying a
 * single-element array proves exclusivity in a way `toBe(bucket)` alone
 * cannot: every one of the other five counts must still be 0.
 */
function expectOnly(diff: Diff, bucket: Bucket): void {
  expect(classifyDiff(diff)).toBe(bucket);
  const expectedCounts = { ...emptyBucketCounts(), [bucket]: 1 };
  expect(tallyDiffs([diff])).toEqual(expectedCounts);
}

// ---------------------------------------------------------------------------
// The bucket set itself is fixed by D5. A seventh bucket is stop 9.
// ---------------------------------------------------------------------------

describe('sequence diff census — the bucket set is D5s, exactly', () => {
  it('is the six D5 names, in order, with no additions', () => {
    expect([...BUCKETS]).toEqual([
      'missing-element',
      'extra-element',
      'geometry',
      'text-metrics',
      'format-units',
      'other',
    ]);
  });

  it('an empty tally initialises all six buckets to 0', () => {
    expect(tallyDiffs([])).toEqual({
      'missing-element': 0,
      'extra-element': 0,
      geometry: 0,
      'text-metrics': 0,
      'format-units': 0,
      other: 0,
    });
  });
});

// ---------------------------------------------------------------------------
// Rule 1 — element presence, read off the comparator's `[childCount]` diff.
// ---------------------------------------------------------------------------

describe('sequence diff census — rule 1: element presence', () => {
  it('fewer children on our side than the reference is missing-element', () => {
    expectOnly(synthetic('svg/g[1][childCount]', '94', '630'), 'missing-element');
  });

  it('more children on our side than the reference is extra-element', () => {
    expectOnly(synthetic('svg/defs[1][childCount]', '12', '0'), 'extra-element');
  });

  it('a child count that does not parse as a number is other, never a guess', () => {
    expectOnly(synthetic('svg/g[1][childCount]', 'many', '0'), 'other');
  });
});

// ---------------------------------------------------------------------------
// Rule 2 — format/unit equivalence, checked on the values before any
// attribute-name rule, because it is a statement about the values.
// ---------------------------------------------------------------------------

describe('sequence diff census — rule 2: format-units', () => {
  it('a bare number against the same number with a unit suffix is format-units', () => {
    expectOnly(synthetic('svg/g[1]/text[1]/@font-size', '14', '14px'), 'format-units');
  });

  it('the same number written with different precision is format-units', () => {
    expectOnly(synthetic('svg/g[1]/rect[1]/@stroke-width', '1.0', '1'), 'format-units');
  });

  it('a case-only difference is format-units', () => {
    expectOnly(synthetic('svg/g[1]/rect[1]/@fill', '#FFFFFF', '#ffffff'), 'format-units');
  });

  it('format-units never fires when one side is absent', () => {
    expectOnly(synthetic('svg/@zoomAndPan', '', 'magnify'), 'other');
  });

  it('genuinely different numbers are not format-units', () => {
    expectOnly(synthetic('svg/g[1]/rect[1]/@x', '10', '20', 10), 'geometry');
  });
});

// ---------------------------------------------------------------------------
// Rule 3 — attribute-name rules.
// ---------------------------------------------------------------------------

describe('sequence diff census — rule 3a: geometry', () => {
  it('a plain numeric attribute is geometry', () => {
    expectOnly(synthetic('svg/g[1]/ellipse[1]/@cx', '31.5', '40', 8.5), 'geometry');
  });

  it('an indexed viewBox component is geometry', () => {
    expectOnly(synthetic('svg/@viewBox[2]', '1340', '218', 1122), 'geometry');
  });

  it('an indexed path-data number is geometry', () => {
    expectOnly(synthetic('svg/g[1]/path[1]/@d[3]', '12', '15', 3), 'geometry');
  });

  it('a whole path-data mismatch (different commands) is geometry', () => {
    expectOnly(synthetic('svg/g[1]/path[1]/@d', 'M0,0 L1,1', 'M0,0 C1,1 2,2 3,3'), 'geometry');
  });

  it('an indexed points number is geometry', () => {
    expectOnly(synthetic('svg/g[1]/polygon[1]/@points[4]', '9', '11', 2), 'geometry');
  });

  it('a transform parameter is geometry', () => {
    expectOnly(
      synthetic('svg/g[1]/g[2]/@transform[0].param[1]', '5', '9', 4),
      'geometry',
    );
  });

  it('a transform function-name mismatch is geometry', () => {
    expectOnly(
      synthetic('svg/g[1]/g[2]/@transform[0].type', 'translate', 'matrix'),
      'geometry',
    );
  });
});

describe('sequence diff census — rule 3b: text-metrics', () => {
  it('textLength is text-metrics', () => {
    expectOnly(synthetic('svg/g[1]/text[3]/@textLength', '42', '51'), 'text-metrics');
  });

  it('lengthAdjust is text-metrics', () => {
    expectOnly(
      synthetic('svg/g[1]/text[3]/@lengthAdjust', 'spacingAndGlyphs', ''),
      'text-metrics',
    );
  });

  it('a font attribute is text-metrics', () => {
    expectOnly(synthetic('svg/g[1]/text[3]/@font-size', '13', '14'), 'text-metrics');
  });

  it('a text-layout attribute is text-metrics', () => {
    expectOnly(synthetic('svg/g[1]/text[3]/@text-anchor', 'middle', ''), 'text-metrics');
  });
});

describe('sequence diff census — rule 3c: other', () => {
  it('a tag substitution (a node-level diff, no attribute) is other', () => {
    expectOnly(synthetic('svg/g[1]/rect[5]', 'rect', 'text'), 'other');
  });

  it('a node-kind substitution is other', () => {
    expectOnly(synthetic('svg/g[1]/text()[2]', 'text', 'element'), 'other');
  });

  it('a text-content difference is other, not text-metrics', () => {
    expectOnly(synthetic('svg/g[1]/text[5]/text()[1]', 'Bob', 'hello1'), 'other');
  });

  it('an attribute in neither name set is other', () => {
    expectOnly(synthetic('svg/@preserveAspectRatio', '', 'none'), 'other');
  });

  it('a paint attribute is other — it is neither geometry nor a text metric', () => {
    expectOnly(synthetic('svg/g[1]/rect[1]/@fill', '#FFFFFF', '#F1F1F1'), 'other');
  });
});

// ---------------------------------------------------------------------------
// The path parser the rules above stand on.
// ---------------------------------------------------------------------------

describe('sequence diff census — attribute-name extraction', () => {
  it('reads a plain attribute name', () => {
    expect(attributeNameOf('svg/@width')).toBe('width');
  });

  it('strips an index suffix', () => {
    expect(attributeNameOf('svg/@viewBox[2]')).toBe('viewBox');
  });

  it('strips a transform sub-selector', () => {
    expect(attributeNameOf('svg/g[1]/@transform[0].param[1]')).toBe('transform');
    expect(attributeNameOf('svg/g[1]/@transform[0].type')).toBe('transform');
  });

  it('keeps a namespaced attribute name intact', () => {
    expect(attributeNameOf('svg/@xmlns:xlink')).toBe('xmlns:xlink');
  });

  it('returns undefined for a node-level path', () => {
    expect(attributeNameOf('svg/g[1]/text[5]/text()[1]')).toBeUndefined();
    expect(attributeNameOf('svg/g[1][childCount]')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Corpus-level integrity. These read T2's pinned baseline and the committed
// census; they never write either.
// ---------------------------------------------------------------------------

const census = JSON.parse(readFileSync(CENSUS_PATH, 'utf8')) as Census;
const baseline = readBaseline(MANIFEST_PATH);

describe('sequence diff census — the committed census against T2s baseline', () => {
  it('holds every non-errored baseline fixture exactly once', () => {
    const censused = census.fixtures.map((f) => f.slug);
    expect(new Set(censused).size).toBe(censused.length);
    expect([...censused].sort()).toEqual(baseline.measurable.map((f) => f.slug).sort());
  });

  it('excludes every fixture T2 recorded as an error from the fixture list', () => {
    const errored = new Set(baseline.errored.map((f) => f.slug));
    expect(census.fixtures.filter((f) => errored.has(f.slug))).toEqual([]);
  });

  it('reports those errors separately, with a reason, never as zero diffs', () => {
    expect(census.errors.map((e) => e.slug).sort()).toEqual(
      baseline.errored.map((f) => f.slug).sort(),
    );
    for (const e of census.errors) expect(e.reason).toBeTruthy();
    expect(census.errors.length).toBeGreaterThan(0);
  });

  it('totals are the sum of the per-fixture bucket counts', () => {
    const summed = emptyBucketCounts();
    for (const f of census.fixtures) {
      for (const b of BUCKETS) summed[b] += f.buckets[b];
    }
    expect(census.totals).toEqual(summed);
  });

  it('each fixtures diffCount is the sum of its own buckets', () => {
    for (const f of census.fixtures) {
      const sum = BUCKETS.reduce((acc, b) => acc + f.buckets[b], 0);
      expect(sum, `${f.slug}: diffCount must equal its bucket sum`).toBe(f.diffCount);
    }
  });
});

// ---------------------------------------------------------------------------
// Re-run stability, and reproducibility of the committed artifact.
//
// Scoped to a REAL-corpus slice rather than all 1138 fixtures: a full census
// pass costs ~9 s, and running it twice inside the suite would put `npm test`
// over its 60.3 s ceiling. The slice is real cache input (not synthetic), the
// classifier and the serialiser are pure, and the full-corpus double run is
// verified out of band and recorded in `.agent-notes/g1h-T4.md`.
// ---------------------------------------------------------------------------

describe('sequence diff census — re-running is byte-identical', () => {
  const slice = baseline.measurable.slice(0, 12);

  it('two census passes over the same corpus slice serialise identically', () => {
    const first = renderCensusJson(buildCensus(slice, CACHE_ROOT));
    const second = renderCensusJson(buildCensus(slice, CACHE_ROOT));
    expect(second).toBe(first);
  });

  it('a freshly computed slice matches what the committed census records', () => {
    const fresh = buildCensus(slice, CACHE_ROOT);
    const committed = new Map(census.fixtures.map((f) => [f.slug, f]));
    expect(fresh.fixtures.length).toBe(slice.length);
    for (const f of fresh.fixtures) {
      expect(committed.get(f.slug), `${f.slug} missing from the committed census`).toEqual(f);
    }
  });
});

// ---------------------------------------------------------------------------
// A render failure must never be coerced into "0 diffs".
// ---------------------------------------------------------------------------

describe('sequence diff census — an unrenderable fixture is an error, not a zero', () => {
  it('records a fixture whose cache entry is absent as an error', () => {
    const result = buildCensus([{ type: 'sequence', slug: 'no-such-fixture' }], CACHE_ROOT);
    expect(result.fixtures).toEqual([]);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0]?.slug).toBe('no-such-fixture');
    expect(result.errors[0]?.reason).toBeTruthy();
    expect(result.totals).toEqual(emptyBucketCounts());
  });
});
