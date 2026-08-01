/**
 * Per-RESOURCE, fetch-backed stdlib bundle source (si11a T1).
 *
 * `StdlibRegistry.ts` (si8) made a bundle load lazily as ONE chunk -- a
 * `tupadr3` consumer still pays 19.54 MB on first use, because the generated
 * module inlines every resource's text. This module is the piece that lets a
 * bundle be described by a small MANIFEST (key -> relative path, no content)
 * and have each resource fetched only when a diagram actually names it:
 * `<tupadr3/font-awesome-5/ban>` costs ~2.9 KB, not 19.54 MB.
 *
 * `StdlibRemoteManifest` is deliberately PUBLIC and hand-constructible
 * (si11a ADR-7) -- it is not gated behind the `@knowvah/plantuml-stdlib*` generator. A
 * third party hosting their own icon set writes one by hand:
 *
 *   const manifest: StdlibRemoteManifest = {
 *     name: 'my-icons',
 *     files: { star: 'star.puml', heart: 'icons/heart.puml' },
 *   };
 *   const bundle = remoteStdlib({ manifest, baseUrl: 'https://example.com/icons/' });
 *
 * and gets exactly what a generator-emitted `tupadr3` manifest gets: no
 * generator, no `@knowvah/plantuml-stdlib*` package, no special-casing anywhere in `src/`.
 *
 * The manifest carries a key -> path MAP, never a key -> path CONVENTION
 * (si11a ADR-3): measured 2026-07-31, 890 of 891 `awslib14` paths contain
 * uppercase (`Storage/SimpleStorageService.puml`) while `derivePumlKey`
 * lowercases every key, so deriving a path from a key would require renaming
 * vendored assets. A key absent from `files` is therefore a KNOWN miss --
 * `has()`/`fetch()` answer with no network round-trip at all.
 *
 * `baseUrl` has NO default (si11a ADR-4). The packages ship to npm; there is
 * no plantuml-ts-operated CDN, and this module does not create one. The
 * library never makes a network call a consumer did not explicitly configure.
 *
 * Caching mirrors `StdlibRegistry.ts` exactly (si11a ADR-5): the in-flight
 * PROMISE is memoized (not the settled result), so two concurrent
 * `fetch(key)` calls for the same key share one request; the memo is dropped
 * on rejection, so a transient failure (offline, CDN blip) can be retried
 * rather than replaying a cached rejection forever.
 *
 * OBSERVABILITY: the injected `fetcher` IS this module's observability seam.
 * A browser library ships with no metrics pipeline, so a consumer wraps
 * `fetcher` (or the default `fetchInclude`) to measure fetch error rate,
 * requests-per-diagram and p95 latency --
 *
 *   const instrumented: IncludeFetcher = async (url) => {
 *     const start = performance.now();
 *     try {
 *       const text = await fetchInclude(url);
 *       metrics.record('stdlib.remote.fetch', { ok: true, ms: performance.now() - start });
 *       return text;
 *     } catch (err) {
 *       metrics.record('stdlib.remote.fetch', { ok: false, ms: performance.now() - start });
 *       throw err;
 *     }
 *   };
 *   const bundle = remoteStdlib({ manifest, baseUrl, fetcher: instrumented });
 *
 * There is no metrics/trace/dashboard integration here -- there is no
 * service. `remoteStdlib` reuses `fetchInclude` by default specifically so
 * that CORS-vs-CSP differentiation (`CorsIncludeError` / `CspIncludeError`,
 * `include-resolver.ts`) is free: a CSP-blocked resource fetch already
 * reports the exact `connect-src` directive needed, with no reimplementation
 * here.
 *
 * This module is built and tested in ISOLATION -- nothing in `src/` imports
 * it yet (a later task wires it into the prefetch walk). That keeps its tests
 * exercising the real caching and error behavior directly, rather than
 * through a render pipeline.
 *
 * @see ./StdlibRegistry.ts -- the per-BUNDLE lazy-chunk counterpart this mirrors
 * @see ./StdlibStore.ts -- `BundleData`, which `asBundleData()` produces an
 *      (intentionally content-free) instance of, for alias-chain reuse
 * @see ../include-resolver.ts -- `IncludeFetcher`, `fetchInclude`, and the
 *      `CspIncludeError` / `CorsIncludeError` differentiation this reuses
 */

import type { IncludeFetcher } from '../include-resolver.js';
import { fetchInclude } from '../include-resolver.js';
import type { BundleData } from './StdlibStore.js';

/**
 * A per-resource stdlib bundle description: no content, just where each
 * resource lives relative to `baseUrl` (si11a ADR-3).
 *
 * **Public and hand-constructible (si11a ADR-7).** Nothing in `remoteStdlib`
 * requires this to come from the `@knowvah/plantuml-stdlib*` generator -- any object
 * satisfying this shape, written by hand or produced by a third party's own
 * tooling, works identically to a generated one.
 */
export interface StdlibRemoteManifest {
  /** Bundle name, matched case-insensitively wherever it is registered -- e.g. `'tupadr3'`. */
  readonly name: string;
  /**
   * `link:` redirect target, mirroring `BundleData#aliasOf`. When set, `files`
   * is expected to be empty and lookups for this bundle resolve through the
   * aliased bundle instead (`awslib` -> `awslib14`).
   */
  readonly aliasOf?: string | undefined;
  /**
   * `derivePumlKey`'s output (lowercase, `.puml` stripped) -> the REAL
   * relative path within the bundle folder, case preserved. Resolved against
   * `baseUrl` at fetch time; never derived from the key by convention.
   */
  readonly files: Readonly<Record<string, string>>;
}

