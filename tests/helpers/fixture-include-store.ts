/**
 * The one include seam every fixture-rendering harness goes through.
 *
 * Seven consumers share it: the svg-conformance surfaces (`render-fixture.ts`,
 * the sequence diff-baseline ratchet, `sequence-diff-census.ts`) and the
 * scripts that render fixtures for reports (`svg-conformance-census.ts`,
 * `render-manifest.ts`, `shape-match-report.ts`, `note-order-report.ts`).
 * It lives in `tests/helpers/` rather than beside any one of them precisely
 * because it belongs to none of them exclusively.
 *
 * WHY THIS MODULE EXISTS. This seam used to be copy-pasted into seven places,
 * because `render-fixture.ts`'s copy was private and each task's write-set
 * stopped at widening its exports. The copies then did what copies do:
 *
 *   - The sequence diff-baseline ratchet shipped with NO store at all, so
 *     `<tupadr3/common.puml>` and `<logos/centos>` errored there while
 *     resolving in the census. The two surfaces disagreed about the same
 *     corpus — 3 errors against 1 — and the ratchet was measuring a
 *     different population than the census it was supposed to be
 *     cross-checkable against.
 *   - The census's copy drifted EAGER while the other three were deferred,
 *     paying the `assets/stdlib/` walk on every run whether or not any
 *     fixture used a bundle include. `render-fixture.ts`'s header carried
 *     that divergence as a documented "delta 2" rather than a defect.
 *
 *   - The three report scripts drifted eager too, under their own local name
 *     `includeStore()`, so each paid the walk unconditionally.
 *
 * A measurement seam duplicated across the surfaces that are meant to
 * cross-check each other defeats the cross-check. Hence one module.
 *
 * Node `fs` is reached here (through `buildStdlibAssetsStore`) and that is
 * fine: this is test infrastructure under `tests/`, never `src/`, which must
 * stay browser-safe (CLAUDE.md). The assets store deliberately covers EVERY
 * vendored bundle rather than the published subset — see
 * `scripts/stdlib-assets-store.ts`'s header.
 */
import { buildStdlibAssetsStore } from './stdlib-assets-store.js';
import { withStdlib, type StdlibStore } from '../../src/core/tim/StdlibStore.js';
import type { IncludeStore } from '../../src/core/tim/IncludeStore.js';

/**
 * Builds an include store that resolves `<bundle/thing>` through `buildAssets`,
 * calling it at most once and **not until the first lookup**.
 *
 * The deferral is the point, not an optimisation detail: the `assets/stdlib/`
 * walk costs ~888 ms (measured 2026-07-31), the conformance suites render
 * thousands of fixtures, and almost none of them use a stdlib include — two of
 * the 1141-fixture sequence corpus do. Eager construction charges every run
 * for a resource nearly every run never touches.
 *
 * `buildAssets` is a parameter so a test can pin both properties — deferred,
 * and built at most once — without mocking the module graph.
 */
export function createFixtureIncludeStore(buildAssets: () => StdlibStore): IncludeStore {
  let assets: StdlibStore | undefined;
  return withStdlib(
    { get: () => undefined, has: () => false },
    {
      getPumlResource: (fullname: string): string | undefined => {
        assets ??= buildAssets();
        return assets.getPumlResource(fullname);
      },
    },
  );
}

let cachedIncludeStore: IncludeStore | undefined;

/**
 * The fixture include store, built at most once per process.
 *
 * Every svg-conformance surface must render through THIS function. A surface
 * that renders without it measures a different population than its siblings,
 * which is the defect this module was extracted to make unrepeatable.
 */
export function fixtureIncludeStore(): IncludeStore {
  cachedIncludeStore ??= createFixtureIncludeStore(buildStdlibAssetsStore);
  return cachedIncludeStore;
}
