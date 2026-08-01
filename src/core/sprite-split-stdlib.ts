/**
 * si11b T4 -- per-sprite stdlib bundle registration, and the prefetch-side
 * assembly it enables.
 *
 * T1 (`scripts/split-sprite-bundle/split.ts`) derives one fragment per sprite
 * under `packages/<pkg>/assets/<bundle>/sprites/<name>.puml` plus a sorted
 * name-list manifest (ADR-3). This module is what makes a bundle build that
 * way FETCHABLE: it expands the name list into an ordinary
 * {@link StdlibRemoteManifest} (`sprites/<name>.puml` per name, ADR-3's
 * convention) and hands it to `remoteStdlib` (si11a) unchanged -- no second
 * cache, no second concurrency primitive, exactly `remoteStdlib`'s existing
 * per-key promise memoization.
 *
 * A bundle registered this way carries an EXPLICIT marker
 * ({@link spriteSplitNamesOf}) so `stdlib-content.ts#stdlibContentFor` can tell "this
 * `<bundle/thing>` target is sprite-split" from "this is an ordinary
 * per-resource remote bundle that happens to resolve `files: {}`" -- both
 * shapes exist and are NOT distinguishable by emptiness alone (`RemoteBundle
 * #asBundleData` always reports `files: {}}`; see its doc comment). Detection
 * never depends on which key was requested or on a lookup miss.
 *
 * REGISTRATION RECIPE -- how a consumer opts a bundle into per-sprite loading:
 *
 *   // Both come from the package root: `package.json`'s "exports" map has a
 *   // single "." entry, so `src/index.ts` is the ONLY surface a consumer of
 *   // the built library can import from -- a deep path into `core/` is not
 *   // reachable, however tidy it looks.
 *   import { spriteSplitStdlib, stdlibRegistry } from 'plantuml-ts';
 *   import manifest from './bootstrap1.13.1/sprites.json' with { type: 'json' };
 *
 *   const registry = stdlibRegistry({
 *     'bootstrap1.13.1': () =>
 *       Promise.resolve(
 *         spriteSplitStdlib({
 *           manifest, // { name: 'bootstrap1.13.1', sprites: [...] }
 *           baseUrl: 'https://cdn.example.com/bootstrap1.13.1',
 *         }),
 *       ),
 *   });
 *
 * A registrant that ALSO needs the `bootstrap` -> `bootstrap1.13.1` alias
 * registers it the ordinary way (an eager `BundleData` stub with `aliasOf`,
 * or another `remoteStdlib`/`spriteSplitStdlib` thunk under the `bootstrap`
 * key) -- alias resolution is unchanged (`stdlib-content.ts#bundlesFor`).
 *
 * Once registered, `!include <bootstrap/bootstrap>` no longer fetches the
 * 1,085,342 B source file: the prefetch walk scans the diagram for `<$name>`
 * references (`sprite-prefetch.ts#scanSpriteNames`), unions them with
 * `RenderOptions.sprites` (ADR-5b, threaded through the walk as a
 * `PrefetchWalk`-constant, exactly like `registry` -- see
 * `include-resolver.ts#PrefetchWalk`), and fetches only those fragments.
 *
 * The alias walk and the resource/sprite dispatch that consumes the marker
 * live in `stdlib-content.ts`, which is where the prefetch walk calls in.
 * They passed through this module briefly (si11b T4 parked them here for
 * `include-resolver.ts`'s 500-line cap) but they are not sprite-specific.
 *
 * @see ./stdlib-content.ts -- `stdlibContentFor`, the caller of everything here
 * @see ./sprite-prefetch.ts -- the `<$name>` scan this reuses (ADR-4)
 * @see ./tim/StdlibRemote.ts -- `remoteStdlib`, `StdlibRemoteManifest`, `RemoteBundle`
 * @see ./tim/StdlibRegistry.ts -- `StdlibRegistry`, `resolveResource`
 * @see ./include-resolver.ts -- the prefetch walk this wires into
 */

import type { IncludeFetcher } from './include-resolver.js';
import { scanSpriteNames } from './sprite-prefetch.js';
import { remoteStdlib, type RemoteBundle, type StdlibRemoteManifest } from './tim/StdlibRemote.js';
import type { BundleData } from './tim/StdlibStore.js';
import type { StdlibRegistry } from './tim/StdlibRegistry.js';

/**
 * T1's manifest shape (`scripts/split-sprite-bundle/split.ts#SpriteSplitManifest`),
 * re-declared here because `src/` may not import from `scripts/` (CLAUDE.md).
 * Both describe the exact same JSON emitted to `sprites.json`.
 */
export interface SpriteSplitManifest {
  /** `BundleData.name` / vendored folder name, e.g. `'bootstrap1.13.1'`. */
  readonly name: string;
  /** Sorted, lowercase sprite names. Fragment path is `sprites/<name>.puml`
   *  by convention (ADR-3) -- not carried here. */
  readonly sprites: readonly string[];
}

/**
 * Thrown when a `<$name>` reference (or a `RenderOptions.sprites` entry) names
 * a sprite that is NOT part of the bundle's manifest (ADR-5a). Distinct from a
 * network failure (`StdlibResourceFetchError`): this is a bad reference, and
 * no request is ever made for it -- fetching stops before any fragment for the
 * OFFENDING name (or any name sorted after it) is requested.
 */
export class SpriteNotBundledError extends Error {
  /** The bundle the sprite was expected to come from. */
  readonly bundle: string;
  /** The unresolvable sprite name, as scanned/supplied (lowercased). */
  readonly sprite: string;

