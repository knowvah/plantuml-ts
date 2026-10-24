/**
 * The browser {@link ImageProvider}: `fetch()` in CORS mode, preceded by a
 * pre-check against the page's Content Security Policy so a blocked origin is
 * skipped with one clear warning instead of a console error per image.
 *
 * Browser facts (MDN, verified 2026-10-22), which fix the design:
 * - a hidden `<img>` cannot supply bytes: a cross-origin image drawn to a
 *   canvas taints it (`toDataURL`/`getImageData` throw) and SVG source text is
 *   never exposed -- so the provider uses `fetch()` with `mode: 'cors'`, which
 *   needs the server's CORS header and the page's `connect-src`;
 * - JS cannot read a policy delivered in a header, but it can read one
 *   delivered by `<meta http-equiv="Content-Security-Policy">`
 *   (CSP3 3.3, https://www.w3.org/TR/CSP3/#meta-element) -- the optional
 *   `cspPolicy` carries a header policy the host page knows;
 * - the `securitypolicyviolation` event reports a block only after the
 *   request failed, so it warns about the header-only blocks the pre-check
 *   could not see.
 *
 * The matching rules live in {@link isUrlAllowedByPolicies} (`./csp.ts`).
 *
 * @see https://www.w3.org/TR/CSP3/#connect-src (6.1.2) -- the directive
 * @see https://www.w3.org/TR/CSP3/#meta-element (3.3) -- meta-delivered policy
 */
import type { ImageFetchResult, ImageProvider } from '../core/image-provider.js';
import { isUrlAllowedByPolicies } from './csp.js';

/** One `<meta>` element, as much as the provider reads. */
export interface BrowserMetaLike {
  getAttribute(name: string): string | null;
}

/** A `securitypolicyviolation` event, as much as the provider reads. */
export interface BrowserViolationEventLike {
  readonly blockedURI: string;
  readonly effectiveDirective: string;
}

/**
 * The slice of `Document` the provider touches. A real `Document` satisfies
 * it, so `src/` needs no DOM lib; tests pass a stub.
 */
export interface BrowserDocumentLike {
  readonly head: {
    querySelectorAll(selectors: string): ArrayLike<BrowserMetaLike>;
  } | null;
  readonly location: { readonly origin: string };
  addEventListener(type: 'securitypolicyviolation', listener: (event: BrowserViolationEventLike) => void): void;
}

export interface BrowserProviderOptions {
  /** A header policy the page knows (not readable from JS); comma-separated for several. */
  cspPolicy?: string;
  /** Per-image fetch timeout in milliseconds. Default {@link DEFAULT_TIMEOUT_MS}. */
  timeoutMs?: number;
  /** Largest image accepted, in bytes. Default {@link DEFAULT_MAX_BYTES}. */
  maxBytes?: number;
  /** Default `globalThis.document`; stubbed in tests. */
  document?: BrowserDocumentLike;
  /** Default the global `fetch`. */
  fetch?: typeof fetch;
  /** Receives each warning once per origin. Default `console.warn`. */
  onWarning?: (message: string) => void;
}

export const DEFAULT_TIMEOUT_MS = 5000;
export const DEFAULT_MAX_BYTES = 10 * 1024 * 1024;

const CONNECT_SRC = 'connect-src';
const META_SELECTOR = 'meta[http-equiv]';
const CSP_HTTP_EQUIV = 'content-security-policy';
const VIOLATION_EVENT = 'securitypolicyviolation';
const VIOLATION_PREFIX = '(reported by the browser) ';
const OPAQUE_ORIGIN = 'null';
const DEFAULT_MIME = 'application/octet-stream';

/** The text the host sees: what was blocked, by what, and the fix. */
function blockedMessage(origin: string, directive: string): string {
  return (
    `plantuml-ts: image from ${origin} blocked by Content-Security-Policy ` +
    `directive ${directive}; add ${origin} to ${CONNECT_SRC} (or pass a ` +
    `different imageProvider)`
  );
}

/** Every CSP `<meta>` content in `document.head`, then the header policies. */
function readPolicies(doc: BrowserDocumentLike | undefined, cspPolicy: string | undefined): string[] {
  const policies: string[] = [];
  for (const meta of Array.from(doc?.head?.querySelectorAll(META_SELECTOR) ?? [])) {
    const httpEquiv = meta.getAttribute('http-equiv')?.toLowerCase();
    const content = meta.getAttribute('content');
    if (httpEquiv === CSP_HTTP_EQUIV && content) policies.push(content);
  }
  for (const header of (cspPolicy ?? '').split(',')) {
    if (header.trim() !== '') policies.push(header);
  }
  return policies;
}

