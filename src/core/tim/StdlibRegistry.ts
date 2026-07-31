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
 * si11a T2 adds `resolveResource(bundle, key)`, the per-RESOURCE counterpart to
 * `resolve()`. A registered bundle may now be either an eager `BundleData`
 * (unchanged) or a `RemoteBundle` (`StdlibRemote.ts`, fetch-backed, harvested
 * the same way `BundleData` is -- keyed by its `name` field). `resolveResource`
 * gives a caller ONE code path regardless of which: eager reads `files[key]`,
 * remote delegates to `RemoteBundle#fetch(key)`. `resolve()` itself is
 * unchanged in signature; for a remote bundle it returns `asBundleData()`
 * (correct `name`/`aliasOf`, empty `files`) so the alias walk above keeps
 * working without knowing a bundle is remote (si11a ADR-2).
 *
 * @see ./StdlibStore.ts -- `stdlibStore` / `withStdlib`, the eager counterpart
 * @see ./StdlibRemote.ts -- `RemoteBundle` / `remoteStdlib`, the per-resource
 *      fetch-backed source this module can now also harvest
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/preproc/Stdlib.java
 */

import type { BundleData } from './StdlibStore.js';
import type { RemoteBundle } from './StdlibRemote.js';

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
   * For a bundle harvested as a `RemoteBundle` (si11a T2), this returns
   * `RemoteBundle#asBundleData()` -- correct `name`/`aliasOf`, empty `files`.
   * A remote bundle never has every resource in hand at once, so it cannot
   * produce a populated `BundleData`; use {@link resolveResource} for content.
   *
   * @throws StdlibChunkLoadError the bundle is registered but its chunk failed
   *         to load. "Not registered" is `undefined`, never a throw.
   */
  resolve(bundle: string): Promise<BundleData | undefined>;

  /**
   * The content for `key` within `bundle`, or `undefined` when `bundle` is not
   * registered, or `key` is not part of it.
   *
   * Uniform across HOW the bundle was registered (si11a ADR-2) -- a caller
   * never branches on remote-vs-eager, which is the entire point:
   *   - eager `BundleData` -- reads `files[key]` directly.
   *   - `RemoteBundle` -- delegates to `RemoteBundle#fetch(key)`.
   *
   * Loads the backing chunk on first use exactly like {@link resolve}, and
   * shares its cache -- a prior `resolve(bundle)` means no second `import()`.
   *
   * @throws StdlibChunkLoadError `bundle` is registered but its chunk failed
   *         to load -- the same distinction `resolve()` makes.
   * @throws StdlibResourceFetchError (`./StdlibRemote.js`) `bundle` resolved to
   *         a `RemoteBundle` and `key` IS listed in its manifest, but the
   *         network fetch for it failed. Deliberately distinct from
   *         `StdlibChunkLoadError` -- one means the chunk describing the
   *         bundle failed to load, the other that one resource's fetch did.
   */
  resolveResource(bundle: string, key: string): Promise<string | undefined>;
}

/**
 * A module export that looks like a {@link BundleData}.
 *
 * NOTE (si11a T2): a bare `StdlibRemoteManifest` (`{ name, aliasOf?, files }`,
 * `StdlibRemote.ts`) is structurally IDENTICAL to this shape -- both carry a
 * `name`, an optional `aliasOf`, and a `files: Record<string, string>`. There
 * is no runtime property that tells them apart, and constructing a working
 * `RemoteBundle` from a bare manifest requires a `baseUrl` (ADR-4: no
 * default), which never reaches this module -- `stdlibRegistry`'s signature is
 * frozen at `Record<string, () => Promise<unknown>>`. So a bare manifest fed
 * to a thunk is (unavoidably, and unchanged from before this task) matched
 * here and harvested as if its `files` held content. The functional remote
 * path is a `RemoteBundle`-shaped export instead (see `isRemoteBundle`) --
 * the registrant's own thunk wraps the manifest with `remoteStdlib({
 * manifest, baseUrl })` (which IS `RemoteBundle`-shaped, since it carries
 * `has`/`fetch`/`asBundleData` functions the manifest itself does not) before
 * it ever reaches this registry.
 */
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
 * A module export that looks like a {@link RemoteBundle} (si11a T2) -- the
 * functional remote-registration shape. Checked for `has`/`fetch`/
 * `asBundleData` FUNCTIONS, which is what makes it unambiguously distinct
 * from both {@link BundleData} and a bare `StdlibRemoteManifest` (neither
 * carries methods).
 */
