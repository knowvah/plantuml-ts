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

The `bootstrap` sprite bundle is one 1.06 MB file, so per-resource
granularity cannot help it. It has its own, finer mechanism —
[per-sprite loading](#bootstrap-per-sprite-loading-si11b) via
`spriteSplitStdlib()`.

## Recipe: self-hosted assets

Each `@plantuml-ts/stdlib-*` package ships its raw `.puml` assets under
`assets/<bundleFolder>/` (e.g. `assets/tupadr3/`) — copy that directory into
a static directory your app already serves, and point `baseUrl` at it. Wrap
the manifest with `remoteStdlib()` and register the result as a
`stdlibRegistry()` thunk — never register a bare manifest directly (a
manifest is structurally identical to a `BundleData` at runtime, so the
registry would serve file PATHS as file CONTENT; the wrap is what supplies
`baseUrl` and turns it into a real `RemoteBundle`):

```ts
import { remoteStdlib, stdlibRegistry, render } from 'plantuml-ts';
import { tupadr3Remote } from '@plantuml-ts/stdlib-tupadr3/tupadr3.remote';

const registry = stdlibRegistry({
  tupadr3: () =>
    Promise.resolve(
      remoteStdlib({
        manifest: tupadr3Remote,
        baseUrl: 'https://static.example.com/plantuml-stdlib/tupadr3/',
      }),
    ),
});

await render(source, { stdlibRegistry: registry });
```

`stdlibRegistry` and `render` are both exported from `plantuml-ts`, and
`stdlibRegistry`'s result is a valid `RenderOptions.stdlibRegistry`.

**Publish status:** the `.remote` subpaths above exist in-repo today but
`npm publish` for the `@plantuml-ts/stdlib-*` packages is a separate,
maintainer-gated step (mission SI5b) that has not happened yet — you cannot
`npm install` them from the registry today. Until they're published, build
against the in-repo package source, or use the "hand-built manifest" recipe
below with your own copy of the manifest JSON.

This keeps the library's "offline unless you opt in" guarantee literally
true: no request leaves the process until you configure a `baseUrl` you
control.

## Recipe: pinned CDN

You may point `baseUrl` at a third-party CDN (jsDelivr, unpkg) yourself,
**with the version pinned**:

```ts
const tupadr3 = remoteStdlib({
  manifest: tupadr3Remote,
  baseUrl: 'https://cdn.jsdelivr.net/npm/@plantuml-ts/stdlib-tupadr3@1.4.0/assets/tupadr3/',
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
import { remoteStdlib } from 'plantuml-ts';
import type { StdlibRemoteManifest } from 'plantuml-ts';

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

- **The manifest is a floor.** Measured against the real emitted package
  output: the `tupadr3` manifest is **433,420 B raw / 51,803 B gzip
  (~51.8 KB)** against a 20,488,276 B (~20.5 MB) eager module, and the
  `awslib14` manifest is **71,848 B raw / 11,116 B gzip (~11.1 KB)** against
  an 8,319,265 B (~8.3 MB) eager module — a consumer pays the gzip figure
  before a single icon resource loads. (ADR-6's original projections — 49.6
  KB for tupadr3, 8.3 KB for awslib14 — are both superseded by these
  measurements; awslib14 in particular measures noticeably higher than
  projected.)
- **Request count scales with icon count.** A diagram using 50 icons makes
  ~51 requests (1 manifest fetch's worth of setup plus one per icon).
  HTTP/2 multiplexing mitigates the latency cost of many small requests; it
  does not erase it.
- **`awslib14`'s `*/all.puml` aggregators stay large.** Eleven of them run
  116–445 KB each (`Compute/all.puml` is 445 KB). `!include
  <awslib14/Compute/all>` still fetches the full 445 KB file — far better
  than the 7.93 MB eager bundle, but not small. Per-resource splitting only
  helps when a diagram includes individual icons, not aggregator files.
- **Bootstrap gets nothing from *this* mechanism** — it has its own, see
  below. The `bootstrap` sprite bundle is 1.06 MB in ONE file carrying 2,078
  sprites, so per-resource splitting is a no-op there: there is only one
  resource to split.

## Bootstrap: per-*sprite* loading (SI11b)

Per-sprite splitting shipped 2026-07-31 as a separate mechanism, one level
finer than the per-resource fetching described above. A `bootstrap` diagram
pays for the sprites it names rather than the file holding all 2,078 of
them.

Register it with `spriteSplitStdlib` instead of `remoteStdlib`. It takes the
generated name manifest (`@plantuml-ts/stdlib/bootstrap1.13.1/sprites.json`)
and derives each fragment's path by convention as `sprites/<name>.puml`:

```ts
import { spriteSplitStdlib, stdlibRegistry, render } from 'plantuml-ts';
import manifest from '@plantuml-ts/stdlib/bootstrap1.13.1/sprites.json' with { type: 'json' };

const registry = stdlibRegistry({
  'bootstrap1.13.1': () =>
    Promise.resolve(
      spriteSplitStdlib({ manifest, baseUrl: 'https://cdn.example.com/bootstrap1.13.1' }),
    ),
});
```

The prefetch walk then scans the diagram for `<$name>` references and
fetches only those fragments. **Measured end to end** on a 3-sprite diagram:
7,402 B manifest gzip + 2,066 B of fragments = **9,468 B against the
1,085,342 B whole-file path — a 99.128% reduction** on 3 fetches.

Two limits, stated rather than asserted away:

- **The manifest floor dominates at small N.** 7,402 B of gzip buys nothing
  by itself; at one sprite you pay all of it for ~431 B of content. This is
  the inverse of the per-resource case above, where bytes dominate — here
  **request count is the ceiling**, and a 20-sprite diagram makes ~21
  requests.
- **A `<$name>` produced by a macro is invisible to a source scan.** The
  prefetch sees raw source plus fetched include text, never macro-expanded
  text. Such a reference raises a named error rather than silently dropping
  an icon, and `RenderOptions.sprites` is the escape hatch for naming what
  the scan cannot see:

  ```ts
  await render(source, { stdlibRegistry: registry, sprites: ['bi-heart'] });
  ```

Sprite **names** are a flat, global, last-write-wins namespace per diagram —
two collections both defining `$star` collide, which is upstream
`SkinParam.sprites` behavior and is preserved. Pass
`RenderOptions.onWarning` to hear about it:

```ts
await render(source, { stdlibRegistry: registry, onWarning: (m) => console.warn(m) });
```

## Package subpaths and publish status

The generator now emits a `.remote` manifest module per bundle, and each
package ships its raw `.puml` assets alongside it under `assets/
<bundleFolder>/`:

- `@plantuml-ts/stdlib-tupadr3/tupadr3.remote` → exports `tupadr3Remote`
- `@plantuml-ts/stdlib-aws/awslib14.remote` → exports `awslib14Remote`
- `@plantuml-ts/stdlib-aws/awslib.remote` → exports `awslibRemote` (the
  `link:` alias to `awslib14` — `aliasOf: 'awslib14'`, empty `files`)
- `@plantuml-ts/stdlib/bootstrap1.13.1/sprites.json` → the per-sprite name
  manifest (SI11b), served alongside the 2,078 `sprites/<name>.puml`
  fragments in the same package

**These subpaths exist in-repo but are not yet installable.** `npm publish`
for the `@plantuml-ts/stdlib-*` packages remains a separate, maintainer-gated
step (mission SI5b) that has not run — the packages are not currently on the
npm registry. Until they are published, either build against the in-repo
package source directly, or use the hand-built-manifest recipe above with
your own copy of a manifest.
