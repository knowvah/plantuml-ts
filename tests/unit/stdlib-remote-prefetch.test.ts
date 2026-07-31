/**
 * si11a T3 -- per-resource routing wired into the transitive prefetch walk.
 *
 * Pins the six acceptance criteria from `T3-prefetch-per-resource.md`:
 *   1. `<tupadr3/font-awesome-5/ban>` fetches that ONE resource -- proven by
 *      `resolveResource`'s call count AND the exact key it was called with,
 *      not by "it rendered".
 *   2. Fetched remote text containing a further `!include <bundle/thing>` is
 *      ALSO resolved and stored (SI8 ADR-4's transitive walk).
 *   3. Regression guard: `stdlib-registry-prefetch.test.ts` (SI8's eager/no-
 *      registry contract) is untouched by this file and still passes as-is.
 *   4. A key absent from the manifest fails with `StdlibNotBundledError`
 *      naming the bundle and key, with NO network request.
 *   5. `<awslib14/Storage/SimpleStorageService>` derives the manifest key
 *      `storage/simplestorageservice` -- case folded, multi-slash preserved.
 *   6. A remote bundle that includes itself still raises
 *      `CircularIncludeError`, not a hang.
 *
 * Method rule 2 correction: the brief cites "a tupadr3 icon `!include
 * <tupadr3/common>`" as the nested-include example. Checked directly against
 * `assets/stdlib/tupadr3` -- no `.puml` file there contains an `!include`
 * line at all (`common.puml` only `!define`s the `ENTITY` macro icons use;
 * a diagram author includes both `<tupadr3/common>` and the icon separately).
 * The REAL verified instance of one stdlib file including another is
 * `assets/stdlib/C4/C4_Context.puml`, whose first line is `!include <C4/C4>`.
 * Criterion 2 below is modeled on that real shape, applied to the tupadr3
 * bundle so it stays on criterion 1's own fixture.
 *
 * Every test injects a stub `fetcher` into `remoteStdlib` -- nothing here
 * reaches the network (mission stop condition 10). Remote bundles are
 * registered the WORKING way (T2's finding): a thunk resolving to an
 * already-built `RemoteBundle` via `remoteStdlib({ manifest, baseUrl })`,
 * never a bare manifest object (which `stdlibRegistry` would harvest as if
 * its `files` held content instead of paths).
 *
 * @see ../../src/core/include-resolver.ts -- `stdlibContentFor`
 * @see ../../src/core/tim/stdlib-path.ts -- `splitStdlibPath`
 */
import { describe, expect, it, vi } from 'vitest';
import {
  prefetchIncludes,
  CircularIncludeError,
  type IncludeFetcher,
} from '../../src/core/include-resolver.js';
import { StdlibNotBundledError } from '../../src/core/tim/IncludeStore.js';
import { stdlibRegistry, type StdlibRegistry } from '../../src/core/tim/StdlibRegistry.js';
import { remoteStdlib, type StdlibRemoteManifest } from '../../src/core/tim/StdlibRemote.js';

/** A fetcher that must never run -- every target in these tests is a bundle. */
const noFetch = (url: string): Promise<string> =>
  Promise.reject(new Error(`unexpected ordinary-http fetch for ${url}`));

function uml(...lines: readonly string[]): string {
  return ['@startuml', ...lines, '@enduml'].join('\n');
}

/**
 * si11a T4 -- a fetcher that records every URL the moment it is CALLED (not
 * when it resolves) and stays pending until `release` is invoked for that
 * URL. This is the structural proof criterion 1 requires: because
 * `prefetchInner`'s synchronous prefix issues every target's `fetcher(url)`
 * call before the enclosing `Promise.all` is even awaited (see
 * `include-resolver.ts`'s `dedupeInFlight` doc), `started` already holds
 * every target synchronously after calling `prefetchIncludes` -- no
 * `setTimeout`, no timing heuristic.
 */
