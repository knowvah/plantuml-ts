/**
 * Browser image provider: CSP pre-check, per-origin warning, timeout and the
 * violation listener. `document`, `fetch` and `onWarning` are always injected;
 * the browser behaviour they stand for is quoted in `browser.ts` (MDN, CSP3).
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  createBrowserImageProvider,
  type BrowserDocumentLike,
  type BrowserProviderOptions,
} from '../../../src/image-providers/browser';
import type { ImageFetchResult } from '../../../src/core/image-provider';

const APP = 'https://app.test';
const IMG_URL = 'https://img.example/a.svg';
const IMG_ORIGIN = 'https://img.example';
const SVG_MIME = 'image/svg+xml';
const BYTES = new Uint8Array([60, 115, 118, 103, 62]);
const VIOLATION_PREFIX = '(reported by the browser) ';

/** The warning text the spec fixes (T6d "Observability"). */
function blockedText(origin: string, directive: string): string {
  return (
    `plantuml-ts: image from ${origin} blocked by Content-Security-Policy ` +
    `directive ${directive}; add ${origin} to connect-src (or pass a ` +
    `different imageProvider)`
  );
}

interface ViolationEvent {
  blockedURI: string;
  effectiveDirective: string;
}

/** A `Document` stand-in: meta tags are mutable, listeners are recorded. */
function stubDocument(metaContents: string[], origin: string = APP) {
  const listeners: Array<(event: ViolationEvent) => void> = [];
  const addEventListener = vi.fn((_type: string, listener: (event: ViolationEvent) => void) => {
    listeners.push(listener);
  });
  const querySelectorAll = vi.fn(() =>
    metaContents.map((content) => ({
      getAttribute: (name: string): string | null =>
        name === 'http-equiv' ? 'Content-Security-Policy' : name === 'content' ? content : null,
    })),
  );
  const document: BrowserDocumentLike = {
    head: { querySelectorAll },
    location: { origin },
    addEventListener,
  };
  return { document, listeners, addEventListener, querySelectorAll };
}

function okFetch() {
  return vi.fn((_url: string | URL | Request, _init?: RequestInit) =>
    Promise.resolve(new Response(BYTES, { headers: { 'content-type': SVG_MIME } })),
  );
}

