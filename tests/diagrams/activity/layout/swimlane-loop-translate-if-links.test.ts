/**
 * Unit tests for `FtileIfWithLinks`'s three translate shapes (mission
 * `activity-divergence-drive-3`, T1c) -- hand-derived numbers per function.
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/cond/FtileIfWithLinks.java:90-367
 */

import { describe, expect, it } from 'vitest';
import {
  routeIfLinksHThenV,
  routeIfLinksVThenH,
  routeIfLinksVThenHDirect,
} from '../../../../src/diagrams/activity/layout/swimlane-loop-translate-if-links.js';
import type { ActivityEdgeGeo } from '../../../../src/diagrams/activity/activity-geometry.types.js';
import type {
  IfLinksHThenVLoop,
  IfLinksVThenHDirectLoop,
  IfLinksVThenHLoop,
} from '../../../../src/diagrams/activity/layout/swimlane-loop-translate.js';

/** Same bare stand-in `swimlane-loop-translate-repeat.test.ts` uses --
 *  every function under test only reads `points` (plus, here, `emphasize`
 *  on the base edge, to prove it is stripped) from this literal. */
const edge: ActivityEdgeGeo = { points: [] };

describe('routeIfLinksHThenV — ConnectionHorizontalThenVertical#drawTranslate (FtileIfWithLinks.java:148-173)', () => {
  it('direction unchanged: a single LIMITED-merge elbow, no detour', () => {
    const loop: IfLinksHThenVLoop = {
      kind: 'if-links-h-then-v',
      p1: { x: 0, y: 50 },
      p2: { x: 100, y: 90 },
      diamond1: { height: 40 },
    };
    const result = routeIfLinksHThenV(loop, edge, 0, 0);

    // originalDirection: 0 < 100 -- LEFT. mp1 = (0, 50); mp2 = (100, 90).
    // newDirection: 0 < 100 -- LEFT, unchanged.
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]!.points).toEqual([
      { x: 0, y: 50 },
      { x: 100, y: 50 },
      { x: 100, y: 90 },
    ]);
    expect(result.edges[0]!.mergeable).toBe('LIMITED');
    expect(result.reservations).toEqual([]);
  });

  it('direction flipped by the translate: an unarrowed detour, then the LIMITED main snake', () => {
    const loop: IfLinksHThenVLoop = {
      kind: 'if-links-h-then-v',
      p1: { x: 0, y: 50 },
      p2: { x: 10, y: 90 },
      diamond1: { height: 40 },
    };
    const result = routeIfLinksHThenV(loop, edge, 50, 0);

    // originalDirection: 0 < 10 -- LEFT. mp1 = (50, 50); mp2 = (10, 90).
    // newDirection: 50 > 10 -- RIGHT, flipped. delta = (LEFT ? +1) * 12 = 12.
    // detourEnd = (50 + 12, 50 + 40*.75) = (62, 80).
    expect(result.edges).toHaveLength(2);
    expect(result.edges[0]!.points).toEqual([
      { x: 50, y: 50 },
      { x: 62, y: 50 },
      { x: 62, y: 80 },
    ]);
    expect(result.edges[0]!.arrowhead).toBe(false);
    expect(result.edges[1]!.points).toEqual([
      { x: 62, y: 80 },
      { x: 10, y: 80 },
      { x: 10, y: 90 },
    ]);
    expect(result.edges[1]!.mergeable).toBe('LIMITED');
  });

  it('throws on equal untranslated x (Direction.leftOrRight’s own IllegalArgumentException)', () => {
    const loop: IfLinksHThenVLoop = {
      kind: 'if-links-h-then-v',
      p1: { x: 5, y: 0 },
      p2: { x: 5, y: 10 },
      diamond1: { height: 0 },
    };
    expect(() => routeIfLinksHThenV(loop, edge, 0, 0)).toThrow();
  });
});

