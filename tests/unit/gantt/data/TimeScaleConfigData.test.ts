import { describe, expect, it } from 'vitest';
import { PrintScale } from '../../../../src/diagrams/gantt/core/PrintScale.js';
import { TimeScaleConfigData } from '../../../../src/diagrams/gantt/data/TimeScaleConfigData.js';

// Expected values: ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/TimeScaleConfigData.java:35-79
describe('TimeScaleConfigData', () => {
  it('defaults are DAILY, 1.0, not hiding closed (java:37-39)', () => {
    const d = new TimeScaleConfigData();
    expect(d.getPrintScale()).toBe(PrintScale.DAILY);
    expect(d.getFactorScale()).toBe(1.0);
    expect(d.isHideClosed()).toBe(false);
    expect(d.getEffectiveScale()).toBe(1);
  });

  it('effective scale is printScale default times factor (java:49-51)', () => {
    const d = new TimeScaleConfigData();
    d.setPrintScale(PrintScale.WEEKLY);
    d.setFactorScale(3);
    d.setHideClosed(true);
    expect(d.getPrintScale()).toBe(PrintScale.WEEKLY);
    expect(d.getFactorScale()).toBe(3);
    expect(d.isHideClosed()).toBe(true);
    expect(d.getEffectiveScale()).toBe((1 / 4) * 3);
  });
});
