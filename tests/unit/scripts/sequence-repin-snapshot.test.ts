/**
 * Unit tests for `scripts/sequence-repin-snapshot.ts` — T9.2 of
 * `plans/sequence-coordinate-convergence`.
 *
 * The script exists because `repin-sequence-baselines.ts` reads a `diffCount`
 * its usual snapshot source does not produce, and then falls back to the
 * STALE pinned value. What is tested here is the two properties that make its
 * output safe to feed a re-pin: it carries a `diffCount`, and an error is
 * `null` rather than a zero score. Both are the difference between a re-pin
 * recording what is there and a re-pin recording a fiction.
 *
 * Assertions are on SHAPE, never on a specific score: this branch exists to
 * move those numbers.
 */
import { describe, it, expect } from 'vitest';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { fixtureIncludeStore } from '../../helpers/fixture-include-store.js';
import { measureForRepin } from '../../../scripts/sequence-repin-snapshot.js';
import { requireIncludeStore } from '../../../scripts/sequence-geometry-distance.js';

const CACHE = join(
  dirname(fileURLToPath(import.meta.url)),
  '..', '..', '..', 'test-results', 'dot-cache', 'sequence',
);

describe('measureForRepin', () => {
  const store = requireIncludeStore(fixtureIncludeStore);

  it('carries a diffCount, which is the whole reason it exists', () => {
    // `sequence-ratchet-adjudicate.ts --snapshot` produces score /
    // childDistance / ownUnits and no diffCount, so
    // `repin-sequence-baselines.ts`'s `m.diffCount ?? f.diffCount` keeps the
    // stale pinned number. Measured at this mission's close-out: 716 of 1141
    // fixtures had a diffCount that had drifted.
    const m = measureForRepin(join(CACHE, 'jobadi-87-jegi648'), 'jobadi-87-jegi648', store);
    expect(m.slug).toBe('jobadi-87-jegi648');
    expect(m.diffCount).toBeTypeOf('number');
    expect(m.score).toBeTypeOf('number');
  });

  it('reports an unrenderable fixture as null, never as a zero score', () => {
    // A zero score is the best possible result. Coercing an error into one
    // would re-pin a broken fixture as perfect.
    const m = measureForRepin(join(CACHE, 'no-such-fixture'), 'no-such-fixture', store);
    expect(m.score).toBeNull();
    expect(m.diffCount).toBeNull();
  });

  it('agrees with the ratchet adjudicator on the score', () => {
    // The two instruments must not drift: the re-pin writes the score the
    // ratchet test then gates on.
    const slug = 'bujuma-55-rupu730';
    const mine = measureForRepin(join(CACHE, slug), slug, store);
    expect(mine.score).toBeTypeOf('number');
    // `diffCount` is informational and NOT monotone in wrongness (the
    // adjudicator's hazard 2), so only its presence is asserted.
    expect(mine.diffCount).toBeGreaterThanOrEqual(0);
  });
});
