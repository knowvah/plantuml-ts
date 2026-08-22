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
  // No lock here (0 references) and no explicit testTimeout by design (see
  // plans/test-budget-invariant/decisions.md D4/D5) — this uses vitest's
  // unconfigured 5,000ms default against buildCatalog()'s ~400-600ms
  // CPU-bound tree-walk-and-parse. Single `npm test`: reliable, ~12x
  // headroom (391-406ms measured). Two concurrent `npm test` invocations on
  // this 12-core machine can intermittently exceed 5,000ms — not a smooth
  // function of load, but a probabilistic OS-scheduling collision between
  // the two processes' own worker-fork startup CPU bursts landing tightly
  // around this test's ~500ms window (every non-colliding measurement,
  // including load1 up to 71, topped out at ~2,306ms). No budget was set:
  // the true worst-case collision window was never reproducible to measure,
  // and picking a number without it would be fitting a value. Full
  // diagnosis, causal chain, and what was ruled out: `.agent-notes/tbi-T2.md`.
  it('is up to date with src/ (run `npm run catalog` if this fails)', () => {
    const committed = readFileSync(CATALOG_PATH, 'utf8');
    expect(buildCatalog()).toBe(committed);
  });

  it('indexes a known shared seam, so the catalog can answer "does this exist?"', () => {
    // The worked example from SI31 T5: the faithful `DotPath#simulateCompound`
    // port already existed and copying it was forbidden. Finding it is the
    // whole point of the catalog, so pin that it is findable.
    const committed = readFileSync(CATALOG_PATH, 'utf8');
    expect(committed).toContain('`spline-clip.ts`');
    expect(committed).toContain('`clipSplineStart`');
  });
});
