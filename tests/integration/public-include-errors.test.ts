/**
 * The include/stdlib error classes `prepareIncludeStore` throws are reachable
 * from the package's only entry point, so a consumer can `instanceof` them.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as pub from '../../src/index.js';
import * as resolver from '../../src/core/include-resolver.js';
import * as includeStore from '../../src/core/tim/IncludeStore.js';

const GITHUB_RAW = 'https://raw.githubusercontent.com/o/r/main/x.puml';
const PLAIN = 'https://example.com/x.puml';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('public include error exports', () => {
  it('are the same classes the resolver throws', () => {
    expect(pub.CspIncludeError).toBe(resolver.CspIncludeError);
    expect(pub.CorsIncludeError).toBe(resolver.CorsIncludeError);
    expect(pub.IncludeResolveError).toBe(resolver.IncludeResolveError);
    expect(pub.CircularIncludeError).toBe(resolver.CircularIncludeError);
    expect(pub.StdlibNotBundledError).toBe(includeStore.StdlibNotBundledError);
  });

  it('CircularIncludeError from a self-including chain', async () => {
    const err: unknown = await pub
      .prepareIncludeStore('!include a.puml', { fetcher: () => Promise.resolve('!include a.puml') })
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(pub.CircularIncludeError);
    expect((err as InstanceType<typeof pub.CircularIncludeError>).chain).toEqual(['a.puml']);
  });

  it('StdlibNotBundledError for an unbundled <lib/file>', async () => {
    const err: unknown = await pub.prepareIncludeStore('!include <nosuch/thing>').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(pub.StdlibNotBundledError);
    expect((err as Error).message).toContain('<nosuch/thing>');
  });

  it('CorsIncludeError when the built-in fetcher fails on a GitHub raw URL', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('Failed to fetch')));
    const err: unknown = await pub.prepareIncludeStore(`!include ${GITHUB_RAW}`).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(pub.CorsIncludeError);
    expect((err as InstanceType<typeof pub.CorsIncludeError>).url).toBe(GITHUB_RAW);
  });

  it('IncludeResolveError for a non-OK HTTP response', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response('nope', { status: 500, statusText: 'Server Error' })));
    const err: unknown = await pub.prepareIncludeStore(`!include ${PLAIN}`).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(pub.IncludeResolveError);
    expect((err as Error).message).toBe(`Failed to fetch !include ${PLAIN}: HTTP 500 Server Error`);
  });
});

describe('public SecurityProfile export', () => {
  it("names upstream's six profiles", () => {
    expect(Object.values(pub.SecurityProfile)).toEqual([
      'SANDBOX',
      'ALLOWLIST',
      'INTERNET',
      'INTERNET_WITH_DOTSVG',
      'LEGACY',
      'INSECURE',
    ]);
  });

  it('render() honours it: SANDBOX refuses a url include before fetching', async () => {
    const fetcher = vi.fn().mockResolvedValue('');
    const svg = await pub.render(`@startuml\n!include ${PLAIN}\nA -> B\n@enduml`, {
      fetcher,
      securityProfile: pub.SecurityProfile.SANDBOX,
    });
    expect(svg).toContain('Cannot open URL');
    expect(fetcher).not.toHaveBeenCalled();
  });
});
