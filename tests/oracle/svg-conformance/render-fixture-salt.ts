/**
 * Shared low-level render helper for the svg-salt oracle harness
 * (salt-engine-port / T0b, D6).
 *
 * Mirrors `render-fixture-mindmap.ts`'s `renderFixtureMindmap`
 * (mindmap-engine-port/T0b): a THIN wrapper around the production
 * `renderSync` (`src/index.ts:422`), not a dedicated per-engine pipeline
 * like `render-fixture-sequence.ts`'s `renderFixtureSequence`. Salt has no
 * registered plugin yet -- `src/index.ts` registers fifteen plugins
 * (`registry.register(sequencePlugin)` through
 * `registry.register(mindmapPlugin)`, `:111-125`) and salt is absent from
 * that list -- so there is no dedicated pipeline to call directly.
 * `renderSync` is the ONLY entry point that exists today, and it is also
 * exactly what the survey itself calls (`scripts/svg-parity-survey.ts:273-
 * 278` in `renderOneMode`, `:299-304` in `renderFrame`):
 * `renderSync(markup, { measurer, assetStore, includeStore, elk })`. The
 * survey's fourth field, `elk`, is not forwarded here: no salt fixture sets
 * `!pragma layout elk`, and the T0b contract carries only the two store
 * fields. Using the same thin wrapper means this harness and the survey can
 * never diverge on anything but which measurer/asset store a caller
 * injects.
 *
 * Until a salt plugin registers (`plans/salt-engine-port/`), every call
 * resolves through `DiagramRegistry.resolve` (`src/core/dispatcher.ts:431-
 * 441`) finding zero attempts (no plugin's `upstreamTypeOf` matches a salt
 * block) and `resolveAllRefused` (`:482-487`, the `attempts.length === 0`
 * branch at `:483`) falling through to `ERROR_SENTINEL` (`:361-375`): a
 * fixed 300x60 "Error: unknown diagram type" placeholder SVG. That is
 * expected, faithfully reproduced dispatcher behavior, not a harness bug --
 * `salt.diff-baseline.ratchet.test.ts` records it explicitly (status
 * "error") rather than pinning a weighted score against a placeholder that
 * never attempts to draw the diagram.
 */
import type { StringMeasurer } from '../../../src/core/measurer.js';
import type { AssetStore } from '../../../src/core/asset-store.js';
import type { IncludeStore } from '../../../src/core/tim/IncludeStore.js';
import { renderSync } from '../../../src/index.js';

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
