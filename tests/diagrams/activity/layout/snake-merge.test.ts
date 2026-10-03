/**
 * `layout/snake-merge.ts` -- `UGraphicForSnake`'s own two-pass mechanism
 * (`addPendingSnake`/`flushUg`, `svek/UGraphicForSnake.java:126-176`),
 * tested over small, hand-built edge lists mirroring each Java branch
 * `connection-census.md` §5 names.
 */
import { describe, expect, it } from 'vitest';
import { mergeSnakes } from '../../../../src/diagrams/activity/layout/snake-merge.js';
import type { ActivityEdgeGeo } from '../../../../src/diagrams/activity/activity-geometry.types.js';
import type { EdgeMeta } from '../../../../src/diagrams/activity/layout/swimlane-placement.js';

function edge(points: Array<{ x: number; y: number }>, extra: Partial<ActivityEdgeGeo> = {}): ActivityEdgeGeo {
  return { points, ...extra };
}

function meta(scope?: string): EdgeMeta {
  return { lane1: undefined, lane2: undefined, shape: 'default', ...(scope !== undefined ? { scope } : {}) };
}

describe('mergeSnakes — FULL+FULL natural-direction merge', () => {
  it('fuses two touching FULL edges into one, in pending-slot order', () => {
    const edges = [edge([{ x: 0, y: 0 }, { x: 0, y: 10 }]), edge([{ x: 0, y: 10 }, { x: 0, y: 20 }])];
    const result = mergeSnakes(edges, [meta(), meta()]);
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]!.points).toEqual([{ x: 0, y: 0 }, { x: 0, y: 20 }]);
  });

  it('a non-touching pair never merges', () => {
    const edges = [edge([{ x: 0, y: 0 }, { x: 0, y: 10 }]), edge([{ x: 50, y: 50 }, { x: 50, y: 60 }])];
    const result = mergeSnakes(edges, [meta(), meta()]);
    expect(result.edges).toHaveLength(2);
  });
});

describe('mergeSnakes — MergeStrategy.NONE never merges, even when touching', () => {
  it('a NONE edge stays separate (D2: LIMITED/NONE sites never fuse past the Java rule)', () => {
    const edges = [
      edge([{ x: 0, y: 0 }, { x: 0, y: 10 }]),
      edge([{ x: 0, y: 10 }, { x: 0, y: 20 }], { mergeable: 'NONE' }),
    ];
    const result = mergeSnakes(edges, [meta(), meta()]);
    expect(result.edges).toHaveLength(2);
  });

  it('max(FULL, NONE) is NONE regardless of which side carries it', () => {
    const edges = [
      edge([{ x: 0, y: 0 }, { x: 0, y: 10 }], { mergeable: 'NONE' }),
      edge([{ x: 0, y: 10 }, { x: 0, y: 20 }]),
    ];
    const result = mergeSnakes(edges, [meta(), meta()]);
    expect(result.edges).toHaveLength(2);
  });
});

describe('mergeSnakes — MergeStrategy.LIMITED merges but the merged strategy stays LIMITED', () => {
  it('a FULL+LIMITED merge resolves to LIMITED on the merged result', () => {
    const edges = [
      edge([{ x: 0, y: 0 }, { x: 0, y: 10 }], { mergeable: 'LIMITED' }),
      edge([{ x: 0, y: 10 }, { x: 0, y: 20 }]),
    ];
    const result = mergeSnakes(edges, [meta(), meta()]);
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]!.mergeable).toBe('LIMITED');
  });
});

describe('mergeSnakes — text guard (Snake.merge checks only the LATER/tail side)', () => {
  it('a text-bearing LATER-pushed edge blocks the merge (natural direction)', () => {
    const edges = [
      edge([{ x: 0, y: 0 }, { x: 0, y: 10 }]),
      edge([{ x: 0, y: 10 }, { x: 0, y: 20 }], { label: 'busy' }),
    ];
    const result = mergeSnakes(edges, [meta(), meta()]);
    expect(result.edges).toHaveLength(2);
  });

  it('a text-bearing EARLIER-pushed edge does NOT block the merge (natural direction)', () => {
    const edges = [
      edge([{ x: 0, y: 0 }, { x: 0, y: 10 }], { label: 'busy' }),
      edge([{ x: 0, y: 10 }, { x: 0, y: 20 }]),
    ];
    const result = mergeSnakes(edges, [meta(), meta()]);
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]!.label).toBe('busy');
  });

  it('an empty-string label counts as no text (TextBlockUtils.isEmpty)', () => {
    const edges = [
      edge([{ x: 0, y: 0 }, { x: 0, y: 10 }]),
      edge([{ x: 0, y: 10 }, { x: 0, y: 20 }], { label: '' }),
    ];
    const result = mergeSnakes(edges, [meta(), meta()]);
    expect(result.edges).toHaveLength(1);
  });
});

