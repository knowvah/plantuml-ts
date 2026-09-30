/**
 * Shared low-level render helper for the svg-mindmap oracle harness
 * (mindmap-engine-port / T0b).
 *
 * Mirrors `render-fixture-class.ts`'s `renderClassFixture` (cdd5-T1, D3): a
 * THIN wrapper around the production `renderSync` (`src/index.ts:426`), not
 * a dedicated per-engine pipeline like `render-fixture-sequence.ts`'s
 * `renderFixtureSequence` (`parseSequence` -> `layoutSequence` ->
 * `renderSequence`). Mindmap has no registered plugin yet -- `src/index.ts`
 * registers eleven plugins (`registry.register(sequencePlugin)` through
 * `registry.register(dotPlugin)`, `:108-121`) and mindmap is absent from
 * that list -- so there is no dedicated pipeline to call directly.
 * `renderSync` is the ONLY entry point that exists today, and it is also
 * exactly what the survey itself calls
 * (`scripts/svg-parity-survey.ts:278-282`'s `renderOneMode`/`renderFrame`):
 * `renderSync(markup, { measurer, assetStore, includeStore })`. Using the
 * same thin wrapper here means this harness and the survey can never
 * diverge on anything but which measurer/asset store a caller injects --
 * same rationale `renderClassFixture`'s own doc comment gives.
 *
 * Until a mindmap plugin registers (D6/D7, `plans/mindmap-engine-port/`),
 * every call resolves through `DiagramRegistry.resolve`
 * (`src/core/dispatcher.ts:316-326`) finding zero attempts (no plugin's
 * `upstreamTypeOf` matches a mindmap block) and `resolveAllRefused`
 * (`:341-345`) falling through to `ERROR_SENTINEL` (`:252-267`): a fixed
 * 300x60 "Error: unknown diagram type" placeholder SVG. That is expected,
 * faithfully reproduced dispatcher behavior, not a harness bug --
 * `mindmap.diff-baseline.ratchet.test.ts` records it explicitly (status
 * "error") rather than pinning a weighted score against a placeholder that
 * never attempts to draw the diagram.
 */
import type { StringMeasurer } from '../../../src/core/measurer.js';
import type { AssetStore } from '../../../src/core/asset-store.js';
import type { IncludeStore } from '../../../src/core/tim/IncludeStore.js';
import { renderSync } from '../../../src/index.js';

/**
 * `renderFixtureMindmap`'s options bag -- the two `RenderOptions` fields
 * (`src/core/render-options.ts`) a fixture caller may pass, same
 * restriction `render-fixture-class.ts`'s `ClassFixtureRenderOptions`
 * applies.
 */
export interface MindmapFixtureRenderOptions {
  assetStore?: AssetStore;
  includeStore?: IncludeStore;
}

/**
 * Renders a `.puml` fixture through the PRODUCTION `renderSync` entry
 * point, with `measurer` and `options` forwarded verbatim -- see this
 * file's doc comment for why no dedicated per-engine pipeline exists to
 * call instead.
 */
export function renderFixtureMindmap(
  markup: string,
  measurer: StringMeasurer,
  options?: MindmapFixtureRenderOptions,
): string {
  return renderSync(markup, { measurer, ...options });
}
