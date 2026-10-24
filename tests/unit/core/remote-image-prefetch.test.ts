/**
 * `render()` pre-fetches remote images through `RenderOptions.imageProvider`;
 * `renderSync` never calls a provider and draws the jar's fetch-failed text
 * (`AtomImg.java:165-169`, `:226,230`).
 */
import { describe, expect, it } from 'vitest';
import { SecurityProfile } from '../../../src/core/security/SecurityProfile.js';
import { prefetchRemoteImages } from '../../../src/core/remote-image-prefetch.js';
import { render, renderAll, renderPages, renderSync } from '../../../src/index.js';
import type { ImageFetchResult, ImageProvider, RenderOptions } from '../../../src/index.js';

const SVG = '<svg width="10" height="20" xmlns="http://www.w3.org/2000/svg"><g/></svg>';
const SVG_URL = 'http://img.example.com/a.svg';
const SOURCE = `@startuml\nA -> B : <img:${SVG_URL}>\nB -> A : <img:${SVG_URL}>\n@enduml`;
const FALLBACK = `(Cannot decode SVG: ${SVG_URL})`;
const IMAGE_HREF_PREFIX = 'xlink:href="data:image/svg+xml;base64,';
const PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVQI12NgAAIAAAUAAen63NgAAAAASUVORK5CYII=';

interface Stub {
  readonly provider: ImageProvider;
  readonly calls: string[];
}

function stubProvider(answer: (url: string) => ImageFetchResult): Stub {
  const calls: string[] = [];
  return {
    calls,
    provider: {
      fetch: (url: string): Promise<ImageFetchResult> => {
        calls.push(url);
        return Promise.resolve(answer(url));
      },
    },
  };
}

/** The SVG writer emits text spaces as U+00A0. */
const plain = (svg: string): string => svg.replaceAll('\u00a0', ' ');

const svgAnswer = (): ImageFetchResult => ({ bytes: new TextEncoder().encode(SVG), mimeType: 'image/svg+xml' });

describe('render() with an imageProvider', () => {
  it('calls the provider once per unique url and draws the image, not the text', async () => {
    const stub = stubProvider(svgAnswer);
    const svg = await render(SOURCE, { imageProvider: stub.provider });
    expect(stub.calls).toEqual([SVG_URL]);
    expect(svg.split(IMAGE_HREF_PREFIX).length - 1).toBe(2);
    expect(svg).not.toContain('Cannot decode');
  });

  it('serves renderPages and renderAll through the same path', async () => {
    const stub = stubProvider(svgAnswer);
    const pages = await renderPages(SOURCE, { imageProvider: stub.provider });
    const all = await renderAll(SOURCE, { imageProvider: stub.provider });
    expect(pages[0]).toContain(IMAGE_HREF_PREFIX);
    expect(all[0]).toContain(IMAGE_HREF_PREFIX);
  });

  it.each([
    ['failed', { failed: 'timeout' }],
    ['blocked', { blocked: 'policy' }],
  ] as const)('draws the fallback text when the provider reports %s', async (_label, result) => {
    const stub = stubProvider(() => result);
    const svg = await render(SOURCE, { imageProvider: stub.provider });
    expect(plain(svg)).toContain(FALLBACK);
    expect(svg).not.toContain(IMAGE_HREF_PREFIX);
  });

  it('survives a provider that rejects, drawing the fallback text', async () => {
    const provider: ImageProvider = { fetch: () => Promise.reject(new Error('boom')) };
    const svg = await render(SOURCE, { imageProvider: provider });
    expect(plain(svg)).toContain(FALLBACK);
  });

  it('does not call the provider under SANDBOX and draws the fallback text', async () => {
    const stub = stubProvider(svgAnswer);
    const svg = await render(SOURCE, { imageProvider: stub.provider, securityProfile: SecurityProfile.SANDBOX });
    expect(stub.calls).toEqual([]);
    expect(plain(svg)).toContain(FALLBACK);
  });

  it('draws a PNG fetched for a non-.svg url as a raster image', async () => {
    const bytes = Uint8Array.from(atob(PNG_B64), (c) => c.charCodeAt(0));
    const stub = stubProvider(() => ({ bytes, mimeType: 'image/png' }));
    const svg = await render('@startuml\nA -> B : <img:http://img.example.com/p.png>\n@enduml', {
      imageProvider: stub.provider,
    });
    expect(svg).toContain('xlink:href="data:image/png;base64,iVBORw0KGgo');
    expect(svg).not.toContain('Cannot decode');
  });

  it('draws the text for a raster the port cannot decode and says so through onWarning', async () => {
    const stub = stubProvider(() => ({ bytes: new Uint8Array([0xff, 0xd8, 0xff]), mimeType: 'image/jpeg' }));
    const warnings: string[] = [];
    const svg = await render('@startuml\nA -> B : <img:http://img.example.com/c.jpg>\n@enduml', {
      imageProvider: stub.provider,
      onWarning: (m) => warnings.push(m),
    });
    expect(plain(svg)).toContain('(Cannot decode: http://img.example.com/c.jpg)');
    expect(warnings).toEqual([expect.stringContaining('http://img.example.com/c.jpg')]);
  });
});

describe('renderSync', () => {
  it('never calls a provider and draws the jar fetch-failed text', () => {
    const stub = stubProvider(svgAnswer);
    const svg = renderSync(SOURCE, { imageProvider: stub.provider });
    expect(stub.calls).toEqual([]);
    expect(plain(svg)).toContain(FALLBACK);
  });

  it('draws the image from a caller-supplied remote-image store (the harness path)', () => {
    const options: RenderOptions = {
      assetStore: {
        get: (key) =>
          key === `remote-image:${SVG_URL}`
            ? { bytes: new TextEncoder().encode(SVG), mimeType: 'image/svg+xml' }
            : undefined,
        has: (key) => key === `remote-image:${SVG_URL}`,
      },
    };
    const svg = renderSync(SOURCE, options);
    expect(svg).toContain(IMAGE_HREF_PREFIX);
    expect(svg).not.toContain('Cannot decode');
  });
});

describe('prefetchRemoteImages', () => {
  it('returns undefined without a provider or without remote images', async () => {
    const stub = stubProvider(svgAnswer);
    expect(await prefetchRemoteImages(SOURCE, undefined)).toBeUndefined();
    expect(await prefetchRemoteImages('A -> B : hi', { imageProvider: stub.provider })).toBeUndefined();
    expect(stub.calls).toEqual([]);
  });

  it('stores each success under remote-image:<url> with the provider payload', async () => {
    const stub = stubProvider(svgAnswer);
    const store = await prefetchRemoteImages(SOURCE, { imageProvider: stub.provider });
    expect(store?.get(`remote-image:${SVG_URL}`)?.mimeType).toBe('image/svg+xml');
    expect(store?.get(`remote-image:${SVG_URL}`)?.bytes).toEqual(new TextEncoder().encode(SVG));
  });
});
