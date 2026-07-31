/**
 * si8 T2 -- `StdlibRegistry`, the lazy per-bundle registration seam.
 *
 * Four concerns are pinned here:
 *   1. Caching -- one `import()` per bundle, even under concurrency.
 *   2. The two failure modes staying DISTINCT: not registered is `undefined`,
 *      registered-but-failed is a thrown `StdlibChunkLoadError` (ADR-5).
 *   3. Module-shape unwrapping against the shapes the generators really emit
 *      (the generated modules under `packages/`), not the shape a package's
 *      `exports` map implies.
 *   4. Case-insensitive bundle names, matching `stdlibStore`.
 *
 * The module is integration-free at this point -- T3 wires it into the prefetch
 * walk -- so these tests drive the real caching and error behavior directly
 * rather than through a render pipeline.
 *
 * @see ../../src/core/tim/StdlibRegistry.ts
 */
import { describe, expect, it, vi } from 'vitest';
import { StdlibChunkLoadError, stdlibRegistry } from '../../src/core/tim/StdlibRegistry.js';
import { stdlibStore, type BundleData } from '../../src/core/tim/StdlibStore.js';
import * as publicApi from '../../src/index.js';
import { prepareIncludeStore, renderSync } from '../../src/index.js';
import { FormulaMeasurer } from '../../src/core/measurer.js';
import { StdlibNotBundledError } from '../../src/core/tim/IncludeStore.js';

const C4: BundleData = { name: 'c4', files: { c4_context: 'class C4Context' } };

/**
 * The real shape of `packages/stdlib/generated/bootstrap.js`: one chunk holding
 * an alias stub with NO files plus the concrete payload, whose export
 * identifier (`bootstrap1_13_1`) does not spell its `name` (`bootstrap1.13.1`).
 */
const ALIAS: BundleData = { name: 'bootstrap', aliasOf: 'bootstrap1.13.1', files: {} };
const CONCRETE: BundleData = { name: 'bootstrap1.13.1', files: { 'bi-globe': 'SPRITE' } };

describe('stdlibRegistry -- loading and caching', () => {
  it('invokes the thunk once across two sequential resolves and returns the same BundleData', async () => {
    const thunk = vi.fn(async () => Promise.resolve({ c4: C4 }));
    const registry = stdlibRegistry({ c4: thunk });

    const first = await registry.resolve('c4');
    const second = await registry.resolve('c4');

    expect(thunk).toHaveBeenCalledTimes(1);
    expect(first).toBe(C4);
    expect(second).toBe(C4);
  });

  it('shares one load between two CONCURRENT resolves of the same unloaded bundle', async () => {
    // The memo has to hold the PROMISE, not the result: memoizing only the
    // settled value leaves a window where both callers see an empty cache and
    // each fires its own import().
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const thunk = vi.fn(async () => {
      await gate;
      return { c4: C4 };
    });
    const registry = stdlibRegistry({ c4: thunk });

    const both = Promise.all([registry.resolve('c4'), registry.resolve('c4')]);
    release?.();

    expect(await both).toEqual([C4, C4]);
    expect(thunk).toHaveBeenCalledTimes(1);
  });

  it('resolves case-insensitively, as stdlibStore does', async () => {
    const registry = stdlibRegistry({ c4: async () => Promise.resolve({ c4: C4 }) });
    expect(await registry.resolve('C4')).toBe(C4);
  });
});

describe('stdlibRegistry -- the two failure modes stay distinct', () => {
  it('an unregistered bundle returns undefined and does not throw', async () => {
    const registry = stdlibRegistry({ c4: async () => Promise.resolve({ c4: C4 }) });
    expect(await registry.resolve('tupadr3')).toBeUndefined();
  });

  it('a rejecting thunk throws StdlibChunkLoadError naming the bundle and keeping the cause', async () => {
    const cause = new Error('Failed to fetch dynamically imported module');
    const registry = stdlibRegistry({ tupadr3: async () => Promise.reject(cause) });

    const err = await registry.resolve('tupadr3').then(
      () => undefined,
      (e: unknown) => e as StdlibChunkLoadError,
    );

    expect(err).toBeInstanceOf(StdlibChunkLoadError);
    expect(err?.name).toBe('StdlibChunkLoadError');
    expect(err?.bundle).toBe('tupadr3');
    expect(err?.cause).toBe(cause);
    expect(err?.message).toContain('Failed to fetch dynamically imported module');
  });

  it('a registered bundle whose chunk carries no matching BundleData returns undefined', async () => {
    // Loaded fine, but the module holds nothing whose `name` is 'c4' -- that is
    // a not-found, not a chunk-load failure. (The export IDENTIFIER is
    // irrelevant here; only the `name` field is matched.)
    const elsewhere: BundleData = { name: 'archimate', files: { archimate: 'X' } };
    const registry = stdlibRegistry({ c4: async () => Promise.resolve({ c4: elsewhere }) });
    expect(await registry.resolve('c4')).toBeUndefined();
  });

  it('a failed load can be retried rather than being cached as permanent', async () => {
    const thunk = vi
      .fn<[], Promise<unknown>>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ c4: C4 });
    const registry = stdlibRegistry({ c4: thunk });

    await expect(registry.resolve('c4')).rejects.toBeInstanceOf(StdlibChunkLoadError);
    expect(await registry.resolve('c4')).toBe(C4);
    expect(thunk).toHaveBeenCalledTimes(2);
  });
});

