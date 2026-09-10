/**
 * Direct unit tests for `src/diagrams/activity/activity-text-placement.ts`
 * (mission `activity-min-box-width`, T5, D2).
 */
import { describe, it, expect } from 'vitest';
import {
  measureLineWidth,
  measureMonoLineWidth,
  centeredLineX,
  activityTextLineX,
} from '../../../src/diagrams/activity/activity-text-placement.js';
import { resolveTheme } from '../../../src/core/theme.js';

const theme = resolveTheme('default');

describe('measureLineWidth', () => {
  it('matches WidthTableMeasurer directly (the deterministic conformance metric)', () => {
    // "Component" at size 14 -> 72.3625, per DeterministicMeasurer's own
    // jar-verified table (core/measurer-deterministic.ts doc comment).
    expect(measureLineWidth(theme, 14, 'Component')).toBeCloseTo(72.3625, 4);
  });

  it('scales with font size', () => {
    const at14 = measureLineWidth(theme, 14, 'hello');
    const at28 = measureLineWidth(theme, 28, 'hello');
    expect(at28).toBeCloseTo(at14 * 2, 6);
  });
});

describe('measureMonoLineWidth', () => {
  it('is length * fontSize * 0.6, matching gtile-action.ts monoCharWidth', () => {
    expect(measureMonoLineWidth(12, 'abcd')).toBe(4 * 12 * 0.6);
  });
});

describe('centeredLineX', () => {
  it('centres a line under cx by half its own width (FtileDiamondInside.java:94-96)', () => {
    expect(centeredLineX(100, 20)).toBe(90);
  });
});

describe('activityTextLineX', () => {
  it('diamond sname centres geometrically, ignoring width entirely', () => {
    expect(activityTextLineX(theme, 100, 20, { sname: 'diamond' })).toBe(90);
  });

  it('activity sname, LEFT (root default): boxX + padding, regardless of line width', () => {
    // cx=110, width=120 -> boxX=50; activityPadding('activity') is 10
    // (plantuml.skin:360, Padding 10) -- matches the jar's
    // cizixu-00-koro700 fixture (x = rect.x + 10).
    const x = activityTextLineX(theme, 110, 999, { sname: 'activity', width: 120 });
    expect(x).toBe(60);
  });

  it('activity sname without width throws (broken caller contract)', () => {
    expect(() => activityTextLineX(theme, 100, 20, { sname: 'activity' })).toThrow(/width is required/);
  });
});
