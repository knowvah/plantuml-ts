/**
 * isw-T2-act F1: activity sizers and drawers read the render's string
 * bounder off `theme` (`src/diagrams/activity/activity-string-bounder.ts`).
 * Tests that call them below `layoutActivity`/`renderActivity` hand them a
 * theme carrying the harness metric, `DeterministicMeasurer`.
 */
import type { Theme } from '../../../src/core/theme.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { withActivityMeasurer } from '../../../src/diagrams/activity/activity-string-bounder.js';

export const TEST_MEASURER = new DeterministicMeasurer();

/** `theme` measured with {@link TEST_MEASURER}. */
export function measured<T extends Theme>(theme: T): T {
  return withActivityMeasurer(theme, TEST_MEASURER);
}
