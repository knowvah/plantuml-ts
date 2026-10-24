import { describe, expect, it } from 'vitest';
import type { ImageFetchResult, ImageProvider } from '../../../src/index.js';
import type { RenderOptions } from '../../../src/index.js';

const BYTES = new Uint8Array([1, 2, 3]);

function describeResult(r: ImageFetchResult): string {
  if ('bytes' in r) return `bytes:${r.mimeType}:${r.bytes.length}`;
  if ('blocked' in r) return `blocked:${r.blocked}`;
  return `failed:${r.failed}`;
}

describe('ImageProvider contract types', () => {
  it('accepts all three ImageFetchResult shapes through RenderOptions', async () => {
    const results: ImageFetchResult[] = [
      { bytes: BYTES, mimeType: 'image/png' },
      { blocked: 'policy' },
      { failed: 'timeout' },
    ];
    const provider: ImageProvider = {
      fetch: (url: string): Promise<ImageFetchResult> => Promise.resolve(results[url.length % 3]!),
    };
    const options: RenderOptions = { imageProvider: provider, filename: 'a.puml' };
    expect(options.filename).toBe('a.puml');
    const out = await Promise.all(['abc', 'abcd', 'abcde'].map((u) => options.imageProvider!.fetch(u)));
    expect(out.map(describeResult)).toEqual(['bytes:image/png:3', 'blocked:policy', 'failed:timeout']);
  });

  it('leaves existing option objects valid without the new fields', () => {
    const options: RenderOptions = { maxWidth: 10 };
    expect(options.imageProvider).toBeUndefined();
    expect(options.filename).toBeUndefined();
  });
});
