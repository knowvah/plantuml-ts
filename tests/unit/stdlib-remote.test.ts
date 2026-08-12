/**
 * si11a T1 -- `StdlibRemote`, the fetch-backed per-resource bundle source.
 *
 * Six concerns are pinned here, matching `T1-stdlib-remote.md`'s acceptance
 * criteria:
 *   1. `fetch(key)` requests `baseUrl` + the manifest's relative path.
 *   2. Concurrent `fetch()` calls for one key share a single request.
 *   3. A key absent from the manifest returns `undefined` with NO network call
 *      (ADR-3's offline miss detection).
 *   4. A rejecting fetcher throws `StdlibResourceFetchError` naming the
 *      bundle/key/URL and preserving `cause`; a retry after rejection is a
 *      fresh attempt, not a replayed rejection.
 *   5. A hand-built manifest (no generator, no `@knowvah/plantuml-stdlib*` package)
 *      behaves identically to a generated one (ADR-7).
 *   6. `baseUrl` with and without a trailing slash resolves to the same URL.
 *
 * Every test injects a stub `fetcher` -- nothing here reaches the network
 * (mission stop condition 10).
 *
 * The module is integration-free at this point -- nothing in `src/` imports
 * it yet -- so these tests drive the real caching and error behavior
 * directly rather than through a render pipeline.
 *
 * @see ../../src/core/tim/StdlibRemote.ts
 */
import { describe, expect, it, vi } from 'vitest';
import {
  StdlibResourceFetchError,
  remoteStdlib,
  type StdlibRemoteManifest,
} from '../../src/core/tim/StdlibRemote.js';

const TUPADR3: StdlibRemoteManifest = {
  name: 'tupadr3',
  files: {
    ban: 'font-awesome-5/ban.puml',
    heart: 'font-awesome-5/heart.puml',
  },
};

describe('remoteStdlib -- fetching (criterion 1)', () => {
  it('requests baseUrl + the manifest relative path and returns the content', async () => {
    const fetcher = vi.fn(async () => Promise.resolve('sprite $ban [...] endsprite'));
    const bundle = remoteStdlib({
      manifest: TUPADR3,
      baseUrl: 'https://example.com/tupadr3',
      fetcher,
    });

    const content = await bundle.fetch('ban');

    expect(content).toBe('sprite $ban [...] endsprite');
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith('https://example.com/tupadr3/font-awesome-5/ban.puml');
  });
});