describe('mergeSnakes — reverse-direction join (Snake.merge:323-324 recursion)', () => {
  // pending (pushed first) = (10,10)->(20,10); new (pushed second) =
  // (0,10)->(10,10) -- the NEW edge's own LAST touches the PENDING's own
  // FIRST, the opposite of the natural pairing. `other.merge(this)`
  // swaps roles: the OUTPUT runs new-then-pending, and the text guard
  // now checks the PENDING side (the new "other" in that nested call).
  it('runs new-edge-then-pending in the output, in reverse-direction mode', () => {
    const edges = [edge([{ x: 10, y: 10 }, { x: 20, y: 10 }]), edge([{ x: 0, y: 10 }, { x: 10, y: 10 }])];
    const result = mergeSnakes(edges, [meta(), meta()]);
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]!.points).toEqual([{ x: 0, y: 10 }, { x: 20, y: 10 }]);
  });

  it('text on the PENDING side blocks a reverse-direction merge', () => {
    const edges = [
      edge([{ x: 10, y: 10 }, { x: 20, y: 10 }], { label: 'pending-text' }),
      edge([{ x: 0, y: 10 }, { x: 10, y: 10 }]),
    ];
    const result = mergeSnakes(edges, [meta(), meta()]);
    expect(result.edges).toHaveLength(2);
  });

  it('text on the NEW side does NOT block a reverse-direction merge', () => {
    const edges = [
      edge([{ x: 10, y: 10 }, { x: 20, y: 10 }]),
      edge([{ x: 0, y: 10 }, { x: 10, y: 10 }], { label: 'new-text' }),
    ];
    const result = mergeSnakes(edges, [meta(), meta()]);
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]!.label).toBe('new-text');
  });
});

describe('mergeSnakes — merged decoration/emphasize (Snake.java:313,320)', () => {
  it('oneOf prefers the TAIL end decoration, falling back to the head', () => {
    const edges = [
      edge([{ x: 0, y: 0 }, { x: 0, y: 10 }], { arrowhead: false }),
      edge([{ x: 0, y: 10 }, { x: 0, y: 20 }]),
    ];
    const result = mergeSnakes(edges, [meta(), meta()]);
    // tail's own decoration is non-null (arrowhead !== false) -> wins.
    expect(result.edges[0]!.arrowhead).toBeUndefined();
  });

  it('falls back to the head decoration when the tail has none', () => {
    const edges = [
      edge([{ x: 0, y: 0 }, { x: 0, y: 10 }], { arrowhead: false }),
      edge([{ x: 0, y: 10 }, { x: 0, y: 20 }], { arrowhead: false }),
    ];
    const result = mergeSnakes(edges, [meta(), meta()]);
    expect(result.edges[0]!.arrowhead).toBe(false);
  });

  it("emphasize prefers the head's own value, falling back to the tail", () => {
    const edges = [
      edge([{ x: 0, y: 0 }, { x: 0, y: 10 }], { emphasize: 'down' }),
      edge([{ x: 0, y: 10 }, { x: 0, y: 20 }], { emphasize: 'up' }),
    ];
    const result = mergeSnakes(edges, [meta(), meta()]);
    expect(result.edges[0]!.emphasize).toBe('down');
  });

  it('color is always the head/earlier side own color', () => {
    const edges = [
      edge([{ x: 0, y: 0 }, { x: 0, y: 10 }], { color: '#111111' }),
      edge([{ x: 0, y: 10 }, { x: 0, y: 20 }], { color: '#222222' }),
    ];
    const result = mergeSnakes(edges, [meta(), meta()]);
    expect(result.edges[0]!.color).toBe('#111111');
  });
});

