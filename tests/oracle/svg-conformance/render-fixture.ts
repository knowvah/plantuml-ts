/**
 * Shared render helper for svg-description conformance tests (T18; re-routed
 * by codd T1a / D4 so the ratchet measures what the survey measures).
 *
 * Renders a fixture through `renderSync` -- the SAME production call
 * `scripts/svg-parity-survey.ts` (`renderOneMode`/`renderFrame`) makes -- with
 * ONE injected measurer (`options.measurer` reaches both the layout and the
 * render stage), the survey's combined sprite/emoji/utility asset store and
 * the vendored-stdlib include store. It used to call
 * `parseDescription -> layoutDescription -> renderDescription` directly,
 * which bypassed the router and the plugin's chrome composition and so
 * disagreed with the survey on 22 of 266 component rows: chrome (title x
 * 43.269 vs the jar's 40.269, `src/diagrams/description/index.ts`,
 * `src/index.ts:151-195`), routing (kokebo/gutute are jar CLASS), the missing
 * asset store, and the seed source (`seedSourceLines`).
 *
 * An error page (`renderSync` swallows throws into a `PSystemError` SVG) is
 * re-thrown here, so a fixture that cannot render still reads as an error
 * rather than as a numeric diff against the jar's error page; callers
 * (ratchets, `pin-description.mts`) rely on that.
 */
import { renderSync } from '../../../src/index.js';
import { setErrorPageObserver } from '../../../src/core/error/error-renderer.js';
import { combineAssetStores } from '../../../src/core/asset-store.js';
import type { StringMeasurer } from '../../../src/core/measurer.js';
import { buildSpriteAssetsStore } from '../../../scripts/sprite-assets-store.js';
import { buildEmojiAssetsStore } from '../../../scripts/emoji-assets-store.js';
import { buildUtilityAssetsStore } from '../../../scripts/utility-assets-store.js';
import { fixtureIncludeStore } from '../../helpers/fixture-include-store.js';

// Same combined store as the survey (`SURVEY_ASSET_STORE`); one reference so
// the asset-store identity contract holds across calls.
const FIXTURE_ASSET_STORE = combineAssetStores(
  buildSpriteAssetsStore(),
  buildEmojiAssetsStore(),
  buildUtilityAssetsStore(),
);

/** Renders `markup` exactly as the survey does, with `measurer` injected.
 *  An error page is returned as the SVG it is, with `errorPage: true`. */
export function renderFixtureSurveyStyle(
  markup: string,
  measurer: StringMeasurer,
): { readonly svg: string; readonly errorPage: boolean } {
  let errorPage = false;
  setErrorPageObserver(() => {
    errorPage = true;
  });
  try {
    const svg = renderSync(markup, {
      measurer,
      assetStore: FIXTURE_ASSET_STORE,
      includeStore: fixtureIncludeStore(),
    });
    return { svg, errorPage };
  } finally {
    setErrorPageObserver(undefined);
  }
}

/** {@link renderFixtureSurveyStyle}, throwing when the render drew an error page. */
export function renderFixture(markup: string, measurer: StringMeasurer): string {
  const { svg, errorPage } = renderFixtureSurveyStyle(markup, measurer);
  if (errorPage) throw new Error('renderSync drew an error page');
  return svg;
}