function setup(metaContents: string[], extra: Omit<BrowserProviderOptions, 'document' | 'fetch' | 'onWarning'> = {}) {
  const doc = stubDocument(metaContents);
  const fetchStub = okFetch();
  const warnings: string[] = [];
  const provider = createBrowserImageProvider({
    ...extra,
    document: doc.document,
    fetch: fetchStub,
    onWarning: (message) => warnings.push(message),
  });
  return { provider, fetchStub, warnings, ...doc };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createBrowserImageProvider: CSP pre-check', () => {
  it("meta connect-src 'self' blocks a cross-origin url without fetching", async () => {
    const { provider, fetchStub, warnings } = setup(["connect-src 'self'"]);
    const first = await provider.fetch(IMG_URL);
    await provider.fetch(IMG_URL);
    await provider.fetch('https://img.example/b.svg');
    const expected = blockedText(IMG_ORIGIN, 'connect-src');
    expect(first).toEqual({ blocked: expected });
    expect(fetchStub).not.toHaveBeenCalled();
    expect(warnings).toEqual([expected]);
  });

  it('warns once per origin, not once per provider', async () => {
    const { provider, warnings } = setup(["connect-src 'self'"]);
    await provider.fetch(IMG_URL);
    await provider.fetch('https://other.example/x.svg');
    expect(warnings).toEqual([
      blockedText(IMG_ORIGIN, 'connect-src'),
      blockedText('https://other.example', 'connect-src'),
    ]);
  });

  it('names default-src when it is the blocking directive', async () => {
    const { provider, warnings } = setup(["default-src 'self'"]);
    await provider.fetch(IMG_URL);
    expect(warnings).toEqual([blockedText(IMG_ORIGIN, 'default-src')]);
  });

  it('default-src is the fallback when there is no connect-src', async () => {
    const { provider, fetchStub } = setup(['default-src https://img.example']);
    const result = await provider.fetch(IMG_URL);
    expect(result).toEqual({ bytes: BYTES, mimeType: SVG_MIME });
    expect(fetchStub).toHaveBeenCalledTimes(1);
  });

  it('*.example.com allows a deep subdomain and blocks the bare host', async () => {
    const { provider, fetchStub } = setup(['connect-src *.example.com']);
    const allowed = await provider.fetch('https://a.b.example.com/x');
    const blocked = await provider.fetch('https://example.com/x');
    expect(allowed).toMatchObject({ mimeType: SVG_MIME });
    expect(blocked).toEqual({
      blocked: blockedText('https://example.com', 'connect-src'),
    });
    expect(fetchStub).toHaveBeenCalledTimes(1);
  });

  it('merges cspPolicy with the meta policies; every policy must allow', async () => {
    const { provider, fetchStub } = setup(['connect-src *'], {
      cspPolicy: "connect-src 'self'",
    });
    expect(await provider.fetch(IMG_URL)).toEqual({
      blocked: blockedText(IMG_ORIGIN, 'connect-src'),
    });
    expect(fetchStub).not.toHaveBeenCalled();
  });

  it('splits a cspPolicy header list on commas', async () => {
    const { provider } = setup([], {
      cspPolicy: "connect-src *, connect-src 'self'",
    });
    expect(await provider.fetch(IMG_URL)).toEqual({
      blocked: blockedText(IMG_ORIGIN, 'connect-src'),
    });
  });

  it('reads the meta tags on every call', async () => {
    const meta: string[] = [];
    const doc = stubDocument(meta);
    const provider = createBrowserImageProvider({
      document: doc.document,
      fetch: okFetch(),
      onWarning: () => undefined,
    });
    expect(await provider.fetch(IMG_URL)).toMatchObject({ bytes: BYTES });
    meta.push("connect-src 'self'");
    expect(await provider.fetch(IMG_URL)).toHaveProperty('blocked');
    expect(doc.querySelectorAll).toHaveBeenCalledTimes(2);
  });

  it('ignores meta tags that are not CSP or carry no content', async () => {
    const doc = stubDocument([]);
    doc.querySelectorAll.mockReturnValue([
      { getAttribute: (n: string) => (n === 'http-equiv' ? 'refresh' : "connect-src 'none'") },
      {
        getAttribute: (n: string) => (n === 'http-equiv' ? 'content-security-policy' : null),
      },
      {
        getAttribute: (n: string) => (n === 'http-equiv' ? 'content-security-policy' : ''),
      },
    ]);
    const provider = createBrowserImageProvider({
      document: doc.document,
      fetch: okFetch(),
      onWarning: () => undefined,
    });
    expect(await provider.fetch(IMG_URL)).toMatchObject({ bytes: BYTES });
  });

  it('copes with a document that has no head', async () => {
    const doc = stubDocument([]);
    const provider = createBrowserImageProvider({
      document: { ...doc.document, head: null },
      fetch: okFetch(),
      onWarning: () => undefined,
    });
    expect(await provider.fetch(IMG_URL)).toMatchObject({ bytes: BYTES });
  });

  it('works without a document: cspPolicy only, opaque page origin', async () => {
    vi.stubGlobal('document', undefined);
    try {
      const warnings: string[] = [];
      const provider = createBrowserImageProvider({
        cspPolicy: "connect-src 'self'",
        fetch: okFetch(),
        onWarning: (m) => warnings.push(m),
      });
      expect(await provider.fetch(IMG_URL)).toHaveProperty('blocked');
      expect(warnings).toHaveLength(1);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('uses globalThis.document by default', async () => {
    const doc = stubDocument(["connect-src 'self'"]);
    vi.stubGlobal('document', doc.document);
    try {
      const provider = createBrowserImageProvider({
        fetch: okFetch(),
        onWarning: () => undefined,
      });
      expect(await provider.fetch(IMG_URL)).toHaveProperty('blocked');
      expect(doc.addEventListener).toHaveBeenCalledTimes(1);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('fails an unparsable url without fetching', async () => {
    const { provider, fetchStub } = setup([]);
    const result = await provider.fetch('not a url');
    expect(result).toEqual({ failed: 'invalid image url: not a url' });
    expect(fetchStub).not.toHaveBeenCalled();
  });
});

describe('createBrowserImageProvider: fetch', () => {
  it('fetches with CORS, no credentials and an abort signal', async () => {
    const { provider, fetchStub } = setup([]);
    await provider.fetch(IMG_URL);
    const [url, init] = fetchStub.mock.calls[0] ?? [];
    expect(url).toBe(IMG_URL);
    expect(init?.mode).toBe('cors');
    expect(init?.credentials).toBe('omit');
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it('strips content-type parameters and lowercases the mime type', async () => {
    const fetchStub = vi.fn(() =>
      Promise.resolve(
        new Response(BYTES, {
          headers: { 'content-type': 'Image/PNG; charset=binary' },
        }),
      ),
    );
    const provider = createBrowserImageProvider({
      document: stubDocument([]).document,
      fetch: fetchStub,
    });
    expect(await provider.fetch(IMG_URL)).toEqual({
      bytes: BYTES,
      mimeType: 'image/png',
    });
  });

  it('falls back to application/octet-stream without a content-type', async () => {
    const fetchStub = vi.fn(() => Promise.resolve(new Response(BYTES, { headers: {} })));
    const provider = createBrowserImageProvider({
      document: stubDocument([]).document,
      fetch: fetchStub,
    });
    const result = await provider.fetch(IMG_URL);
    expect(result).toMatchObject({ mimeType: 'application/octet-stream' });
  });

  it('fails a non-2xx status with the status in the reason', async () => {
    const fetchStub = vi.fn(() => Promise.resolve(new Response('no', { status: 404 })));
    const provider = createBrowserImageProvider({
      document: stubDocument([]).document,
      fetch: fetchStub,
    });
    expect(await provider.fetch(IMG_URL)).toEqual({
      failed: `HTTP 404 fetching ${IMG_URL}`,
    });
  });

  it('fails a declared content-length above maxBytes', async () => {
    const fetchStub = vi.fn(() => Promise.resolve(new Response(BYTES, { headers: { 'content-length': '999' } })));
    const provider = createBrowserImageProvider({
      document: stubDocument([]).document,
      fetch: fetchStub,
      maxBytes: 100,
    });
    expect(await provider.fetch(IMG_URL)).toEqual({
      failed: `image at ${IMG_URL} exceeds the 100 byte limit`,
    });
  });

  it('fails a streamed body that grows past maxBytes and cancels it', async () => {
    const cancel = vi.fn();
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(new Uint8Array(60));
      },
      cancel,
    });
    const fetchStub = vi.fn(() => Promise.resolve(new Response(stream)));
    const provider = createBrowserImageProvider({
      document: stubDocument([]).document,
      fetch: fetchStub,
      maxBytes: 100,
    });
    expect(await provider.fetch(IMG_URL)).toEqual({
      failed: `image at ${IMG_URL} exceeds the 100 byte limit`,
    });
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it('concatenates a multi-chunk body', async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2]));
        controller.enqueue(new Uint8Array([3]));
        controller.close();
      },
    });
    const fetchStub = vi.fn(() => Promise.resolve(new Response(stream)));
    const provider = createBrowserImageProvider({
      document: stubDocument([]).document,
      fetch: fetchStub,
    });
    expect(await provider.fetch(IMG_URL)).toMatchObject({
      bytes: new Uint8Array([1, 2, 3]),
    });
  });

  it('reads a body-less response through arrayBuffer within the cap', async () => {
    const response = new Response(null, { status: 200 });
    vi.spyOn(response, 'arrayBuffer').mockResolvedValue(BYTES.buffer);
    const provider = createBrowserImageProvider({
      document: stubDocument([]).document,
      fetch: vi.fn(() => Promise.resolve(response)),
    });
    expect(await provider.fetch(IMG_URL)).toMatchObject({ bytes: BYTES });
  });

  it('fails a body-less response whose bytes exceed maxBytes', async () => {
    const response = new Response(null, { status: 200 });
    vi.spyOn(response, 'arrayBuffer').mockResolvedValue(new ArrayBuffer(50));
    const provider = createBrowserImageProvider({
      document: stubDocument([]).document,
      fetch: vi.fn(() => Promise.resolve(response)),
      maxBytes: 10,
    });
    expect(await provider.fetch(IMG_URL)).toEqual({
      failed: `image at ${IMG_URL} exceeds the 10 byte limit`,
    });
  });

  it('reports a rejected fetch as failed, naming the likely causes', async () => {
    const fetchStub = vi.fn(() => Promise.reject(new TypeError('Failed to fetch')));
    const provider = createBrowserImageProvider({
      document: stubDocument([]).document,
      fetch: fetchStub,
    });
    const result: ImageFetchResult = await provider.fetch(IMG_URL);
    expect(result).toEqual({
      failed:
        `could not fetch ${IMG_URL}: Failed to fetch ` +
        '(network error, missing CORS header or Content-Security-Policy)',
    });
  });

  it('reports a non-Error rejection reason as text', async () => {
    const provider = createBrowserImageProvider({
      document: stubDocument([]).document,
      fetch: vi.fn<typeof fetch>().mockRejectedValue('boom'),
    });
    const result = await provider.fetch(IMG_URL);
    expect(result).toEqual({
      failed: `could not fetch ${IMG_URL}: boom ` + '(network error, missing CORS header or Content-Security-Policy)',
    });
  });

  it('times out a fetch that never settles and aborts it', async () => {
    let signal: AbortSignal | null | undefined;
    const fetchStub = vi.fn((_url: string | URL | Request, init?: RequestInit) => {
      signal = init?.signal;
      return new Promise<Response>(() => undefined);
    });
    const provider = createBrowserImageProvider({
      document: stubDocument([]).document,
      fetch: fetchStub,
      timeoutMs: 20,
    });
    const result = await provider.fetch(IMG_URL);
    expect(result).toEqual({
      failed: `timed out after 20 ms fetching ${IMG_URL}`,
    });
    expect(signal?.aborted).toBe(true);
  });

  it('defaults to a 5000 ms timeout and a 10 MiB cap', async () => {
    vi.useFakeTimers();
    try {
      const fetchStub = vi.fn(() => new Promise<Response>(() => undefined));
      const provider = createBrowserImageProvider({
        document: stubDocument([]).document,
        fetch: fetchStub,
      });
      const pending = provider.fetch(IMG_URL);
      await vi.advanceTimersByTimeAsync(4999);
      let settled = false;
      void pending.then(() => {
        settled = true;
      });
      await vi.advanceTimersByTimeAsync(0);
      expect(settled).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      expect(await pending).toEqual({
        failed: `timed out after 5000 ms fetching ${IMG_URL}`,
      });
    } finally {
      vi.useRealTimers();
    }
    const big = vi.fn(() =>
      Promise.resolve(
        new Response(BYTES, {
          headers: { 'content-length': String(10 * 1024 * 1024 + 1) },
        }),
      ),
    );
    const provider = createBrowserImageProvider({
      document: stubDocument([]).document,
      fetch: big,
    });
    expect(await provider.fetch(IMG_URL)).toEqual({
      failed: `image at ${IMG_URL} exceeds the ${10 * 1024 * 1024} byte limit`,
    });
  });
});