describe('remoteStdlib -- concurrent dedup (criterion 2)', () => {
  it('shares one fetch between two concurrent calls for the same key', async () => {
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const fetcher = vi.fn(async () => {
      await gate;
      return 'sprite $ban [...] endsprite';
    });
    const bundle = remoteStdlib({ manifest: TUPADR3, baseUrl: 'https://example.com/tupadr3', fetcher });

    const both = Promise.all([bundle.fetch('ban'), bundle.fetch('ban')]);
    release?.();

    expect(await both).toEqual(['sprite $ban [...] endsprite', 'sprite $ban [...] endsprite']);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});

describe('remoteStdlib -- offline miss detection (criterion 3)', () => {
  it('returns undefined for a key absent from the manifest without invoking the fetcher', async () => {
    const fetcher = vi.fn(async () => Promise.resolve('unused'));
    const bundle = remoteStdlib({ manifest: TUPADR3, baseUrl: 'https://example.com/tupadr3', fetcher });

    const content = await bundle.fetch('not-in-the-bundle');

    expect(content).toBeUndefined();
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('has() answers from the manifest with no network access', () => {
    const fetcher = vi.fn(async () => Promise.resolve('unused'));
    const bundle = remoteStdlib({ manifest: TUPADR3, baseUrl: 'https://example.com/tupadr3', fetcher });

    expect(bundle.has('ban')).toBe(true);
    expect(bundle.has('missing')).toBe(false);
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe('remoteStdlib -- fetch failure (criterion 4)', () => {
  it('throws StdlibResourceFetchError naming the bundle, key and resolved URL, preserving cause', async () => {
    const cause = new Error('Failed to fetch');
    const fetcher = vi.fn(async () => Promise.reject(cause));
    const bundle = remoteStdlib({ manifest: TUPADR3, baseUrl: 'https://example.com/tupadr3', fetcher });

    const err = await bundle.fetch('ban').then(
      () => undefined,
      (e: unknown) => e as StdlibResourceFetchError,
    );

    expect(err).toBeInstanceOf(StdlibResourceFetchError);
    expect(err?.name).toBe('StdlibResourceFetchError');
    expect(err?.bundle).toBe('tupadr3');
    expect(err?.key).toBe('ban');
    expect(err?.url).toBe('https://example.com/tupadr3/font-awesome-5/ban.puml');
    expect(err?.cause).toBe(cause);
    expect(err?.message).toContain('Failed to fetch');
  });

  it('a rejected fetch is not cached -- a subsequent call retries rather than replaying it', async () => {
    // Vitest 4 changed `vi.fn`'s type parameter from `<Args, Return>` to the
    // whole function signature (`Mock<T extends Procedure>`).
    const fetcher = vi
      .fn<(url: string) => Promise<string>>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce('sprite $ban [...] endsprite');
    const bundle = remoteStdlib({ manifest: TUPADR3, baseUrl: 'https://example.com/tupadr3', fetcher });

    await expect(bundle.fetch('ban')).rejects.toBeInstanceOf(StdlibResourceFetchError);
    expect(await bundle.fetch('ban')).toBe('sprite $ban [...] endsprite');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});

describe('remoteStdlib -- hand-built manifest, no generator (criterion 5, ADR-7)', () => {
  it('resolves per-resource identically for a manifest written by hand', async () => {
    // No `@knowvah/plantuml-stdlib*` package involved -- a third party's own object literal.
    const thirdPartyManifest: StdlibRemoteManifest = {
      name: 'my-icons',
      files: { star: 'star.puml', heart: 'icons/heart.puml' },
    };
    const fetcher = vi.fn(async () => Promise.resolve('sprite $star [...] endsprite'));
    const bundle = remoteStdlib({
      manifest: thirdPartyManifest,
      baseUrl: 'https://example.com/icons',
      fetcher,
    });

    expect(bundle.name).toBe('my-icons');
    expect(bundle.aliasOf).toBeUndefined();
    expect(bundle.has('star')).toBe(true);
    expect(await bundle.fetch('star')).toBe('sprite $star [...] endsprite');
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith('https://example.com/icons/star.puml');
  });
});

describe('remoteStdlib -- baseUrl trailing slash (criterion 6)', () => {
  it('resolves the same URL with and without a trailing slash on baseUrl', async () => {
    const withSlash = vi.fn(async () => Promise.resolve('x'));
    const withoutSlash = vi.fn(async () => Promise.resolve('x'));

    await remoteStdlib({ manifest: TUPADR3, baseUrl: 'https://example.com/tupadr3/', fetcher: withSlash }).fetch(
      'ban',
    );
    await remoteStdlib({ manifest: TUPADR3, baseUrl: 'https://example.com/tupadr3', fetcher: withoutSlash }).fetch(
      'ban',
    );

    expect(withSlash).toHaveBeenCalledTimes(1);
    expect(withSlash).toHaveBeenCalledWith('https://example.com/tupadr3/font-awesome-5/ban.puml');
    expect(withoutSlash).toHaveBeenCalledTimes(1);
    expect(withoutSlash).toHaveBeenCalledWith('https://example.com/tupadr3/font-awesome-5/ban.puml');
  });
});

describe('remoteStdlib -- asBundleData (ADR-2 alias reuse)', () => {
  it('returns name/aliasOf straight off the manifest with empty files', () => {
    const bundle = remoteStdlib({
      manifest: { name: 'awslib', aliasOf: 'awslib14', files: {} },
      baseUrl: 'https://example.com/awslib14',
    });

    expect(bundle.asBundleData()).toEqual({ name: 'awslib', aliasOf: 'awslib14', files: {} });
  });

  it('leaves aliasOf undefined for a bundle with no alias', () => {
    const bundle = remoteStdlib({ manifest: TUPADR3, baseUrl: 'https://example.com/tupadr3' });

    expect(bundle.aliasOf).toBeUndefined();
    expect(bundle.asBundleData()).toEqual({ name: 'tupadr3', aliasOf: undefined, files: {} });
  });
});

describe('remoteStdlib -- default fetcher (ADR-5, reuses fetchInclude)', () => {
  it('defaults to fetchInclude when no fetcher is supplied, invoking global fetch', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('sprite $ban [...] endsprite', { status: 200 }),
    );
    try {
      const bundle = remoteStdlib({ manifest: TUPADR3, baseUrl: 'https://example.com/tupadr3' });

      const content = await bundle.fetch('ban');

      expect(content).toBe('sprite $ban [...] endsprite');
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith('https://example.com/tupadr3/font-awesome-5/ban.puml');
    } finally {
      fetchSpy.mockRestore();
    }
  });
});
