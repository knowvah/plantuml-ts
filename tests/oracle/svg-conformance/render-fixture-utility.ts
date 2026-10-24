/**
 * Shared low-level render helper for the svg-utility oracle harness
 * (utility-factories-port / T0b, D9).
 *
 * Copies `render-fixture-wbs.ts`'s `renderFixtureWbs`: a THIN wrapper around
 * the production `renderSync` (`src/index.ts`), exactly what the survey calls
 * (`scripts/svg-parity-survey.ts`), so this harness and the survey diverge
 * only in which measurer/stores a caller injects.
 *
 * The population is a FIXED list of 17 cached `unknown` rows
 * ({@link UTILITY_SLUGS}), not a whole cache dir: the "utility" factories
 * (`PSystemBuilder.java:134-200` single-line easter eggs, listings and the
 * version family) have no cache tree of their own -- the unknown bucket holds
 * them. Every tool and gate in this family reads and writes only these rows.
 *
 * A SECOND, authored root (T3-cov, D10; copied from `render-fixture-wbs.ts`'s
 * wep T5-cov additions): {@link AUTHORED_UTILITY_ROOT}, a FLAT committed tree
 * of `<slug>.puml` + `<slug>.svg` pairs (the svg rendered by
 * `scripts/oracle-render.sh`), tracked by `authored-baseline.json`, never by
 * `diff-baseline.json`/`ratchet.json`.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { combineAssetStores, type AssetStore } from '../../../src/core/asset-store.js';
import type { StringMeasurer } from '../../../src/core/measurer.js';
import type { IncludeStore } from '../../../src/core/tim/IncludeStore.js';
import { fullDescription } from '../../../src/core/version.js';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { buildEmojiAssetsStore } from '../../helpers/emoji-assets-store.js';
import { fixtureIncludeStore } from '../../helpers/fixture-include-store.js';
import { buildSpriteAssetsStore } from '../../helpers/sprite-assets-store.js';
import { buildUtilityAssetsStore } from '../../helpers/utility-assets-store.js';
import { compareSvg, weightedScore } from './compare.js';
import { remoteImageFixtureStore } from './remote-image-fixtures.js';

/**
 * The 17 in-scope `test-results/dot-cache/unknown/<slug>` rows, in the order
 * of `plans/utility-factories-port/fixtures.md` (factory, then slug).
 */
export const UTILITY_SLUGS: readonly string[] = [
  'fotete-48-viga126', // ListOpenIconic   (PSystemBuilder.java:151)
  'bamudi-49-caxo996', // OpenIconic       (PSystemBuilder.java:150)
  'jigemu-90-titu666', // Colors           (PSystemBuilder.java:134)
  'kenari-17-dajo806', // Colors
  'vedine-65-rafo449', // ListEmoji        (PSystemBuilder.java:149)
  'tukimi-92-noxu802',
  'rubeku-92-vefi942',
  'zusibo-75-vate603',
  'tomodo-34-bimi231',
  'ludecu-61-laja912',
  'xozane-18-becu956',
  'xucoma-93-jeko861', // ListArchimateSprites (PSystemBuilder.java:152)
  'lazama-75-loli189', // Sudoku           (PSystemBuilder.java:163)
  'gazale-13-tadu312',
  'govuca-53-mili511', // Version (stdlib) (PSystemBuilder.java:144-147)
  'kicizi-84-lexu138', // Charlie          (PSystemBuilder.java:181)
  'kavama-92-noro949', // Dedication       (PSystemBuilder.java:186)
];

/** The cache type directory every utility row sits in. */
export const UTILITY_CACHE_TYPE = 'unknown';

/** `renderFixtureUtility`'s options bag -- the two `RenderOptions` fields a fixture caller may pass. */
export interface UtilityFixtureRenderOptions {
  assetStore?: AssetStore;
  includeStore?: IncludeStore;
}

/**
 * The store the survey renders with (`scripts/svg-parity-survey.ts` `SURVEY_ASSET_STORE`):
 * sprites + emoji + the utility pictures (T1i) + the golden-decoded remote image
 * bytes (sdd3-b6 T6g, `remote-image-fixtures.ts`), so a utility or sequence row
 * measures here as it surveys. Keep this in step with the survey's own store.
 */
export function surveyAssetStore(): AssetStore {
  return combineAssetStores(
    buildSpriteAssetsStore(),
    buildEmojiAssetsStore(),
    buildUtilityAssetsStore(),
    remoteImageFixtureStore(),
  );
}

/**
 * Renders a `.puml` fixture through the PRODUCTION `renderSync` entry point,
 * `measurer` and `options` forwarded verbatim.
 */
export function renderFixtureUtility(
  markup: string,
  measurer: StringMeasurer,
  options?: UtilityFixtureRenderOptions,
): string {
  return renderSync(markup, { measurer, ...options });
}

/** `ERROR_SENTINEL`'s fixed marker text (`src/core/dispatcher.ts:369`). */
export const ERROR_SENTINEL_MARKER = 'Error: unknown diagram type';

/** Why a sentinel render is recorded as `error` (dispatcher.ts:361-375). */
export const SENTINEL_REASON =
  'renders ERROR_SENTINEL (dispatcher.ts:361-375) -- no plugin registers this utility factory';

