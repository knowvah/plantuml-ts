/**
 * si11b T4 -- routing the `<$name>` scan into the prefetch walk.
 *
 * Pins the five acceptance criteria from `T4-prefetch-routing.md`:
 *   1. `!include <bootstrap/bootstrap>` + three `<$name>` refs, prefetched
 *      against a split registration, fetches EXACTLY those 3 fragments --
 *      proven by `resolveResource`'s call count/args AND the fetcher's.
 *   2. A name supplied only via `RenderOptions.sprites` is fetched too, even
 *      though the scan cannot see it (ADR-5b), via `prepareIncludeStore`.
 *   3. A referenced name absent from the manifest raises a NAMED error, with
 *      NO request made for it (or for any name sorted after it).
 *   4. With NO split registration, an ordinary bundle's `!include
 *      <bundle/thing>` resolves exactly as si11a left it -- proven directly
 *      (not just by the untouched si11a suites staying green).
 *   5. Fetches completing in a different order across two runs produce a
 *      BYTE-IDENTICAL assembled payload.
 *
 * Plus a regression guard for an orchestrator review finding: `options.sprites`
 * (ADR-5b) must apply at EVERY prefetch-walk recursion level, not just the
 * top-level source -- otherwise a sprite-split `!include` reached through a
 * diagram author's own shared header (a nested fetched include) silently
 * drops an option-named sprite, exactly the failure ADR-5a forbids.
 *
 * Registration mirrors the REAL generated shape (`stdlib-registry.test.ts`'s
 * `ALIAS`/`CONCRETE` pair): one thunk resolving to an object holding BOTH the
 * `bootstrap` alias stub and the concrete `bootstrap1.13.1` sprite-split
 * bundle, exactly as `packages/stdlib/generated/bootstrap.js` ships them.
 *
 * @see ../../src/core/stdlib-content.ts -- `stdlibContentFor`
 * @see ../../src/core/include-resolver.ts -- `PrefetchWalk`
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  prefetchIncludes,
  prepareIncludeStore,
  type IncludeFetcher,
} from '../../src/core/include-resolver.js';
import {
  spriteSplitStdlib,
  SpriteNotBundledError,
  type SpriteSplitManifest,
} from '../../src/core/sprite-split-stdlib.js';
import { createSpriteRegistry, getSpriteSvg, matchSpriteCommand } from '../../src/core/sprite-commands.js';
import { stdlibRegistry, type StdlibRegistry } from '../../src/core/tim/StdlibRegistry.js';
import type { BundleData } from '../../src/core/tim/StdlibStore.js';

/** A fetcher that must never run -- every target below is a bundle. */
const noFetch = (url: string): Promise<string> =>
  Promise.reject(new Error(`unexpected ordinary-http fetch for ${url}`));

function uml(...lines: readonly string[]): string {
  return ['@startuml', ...lines, '@enduml'].join('\n');
}

/** `sprites/<name>.puml`'s fixture content -- distinguishable per name. */
function fragmentFor(name: string): string {
  return `sprite ${name} <svg width="16" height="16"></svg>\n`;
}

const MANIFEST: SpriteSplitManifest = {
  name: 'bootstrap1.13.1',
  sprites: ['bi-bootstrap-fill', 'bi-globe', 'bi-heart'],
};
const ALIAS: BundleData = { name: 'bootstrap', aliasOf: 'bootstrap1.13.1', files: {} };
const BASE_URL = 'https://cdn.example.com/bootstrap1.13.1';

/**
 * Register the real generated shape: ONE thunk resolving to `{ bootstrap:
 * ALIAS, 'bootstrap1_13_1': <split bundle> }` (`stdlib-registry.test.ts`'s
 * `ALIAS`/`CONCRETE` precedent), keyed under `bootstrap` -- matching how a
 * diagram author actually writes `!include <bootstrap/bootstrap>`.
 */
function registrySplitBootstrap(fetcher: IncludeFetcher): StdlibRegistry {
  return stdlibRegistry({
    bootstrap: () =>
      Promise.resolve({
        bootstrap: ALIAS,
        bootstrap1_13_1: spriteSplitStdlib({ manifest: MANIFEST, baseUrl: BASE_URL, fetcher }),
      }),
  });
}

