# Batch 6 — ImageProvider and `%filename()` (D3, D4)

Two approved public-API additions (stop 10): `RenderOptions.imageProvider`
(with the `ImageProvider` type and a new `image-providers` entry point) and
`RenderOptions.filename`. D3: the jar fetches `<img:http(s)://…>`
(`klimt/creole/atom/AtomImg.java:165-169`); the port is sync, DOM-free and
network-free, so `render()` (async) pre-fetches through an injectable
provider into the asset-store seam and the sync pipeline reads it there;
`renderSync` never fetches and keeps drawing the jar's text
(`(Cannot decode SVG: <url>)` / `(Cannot decode: <url>)`, `AtomImg.java:
211-233`, ported at `creole-atoms-img.ts:48-52`). Targets: fifasu-62-pipo979
(ws 57, remote `.svg`; the golden holds the fetched bytes as a base64 data
URI) and tifube-59-tezo313 (ws 21, `%filename()`). File ownership across
parallel tasks: T6a owns the public types and the `filename` plumbing in
`index.ts`; T6b owns the pre-fetch (`index.ts` render paths, new modules);
T6c, T6d, T6f write disjoint files. Core batch: all-engine survey at close
(stop 4); non-sequence movers must be zero (no other fixture has a remote
`<img>` that a provider-less run would change).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T6a](T6a-public-api.md) | `ImageProvider` type, `RenderOptions.imageProvider`/`filename`, filename plumbing | typescript-pro (sonnet) | `src/core/image-provider.ts`, `render-options.ts`, `index.ts`, `preprocessor.ts` (type only) + tests | B5 | [ ] |
| [T6b](T6b-prefetch.md) | async pre-fetch into the asset store; image resolver reads it | typescript-pro (sonnet) | `src/core/remote-image-store.ts`, `remote-image-prefetch.ts`, `index.ts`, `creole-atoms.ts`, `creole-atoms-img.ts` + tests | T6a | [ ] |
| [T6c](T6c-network-provider.md) | network provider (global `fetch`, timeout, size cap) | typescript-pro (sonnet) | `src/image-providers/network.ts` + tests | T6a | [ ] |
| [T6d](T6d-browser-provider.md) | browser provider (CORS fetch, CSP pre-check, warnings) | typescript-pro (sonnet) | `src/image-providers/browser.ts`, `csp.ts` + tests | T6a | [ ] |
| [T6e](T6e-packaging-docs.md) | subpath export, build, README, docs page | typescript-pro (sonnet) | `package.json`, `vite.config.ts`, `src/image-providers/index.ts`, `README.md`, `docs-site/guide/image-providers.md`, `docs-site/.vitepress/config.ts` | T6c, T6d | [ ] |
| [T6f](T6f-filename.md) | `%filename()` from `RenderOptions.filename` | typescript-pro (sonnet) | `src/core/preprocessor.ts`, harness `render-fixture-sequence.ts` + tests | T6a | [ ] |
| [T6g](T6g-harness-provider.md) | harness provider serving the golden's bytes for fifasu-62 | typescript-pro (sonnet) | `tests/oracle/svg-conformance/` helper + fixture asset | T6b, T6f | [ ] |
| close | standard close as `b6`; pin tifube and fifasu if zero | orchestrator | per close-procedure | T6a–T6g | [ ] |

Parallel after T6a: T6b, T6c, T6d, T6f (disjoint write-sets; T6a is the only
task that touches `index.ts` before T6b).
