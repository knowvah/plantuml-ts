import { describe, expect, it } from 'vitest';
import {
  isBigDiamondDuplicate,
  markBigDiamondDuplicate,
  withoutBigDiamondDuplicateTag,
} from '../../../../src/diagrams/activity/layout/switch-swimlane-duplicate.js';
import type { ActivityNodeGeo } from '../../../../src/diagrams/activity/activity-geometry.types.js';

function makeNode(): ActivityNodeGeo {
  return { id: 'n-1', kind: 'action', x: 10, y: 20, width: 30, height: 40, label: 'A' };
}

describe('switch-swimlane-duplicate', () => {
  it('isBigDiamondDuplicate is false for an untagged node', () => {
    expect(isBigDiamondDuplicate(makeNode())).toBe(false);
  });

  it('markBigDiamondDuplicate makes isBigDiamondDuplicate true on the SAME object', () => {
    const node = makeNode();
    markBigDiamondDuplicate(node);
    expect(isBigDiamondDuplicate(node)).toBe(true);
  });

  it('withoutBigDiamondDuplicateTag returns a copy with the tag removed', () => {
    const node = makeNode();
    markBigDiamondDuplicate(node);
    const copy = withoutBigDiamondDuplicateTag(node);
    expect(isBigDiamondDuplicate(copy)).toBe(false);
    // The original is untouched -- the function never mutates its input.
    expect(isBigDiamondDuplicate(node)).toBe(true);
  });

  it('withoutBigDiamondDuplicateTag preserves every other field', () => {
    const node = makeNode();
    markBigDiamondDuplicate(node);
    const copy = withoutBigDiamondDuplicateTag({ ...node, x: 99, swimlane: 'Lane2' });
    expect(copy).toEqual({
      id: 'n-1',
      kind: 'action',
      x: 99,
      y: 20,
      width: 30,
      height: 40,
      label: 'A',
      swimlane: 'Lane2',
    });
  });
});
