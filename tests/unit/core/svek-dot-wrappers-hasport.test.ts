import { describe, it, expect } from 'vitest';
import { wrapperLevels } from '../../../src/core/svek-dot-wrappers.js';
import type { DotInputCluster } from '../../../src/core/graph-layout.types.js';

/** `ClusterDotString.java:98,109-112,151`: a hasPort cluster has protection off and
 *  `a`/`i` on `thereALinkFromOrToGroup1` (T4b opt-in via `borderPointAncestorWrap`). */
const hasPort = (extra: Partial<DotInputCluster>): DotInputCluster => ({
  id: 'cluster0',
  nodeIds: [],
  portRanks: [{ rank: 'source', nodeIds: ['p'] }],
  portAnchorId: 'zaent0',
  ...extra,
});

describe('wrapperLevels for a hasPort cluster', () => {
  it('yields a/i only, never p0/p1, when borderPointAncestorWrap is set', () => {
    expect(wrapperLevels(hasPort({ borderPointAncestorWrap: true }))).toEqual({
      a: true,
      p0: false,
      i: true,
      p1: false,
    });
  });

  it('is unchanged (no wrappers) without the opt-in and without innerMarginLevels', () => {
    expect(wrapperLevels(hasPort({}))).toEqual({ a: false, p0: false, i: false, p1: false });
  });
});
