/**
 * Lazy, per-bundle registration for the `<bundle/thing>` stdlib seam.
 *
 * SI5b shipped `stdlibStore(...bundles)` -- EAGER, and the only builder in the
 * repo (`scripts/stdlib-assets-store.ts`) imports `node:fs`, so a browser
 * consumer had to hand-assemble `BundleData[]` up front with no discovery and
 * no demand loading. This module is the browser-safe half: a consumer declares
 * which package backs which bundle, and each bundle's payload loads on first
 * use.
 *
 * Registration is an EXPLICIT map of dynamic-`import()` thunks (si8 ADR-3):
 *
 *   stdlibRegistry({
 *     c4:        () => import('@plantuml-ts/stdlib/c4'),
 *     bootstrap: () => import('@plantuml-ts/stdlib/bootstrap'),
 *   })
 *
 * The specifiers are STATIC on purpose. A computed one --
 * `` import(`@plantuml-ts/stdlib/${name}`) `` -- is unanalyzable by Vite and
 * webpack, so they stop code-splitting and inline every bundle into the main
 * chunk. That silently destroys the entire feature, which is why ADR-3 rejects
 * it. It also matters at this scale: `tupadr3.js` alone is 19.54 MB.
 *
 * Granularity is per-BUNDLE, not per-resource (si8 ADR-2). A tupadr3 consumer
 * still pays 19.54 MB on first use rather than always; splitting further means
 * changing the generated package shape (6,849 tupadr3 `.puml` files; 29,101
 * across the assets tree) and is its own tracked mission.
 *
 * This module does NOT resolve `link:` aliases -- `StdlibStore.ts#resolveBundle`
 * owns that, including its cycle guard, and duplicating it here would give the
 * port two answers to one question. See `harvest`'s comment for how the two
 * cooperate.
 *
 * @see ./StdlibStore.ts -- `stdlibStore` / `withStdlib`, the eager counterpart
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/preproc/Stdlib.java
 */

import type { BundleData } from './StdlibStore.js';

/**
 * Thrown when a registered thunk REJECTS -- the bundle was declared, but its
 * chunk could not be fetched or parsed (a bad CDN path, an offline network, a
 * bundler that failed to emit the chunk).
 *
 * Deliberately distinct from `resolve()` returning `undefined`, which means the
 * bundle was never registered. The two have different fixes -- add a
 * registration entry, versus repair the deployment -- and collapsing them into
 * one error would leave a consumer unable to tell which they are looking at
 * (si8 ADR-5).
 */
export class StdlibChunkLoadError extends Error {
  /** The bundle whose thunk rejected, exactly as it was requested. */
  readonly bundle: string;

  constructor(bundle: string, cause: unknown) {
    super(
      `Failed to load the '${bundle}' stdlib bundle: its registered import() rejected.\n` +
        `The bundle IS registered, so this is not a missing registration -- the chunk itself ` +
        `could not be fetched or parsed. Check that the package is installed and that your ` +
        `bundler emitted its chunk.\n` +
        `Cause: ${cause instanceof Error ? cause.message : String(cause)}`,
      { cause },
    );
    this.name = 'StdlibChunkLoadError';
    this.bundle = bundle;
  }
}

/** Lazy bundle lookup, backed by dynamic `import()`. @see stdlibRegistry */
export interface StdlibRegistry {
  /**
   * The bundle's data, or `undefined` when `bundle` is not registered.
   *
   * Loads the backing chunk on first use and caches it; concurrent calls for
   * the same unloaded bundle share ONE load.
   *
   * @throws StdlibChunkLoadError the bundle is registered but its chunk failed
   *         to load. "Not registered" is `undefined`, never a throw.
   */
  resolve(bundle: string): Promise<BundleData | undefined>;
}

/** A module export that looks like a {@link BundleData}. */
function isBundleData(value: unknown): value is BundleData {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as { name?: unknown; files?: unknown; aliasOf?: unknown };
  return (
    typeof candidate.name === 'string' &&
    typeof candidate.files === 'object' &&
    candidate.files !== null &&
    (candidate.aliasOf === undefined || typeof candidate.aliasOf === 'string')
  );
}

