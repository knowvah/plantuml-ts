/**
 * The prefetch walk applies upstream's network gate to every http(s) include
 * target (`SURL#isUrlOk`, per `RenderOptions.securityProfile`), and bounds
 * every fetch by the profile's `getTimeout()` -- the jar waits
 * `result.get(getTimeout(), MILLISECONDS)` (SURL.java:357-358) and a miss
 * surfaces as `EaterException("Cannot open URL")` (PreprocessorUtils.java:157-159).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  IncludeResolveError,
  fetchInclude,
  prefetchIncludes,
  prepareIncludeStore,
  MapIncludeStore,
} from '../../src/core/include-resolver.js';
import { SecurityProfile } from '../../src/core/security/SecurityProfile.js';
import { render } from '../../src/index.js';
import { expectErrorDiagram } from '../helpers/error-diagram.js';

const PUBLIC = 'https://example.com/lib/x.puml';
const INTERNAL = 'http://127.0.0.1:8080/admin.puml';
const LEGACY_TIMEOUT_MS = 60000;
const INTERNET_TIMEOUT_MS = 10000;

function blocked(url: string, profile: string): string {
  return `Cannot open URL ${url}: blocked by security profile ${profile}`;
}

function timedOut(url: string, ms: number): string {
  return `Cannot open URL ${url}: no response within ${ms} ms`;
}

describe('prefetch — security profile gate', () => {
  it('the default (LEGACY) refuses an internal address without calling the fetcher', async () => {
    const fetcher = vi.fn().mockResolvedValue('');
    const err = (await prefetchIncludes(`!include ${INTERNAL}`, fetcher).catch((e: unknown) => e)) as Error;
    expect(err).toBeInstanceOf(IncludeResolveError);
    expect(err.message).toBe(blocked(INTERNAL, 'LEGACY'));
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('the default (LEGACY) fetches a public url', async () => {
    const fetcher = vi.fn().mockResolvedValue('A -> B');
    const store = await prepareIncludeStore(`!include ${PUBLIC}`, { fetcher });
    expect(store.get(PUBLIC)).toBe('A -> B');
  });

  it('gates the scheme case-insensitively (HTTP://…)', async () => {
    const upper = 'HTTP://127.0.0.1/x.puml';
    const fetcher = vi.fn().mockResolvedValue('');
    const err = (await prepareIncludeStore(`!includeurl ${upper}`, { fetcher }).catch((e: unknown) => e)) as Error;
    expect(err.message).toBe(blocked(upper, 'LEGACY'));
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('SANDBOX refuses even a public url', async () => {
    const fetcher = vi.fn().mockResolvedValue('');
    const options = { fetcher, securityProfile: SecurityProfile.SANDBOX };
    const err = (await prepareIncludeStore(`!include ${PUBLIC}`, options).catch((e: unknown) => e)) as Error;
    expect(err.message).toBe(blocked(PUBLIC, 'SANDBOX'));
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('ALLOWLIST fetches only allowlisted urls', async () => {
    const fetcher = vi.fn().mockResolvedValue('ok');
    const options = { fetcher, securityProfile: SecurityProfile.ALLOWLIST, urlAllowlist: ['https://example.com/lib/'] };
    expect((await prepareIncludeStore(`!include ${PUBLIC}`, options)).get(PUBLIC)).toBe('ok');
    const other = 'https://example.org/x.puml';
    const err = (await prepareIncludeStore(`!include ${other}`, options).catch((e: unknown) => e)) as Error;
    expect(err.message).toBe(blocked(other, 'ALLOWLIST'));
  });

  it('INSECURE fetches an internal address', async () => {
    const fetcher = vi.fn().mockResolvedValue('internal');
    const options = { fetcher, securityProfile: SecurityProfile.INSECURE };
    expect((await prepareIncludeStore(`!include ${INTERNAL}`, options)).get(INTERNAL)).toBe('internal');
  });

  it('a nested include is gated too', async () => {
    const fetcher = vi.fn((url: string) => Promise.resolve(url === PUBLIC ? `!include ${INTERNAL}` : ''));
    const err = (await prepareIncludeStore(`!include ${PUBLIC}`, { fetcher }).catch((e: unknown) => e)) as Error;
    expect(err.message).toBe(blocked(INTERNAL, 'LEGACY'));
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('content the caller already supplied is never gated (no fetch happens)', async () => {
    const includeStore = new MapIncludeStore({ [INTERNAL]: 'supplied' });
    const options = { includeStore, securityProfile: SecurityProfile.SANDBOX };
    expect((await prepareIncludeStore(`!include ${INTERNAL}`, options)).get(INTERNAL)).toBe('supplied');
  });

  it('non-url targets are the fetcher’s business, not the gate’s', async () => {
    const fetcher = vi.fn().mockResolvedValue('local');
    const options = { fetcher, securityProfile: SecurityProfile.SANDBOX };
    expect((await prepareIncludeStore('!include local.puml', options)).get('local.puml')).toBe('local');
  });

  it('render() draws the error diagram for a blocked include', async () => {
    const fetcher = vi.fn().mockResolvedValue('');
    const svg = await render(`@startuml\n!include ${INTERNAL}\nA -> B\n@enduml`, { fetcher });
    expectErrorDiagram(svg, 'Cannot open URL');
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe('prefetch — every fetch is bounded by the profile timeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const never = (): Promise<string> => new Promise<string>(() => undefined);

  it('a never-resolving caller fetcher rejects after LEGACY’s 60 s, not before', async () => {
    let settled: unknown = 'pending';
    const pending = prepareIncludeStore(`!include ${PUBLIC}`, { fetcher: never }).then(
      () => 'resolved',
      (e: unknown) => e,
    );
    void pending.then((v) => (settled = v));
    await vi.advanceTimersByTimeAsync(LEGACY_TIMEOUT_MS - 1);
    expect(settled).toBe('pending');
    await vi.advanceTimersByTimeAsync(1);
    const err = (await pending) as Error;
    expect(err).toBeInstanceOf(IncludeResolveError);
    expect(err.message).toBe(timedOut(PUBLIC, LEGACY_TIMEOUT_MS));
  });

  it('INTERNET bounds a fetch at 10 s', async () => {
    const options = { fetcher: never, securityProfile: SecurityProfile.INTERNET };
    const pending = prepareIncludeStore(`!include ${PUBLIC}`, options).catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(INTERNET_TIMEOUT_MS);
    expect(((await pending) as Error).message).toBe(timedOut(PUBLIC, INTERNET_TIMEOUT_MS));
  });

  it('a local (non-url) target through a hung fetcher is bounded as well', async () => {
    const pending = prepareIncludeStore('!include local.puml', { fetcher: never }).catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(LEGACY_TIMEOUT_MS);
    expect(((await pending) as Error).message).toBe(timedOut('local.puml', LEGACY_TIMEOUT_MS));
  });

  it('a fetcher that answers in time clears its timer', async () => {
    const store = await prepareIncludeStore(`!include ${PUBLIC}`, { fetcher: () => Promise.resolve('ok') });
    expect(store.get(PUBLIC)).toBe('ok');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('the built-in fetcher passes an abort signal to fetch and maps its timeout', async () => {
    let seen: AbortSignal | undefined;
    vi.stubGlobal('fetch', (_url: string, init?: RequestInit) => {
      seen = init?.signal ?? undefined;
      return new Promise((_resolve, reject) => {
        // Like real fetch: reject with the signal's abort reason (an Error here).
        seen?.addEventListener('abort', () => reject(seen?.reason as Error));
      });
    });
    const pending = fetchInclude(PUBLIC, INTERNET_TIMEOUT_MS).catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(INTERNET_TIMEOUT_MS);
    const err = (await pending) as Error;
    expect(seen?.aborted).toBe(true);
    expect(err).toBeInstanceOf(IncludeResolveError);
    expect(err.message).toBe(timedOut(PUBLIC, INTERNET_TIMEOUT_MS));
  });
});
