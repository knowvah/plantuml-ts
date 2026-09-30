/**
 * `Tetris` — packs a node's children's `SymetricalTee`s with no overlap via
 * `add`, then re-centres the stack around y = 0 via `balance`.
 *
 * Inputs and expected positions are jar-probed against fixture
 * `test-results/dot-cache/mindmap/cilala-42-naso533/in.puml` (9 nodes, 3
 * levels: `count` -> {`100` -> {`101`,`102`}, `200`, `A` -> {`AA`,`AB`},
 * `B`}), via:
 *
 *   plans/mindmap-engine-port/tools/probe/run-probe.sh LayoutProbe \
 *     test-results/dot-cache/mindmap/cilala-42-naso533/in.puml
 *
 * The root node's ("count", branch=regular) own `Tetris` packs its four
 * children [100, 200, A, B], added in that source order — the same order
 * `FingerImpl.getTetris` walks `nail` (`FingerImpl.java:170-171`). "100"
 * and "A" have children of their own, so their own `symetricalTee` line
 * (`Double.toString` precision) is the exact tee this test constructs;
 * "200" and "B" are leaves, whose tee is built only from `phalanxThickness`/
 * `phalanxElongation` printed at `%.6f` precision — those two numbers are
 * this test's own chosen inputs (not byte-exact jar values, since
 * reproducing FingerImpl's own label-measurement arithmetic is T4a's
 * concern, not this packing layer's). Every `tetris[N]` output line the
 * probe prints is itself `%.6f`, so assertions against it use 6-decimal
 * tolerance throughout.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/mindmap/Tetris.java
 */
import { describe, it, expect } from 'vitest';
import { Tetris } from '../../../src/diagrams/mindmap/Tetris.js';
import { SymetricalTee } from '../../../src/diagrams/mindmap/SymetricalTee.js';

// cilala-42-naso533, node 0's ("count", root) four children's own tees, in
// nail order: 100, 200, A, B.
const TEE_100 = new SymetricalTee(54.0, 53.362500000000004, 108.0, 83.36250000000001);
const TEE_200 = new SymetricalTee(54.0, 43.3625, 0, 0);
const TEE_A = new SymetricalTee(54.0, 39.3625, 108.0, 78.725);
const TEE_B = new SymetricalTee(54.0, 29.3625, 0, 0);

describe('Tetris — empty and single-element (Tetris.java:62-64, 80-85, 95-101)', () => {
  it('getHeight/getWidth are 0 before any add', () => {
    const t = new Tetris('empty');
    expect(t.getHeight()).toBe(0);
    expect(t.getWidth()).toBe(0);
    expect(t.getElements()).toHaveLength(0);
  });

  it('balance() on an empty Tetris is a no-op, not a throw', () => {
    const t = new Tetris('empty');
    expect(() => t.balance()).not.toThrow();
    expect(t.getHeight()).toBe(0);
  });

  it('the first add() seeds the frontier at y = 0 (isEmpty branch, :98-101)', () => {
    const t = new Tetris('single');
    t.add(TEE_A);
    expect(t.getElements()).toHaveLength(1);
    expect(t.getElements()[0]!.getY()).toBe(0);
  });
});

describe('Tetris — balance() called twice throws (Tetris.java:66-67)', () => {
  it('throws IllegalStateException-equivalent on the second call', () => {
    const t = new Tetris('count');
    t.add(TEE_A);
    t.balance();
    expect(() => t.balance()).toThrow();
  });
});

