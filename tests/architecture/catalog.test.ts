/**
 * `docs/catalog.md` must not drift from `src/`.
 *
 * CLAUDE.md tells every agent "**Check before implementing anything**; agents
 * routinely rebuild what exists" and points at a module catalog. That rule
 * previously pointed at `.claude/catalog.md`, which did not exist and — since
 * `.claude/` is gitignored — never could have been committed. An instruction
 * pointing at a nonexistent file is worse than no instruction: it reads as
 * satisfied.
 *
 * The replacement is generated (`npm run catalog`), so the only way it stays
 * true is if something fails when it stops being true. That is this test.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

import { buildCatalog, CATALOG_PATH } from '../../scripts/generate-catalog.js';

describe('docs/catalog.md', () => {
  // No lock here (0 references), so the build-lock budget invariant
  // (`tests/architecture/stdlib-lock-test-budget.test.ts`) does not bind
  // this test. It needs a budget for its own reason: `buildCatalog()` walks
  // 1,010 files under `src/` and parses each with the TypeScript compiler,
  // and that cost lands very differently on a dev machine and on CI.
  //
  // CORRECTION (2026-08-23). The `test-budget-invariant` mission concluded
  // `no-change` here and this comment used to say "No budget was set: the
  // true worst-case ... was never reproducible to measure." That was true of
  // the evidence then and is false now. That mission measured only a 12-core
  // dev machine, where the test runs 391-406 ms, and characterised a single
  // `npm test` as "reliable, ~12x headroom". **CI disproved that**: it
  // failed `tests/architecture/catalog.test.ts` on 3 of 6 `ubuntu-latest`
  // runs, in an ordinary single, non-concurrent `npm test`.
  //
  // The number that was missing has now been measured on the machine that
  // actually fails, by temporarily lifting this budget so the call could run
  // to completion instead of being aborted at 5,000 ms (CI run 32611966134):
  //
  //   in-suite, on the runner          4,419 ms
  //   isolated, same run, same runner  389-692 ms   (4 cpus)
  //   isolated, 12-core dev machine    271-408 ms
  //   in-suite, 12-core dev machine    392-406 ms
  //
  // So the runner is only ~2.5x slower at this work in isolation; the rest
  // is contention from the suite's own 3 workers on 4 cores, worth a further
  // ~6-11x. At 4,419 ms the test sat at 88% of the 5,000 ms default, which
  // is why it tipped over intermittently rather than always.
  //
  // Derivation of 30,000: base is the 4,419 ms measured in-suite on CI. That
  // is a single observation from a PASSING run, and the failing runs are
  // known to have exceeded 5,000 ms, so the real tail is above the base, not
  // at it. Scaling by the 1.8x spread the same quantity showed within one
  // run (isolated 389 -> 692 ms) puts a plausible tail near 8,000 ms; 30,000
  // is ~3.8x that and ~6.8x the direct measurement. The margin is wide
  // because n=1 and the tail is known to lie above the measurement -- not
  // because a smaller number happened to fail. A hang still surfaces in 30 s,
  // well inside the job's own 12-minute cap.
  //
  // Full prior diagnosis, causal chain and what was ruled out:
  // `.agent-notes/tbi-T2.md`; this correction: `.agent-notes/catalog-ci-budget.md`.
  it(
    'is up to date with src/ (run `npm run catalog` if this fails)',
    () => {
      const committed = readFileSync(CATALOG_PATH, 'utf8');
      expect(buildCatalog()).toBe(committed);
    },
    30_000,
  );

  it('indexes a known shared seam, so the catalog can answer "does this exist?"', () => {
    // The worked example from SI31 T5: the faithful `DotPath#simulateCompound`
    // port already existed and copying it was forbidden. Finding it is the
    // whole point of the catalog, so pin that it is findable.
    const committed = readFileSync(CATALOG_PATH, 'utf8');
    expect(committed).toContain('`spline-clip.ts`');
    expect(committed).toContain('`clipSplineStart`');
  });
});
