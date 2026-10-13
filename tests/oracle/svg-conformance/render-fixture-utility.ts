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
 */
import { readFileSync } from 'node:fs';

import type { AssetStore } from '../../../src/core/asset-store.js';
import type { StringMeasurer } from '../../../src/core/measurer.js';
import type { IncludeStore } from '../../../src/core/tim/IncludeStore.js';
import { fullDescription } from '../../../src/core/version.js';
import { renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { fixtureIncludeStore } from '../../helpers/fixture-include-store.js';
import { compareSvg, weightedScore } from './compare.js';

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
    const ours = renderFixtureUtility(markup, new DeterministicMeasurer(), { includeStore: fixtureIncludeStore() });
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
