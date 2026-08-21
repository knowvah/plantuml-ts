/**
 * `fixtureIncludeStore` contract.
 *
 * Both properties asserted here are ones a copy of this seam ALREADY got
 * wrong before it was consolidated: the census's copy drifted eager while its
 * siblings deferred, and the sequence ratchet shipped with no store at all.
 * Pinning them is what stops the drift recurring in a module whose whole
 * purpose is that the conformance surfaces measure one population.
 */
import { describe, it, expect } from 'vitest';

import type { StdlibStore } from '../../src/core/tim/StdlibStore.js';
import { createFixtureIncludeStore, fixtureIncludeStore } from './fixture-include-store.js';

/** A stub assets store that records how many times it was BUILT, so a test can
 *  distinguish "not built yet" from "built and unused". */
function countingAssets(): { build: () => StdlibStore; builds: () => number } {
  let builds = 0;
  return {
    build: () => {
      builds++;
      return { getPumlResource: (fullname: string) => `resolved:${fullname}` };
    },
    builds: () => builds,
  };
}

describe('createFixtureIncludeStore', () => {
  it('does not build the assets store until the first bundle lookup', () => {
    const assets = countingAssets();

    const store = createFixtureIncludeStore(assets.build);

    // Constructing the include store must not touch the ~888ms assets walk.
    expect(assets.builds()).toBe(0);

    store.getPumlResource?.('tupadr3/common.puml');
    expect(assets.builds()).toBe(1);
  });

  it('builds the assets store at most once across many lookups', () => {
    const assets = countingAssets();
    const store = createFixtureIncludeStore(assets.build);

    store.getPumlResource?.('tupadr3/common.puml');
    store.getPumlResource?.('logos/centos');
    store.getPumlResource?.('tupadr3/common.puml');

    expect(assets.builds()).toBe(1);
  });

  it('resolves a bundle name through the assets store it was given', () => {
    const assets = countingAssets();
    const store = createFixtureIncludeStore(assets.build);

    expect(store.getPumlResource?.('logos/centos')).toBe('resolved:logos/centos');
  });

  it('resolves no plain (non-stdlib) include, so fixtures cannot read the filesystem', () => {
    const store = createFixtureIncludeStore(countingAssets().build);

    expect(store.has('./neighbour.puml')).toBe(false);
    expect(store.get('./neighbour.puml')).toBeUndefined();
  });
});

describe('fixtureIncludeStore', () => {
  it('returns the same process-wide instance on every call', () => {
    expect(fixtureIncludeStore()).toBe(fixtureIncludeStore());
  });
});
