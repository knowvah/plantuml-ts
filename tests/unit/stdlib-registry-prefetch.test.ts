/**
 * si8 T3 -- the `StdlibRegistry` wired into the transitive prefetch walk.
 *
 * The load-bearing case is TRANSITIVITY, and it is not hypothetical:
 * `assets/stdlib/c4/C4_Context.puml` opens with `!include <C4/C4>`. Stdlib
 * bundle files include each other using the same `<bundle/thing>` form, so a
 * registry that resolves one level and stops produces a diagram missing
 * everything the nested include defined -- silently. That is ADR-4, and it is
 * why the resolution was taught to the EXISTING walk instead of a sibling pass
 * that would have had to duplicate the walk, the cycle guard and the
 * over-fetch policy.
 *
 * Also pinned here: that supplying a registry is INERT for every existing
 * caller (criterion 3, the regression guard for the whole async API), and that
 * the three failure modes stay distinguishable -- not registered, chunk failed
 * to load, circular include each need a different fix from the consumer.
 *
 * @see ../../src/core/include-resolver.ts
 * @see ../../src/core/tim/StdlibRegistry.ts
 */
import { describe, expect, it, vi } from 'vitest';
import { render } from '../../src/index.js';
import { FormulaMeasurer } from '../../src/core/measurer.js';
import { prefetchIncludes, CircularIncludeError } from '../../src/core/include-resolver.js';
import { MapIncludeStore, StdlibNotBundledError } from '../../src/core/tim/IncludeStore.js';
import { StdlibChunkLoadError, stdlibRegistry } from '../../src/core/tim/StdlibRegistry.js';
import { stdlibStore, withStdlib, type BundleData } from '../../src/core/tim/StdlibStore.js';

/** jsdom has no <canvas> backend; use the deterministic formula measurer. */
const measurer = (): FormulaMeasurer => new FormulaMeasurer();

/** A fetcher that must never run -- every target in these tests is a bundle. */
const noFetch = (url: string): Promise<string> =>
  Promise.reject(new Error(`unexpected network fetch for ${url}`));

function uml(...lines: readonly string[]): string {
  return ['@startuml', ...lines, '@enduml'].join('\n');
}

describe('registry in the prefetch walk -- transitivity (ADR-4)', () => {
  it('resolves a nested <Other/Thing> inside resolved bundle text', async () => {
    // Mirrors the real shape of assets/stdlib/c4/C4_Context.puml, whose very
    // first line is `!include <C4/C4>`.
    const outer: BundleData = {
      name: 'c4',
      files: {
        c4_context: ['!include <C4/C4>', 'class Context'].join('\n'),
        c4: 'class Base',
      },
    };
    const registry = stdlibRegistry({ c4: async () => Promise.resolve({ c4: outer }) });

    const svg = await render(uml('!include <C4/C4_Context>'), {
      stdlibRegistry: registry,
      measurer: measurer(),
    });

    // BOTH must appear: the outer bundle's own content and the nested one it
    // includes. One level of resolution would render 'Context' alone.
    expect(svg).toMatch(/>\s*Context\s*</);
    expect(svg).toMatch(/>\s*Base\s*</);
  });

  it('resolves a nested include reaching a DIFFERENT registered bundle', async () => {
    const c4: BundleData = { name: 'c4', files: { c4: '!include <Other/Thing>' } };
    const other: BundleData = { name: 'other', files: { thing: 'class FromOther' } };
    const registry = stdlibRegistry({
      c4: async () => Promise.resolve({ c4 }),
      other: async () => Promise.resolve({ other }),
    });

    const svg = await render(uml('!include <C4/C4>', 'class Root'), {
      stdlibRegistry: registry,
      measurer: measurer(),
    });

    expect(svg).toMatch(/>\s*FromOther\s*</);
    expect(svg).toMatch(/>\s*Root\s*</);
  });

  it('folds the bundle in where the SYNC interpreter actually looks for it', async () => {
    // `IncludeExecutor#load` tries `store.get(what)` first. A bundle folded in
    // so that neither channel sees it is the silent-failure shape si8 exists to
    // remove, so the store contract is asserted directly, not just via render.
    const c4: BundleData = { name: 'c4', files: { c4: 'class Base' } };
    const registry = stdlibRegistry({ c4: async () => Promise.resolve({ c4 }) });

    const store = await prefetchIncludes(uml('!include <C4/C4>'), noFetch, undefined, registry);

    expect(store.get('<C4/C4>')).toBe('class Base');
    expect(store.has('<C4/C4>')).toBe(true);
  });

  it('resolves through an aliasOf chain served by one chunk', async () => {
    // The real packages/stdlib/generated/bootstrap.js shape: alias stub with no
    // files plus the concrete payload, both in one module. The walk follows
    // `aliasOf` via the registry, whose cache serves the target without a
    // second import().
    const alias: BundleData = { name: 'bootstrap', aliasOf: 'bootstrap1.13.1', files: {} };
    const concrete: BundleData = { name: 'bootstrap1.13.1', files: { bootstrap: 'class Sprites' } };
    const thunk = vi.fn(async () =>
      Promise.resolve({ bootstrap: alias, bootstrap1_13_1: concrete }),
    );
    const registry = stdlibRegistry({ bootstrap: thunk });

    const svg = await render(uml('!include <bootstrap/bootstrap>'), {
      stdlibRegistry: registry,
      measurer: measurer(),
    });

    expect(svg).toMatch(/>\s*Sprites\s*</);
    expect(thunk).toHaveBeenCalledTimes(1);
  });

  it('invokes the thunk once when one source uses the same bundle twice', async () => {
    const c4: BundleData = { name: 'c4', files: { c4: 'class Base', other: 'class Second' } };
    const thunk = vi.fn(async () => Promise.resolve({ c4 }));
    const registry = stdlibRegistry({ c4: thunk });

    await prefetchIncludes(
      uml('!include <C4/C4>', '!include <C4/Other>'),
      noFetch,
      undefined,
      registry,
    );

    expect(thunk).toHaveBeenCalledTimes(1);
  });
});