describe('sprite-split prefetch -- exactly the referenced sprites (criterion 1)', () => {
  it('fetches exactly 3 fragments, in sorted order, proven by call count and args', async () => {
    const remoteFetcher = vi.fn((url: string) => {
      const name = url.slice(url.lastIndexOf('/') + 1, -'.puml'.length);
      return Promise.resolve(fragmentFor(name));
    });
    const registry = registrySplitBootstrap(remoteFetcher);
    const resolveResourceSpy = vi.spyOn(registry, 'resolveResource');

    const store = await prefetchIncludes(
      uml(
        '!include <bootstrap/bootstrap>',
        'usecase a as "<$bi-globe>"',
        'usecase b as "<$bi-bootstrap-fill>"',
        'usecase c as "<$bi-heart>"',
      ),
      noFetch,
      undefined,
      registry,
    );

    expect(resolveResourceSpy).toHaveBeenCalledTimes(3);
    expect(resolveResourceSpy).toHaveBeenNthCalledWith(1, 'bootstrap1.13.1', 'bi-bootstrap-fill');
    expect(resolveResourceSpy).toHaveBeenNthCalledWith(2, 'bootstrap1.13.1', 'bi-globe');
    expect(resolveResourceSpy).toHaveBeenNthCalledWith(3, 'bootstrap1.13.1', 'bi-heart');

    expect(remoteFetcher).toHaveBeenCalledTimes(3);
    expect(remoteFetcher).toHaveBeenCalledWith(`${BASE_URL}/sprites/bi-bootstrap-fill.puml`);
    expect(remoteFetcher).toHaveBeenCalledWith(`${BASE_URL}/sprites/bi-globe.puml`);
    expect(remoteFetcher).toHaveBeenCalledWith(`${BASE_URL}/sprites/bi-heart.puml`);

    expect(store.get('<bootstrap/bootstrap>')).toBe(
      fragmentFor('bi-bootstrap-fill') + fragmentFor('bi-globe') + fragmentFor('bi-heart'),
    );
  });
});

describe('sprite-split prefetch -- RenderOptions.sprites escape hatch (criterion 2, ADR-5b)', () => {
  it('fetches a name the scan cannot see, supplied only via options.sprites', async () => {
    const remoteFetcher = vi.fn((url: string) => {
      const name = url.slice(url.lastIndexOf('/') + 1, -'.puml'.length);
      return Promise.resolve(fragmentFor(name));
    });
    const registry = registrySplitBootstrap(remoteFetcher);
    const resolveResourceSpy = vi.spyOn(registry, 'resolveResource');

    // No `<$name>` markup at all -- the scan alone would find nothing.
    const store = await prepareIncludeStore(uml('!include <bootstrap/bootstrap>'), {
      fetcher: noFetch,
      stdlibRegistry: registry,
      sprites: ['bi-globe'],
    });

    expect(resolveResourceSpy).toHaveBeenCalledTimes(1);
    expect(resolveResourceSpy).toHaveBeenCalledWith('bootstrap1.13.1', 'bi-globe');
    expect(remoteFetcher).toHaveBeenCalledTimes(1);
    expect(store.get('<bootstrap/bootstrap>')).toBe(fragmentFor('bi-globe'));
  });

  it('unions the scan and the option -- both land in the sorted, deduplicated result', async () => {
    const remoteFetcher = vi.fn((url: string) => {
      const name = url.slice(url.lastIndexOf('/') + 1, -'.puml'.length);
      return Promise.resolve(fragmentFor(name));
    });
    const registry = registrySplitBootstrap(remoteFetcher);

    const store = await prepareIncludeStore(
      uml('!include <bootstrap/bootstrap>', 'usecase a as "<$bi-heart>"'),
      { fetcher: noFetch, stdlibRegistry: registry, sprites: ['bi-globe', 'bi-heart'] },
    );

    // 'bi-heart' named by BOTH the scan and the option: one fetch, not two.
    expect(remoteFetcher).toHaveBeenCalledTimes(2);
    expect(store.get('<bootstrap/bootstrap>')).toBe(fragmentFor('bi-globe') + fragmentFor('bi-heart'));
  });

  it('reaches a sprite-split !include nested inside a plain shared header, not just the top level', async () => {
    const remoteFetcher = vi.fn((url: string) => {
      const name = url.slice(url.lastIndexOf('/') + 1, -'.puml'.length);
      return Promise.resolve(fragmentFor(name));
    });
    const registry = registrySplitBootstrap(remoteFetcher);

    // A normal (non-stdlib) include, resolved by the ordinary fetch channel.
    // Its fetched CONTENT -- not the top-level source -- is what the walk
    // re-enters, and is what carries `!include <bootstrap/bootstrap>`.
    const headerFetcher: IncludeFetcher = (url: string) =>
      url === 'header.puml'
        ? Promise.resolve('!include <bootstrap/bootstrap>')
        : Promise.reject(new Error(`unexpected ordinary-http fetch for ${url}`));

    // No `<$name>` markup anywhere -- neither the top-level source nor the
    // nested header contains one. Only `sprites` names 'bi-globe'.
    const store = await prepareIncludeStore(uml('!include header.puml'), {
      fetcher: headerFetcher,
      stdlibRegistry: registry,
      sprites: ['bi-globe'],
    });

    expect(remoteFetcher).toHaveBeenCalledTimes(1);
    expect(remoteFetcher).toHaveBeenCalledWith(`${BASE_URL}/sprites/bi-globe.puml`);
    expect(store.get('<bootstrap/bootstrap>')).toBe(fragmentFor('bi-globe'));
  });
});