function blockingFetcher(): {
  fetcher: IncludeFetcher;
  started: string[];
  release: (url: string, content: string) => void;
} {
  const resolvers = new Map<string, (content: string) => void>();
  const started: string[] = [];
  const fetcher: IncludeFetcher = (url: string) =>
    new Promise<string>((resolve) => {
      started.push(url);
      resolvers.set(url, resolve);
    });
  const release = (url: string, content: string): void => {
    const resolve = resolvers.get(url);
    if (resolve === undefined) throw new Error(`fetch for '${url}' was never started`);
    resolve(content);
  };
  return { fetcher, started, release };
}

/** Register one remote bundle under `name`, pre-wrapped via `remoteStdlib` (T2's finding). */
function registryWithRemote(
  name: string,
  manifest: StdlibRemoteManifest,
  baseUrl: string,
  fetcher: (url: string) => Promise<string>,
): StdlibRegistry {
  return stdlibRegistry({
    [name]: async () => Promise.resolve(remoteStdlib({ manifest, baseUrl, fetcher })),
  });
}

describe('remote registry in the prefetch walk -- exactly one resource (criterion 1)', () => {
  it('fetches ONLY <tupadr3/font-awesome-5/ban>, proven by call count and key', async () => {
    const manifest: StdlibRemoteManifest = {
      name: 'tupadr3',
      files: { 'font-awesome-5/ban': 'font-awesome-5/ban.puml' },
    };
    const remoteFetcher = vi.fn(async () => Promise.resolve('sprite $ban [...] endsprite'));
    const registry = registryWithRemote(
      'tupadr3',
      manifest,
      'https://cdn.example.com/tupadr3',
      remoteFetcher,
    );
    const resolveResourceSpy = vi.spyOn(registry, 'resolveResource');

    const store = await prefetchIncludes(
      uml('!include <tupadr3/font-awesome-5/ban>'),
      noFetch,
      undefined,
      registry,
    );

    // The requested key, asserted directly against the registry call --
    // not inferred from the render.
    expect(resolveResourceSpy).toHaveBeenCalledTimes(1);
    expect(resolveResourceSpy).toHaveBeenCalledWith('tupadr3', 'font-awesome-5/ban');

    // Exactly one network request, at the manifest's mapped relative path.
    expect(remoteFetcher).toHaveBeenCalledTimes(1);
    expect(remoteFetcher).toHaveBeenCalledWith('https://cdn.example.com/tupadr3/font-awesome-5/ban.puml');

    expect(store.get('<tupadr3/font-awesome-5/ban>')).toBe('sprite $ban [...] endsprite');
  });
});

describe('remote registry in the prefetch walk -- transitivity (criterion 2, ADR-4)', () => {
  it('resolves a nested <bundle/thing> found inside fetched remote content', async () => {
    const manifest: StdlibRemoteManifest = {
      name: 'tupadr3',
      files: {
        'font-awesome-5/ban': 'font-awesome-5/ban.puml',
        common: 'common.puml',
      },
    };
    const remoteFetcher = vi.fn(async (url: string) =>
      Promise.resolve(
        url.endsWith('ban.puml') ? '!include <tupadr3/common>\nsprite $ban' : '!define ENTITY(x) x',
      ),
    );
    const registry = registryWithRemote(
      'tupadr3',
      manifest,
      'https://cdn.example.com/tupadr3',
      remoteFetcher,
    );

    const store = await prefetchIncludes(
      uml('!include <tupadr3/font-awesome-5/ban>'),
      noFetch,
      undefined,
      registry,
    );

    // BOTH resources fetched: the outer icon and the nested <tupadr3/common>
    // it names. One level of resolution would leave the second unresolved.
    expect(remoteFetcher).toHaveBeenCalledTimes(2);
    expect(store.get('<tupadr3/font-awesome-5/ban>')).toContain('sprite $ban');
    expect(store.get('<tupadr3/common>')).toBe('!define ENTITY(x) x');
  });
});

