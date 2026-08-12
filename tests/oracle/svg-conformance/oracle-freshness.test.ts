/**
 * Freshness guard for the committed object oracle cache (object-close D4).
 *
 * The bug this exists to prevent already happened and nothing failed:
 * `test-results/dot-cache/object/*​/in.svg` was captured before the 0.2.0
 * SVG-reduction port (`DIVERGENCES.md` → "SVG emission tracks upstream's
 * reduced form"), so `svg-conformance-census.ts object` compared this port's
 * current output against a pre-reduction oracle and reported 0/80 — an
 * artifact that sat there, green, while the real number was 23/80. A gate that
 * cannot detect its own stale input is not a gate.
 *
 * Staleness is a whole-cache property — one capture run wrote every file — so
 * ONE sentinel is enough. `beruju-17-jigi548` is the fixture whose freshness
 * was verified by hand during planning, and it is small and edge-free.
 *
 * **Compares BYTES, deliberately.** Every other suite here goes through
 * `compare.ts`, whose DOM parse is blind by construction to entity form and
 * colour form (`normalize.ts`); the pre-0.2.0 staleness lived largely in
 * exactly those channels — `font-family`/`lengthAdjust` attributes, `#000000`
 * vs `#000`, 4-decimal coordinates. A guard that inherited that blindness
 * would have missed the very bug it is here to catch.
 *
 * The jar is byte-deterministic for a given input under
 * `PLANTUML_DETERMINISTIC_TEXT` (verified: two consecutive renders of the
 * sentinel are `cmp`-identical, and identical to the committed cache), so
 * byte equality is a sound assertion rather than a flaky one.
 *
 * Costs one JVM start (~1s). Runs in `npm test` rather than as a census
 * preflight so that CI executes it on every change, not only when someone
 * chooses to run the census.
 */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const JAR = join(REPO, 'oracle/dist/plantuml-oracle.jar');
const RENDER = join(REPO, 'scripts/oracle-render.sh');

/** Verified fresh by hand during object-close planning; small and edge-free. */
const SENTINEL = 'beruju-17-jigi548';
const SENTINEL_DIR = join(REPO, 'test-results/dot-cache/object', SENTINEL);

describe('oracle cache freshness (object-close D4)', () => {
  it(`${SENTINEL}'s cached in.svg is byte-identical to a fresh render of the pinned jar`, () => {
    if (!existsSync(JAR)) {
      // Same graceful degradation every oracle suite here uses: a contributor
      // without the jar is not a failing build.
      console.warn(`skipped: no oracle jar at ${JAR} — cannot check cache freshness`);
      expect(existsSync(SENTINEL_DIR)).toBe(true);
      return;
    }

    const out = mkdtempSync(join(tmpdir(), 'oracle-freshness-'));
    try {
      execFileSync(RENDER, [out, join(SENTINEL_DIR, 'in.puml')], { stdio: 'pipe' });
      const fresh = readFileSync(join(out, 'in.svg'));
      const cached = readFileSync(join(SENTINEL_DIR, 'in.svg'));
      expect(
        fresh.equals(cached),
        `test-results/dot-cache/object/${SENTINEL}/in.svg does NOT match a fresh render of `
          + `oracle/dist/plantuml-oracle.jar (fresh ${fresh.length} bytes, cached ${cached.length}). `
          + 'The committed object oracle cache is STALE: every census and survey number measured '
          + 'against it is an artifact, not a measurement. Re-capture it — see '
          + 'plans/object-close/batch-0/T1-recapture-oracle.md — rather than relaxing this check.',
      ).toBe(true);
    } finally {
      rmSync(out, { recursive: true, force: true });
    }
  });
});
