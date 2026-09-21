# API reference

The public entry point is `src/index.ts` — the package's only `exports`
subpath (`package.json`). Everything below is re-exported from there;
nothing else in `src/` is reachable from the built package.

- **Rendering functions** — `renderSync`, `renderPagesSync`, `render`,
  `renderPages`, `renderAll`
- **Options** — the `RenderOptions` type
- **Assembly** — `assembleSvg`
- **Include resolution** — `prepareIncludeStore`, its error classes, and
  `SecurityProfile`
- **Stdlib bundles** — `stdlibStore`/`withStdlib`, `stdlibRegistry`,
  `remoteStdlib`, `spriteSplitStdlib`
- **Vendored assets** — `combineAssetStores`

## Rendering functions

### `renderSync`

```ts
function renderSync(source: string, options?: RenderOptions): string;
```

Parses `source`, resolves the theme, lays out the diagram, and renders it to
an SVG string — synchronously. Throws no exceptions to the caller: parse and
layout errors are caught internally and rendered as a small error SVG
instead. Returns page 1 of `renderPagesSync`'s result.

- **`source`** — PlantUML-language diagram source. Only the first `@start*`
  block is rendered.
- Cannot fetch. If `source` contains an `!include` directive and
  `options.includeStore` is not supplied, `renderSync` returns an error SVG
  rather than resolving it — it never reaches the network. Either call
  `render()`, or prefetch the includes yourself with `prepareIncludeStore()`
  and pass the result as `options.includeStore`. See
  [The include-resolver seam](#the-include-resolver-seam).
- Returns an error SVG if no diagram type in `source` matches a registered
  plugin, or if the resolved plugin does not support synchronous layout
  (message: "renderSync() is not supported for this diagram type").

### `renderPagesSync`

```ts
function renderPagesSync(source: string, options?: RenderOptions): string[];
```

Every PAGE of the first `@start*` block, in page order — the multi-page
sibling of `renderSync`, which returns only `renderPagesSync(...)[0]`. Only
`newpage` in a sequence diagram produces more than one page today; every
other engine, and every error path, returns a one-element array. Same
`!include`/error-SVG behavior as `renderSync`.

### `render`

```ts
function render(source: string, options?: RenderOptions): Promise<string>;
```

Same as `renderSync`, but async: resolves the FIRST block's `!include`
directives first (via `prepareIncludeStore()` internally, using
`options.fetcher`/`options.includeStore`/`options.stdlibRegistry` if
supplied), then renders it. Falls back to an async layout path for diagram
types that don't implement synchronous layout. Returns page 1 of
`renderPages`'s result. Never throws — returns an error SVG on any failure,
include resolution included.

### `renderPages`

```ts
function renderPages(source: string, options?: RenderOptions): Promise<string[]>;
```

The async, `!include`-resolving sibling of `renderPagesSync`: every page of
the first `@start*` block.

### `renderAll`

```ts
function renderAll(source: string, options?: RenderOptions): Promise<string[]>;
```

Renders **every** `@start*` block found in `source` and returns one SVG
string per block (page 1 of each, for a paginating block), in source order.

Each block's `!include`s are resolved from its OWN raw text, independently
of its siblings: a block whose includes all resolve renders normally even
when another block's `!include` fails, and the failing block's entry is an
error SVG rather than discarding the whole document. (`prepareIncludeStore`
itself rejects its whole call on the first failing target — `renderAll`
scopes that call to one block at a time to get this per-block isolation;
`render()`/`renderPages()` call it on the whole document because they only
ever consume the first block anyway.)

## `RenderOptions`

```ts
interface RenderOptions {
  theme?: 'default' | 'dark' | 'sketchy' | 'monochrome' | Partial<Theme>;
  measurer?: StringMeasurer;
  maxWidth?: number;
  fetcher?: IncludeFetcher;
  includeStore?: IncludeStore;
  stdlibRegistry?: StdlibRegistry;
  onWarning?: (message: string) => void;
  sprites?: readonly string[];
  assetStore?: AssetStore;
  allowJavascriptInLink?: boolean;
  securityProfile?: SecurityProfile;
  urlAllowlist?: readonly string[];
}
```

- **`theme`** — a named base theme, or a partial theme object merged on top
  of source-driven theme resolution (see [Theme resolution](#theme-and-skinparam-resolution)
  below). Omit to use the theme from a `!theme` directive in `source`, or
  `'default'` if none is present.
- **`measurer`** — override the text measurer for this render. See
  [The measurer seam](#the-measurer-seam).
- **`maxWidth`** — optional layout width constraint (diagram-type dependent).
- **`fetcher`** — override how `!include` URLs are resolved. Only consulted
  by `render()`/`renderAll()`/`prepareIncludeStore()`, never `renderSync()`
  (which cannot fetch). See [The include-resolver seam](#the-include-resolver-seam).
- **`includeStore`** — pre-populated include content (`path -> source`),
  read *synchronously*. The only way `renderSync`/`renderPagesSync` resolve
  `!include`s at all; for `render()`/`renderAll()` it is a base the fetcher
  layers on top of, never mutated. Also how a stdlib bundle set built with
  `withStdlib()` reaches the interpreter. See [The stdlib seam](#the-stdlib-seam).
- **`stdlibRegistry`** — lazily-loaded stdlib bundles for `!include
  <bundle/thing>`, built with `stdlibRegistry()`. Consulted only after
  `includeStore` misses. `render()`/`renderAll()` only.
- **`onWarning`** — called once per recoverable degradation this render hit:
  a sprite `$name` redefinition or an unresolved jar-bundle sprite
  (`core/sprite-commands.ts`), or a YAML `KEY_AND_FOLDED_STYLE` (`>`) value
  this port doesn't implement and drops to an empty string. Free when
  omitted — no warning collection happens, and nothing is ever written to
  `console.*` on this channel.
- **`sprites`** — extra `<$name>` sprite names to prefetch that a source
  scan can't see (e.g. names built by a macro). Consumed by the per-sprite
  prefetch scan alongside `spriteSplitStdlib`.
- **`assetStore`** — pre-populated vendored binary/text assets (the
  jar-internal `/sprites/**` bundle, Twemoji artwork), read synchronously
  like `includeStore`. A miss degrades to the caller's existing fallback
  (a literal `«label»`, a platform-glyph emoji run) rather than throwing.
  See [The asset seam](#the-asset-seam).
- **`allowJavascriptInLink`** — default `false`. When `false` (the
  default), a `[[javascript:…]]` link target keeps its `<a>` element and
  title but gets `href=""`, matching the jar's default
  (`PLANTUML_ALLOW_JAVASCRIPT_IN_LINK=false`, `SecurityUtils.java:197-200`).
  Set `true` only when you trust every diagram source this render will
  ever see — the whole point of the default is that diagram source is
  often not trusted.
- **`securityProfile`** — which `!include http(s)://…` targets `render()`
  may fetch, and how long any one fetch may take. One of
  `SecurityProfile.SANDBOX` (no URL access), `.ALLOWLIST` (only
  `urlAllowlist` prefixes), `.INTERNET` (public hosts, ports 80/443),
  `.INTERNET_WITH_DOTSVG` (same URL rule as `INTERNET`), `.LEGACY`
  (default — public hosts, any port), or `.INSECURE` (any URL, internal
  addresses included). Default `'LEGACY'`, upstream's own default. A
  server rendering untrusted diagram source should pass `'INTERNET'`,
  `'ALLOWLIST'`, or `'SANDBOX'` — see [Security](#security) below.
- **`urlAllowlist`** — URL prefixes always allowed (every profile except
  `SANDBOX`), and the *only* ones allowed under `ALLOWLIST`.

`Theme`, `StringMeasurer`, `IncludeFetcher`, `IncludeStore`, `StdlibRegistry`,
and `AssetStore` are not exported from the package root — they are
structurally-typed interfaces (except `IncludeFetcher`, a function type), so
a caller can satisfy them with a plain object or function of the matching
shape without importing the type.

## `assembleSvg`

```ts
function assembleSvg(fragment: AssembledSvg): string;
```

The single central document-assembly choke point every render path funnels
through after layout: takes an already-laid-out diagram fragment and
produces the final SVG string (background/border rect splice, single
content `<g>` wrap, `data-diagram-type` stamp). `AssembledSvg` is an
internal type (not exported); this function is exported primarily so the
render pipeline's own internal call sites can reach it across module
boundaries — most consumers only ever need `render`/`renderSync`/`renderAll`
and never construct an `AssembledSvg` themselves.

## The measurer seam

Every layout engine receives a text measurer instead of touching the DOM or
`fs` directly, so measurement can be swapped per environment:

```ts
interface FontSpec {
  family: string;
  size: number;
  weight?: 'normal' | 'bold';
  style?: 'normal' | 'italic';
}

interface StringMeasurer {
  measure(text: string, font: FontSpec): { width: number; height: number };
  getDescent(font: FontSpec, text: string): number;
}
```

If `options.measurer` is omitted, plantuml-ts picks a default per diagram
type:

- **Description diagrams** (component, usecase, node, deployment, …) default
  to the jar-calibrated measurer, since their rendering metrics are tuned
  against upstream's exact text emission.
- **Every other diagram type** defaults to a single, lazily-created,
  process-wide `CanvasMeasurer` instance shared across every render (its
  8192-entry text+font measurement cache is safe to share: a cache hit for a
  given text+font pair is the same measurement regardless of which diagram
  asked for it). It uses the DOM `<canvas>` 2D context when available,
  falling back to `FormulaMeasurer` (a formula-based estimate, no DOM) when
  canvas construction fails — e.g. under Node or during SSR. That fallback
  choice is cached too, process-wide, the first time it happens.

Pass `options.measurer` explicitly to force a specific measurer (or a custom
implementation) regardless of diagram type, environment, or the shared
default's cache.

## The include-resolver seam

```ts
type IncludeFetcher = (url: string) => Promise<string>;

function prepareIncludeStore(
  source: string,
  options?: IncludeWarmupOptions, // a RenderOptions satisfies this
): Promise<IncludeStore>;
```

`render()`, `renderPages()`, and `renderAll()` call `prepareIncludeStore()`
internally before parsing, walking every `!include`/`!includesub` target in
`source` transitively (a bundle's own `!include` lines are followed too) and
filling an `IncludeStore` the synchronous interpreter reads from — never
splicing fetched text back into `source` itself, so conditionals around an
`!include` still see it as one line.

Call `prepareIncludeStore()` yourself to use `renderSync()`/
`renderPagesSync()` with sources that have includes:

```ts
const includeStore = await prepareIncludeStore(source, { stdlibRegistry });
const svg = renderSync(source, { includeStore });
```

- **`options.fetcher`** — resolves one URL target that has already passed
  the `options.securityProfile` gate. That gate (and the profile's timeout)
  applies BEFORE any fetcher runs, built-in or caller-supplied — a
  caller-supplied fetcher is never invoked for a URL the profile refuses.
  Defaults to a built-in `fetch`-based fetcher.
- **`options.includeStore`** — content the caller already has; never
  fetched, never mutated, copied into the result. The only channel for
  PlantUML-stdlib `<bundle/thing>` content built with `withStdlib()` (see
  [The stdlib seam](#the-stdlib-seam)).
- **`options.stdlibRegistry`** — lazily-loaded stdlib bundles, consulted
  only after `includeStore` misses on both its ordinary and
  `<bundle/thing>` channels.
- **`options.sprites`** — extra `<$name>` sprite names to prefetch that a
  text scan of `source` can't see.
- **`options.securityProfile`** / **`options.urlAllowlist`** — see
  `RenderOptions` above; identical fields, since `RenderOptions` satisfies
  `IncludeWarmupOptions`.

There is **no filesystem or PlantUML-stdlib resolution built into the
default fetcher** — only URL-based includes via `fetch` (or a
caller-supplied fetcher). Stdlib resolution is opt-in and requires a host
to supply bundle data (see below); a Node host wanting local-file
`!include` support supplies its own `options.fetcher` reading from
`node:fs`.

### Errors

Every one of these is exported from the package root:

| Error | Thrown when |
|---|---|
| `CspIncludeError` | A CSP `connect-src` policy blocked the fetch (browser only). Carries `url`/`requiredDirective`. |
| `CorsIncludeError` | A CORS failure prevented the fetch (inferred from URL patterns; browsers hide the detail). Carries `url`. |
| `IncludeResolveError` | Include resolution failed for any other reason (HTTP error, network failure, security-profile refusal, timeout). Carries `url`. |
| `CircularIncludeError` | An `!include` chain loops back on itself. Carries `url`/`chain`. |
| `StdlibNotBundledError` | `!include <bundle/thing>` named a bundle no `includeStore`/`stdlibRegistry` supplies — this library vendors no stdlib content itself. Carries `bundle`/`registrySupplied`. |
| `StdlibChunkLoadError` | A bundle WAS registered with `stdlibRegistry()` but its `import()` thunk rejected (bad CDN path, offline, broken bundler output). Carries `bundle`. |
| `StdlibResourceFetchError` | A `remoteStdlib`/`spriteSplitStdlib` bundle's manifest listed a key, but the per-resource network fetch for it failed. Carries `bundle`/`key`/`url`. |
| `SpriteNotBundledError` | A `<$name>` reference (or a `RenderOptions.sprites` entry) named a sprite absent from a sprite-split bundle's manifest. Carries `bundle`/`sprite`. |

## The stdlib seam

PlantUML's bundled stdlib (`!include <bundle/thing>`, e.g. `!include
<c4/C4_Context.puml>`) resolves only when a host supplies bundle content —
this library vendors none itself. Three ways to supply it, composable:

```ts
// Eager: every bundle's files already in hand (e.g. from
// @knowvah/plantuml-stdlib*).
function stdlibStore(...bundles: readonly BundleData[]): StdlibStore;
function withStdlib(base: IncludeStore, stdlib: StdlibStore): IncludeStore;

// Lazy, chunk-per-bundle: pay for a bundle's ~MB only when a diagram
// actually references it.
function stdlibRegistry(
  entries: Readonly<Record<string, () => Promise<unknown>>>,
): StdlibRegistry;

// Lazy, resource-per-file: pay for the one .puml file a diagram
// references, not the whole bundle.
function remoteStdlib(options: {
  manifest: StdlibRemoteManifest;
  baseUrl: string;
  fetcher?: IncludeFetcher;
  timeoutMs?: number; // default 60000 (the default security profile's LEGACY timeout)
}): RemoteBundle;

// Lazy, sprite-per-name: an even finer grain of remoteStdlib for a
// sprite-only bundle (e.g. bootstrap icons) — a diagram pays for the
// sprites it names, not every sprite the bundle ships.
function spriteSplitStdlib(options: {
  manifest: SpriteSplitManifest;
  baseUrl: string;
  fetcher?: IncludeFetcher;
}): RemoteBundle;
```

- `stdlibStore()` + `withStdlib()` → pass the result as `options.includeStore`.
- `stdlibRegistry()` → pass the result as `options.stdlibRegistry`.
- `remoteStdlib()`/`spriteSplitStdlib()` produce a `RemoteBundle`, which is
  itself a valid `stdlibRegistry()` entry's resolved value (register it
  under a bundle name via a thunk).

`BundleData`, `StdlibStore`, `StdlibRegistry`, `StdlibRemoteManifest`, and
`RemoteBundle` are exported types describing these shapes; none needs to be
constructed by hand for the common case of consuming a published
`@knowvah/plantuml-stdlib*` package.

## The asset seam

```ts
interface AssetPayload {
  bytes: Uint8Array;
  mimeType: string; // e.g. 'image/svg+xml', 'image/png'
}

interface AssetStore {
  get(key: string): AssetPayload | undefined;
  has(key: string): boolean;
}

function combineAssetStores(...stores: readonly AssetStore[]): AssetStore;
```

The synchronous channel for vendored binary/text assets that `renderSync`
needs before layout can proceed: the jar-internal `/sprites/**` bundle
(`sprite $name jar:...`) and Twemoji artwork (`<:name:>` emoji). Pass a
store as `options.assetStore`; a miss degrades to the existing fallback
(a literal `«label»`, a platform-glyph emoji run) rather than throwing.
Each asset family owns its own key scheme — this seam only fixes the
shape and the synchronous contract. `combineAssetStores()` layers several
stores (e.g. a sprite store and an emoji store) into one, first-match-wins.

## Theme and skinparam resolution

Four stages combine to produce the final `Theme` used for a render, each
layered on the previous:

1. **Named base theme** — `options.theme` (if a string) overrides a `!theme`
   directive found in `source`; otherwise the base is `'default'`.
2. **`skinparam` directives** from `source` are applied on top of the base
   theme.
3. **`<style>` blocks** from `source` are applied on top of that — both
   top-level bare declarations and element-scoped selectors (e.g.
   `class { BackgroundColor red }`).
4. **Caller `Partial<Theme>`** — if `options.theme` is an object rather than
   a string, it is deep-merged on top of everything above and wins on every
   conflicting field.

This means a caller-supplied theme object always wins, but named/string
themes only set the starting point — source-level `skinparam`/`<style>`
directives still apply on top of a named theme.
