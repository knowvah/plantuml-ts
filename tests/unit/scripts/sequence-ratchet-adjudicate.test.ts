/**
 * Unit tests for `scripts/sequence-ratchet-adjudicate.ts` — the D5 instrument
 * (`plans/sequence-command-coverage/decisions.md`, T4).
 *
 * The classifier is what authorises a re-pin, so its arithmetic is tested
 * directly rather than inferred from a corpus run. The corpus-scale
 * orchestration (the detached worktree, the child measurement process) is
 * exercised by running the script, not from here — spawning a git worktree per
 * test would make the suite depend on repository state.
 *
 * `measureFixture` and `listFixtureSlugs` ARE exercised against the committed
 * `test-results/dot-cache/sequence/` tree, because the hazard those two guard
 * (a measurement taken with no include store, or with the default
 * `CanvasMeasurer`, silently recording a harness failure as fidelity) can only
 * be pinned by a real render. Their assertions are on SHAPE, never on a
 * specific score: this branch is under concurrent edit and a pinned score
 * would be a snapshot of whichever change landed last.
 *
 * If any of this is ever driven under vitest for its console output, run with
 * `--reporter=verbose`: passing tests have their `console.log` suppressed, and
 * a silent run is not evidence that a branch did not fire.
 */
import { describe, it, expect } from 'vitest';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Diff } from '../../oracle/svg-conformance/compare.js';
import { fixtureIncludeStore } from '../../helpers/fixture-include-store.js';
import {
  TOP_LEVEL_CHILD_COUNT_PATH,
  SEQUENCE_CACHE_REL,
  adjudicate,
  childDistanceFrom,
  classify,
  formatTable,
  listFixtureSlugs,
  measureFixture,
  requireIncludeStore,
  summarize,
  type Adjudication,
  type Classifiable,
} from '../../../scripts/sequence-ratchet-adjudicate.js';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const CACHE_ROOT = join(REPO, SEQUENCE_CACHE_REL);

/** The canonical artefact case, measured in T13:
 *  `.agent-notes/T13-sequence-ratchet-rise-diagnosis.md`. */
const BEXOCE = {
  slug: 'bexoce-95-vibe195',
  baseScore: 622,
  liveScore: 950,
  baseChildDistance: 45,
  liveChildDistance: 1,
};

function at(score: number | null, childDistance: number | null): Classifiable {
  return { score, childDistance };
}

function childCountDiff(actual: string, expected: string): Diff {
  return { path: TOP_LEVEL_CHILD_COUNT_PATH, actual, expected, tolerance: 0.01 };
}

// ---------------------------------------------------------------------------
// childDistanceFrom
// ---------------------------------------------------------------------------

describe('childDistanceFrom', () => {
  it("reads |actual - expected| off the svg/g[1][childCount] record", () => {
    expect(childDistanceFrom([childCountDiff('14', '59')])).toBe(45);
    expect(childDistanceFrom([childCountDiff('60', '59')])).toBe(1);
  });

  it('returns 0 when the record is present with equal counts', () => {
    expect(childDistanceFrom([childCountDiff('59', '59')])).toBe(0);
  });

  it('ignores childCount records at any other path', () => {
    const nested: Diff = {
      path: 'svg/g[1]/g[3][childCount]',
      actual: '2',
      expected: '9',
      tolerance: 0.01,
    };
    expect(childDistanceFrom([nested])).toBeNull();
  });

  it('returns null when there is no top-level childCount record at all', () => {
    const attr: Diff = { path: 'svg/g[1]/@fill', actual: 'red', expected: 'blue', tolerance: 0.01 };
    expect(childDistanceFrom([attr])).toBeNull();
    expect(childDistanceFrom([])).toBeNull();
  });

  it('returns null rather than NaN when a side is not numeric', () => {
    expect(childDistanceFrom([childCountDiff('element', 'text')])).toBeNull();
  });

  it('picks the first matching record when the path repeats', () => {
    expect(childDistanceFrom([childCountDiff('10', '59'), childCountDiff('58', '59')])).toBe(49);
  });
});

// ---------------------------------------------------------------------------
// classify — D5 in code
// ---------------------------------------------------------------------------

