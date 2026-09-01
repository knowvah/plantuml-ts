/**
 * The snapshot `scripts/repin-sequence-baselines.ts` actually needs — T9.2 of
 * `plans/sequence-coordinate-convergence`.
 *
 * WHY THIS EXISTS. `repin-sequence-baselines.ts` writes both `weightedScore`
 * and `diffCount` into `diff-baseline.json`, and it reads them off a snapshot
 * produced by `sequence-ratchet-adjudicate.ts --snapshot`. But that snapshot's
 * `FixtureMeasurement` carries no `diffCount` at all (`score`,
 * `childDistance`, `ownUnits`, `error`), so the re-pin's
 * `f.diffCount = m.diffCount ?? f.diffCount` silently keeps the STALE pinned
 * value — a number measured against a different commit, written out beside a
 * freshly measured score as though both were current.
 *
 * This measures both, through the same seams the gates use, so a re-pin
 * records what is actually there.
 *
 * `diffCount` is INFORMATIONAL and nothing gates on it: it is not monotone in
 * wrongness (`.claude` note `comparesvg-count-not-monotonic`, and the
 * adjudicator's own header, hazard 2). It is recorded because the baseline
 * file has a column for it, not because it means anything on its own.
 *
 * The measurement hazards are the adjudicator's: `renderSync` is never called,
 * the measurer is `DeterministicMeasurer`, and the include store is required
 * rather than optional.
 *
 *   npx jiti scripts/sequence-repin-snapshot.ts <out.json>
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DeterministicMeasurer } from '../src/core/measurer-deterministic.js';
import type { IncludeStore } from '../src/core/tim/IncludeStore.js';
import { fixtureIncludeStore } from '../tests/helpers/fixture-include-store.js';
import { compareSvg, weightedScore } from '../tests/oracle/svg-conformance/compare.js';
import { renderFixtureSequence } from '../tests/oracle/svg-conformance/render-fixture-sequence.js';
import { listFixtureSlugs, requireIncludeStore } from './sequence-geometry-distance.js';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = join(REPO, 'test-results', 'dot-cache', 'sequence');

/** Exactly the shape `repin-sequence-baselines.ts` destructures. */
export interface RepinMeasurement {
  readonly slug: string;
  readonly score: number | null;
  readonly diffCount: number | null;
}

/** Never throws: an error is `null`/`null`, never a zero score, for the same
 *  reason every other instrument in this mission refuses to coerce one. */
export function measureForRepin(
  dir: string,
  slug: string,
  store: IncludeStore,
): RepinMeasurement {
  try {
    const markup = readFileSync(join(dir, 'in.puml'), 'utf8');
    const golden = readFileSync(join(dir, 'in.svg'), 'utf8');
    const ours = renderFixtureSequence(markup, new DeterministicMeasurer(), {
      includeStore: store,
    });
    const { diffs } = compareSvg(ours, golden, 'deterministic');
    return { slug, score: weightedScore(diffs), diffCount: diffs.length };
  } catch {
    return { slug, score: null, diffCount: null };
  }
}

/* v8 ignore start -- corpus-scale I/O and CLI wiring. */
function main(argv: readonly string[]): number {
  const out = argv[0];
  if (out === undefined) {
    console.error('usage: npx jiti scripts/sequence-repin-snapshot.ts <out.json>');
    return 2;
  }
  const store = requireIncludeStore(fixtureIncludeStore);
  const rows = listFixtureSlugs(CACHE).map((slug) =>
    measureForRepin(join(CACHE, slug), slug, store),
  );
  writeFileSync(out, JSON.stringify(rows), 'utf8');
  const measured = rows.filter((r) => r.score !== null).length;
  console.log(`wrote ${String(rows.length)} rows (${String(measured)} measured) to ${out}`);
  return 0;
}

if (process.argv[1] !== undefined && process.argv[1].endsWith('sequence-repin-snapshot.ts')) {
  process.exitCode = main(process.argv.slice(2));
}
/* v8 ignore stop */