describe('registry in the prefetch walk -- the cycle guard survives bundle text', () => {
  it('a bundle that includes ITSELF raises CircularIncludeError rather than hanging', async () => {
    const loop: BundleData = { name: 'loop', files: { a: '!include <loop/a>' } };
    const registry = stdlibRegistry({ loop: async () => Promise.resolve({ loop }) });

    await expect(
      prefetchIncludes(uml('!include <loop/a>'), noFetch, undefined, registry),
    ).rejects.toBeInstanceOf(CircularIncludeError);
  });

  it('a TRANSITIVE bundle cycle raises CircularIncludeError', async () => {
    const ping: BundleData = { name: 'ping', files: { a: '!include <pong/b>' } };
    const pong: BundleData = { name: 'pong', files: { b: '!include <ping/a>' } };
    const registry = stdlibRegistry({
      ping: async () => Promise.resolve({ ping }),
      pong: async () => Promise.resolve({ pong }),
    });

    const err = await prefetchIncludes(uml('!include <ping/a>'), noFetch, undefined, registry).then(
      () => undefined,
      (e: unknown) => e as CircularIncludeError,
    );

    expect(err).toBeInstanceOf(CircularIncludeError);
    expect(err?.chain).toContain('<ping/a>');
  });

  it('an aliasOf cycle is a miss, not a hang', async () => {
    // `StdlibStore.ts#resolveBundle` guards this (upstream does not -- it would
    // infinite-loop the JVM); the collection loop in the resolver guards it too.
    const a: BundleData = { name: 'a', aliasOf: 'b', files: {} };
    const b: BundleData = { name: 'b', aliasOf: 'a', files: {} };
    const registry = stdlibRegistry({
      a: async () => Promise.resolve({ a }),
      b: async () => Promise.resolve({ b }),
    });

    await expect(
      prefetchIncludes(uml('!include <a/thing>'), noFetch, undefined, registry),
    ).rejects.toBeInstanceOf(StdlibNotBundledError);
  });
});