/**
 * A stdlib bundle whose resources are fetched individually, on demand.
 *
 * @see remoteStdlib
 */
export interface RemoteBundle {
  /** The manifest's `name`, read straight off it. */
  readonly name: string;
  /** The manifest's `aliasOf`, read straight off it. */
  readonly aliasOf: string | undefined;
  /** Whether `key` is listed in the manifest. No network access. */
  has(key: string): boolean;
  /**
   * The content for `key`.
   *
   * Returns `undefined` when `key` is not in the manifest -- a caller/authoring
   * error, answered with no network access at all (si11a ADR-3's offline miss
   * detection). Concurrent calls for the SAME key share one in-flight request.
   *
   * @throws StdlibResourceFetchError `key` IS in the manifest but the fetch
   *         failed -- a deployment/network problem, not a missing resource.
   *         The failed attempt is NOT cached: the next call for the same key
   *         retries rather than replaying the rejection.
   */
  fetch(key: string): Promise<string | undefined>;
  /**
   * `{ name, aliasOf, files: {} }` -- a content-free {@link BundleData} for
   * alias-chain reuse (si11a ADR-2). A remote bundle never has every resource
   * in hand at once, so it cannot produce a populated `BundleData`; per-key
   * content comes from {@link RemoteBundle.fetch} instead.
   */
  asBundleData(): BundleData;
}

/**
 * Thrown when a resource IS listed in a {@link StdlibRemoteManifest} but its
 * fetch failed -- a bad `baseUrl`, an offline network, a CORS/CSP block, or a
 * server-side 404 for a path the manifest still lists.
 *
 * Deliberately distinct from {@link RemoteBundle.fetch} returning `undefined`,
 * which means the key was never in the manifest at all. The two have
 * different fixes -- correct the include target, versus repair the
 * deployment or `baseUrl` -- and collapsing them into one signal would leave
 * a consumer unable to tell which they are looking at (mirrors
 * `StdlibChunkLoadError`'s si8 ADR-5 reasoning).
 */
export class StdlibResourceFetchError extends Error {
  /** The bundle the resource belongs to, exactly as the manifest names it. */
  readonly bundle: string;
  /** The manifest key that was requested. */
  readonly key: string;
  /** The resolved URL the fetch was attempted against. */
  readonly url: string;

  constructor(bundle: string, key: string, url: string, cause: unknown) {
    super(
      `Failed to fetch '${key}' from the '${bundle}' remote stdlib bundle at ${url}.\n` +
        `The manifest DOES list this key, so this is not a missing resource -- the network ` +
        `request itself failed. Check that '${url}' is reachable, that CORS headers permit it, ` +
        `and that any Content-Security-Policy connect-src directive allows it.\n` +
        `Cause: ${cause instanceof Error ? cause.message : String(cause)}`,
      { cause },
    );
    this.name = 'StdlibResourceFetchError';
    this.bundle = bundle;
    this.key = key;
    this.url = url;
  }
}

/** Join `baseUrl` and `relPath` with exactly one `/` between them, regardless of trailing slashes. */
function joinUrl(baseUrl: string, relPath: string): string {
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const rel = relPath.startsWith('/') ? relPath.slice(1) : relPath;
  return `${base}/${rel}`;
}

/**
 * Build a {@link RemoteBundle} from a {@link StdlibRemoteManifest}.
 *
 * @param options.manifest The bundle description (public, hand-constructible -- ADR-7).
 * @param options.baseUrl  REQUIRED, no default (ADR-4). Every relative path in
 *                         `manifest.files` is resolved against this.
 * @param options.fetcher  Defaults to {@link fetchInclude}, which is what gives
 *                         CORS/CSP error differentiation for free. Override to
 *                         add retry, auth headers, or metrics (this module's
 *                         observability seam -- see the module doc comment).
 */
export function remoteStdlib(options: {
  readonly manifest: StdlibRemoteManifest;
  readonly baseUrl: string;
  readonly fetcher?: IncludeFetcher | undefined;
}): RemoteBundle {
  const { manifest, baseUrl, fetcher = fetchInclude } = options;

  /**
   * In-flight/completed fetches keyed by manifest key. Memoizing the PROMISE
   * (not the result) is what makes two concurrent `fetch(key)` calls share
   * one request instead of racing two (ADR-5, mirroring `StdlibRegistry`).
   */
  const inflight = new Map<string, Promise<string>>();

  function fetchResource(key: string): Promise<string | undefined> {
    const relPath = manifest.files[key];
    if (relPath === undefined) return Promise.resolve(undefined);

    const cached = inflight.get(key);
    if (cached !== undefined) return cached;

    const url = joinUrl(baseUrl, relPath);
    const pending = fetcher(url).catch((cause: unknown): never => {
      // Drop the memo so a transient failure (offline, CDN blip) can be
      // retried rather than being cached as a permanent rejection.
      inflight.delete(key);
      throw new StdlibResourceFetchError(manifest.name, key, url, cause);
    });
    inflight.set(key, pending);
    return pending;
  }

  return {
    name: manifest.name,
    aliasOf: manifest.aliasOf,
    has: (key: string): boolean => manifest.files[key] !== undefined,
    fetch: fetchResource,
    asBundleData: (): BundleData => ({ name: manifest.name, aliasOf: manifest.aliasOf, files: {} }),
  };
}