/** Why a PSystemError-banner render is recorded as `error`. */
export const ERROR_PAGE_REASON =
  "renders this port's PSystemError banner page (dispatcher refusal) -- no plugin registers this utility factory";

export type UtilityMeasure =
  | { readonly errored: false; readonly weightedScore: number; readonly diffCount: number }
  | { readonly errored: true; readonly reason: string };

/**
 * Renders `markup` with `DeterministicMeasurer` and compares to the jar `golden`.
 * Three distinct error conditions feed `errored: true`: a thrown exception, the
 * dispatcher sentinel, and our own error banner -- comparing either placeholder
 * against a real jar render would pin a baseline over unrelated geometry.
 */
export function measureUtilityMarkup(markup: string, golden: string): UtilityMeasure {
  try {
    const ours = renderFixtureUtility(markup, new DeterministicMeasurer(), {
      assetStore: surveyAssetStore(),
      includeStore: fixtureIncludeStore(),
    });
    if (ours.includes(ERROR_SENTINEL_MARKER)) return { errored: true, reason: SENTINEL_REASON };
    if (ours.includes(`>${fullDescription()}</text>`)) return { errored: true, reason: ERROR_PAGE_REASON };
    const { diffs } = compareSvg(ours, golden, 'deterministic');
    return { errored: false, weightedScore: weightedScore(diffs), diffCount: diffs.length };
  } catch (err) {
    return { errored: true, reason: err instanceof Error ? err.message : String(err) };
  }
}

/** Measures one cached row: `<cacheRoot>/unknown/<slug>/{in.puml,in.svg}`. */
export function measureUtilitySlug(cacheRoot: string, slug: string): UtilityMeasure {
  const dir = `${cacheRoot}/${UTILITY_CACHE_TYPE}/${slug}`;
  return measureUtilityMarkup(readFileSync(`${dir}/in.puml`, 'utf8'), readFileSync(`${dir}/in.svg`, 'utf8'));
}

/** The committed, flat authored-fixture root (`<slug>.puml` + `<slug>.svg`). */
export const AUTHORED_UTILITY_ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../fixtures/utility');

const PUML_SUFFIX = '.puml';
const SVG_SUFFIX = '.svg';

/** Every authored fixture slug: the `*.puml` basenames under {@link AUTHORED_UTILITY_ROOT}, sorted. */
export function listAuthoredUtilitySlugs(root: string = AUTHORED_UTILITY_ROOT): string[] {
  return readdirSync(root)
    .filter((f) => f.endsWith(PUML_SUFFIX))
    .map((f) => f.slice(0, -PUML_SUFFIX.length))
    .sort();
}

/** One authored fixture's source and jar oracle (`undefined` when the svg is absent). */
export interface AuthoredUtilityFixture {
  readonly markup: string;
  readonly golden: string | undefined;
}

export function readAuthoredUtilityFixture(slug: string, root: string = AUTHORED_UTILITY_ROOT): AuthoredUtilityFixture {
  const svgPath = join(root, slug + SVG_SUFFIX);
  return {
    markup: readFileSync(join(root, slug + PUML_SUFFIX), 'utf8'),
    golden: existsSync(svgPath) ? readFileSync(svgPath, 'utf8') : undefined,
  };
}

/** Renders an authored fixture exactly as {@link measureUtilityMarkup} does (survey asset store, delta 3). */
export function renderAuthoredUtility(markup: string): string {
  return renderFixtureUtility(markup, new DeterministicMeasurer(), {
    assetStore: surveyAssetStore(),
    includeStore: fixtureIncludeStore(),
  });
}

/** True when `ours` is this port's error banner page or the dispatcher sentinel. */
export function isOurErrorPage(ours: string): boolean {
  return ours.includes(ERROR_SENTINEL_MARKER) || ours.includes(`>${fullDescription()}</text>`);
}

export type AuthoredUtilityMeasure =
  | {
      readonly errored: false;
      readonly weightedScore: number;
      readonly diffCount: number;
      readonly structural: number;
      readonly weErrored: boolean;
    }
  | { readonly errored: true; readonly reason: string };

/**
 * Measures one authored row against the jar oracle beside it. Unlike
 * {@link measureUtilityMarkup}, an error page on our side is still COMPARED
 * (wep T5-cov's shape): the 2026-10-10 rule makes "jar errors + we error"
 * conformant, so an authored error row is gated on its residual, and
 * `weErrored` feeds the error-parity test.
 */
export function measureAuthoredUtility(slug: string, root: string = AUTHORED_UTILITY_ROOT): AuthoredUtilityMeasure {
  const { markup, golden } = readAuthoredUtilityFixture(slug, root);
  if (golden === undefined) return { errored: true, reason: `${slug}.svg is missing` };
  try {
    const ours = renderAuthoredUtility(markup);
    const { diffs } = compareSvg(ours, golden, 'deterministic');
    const structural = diffs.filter((d) => d.delta === undefined).length;
    return {
      errored: false,
      weightedScore: weightedScore(diffs),
      diffCount: diffs.length,
      structural,
      weErrored: isOurErrorPage(ours),
    };
  } catch (err) {
    return { errored: true, reason: err instanceof Error ? err.message : String(err) };
  }
}