describe('classify', () => {
  it("calls bexoce-95-vibe195's recorded rise an artefact (622->950, 45->1)", () => {
    expect(
      classify(
        at(BEXOCE.baseScore, BEXOCE.baseChildDistance),
        at(BEXOCE.liveScore, BEXOCE.liveChildDistance),
      ),
    ).toBe('artefact');
  });

  it('calls a rise whose child-count distance INCREASED a regression', () => {
    expect(classify(at(622, 1), at(950, 45))).toBe('regression');
  });

  it('calls a rise whose child-count distance is UNCHANGED a regression', () => {
    expect(classify(at(622, 12), at(950, 12))).toBe('regression');
  });

  it('calls a rise with no top-level childCount record inconclusive, never a guess', () => {
    expect(classify(at(622, null), at(950, null))).toBe('inconclusive');
    expect(classify(at(622, 45), at(950, null))).toBe('inconclusive');
    expect(classify(at(622, null), at(950, 1))).toBe('inconclusive');
  });

  it('calls a distance that fell to zero an artefact', () => {
    expect(classify(at(622, 45), at(950, 0))).toBe('artefact');
  });

  it('calls a fallen score improved and an equal score unchanged', () => {
    expect(classify(at(950, 1), at(622, 45))).toBe('improved');
    expect(classify(at(622, 45), at(622, 45))).toBe('unchanged');
  });

  it('never reads the child distance when the score did not rise', () => {
    // A fall is `improved` even where the distance got worse: the gate reads
    // the score, and a fall can never fail it.
    expect(classify(at(950, 1), at(622, 900))).toBe('improved');
    expect(classify(at(622, null), at(600, null))).toBe('improved');
    expect(classify(at(622, null), at(622, null))).toBe('unchanged');
  });

  it('calls a null score at either ref inconclusive, never scoring an error as 0', () => {
    expect(classify(at(null, null), at(950, 1))).toBe('inconclusive');
    expect(classify(at(622, 45), at(null, null))).toBe('inconclusive');
    expect(classify(at(null, null), at(null, null))).toBe('inconclusive');
  });
});

// ---------------------------------------------------------------------------
// adjudicate + summarize
// ---------------------------------------------------------------------------

describe('adjudicate', () => {
  it('joins two snapshots on slug and emits the full contract per fixture', () => {
    const rows = adjudicate(
      [{ slug: BEXOCE.slug, score: 622, childDistance: 45 }],
      [{ slug: BEXOCE.slug, score: 950, childDistance: 1 }],
    );
    expect(rows).toEqual([
      {
        slug: BEXOCE.slug,
        baseScore: 622,
        liveScore: 950,
        baseChildDistance: 45,
        liveChildDistance: 1,
        verdict: 'artefact',
      },
    ]);
  });

  it('reports a fixture that errored at one ref as null, not as zero', () => {
    const rows = adjudicate(
      [{ slug: 'a', score: null, childDistance: null, error: 'boom' }],
      [{ slug: 'a', score: 300, childDistance: 2 }],
    );
    expect(rows[0]?.baseScore).toBeNull();
    expect(rows[0]?.liveScore).toBe(300);
    expect(rows[0]?.verdict).toBe('inconclusive');
  });

  it('walks the UNION of slugs, sorted, so a one-ref-only fixture is not dropped', () => {
    const rows = adjudicate(
      [
        { slug: 'zeta', score: 10, childDistance: 1 },
        { slug: 'alpha', score: 10, childDistance: 1 },
      ],
      [
        { slug: 'alpha', score: 10, childDistance: 1 },
        { slug: 'mid', score: 7, childDistance: 0 },
      ],
    );
    expect(rows.map((r) => r.slug)).toEqual(['alpha', 'mid', 'zeta']);
    expect(rows[1]).toEqual({
      slug: 'mid',
      baseScore: null,
      liveScore: 7,
      baseChildDistance: null,
      liveChildDistance: 0,
      verdict: 'inconclusive',
    });
    expect(rows[2]?.liveScore).toBeNull();
  });

  it('returns no rows for two empty snapshots', () => {
    expect(adjudicate([], [])).toEqual([]);
  });
});

describe('summarize', () => {
  function row(verdict: Adjudication['verdict'], slug = 's'): Adjudication {
    return {
      slug,
      baseScore: 1,
      liveScore: 2,
      baseChildDistance: 1,
      liveChildDistance: 0,
      verdict,
    };
  }

  it('counts every verdict, reporting zeros for the absent ones', () => {
    expect(summarize([row('artefact'), row('artefact'), row('regression')])).toEqual({
      artefact: 2,
      regression: 1,
      inconclusive: 0,
      unchanged: 0,
      improved: 0,
    });
  });

  it('counts an empty report as all zeros', () => {
    expect(summarize([])).toEqual({
      artefact: 0,
      regression: 0,
      inconclusive: 0,
      unchanged: 0,
      improved: 0,
    });
  });
});