describe('mergeSnakes — second pass, removeEndDecorationIfTouches (no text guard)', () => {
  it('drops the end decoration of a FULL edge touching an UNMERGED-but-still-touching FULL edge', () => {
    // The text guard blocks the MERGE pass, but the second pass has no
    // such guard and still fires (`UGraphicForSnake.java:81-100`).
    const edges = [
      edge([{ x: 0, y: 0 }, { x: 0, y: 10 }]),
      edge([{ x: 0, y: 10 }, { x: 0, y: 20 }], { label: 'busy' }),
    ];
    const result = mergeSnakes(edges, [meta(), meta()]);
    expect(result.edges).toHaveLength(2);
    expect(result.edges[0]!.arrowhead).toBe(false);
  });

  it('a NONE-strategy target is cannotBeTouched -- decoration survives', () => {
    const edges = [
      edge([{ x: 0, y: 0 }, { x: 0, y: 10 }]),
      edge([{ x: 0, y: 10 }, { x: 0, y: 20 }], { mergeable: 'NONE' }),
    ];
    const result = mergeSnakes(edges, [meta(), meta()]);
    expect(result.edges).toHaveLength(2);
    expect(result.edges[0]!.arrowhead).toBeUndefined();
  });

  it('a pure-horizontal target is cannotBeTouched -- decoration survives', () => {
    const edges = [
      edge([{ x: 0, y: 0 }, { x: 0, y: 10 }]),
      edge([{ x: 0, y: 10 }, { x: 20, y: 10 }], { label: 'busy' }),
    ];
    const result = mergeSnakes(edges, [meta(), meta()]);
    expect(result.edges).toHaveLength(2);
    expect(result.edges[0]!.arrowhead).toBeUndefined();
  });
});

describe('mergeSnakes — FtileGroup/partition scope isolation (D1)', () => {
  it('never merges two otherwise-touching edges across different scopes', () => {
    const edges = [edge([{ x: 0, y: 0 }, { x: 0, y: 10 }]), edge([{ x: 0, y: 10 }, { x: 0, y: 20 }])];
    const result = mergeSnakes(edges, [meta('group-1'), meta('group-2')]);
    expect(result.edges).toHaveLength(2);
  });

  it('still merges two touching edges within the SAME scope', () => {
    const edges = [edge([{ x: 0, y: 0 }, { x: 0, y: 10 }]), edge([{ x: 0, y: 10 }, { x: 0, y: 20 }])];
    const result = mergeSnakes(edges, [meta('group-1'), meta('group-1')]);
    expect(result.edges).toHaveLength(1);
  });

  it('top-level (undefined scope) edges never merge into a group-scoped edge', () => {
    const edges = [edge([{ x: 0, y: 0 }, { x: 0, y: 10 }]), edge([{ x: 0, y: 10 }, { x: 0, y: 20 }])];
    const result = mergeSnakes(edges, [meta(), meta('group-1')]);
    expect(result.edges).toHaveLength(2);
  });
});

describe('mergeSnakes — a new edge merges into the FIRST accepting pending slot, in place', () => {
  it('three edges collapse to one surviving pending slot at its original position', () => {
    const edges = [
      edge([{ x: 100, y: 100 }, { x: 100, y: 110 }]), // unrelated pending, stays separate
      edge([{ x: 0, y: 0 }, { x: 0, y: 10 }]),
      edge([{ x: 0, y: 10 }, { x: 0, y: 20 }]),
    ];
    const result = mergeSnakes(edges, [meta(), meta(), meta()]);
    expect(result.edges).toHaveLength(2);
    // The merged pair keeps the SECOND slot's own position (pushed
    // before the unrelated edge's irrelevant -- order here is by FIRST
    // APPEARANCE among survivors, matching `UGraphicForSnake`'s own
    // `snakes` list, which never reorders on a replace-in-place).
    expect(result.edges[0]!.points).toEqual([{ x: 100, y: 100 }, { x: 100, y: 110 }]);
    expect(result.edges[1]!.points).toEqual([{ x: 0, y: 0 }, { x: 0, y: 20 }]);
  });
});
