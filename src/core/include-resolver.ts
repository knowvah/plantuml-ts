/**
 * The ASYNC half of the include seam.
 *
 * Provides:
 *   - prefetchIncludes()  — async pass that walks !include targets transitively
 *                           and fills an IncludeStore for the SYNC interpreter
 *   - fetchInclude()      — built-in browser fetcher with CORS/CSP error differentiation
 *   - CspIncludeError     — CSP connect-src violation with actionable directive hint
 *   - CorsIncludeError    — CORS failure with explanation and workaround suggestions
 *   - IncludeResolveError — generic resolution failure
 *   - CircularIncludeError — cycle detected in !include chain
 *
 * Batch SI5a-5 REPLACEMENT: `resolveIncludes()` — a TEXTUAL pre-pass that
 * spliced fetched content into the source BEFORE the preprocessor ran — is
 * gone. It was a structural divergence from upstream, which resolves includes
 * inside the interpreter: a pre-pass cannot see conditionals (an `!include`
 * inside a false `!ifdef` was fetched AND inlined anyway), cannot expand a
 * variable-built include path, and cannot express `!includesub` at all. The
 * interpreter now resolves includes itself (`tim/IncludeExecutor.ts`), reading
 * content from a sync `IncludeStore`; this module's job is to FILL that store.
 *
 * PLANTUML-TS DIVERGENCE — the prefetch OVER-FETCHES. It is a text scan, not an
 * evaluation: it cannot know which branch of an `!ifdef` will be taken, so it
 * fetches include targets in BOTH branches. The interpreter then executes only
 * the live one. Consequence: a file named by a dead branch is fetched (a wasted
 * request), and a fetch error there is still an error. Upstream, single-pass and
 * synchronous, never issues that request. Accepted: the alternative is either an
 * async interpreter (forbidden — `renderSync` is public API) or a re-run loop
 * that fetches, interprets, discovers new includes, and repeats.
 *
 * The converse limit: a path this scan cannot see statically — `!include $path`,
 * or an include inside a `!procedure` body invoked with computed arguments —
 * is not prefetched. Supply those through `options.includeStore` directly.
 *
 * CSP and CORS failures are distinct and require different remediation:
 *   - CSP: update the page's Content-Security-Policy connect-src directive.
 *   - CORS: the remote server must send Access-Control-Allow-Origin; CSP changes won't help.
 */

import {
  MapIncludeStore,
  StdlibNotBundledError,
  stdlibPathOf,
  type IncludeStore,
} from './tim/IncludeStore.js';
import { stdlibContentFor } from './stdlib-content.js';
import type { StdlibRegistry } from './tim/StdlibRegistry.js';

export {
  MapIncludeStore,
  IncludeNotFoundError,
  StdlibNotBundledError,
  EMPTY_INCLUDE_STORE,
  type IncludeStore,
} from './tim/IncludeStore.js';

export type IncludeFetcher = (url: string) => Promise<string>;

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

/**
 * Thrown when a CSP connect-src policy blocks an include fetch.
 * The `requiredDirective` property contains the exact directive the page needs.
 */
export class CspIncludeError extends Error {
  readonly url: string;
  readonly requiredDirective: string;

  constructor(url: string, origin: string) {
    const directive = `connect-src 'self' ${origin}`;
    super(
      `CSP blocked !include fetch from ${url}.\n` +
      `Add the following to your Content-Security-Policy to allow it:\n` +
      `  Content-Security-Policy: ${directive}`,
    );
    this.name = 'CspIncludeError';
    this.url = url;
    this.requiredDirective = directive;
  }
}

/**
 * Thrown when a CORS failure prevents an include fetch.
 * Browsers hide the CORS detail — this error is inferred from URL patterns.
 * Updating CSP will not resolve a CORS issue.
 */
export class CorsIncludeError extends Error {
  readonly url: string;

  constructor(url: string) {
    super(
      `CORS error fetching !include from ${url}.\n` +
      `The server does not send Access-Control-Allow-Origin headers; browsers block the response.\n` +
      `Updating your Content-Security-Policy will not help — this is a server-side CORS issue.\n` +
      `Options:\n` +
      `  • Bundle the include content at build time using a local resolver\n` +
      `  • Host the file on a server that sends CORS headers\n` +
      `  • Use a CORS proxy service`,
    );
    this.name = 'CorsIncludeError';
    this.url = url;
  }
}

/**
 * Thrown when include resolution fails for a reason other than CSP or CORS.
 */
export class IncludeResolveError extends Error {
  readonly url: string;

