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
 * No wbs plugin is registered yet (it lands in the wbs-engine-port batches), so
 * every fixture renders `ERROR_SENTINEL` (`src/core/dispatcher.ts`) today.
 */
import type { StringMeasurer } from '../../../src/core/measurer.js';
import type { AssetStore } from '../../../src/core/asset-store.js';
import type { IncludeStore } from '../../../src/core/tim/IncludeStore.js';
import { renderSync } from '../../../src/index.js';

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
