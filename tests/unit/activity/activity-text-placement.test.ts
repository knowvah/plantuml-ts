/**
 * Direct unit tests for `src/diagrams/activity/activity-text-placement.ts`
 * (mission `activity-min-box-width`, T5, D2).
 */
import { describe, it, expect } from 'vitest';
import { measureLineWidth } from '../../../src/diagrams/activity/activity-text-placement.js';
import { resolveTheme } from '../../../src/core/theme.js';
import { measured } from './measured-theme.js';

const theme = measured(resolveTheme('default'));

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