describe('Tetris — root node "count" packs [100, 200, A, B] (cilala-42-naso533)', () => {
  function packedRoot(): Tetris {
    const t = new Tetris('count');
    t.add(TEE_100);
    t.add(TEE_200);
    t.add(TEE_A);
    t.add(TEE_B);
    t.balance();
    return t;
  }

  it('positions each child at the jar-probed tetris[N] y/minY/maxY/maxX', () => {
    const t = packedRoot();
    const [e100, e200, eA, eB] = t.getElements();

    // tetris[0] y=-81.000000 minY=-135.000000 maxY=-27.000000 maxX=136.725000
    expect(e100!.getY()).toBeCloseTo(-81.0, 6);
    expect(e100!.getMinY()).toBeCloseTo(-135.0, 6);
    expect(e100!.getMaxY()).toBeCloseTo(-27.0, 6);
    expect(e100!.getMaxX()).toBeCloseTo(136.725, 6);

    // tetris[1] y=-27.000000 minY=-54.000000 maxY=0.000000 maxX=43.362500
    expect(e200!.getY()).toBeCloseTo(-27.0, 6);
    expect(e200!.getMinY()).toBeCloseTo(-54.0, 6);
    expect(e200!.getMaxY()).toBeCloseTo(0.0, 6);
    expect(e200!.getMaxX()).toBeCloseTo(43.3625, 6);

    // tetris[2] y=54.000000 minY=0.000000 maxY=108.000000 maxX=118.087500
    expect(eA!.getY()).toBeCloseTo(54.0, 6);
    expect(eA!.getMinY()).toBeCloseTo(0.0, 6);
    expect(eA!.getMaxY()).toBeCloseTo(108.0, 6);
    expect(eA!.getMaxX()).toBeCloseTo(118.0875, 6);

    // tetris[3] y=108.000000 minY=81.000000 maxY=135.000000 maxX=29.362500
    expect(eB!.getY()).toBeCloseTo(108.0, 6);
    expect(eB!.getMinY()).toBeCloseTo(81.0, 6);
    expect(eB!.getMaxY()).toBeCloseTo(135.0, 6);
    expect(eB!.getMaxX()).toBeCloseTo(29.3625, 6);
  });

  it('getWidth() is the widest child (max over getMaxX, Tetris.java:87-93)', () => {
    expect(packedRoot().getWidth()).toBeCloseTo(136.725, 6);
  });

  it('getHeight() after balance() spans min to max y (:73-75, 80-85)', () => {
    // maxY (135) - minY (-135), read off the pinned per-element minY/maxY
    // above — this is also root's own SymetricalTee.thickness2 one level up
    // (FingerImpl.asSymetricalTee, FingerImpl.java:184-186), printed as
    // `symetricalTee ... t2=270.0` on the same probe run.
    expect(packedRoot().getHeight()).toBeCloseTo(270.0, 6);
  });
});

describe('Tetris — node "A" packs its two same-size leaves [AA, AB] (cilala-42-naso533)', () => {
  // Node 0/2 ("A")'s children AA/AB, both leaves with identical
  // phalanxThickness=54.000000 phalanxElongation=38.725000.
  const TEE_AA = new SymetricalTee(54.0, 38.725, 0, 0);
  const TEE_AB = new SymetricalTee(54.0, 38.725, 0, 0);

  function packedA(): Tetris {
    const t = new Tetris('A');
    t.add(TEE_AA);
    t.add(TEE_AB);
    t.balance();
    return t;
  }

  it('positions the two equal-size leaves symmetrically about y = 0', () => {
    const t = packedA();
    const [eAA, eAB] = t.getElements();

    // tetris[0] y=-27.000000 minY=-54.000000 maxY=0.000000 maxX=38.725000
    expect(eAA!.getY()).toBeCloseTo(-27.0, 6);
    expect(eAA!.getMinY()).toBeCloseTo(-54.0, 6);
    expect(eAA!.getMaxY()).toBeCloseTo(0.0, 6);
    expect(eAA!.getMaxX()).toBeCloseTo(38.725, 6);

    // tetris[1] y=27.000000 minY=0.000000 maxY=54.000000 maxX=38.725000
    expect(eAB!.getY()).toBeCloseTo(27.0, 6);
    expect(eAB!.getMinY()).toBeCloseTo(0.0, 6);
    expect(eAB!.getMaxY()).toBeCloseTo(54.0, 6);
    expect(eAB!.getMaxX()).toBeCloseTo(38.725, 6);
  });

  it('getWidth()/getHeight() match the pinned values', () => {
    const t = packedA();
    expect(t.getWidth()).toBeCloseTo(38.725, 6);
    expect(t.getHeight()).toBeCloseTo(108.0, 6);
  });
});
