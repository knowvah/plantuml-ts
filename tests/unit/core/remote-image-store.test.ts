/**
 * The remote-image asset channel: key scheme, the `<img>` scan, and the
 * bytes -> data-URI step that routes into the existing `AtomImg.java:153-161`
 * decode paths. Java branches: `AtomImg.java:165-169` (`.svg` -> SVG, else
 * raster), `:211-233` (the fallback texts).
 */
import { describe, expect, it } from 'vitest';
import type { AssetPayload, AssetStore } from '../../../src/core/asset-store.js';
import { remoteImageToDataUri } from '../../../src/core/creole-atoms-img.js';
import {
  REMOTE_IMAGE_ASSET_PREFIX,
  inlineRemoteImages,
  remoteImageKey,
  remoteImageStoreFrom,
  scanRemoteImageSrcs,
} from '../../../src/core/remote-image-store.js';

const SVG_BYTES = new TextEncoder().encode('<svg width="10" height="20" xmlns="http://www.w3.org/2000/svg"/>');
const SVG_B64 = btoa('<svg width="10" height="20" xmlns="http://www.w3.org/2000/svg"/>');
const PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVQI12NgAAIAAAUAAen63NgAAAAASUVORK5CYII=';
const PNG_BYTES = Uint8Array.from(atob(PNG_B64), (c) => c.charCodeAt(0));
const JPEG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]);

function storeOf(entries: Record<string, AssetPayload>): AssetStore {
  return remoteImageStoreFrom(new Map(Object.entries(entries)));
}

describe('remote image key scheme', () => {
  it('prefixes the exact src with remote-image:', () => {
    expect(REMOTE_IMAGE_ASSET_PREFIX).toBe('remote-image:');
    expect(remoteImageKey('http://x/a.svg')).toBe('remote-image:http://x/a.svg');
  });

  it('serves payloads by the url key and misses on anything else', () => {
    const payload = { bytes: SVG_BYTES, mimeType: 'image/svg+xml' };
    const store = storeOf({ [remoteImageKey('http://x/a.svg')]: payload });
    expect(store.get('remote-image:http://x/a.svg')).toBe(payload);
    expect(store.has('remote-image:http://x/a.svg')).toBe(true);
    expect(store.get('remote-image:http://x/b.svg')).toBeUndefined();
    expect(store.has('emoji:1f680.svg')).toBe(false);
  });
});

describe('scanRemoteImageSrcs', () => {
  it('keeps http: and https: srcs, strips src= and quotes, dedupes', () => {
    const text = [
      'A -> B : <img:http://x/a.svg>',
      'B -> A : <img src="https://x/b.png"{scale=2}> and <img:http://x/a.svg>',
      'note : <img:data:image/png;base64,AAAA> <img:foo/bar.svg>',
    ].join('\n');
    expect([...scanRemoteImageSrcs(text)]).toEqual(['http://x/a.svg', 'https://x/b.png']);
  });

  it('is case-sensitive on the scheme, like AtomImg.java:165', () => {
    expect([...scanRemoteImageSrcs('<img:HTTP://x/a.svg>')]).toEqual([]);
  });
});

describe('remoteImageToDataUri', () => {
  it('routes a .svg url to the svg data URI (AtomImg.java:166-167)', () => {
    expect(remoteImageToDataUri('http://x/a.svg', SVG_BYTES)).toBe(`data:image/svg+xml;base64,${SVG_B64}`);
  });

  it('routes any other url with PNG bytes to the png data URI (AtomImg.java:169)', () => {
    expect(remoteImageToDataUri('http://x/a', PNG_BYTES)).toBe(`data:image/png;base64,${PNG_B64}`);
  });

  it('declines a raster the port cannot decode (jpeg bytes)', () => {
    expect(remoteImageToDataUri('http://x/a.jpg', JPEG_BYTES)).toBeUndefined();
  });

  it('declines svg bytes behind a non-.svg url: the jar reads them as raster (AtomImg.java:169,214)', () => {
    expect(remoteImageToDataUri('http://x/a', SVG_BYTES)).toBeUndefined();
  });
});

describe('inlineRemoteImages', () => {
  const store = storeOf({
    'remote-image:http://x/a.svg': { bytes: SVG_BYTES, mimeType: 'image/svg+xml' },
    'remote-image:http://x/p.png': { bytes: PNG_BYTES, mimeType: 'image/png' },
    'remote-image:http://x/c.jpg': { bytes: JPEG_BYTES, mimeType: 'image/jpeg' },
  });

  it('replaces a served src with its data URI and keeps the scale block', () => {
    expect(inlineRemoteImages('m : <img src="http://x/a.svg"{scale=2}> t', store)).toBe(
      `m : <img:data:image/svg+xml;base64,${SVG_B64}{scale=2}> t`,
    );
    expect(inlineRemoteImages('<img:http://x/p.png>', store)).toBe(`<img:data:image/png;base64,${PNG_B64}>`);
  });

  it('leaves unserved, undecodable, data and file srcs untouched', () => {
    const line = '<img:http://x/missing.svg> <img:http://x/c.jpg> <img:data:image/png;base64,AAAA> <img:a/b.svg>';
    expect(inlineRemoteImages(line, store)).toBe(line);
  });

  it('returns the text itself when nothing is rewritten', () => {
    expect(inlineRemoteImages('A -> B : hi', store)).toBe('A -> B : hi');
  });
});
