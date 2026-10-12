/**
 * Shared low-level render helper for the svg-salt oracle harness
 * (salt-engine-port / T0b, D6).
 *
 * Mirrors `render-fixture-mindmap.ts`'s `renderFixtureMindmap`
 * (mindmap-engine-port/T0b): a THIN wrapper around the production
 * `renderSync` (`src/index.ts:422`), not a dedicated per-engine pipeline
 * like `render-fixture-sequence.ts`'s `renderFixtureSequence`: `renderSync` is the
 * entry point the salt plugin is reached through, and it is also
 * exactly what the survey itself calls (`scripts/svg-parity-survey.ts:273-
 * 278` in `renderOneMode`, `:299-304` in `renderFrame`):
 * `renderSync(markup, { measurer, assetStore, includeStore, elk })`. The
 * survey's fourth field, `elk`, is not forwarded here: no salt fixture sets
 * `!pragma layout elk`, and the T0b contract carries only the two store
 * fields. Using the same thin wrapper means this harness and the survey can
 * never diverge on anything but which measurer/asset store a caller
 * injects.
 *
 * The salt plugin registers since sep T4a (`src/index.ts`,
 * `registry.register(saltPlugin)`), so every fixture now renders a real salt
 * diagram (or our error page where `PSystemSalt#createElement` refuses).
 *
 * TWO fixture roots (sep T5-cov):
 *   - the CACHED corpus, `test-results/dot-cache/salt/<slug>/{in.puml,in.svg}`
 *     (the 51 rows `~/git/pdiff` holds; `diff-baseline.json` + `ratchet.json`);
 *   - the AUTHORED root, {@link AUTHORED_SALT_ROOT}, a FLAT committed tree of
 *     `<slug>.puml` + `<slug>.svg` pairs (the svg rendered by
 *     `scripts/oracle-render.sh`, which writes `<out-dir>/<name>.svg`), tracked
 *     by `authored-baseline.json`. A non-`.puml` file there (an `!include`
 *     target such as `cov-include-fragment.iuml`) is never a fixture.
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
 * `renderFixtureSalt`'s options bag -- the two `RenderOptions` fields
 * (`src/core/render-options.ts`) a fixture caller may pass, same
 * restriction `render-fixture-mindmap.ts`'s `MindmapFixtureRenderOptions`
 * applies.
 */
export interface SaltFixtureRenderOptions {
  assetStore?: AssetStore;
  includeStore?: IncludeStore;
}

/**
 * Renders a `.puml` fixture through the PRODUCTION `renderSync` entry
 * point, with `measurer` and `options` forwarded verbatim -- see this
 * file's doc comment for why no dedicated per-engine pipeline exists to
 * call instead.
 */
export function renderFixtureSalt(
  markup: string,
  measurer: StringMeasurer,
  options?: SaltFixtureRenderOptions,
): string {
  return renderSync(markup, { measurer, ...options });
}

/** The committed, flat authored-fixture root (`<slug>.puml` + `<slug>.svg`). */
export const AUTHORED_SALT_ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../fixtures/salt');

const PUML_SUFFIX = '.puml';
const SVG_SUFFIX = '.svg';

/** Every authored fixture slug: the `*.puml` basenames under {@link AUTHORED_SALT_ROOT}, sorted. */
export function listAuthoredSaltSlugs(root: string = AUTHORED_SALT_ROOT): string[] {
  return readdirSync(root)
    .filter((f) => f.endsWith(PUML_SUFFIX))
    .map((f) => f.slice(0, -PUML_SUFFIX.length))
    .sort();
}

/** One authored fixture's source and jar oracle (`undefined` when the svg is absent). */
export interface AuthoredSaltFixture {
  readonly markup: string;
  readonly golden: string | undefined;
}

export function readAuthoredSaltFixture(slug: string, root: string = AUTHORED_SALT_ROOT): AuthoredSaltFixture {
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
 * (the `<bundle/thing>` stdlib form the cached rows use) falls through to
 * the shared {@link fixtureIncludeStore}, so both roots resolve stdlib
 * includes through the one seam.
 */
export function authoredSaltIncludeStore(root: string = AUTHORED_SALT_ROOT): IncludeStore {
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
