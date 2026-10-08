/**
 * lgm-T1b (A3): `Cluster#manageEntryExitPoint` as shared, order-dependent
 * state (`svek/Cluster.java:410-436`, `SvekEdge.java:660-672`,
 * `ClusterDotString.java:101-105`).
 *
 * Every number below is hand-derived from `FrontierCalculator.java`'s touch /
 * push steps; the comment on each case states the derivation.
 */
import { describe, expect, it } from 'vitest';
import {
  ClusterRectangles,
  entryExitPointRect,
  projectionClusterOf,
  type ProjectionClusterSpec,
  type RectangleArea,
} from '../../../src/core/svek/FrontierCalculator.js';

const rect = (minX: number, minY: number, maxX: number, maxY: number): RectangleArea => ({ minX, minY, maxX, maxY });

/** Graphviz's polygon for `child`, a port at its left side, one inside node. */
const CHILD_RAW = rect(0, 0, 200, 200);
const CHILD: ProjectionClusterSpec = {
  id: 'child',
  insides: [rect(40, 40, 60, 60)],
  points: [{ x: 10, y: 50 }],
  childIds: [],
  rankdir: 'TB',
  titleAndAttributeWidth: 0,
  titleAndAttributeHeight: 0,
};
/** `parent` holds `child`, with its own port at (5, 100). */
const PARENT_RAW = rect(-10, -10, 300, 300);
const PARENT: ProjectionClusterSpec = {
  id: 'parent',
  insides: [],
  points: [{ x: 5, y: 100 }],
  childIds: ['child'],
  rankdir: 'TB',
  titleAndAttributeWidth: 0,
  titleAndAttributeHeight: 0,
};
const GRAPHVIZ = new Map([
  ['child', CHILD_RAW],
  ['parent', PARENT_RAW],
]);
const SPECS = new Map([
  ['child', CHILD],
  ['parent', PARENT],
]);

describe('entryExitPointRect (Cluster.java:410-430)', () => {
  it('keeps the port-touched side and resets the others to the cluster rectangle', () => {
    // insides merge to (40..60)^2; the port (10,50) lies on minX -> touchMinX;
    // the other three sides take `initial` (FrontierCalculator.java:77-87).
    // Push: |50-60| and |50-40| >= DELTA (18) -> none. Result minX = 10.
    expect(entryExitPointRect(CHILD, CHILD_RAW, () => undefined)).toEqual(rect(10, 0, 200, 200));
  });

  it('widens an undersized titled cluster symmetrically (ensureMinWidth, Cluster.java:427-428)', () => {
    const titled = { ...CHILD, titleAndAttributeWidth: 300, titleAndAttributeHeight: 20 };
    // core is 10..200 (width 190); minWidth = 300 + 10 -> delta = -120, so
    // newMinX = 10 - 60 = -50, newMaxX = 200 + 60 = 260; error = -50 - 0 < 0
    // shifts both by +50 -> 0..310 (FrontierCalculator.java:154-167).
    expect(entryExitPointRect(titled, CHILD_RAW, () => undefined)).toEqual(rect(0, 0, 310, 200));
  });

  it('skips a child cluster that has no rectangle (Cluster.java:420-421)', () => {
    // insides empty -> core is the 2x2 box at the cluster centre (145,145)
    // (FrontierCalculator.java:60-63), merged with the port (5,100) ->
    // x 5..146, y 100..146. The port touches minX and minY; maxX/maxY reset to
    // 300. Push: it sits on minX within DELTA, so minX -= 18 -> -13; the TB
    // corner rule cancels the minY push (:127-135). Result (-13,100)..(300,300).
    expect(entryExitPointRect(PARENT, PARENT_RAW, () => undefined)).toEqual(rect(-13, 100, 300, 300));
  });
});

describe('ClusterRectangles — the shared mutable Cluster.rectangleArea', () => {
  it('starts every cluster at graphviz’s polygon, unadjusted', () => {
    const rects = new ClusterRectangles(GRAPHVIZ, SPECS);
    expect(rects.rectangleAreaOf('child')).toEqual(CHILD_RAW);
    expect(rects.isAdjusted('child')).toBe(false);
  });

  it('reassigns the rectangle on manageEntryExitPoint and marks it adjusted', () => {
    const rects = new ClusterRectangles(GRAPHVIZ, SPECS);
    rects.manageEntryExitPoint('child');
    expect(rects.rectangleAreaOf('child')).toEqual(rect(10, 0, 200, 200));
    expect(rects.isAdjusted('child')).toBe(true);
  });

  it('is order dependent: a parent reads its child’s already-adjusted rectangle', () => {
    const parentFirst = new ClusterRectangles(GRAPHVIZ, SPECS);
    parentFirst.manageEntryExitPoint('parent');
    // child still raw (0..200): merged with the port (5,100) minX stays 0 != 5,
    // so no side is touched and the parent resets to its own rectangle.
    expect(parentFirst.rectangleAreaOf('parent')).toEqual(PARENT_RAW);

    const childFirst = new ClusterRectangles(GRAPHVIZ, SPECS);
    childFirst.manageEntryExitPoint('child');
    childFirst.manageEntryExitPoint('parent');
    // child now 10..200: merged with (5,100) minX = 5 == p.x -> touchMinX, so
    // the parent's minX becomes 5; the other sides reset to PARENT_RAW.
    expect(childFirst.rectangleAreaOf('parent')).toEqual(rect(5, -10, 300, 300));
  });

  it('feeds a cluster its own previous result as `initial` on a repeated call', () => {
    const rects = new ClusterRectangles(GRAPHVIZ, SPECS);
    rects.manageEntryExitPoint('child');
    rects.manageEntryExitPoint('child');
    expect(rects.rectangleAreaOf('child')).toEqual(rect(10, 0, 200, 200));
  });

  it('leaves a cluster with no border-point spec untouched', () => {
    const rects = new ClusterRectangles(GRAPHVIZ, new Map());
    rects.manageEntryExitPoint('child');
    expect(rects.rectangleAreaOf('child')).toEqual(CHILD_RAW);
    expect(rects.isAdjusted('child')).toBe(false);
  });
});

describe('projectionClusterOf (ClusterDotString.java:101-105, SvekEdge.java:1278-1281)', () => {
  it('is undefined when the line touches no border-point group', () => {
    expect(projectionClusterOf(new Set(['x']), ['a', 'b'])).toBeUndefined();
  });

  it('is the only touched group', () => {
    expect(projectionClusterOf(new Set(['b']), ['a', 'b'])).toBe('b');
  });

  it('is the LAST touched group in print order (setProjectionCluster overwrites)', () => {
    expect(projectionClusterOf(new Set(['a', 'b']), ['a', 'b'])).toBe('b');
    expect(projectionClusterOf(new Set(['a', 'b']), ['b', 'a'])).toBe('a');
  });
});
