# T6b — async pre-fetch into the asset store

Agent: `typescript-pro` (sonnet), worktree `sdd3-T6b`. Commit:
`feat(render): pre-fetch remote images through the ImageProvider`.
Read [../task-contract.md](../task-contract.md) first.

## Mechanism
Upstream (`klimt/creole/atom/AtomImg.java`): `create` routes `http:`/`https:`
srcs at `:165-169` — `.svg` -> `buildSvgFromUrl` `:223-233` (bytes as UTF-8 text
-> `AtomImgSvg(TileImageSvg)`), else `buildRasterFromUrl` `:211-221`; a null
`SURL`, or no bytes/decodable image, draws `(Cannot decode SVG: <url>)` /
`(Cannot decode: <url>)` (`:214,218,226,230`). Correction to the brief: the
`<img>` span is built at SIZING time in `creole-atoms.ts#buildImgSpan`
(`:316-325`, `cannotDecodeText` at `:322`), not in
`creole-atoms-image-resolver.ts` (`resolveImgAtom` `:253` only draws the
resolved atom). The port today has no store access at `buildImgSpan`; find
how emoji/`jar:` sprites reach `options.assetStore` (`sprite registry
.internal`, `internal-emoji-store.ts`) and thread the lookup the same way —
no module-level mutable state. `render()` (`index.ts:373-385`) is async;
`renderSync` (`:368`) is not.
Design: after `buildBlockUmls`, scan the PREPROCESSED block text with the same
pattern as `creole-atoms.ts:251` (`IMG_PATTERN_SOURCE`), keep `http:`/`https:`
srcs, dedupe, gate each through `isUrlOk(url, profile, allowlist)`
(`security/SURL.ts:48`, profile default `DEFAULT_SECURITY_PROFILE`), call
`options.imageProvider.fetch(url)`, and store each success in a store keyed
`remote-image:<url>` (the exact src after `stripImgSrc`). Failures/blocked
store nothing, so the draw path emits the jar's text. SVG bytes (src ends
`.svg`, or `mimeType` image/svg+xml) feed the existing `decodeSvgDataImage`
path via a `data:image/svg+xml;base64,` URI (as `AtomImg.java:152-161`); PNG
bytes via the existing data-URI PNG path; other raster formats fall to
`(Cannot decode: <url>)` and are reported as an open question (jar decodes any
ImageIO format).

## Targets
fifasu-62-pipo979 (with T6g's provider); no other row changes.

## Write-set
`src/core/remote-image-store.ts` (new: `REMOTE_IMAGE_ASSET_PREFIX =
'remote-image:'`, `remoteImageKey(url)`, store builder), `src/core/
remote-image-prefetch.ts` (new: `prefetchRemoteImages(preprocessedText,
options): Promise<AssetStore | undefined>`), `src/index.ts` (render,
renderPages, renderAll: merge the result with `combineAssetStores`),
`src/core/creole-atoms.ts` (`buildImgSpan` remote branch),
`src/core/creole-atoms-img.ts`, tests `tests/unit/core/remote-image-*.test.ts`.

## Read-set
`AtomImg.java:105-235`; `index.ts:290-310,368-420`; `creole-atoms.ts:240-335`;
`creole-atoms-img.ts:25-140`; `asset-store.ts`; `security/SURL.ts:40-60`;
`internal-emoji-store.ts:28-90`; T6a's `image-provider.ts`.

## Interface contracts
Asset key: `remote-image:<url>` (T6g serves the same key). Payload:
`{ bytes, mimeType }` from `ImageFetchResult`. `renderSync` reads the store if
the caller supplied `assetStore` containing such keys (the harness path), but
never calls a provider and never awaits.

## Acceptance
- Given a stub provider returning bytes for `http://x/a.svg`, when `render()`
  runs, then the provider is called once per unique url and the output draws
  the image (not the text); `renderSync` of the same source draws
  `(Cannot decode SVG: http://x/a.svg)`.
- Given `securityProfile: 'SANDBOX'`, then the provider is not called and the
  fallback text is drawn.
- Given a provider returning `{ failed }` or `{ blocked }`, then the fallback
  text is drawn and `render()` resolves.
- Given the 1042 pins, then all stay byte-equal; no conformant loss in any
  engine; `grep -n 'fetch\|await' src/core/creole-atoms*.ts` adds nothing (stop 17).

## Observability
N/A (provider messages belong to T6c/T6d).

## Rollback
Reversible.