describe('routeIfLinksVThenH — ConnectionVerticalThenHorizontal#drawTranslate (FtileIfWithLinks.java:237-285)', () => {
  it('direction unchanged: elbow + drop, both LIMITED, drop keeps the arrow', () => {
    const loop: IfLinksVThenHLoop = { kind: 'if-links-v-then-h', p1: { x: 0, y: 50 }, p2: { x: 50, y: 100 } };
    const result = routeIfLinksVThenH(loop, { ...edge, emphasize: 'down' }, 0, 0);

    // originalDirection: 0 < 50 -- LEFT. mp1a = (0, 50); mp2b = (50, 100).
    // delta = (50 > 0 ? -1 : 1) * 18 = -18. middle = (50 + 100) / 2 = 75.
    // mp2bc = (50 - 18, 100) = (32, 100).
    expect(result.edges).toHaveLength(2);
    expect(result.edges[0]!.points).toEqual([
      { x: 0, y: 50 },
      { x: 0, y: 75 },
      { x: 32, y: 75 },
      { x: 32, y: 100 },
    ]);
    expect(result.edges[0]!.arrowhead).toBe(false);
    expect(result.edges[0]!.mergeable).toBe('LIMITED');
    expect(result.edges[0]!.emphasize).toBeUndefined();
    expect(result.edges[1]!.points).toEqual([
      { x: 32, y: 100 },
      { x: 32, y: 100 },
      { x: 50, y: 100 },
    ]);
    expect(result.edges[1]!.arrowhead).toBeUndefined();
    expect(result.edges[1]!.mergeable).toBe('LIMITED');
    expect(result.edges[1]!.emphasize).toBeUndefined();
  });

  it('direction flipped: the mp2bb elbow drops an extra 1.5*hexagonHalfSize', () => {
    const loop: IfLinksVThenHLoop = { kind: 'if-links-v-then-h', p1: { x: 0, y: 50 }, p2: { x: 10, y: 100 } };
    const result = routeIfLinksVThenH(loop, edge, 50, 0);

    // originalDirection: 0 < 10 -- LEFT. mp1a = (50, 50); mp2b = (10, 100).
    // newDirection: 50 > 10 -- RIGHT, flipped.
    // delta (from UNTRANSLATED p1.x=0, p2.x=10): (10 > 0 ? -1 : 1) * 18 = -18.
    // mp2bb = (10 - 18, 100 - 18) = (-8, 82).
    expect(result.edges[0]!.points).toEqual([
      { x: 50, y: 50 },
      { x: 50, y: 82 },
      { x: -8, y: 82 },
    ]);
    expect(result.edges[1]!.points).toEqual([
      { x: -8, y: 82 },
      { x: -8, y: 100 },
      { x: 10, y: 100 },
    ]);
  });
});

describe('routeIfLinksVThenHDirect — ConnectionVerticalThenHorizontalDirect#drawTranslate (FtileIfWithLinks.java:327-354)', () => {
  it('drops hexagonHalfSize at the elbow, then returns to the untranslated bottom Y', () => {
    const loop: IfLinksVThenHDirectLoop = {
      kind: 'if-links-v-then-h-direct',
      p1: { x: 0, y: 50 },
      p2: { x: 20, y: 100 },
    };
    const result = routeIfLinksVThenHDirect(loop, { ...edge, arrowhead: false, emphasize: 'down' }, 5, -5);

    // mp1a = (5, 50). mp2b = (20 - 5, 100 - 12) = (15, 88).
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]!.points).toEqual([
      { x: 5, y: 50 },
      { x: 5, y: 88 },
      { x: 15, y: 88 },
      { x: 15, y: 100 },
    ]);
    expect(result.edges[0]!.mergeable).toBe('LIMITED');
    expect(result.edges[0]!.arrowhead).toBe(false);
    expect(result.edges[0]!.emphasize).toBeUndefined();
    expect(result.reservations).toEqual([]);
  });
});