function isRemoteBundle(value: unknown): value is RemoteBundle {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as {
    name?: unknown;
    aliasOf?: unknown;
    has?: unknown;
    fetch?: unknown;
    asBundleData?: unknown;
  };
  return (
    typeof candidate.name === 'string' &&
    (candidate.aliasOf === undefined || typeof candidate.aliasOf === 'string') &&
    typeof candidate.has === 'function' &&
    typeof candidate.fetch === 'function' &&
    typeof candidate.asBundleData === 'function'
  );
}

/**
 * Classify one candidate value as {@link BundleData} or {@link RemoteBundle}
 * and store it in `into` keyed by its `name` lowercased. Returns whether it
 * matched either shape, so callers can skip further unwrapping when it did.
 */
function harvestOne(value: unknown, into: Map<string, BundleData | RemoteBundle>): boolean {
  if (isBundleData(value)) {
    into.set(value.name.toLowerCase(), value);
    return true;
  }
  if (isRemoteBundle(value)) {
    into.set(value.name.toLowerCase(), value);
    return true;
  }
  return false;
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
 *
 * si11a T2: a `RemoteBundle` harvests the same way, keyed by the SAME `name`
 * field -- so an alias/target pair can mix registration kinds freely (e.g. a
 * remote alias whose target is an eager `BundleData`), and the alias walk
 * above never needs to know which kind it got.
 */
function harvest(module: unknown, into: Map<string, BundleData | RemoteBundle>): void {
  if (typeof module !== 'object' || module === null) return;

  // A thunk MAY resolve DIRECTLY to an already-built `RemoteBundle` -- the
  // registrant's own `() => import('.../x-remote').then((m) => remoteStdlib({
  // manifest: m.xRemote, baseUrl }))` pattern (this module never constructs a
  // `RemoteBundle` itself; see `isBundleData`'s note on why it cannot). That
  // resolves to ONE bundle, not a namespace of many, so it is checked before
  // the `Object.values` walk below, which assumes a namespace of exports.
  if (harvestOne(module, into)) return;

  // `Object.values` on a bare `object` is typed `any[]`; the cast keeps the
  // members `unknown` so `isBundleData`/`isRemoteBundle` stay the only things
  // that widen them.
  for (const value of Object.values(module as Record<string, unknown>)) {
    if (harvestOne(value, into)) continue;
    // A CJS/interop `default` holding the namespace (`{ default: { c4, … } }`).
    // One level only -- deeper nesting is not a shape any generator emits.
    if (value !== null && typeof value === 'object') {
      for (const nested of Object.values(value as Record<string, unknown>)) harvestOne(nested, into);
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

  /**
   * Bundles harvested from every chunk loaded so far, keyed by `name`
   * lowercased. si11a T2: a value is either the eager `BundleData` (files
   * hold content) or a fetch-backed `RemoteBundle` -- `resolve` and
   * `resolveResource` below are what give a caller one code path over both.
   */
  const loaded = new Map<string, BundleData | RemoteBundle>();
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

  /**
   * Load-and-cache logic shared by `resolve` and `resolveResource` (si11a
   * T2) -- the ONE place that knows how a bundle name becomes a harvested
   * entry. Keeping it single ensures both methods see the same cache, the
   * same in-flight sharing, and the same `StdlibChunkLoadError` behavior.
   */
  async function resolveEntry(bundle: string): Promise<BundleData | RemoteBundle | undefined> {
    const key = bundle.toLowerCase();

    const cached = loaded.get(key);
    if (cached !== undefined) return cached;

    const thunk = thunks.get(key);
    if (thunk === undefined) return undefined;

    const pending = inflight.get(key) ?? load(key, bundle, thunk);
    inflight.set(key, pending);
    await pending;

    return loaded.get(key);
  }

  return {
    resolve: async (bundle: string): Promise<BundleData | undefined> => {
      const entry = await resolveEntry(bundle);
      if (entry === undefined) return undefined;
      return isRemoteBundle(entry) ? entry.asBundleData() : entry;
    },

    resolveResource: async (bundle: string, resourceKey: string): Promise<string | undefined> => {
      const entry = await resolveEntry(bundle);
      if (entry === undefined) return undefined;
      return isRemoteBundle(entry) ? entry.fetch(resourceKey) : entry.files[resourceKey];
    },
  };
}
