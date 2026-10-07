/**
 * add4-T2d (KLIMT-FLOOR y, `loxija-71-joku558`): a diamond label stripe is
 * an `AtomText` floored at height 10 (`AtomText.java:179-181`) whose
 * baseline stays at the raw `rect.height - descent` (`AtomText.java:213-215`),
 * centred as a floored block by `FtileDiamondInside#drawU`
 * (`FtileDiamondInside.java:94-96`). `in.svg` is the jar's own render
 * (`scripts/oracle-render.sh`).
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  ASCENT_FRACTION,
  centeredFirstBaselineY,
  flooredFirstBaselineY,
} from '../../../src/diagrams/activity/activity-renderer-shapes.js';
import { renderActivityFixture } from '../../helpers/activity-text-position.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = join(HERE, '../../fixtures/activity/add4-T2d');

function textYs(svg: string, size: string): number[] {
  return [...svg.matchAll(/<text [^>]*y="([^"]*)"[^>]*font-size="([^"]*)"/g)]
    .filter((m) => m[2] === size)
    .map((m) => Number(m[1]));
}

describe('flooredFirstBaselineY', () => {
  it('centres a 10-high block but keeps the raw ascent below the floor', () => {
    // loxija: jar hexagon cy 83.833, DiamondFontSize 6 -> jar y 83.5.
    expect(flooredFirstBaselineY(83.833, 6, 1)).toBeCloseTo(83.833 - 5 + 6 * ASCENT_FRACTION, 9);
    expect(flooredFirstBaselineY(83.833, 6, 1)).toBeCloseTo(83.5, 3);
  });

  it('equals centeredFirstBaselineY at or above the floor', () => {
    for (const size of [10, 11, 14]) {
      expect(flooredFirstBaselineY(27, size, 2)).toBe(centeredFirstBaselineY(27, size, 2));
    }
  });
});

describe('diamond-small-font fixture', () => {
  it('every 6 pt diamond label line sits at the jar y (10 px advance)', () => {
    const { ours, golden } = renderActivityFixture(FIXTURE_ROOT, 'diamond-small-font');
    expect(textYs(golden, '6')).toEqual([61.667, 71.667, 271.667, 281.667, 291.667, 328.667]);
    expect(textYs(ours, '6')).toEqual(textYs(golden, '6'));
  });
});
