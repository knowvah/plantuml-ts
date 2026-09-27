/**
 * Opale.test.ts — cdd3-T15 (C-15 = E3-19): `resolveOpaleConnector`'s
 * bezier-count guard.
 *
 * `SvekEdge.java:769-770` `if (isOpalisable() == false) setOpale(false);`
 * and `:804-806` `private boolean isOpalisable() { return
 * dotPath.getBeziers().size() <= 1; }` — a note connector is only merged
 * into the note's own Opale outline when its routed graphviz spline is a
 * SINGLE bezier. `DotPath#addCurve` (`klimt/shape/DotPath.java:112-124`)
 * appends 4 points for the first bezier, then 3 more per additional bezier
 * (each shares the previous curve's endpoint), so `points = 3*beziers + 1`
 * — `beziers <= 1` is exactly `points <= 4`.
 */
import { describe, expect, it } from 'vitest';
import { resolveOpaleConnector } from '../../../../../src/core/svek/image/Opale.js';

const DIM = { width: 100, height: 40 };
const ORIGIN = { x: 0, y: 0 };

describe('resolveOpaleConnector — SvekEdge.java:769-770,804-806 bezier-count guard', () => {
  it('resolves a straight 2-point connector (0 beziers, 0 <= 1)', () => {
    const result = resolveOpaleConnector(DIM, ORIGIN, [
      { x: 0, y: 0 },
      { x: 100, y: 40 },
    ]);
    expect(result).not.toBeUndefined();
  });

  it('resolves a single-bezier 4-point connector (1 bezier, 1 <= 1)', () => {
    const result = resolveOpaleConnector(DIM, ORIGIN, [
      { x: 0, y: 0 },
      { x: 30, y: 10 },
      { x: 60, y: 20 },
      { x: 100, y: 40 },
    ]);
    expect(result).not.toBeUndefined();
  });

  it('rejects a two-bezier 7-point connector (2 beziers, 2 > 1) -- zepeki-75-pifo352, vudepo-27-cuvo793', () => {
    const result = resolveOpaleConnector(DIM, ORIGIN, [
      { x: 0, y: 0 },
      { x: 10, y: 5 },
      { x: 20, y: 10 },
      { x: 30, y: 15 },
      { x: 60, y: 25 },
      { x: 80, y: 32 },
      { x: 100, y: 40 },
    ]);
    expect(result).toBeUndefined();
  });

  it('rejects a three-bezier 10-point connector (3 beziers, 3 > 1)', () => {
    const points = Array.from({ length: 10 }, (_, i) => ({ x: i * 10, y: i * 4 }));
    expect(resolveOpaleConnector(DIM, ORIGIN, points)).toBeUndefined();
  });

  it('still rejects a degenerate 1-point connector (below the length-2 floor)', () => {
    expect(resolveOpaleConnector(DIM, ORIGIN, [{ x: 0, y: 0 }])).toBeUndefined();
  });
});