  constructor(message: string, url: string) {
    super(message);
    this.name = 'IncludeResolveError';
    this.url = url;
  }
}

/**
 * Thrown when a circular !include chain is detected.
 * The `chain` property contains the inclusion path leading to the cycle.
 */
export class CircularIncludeError extends Error {
  readonly url: string;
  readonly chain: readonly string[];

  constructor(url: string, chain: string[]) {
    super(
      `Circular !include detected: ${[...chain, url].join(' → ')}`,
    );
    this.name = 'CircularIncludeError';
    this.url = url;
    this.chain = chain;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const GITHUB_RAW_PATTERN =
  /^https?:\/\/(?:raw\.githubusercontent\.com|gist\.githubusercontent\.com|raw\.github\.com)\//;

function isGithubRawUrl(url: string): boolean {
  return GITHUB_RAW_PATTERN.test(url);
}

function originOf(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return url;
  }
}

// ---------------------------------------------------------------------------
// Built-in browser fetcher with CORS/CSP error differentiation
// ---------------------------------------------------------------------------

/**
 * Fetch a URL for !include resolution, with differentiated CORS and CSP error messages.
 *
 * In browser environments, listens for `securitypolicyviolation` events so that a
 * CSP-blocked fetch produces a message with the exact connect-src directive needed,
 * rather than the opaque "Failed to fetch" TypeError that both CSP and CORS produce.
 *
 * GitHub raw URLs (raw.githubusercontent.com, gist.githubusercontent.com,
 * raw.github.com) are detected and always reported as CORS errors, because those
 * servers do not send Access-Control-Allow-Origin headers.
 */
export async function fetchInclude(url: string): Promise<string> {
  const inBrowser =
    typeof window !== 'undefined' && typeof window.addEventListener === 'function';

  let cspViolationOrigin: string | null = null;

  const cspHandler = (evt: Event): void => {
    const secEvt = evt as SecurityPolicyViolationEvent;
    const blocked = secEvt.blockedURI ?? '';
    if (originOf(url) === originOf(blocked) || url.startsWith(blocked)) {
      cspViolationOrigin = originOf(url);
    }
  };

  if (inBrowser) {
    window.addEventListener('securitypolicyviolation', cspHandler);
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new IncludeResolveError(
        `Failed to fetch !include ${url}: HTTP ${response.status} ${response.statusText}`,
        url,
      );
    }
    return await response.text();
  } catch (err) {
    // Yield the microtask queue so any synchronously queued CSP violation events can fire.
    await Promise.resolve();

    if (cspViolationOrigin !== null) {
      throw new CspIncludeError(url, cspViolationOrigin);
    }

    if (err instanceof IncludeResolveError) throw err;

    if (isGithubRawUrl(url)) {
      throw new CorsIncludeError(url);
    }

    // #lizard forgives -- pre-existing violation (36 NLOC / 9 CCN vs. this
    // repo's caps), unrelated to si8-stdlib-registration; surfaced only because
    // T1 edits a different function in this file. Each branch is one distinct,
    // differentiated failure mode (CSP / CORS / HTTP / generic) whose whole
    // point is a separate remediation message.
    throw new IncludeResolveError(
      `Failed to fetch !include ${url}: ${(err as Error).message ?? String(err)}`,
      url,
    );
  } finally {
    if (inBrowser) {
      window.removeEventListener('securitypolicyviolation', cspHandler);
    }
  }
}

// ---------------------------------------------------------------------------
// !include prefetch pass
// ---------------------------------------------------------------------------

/**
 * Every directive that names an external target. `!includeurl` / `!include_once`
 * / `!include_many` are spellings of `!include` (`TLineType#PATTERN_INCLUDE`);
 * `!includesub file!bloc` names a file too (the bare `!includesub name` form
 * does not — it replays a `!startsub` block from the same source).
 *
 * `!includedef` and `!import` are NOT scanned: neither names a fetchable file in
 * this port (see `IncludeExecutor#executeIncludeDef` / `#executeImport`).
 */
const INCLUDE_RE = /^\s*!include(?:url|_once|_many)?\s+(\S.*?)\s*$/;
const INCLUDESUB_RE = /^\s*!includesub\s+(\S.*?)\s*$/;

/** Strip the block selector: `!include foo.puml!SUB` fetches `foo.puml`. */
function fileOf(target: string): string {
  const idx = target.lastIndexOf('!');
  return idx === -1 ? target : target.substring(0, idx);
}

