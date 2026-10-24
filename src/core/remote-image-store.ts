/**
 * The remote-image half of `<img:http(s)://...>`: the asset-store key scheme,
 * the scan that finds the urls, and the rewrite that hands a served image to
 * the existing `AtomImg.java:153-161` decode paths.
 *
 * Upstream fetches inside `AtomImg.create` (`AtomImg.java:165-169`, bytes via
 * `SURL#getBytes`). This port sizes and draws synchronously, so the async
 * `render()` family pre-fetches into an {@link AssetStore} under
 * `remote-image:<url>` (`remote-image-prefetch.ts`) and the synchronous
 * pipeline only READS it: {@link inlineRemoteImages} swaps a served
 * `<img:http://...>` for `<img:data:...>`, the form the creole layer already
 * sizes and draws, so no creole code gains a store parameter or a fetch.
 * An unserved url is left alone and draws the jar's fetch-failed text
 * (`cannotDecodeText`, `AtomImg.java:214,226`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/atom/AtomImg.java
 */

import type { AssetPayload, AssetStore } from './asset-store.js';
import { IMG_PATTERN_SOURCE } from './creole-atoms.js';
import { remoteImageToDataUri, stripImgSrc } from './creole-atoms-img.js';

/** Namespace prefix for fetched remote images inside a shared `AssetStore`. */
export const REMOTE_IMAGE_ASSET_PREFIX = 'remote-image:';

/** `AssetStore` key for one remote image: the src exactly as `stripImgSrc` leaves it. */
export function remoteImageKey(url: string): string {
  return `${REMOTE_IMAGE_ASSET_PREFIX}${url}`;
}

/** An `AssetStore` over already-keyed payloads. */
export function remoteImageStoreFrom(entries: ReadonlyMap<string, AssetPayload>): AssetStore {
  return {
    get: (key: string): AssetPayload | undefined => entries.get(key),
    has: (key: string): boolean => entries.has(key),
  };
}

/** `AtomImg.java:165`: `src.startsWith("http:") || src.startsWith("https:")`. */
export function isRemoteImageSrc(src: string): boolean {
  return src.startsWith('http:') || src.startsWith('https:');
}

/** Distinct `http(s):` srcs of the `<img>` atoms in `text`, scanned line by line like the creole layer does. */
export function scanRemoteImageSrcs(text: string): ReadonlySet<string> {
  const srcs = new Set<string>();
  const pattern = new RegExp(IMG_PATTERN_SOURCE, 'g');
  for (const line of text.split('\n')) {
    for (const m of line.matchAll(pattern)) {
      const src = stripImgSrc(m[1]!);
      if (isRemoteImageSrc(src)) srcs.add(src);
    }
  }
  return srcs;
}

/** The data URI for a served, decodable remote `src`; `undefined` leaves the `<img>` markup as written. */
function servedDataUri(src: string, assets: AssetStore): string | undefined {
  if (!isRemoteImageSrc(src)) return undefined;
  const payload = assets.get(remoteImageKey(src));
  return payload === undefined ? undefined : remoteImageToDataUri(src, payload.bytes);
}

/**
 * `text` with every served `<img:http(s)://...>` replaced by the
 * `<img:data:...>` the creole layer decodes (`AtomImg.java:153-161`); the
 * `{scale=N}` block is kept. Returns `text` itself when nothing changes.
 */
export function inlineRemoteImages(text: string, assets: AssetStore): string {
  const pattern = new RegExp(IMG_PATTERN_SOURCE, 'g');
  return text
    .split('\n')
    .map((line) =>
      line.replace(pattern, (whole: string, rawSrc: string, scaleBlock: string | undefined): string => {
        const uri = servedDataUri(stripImgSrc(rawSrc), assets);
        return uri === undefined ? whole : `<img:${uri}${scaleBlock ?? ''}>`;
      }),
    )
    .join('\n');
}

/**
 * `lines` with {@link inlineRemoteImages} applied to each; the very same array
 * when `assets` is absent or serves nothing (the parse then sees the exact
 * input it saw before remote images existed).
 */
export function inlineRemoteImageLines(lines: readonly string[], assets: AssetStore | undefined): readonly string[] {
  if (assets === undefined) return lines;
  const inlined = lines.map((line) => inlineRemoteImages(line, assets));
  return inlined.some((line, i) => line !== lines[i]) ? inlined : lines;
}
