# Per-resource stdlib fetching

`remoteStdlib()` (`src/core/tim/StdlibRemote.ts`, exported from the package
root) lets a diagram pull in one stdlib icon at a time instead of loading an
entire bundle. A bundle is described by a small **manifest** — a
`{ key: relativePath }` map, no file content — and each resource is fetched
only when a diagram actually names it:

```plantuml
!include <tupadr3/font-awesome-5/ban>
```

costs roughly 2.9 KB over the network, not the ~19.54 MB the eager
`stdlibRegistry()` chunk (mission SI8) would load to serve that same icon.

This is **not enabled by default** and ships with **no default `baseUrl`**
(ADR-4). `remoteStdlib` is a building block; you decide where the `.puml`
assets are served from and wire it into `RenderOptions` yourself.

## Recipe: self-hosted assets

Copy the bundle's `.puml` assets (from the `@plantuml-ts/stdlib-*` package,
or your own icon set) into a static directory your app already serves, and
point `baseUrl` at it:

```ts
import { remoteStdlib, render } from '@plantuml-ts/core';
import type { StdlibRemoteManifest } from '@plantuml-ts/core';

// The manifest ships alongside the vendored assets today as
// assets/manifests/<bundle>.json — copy it and the referenced .puml files
// into your static dir together; there is no generated `.../remote`
// package subpath to import yet (see "What doesn't exist yet" below).
import manifest from './static/plantuml-stdlib/tupadr3.json' with { type: 'json' };

const tupadr3 = remoteStdlib({
  manifest: manifest as StdlibRemoteManifest,
  baseUrl: 'https://static.example.com/plantuml-stdlib/tupadr3/',
});

await render(source, {
  stdlibRegistry: {
    resolve: async (bundle) =>
      bundle.toLowerCase() === 'tupadr3' ? tupadr3.asBundleData() : undefined,
  },
});
```

This keeps the library's "offline unless you opt in" guarantee literally
true: no request leaves the process until you configure a `baseUrl` you
control.

## Recipe: pinned CDN

You may point `baseUrl` at a third-party CDN (jsDelivr, unpkg) yourself,
**with the version pinned**:

```ts
const tupadr3 = remoteStdlib({
  manifest,
  baseUrl: 'https://cdn.jsdelivr.net/npm/@plantuml-ts/stdlib-tupadr3@1.4.0/assets/',
});
```

**plantuml-ts ships no default `baseUrl` and operates no CDN.** There is no
fallback URL anywhere in this library — if you don't configure one, remote
resolution simply never fires (the bundle isn't registered, or `resolve()`
returns `undefined`, exactly as if the bundle were absent). Pin the version
in the URL; an unpinned `@latest`-style URL means your rendered output can
silently change out from under you when the upstream package publishes.

## Recipe: hand-built manifest (no `@plantuml-ts` package)

`StdlibRemoteManifest` is a public, hand-constructible type (ADR-7) — it is
not gated behind the generator. A third party hosting their own icon set
writes one directly, with zero `@plantuml-ts` dependency:

```ts
import { remoteStdlib } from '@plantuml-ts/core';
import type { StdlibRemoteManifest } from '@plantuml-ts/core';

const myIcons: StdlibRemoteManifest = {
  name: 'my-icons',
  files: {
    star: 'star.puml',
    heart: 'icons/heart.puml',
  },
};

const bundle = remoteStdlib({
  manifest: myIcons,
  baseUrl: 'https://example.com/icons/',
});
```

`bundle` resolves per-resource exactly like a generator-emitted `tupadr3`
manifest would — nothing in `src/` special-cases the `@plantuml-ts` package
name or closes the bundle namespace.

## Failure modes