describe('remote registry in the prefetch walk -- absent key (criterion 4)', () => {
  it('a key absent from the manifest names the bundle and key, with NO network request', async () => {
    const manifest: StdlibRemoteManifest = {
      name: 'tupadr3',
      files: { 'font-awesome-5/ban': 'font-awesome-5/ban.puml' },
    };
    const remoteFetcher = vi.fn(async () => Promise.resolve('unused'));
    const registry = registryWithRemote(
      'tupadr3',
      manifest,
      'https://cdn.example.com/tupadr3',
      remoteFetcher,
    );

    const err = await prefetchIncludes(
      uml('!include <tupadr3/font-awesome-5/missing>'),
      noFetch,
      undefined,
      registry,
    ).then(
      () => undefined,
      (e: unknown) => e as StdlibNotBundledError,
    );

    expect(err).toBeInstanceOf(StdlibNotBundledError);
    expect(err?.bundle).toBe('tupadr3');
    expect(err?.path).toBe('tupadr3/font-awesome-5/missing');
    expect(remoteFetcher).not.toHaveBeenCalled();
  });
});

describe('remote registry in the prefetch walk -- key derivation (criterion 5)', () => {
  it('derives storage/simplestorageservice from <awslib14/Storage/SimpleStorageService>', async () => {
    const manifest: StdlibRemoteManifest = {
      name: 'awslib14',
      files: { 'storage/simplestorageservice': 'Storage/SimpleStorageService.puml' },
    };
    const remoteFetcher = vi.fn(async () => Promise.resolve('class S3'));
    const registry = registryWithRemote(
      'awslib14',
      manifest,
      'https://cdn.example.com/awslib14',
      remoteFetcher,
    );
    const resolveResourceSpy = vi.spyOn(registry, 'resolveResource');

    await prefetchIncludes(
      uml('!include <awslib14/Storage/SimpleStorageService>'),
      noFetch,
      undefined,
      registry,
    );

    // If the transform mis-cased or mis-split, this key would miss the
    // manifest and remoteFetcher would never run at all.
    expect(resolveResourceSpy).toHaveBeenCalledWith('awslib14', 'storage/simplestorageservice');
    expect(remoteFetcher).toHaveBeenCalledWith(
      'https://cdn.example.com/awslib14/Storage/SimpleStorageService.puml',
    );
  });
});

describe('remote registry in the prefetch walk -- cycle guard (criterion 6)', () => {
  it('a remote bundle that includes ITSELF raises CircularIncludeError, not a hang', async () => {
    const manifest: StdlibRemoteManifest = { name: 'loop', files: { a: 'a.puml' } };
    const remoteFetcher = vi.fn(async () => Promise.resolve('!include <loop/a>'));
    const registry = registryWithRemote('loop', manifest, 'https://cdn.example.com/loop', remoteFetcher);

    await expect(
      prefetchIncludes(uml('!include <loop/a>'), noFetch, undefined, registry),
    ).rejects.toBeInstanceOf(CircularIncludeError);
  });
});

/**
 * si11a T4 -- concurrent fetch and in-flight dedup in `prefetchInner`.
 * Pins the five acceptance criteria from `T4-concurrent-fetch.md`:
 *   1. 20 distinct targets are all in flight before any resolves.
 *   2. The same target named twice in one source is fetched exactly once.
 *   3. One target's rejection surfaces and names that target.
 *   4. Store contents are identical regardless of completion order.
 *   5. The cycle guard still fires when the cycling target has a concurrent
 *      sibling (criterion 5's own regression guard,
 *      `stdlib-registry-prefetch.test.ts`, is untouched and still green --
 *      verified separately, not duplicated here).
 */