describe('stdlibRegistry -- module shapes the generators really emit', () => {
  it('unwraps a named export', async () => {
    const registry = stdlibRegistry({ c4: async () => Promise.resolve({ c4: C4 }) });
    expect(await registry.resolve('c4')).toBe(C4);
  });

  it('unwraps a default export', async () => {
    const registry = stdlibRegistry({ c4: async () => Promise.resolve({ default: C4 }) });
    expect(await registry.resolve('c4')).toBe(C4);
  });

  it('unwraps a namespace held under default (CJS interop)', async () => {
    const registry = stdlibRegistry({ c4: async () => Promise.resolve({ default: { c4: C4 } }) });
    expect(await registry.resolve('c4')).toBe(C4);
  });

  it('keys by the name FIELD, not the export identifier', async () => {
    // The generator mangles identifiers to valid JS: the bundle named
    // 'bootstrap1.13.1' is exported as `bootstrap1_13_1`
    // (packages/stdlib/generated/bootstrap.js). Matching the identifier would
    // never find it.
    const registry = stdlibRegistry({
      bootstrap: async () => Promise.resolve({ bootstrap1_13_1: CONCRETE, bootstrap: ALIAS }),
    });

    // Requested under the ENTRY name; the concrete record is then addressable by
    // its `name` field, which the identifier `bootstrap1_13_1` does not spell.
    await registry.resolve('bootstrap');
    expect(await registry.resolve('bootstrap1.13.1')).toBe(CONCRETE);
  });

  it('an unloaded chunk cannot be addressed by a name it has not yet revealed', async () => {
    // Laziness has a consequence T3 must respect: 'bootstrap1.13.1' is only
    // discoverable once the 'bootstrap' chunk is loaded. Speculatively loading
    // chunks to find a name would mean loading everything to resolve one thing,
    // which is the opposite of this module's purpose. So the alias flow is
    // ordered: resolve the alias, read `aliasOf`, resolve the target.
    const thunk = vi.fn(async () => Promise.resolve({ bootstrap1_13_1: CONCRETE }));
    const registry = stdlibRegistry({ bootstrap: thunk });

    expect(await registry.resolve('bootstrap1.13.1')).toBeUndefined();
    expect(thunk).not.toHaveBeenCalled();
  });

  it('harvests EVERY bundle in one chunk, so an alias and its target both become available', async () => {
    // The real shape of packages/stdlib/generated/bootstrap.js: an alias stub
    // with no files, plus the concrete payload, in the SAME module. Returning
    // only the export named after the requested bundle yields files:{} and
    // <bootstrap/bi-globe> resolves to nothing.
    const thunk = vi.fn(async () =>
      Promise.resolve({ bootstrap: ALIAS, bootstrap1_13_1: CONCRETE }),
    );
    const registry = stdlibRegistry({ bootstrap: thunk });

    const requested = await registry.resolve('bootstrap');
    expect(requested).toBe(ALIAS);
    expect(requested?.aliasOf).toBe('bootstrap1.13.1');

    // The alias target is served from the SAME chunk -- no second import(), and
    // no separate registration entry required.
    expect(await registry.resolve('bootstrap1.13.1')).toBe(CONCRETE);
    expect(thunk).toHaveBeenCalledTimes(1);
  });

  it('alias semantics stay in stdlibStore: both harvested records together resolve the file', async () => {
    // This is the cooperation the registry is built for -- it supplies records,
    // `stdlibStore#resolveBundle` follows `link:`/`aliasOf` and guards cycles.
    const registry = stdlibRegistry({
      bootstrap: async () => Promise.resolve({ bootstrap: ALIAS, bootstrap1_13_1: CONCRETE }),
    });

    const requested = await registry.resolve('bootstrap');
    const target = await registry.resolve(requested?.aliasOf ?? '');

    expect(stdlibStore(requested!, target!).getPumlResource('bootstrap/bi-globe')).toBe('SPRITE');
  });

  it('ignores exports that are not BundleData-shaped', async () => {
    const registry = stdlibRegistry({
      c4: async () => Promise.resolve({ version: '1.0', helper: () => 0, c4: C4 }),
    });
    expect(await registry.resolve('c4')).toBe(C4);
  });
});

// ---------------------------------------------------------------------------
// si8 T4 -- the sync warm-up, the public surface, and the rewritten error.
//
// `renderSync` cannot await a dynamic import() and stays synchronous (public
// API, hard constraint), so lazy registration is `render()`-only and sync
// callers do the two steps by hand. ADR-5.
// ---------------------------------------------------------------------------