/**
 * Every `BundleData` a loaded module carries, keyed by its OWN `name` lowercased.
 *
 * Deliberately not "the export named after the bundle" -- that assumption does
 * not survive contact with the generated packages (verified against
 * `packages/*` 2026-07-31, si8 T2):
 *
 *   - `@plantuml-ts/stdlib/bootstrap` exports TWO bundles: `bootstrap`
 *     (`aliasOf: 'bootstrap1.13.1'`, `files: {}`) and `bootstrap1_13_1` (the
 *     concrete payload). Taking only the export named `bootstrap` yields an
 *     alias stub with no files, and `<bootstrap/bi-globe>` resolves to nothing.
 *   - Export IDENTIFIERS are mangled to be valid JS -- the bundle named
 *     `bootstrap1.13.1` is exported as `bootstrap1_13_1` -- so matching on the
 *     identifier is wrong anyway. The `name` FIELD is the authority.
 *
 * Harvesting every bundle in the chunk is also what lets alias chains resolve
 * without this module knowing what an alias is: the caller asks for
 * `bootstrap`, gets the stub, reads `aliasOf`, and asks again for
 * `bootstrap1.13.1` -- which is already cached from the same chunk, so no
 * second `import()` happens and no separate registration is needed. Alias
 * SEMANTICS stay in `StdlibStore.ts#resolveBundle`, cycle guard and all.
 */
function harvest(module: unknown, into: Map<string, BundleData>): void {
  if (typeof module !== 'object' || module === null) return;

  // `Object.values` on a bare `object` is typed `any[]`; the cast keeps the
  // members `unknown` so `isBundleData` stays the only thing that widens them.
  for (const value of Object.values(module as Record<string, unknown>)) {
    if (isBundleData(value)) {
      into.set(value.name.toLowerCase(), value);
      continue;
    }
    // A CJS/interop `default` holding the namespace (`{ default: { c4, … } }`).
    // One level only -- deeper nesting is not a shape any generator emits.
    if (value !== null && typeof value === 'object') {
      for (const nested of Object.values(value as Record<string, unknown>)) {
        if (isBundleData(nested)) into.set(nested.name.toLowerCase(), nested);
      }
    }
  }
}

/**
 * Build a {@link StdlibRegistry} from bundle name -> dynamic-`import()` thunk.
 *
 * Names match case-insensitively, as `stdlibStore` already does
 * (`byName.set(bundle.name.toLowerCase(), …)`), so `<C4/C4_Context>` finds an
 * entry registered as `c4`.
 *
 * @param entries Bundle name -> a thunk returning the package module. Use a
 *                STATIC specifier inside the thunk (ADR-3).
 */
export function stdlibRegistry(
  entries: Readonly<Record<string, () => Promise<unknown>>>,
): StdlibRegistry {
  const thunks = new Map<string, () => Promise<unknown>>();
  for (const [name, thunk] of Object.entries(entries)) thunks.set(name.toLowerCase(), thunk);

  /** Bundles harvested from every chunk loaded so far, keyed by `name` lowercased. */
  const loaded = new Map<string, BundleData>();
  /**
   * In-flight loads keyed by ENTRY name. Memoizing the PROMISE (not the result)
   * is what makes two concurrent `resolve('c4')` calls share one `import()`
   * instead of racing two.
   */
  const inflight = new Map<string, Promise<void>>();

  async function load(key: string, bundle: string, thunk: () => Promise<unknown>): Promise<void> {
    try {
      harvest(await thunk(), loaded);
    } catch (err) {
      // Drop the memo so a transient failure (offline, CDN blip) can be retried
      // rather than being cached as permanent for the page's lifetime.
      inflight.delete(key);
      throw new StdlibChunkLoadError(bundle, err);
    }
  }

  return {
    resolve: async (bundle: string): Promise<BundleData | undefined> => {
      const key = bundle.toLowerCase();

      const cached = loaded.get(key);
      if (cached !== undefined) return cached;

      const thunk = thunks.get(key);
      if (thunk === undefined) return undefined;

      const pending = inflight.get(key) ?? load(key, bundle, thunk);
      inflight.set(key, pending);
      await pending;

      return loaded.get(key);
    },
  };
}