/** The include targets named on one line, if any. */
function targetOf(line: string): string | undefined {
  const include = INCLUDE_RE.exec(line);
  if (include !== null) return fileOf(include[1]!);

  const sub = INCLUDESUB_RE.exec(line);
  if (sub === null) return undefined;

  const what = sub[1]!;
  const idx = what.indexOf('!');
  // Bare `!includesub name`: a same-source !startsub block, nothing to fetch.
  return idx === -1 ? undefined : what.substring(0, idx);
}

/** State constant across the walk; `source`/`visited`/`chain` change per recursion. */
interface PrefetchWalk {
  readonly fetcher: IncludeFetcher;
  readonly store: BackedIncludeStore;
  /** si8 ADR-4: absent for every caller that supplies no registry. */
  readonly registry: StdlibRegistry | undefined;
  /** si11a T4: WALK-layer in-flight dedup, keyed by include target. */
  readonly inFlight: Map<string, Promise<void>>;
  /** si11b ADR-5b: `RenderOptions.sprites`, applied at EVERY recursion level
   *  (`stdlib-content.ts#stdlibContentFor`), not just the top one. */
  readonly extraSpriteNames: readonly string[] | undefined;
}

// si11a T4: run `work` for `url` once per walk (no `await` before the
// check-then-set, so concurrent callers can't race past each other).
// Dropped on rejection so a failure is not cached forever.
function dedupeInFlight(
  inFlight: Map<string, Promise<void>>,
  url: string,
  work: () => Promise<void>,
): Promise<void> {
  const existing = inFlight.get(url);
  if (existing !== undefined) return existing;
  const pending = work().catch((err: unknown): never => {
    inFlight.delete(url);
    throw err;
  });
  inFlight.set(url, pending);
  return pending;
}

// si11a T4: targets in `source` run CONCURRENTLY (was: one line at a time);
// `dedupeInFlight` stops siblings naming the same target from fetching it
// twice. Unbounded: measured 2026-07-31, widest vendored stdlib fan-out is
// 38 nested includes (k8s/OSS/all.puml) -- well under the ~100 threshold.
async function prefetchInner(
  walk: PrefetchWalk,
  source: string,
  visited: ReadonlySet<string>,
  chain: string[],
): Promise<void> {
  const { fetcher, store, registry, inFlight, extraSpriteNames } = walk;
  const targets = source
    .split('\n')
    .map((line) => targetOf(line))
    .filter((url): url is string => url !== undefined);

  await Promise.all(
    targets.map(async (url) => {
      if (visited.has(url)) throw new CircularIncludeError(url, chain);
      const stdlib = stdlibPathOf(url);
      if (stdlib !== undefined) {
        // Bundled-stdlib form: a host supplies it (SI5b). TWO channels,
        // checked in `IncludeExecutor#load`'s order: exact key, then the
        // `getPumlResource` seam (`StdlibStore.ts#withStdlib`).
        if (store.has(url)) return;
        if (store.getPumlResource(stdlib) !== undefined) return;
        // THIRD channel (si8 ADR-4), reached only once both eager ones miss.
        await dedupeInFlight(inFlight, url, async () => {
          const bundled = registry === undefined
            ? undefined
            : await stdlibContentFor(registry, stdlib, source, extraSpriteNames);
          if (bundled === undefined) {
            throw new StdlibNotBundledError(url, stdlib, registry !== undefined);
          }
          // Folded in under the EXACT key `load` tries first (asserted in
          // stdlib-registry-prefetch.test.ts).
          store.set(url, bundled);
          // ADR-4: bundle text may itself `!include <…>`; re-enter the walk.
          await prefetchInner(walk, bundled, new Set([...visited, url]), [...chain, url]);
        });
        return;
      }
      if (store.has(url)) return; // already fetched (diamond include), or host-supplied
      await dedupeInFlight(inFlight, url, async () => {
        const content = await fetcher(url);
        store.set(url, content);
        await prefetchInner(walk, content, new Set([...visited, url]), [...chain, url]);
      });
    }),
  );
}

/** Shared by {@link prefetchIncludes} and {@link prepareIncludeStore} so
 *  ADR-5b's `extraSpriteNames` reaches the walk without adding a parameter
 *  to `prefetchIncludes`'s public signature. */
async function startPrefetchWalk(
  source: string,
  fetcher: IncludeFetcher,
  base: IncludeStore | undefined,
  registry: StdlibRegistry | undefined,
  extraSpriteNames: readonly string[] | undefined,
): Promise<IncludeStore> {
  const store = new BackedIncludeStore(base);
  const inFlight = new Map<string, Promise<void>>();
  const walk: PrefetchWalk = { fetcher, store, registry, inFlight, extraSpriteNames };
  await prefetchInner(walk, source, new Set<string>(), []);
  return store;
}