const measurer = (): FormulaMeasurer => new FormulaMeasurer();
const SOURCE = ['@startuml', '!include <c4/c4>', 'class Root', '@enduml'].join('\n');
const C4_DOC: BundleData = { name: 'c4', files: { c4: 'class Included' } };

describe('prepareIncludeStore -- the renderSync warm-up (ADR-5)', () => {
  it('warms a store that renderSync then renders the bundle content from', async () => {
    const includeStore = await prepareIncludeStore(SOURCE, {
      stdlibRegistry: stdlibRegistry({ c4: async () => Promise.resolve({ c4: C4_DOC }) }),
    });

    const svg = renderSync(SOURCE, { includeStore, measurer: measurer() });

    expect(svg).toMatch(/>\s*Included\s*</);
    expect(svg).toMatch(/>\s*Root\s*</);
  });

  it('leaves renderSync synchronous -- the warm-up is a separate, prior step', () => {
    // If this ever returns a Promise, `renderSync` has become async and that is
    // a hard STOP for this mission, not a test to update.
    const svg = renderSync(['@startuml', 'class Solo', '@enduml'].join('\n'), {
      measurer: measurer(),
    });
    expect(typeof svg).toBe('string');
  });

  it('a chunk failure during warm-up throws StdlibChunkLoadError, not the not-registered error', async () => {
    const cause = new Error('Failed to fetch dynamically imported module');
    const registry = stdlibRegistry({ c4: async () => Promise.reject(cause) });

    const err = await prepareIncludeStore(SOURCE, { stdlibRegistry: registry }).then(
      () => undefined,
      (e: unknown) => e as StdlibChunkLoadError,
    );

    expect(err).toBeInstanceOf(StdlibChunkLoadError);
    expect(err).not.toBeInstanceOf(StdlibNotBundledError);
    expect(err?.cause).toBe(cause);
  });

  it('an unregistered bundle during warm-up throws StdlibNotBundledError', async () => {
    const registry = stdlibRegistry({ other: async () => Promise.resolve({}) });

    const err = await prepareIncludeStore(SOURCE, { stdlibRegistry: registry }).then(
      () => undefined,
      (e: unknown) => e as StdlibNotBundledError,
    );

    expect(err).toBeInstanceOf(StdlibNotBundledError);
    expect(err?.bundle).toBe('c4');
  });
});

describe('StdlibNotBundledError -- the rewritten remedy (ADR-5)', () => {
  it('with a registry supplied, it says the entry is MISSING and never mentions includeStore', () => {
    const err = new StdlibNotBundledError('<aws/common>', 'aws/common', true);

    expect(err.registrySupplied).toBe(true);
    expect(err.bundle).toBe('aws');
    expect(err.message).toContain('<aws/common>');
    expect(err.message).toContain("has no entry for 'aws'");
    // The old text advised this unconditionally, which is the wrong fix for a
    // caller who supplied a registry and merely forgot one entry.
    expect(err.message).not.toContain('options.includeStore');
    // Must not read like the chunk-load failure, which has a different fix.
    expect(err.message).toContain('not a failed chunk load');
  });

  it('with no registry, it offers the render(), renderSync() and includeStore routes', () => {
    const err = new StdlibNotBundledError('<aws/common>', 'aws/common');

    expect(err.registrySupplied).toBe(false);
    expect(err.message).toContain('options.stdlibRegistry');
    expect(err.message).toContain('prepareIncludeStore');
    expect(err.message).toContain('options.includeStore');
  });

  it('defaults registrySupplied to false, so the sync IncludeExecutor path is unchanged', () => {
    // `IncludeExecutor#load` never has a registry and still constructs this with
    // two arguments; the third is optional precisely so that call site is untouched.
    expect(new StdlibNotBundledError('<c4/c4>', 'c4/c4').registrySupplied).toBe(false);
  });
});

describe('public surface (criterion 5)', () => {
  it('exports the registry API and the warm-up from the package entry point', () => {
    // package.json's "exports" has a single "." entry, so index.ts is the only
    // surface a consumer of the built library can reach.
    expect(typeof publicApi.stdlibRegistry).toBe('function');
    expect(typeof publicApi.prepareIncludeStore).toBe('function');
    expect(typeof publicApi.StdlibChunkLoadError).toBe('function');
  });

  it('keeps the SI5b eager API exported and unchanged (ADR-3: the registry is additive)', () => {
    expect(typeof publicApi.stdlibStore).toBe('function');
    expect(typeof publicApi.withStdlib).toBe('function');

    const store = publicApi.withStdlib(
      { get: () => undefined, has: () => false },
      publicApi.stdlibStore(C4_DOC),
    );
    expect(store.getPumlResource?.('c4/c4')).toBe('class Included');
  });
});
