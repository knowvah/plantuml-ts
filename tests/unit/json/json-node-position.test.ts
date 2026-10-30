/**
 * jfp T3a — `SmetanaForJson#drawMe`'s `max` + `#getPosition`, ported over the
 * engine's raw node frame (`DotLayoutResult.engineNodes`: `ND_coord` centre,
 * y-up, engine size in points).
 *
 * Every expected value below is computed by hand from the Java:
 *
 *   getMaxX     = coord.y + data.height*72 / 2           SmetanaForJson.java:97-102
 *   max         = 0; max = Math.max(max, getMaxX()) ∀ n  SmetanaForJson.java:160-162
 *   xMirror     = new Mirror(max)                        SmetanaForJson.java:164
 *   getPosition = new UTranslate(x - w/2,                SmetanaForJson.java:203-209
 *                   xMirror.inv(y + h/2)).sym()
 *   sym()       = new UTranslate(dy, dx)                 klimt/UTranslate.java:111-113
 *   inv(v)      = max - v (diagnostic only when v ∉ [0, max])   Mirror.java:48-53
 *
 * so a node's diagram origin is `(max - (cy + h/2), cx - w/2)`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/jsondiagram/SmetanaForJson.java
 */
import { describe, it, expect, afterEach } from 'vitest';

import { jsonNodePositions } from '../../../src/diagrams/json/json-node-position.js';
import { setMirrorBadValueHandler } from '../../../src/diagrams/json/Mirror.js';
import { XPoint2D } from '../../../src/core/klimt/geom/XPoint2D.js';

/**
 * A root alone in rank 0 (top of the y-up frame) and two children in rank 1.
 *
 *   r: getMaxX = 100 + 21/2 = 110.5
 *   a: getMaxX =  40 + 31/2 =  55.5
 *   b: getMaxX =  40 + 31/2 =  55.5     ⇒ max = 110.5
 *
 *   r: (110.5 - 110.5, 30 - 40/2) = (0,  10)
 *   a: (110.5 -  55.5, 20 - 20/2) = (55, 10)
 *   b: (110.5 -  55.5, 70 - 50/2) = (55, 45)
 */
const TREE = [
  { id: 'r', cx: 30, cy: 100, width: 40, height: 21 },
  { id: 'a', cx: 20, cy: 40, width: 20, height: 31 },
  { id: 'b', cx: 70, cy: 40, width: 50, height: 31 },
] as const;

describe('jsonNodePositions — SmetanaForJson#getPosition over the raw engine frame', () => {
  let restore: ((v: number, max: number) => void) | undefined;
  afterEach(() => {
    if (restore !== undefined) setMirrorBadValueHandler(restore);
    restore = undefined;
  });

  it('places each node at (max - (cy + h/2), cx - w/2), max over nodes only (:97-102,:160-164,:203-209)', () => {
    const { positions } = jsonNodePositions(TREE);
    expect(positions.get('r')).toEqual({ x: 0, y: 10, width: 21, height: 40 });
    expect(positions.get('a')).toEqual({ x: 55, y: 10, width: 31, height: 20 });
    expect(positions.get('b')).toEqual({ x: 55, y: 45, width: 31, height: 50 });
    expect(positions.size).toBe(3);
  });

  it('returns the Mirror built from that max, which the edges share (:164,:212-215)', () => {
    const { xMirror } = jsonNodePositions(TREE);
    // invAndXYSwitch(10, 70) = (110.5 - 70, 10)
    const p = xMirror.invAndXYSwitch(new XPoint2D(10, 70));
    expect(p.getX()).toBe(40.5);
    expect(p.getY()).toBe(10);
  });

  it('starts max at 0, so an all-negative frame mirrors about 0 (`double max = 0`, :160)', () => {
    // getMaxX = -50 + 20/2 = -40 < 0 ⇒ max stays 0 ⇒ x = 0 - (-40) = 40, y = 5 - 6/2 = 2
    const { positions } = jsonNodePositions([{ id: 'n', cx: 5, cy: -50, width: 6, height: 20 }]);
    expect(positions.get('n')).toEqual({ x: 40, y: 2, width: 20, height: 6 });
  });

  it('never clamps an out-of-range value: inv still returns max - v and only reports it (Mirror.java:48-53)', () => {
    const seen: Array<[number, number]> = [];
    restore = setMirrorBadValueHandler((v, max) => seen.push([v, max]));
    const { positions } = jsonNodePositions([{ id: 'n', cx: 5, cy: -50, width: 6, height: 20 }]);
    expect(positions.get('n')!.x).toBe(40);
    expect(seen).toEqual([[-40, 0]]);
  });

  it('reports no bad value for an in-range tree', () => {
    const seen: number[] = [];
    restore = setMirrorBadValueHandler((v) => seen.push(v));
    jsonNodePositions(TREE);
    expect(seen).toEqual([]);
  });

  it('an empty frame gives an empty map and a Mirror about 0', () => {
    const { positions, xMirror } = jsonNodePositions([]);
    expect(positions.size).toBe(0);
    expect(xMirror.inv(3)).toBe(-3);
  });
});
