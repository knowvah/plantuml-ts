/**
 * Shared low-level render helper for the svg-files oracle harness
 * (data-diagram-conformance / T0b, D4).
 *
 * Mirrors `render-fixture-wbs.ts`: a THIN wrapper around the production
 * `renderSync` (`src/index.ts`), the same entry point the survey calls. It
 * differs in one respect: it switches on `withJarCompatibleStyleInput`
 * (`src/core/internal-render-options.ts`). The survey renders every row in
 * jar-compatible mode (`scripts/svg-parity-survey.ts`,
 * `jarCompatibleStyleInput: true`); styling the jar's `StyleExtractor`
 * discards for files is an honoured extension measured only in extended mode,
 * so a ratchet that rendered in extended mode would measure a different style
 * input than the survey and the jar oracle.
 *
 * Two fixture roots: the CACHED corpus
 * (`test-results/dot-cache/files/<slug>/{in.puml,in.svg}`) and the AUTHORED
 * root, {@link AUTHORED_FILES_ROOT}, a FLAT committed tree of `<slug>.puml` +
 * `<slug>.svg` pairs (svg rendered by `scripts/oracle-render.sh`).
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { StringMeasurer } from '../../../src/core/measurer.js';
import type { AssetStore } from '../../../src/core/asset-store.js';
import type { IncludeStore } from '../../../src/core/tim/IncludeStore.js';
import { withJarCompatibleStyleInput } from '../../../src/core/internal-render-options.js';
import { renderSync } from '../../../src/index.js';
import { buildEmojiAssetsStore } from '../../helpers/emoji-assets-store.js';
import { fixtureIncludeStore } from '../../helpers/fixture-include-store.js';

/**
 * The Twemoji artwork the jar reads off its classpath (`Emoji.java:175-181`),
 * built once per process -- `render-fixture-gantt.ts`'s `GANTT_ASSET_STORE`.
 * Every files row draws one (`FEntry.java:124-129`: `<:1f4c2:>` / `<:1f4c4:>`
 * per entry), and the store comes only from `assetStore` (ADR-2, as json's
 * parser takes it); without it the emoticon reserves its width and draws
 * nothing, which the byte ratchet reads as a missing element (ddc b1 close,
 * journal row 22). The survey passes the same artwork through
 * `SURVEY_ASSET_STORE` (`scripts/svg-parity-survey.ts:77-80`).
 */
const FILES_ASSET_STORE: AssetStore = buildEmojiAssetsStore();

/** `renderFixtureFiles`'s options bag: the measurer plus the two stores a fixture caller may pass. */
export interface FilesFixtureRenderOptions {
  measurer: StringMeasurer;
  assetStore?: AssetStore;
  includeStore?: IncludeStore;
}

/**
 * Renders a `.puml` fixture through the PRODUCTION `renderSync` in
 * jar-compatible style-input mode (see this file's doc comment for why).
 * `assetStore` defaults to {@link FILES_ASSET_STORE}; a caller passing its
 * own store replaces it (combine with `combineAssetStores` to extend it).
 */
export function renderFixtureFiles(markup: string, options: FilesFixtureRenderOptions): string {
  return renderSync(markup, withJarCompatibleStyleInput({ assetStore: FILES_ASSET_STORE, ...options }));
}

/** The default store {@link renderFixtureFiles} renders with, for callers that must match it byte for byte. */
export function filesFixtureAssetStore(): AssetStore {
  return FILES_ASSET_STORE;
}

/** The committed, flat authored-fixture root (`<slug>.puml` + `<slug>.svg`). */
export const AUTHORED_FILES_ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../fixtures/files');

const PUML_SUFFIX = '.puml';
const SVG_SUFFIX = '.svg';

/** Every authored fixture slug: the `*.puml` basenames under {@link AUTHORED_FILES_ROOT}, sorted ([] when the root is absent). */
export function listAuthoredFilesSlugs(root: string = AUTHORED_FILES_ROOT): string[] {
  if (!existsSync(root)) return [];
  return readdirSync(root)
    .filter((f) => f.endsWith(PUML_SUFFIX))
    .map((f) => f.slice(0, -PUML_SUFFIX.length))
    .sort();
}

/** One authored fixture's source and jar oracle (`undefined` when the svg is absent). */
export interface AuthoredFilesFixture {
  readonly markup: string;
  readonly golden: string | undefined;
}

export function readAuthoredFilesFixture(slug: string, root: string = AUTHORED_FILES_ROOT): AuthoredFilesFixture {
  const svgPath = join(root, slug + SVG_SUFFIX);
  return {
    markup: readFileSync(join(root, slug + PUML_SUFFIX), 'utf8'),
    golden: existsSync(svgPath) ? readFileSync(svgPath, 'utf8') : undefined,
  };
}

/**
 * The include store for the authored root: a relative `!include` target is
 * read from the fixture's own directory, everything else falls through to the
 * shared {@link fixtureIncludeStore}.
 */
export function authoredFilesIncludeStore(root: string = AUTHORED_FILES_ROOT): IncludeStore {
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
