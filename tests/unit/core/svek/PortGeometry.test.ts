/**
 * PortGeometry.test.ts — T8: unit coverage for `PortGeometry`
 * (svek/PortGeometry.java), the `Ports` sibling this task ports alongside
 * `Ports.ts`.
 */
import { describe, expect, it } from 'vitest';
import { PortGeometry } from '../../../../src/core/svek/PortGeometry.js';

describe('PortGeometry', () => {
  it('exposes the constructor fields via their getters', () => {
    const pg = new PortGeometry('p1', 10, 5, 2);
    expect(pg.getId()).toBe('p1');
    expect(pg.getPosition()).toBe(10);
    expect(pg.getHeight()).toBe(5);
    expect(pg.getScore()).toBe(2);
  });

  it('getLastY is position + height', () => {
    const pg = new PortGeometry('p1', 10, 5, 2);
    expect(pg.getLastY()).toBe(15);
  });

  it('translateY returns a new instance shifted by deltaY, id/height/score unchanged', () => {
    const pg = new PortGeometry('p1', 10, 5, 2);
    const shifted = pg.translateY(3);
    expect(shifted).not.toBe(pg);
    expect(shifted.getPosition()).toBe(13);
    expect(shifted.getHeight()).toBe(5);
    expect(shifted.getScore()).toBe(2);
    expect(shifted.getId()).toBe('p1');
    expect(pg.getPosition()).toBe(10); // original untouched
  });

  it('toString matches upstream format "pos=X height=Y (score)"', () => {
    const pg = new PortGeometry('p1', 10, 5, 2);
    expect(pg.toString()).toBe('pos=10 height=5 (2)');
  });

  it('compareTo orders ascending by position', () => {
    const low = new PortGeometry('a', 1, 1, 1);
    const high = new PortGeometry('b', 5, 1, 1);
    expect(low.compareTo(high)).toBeLessThan(0);
    expect(high.compareTo(low)).toBeGreaterThan(0);
    expect(low.compareTo(low)).toBe(0);
  });
});
