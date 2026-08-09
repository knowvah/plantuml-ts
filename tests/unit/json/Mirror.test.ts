/**
 * `Mirror` — the transpose upstream applies when reading a json layout back
 * out of graphviz (mission A5 / T6, ADR-1).
 *
 * @see ~/git/plantuml/.../jsondiagram/Mirror.java
 */
import { describe, it, expect, afterEach } from 'vitest';

import { Mirror, setMirrorBadValueHandler } from '../../../src/diagrams/json/Mirror.js';
import { XPoint2D } from '../../../src/core/klimt/geom/XPoint2D.js';

describe('Mirror', () => {
  it('inv flips a value about max', () => {
    expect(new Mirror(100).inv(30)).toBe(70);
    expect(new Mirror(100).inv(0)).toBe(100);
    expect(new Mirror(100).inv(100)).toBe(0);
  });

  it('invAndXYSwitch takes x from the flipped y, and y from the raw x', () => {
    const out = new Mirror(100).invAndXYSwitch(new XPoint2D(10, 30));
    expect(out.getX()).toBe(70);
    expect(out.getY()).toBe(10);
  });

  it('invGit flips y only, leaving x alone', () => {
    const out = new Mirror(100).invGit(new XPoint2D(10, 30));
    expect(out.getX()).toBe(10);
    expect(out.getY()).toBe(70);
  });

  it('is its own inverse when applied twice about the same max', () => {
    const m = new Mirror(100);
    const once = m.invAndXYSwitch(new XPoint2D(10, 30));
    // Transposing back swaps the roles again: (x,y) -> (max-y, x) -> (max-x, y)
    const twice = m.invAndXYSwitch(once);
    expect(twice.getY()).toBe(once.getX());
  });
});

describe('Mirror — the BAD VALUE diagnostic', () => {
  let restore: ((v: number, max: number) => void) | undefined;
  afterEach(() => {
    if (restore) setMirrorBadValueHandler(restore);
    restore = undefined;
  });

  it('reports an out-of-range value but still returns it, as upstream does', () => {
    // Upstream prints "BAD VALUE IN Mirror" and carries on -- it does NOT
    // throw, so a bad input degrades to a misplaced point, never a failed
    // render. This port must keep that shape.
    const seen: Array<[number, number]> = [];
    restore = setMirrorBadValueHandler((v, max) => seen.push([v, max]));

    const m = new Mirror(100);
    expect(m.inv(-5)).toBe(105);
    expect(m.inv(150)).toBe(-50);
    expect(seen).toEqual([[-5, 100], [150, 100]]);
  });

  it('stays silent for in-range values', () => {
    const seen: number[] = [];
    restore = setMirrorBadValueHandler((v) => seen.push(v));
    new Mirror(100).inv(50);
    expect(seen).toEqual([]);
  });
});
