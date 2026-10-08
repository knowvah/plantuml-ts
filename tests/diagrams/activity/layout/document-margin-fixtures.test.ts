/**
 * add4-T3b THEME-MARGIN: a non-10 root/document `Margin` combined with
 * title/legend chrome. The jar wraps the chrome-composed block in the
 * THEME margin (`TextBlockExporter.java:172-173,199-202,510-516`); before
 * this task `applyActivityChrome` re-applied the fixed `same(10)`.
 *
 * Each `<case>/in.svg` is the jar's own render (`scripts/oracle-render.sh`).
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { renderActivityFixture, svgAttr, textPosition } from '../../../helpers/activity-text-position.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = join(HERE, '../../../fixtures/activity/add4-T3b');

describe('theme document margin around activity chrome = jar', () => {
  it.each([
    ['margin5-title', ['hello']],
    ['margin25-title-legend', ['a', 'b']],
  ] as const)('%s', (name, labels) => {
    const { ours, golden } = renderActivityFixture(FIXTURE_ROOT, name);
    expect(svgAttr(ours, 'width'), 'width').toBe(svgAttr(golden, 'width'));
    expect(svgAttr(ours, 'height'), 'height').toBe(svgAttr(golden, 'height'));
    // `coord-shift.ts#shiftFragmentBody` adds unrounded (`126.04375000000002`
    // vs the jar's `126.044`), so positions compare at the 3-decimal format.
    for (const l of labels) {
      expect(textPosition(ours, l).x, `${l}.x`).toBeCloseTo(textPosition(golden, l).x, 3);
      expect(textPosition(ours, l).y, `${l}.y`).toBeCloseTo(textPosition(golden, l).y, 3);
    }
  });
});