describe('registry in the prefetch walk -- failure modes stay distinguishable', () => {
  it('a registry lacking the bundle gives the NOT-REGISTERED path, not a chunk error', async () => {
    const registry = stdlibRegistry({
      c4: async () => Promise.resolve({ c4: { name: 'c4', files: { c4: 'class Base' } } }),
    });

    const err = await prefetchIncludes(
      uml('!include <tupadr3/font-awesome/star>'),
      noFetch,
      undefined,
      registry,
    ).then(
      () => undefined,
      (e: unknown) => e as StdlibNotBundledError,
    );

    expect(err).toBeInstanceOf(StdlibNotBundledError);
    expect(err).not.toBeInstanceOf(StdlibChunkLoadError);
    expect(err?.bundle).toBe('tupadr3');
  });

  it('a registered bundle whose chunk fails surfaces StdlibChunkLoadError', async () => {
    const cause = new Error('Failed to fetch dynamically imported module');
    const registry = stdlibRegistry({ tupadr3: async () => Promise.reject(cause) });

    const err = await prefetchIncludes(
      uml('!include <tupadr3/star>'),
      noFetch,
      undefined,
      registry,
    ).then(
      () => undefined,
      (e: unknown) => e as StdlibChunkLoadError,
    );

    expect(err).toBeInstanceOf(StdlibChunkLoadError);
    expect(err?.bundle).toBe('tupadr3');
    expect(err?.cause).toBe(cause);
  });
});

describe('registry in the prefetch walk -- inert for existing callers (criterion 3)', () => {
  it('with NO registry, an unresolvable bundle still throws StdlibNotBundledError', async () => {
    const err = await prefetchIncludes(uml('!include <c4/c4>'), noFetch).then(
      () => undefined,
      (e: unknown) => e as StdlibNotBundledError,
    );

    expect(err).toBeInstanceOf(StdlibNotBundledError);
    expect(err?.bundle).toBe('c4');
  });

  it('with NO registry, a withStdlib store still resolves (T1 behavior preserved)', async () => {
    const fake: BundleData = { name: 'fake', files: { thing: 'class Included' } };
    const svg = await render(uml('!include <fake/thing>', 'class Root'), {
      includeStore: withStdlib(new MapIncludeStore(), stdlibStore(fake)),
      measurer: measurer(),
    });

    expect(svg).toMatch(/>\s*Included\s*</);
    expect(svg).toMatch(/>\s*Root\s*</);
  });

  it('an eagerly-resolvable target never reaches the registry at all', async () => {
    // Ordering matters: the registry is the THIRD channel. If it were consulted
    // first, a host store and a registry disagreeing about the same name would
    // silently change which content wins.
    const thunk = vi.fn(async () =>
      Promise.resolve({ fake: { name: 'fake', files: { thing: 'class FromRegistry' } } }),
    );
    const fake: BundleData = { name: 'fake', files: { thing: 'class FromStore' } };

    const store = await prefetchIncludes(
      uml('!include <fake/thing>'),
      noFetch,
      withStdlib(new MapIncludeStore(), stdlibStore(fake)),
      stdlibRegistry({ fake: thunk }),
    );

    expect(thunk).not.toHaveBeenCalled();
    expect(store.getPumlResource?.('fake/thing')).toBe('class FromStore');
  });

  it('an exact-key hit also short-circuits ahead of the registry', async () => {
    const thunk = vi.fn(async () =>
      Promise.resolve({ fake: { name: 'fake', files: { thing: 'class FromRegistry' } } }),
    );

    const store = await prefetchIncludes(
      uml('!include <fake/thing>'),
      noFetch,
      new MapIncludeStore({ '<fake/thing>': 'class FromExactKey' }),
      stdlibRegistry({ fake: thunk }),
    );

    expect(thunk).not.toHaveBeenCalled();
    expect(store.get('<fake/thing>')).toBe('class FromExactKey');
  });

  it('ordinary http includes are untouched by the registry parameter', async () => {
    const fetcher = vi.fn(async () => Promise.resolve('class Fetched'));
    const registry = stdlibRegistry({ c4: async () => Promise.resolve({}) });

    const store = await prefetchIncludes(
      uml('!include https://example.com/a.puml'),
      fetcher,
      undefined,
      registry,
    );

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(store.get('https://example.com/a.puml')).toBe('class Fetched');
  });
});
