/**
 * The async half of remote images: `render()` asks the host's
 * {@link ImageProvider} for every `<img:http(s)://...>` url in a block and
 * hands the successes to the synchronous pipeline as an {@link AssetStore}
 * (key scheme and read side: `remote-image-store.ts`).
 *
 * This is the ONLY place the remote-image path awaits. `renderSync` and
 * everything under `src/core/` stay synchronous and network-free: they read
 * the store, never call the provider. Upstream fetches in `AtomImg.create`
 * (`AtomImg.java:165-169`, `buildSvgFromUrl` `:223-233`, `buildRasterFromUrl`
 * `:211-221`); access is gated by `SURL#isUrlOk` first (`SURL.java:184,200`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/atom/AtomImg.java
 */

import { combineAssetStores, type AssetPayload, type AssetStore } from './asset-store.js';
import { remoteImageToDataUri } from './creole-atoms-img.js';
import type { ImageFetchResult } from './image-provider.js';
import { remoteImageKey, remoteImageStoreFrom, scanRemoteImageSrcs } from './remote-image-store.js';
import type { RenderOptions } from './render-options.js';
import { DEFAULT_SECURITY_PROFILE } from './security/SecurityProfile.js';
import { isUrlOk } from './security/SURL.js';

type Fetched = readonly [url: string, payload: AssetPayload | undefined];

/** A provider that breaks its never-rejects contract is a failed fetch, not a failed render. */
async function fetchSafely(options: RenderOptions, url: string): Promise<ImageFetchResult> {
  try {
    return await options.imageProvider!.fetch(url);
  } catch (err) {
    return { failed: err instanceof Error ? err.message : String(err) };
  }
}

/** One url's payload; `undefined` for failed/blocked results and for bytes the port cannot decode (warned). */
async function fetchOne(options: RenderOptions, url: string): Promise<Fetched> {
  const result = await fetchSafely(options, url);
  if (!('bytes' in result)) return [url, undefined];
  if (remoteImageToDataUri(url, result.bytes) === undefined) {
    options.onWarning?.(`remote image ${url}: only SVG and PNG are decoded; drawn as text`);
    return [url, undefined];
  }
  return [url, { bytes: result.bytes, mimeType: result.mimeType }];
}

/**
 * Fetches every distinct remote image `preprocessedText` names through
 * `options.imageProvider`, once per url, after the `SURL#isUrlOk` gate for
 * `options.securityProfile`/`urlAllowlist` (SANDBOX: no call at all).
 *
 * @returns a store keyed `remote-image:<url>` holding the successes, or
 *   `undefined` when there is no provider or nothing to fetch. A failed or
 *   blocked url is simply absent, so the draw path emits the jar's
 *   `(Cannot decode[ SVG]: <url>)` text. Never rejects.
 */
export async function prefetchRemoteImages(
  preprocessedText: string,
  options: RenderOptions | undefined,
): Promise<AssetStore | undefined> {
  if (options?.imageProvider === undefined) return undefined;
  const profile = options.securityProfile ?? DEFAULT_SECURITY_PROFILE;
  const allowlist = options.urlAllowlist ?? [];
  const urls = [...scanRemoteImageSrcs(preprocessedText)].filter((url) => isUrlOk(url, profile, allowlist));
  if (urls.length === 0) return undefined;
  const fetched = await Promise.all(urls.map((url) => fetchOne(options, url)));
  const served = new Map<string, AssetPayload>();
  for (const [url, payload] of fetched) if (payload !== undefined) served.set(remoteImageKey(url), payload);
  return served.size === 0 ? undefined : remoteImageStoreFrom(served);
}

/** `options` with the pre-fetched images layered over the caller's own `assetStore` (theirs still resolves everything else). */
export async function withRemoteImages(
  preprocessedText: string,
  options: RenderOptions | undefined,
): Promise<RenderOptions | undefined> {
  const fetched = await prefetchRemoteImages(preprocessedText, options);
  if (fetched === undefined) return options;
  const own = options?.assetStore;
  return { ...options, assetStore: own === undefined ? fetched : combineAssetStores(fetched, own) };
}