describe('sprite-split prefetch -- absent name (criterion 3, ADR-5a)', () => {
  it('names the missing sprite and issues NO request for it or its siblings', async () => {
    const remoteFetcher = vi.fn(async () => Promise.resolve('unused'));
    const registry = registrySplitBootstrap(remoteFetcher);

    const err = await prefetchIncludes(
      uml(
        '!include <bootstrap/bootstrap>',
        'usecase a as "<$bi-globe>"',
        'usecase z as "<$bi-not-a-real-sprite>"',
      ),
      noFetch,
      undefined,
      registry,
    ).then(
      () => undefined,
      (e: unknown) => e as SpriteNotBundledError,
    );

    expect(err).toBeInstanceOf(SpriteNotBundledError);
    expect(err?.bundle).toBe('bootstrap1.13.1');
    expect(err?.sprite).toBe('bi-not-a-real-sprite');
    // Every name is validated against the manifest BEFORE any fetch starts,
    // so the valid sibling ('bi-globe') costs no request either.
    expect(remoteFetcher).not.toHaveBeenCalled();
  });
});

describe('sprite-split prefetch -- no split registration (criterion 4, regression)', () => {
  it('an ORDINARY registered bundle resolves its whole resource, unaffected by sprite-split code', async () => {
    const ordinary: BundleData = {
      name: 'bootstrap1.13.1',
      files: { bootstrap: 'sprite $bi-globe <svg></svg>\nsprite $bi-heart <svg></svg>' },
    };
    const registry = stdlibRegistry({
      bootstrap: () => Promise.resolve({ bootstrap: ALIAS, bootstrap1_13_1: ordinary }),
    });
    const resolveResourceSpy = vi.spyOn(registry, 'resolveResource');

    const store = await prefetchIncludes(uml('!include <bootstrap/bootstrap>'), noFetch, undefined, registry);

    // Exactly the pre-si11b behavior: one call, keyed 'bootstrap', whole content.
    expect(resolveResourceSpy).toHaveBeenCalledTimes(1);
    expect(resolveResourceSpy).toHaveBeenCalledWith('bootstrap1.13.1', 'bootstrap');
    expect(store.get('<bootstrap/bootstrap>')).toBe(ordinary.files['bootstrap']);
  });
});

