/**
 * Shared low-level render helper for the svg-wbs oracle harness
 * (wbs-engine-port / T0b, D7).
 *
 * Copies `render-fixture-salt.ts`'s `renderFixtureSalt`: a THIN wrapper around
 * the production `renderSync` (`src/index.ts`), not a dedicated per-engine
 * pipeline. `renderSync` is the entry point the wbs plugin will be reached
 * through, and it is exactly what the survey itself calls
 * (`scripts/svg-parity-survey.ts` `renderOneMode` / `renderFrame`:
 * `renderSync(markup, { measurer, assetStore, includeStore, elk })`). The
 * survey's fourth field, `elk`, is not forwarded: no wbs fixture sets
 * `!pragma layout elk`, and the T0b contract carries only the two store
 * fields. Using the same thin wrapper means this harness and the survey can
 * never diverge on anything but which measurer/asset store a caller injects.
 *
 * The wbs plugin registers since wep T4a (`src/index.ts`,
 * `registry.register(wbsPlugin)`), so every fixture renders a real wbs diagram
 * (or our error page where the wbs commands refuse, D8).
 *
 * TWO fixture roots (wep T5-cov, copied from `render-fixture-salt.ts`):
 *   - the CACHED corpus, `test-results/dot-cache/wbs/<slug>/{in.puml,in.svg}`
 *     (the 204 rows; `diff-baseline.json` + `ratchet.json`);
 *   - the AUTHORED root, {@link AUTHORED_WBS_ROOT}, a FLAT committed tree of
 *     `<slug>.puml` + `<slug>.svg` pairs (the svg rendered by
 *     `scripts/oracle-render.sh`, which writes `<out-dir>/<name>.svg`), tracked
 *     by `authored-baseline.json`. A non-`.puml` file there (an `!include`
 *     target) is never a fixture.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { StringMeasurer } from '../../../src/core/measurer.js';
import type { AssetStore } from '../../../src/core/asset-store.js';
import type { IncludeStore } from '../../../src/core/tim/IncludeStore.js';
import { renderSync } from '../../../src/index.js';
import { fixtureIncludeStore } from '../../helpers/fixture-include-store.js';

/**
 * `renderFixtureWbs`'s options bag -- the two `RenderOptions` fields
 * (`src/core/render-options.ts`) a fixture caller may pass, same restriction
 * `render-fixture-salt.ts`'s `SaltFixtureRenderOptions` applies.
 */
export interface WbsFixtureRenderOptions {
  assetStore?: AssetStore;
  includeStore?: IncludeStore;
}

/**
 * Renders a `.puml` fixture through the PRODUCTION `renderSync` entry point,
 * with `measurer` and `options` forwarded verbatim -- see this file's doc
 * comment for why no dedicated per-engine pipeline exists to call instead.
 */
export function renderFixtureWbs(markup: string, measurer: StringMeasurer, options?: WbsFixtureRenderOptions): string {
  return renderSync(markup, { measurer, ...options });
}

/** The committed, flat authored-fixture root (`<slug>.puml` + `<slug>.svg`). */
export const AUTHORED_WBS_ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../fixtures/wbs');

const PUML_SUFFIX = '.puml';
const SVG_SUFFIX = '.svg';

/** Every authored fixture slug: the `*.puml` basenames under {@link AUTHORED_WBS_ROOT}, sorted. */
export function listAuthoredWbsSlugs(root: string = AUTHORED_WBS_ROOT): string[] {
  return readdirSync(root)
    .filter((f) => f.endsWith(PUML_SUFFIX))
    .map((f) => f.slice(0, -PUML_SUFFIX.length))
    .sort();
}

/** One authored fixture's source and jar oracle (`undefined` when the svg is absent). */
export interface AuthoredWbsFixture {
  readonly markup: string;
  readonly golden: string | undefined;
}

export function readAuthoredWbsFixture(slug: string, root: string = AUTHORED_WBS_ROOT): AuthoredWbsFixture {
  const svgPath = join(root, slug + SVG_SUFFIX);
  return {
    markup: readFileSync(join(root, slug + PUML_SUFFIX), 'utf8'),
    golden: existsSync(svgPath) ? readFileSync(svgPath, 'utf8') : undefined,
  };
}

/**
 * The include store for the authored root: a relative `!include` target is
 * read from the fixture's own directory -- where the jar resolves it, since
 * `oracle-render.sh` hands it the fixture's path -- and everything else
 * (the `<bundle/thing>` stdlib form) falls through to the shared
 * {@link fixtureIncludeStore}, so both roots resolve stdlib includes through
 * the one seam (`render-fixture-salt.ts#authoredSaltIncludeStore`).
 */
export function authoredWbsIncludeStore(root: string = AUTHORED_WBS_ROOT): IncludeStore {
  const shared = fixtureIncludeStore();
  const local = (path: string): string | undefined => {
    const file = join(root, path);
    return existsSync(file) ? readFileSync(file, 'utf8') : undefined;
  };
  return {
    get: (path: string): string | undefined => local(path) ?? shared.get(path),
    has: (path: string): boolean => local(path) !== undefined || shared.has(path),
    getPumlResource: (fullname: string): string | undefined => shared.getPumlResource?.(fullname),
  };
}
