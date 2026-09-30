import { describe, expect, it } from 'vitest';
import { FtileGeometry } from '../../../../src/diagrams/activity/ftile/FtileGeometry.js';
import { BoxStyle } from '../../../../src/diagrams/activity/ftile/BoxStyle.js';

/** Java `Double.MIN_NORMAL` (FtileGeometry.java:89's "no point out" sentinel). */
const DOUBLE_MIN_NORMAL = 2.2250738585072014e-308;

describe('FtileGeometry (FtileGeometry.java)', () => {
  it('5-number constructor keeps width/height/left/inY/outY (java:97-102)', () => {
    const g = new FtileGeometry(73.6375, 34, 36.81875, 0, 34);
    expect([g.getWidth(), g.getHeight(), g.getLeft(), g.getInY(), g.getOutY()]).toEqual([73.6375, 34, 36.81875, 0, 34]);
  });

  it('4-number constructor defaults outY to Double.MIN_NORMAL (java:88-90)', () => {
    expect(new FtileGeometry(10, 20, 5, 1).getOutY()).toBe(DOUBLE_MIN_NORMAL);
  });

  it('toString is "[WxH left=L]" (java:92-95)', () => {
    expect(new FtileGeometry(10.5, 20, 5.25, 0).toString()).toBe('[10.5x20 left=5.25]');
  });
});

describe('BoxStyle.PLAIN (BoxStyle.java:58, BoxStylePlain java:153-170)', () => {
  it('has no stereotype and a zero shield', () => {
    expect(BoxStyle.PLAIN.name()).toBeNull();
    expect(BoxStyle.PLAIN.getShield()).toBe(0);
  });

  it('is one shared instance', () => {
    expect(BoxStyle.PLAIN).toBe(BoxStyle.PLAIN);
  });
});