// ---------------------------------------------------------------------------
// formatTable
// ---------------------------------------------------------------------------

describe('formatTable', () => {
  const artefact: Adjudication = {
    slug: BEXOCE.slug,
    baseScore: 622,
    liveScore: 950,
    baseChildDistance: 45,
    liveChildDistance: 1,
    verdict: 'artefact',
  };
  const unchanged: Adjudication = {
    slug: 'quiet',
    baseScore: 5,
    liveScore: 5,
    baseChildDistance: 0,
    liveChildDistance: 0,
    verdict: 'unchanged',
  };

  it('emits a header row and one aligned row per adjudicated fixture', () => {
    const lines = formatTable([artefact]).split('\n');
    expect(lines[0]).toBe('slug               base  live  baseDist  liveDist  verdict');
    expect(lines[1]).toBe('bexoce-95-vibe195  622   950   45        1         artefact');
  });

  it('omits unchanged rows from the table', () => {
    expect(formatTable([artefact, unchanged])).not.toContain('quiet');
  });

  it('renders a null score as a dash rather than a zero', () => {
    const errored: Adjudication = {
      slug: 'e',
      baseScore: null,
      liveScore: 3,
      baseChildDistance: null,
      liveChildDistance: 0,
      verdict: 'inconclusive',
    };
    expect(formatTable([errored]).split('\n')[1]).toBe('e     -     3     -         0         inconclusive');
  });

  it('says so plainly when nothing moved', () => {
    expect(formatTable([unchanged])).toBe('no fixture changed score.');
    expect(formatTable([])).toBe('no fixture changed score.');
  });
});

// ---------------------------------------------------------------------------
// requireIncludeStore — hazard 2, the store is not optional
// ---------------------------------------------------------------------------

describe('requireIncludeStore', () => {
  it('fails loudly rather than measuring when no store is available', () => {
    expect(() => requireIncludeStore(() => undefined)).toThrow(/is NOT optional/);
  });

  it('names the underlying reason when the store cannot be built', () => {
    expect(() =>
      requireIncludeStore(() => {
        throw new Error('assets/stdlib missing');
      }),
    ).toThrow(/assets\/stdlib missing/);
  });

  it('passes the real fixture store straight through', () => {
    const store = fixtureIncludeStore();
    expect(requireIncludeStore(() => store)).toBe(store);
  });
});

// ---------------------------------------------------------------------------
// measureFixture / listFixtureSlugs — against the committed corpus
// ---------------------------------------------------------------------------

describe('listFixtureSlugs', () => {
  it('lists the committed sequence corpus, sorted', () => {
    const slugs = listFixtureSlugs(CACHE_ROOT);
    expect(slugs).toContain(BEXOCE.slug);
    expect(slugs.length).toBeGreaterThan(1000);
    expect([...slugs].sort((a, b) => a.localeCompare(b))).toEqual(slugs);
  });

  it('treats a missing corpus as a broken checkout, not an empty run', () => {
    expect(() => listFixtureSlugs(join(CACHE_ROOT, 'no-such-tree'))).toThrow(
      /broken checkout/,
    );
  });
});

describe('measureFixture', () => {
  it('measures the canonical fixture with the store and DeterministicMeasurer', () => {
    const result = measureFixture(
      join(CACHE_ROOT, BEXOCE.slug),
      BEXOCE.slug,
      fixtureIncludeStore(),
    );
    expect(result.error).toBeUndefined();
    expect(result.slug).toBe(BEXOCE.slug);
    // Shape, not a pinned value: this branch is under concurrent edit.
    expect(typeof result.score).toBe('number');
    expect(result.score).toBeGreaterThan(0);
    expect(result.childDistance).not.toBeNull();
    expect(result.childDistance).toBeGreaterThanOrEqual(0);
  });

  it('is deterministic: two measurements of one fixture agree exactly', () => {
    const dir = join(CACHE_ROOT, BEXOCE.slug);
    const store = fixtureIncludeStore();
    expect(measureFixture(dir, BEXOCE.slug, store)).toEqual(
      measureFixture(dir, BEXOCE.slug, store),
    );
  });

  it('records a failure as a null score with a reason, never as zero', () => {
    const result = measureFixture(join(CACHE_ROOT, 'no-such-fixture'), 'no-such-fixture', fixtureIncludeStore());
    expect(result.score).toBeNull();
    expect(result.childDistance).toBeNull();
    expect(result.error).toMatch(/ENOENT/);
  });
});
