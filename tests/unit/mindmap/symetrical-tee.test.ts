/**
 * `SymetricalTee` (pure two-arm shape) and `SymetricalTeePositioned` (a tee
 * placed at a y) — the value objects `Tetris` packs.
 *
 * Values for the "100" tee below are jar-probed, not hand-derived: fixture
 * `test-results/dot-cache/mindmap/cilala-42-naso533/in.puml` (9 nodes, 3
 * levels), via
 * `plans/mindmap-engine-port/tools/probe/run-probe.sh LayoutProbe
 * test-results/dot-cache/mindmap/cilala-42-naso533/in.puml`, node `0/0`
 * (`100`)'s own `symetricalTee` line:
 * `t1=54.0 e1=53.362500000000004 t2=108.0 e2=83.36250000000001`
 * — and node `0`'s (`count`, the root) tetris[0] line, which is `100`
 * positioned within the root's `Tetris` after `balance()`:
 * `tetris[0] y=-81.000000 minY=-135.000000 maxY=-27.000000 maxX=136.725000`.
 * Both lines are `Double.toString`-precision except the `%.6f`-formatted
 * `tetris[N]` line, so assertions against it use 6-decimal tolerance.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/mindmap/SymetricalTee.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/mindmap/SymetricalTeePositioned.java
 */
import { describe, it, expect } from 'vitest';
import { SymetricalTee } from '../../../src/diagrams/mindmap/SymetricalTee.js';
import { SymetricalTeePositioned } from '../../../src/diagrams/mindmap/SymetricalTeePositioned.js';

// cilala-42-naso533, node 0/0 ("100")'s own symetricalTee.
const TEE_100 = new SymetricalTee(54.0, 53.362500000000004, 108.0, 83.36250000000001);

describe('SymetricalTee', () => {
  it('exposes the four constructor arguments unchanged', () => {
    expect(TEE_100.getThickness1()).toBe(54.0);
    expect(TEE_100.getElongation1()).toBe(53.362500000000004);
    expect(TEE_100.getThickness2()).toBe(108.0);
    expect(TEE_100.getElongation2()).toBe(83.36250000000001);
  });

  it('getFullElongation sums both arms (SymetricalTee.java:73-75)', () => {
    expect(TEE_100.getFullElongation()).toBe(53.362500000000004 + 83.36250000000001);
  });

  it('getFullThickness is the wider arm (SymetricalTee.java:77-79)', () => {
    expect(TEE_100.getFullThickness()).toBe(108.0);
    // The reverse case: arm 1 wider than arm 2.
    expect(new SymetricalTee(200, 1, 50, 1).getFullThickness()).toBe(200);
  });
});

describe('SymetricalTeePositioned', () => {
  it('defaults to y = 0 (SymetricalTeePositioned.java:50-52)', () => {
    expect(new SymetricalTeePositioned(TEE_100).getY()).toBe(0);
  });

  it('move(delta) shifts y by delta (:69-71)', () => {
    const p = new SymetricalTeePositioned(TEE_100);
    p.move(-81);
    expect(p.getY()).toBe(-81);
  });

  it('getMinY/getMaxY/getMaxX at the jar-probed root-tetris position for "100"', () => {
    const p = new SymetricalTeePositioned(TEE_100);
    p.move(-81); // cilala-42-naso533 root tetris[0].y
    // fullThickness = max(54, 108) = 108, per SymetricalTee.java:77-79.
    expect(p.getMinY()).toBeCloseTo(-135.0, 6);
    expect(p.getMaxY()).toBeCloseTo(-27.0, 6);
    expect(p.getMaxX()).toBeCloseTo(136.725, 6);
  });

  it('moveSoThatSegmentA1isOn(newY) lands segment A1 at newY (:59-62)', () => {
    const p = new SymetricalTeePositioned(TEE_100);
    p.moveSoThatSegmentA1isOn(10);
    expect(p.getSegmentA1().getY1()).toBeCloseTo(10, 9);
    // A1's y offset from the tee's own y is -thickness1/2 = -27.
    expect(p.getY()).toBeCloseTo(10 + 27, 9);
  });

  it('moveSoThatSegmentA2isOn(newY) lands segment A2 at newY (:64-67)', () => {
    const p = new SymetricalTeePositioned(TEE_100);
    p.moveSoThatSegmentA2isOn(5);
    expect(p.getSegmentA2().getY1()).toBeCloseTo(5, 9);
    // A2's y offset from the tee's own y is -thickness2/2 = -54.
    expect(p.getY()).toBeCloseTo(5 + 54, 9);
  });

  it('getSegmentA1/B1/A2/B2 span the two arms at the right y offsets (:73-89)', () => {
    const p = new SymetricalTeePositioned(TEE_100); // y = 0
    const a1 = p.getSegmentA1();
    const b1 = p.getSegmentB1();
    const a2 = p.getSegmentA2();
    const b2 = p.getSegmentB2();
    expect([a1.getX1(), a1.getX2()]).toEqual([0, 53.362500000000004]);
    expect([a1.getY1(), a1.getY2()]).toEqual([-27, -27]);
    expect([b1.getY1(), b1.getY2()]).toEqual([27, 27]);
    expect([a2.getX1(), a2.getX2()]).toEqual([53.362500000000004, 53.362500000000004 + 83.36250000000001]);
    expect([a2.getY1(), a2.getY2()]).toEqual([-54, -54]);
    expect([b2.getY1(), b2.getY2()]).toEqual([54, 54]);
  });

  it('getMax keeps the placement with the greater y (:107-115)', () => {
    const p1 = new SymetricalTeePositioned(TEE_100);
    p1.move(3);
    const p2 = new SymetricalTeePositioned(TEE_100);
    p2.move(7);
    expect(p1.getMax(p2).getY()).toBe(7);
    expect(p2.getMax(p1).getY()).toBe(7);
  });

  it('getMax rejects placements of different tees (:107-115)', () => {
    const p1 = new SymetricalTeePositioned(TEE_100);
    const other = new SymetricalTeePositioned(new SymetricalTee(1, 1, 0, 0));
    expect(() => p1.getMax(other)).toThrow();
  });
});
