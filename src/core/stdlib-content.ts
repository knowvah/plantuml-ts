/**
 * Resolving a `<bundle/thing>` include target to its CONTENT, for the prefetch
 * walk's third channel (`include-resolver.ts#prefetchInner`).
 *
 * Two steps, both here:
 *   1. Walk the alias chain to its terminus ({@link bundlesFor}) --
 *      `awslib` -> `awslib14`, `bootstrap` -> `bootstrap1.13.1`.
 *   2. Ask the terminus for the content, by whichever granularity it was
 *      registered at: per-RESOURCE (si11a, `registry.resolveResource`) or
 *      per-SPRITE (si11b, `sprite-split-stdlib.ts#assembleSpriteSplitContent`).
 *
 * Which of the two applies is decided by an EXPLICIT marker the sprite-split
 * registration puts on its `BundleData`, never by inference from a lookup
 * miss -- so a diagram that references `<$foo>` while including a genuinely
 * unregistered bundle still raises `StdlibNotBundledError`, exactly as it did
 * before si11b.
 *
 * These three functions lived in `include-resolver.ts` (si11a) and then
 * briefly in `sprite-split-stdlib.ts`, where si11b T4 moved them to fit that
 * file's 500-line cap. They are not sprite-specific -- the per-resource path
 * is the common case and predates sprites entirely -- so a module named for
 * sprite splitting was the wrong home. Named for what it does instead.
 *
 * @see ./sprite-split-stdlib.ts -- the per-sprite half, and its registration recipe
 * @see ./tim/StdlibRegistry.ts -- `resolve`, `resolveResource`
 * @see ./tim/StdlibStore.ts -- `resolveBundle`, where alias SEMANTICS live
 * @see ./tim/stdlib-path.ts -- `splitStdlibPath`, the `Stdlib.java` key transform
 */

import { assembleSpriteSplitContent, spriteSplitNamesOf } from './sprite-split-stdlib.js';
import type { StdlibRegistry } from './tim/StdlibRegistry.js';
import { splitStdlibPath } from './tim/stdlib-path.js';
import type { BundleData } from './tim/StdlibStore.js';

/**
 * The tail of {@link stdlibContentFor}: given the walked alias chain's
 * terminus, decide whether it is sprite-split (explicit marker, never
 * inferred) and either assemble the `<$name>` payload or fall back to the
 * ordinary per-resource lookup, unchanged from si11a.
 */
async function resolveBundleContent(
  registry: StdlibRegistry,
  bundles: readonly BundleData[],
  key: string,
  source: string,
  extraSpriteNames: readonly string[] | undefined,
): Promise<string | undefined> {
  const target = bundles[bundles.length - 1]!;
  if (target.aliasOf !== undefined) return undefined;

  const spriteNames = spriteSplitNamesOf(target);
  if (spriteNames !== undefined) {
    return assembleSpriteSplitContent(registry, target.name, spriteNames, source, extraSpriteNames);
  }

  return registry.resolveResource(target.name, key);
}

/**
 * Every `BundleData` needed to walk one `<bundle/thing>` lookup's alias
 * chain; the LAST element is the terminus (see {@link stdlibContentFor}).
 * Alias semantics stay in `StdlibStore.ts#resolveBundle`, the key transform
 * in `stdlib-path.ts#splitStdlibPath` -- this only walks `registry.resolve`
 * one link at a time (a bundle name is addressable only once its chunk has
 * loaded: `bootstrap`'s chunk is what reveals `bootstrap1.13.1`, so the
 * second `resolve` is a cache hit, not a second `import()`).
 * A cycle stops collection with the last `aliasOf` still set;
 * `stdlibContentFor` treats that as a miss (upstream has no such guard and
 * would infinite-loop the JVM -- see `StdlibStore.ts`'s divergence note).
 */
async function bundlesFor(
  registry: StdlibRegistry,
  bundleName: string,
): Promise<readonly BundleData[]> {
  const collected: BundleData[] = [];
  const visited = new Set<string>();

  let current = bundleName.toLowerCase();
  for (;;) {
    if (visited.has(current)) return collected;
    visited.add(current);

    const data = await registry.resolve(current);
    if (data === undefined) return collected;

    collected.push(data);
    if (data.aliasOf === undefined) return collected;

    current = data.aliasOf.toLowerCase();
  }
}

/**
 * A registered bundle's content for `stdlibPath`, or `undefined` if nothing
 * serves it. si11a T3: asks for exactly ONE resource (ADR-2/ADR-6) instead of
 * materialising every `BundleData` in the chain -- ~2.9 KB vs 18.93 MB for
 * `tupadr3`. `resolveResource` is uniform across eager/remote (T2). si11b T4:
 * `extraSpriteNames` is the walk-global ADR-5b set, passed through unchanged
 * to `resolveBundleContent` for the sprite-split case; ignored otherwise.
 */
export async function stdlibContentFor(
  registry: StdlibRegistry,
  stdlibPath: string,
  source: string,
  extraSpriteNames: readonly string[] | undefined,
): Promise<string | undefined> {
  // No `/` resolves to nothing upstream (Stdlib.java:101-102) -- checked
  // before any chunk load, so a malformed target costs nothing.
  const split = splitStdlibPath(stdlibPath);
  if (split === undefined) return undefined;

  const bundles = await bundlesFor(registry, split.bundle);
  if (bundles.length === 0) return undefined;

  return resolveBundleContent(registry, bundles, split.key, source, extraSpriteNames);
}