/** The origin of an http(s) url, else undefined (`inline`, `data`, ...). */
function httpOrigin(url: string): string | undefined {
  if (!URL.canParse(url)) return undefined;
  const parsed = new URL(url);
  return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.origin : undefined;
}

/** The body as bytes, or undefined once it exceeds `maxBytes`. */
async function readCapped(response: Response, maxBytes: number): Promise<Uint8Array | undefined> {
  if (response.body === null) {
    const whole = new Uint8Array(await response.arrayBuffer());
    return whole.byteLength > maxBytes ? undefined : whole;
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return undefined;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

/** `Content-Type` without parameters, lowercased. */
function mimeTypeOf(response: Response): string {
  const header = response.headers.get('content-type');
  return header?.split(';')[0]?.trim().toLowerCase() || DEFAULT_MIME;
}

/** Turns one response into a result, enforcing status and the size cap. */
async function readResponse(response: Response, url: string, maxBytes: number): Promise<ImageFetchResult> {
  if (!response.ok) return { failed: `HTTP ${response.status} fetching ${url}` };
  const tooLarge = { failed: `image at ${url} exceeds the ${maxBytes} byte limit` };
  const declared = Number(response.headers.get('content-length'));
  if (declared > maxBytes) return tooLarge;
  const bytes = await readCapped(response, maxBytes);
  return bytes === undefined ? tooLarge : { bytes, mimeType: mimeTypeOf(response) };
}

/** One CORS fetch, raced against `timeoutMs` (a stub may ignore the abort). */
async function fetchWithTimeout(
  fetchFn: typeof fetch,
  url: string,
  timeoutMs: number,
  maxBytes: number,
): Promise<ImageFetchResult> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<ImageFetchResult>((resolve) => {
    timer = setTimeout(() => {
      controller.abort();
      resolve({ failed: `timed out after ${timeoutMs} ms fetching ${url}` });
    }, timeoutMs);
  });
  const download = async (): Promise<ImageFetchResult> => {
    const response = await fetchFn(url, {
      mode: 'cors',
      credentials: 'omit',
      signal: controller.signal,
    });
    return readResponse(response, url, maxBytes);
  };
  try {
    return await Promise.race([download(), timeout]);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return {
      failed: `could not fetch ${url}: ${reason} ` + '(network error, missing CORS header or Content-Security-Policy)',
    };
  } finally {
    clearTimeout(timer);
  }
}

/** `globalThis.document` where a browser provides one. */
function globalDocument(): BrowserDocumentLike | undefined {
  // A cast on the global object, not on external data: the host's `document`
  // is a real `Document`, which `BrowserDocumentLike` is a structural subset of.
  return (globalThis as { document?: BrowserDocumentLike }).document;
}

/**
 * Creates the browser provider. Create one per page: the one-warning-per-
 * origin memory and the single `securitypolicyviolation` listener live in the
 * returned provider.
 */
export function createBrowserImageProvider(options: BrowserProviderOptions = {}): ImageProvider {
  const doc = options.document ?? globalDocument();
  const fetchFn = options.fetch ?? globalThis.fetch.bind(globalThis);
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const onWarning =
    options.onWarning ??
    ((message: string): void => {
      // The spec's default sink (T6d "Observability"); the host overrides it
      // with `onWarning`. src/image-providers/ is the one browser-facing
      // entry that may write to the host's console.
      // eslint-disable-next-line no-console
      console.warn(message);
    });
  const warnedOrigins = new Set<string>();
  let listening = false;

  const warnOnce = (origin: string, message: string): void => {
    if (warnedOrigins.has(origin)) return;
    warnedOrigins.add(origin);
    onWarning(message);
  };

  const listenForViolations = (): void => {
    if (listening || doc === undefined) return;
    listening = true;
    doc.addEventListener(VIOLATION_EVENT, (event) => {
      const origin = httpOrigin(event.blockedURI);
      if (origin === undefined || event.effectiveDirective !== CONNECT_SRC) return;
      warnOnce(origin, VIOLATION_PREFIX + blockedMessage(origin, event.effectiveDirective));
    });
  };

  return {
    async fetch(url: string): Promise<ImageFetchResult> {
      if (!URL.canParse(url)) return { failed: `invalid image url: ${url}` };
      listenForViolations();
      const verdict = isUrlAllowedByPolicies(
        url,
        doc?.location.origin ?? OPAQUE_ORIGIN,
        readPolicies(doc, options.cspPolicy),
        CONNECT_SRC,
      );
      if (!verdict.allowed) {
        const origin = new URL(url).origin;
        const message = blockedMessage(origin, verdict.directive);
        warnOnce(origin, message);
        return { blocked: message };
      }
      return fetchWithTimeout(fetchFn, url, timeoutMs, maxBytes);
    },
  };
}