  constructor(bundle: string, sprite: string) {
    super(
      `Sprite '${sprite}' is not part of the '${bundle}' stdlib bundle's sprite-split ` +
        `manifest.\nCheck the spelling, or pass 'RenderOptions.sprites' with the exact name ` +
        `if a macro produces it (ADR-5b) -- but a name absent from the manifest itself is a ` +
        `typo or an out-of-date bundle version, not a scan limitation.`,
    );
    this.name = 'SpriteNotBundledError';
    this.bundle = bundle;
    this.sprite = sprite;
  }
}

/** Unique property key marking a {@link BundleData} as sprite-split. Never
 *  serialized, never collides with a real bundle field. */
const SPRITE_SPLIT_NAMES = Symbol('plantuml-ts:sprite-split-names');

interface SpriteSplitBundleData extends BundleData {
  readonly [SPRITE_SPLIT_NAMES]: readonly string[];
}

function markSpriteSplit(data: BundleData, sprites: readonly string[]): BundleData {
  return { ...data, [SPRITE_SPLIT_NAMES]: sprites } as SpriteSplitBundleData;
}

/**
 * The sprite name list on `data`, IF it was produced by
 * {@link spriteSplitStdlib}'s `asBundleData()` -- `undefined` for an ordinary
 * bundle. This is the EXPLICIT marker `stdlib-content.ts` checks:
 * detection never infers sprite-split-ness from an empty `files` map, which
 * an ordinary remote bundle's `asBundleData()` also reports.
 */
export function spriteSplitNamesOf(data: BundleData): readonly string[] | undefined {
  return (data as Partial<SpriteSplitBundleData>)[SPRITE_SPLIT_NAMES];
}

/**
 * Build a {@link RemoteBundle} from a {@link SpriteSplitManifest} -- the
 * registration recipe in this module's doc comment. Internally expands the
 * name list into a `sprites/<name>.puml`-per-name {@link StdlibRemoteManifest}
 * (ADR-3's convention) and delegates fetching/caching to `remoteStdlib`
 * (si11a) entirely -- this function adds no cache and no concurrency
 * primitive of its own, only the marker `asBundleData()` carries.
 */
export function spriteSplitStdlib(options: {
  readonly manifest: SpriteSplitManifest;
  readonly baseUrl: string;
  readonly fetcher?: IncludeFetcher | undefined;
}): RemoteBundle {
  const { manifest, baseUrl, fetcher } = options;

  const files: Record<string, string> = {};
  for (const name of manifest.sprites) files[name] = `sprites/${name}.puml`;
  const expanded: StdlibRemoteManifest = { name: manifest.name, files };

  const base = remoteStdlib({ manifest: expanded, baseUrl, fetcher });
  return {
    ...base,
    asBundleData: (): BundleData => markSpriteSplit(base.asBundleData(), manifest.sprites),
  };
}

/**
 * The names one prefetch-walk level must fetch from a sprite-split bundle:
 * `source`'s `<$name>` scan (ADR-4) unioned with `extraSpriteNames` -- the
 * WALK-GLOBAL `RenderOptions.sprites` escape hatch (ADR-5b), lowercased and
 * applied at EVERY recursion level, not just the top one. A sprite-split
 * `!include` reached through a diagram author's own shared header (a nested
 * fetched include, not the top-level source) must see the same option-named
 * sprites the top level does, or ADR-5a's "never a silently missing icon"
 * guarantee breaks inside the very escape hatch meant to prevent it.
 */
function referencedSpriteNames(source: string, extraSpriteNames: readonly string[] | undefined): readonly string[] {
  const referenced = new Set<string>(scanSpriteNames(source));
  for (const name of extraSpriteNames ?? []) referenced.add(name.toLowerCase());
  return [...referenced].sort();
}

/**
 * Fetch and assemble ONLY the sprites `source`/`extraSpriteNames` reference,
 * in sorted name order (ADR-4/ADR-5b/criterion 5). Sorting BEFORE any fetch
 * starts is what makes the payload independent of fetch completion order
 * (`Promise.all` preserves input-array position regardless of settle order).
 * Reuses `registry.resolveResource` -- the SAME per-key promise memoization
 * `remoteStdlib` already provides -- so two overlapping prefetch levels
 * naming the same sprite still issue one request.
 *
 * @throws SpriteNotBundledError a referenced name is not in `manifestNames`.
 *         Validated BEFORE any fragment is fetched (criterion 3): a bad name
 *         costs zero network requests, for itself or for its siblings.
 */
export async function assembleSpriteSplitContent(
  registry: StdlibRegistry,
  bundleName: string,
  manifestNames: readonly string[],
  source: string,
  extraSpriteNames: readonly string[] | undefined,
): Promise<string> {
  const manifestSet = new Set(manifestNames);
  const sortedNames = referencedSpriteNames(source, extraSpriteNames);

  for (const name of sortedNames) {
    if (!manifestSet.has(name)) throw new SpriteNotBundledError(bundleName, name);
  }

  const fragments = await Promise.all(
    sortedNames.map((name) => registry.resolveResource(bundleName, name)),
  );
  // Cannot be `undefined`: every `name` above was just checked against
  // `manifestSet`, which mirrors the exact keys `spriteSplitStdlib` used to
  // build the `RemoteBundle`'s `files` map.
  return fragments.map((fragment) => fragment!).join('');
}
