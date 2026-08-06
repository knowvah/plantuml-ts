import { describe, expect, it } from 'vitest';

import { isPureInnerLink12, isPureInnerLink3 } from '../../../../src/core/abel/EntityUtils.js';
import { LeafType } from '../../../../src/core/abel/LeafType.js';
import { GroupType } from '../../../../src/core/abel/GroupType.js';
import { makeWorld, makeLeaf, makeGroup, MockLink } from './helpers.js';

/** Behavior tests from abel/EntityUtils.java:43-88. */
describe('EntityUtils', () => {
  it('both predicates reject a non-group subject', () => {
    const world = makeWorld();
    const a = makeLeaf(world, 'A');
    const b = makeLeaf(world, 'B');
    const link = new MockLink(a, b);
    expect(() => isPureInnerLink12(a, link)).toThrow('IllegalArgumentException');
    expect(() => isPureInnerLink3(a, link)).toThrow('IllegalArgumentException');
  });

  it('isPureInnerLink12: true only when both ends are inside the group (transitively)', () => {
    const world = makeWorld();
    const group = makeGroup(world, 'P');
    const nested = makeGroup(world, 'Q', GroupType.PACKAGE, group.getQuark());
    const a = makeLeaf(world, 'A', LeafType.CLASS, group.getQuark());
    const deep = makeLeaf(world, 'D', LeafType.CLASS, nested.getQuark());
    const outside = makeLeaf(world, 'O');

    expect(isPureInnerLink12(group, new MockLink(a, deep))).toBe(true); // transitive
    expect(isPureInnerLink12(group, new MockLink(a, outside))).toBe(false);
    expect(isPureInnerLink12(group, new MockLink(outside, outside))).toBe(false);
  });

  it('isPureInnerLink3: true when both ends agree (both in or both out)', () => {
    const world = makeWorld();
    const group = makeGroup(world, 'P');
    const a = makeLeaf(world, 'A', LeafType.CLASS, group.getQuark());
    const b = makeLeaf(world, 'B', LeafType.CLASS, group.getQuark());
    const o1 = makeLeaf(world, 'O1');
    const o2 = makeLeaf(world, 'O2');

    expect(isPureInnerLink3(group, new MockLink(a, b))).toBe(true);
    expect(isPureInnerLink3(group, new MockLink(o1, o2))).toBe(true);
    expect(isPureInnerLink3(group, new MockLink(a, o1))).toBe(false);
  });
});