| Mode | Signal | What you do |
| --- | --- | --- |
| **Key not in the manifest** | `bundle.fetch(key)` resolves to `undefined`, with no network call at all | Almost always an authoring error — the `!include` target doesn't exist in this bundle/version. Check the include path and the manifest's `files` keys. |
| **Fetch failed for a listed key** | `bundle.fetch(key)` rejects with `StdlibResourceFetchError` (`bundle`, `key`, `url` on the error) | The manifest DOES list the key, so this is a deployment problem: bad `baseUrl`, host unreachable, or a 404 despite the manifest listing it. Verify the URL in the error is actually reachable. |
| **CORS / CSP block** | Same `StdlibResourceFetchError`, with a `CorsIncludeError`/`CspIncludeError` as its `cause` (from `fetchInclude` in `include-resolver.ts`) | The error message names the exact missing `Access-Control-Allow-Origin` response or `connect-src` directive. Fix the CORS headers on your static host, or extend your page's CSP `connect-src` to include the `baseUrl` origin. |

The failed-fetch case is **not cached** — the in-flight promise memo is
dropped on rejection, so retrying the same `!include` after fixing the
network condition works without a page reload.

## Observability (ADR-5)

`remoteStdlib({ manifest, baseUrl, fetcher })`'s optional `fetcher` argument
(defaulting to `fetchInclude`) is the injection point for observability —
this is a browser library with no metrics pipeline of its own, so wrap it:

```ts
const instrumented: IncludeFetcher = async (url) => {
  const start = performance.now();
  try {
    const text = await fetchInclude(url);
    metrics.record('stdlib.remote.fetch', { ok: true, ms: performance.now() - start });
    return text;
  } catch (err) {
    metrics.record('stdlib.remote.fetch', { ok: false, ms: performance.now() - start });
    throw err;
  }
};

const tupadr3 = remoteStdlib({ manifest, baseUrl, fetcher: instrumented });
```

What to watch, since there is no runbook — there is no service:

- **Fetch error rate** — spikes usually mean a `baseUrl`/CDN/CORS problem,
  not a code regression.
- **Requests per diagram** — each distinct icon a diagram includes is one
  request; a diagram with an unexpectedly high count may be pulling in an
  `*/all.puml` aggregator (see below) instead of individual icons.
- **p95 resource latency** — the manifest keeps requests small
  individually, but latency is still per-request; HTTP/2 multiplexing
  mitigates request-count cost, it does not erase it.

## What this does not solve (ADR-6, measured)

- **The manifest is a floor.** The generated `tupadr3` manifest gzips to
  **50.9 KiB (52,118 bytes)**, measured 2026-07-31 against the current
  vendored assets — a consumer pays that before a single icon resource
  loads. (ADR-6's original 49.6 KB figure was a pre-measurement projection;
  this is the re-measured number.) `awslib14`'s manifest was projected at
  8.3 KB gzip but has not been re-measured against current assets — treat
  that figure as unverified, not confirmed.
- **Request count scales with icon count.** A diagram using 50 icons makes
  ~51 requests (1 manifest fetch's worth of setup plus one per icon).
  HTTP/2 multiplexing mitigates the latency cost of many small requests; it
  does not erase it.
- **`awslib14`'s `*/all.puml` aggregators stay large.** Eleven of them run
  116–445 KB each (`Compute/all.puml` is 445 KB). `!include
  <awslib14/Compute/all>` still fetches the full 445 KB file — far better
  than the 7.93 MB eager bundle, but not small. Per-resource splitting only
  helps when a diagram includes individual icons, not aggregator files.
- **Bootstrap gets nothing from this.** The `bootstrap` sprite bundle is
  1.06 MB in ONE file carrying 2,078 sprites; per-resource splitting is a
  no-op there because there is only one resource to split. Per-sprite
  splitting for bootstrap is a separate, deferred mission (SI11b).

## What doesn't exist yet

The generator (`buildStdlibPackages()`) does not currently read
`spec.remoteModules` or emit a manifest module into the `@plantuml-ts/
stdlib-*` packages, and no package subpath is wired up to serve one. There
is **no `@plantuml-ts/stdlib-tupadr3/.../remote` import you can use today.**
The recipes above work now because they hand you (or you hand-construct)
a plain `StdlibRemoteManifest` object — that is the only consumer-facing
path that currently exists. A generated-package import path is coming with
the generated packages, once that generator work lands, and this document
will be updated at that point.
