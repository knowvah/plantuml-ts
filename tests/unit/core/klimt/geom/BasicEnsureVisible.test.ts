import { describe, expect, it } from 'vitest';
import { BasicEnsureVisible } from '../../../../../src/core/klimt/geom/BasicEnsureVisible.js';

/** BasicEnsureVisible — klimt/geom/BasicEnsureVisible.java. */
describe('BasicEnsureVisible', () => {
  it('has no data until ensureVisible is called', () => {
    const v = new BasicEnsureVisible();
    expect(v.hasData()).toBe(false);
    expect(v.getCoords(1.0)).toBe('0,0,0,0');
    expect(v.getSurface()).toBe(0);
  });

  it('tracks the bounding box of visited points', () => {
    const v = new BasicEnsureVisible();
    v.ensureVisible(10, 20);
    expect(v.hasData()).toBe(true);
    expect(v.getCoords(1.0)).toBe('10,20,10,20');

    v.ensureVisible(30, 5);
    expect(v.getCoords(1.0)).toBe('10,5,30,20');
  });

  it('scales and truncates coordinates like the Java (int) cast', () => {
    const v = new BasicEnsureVisible();
    v.ensureVisible(1.9, 2.9);
    v.ensureVisible(7.2, 8.8);
    // (int)(1.9*2)=3, (int)(2.9*2)=5, (int)(7.2*2)=14, (int)(8.8*2)=17
    expect(v.getCoords(2.0)).toBe('3,5,14,17');
  });

  it('truncates negative coordinates toward zero', () => {
    const v = new BasicEnsureVisible();
    v.ensureVisible(-1.7, -2.3);
    expect(v.getCoords(1.0)).toBe('-1,-2,-1,-2');
  });

  it('computes the surface of the bounding box', () => {
    const v = new BasicEnsureVisible();
    v.ensureVisible(0, 0);
    v.ensureVisible(4, 3);
    expect(v.getSurface()).toBe(12);
  });
});
