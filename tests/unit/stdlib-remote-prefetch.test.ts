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
import { prefetchIncludes, CircularIncludeError } from '../../src/core/include-resolver.js';
import { StdlibNotBundledError } from '../../src/core/tim/IncludeStore.js';
import { stdlibRegistry, type StdlibRegistry } from '../../src/core/tim/StdlibRegistry.js';
import { remoteStdlib, type StdlibRemoteManifest } from '../../src/core/tim/StdlibRemote.js';

/** A fetcher that must never run -- every target in these tests is a bundle. */
const noFetch = (url: string): Promise<string> =>
  Promise.reject(new Error(`unexpected ordinary-http fetch for ${url}`));

function uml(...lines: readonly string[]): string {
  return ['@startuml', ...lines, '@enduml'].join('\n');
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
