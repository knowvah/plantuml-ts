/**
 * Unit tests for `scripts/sequence-geometry-distance.ts` — the Batch 1
 * instrument of `plans/sequence-coordinate-convergence` (T1.1).
 *
 * This instrument is the quantity every later batch of that mission is gated
 * on (D1), so its arithmetic is pinned directly rather than inferred from a
 * corpus run. Two properties carry the whole mission and are tested hardest:
 *
 *   1. Distance sums MAGNITUDES. If two coordinate errors of opposite sign
 *      could cancel, a batch that made half the corpus worse could report
 *      progress.
 *   2. A fixture that stops descending is EXCLUDED from the movement total
 *      rather than counted as having improved to zero. That is the one way
 *      this instrument could manufacture a false green (see the module's
 *      cohort-hazard header), and `isCommensurable` is its only guard.
 *
 * `measureFixture` and `listFixtureSlugs` are exercised against the committed
 * `test-results/dot-cache/sequence/` tree, because the hazard they guard — a
 * measurement taken with no include store, recording a harness failure as
 * geometry — can only be pinned by a real render. Their assertions are on
 * SHAPE, never on a specific distance: this branch exists to move those
 * numbers, and a pinned distance would fail by design on the next batch.
 */
import { describe, it, expect } from 'vitest';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { fixtureIncludeStore } from '../../helpers/fixture-include-store.js';
import type { Diff } from '../../oracle/svg-conformance/compare.js';
import {
  SEQUENCE_CACHE_REL,
  TOP_LEVEL_CHILD_COUNT_PATH,
  attributeOf,
  commensurableTotal,
  compareSnapshots,
  descendedFrom,
  distanceOf,
  formatAttributeTable,
  formatCohort,
  formatMovement,
  isCommensurable,
  listFixtureSlugs,
  measureFixture,
  mergeByAttribute,
  requireIncludeStore,
  summarize,
  type DistanceSnapshot,
  type FixtureDistance,
} from '../../../scripts/sequence-geometry-distance.js';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const CACHE = join(REPO, SEQUENCE_CACHE_REL);

/** A numeric diff, shaped exactly as `compare.ts` constructs one. */
function numeric(path: string, delta: number): Diff {
  return { path, actual: '0', expected: String(delta), delta, tolerance: 0.01 };
}

/** A non-numeric diff — no `delta`, so not distance. */
function textual(path: string): Diff {
  return { path, actual: 'red', expected: 'blue', tolerance: 0.01 };
}

function fixture(over: Partial<FixtureDistance> & { slug: string }): FixtureDistance {
  return { distance: 0, numericCount: 0, descended: true, byAttribute: {}, ...over };
}

describe('attributeOf', () => {
  it('reads a plain numeric attribute name', () => {
    expect(attributeOf('svg/g[1]/rect/@x')).toBe('x');
  });

  it('strips the element index off a `d`/`points` member', () => {
    expect(attributeOf('svg/g[1]/path/@d[7]')).toBe('d');
    expect(attributeOf('svg/g[1]/polygon/@points[2]')).toBe('points');
  });

  it('strips both indices off a transform parameter', () => {
    expect(attributeOf('svg/g[1]/g/@transform[0].param[1]')).toBe('transform');
  });

  it('is null for a path that names no attribute', () => {
    expect(attributeOf(TOP_LEVEL_CHILD_COUNT_PATH)).toBeNull();
    expect(attributeOf('svg/g[1]')).toBeNull();
  });
});

