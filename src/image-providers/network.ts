/**
 * Fetch-based {@link ImageProvider} for hosts with network access.
 *
 * Upstream reads remote bytes in `SURL#getBytes` (`SURL.java:325-345`),
 * bounded by the security profile's timeout (`SecurityProfile.java:158-176`:
 * INTERNET = 10 s, SANDBOX = 1 s). The 5000 ms default here is the decided
 * browser default (decisions.md D3), not a profile value; hosts may pass
 * `SecurityProfile#getTimeout`. This directory is the one place network code
 * may live; nothing in `src/core` imports it.
 */
import type { ImageFetchResult, ImageProvider } from '../core/image-provider.js';

export interface NetworkProviderOptions {
  /** Abort after this many ms. Default 5000 (D3). */
  timeoutMs?: number;
  /** Largest accepted body in bytes. Default 10 MiB. */
  maxBytes?: number;
  /** Transport; default `globalThis.fetch`. */
  fetch?: typeof fetch;
  /** Called once per failed url with the prefixed failure reason. */
  onWarning?: (message: string) => void;
}

const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_MAX_BYTES = 10 * 1024 * 1024;
const DEFAULT_MIME_TYPE = 'application/octet-stream';
const WARNING_PREFIX = 'plantuml-ts network image provider: ';

class FetchFailure extends Error {}

function mimeTypeOf(response: Response): string {
  const raw = response.headers.get('Content-Type');
  const bare = raw?.split(';')[0]?.trim();
  return bare === undefined || bare === '' ? DEFAULT_MIME_TYPE : bare;
}

function tooBig(maxBytes: number, url: string): FetchFailure {
  return new FetchFailure(`exceeds ${maxBytes} bytes: ${url}`);
}

async function readBody(response: Response, maxBytes: number, url: string): Promise<Uint8Array> {
  const declared = Number(response.headers.get('Content-Length'));
  if (declared > maxBytes) throw tooBig(maxBytes, url);
  if (response.body === null) {
    const whole = new Uint8Array(await response.arrayBuffer());
    if (whole.length > maxBytes) throw tooBig(maxBytes, url);
    return whole;
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > maxBytes) {
      await reader.cancel();
      throw tooBig(maxBytes, url);
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

function describe(error: unknown, url: string): string {
  if (error instanceof FetchFailure) return error.message;
  return `${error instanceof Error ? error.message : String(error)}: ${url}`;
}

export function createNetworkImageProvider(options: NetworkProviderOptions = {}): ImageProvider {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;

  async function load(url: string, signal: AbortSignal): Promise<ImageFetchResult> {
    const doFetch = options.fetch ?? globalThis.fetch;
    const response = await doFetch(url, { signal });
    if (!response.ok) throw new FetchFailure(`HTTP ${response.status} for ${url}`);
    return { bytes: await readBody(response, maxBytes, url), mimeType: mimeTypeOf(response) };
  }

  async function fetchImage(url: string): Promise<ImageFetchResult> {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    // A transport that ignores the signal must not outlive the timeout.
    const timeout = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(new FetchFailure(`timed out after ${timeoutMs} ms: ${url}`));
      }, timeoutMs);
    });
    try {
      return await Promise.race([load(url, controller.signal), timeout]);
    } catch (error) {
      const failed = describe(error, url);
      options.onWarning?.(WARNING_PREFIX + failed);
      return { failed };
    } finally {
      clearTimeout(timer);
    }
  }

  return { fetch: fetchImage };
}