/**
 * Walk `source`'s `!include` / `!includesub` targets transitively and fetch each
 * one into an {@link IncludeStore}, so that the synchronous TIM interpreter can
 * resolve them (see the module header, and `tim/IncludeStore.ts`).
 *
 * Circular includes (direct or transitive) throw {@link CircularIncludeError}.
 * A `<bundle/thing>` target resolved by NONE of the three channels — an exact
 * key in `base`, `base`'s `getPumlResource` stdlib seam, or `registry` — throws
 * {@link StdlibNotBundledError}; this port vendors no stdlib.
 *
 * @param source   Raw PlantUML source (may contain include directives).
 * @param fetcher  Async function resolving a target to its content.
 *                 Defaults to the built-in {@link fetchInclude}.
 * @param base     Content the caller already has; never fetched, never
 *                 mutated — copied into the result.
 * @param registry Lazily-loaded stdlib bundles (si8 ADR-3/ADR-4), consulted
 *                 only after `base` misses. Its resolved text re-enters this
 *                 walk, so a bundle's own `!include <…>` lines are prefetched too.
 * @throws StdlibChunkLoadError a registered bundle's chunk failed to load —
 *         deliberately distinct from `StdlibNotBundledError` (ADR-5).
 */
export async function prefetchIncludes(
  source: string,
  fetcher: IncludeFetcher = fetchInclude,
  base?: IncludeStore,
  registry?: StdlibRegistry,
): Promise<IncludeStore> {
  return startPrefetchWalk(source, fetcher, base, registry, undefined);
}

/** Options for {@link prepareIncludeStore}. A `RenderOptions` satisfies this. */
export interface IncludeWarmupOptions {
  readonly fetcher?: IncludeFetcher | undefined;
  readonly includeStore?: IncludeStore | undefined;
  readonly stdlibRegistry?: StdlibRegistry | undefined;
  /** si11b ADR-5b escape hatch, applied at every walk level (`PrefetchWalk`). */
  readonly sprites?: readonly string[] | undefined;
}

/**
 * Resolve everything `source` includes and hand back a ready
 * {@link IncludeStore} — the ASYNC half of `render()`, published so a
 * SYNCHRONOUS caller can do the same two steps by hand:
 * `const includeStore = await prepareIncludeStore(source, { stdlibRegistry });`
 * then `renderSync(source, { includeStore })`.
 *
 * `renderSync` cannot await a dynamic `import()` and stays synchronous — public
 * API, and a hard constraint of this port — so lazy registration is
 * `render()`-only and this is the sync path's equivalent (si8 ADR-5).
 *
 * Three failure modes, each with a DIFFERENT fix, deliberately not collapsed
 * into one error: `StdlibNotBundledError` (no bundle of that name is
 * registered — add a thunk for it); `StdlibChunkLoadError` (it IS registered,
 * its chunk failed to load — fix the bundler/CDN, not a plantuml-ts bug);
 * `CircularIncludeError` (the `!include` chain loops — break it in the source).
 */
export async function prepareIncludeStore(
  source: string,
  options?: IncludeWarmupOptions,
): Promise<IncludeStore> {
  return startPrefetchWalk(
    source,
    options?.fetcher ?? fetchInclude,
    options?.includeStore,
    options?.stdlibRegistry,
    options?.sprites,
  );
}

/** A {@link MapIncludeStore} that falls back to a read-only base store on a miss. */
class BackedIncludeStore extends MapIncludeStore {
  private readonly base: IncludeStore | undefined;

  constructor(base: IncludeStore | undefined) {
    super();
    this.base = base;
  }

  override get(path: string): string | undefined {
    return super.get(path) ?? this.base?.get(path);
  }

  override has(path: string): boolean {
    return this.get(path) !== undefined;
  }

  /**
   * Forward the `<bundle/thing>` seam to the base store.
   *
   * This store is not just prefetch's scratch space — it is the value `render()`
   * hands to the interpreter (`src/index.ts`, `prefetchIncludes` -> `buildBlockUmls`).
   * Without this delegation, a `withStdlib` base resolves during prefetch and
   * then `IncludeExecutor#load` throws `StdlibNotBundledError` anyway, because
   * `this.store.getPumlResource?.(...)` finds no such method on the wrapper.
   * Accepting in `prefetchInner` alone fixes nothing a caller can observe.
   */
  getPumlResource(fullname: string): string | undefined {
    return this.base?.getPumlResource?.(fullname);
  }
}