describe('distanceOf', () => {
  it('sums only the diffs that carry a delta', () => {
    const { total } = distanceOf([numeric('svg/rect/@x', 4), textual('svg/rect/@fill')]);
    expect(total).toEqual({ distance: 4, count: 1 });
  });

  it('sums MAGNITUDES, so opposite errors cannot cancel', () => {
    // The mission's whole premise is that distance falls monotonically as
    // coordinates approach the jar's. A signed sum would let a batch that
    // pushed half the corpus the wrong way report zero movement.
    const { total } = distanceOf([numeric('svg/a/@x', -6), numeric('svg/b/@x', 6)]);
    expect(total).toEqual({ distance: 12, count: 2 });
  });

  it('groups by bare attribute name across nodes and indices', () => {
    const { byAttribute } = distanceOf([
      numeric('svg/g[1]/rect/@x', 2),
      numeric('svg/g[2]/text/@x', 3),
      numeric('svg/g[1]/path/@d[0]', 1),
      numeric('svg/g[1]/path/@d[4]', 1),
    ]);
    expect(byAttribute['x']).toEqual({ distance: 5, count: 2 });
    expect(byAttribute['d']).toEqual({ distance: 2, count: 2 });
  });

  it('files a delta whose path names no attribute under `unattributed`', () => {
    const { byAttribute } = distanceOf([numeric('svg/g[1]', 3)]);
    expect(byAttribute['unattributed']).toEqual({ distance: 3, count: 1 });
  });

  it('ignores a non-finite delta rather than poisoning the total with NaN', () => {
    const { total } = distanceOf([numeric('svg/rect/@x', Number.NaN), numeric('svg/rect/@y', 2)]);
    expect(total).toEqual({ distance: 2, count: 1 });
  });
});

describe('descendedFrom', () => {
  it('is false when the top-level child count short-circuited', () => {
    expect(descendedFrom([{ ...textual(TOP_LEVEL_CHILD_COUNT_PATH), weight: 90 }])).toBe(false);
  });

  it('is true when that record is absent', () => {
    expect(descendedFrom([numeric('svg/g[1]/rect/@x', 4)])).toBe(true);
    expect(descendedFrom([])).toBe(true);
  });
});

describe('mergeByAttribute', () => {
  it('accumulates distance and count per name', () => {
    const into = { x: { distance: 1, count: 1 } };
    mergeByAttribute(into, { x: { distance: 2, count: 3 }, y: { distance: 5, count: 1 } });
    expect(into).toEqual({ x: { distance: 3, count: 4 }, y: { distance: 5, count: 1 } });
  });
});

describe('summarize', () => {
  it('rolls up totals, per-attribute, and the cohort split', () => {
    const snapshot = summarize([
      fixture({ slug: 'a', distance: 10, numericCount: 2, byAttribute: { x: { distance: 10, count: 2 } } }),
      fixture({ slug: 'b', distance: 0, numericCount: 0, descended: false }),
      fixture({ slug: 'c', distance: null, numericCount: null, descended: false, error: 'boom' }),
    ]);
    expect(snapshot.total).toEqual({ distance: 10, count: 2 });
    expect(snapshot.byAttribute).toEqual({ x: { distance: 10, count: 2 } });
    expect(snapshot.cohort).toEqual({ measured: 2, errored: 1, descended: 1, shortCircuited: 1 });
  });

  it('never coerces an errored fixture to a distance of zero', () => {
    // An error is an ABSENCE of measurement. Counting it as 0 would make a
    // batch that broke rendering outright look like the best batch so far.
    const snapshot = summarize([fixture({ slug: 'a', distance: null, numericCount: null, error: 'x' })]);
    expect(snapshot.total).toEqual({ distance: 0, count: 0 });
    expect(snapshot.cohort.measured).toBe(0);
    expect(snapshot.cohort.errored).toBe(1);
  });
});

describe('isCommensurable', () => {
  it('is true when both refs descended', () => {
    expect(isCommensurable(fixture({ slug: 'a', distance: 9 }), fixture({ slug: 'a', distance: 4 }))).toBe(true);
  });

  it('is false when descent status changed', () => {
    const base = fixture({ slug: 'a', distance: 900, descended: true });
    const live = fixture({ slug: 'a', distance: 0, descended: false });
    expect(isCommensurable(base, live)).toBe(false);
  });

  it('is false when either ref failed to measure', () => {
    expect(isCommensurable(fixture({ slug: 'a', distance: null }), fixture({ slug: 'a', distance: 4 }))).toBe(false);
  });
});