describe('sprite-split prefetch -- determinism regardless of completion order (criterion 5)', () => {
  /**
   * A fetcher whose 3 fragment requests settle in a DIFFERENT real order than
   * they were issued in, controlled by a per-name delay -- proving the
   * assembled payload depends on `sortedNames`' fixed order (a `Promise.all`
   * over an array built before any fetch starts), never on settle order.
   */
  function delayedFetcher(delayMsFor: Readonly<Record<string, number>>): IncludeFetcher {
    return (url: string) =>
      new Promise<string>((resolve) => {
        const name = url.slice(url.lastIndexOf('/') + 1, -'.puml'.length);
        setTimeout(() => resolve(fragmentFor(name)), delayMsFor[name] ?? 0);
      });
  }

  it('the assembled payload is byte-identical whether fragments settle forward or reversed', async () => {
    const source = uml(
      '!include <bootstrap/bootstrap>',
      'usecase a as "<$bi-globe>"',
      'usecase b as "<$bi-bootstrap-fill>"',
      'usecase c as "<$bi-heart>"',
    );

    async function runWithDelays(delayMsFor: Readonly<Record<string, number>>): Promise<string | undefined> {
      const registry = registrySplitBootstrap(delayedFetcher(delayMsFor));
      const store = await prefetchIncludes(source, noFetch, undefined, registry);
      return store.get('<bootstrap/bootstrap>');
    }

    // Run 1: alphabetically-first fragment settles LAST. Run 2: reversed.
    const forward = await runWithDelays({ 'bi-bootstrap-fill': 30, 'bi-globe': 15, 'bi-heart': 0 });
    const reversed = await runWithDelays({ 'bi-bootstrap-fill': 0, 'bi-globe': 15, 'bi-heart': 30 });

    expect(forward).toBe(reversed);
    expect(forward).toBe(
      fragmentFor('bi-bootstrap-fill') + fragmentFor('bi-globe') + fragmentFor('bi-heart'),
    );
  });
});

describe('sprite-split prefetch -- registration against a REAL emitted fragment (method rule 2)', () => {
  it('a fetched bi-globe.puml fragment still registers via matchSpriteCommand, unmodified', async () => {
    const realFragment = readFileSync(
      join(process.cwd(), 'packages/stdlib/assets/bootstrap1.13.1/sprites/bi-globe.puml'),
      'utf8',
    );
    const registry = registrySplitBootstrap((url: string) => {
      const name = url.slice(url.lastIndexOf('/') + 1, -'.puml'.length);
      return Promise.resolve(name === 'bi-globe' ? realFragment : fragmentFor(name));
    });

    const store = await prefetchIncludes(
      uml('!include <bootstrap/bootstrap>', 'usecase a as "<$bi-globe>"'),
      noFetch,
      undefined,
      registry,
    );

    const assembled = store.get('<bootstrap/bootstrap>');
    expect(assembled).toBe(realFragment);

    const sprites = createSpriteRegistry();
    const lines = (assembled ?? '').split('\n');
    const result = matchSpriteCommand(lines, 0, sprites);
    expect(result).not.toBeNull();

    const sprite = getSpriteSvg(sprites, 'bi-globe');
    expect(sprite?.width).toBe(16);
    expect(sprite?.height).toBe(16);
  });
});

/**
 * Orchestrator review finding: si11a re-exports `remoteStdlib` from
 * `src/index.ts` because `package.json`'s "exports" map has a single "."
 * entry -- that file is the ONLY surface a consumer of the built library can
 * import from. si11b's registration helper first shipped without that
 * re-export, so the feature was unreachable from the public API while every
 * unit test (importing by relative path) passed. This pins the fix.
 */
describe('si11b public surface', () => {
  it('reaches the per-sprite registration helper from the package entry point', async () => {
    const entry = await import('../../src/index.js');

    expect(typeof entry.spriteSplitStdlib).toBe('function');
    expect(typeof entry.SpriteNotBundledError).toBe('function');
    // The si11a helper it sits beside, as the shape being matched.
    expect(typeof entry.remoteStdlib).toBe('function');
  });
});