describe('concurrent fetch -- all targets in flight before any resolves (criterion 1)', () => {
  it('issues all 20 fetches before any of them settle, proven structurally', async () => {
    const urls = Array.from(
      { length: 20 },
      (_, i) => `https://cdn.example.com/icon${i}.puml`,
    );
    const { fetcher, started, release } = blockingFetcher();

    // No `await` yet: prefetchIncludes's synchronous prefix runs the whole
    // `targets.map()` pass before returning control here (see
    // blockingFetcher's doc comment for the mechanism).
    const promise = prefetchIncludes(uml(...urls.map((u) => `!include ${u}`)), fetcher);

    expect(started).toHaveLength(20);
    expect(new Set(started)).toEqual(new Set(urls));

    for (const url of urls) release(url, `content:${url}`);
    const store = await promise;
    for (const url of urls) expect(store.get(url)).toBe(`content:${url}`);
  });
});

describe('concurrent fetch -- in-flight dedup (criterion 2)', () => {
  it('the same target named twice in one source is fetched exactly once', async () => {
    const url = 'https://cdn.example.com/shared.puml';
    const fetcher: IncludeFetcher = vi.fn(() => Promise.resolve('shared content'));

    const store = await prefetchIncludes(uml(`!include ${url}`, `!include ${url}`), fetcher);

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(store.get(url)).toBe('shared content');
  });
});

describe('concurrent fetch -- error propagation names the failing target (criterion 3)', () => {
  it('one rejecting target surfaces its own error while siblings keep resolving', async () => {
    const ok1 = 'https://cdn.example.com/ok1.puml';
    const bad = 'https://cdn.example.com/bad.puml';
    const ok2 = 'https://cdn.example.com/ok2.puml';
    const fetcher: IncludeFetcher = (url) => {
      if (url === bad) return Promise.reject(new Error(`boom: ${url}`));
      return Promise.resolve(`content:${url}`);
    };

    const err = await prefetchIncludes(
      uml(`!include ${ok1}`, `!include ${bad}`, `!include ${ok2}`),
      fetcher,
    ).then(
      () => undefined,
      (e: unknown) => e as Error,
    );

    expect(err?.message).toBe(`boom: ${bad}`);
  });
});

describe('concurrent fetch -- determinism regardless of completion order (criterion 4)', () => {
  it('store contents are identical whether targets resolve forward or reversed', async () => {
    const urls = [
      'https://cdn.example.com/a.puml',
      'https://cdn.example.com/b.puml',
      'https://cdn.example.com/c.puml',
    ] as const;
    const contentFor = (url: string): string => `content:${url}`;

    async function runReleasingIn(order: readonly string[]): Promise<Record<string, string | undefined>> {
      const { fetcher, started, release } = blockingFetcher();
      const promise = prefetchIncludes(uml(...urls.map((u) => `!include ${u}`)), fetcher);
      expect(started).toHaveLength(urls.length);

      for (const url of order) release(url, contentFor(url));
      const store = await promise;
      return Object.fromEntries(urls.map((u) => [u, store.get(u)]));
    }

    const forward = await runReleasingIn(urls);
    const reversed = await runReleasingIn([...urls].reverse());

    expect(forward).toEqual(reversed);
    expect(forward).toEqual({
      [urls[0]]: contentFor(urls[0]),
      [urls[1]]: contentFor(urls[1]),
      [urls[2]]: contentFor(urls[2]),
    });
  });
});

describe('concurrent fetch -- cycle guard holds among concurrent siblings (criterion 5)', () => {
  it('a cycling sibling still raises CircularIncludeError while another sibling resolves fine', async () => {
    const manifest: StdlibRemoteManifest = {
      name: 'loop',
      files: { a: 'a.puml', ok: 'ok.puml' },
    };
    const remoteFetcher = vi.fn(async (url: string) =>
      Promise.resolve(url.endsWith('ok.puml') ? 'class Fine' : '!include <loop/a>'),
    );
    const registry = registryWithRemote('loop', manifest, 'https://cdn.example.com/loop', remoteFetcher);

    await expect(
      prefetchIncludes(uml('!include <loop/a>', '!include <loop/ok>'), noFetch, undefined, registry),
    ).rejects.toBeInstanceOf(CircularIncludeError);
  });
});