describe('compareSnapshots', () => {
  const snap = (fixtures: readonly FixtureDistance[]): DistanceSnapshot => summarize([...fixtures]);

  it('reports a fall as a negative delta', () => {
    const rows = compareSnapshots(
      snap([fixture({ slug: 'a', distance: 30, numericCount: 3 })]),
      snap([fixture({ slug: 'a', distance: 12, numericCount: 3 })]),
    );
    expect(rows[0]?.delta).toBe(-18);
  });

  it('EXCLUDES a fixture that stopped descending instead of crediting the fall', () => {
    // The false-green this instrument exists to prevent: a change that made
    // a fixture short-circuit drops its distance to 0, which read naively is
    // the largest improvement in the corpus.
    const rows = compareSnapshots(
      snap([fixture({ slug: 'a', distance: 900, numericCount: 40, descended: true })]),
      snap([fixture({ slug: 'a', distance: 0, numericCount: 0, descended: false })]),
    );
    expect(rows[0]?.delta).toBeNull();
    expect(commensurableTotal(rows)).toEqual({ distance: 0, count: 0 });
  });

  it('walks the union of slugs, sorted, so a one-sided fixture is reported', () => {
    const rows = compareSnapshots(
      snap([fixture({ slug: 'b', distance: 1 })]),
      snap([fixture({ slug: 'a', distance: 1 })]),
    );
    expect(rows.map((r) => r.slug)).toEqual(['a', 'b']);
    expect(rows.every((r) => r.delta === null)).toBe(true);
  });
});

describe('reporting', () => {
  it('orders the attribute table heaviest first', () => {
    const table = formatAttributeTable({
      x: { distance: 5, count: 1 },
      width: { distance: 50, count: 2 },
    });
    expect(table.split('\n')[1]).toMatch(/^width/);
  });

  it('says so when there is nothing to report', () => {
    expect(formatAttributeTable({})).toBe('no numeric diffs.');
  });

  it('always prints the cohort beside the total', () => {
    const line = formatCohort(summarize([fixture({ slug: 'a', distance: 3, numericCount: 1 })]));
    expect(line).toContain('descended=1');
    expect(line).toContain('distance=3.000');
  });

  it('names the direction of movement and what it excluded', () => {
    const text = formatMovement([
      { slug: 'a', baseDistance: 10, liveDistance: 4, delta: -6, baseDescended: true, liveDescended: true },
      { slug: 'b', baseDistance: 9, liveDistance: 0, delta: null, baseDescended: true, liveDescended: false },
    ]);
    expect(text).toContain('total distance FELL by 6.000');
    expect(text).toContain('descent status changed (excluded, not summed): 1');
  });
});

describe('requireIncludeStore', () => {
  it('refuses to measure without a store rather than recording a harness failure', () => {
    expect(() => requireIncludeStore(() => undefined)).toThrow(/NOT optional/);
  });

  it('returns the real store', () => {
    expect(requireIncludeStore(fixtureIncludeStore)).toBeDefined();
  });
});

describe('corpus wiring', () => {
  it('lists only slugs with both halves of the committed pair', () => {
    const slugs = listFixtureSlugs(CACHE);
    expect(slugs.length).toBeGreaterThan(1000);
    expect([...slugs].sort((a, b) => a.localeCompare(b))).toEqual(slugs);
  });

  it('throws a diagnosis, not ENOENT, when the committed cache is missing', () => {
    expect(() => listFixtureSlugs(join(CACHE, 'no-such-dir'))).toThrow(/broken checkout/);
  });

  it('measures a real fixture through the deterministic pipeline', () => {
    const slug = 'jobadi-87-jegi648';
    const measured = measureFixture(join(CACHE, slug), slug, requireIncludeStore(fixtureIncludeStore));
    expect(measured.error).toBeUndefined();
    expect(measured.distance).toBeGreaterThan(0);
    expect(measured.numericCount).toBeGreaterThan(0);
    // Shape only: this branch exists to move these numbers.
    expect(Object.keys(measured.byAttribute).length).toBeGreaterThan(0);
  });

  it('captures a render failure as null rather than as a distance of zero', () => {
    const measured = measureFixture(join(CACHE, 'no-such-fixture'), 'no-such-fixture', requireIncludeStore(fixtureIncludeStore));
    expect(measured.distance).toBeNull();
    expect(measured.error).toBeDefined();
  });
});
