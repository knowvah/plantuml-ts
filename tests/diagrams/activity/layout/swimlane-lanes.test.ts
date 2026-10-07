import { describe, expect, it } from 'vitest';
import { laneAt, laneIn, laneOut } from '../../../../src/diagrams/activity/layout/swimlane-lanes.js';
import type { Tile } from '../../../../src/diagrams/activity/tiles/tile.js';

/** A minimal stub satisfying `Tile` structurally -- `laneIn`/`laneOut`/
 *  `laneAt` only ever read `kind`/`swimlane`/`swimlaneOut`/`children`. */
function stub(kind: string, extra: Partial<Tile> & { children?: readonly Tile[] } = {}): Tile {
  return { kind, width: 0, height: 0, ...extra } as unknown as Tile;
}

describe('laneAt', () => {
  it("a tile's own swimlane wins over inherited", () => {
    expect(laneAt(stub('action', { swimlane: 'A' }), 'B')).toBe('A');
  });

  it('falls back to inherited when unset', () => {
    expect(laneAt(stub('action'), 'B')).toBe('B');
  });
});

describe('laneIn/laneOut — plain leaf (no delegation)', () => {
  it('laneIn/laneOut both read the leaf\'s own swimlane', () => {
    const leaf = stub('action', { swimlane: 'A' });
    expect(laneIn(leaf, 'B')).toBe('A');
    expect(laneOut(leaf, 'B')).toBe('A');
  });

  it('laneOut prefers swimlaneOut over swimlane (fork/split/repeat, D1)', () => {
    const leaf = stub('gtile-fork', { swimlane: 'A', swimlaneOut: 'C' });
    expect(laneOut(leaf, 'B')).toBe('C');
  });

  it('both fall back to inherited when the leaf has neither', () => {
    const leaf = stub('action');
    expect(laneIn(leaf, 'B')).toBe('B');
    expect(laneOut(leaf, 'B')).toBe('B');
  });
});

describe('laneIn/laneOut — gtile-top-down delegates to first/last child', () => {
  it('laneIn is the FIRST child\'s own lane, laneOut is the LAST', () => {
    const first = stub('action', { swimlane: 'A' });
    const last = stub('action', { swimlane: 'B' });
    const topDown = stub('gtile-top-down', { children: [first, last] });
    expect(laneIn(topDown, 'Z')).toBe('A');
    expect(laneOut(topDown, 'Z')).toBe('B');
  });
});

// T3i (row PART-XLANE, `notuli-49-xugi698`): `FtileGroup.getSwimlaneIn/
// Out()` (`FtileGroup.java:131-137`) UNCONDITIONALLY delegate to `inner`
// -- never read an own field first. `tile-layout-structural.ts#tileGroup`
// tags every group/partition tile with `withSwimlane(tile, node.swimlane)`
// (the group's OWN entry lane, used for other purposes), which must NOT
// shadow this delegation the way it would for a plain leaf.
describe('laneIn/laneOut — gtile-group/gtile-partition delegate to the body, ignoring their own tag', () => {
  for (const kind of ['gtile-group', 'gtile-partition']) {
    it(`${kind}: laneOut is the body's LAST child's lane, not the group's own tag`, () => {
      const first = stub('action', { swimlane: 'Lane1' });
      const last = stub('action', { swimlane: 'Lane2' });
      const body = stub('gtile-top-down', { children: [first, last] });
      const group = stub(kind, { swimlane: 'Lane1', children: [body] });
      expect(laneOut(group, 'Z')).toBe('Lane2');
      expect(laneIn(group, 'Z')).toBe('Lane1');
    });
  }

  it('an EMPTY body falls back to the group\'s own tag, not the caller\'s inherited', () => {
    // `partition P1 {}` (`sifite-87-ziti434`) -- a real regression this
    // fix-up catches: delegating into an empty `gtile-top-down` with no
    // own swimlane must not surface the OUTER ambient lane instead.
    const emptyBody = stub('gtile-top-down', { children: [] });
    const group = stub('gtile-partition', { swimlane: 'Lane2', children: [emptyBody] });
    expect(laneIn(group, 'Ambient')).toBe('Lane2');
    expect(laneOut(group, 'Ambient')).toBe('Lane2');
  });

  it('an empty body with no group tag either falls back to inherited', () => {
    const emptyBody = stub('gtile-top-down', { children: [] });
    const group = stub('gtile-partition', { children: [emptyBody] });
    expect(laneIn(group, 'Ambient')).toBe('Ambient');
    expect(laneOut(group, 'Ambient')).toBe('Ambient');
  });
});