describe('createBrowserImageProvider: securitypolicyviolation', () => {
  function violation(blockedURI: string, effectiveDirective = 'connect-src') {
    return { blockedURI, effectiveDirective };
  }

  it('registers the listener once, on the first fetch', async () => {
    const { provider, addEventListener } = setup([]);
    expect(addEventListener).not.toHaveBeenCalled();
    await provider.fetch(IMG_URL);
    await provider.fetch(IMG_URL);
    await provider.fetch(IMG_URL);
    expect(addEventListener).toHaveBeenCalledTimes(1);
    expect(addEventListener.mock.calls[0]?.[0]).toBe('securitypolicyviolation');
  });

  it('warns once, prefixed, naming the origin of a blocked url', async () => {
    const { provider, listeners, warnings } = setup([]);
    await provider.fetch(IMG_URL);
    listeners[0]?.(violation(IMG_URL));
    listeners[0]?.(violation(IMG_URL));
    expect(warnings).toEqual([VIOLATION_PREFIX + blockedText(IMG_ORIGIN, 'connect-src')]);
  });

  it('shares the per-origin dedupe with the pre-check', async () => {
    const { provider, listeners, warnings } = setup(["connect-src 'self'"]);
    await provider.fetch(IMG_URL);
    listeners[0]?.(violation(IMG_URL));
    expect(warnings).toEqual([blockedText(IMG_ORIGIN, 'connect-src')]);
  });

  it('ignores other directives and non-http(s) or unparsable targets', async () => {
    const { provider, listeners, warnings } = setup([]);
    await provider.fetch(IMG_URL);
    listeners[0]?.(violation(IMG_URL, 'script-src'));
    listeners[0]?.(violation('inline'));
    listeners[0]?.(violation('data'));
    listeners[0]?.(violation('data:image/png;base64,AAAA'));
    expect(warnings).toEqual([]);
  });
});

describe('createBrowserImageProvider: default onWarning', () => {
  it('writes to console.warn', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const provider = createBrowserImageProvider({
      document: stubDocument(["connect-src 'self'"]).document,
      fetch: okFetch(),
    });
    await provider.fetch(IMG_URL);
    expect(warn).toHaveBeenCalledExactlyOnceWith(blockedText(IMG_ORIGIN, 'connect-src'));
  });
});

describe('BrowserDocumentLike', () => {
  it('accepts a real Document structurally (compile-time)', () => {
    const accepts = (real: Document): BrowserDocumentLike => real;
    expect(typeof accepts).toBe('function');
  });
});
