import { describe, expect, it } from 'vitest';
import { createNetworkImageProvider } from '../../../src/image-providers/network.js';

const URL_ = 'https://example.test/a.svg';
const PREFIX = 'plantuml-ts network image provider: ';

function respond(body: Uint8Array, init: ResponseInit = {}): typeof fetch {
  return () => Promise.resolve(new Response(body as BodyInit, init));
}

function streamed(chunks: Uint8Array[], init: ResponseInit = {}): typeof fetch {
  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      for (const chunk of chunks) c.enqueue(chunk);
      c.close();
    },
  });
  return () => Promise.resolve(new Response(stream, init));
}

function warnings(): { log: string[]; onWarning: (m: string) => void } {
  const log: string[] = [];
  return { log, onWarning: (m) => log.push(m) };
}

describe('createNetworkImageProvider', () => {
  it('returns bytes and the bare mime type on 200', async () => {
    const w = warnings();
    const p = createNetworkImageProvider({
      fetch: respond(new Uint8Array(12), { headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' } }),
      onWarning: w.onWarning,
    });
    const r = await p.fetch(URL_);
    expect('bytes' in r && r.bytes.length).toBe(12);
    expect('bytes' in r && r.mimeType).toBe('image/svg+xml');
    expect(w.log).toEqual([]);
  });

  it('defaults the mime type to application/octet-stream', async () => {
    const p = createNetworkImageProvider({ fetch: respond(new Uint8Array(2)) });
    const r = await p.fetch(URL_);
    expect('mimeType' in r && r.mimeType).toBe('application/octet-stream');
  });

  it('times out, aborts the signal and warns once', async () => {
    let signal: AbortSignal | undefined;
    const w = warnings();
    const p = createNetworkImageProvider({
      timeoutMs: 20,
      fetch: (_u, init) => {
        signal = init?.signal ?? undefined;
        return new Promise<Response>(() => {});
      },
      onWarning: w.onWarning,
    });
    const r = await p.fetch(URL_);
    expect(r).toEqual({ failed: `timed out after 20 ms: ${URL_}` });
    expect(signal?.aborted).toBe(true);
    expect(w.log).toEqual([`${PREFIX}timed out after 20 ms: ${URL_}`]);
  });

  it('reports HTTP errors once', async () => {
    const w = warnings();
    const p = createNetworkImageProvider({
      fetch: respond(new Uint8Array(1), { status: 404 }),
      onWarning: w.onWarning,
    });
    expect(await p.fetch(URL_)).toEqual({ failed: `HTTP 404 for ${URL_}` });
    expect(w.log).toEqual([`${PREFIX}HTTP 404 for ${URL_}`]);
  });

  it('rejects an oversized Content-Length', async () => {
    const w = warnings();
    const p = createNetworkImageProvider({
      maxBytes: 5,
      fetch: respond(new Uint8Array(10), { headers: { 'Content-Length': '10' } }),
      onWarning: w.onWarning,
    });
    expect(await p.fetch(URL_)).toEqual({ failed: `exceeds 5 bytes: ${URL_}` });
    expect(w.log).toEqual([`${PREFIX}exceeds 5 bytes: ${URL_}`]);
  });

  it('rejects a streamed body past the cap', async () => {
    const p = createNetworkImageProvider({
      maxBytes: 5,
      fetch: streamed([new Uint8Array(3), new Uint8Array(3)]),
    });
    expect(await p.fetch(URL_)).toEqual({ failed: `exceeds 5 bytes: ${URL_}` });
  });

  it('concatenates streamed chunks within the cap', async () => {
    const p = createNetworkImageProvider({
      maxBytes: 6,
      fetch: streamed([Uint8Array.of(1, 2), Uint8Array.of(3)]),
    });
    const r = await p.fetch(URL_);
    expect('bytes' in r && Array.from(r.bytes)).toEqual([1, 2, 3]);
  });

  it('reads a bodyless response through arrayBuffer', async () => {
    const res = {
      ok: true,
      status: 200,
      headers: new Headers(),
      body: null,
      arrayBuffer: () => Promise.resolve(new Uint8Array(4).buffer),
    } as unknown as Response;
    const p = createNetworkImageProvider({ fetch: () => Promise.resolve(res) });
    const r = await p.fetch(URL_);
    expect('bytes' in r && r.bytes.length).toBe(4);
  });

  it('caps a bodyless response too', async () => {
    const res = {
      ok: true,
      status: 200,
      headers: new Headers(),
      body: null,
      arrayBuffer: () => Promise.resolve(new Uint8Array(9).buffer),
    } as unknown as Response;
    const p = createNetworkImageProvider({ maxBytes: 5, fetch: () => Promise.resolve(res) });
    expect(await p.fetch(URL_)).toEqual({ failed: `exceeds 5 bytes: ${URL_}` });
  });

  it('wraps thrown errors', async () => {
    const w = warnings();
    const p = createNetworkImageProvider({
      fetch: () => Promise.reject(new TypeError('boom')),
      onWarning: w.onWarning,
    });
    expect(await p.fetch(URL_)).toEqual({ failed: `boom: ${URL_}` });
    expect(w.log).toEqual([`${PREFIX}boom: ${URL_}`]);
  });

  it('wraps non-Error throws', async () => {
    const p = createNetworkImageProvider({
      // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors -- exercises a non-Error throw
      fetch: () => Promise.reject('nope'),
    });
    expect(await p.fetch(URL_)).toEqual({ failed: `nope: ${URL_}` });
  });

  it('uses globalThis.fetch by default and survives no onWarning', async () => {
    const original = globalThis.fetch;
    globalThis.fetch = respond(new Uint8Array(1), { status: 500 });
    try {
      const p = createNetworkImageProvider();
      expect(await p.fetch(URL_)).toEqual({ failed: `HTTP 500 for ${URL_}` });
    } finally {
      globalThis.fetch = original;
    }
  });
});
