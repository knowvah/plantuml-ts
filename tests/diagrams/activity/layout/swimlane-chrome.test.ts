/**
 * add4-T1g: the swimlane title band is anchored at the block origin + 5
 * (`Swimlanes.java:358-367`), not at the first divider. The two differ only
 * when a `skinparam swimlaneWidth` floor pads the first lane.
 *
 * Fixture expectations were read from `scripts/oracle-render.sh` renders of
 * `tests/fixtures/activity/add4-T1b/swimw-*.puml` (deterministic text).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import {
  bandReservationX,
  computeSwimlaneChrome,
  SWIMLANE_BAND_INSET_X,
} from '../../../../src/diagrams/activity/layout/swimlane-chrome.js';
import type { SwimlaneGeo } from '../../../../src/diagrams/activity/activity-geometry.types.js';
import { DeterministicMeasurer } from '../../../../src/core/measurer-deterministic.js';
import { renderFixtureActivity } from '../../../oracle/svg-conformance/render-fixture-activity.js';
import { censusOf } from '../../../oracle/svg-conformance/swimlane-census.js';

const DIR = join(import.meta.dirname, '../../../fixtures/activity/add4-T1b');

describe('computeSwimlaneChrome — bandX', () => {
  const lanes: SwimlaneGeo[] = [
    { name: 'A', x: 33, width: 47.675 },
    { name: 'B', x: 80.675, width: 191.825 },
    { name: 'C', x: 272.5, width: 47 },
  ];

  it('anchors the band at bandX and keeps its right edge at the last divider - 1', () => {
    const band = computeSwimlaneChrome(lanes, 17.5, 18, 200, 16).swimlaneBand!;
    expect(band.x).toBe(16);
    expect(band.width).toBeCloseTo(302.5, 9);
  });

  it('falls back to the first divider without bandX', () => {
    const band = computeSwimlaneChrome(lanes, 17.5, 18, 200).swimlaneBand!;
    expect(band.x).toBe(33);
    expect(band.width).toBeCloseTo(285.5, 9);
  });

  it('uses the upstream inset of 5', () => {
    expect(SWIMLANE_BAND_INSET_X).toBe(5);
  });
});

describe('bandReservationX', () => {
  it('returns the x of the reservation ignored on both axes', () => {
    const rs = [
      { x: 1, y: 0, width: 2, height: 2 },
      { x: 7, y: 0, width: 2, height: 2, ignoreX: true },
      { x: 16, y: 17.5, width: 302.5, height: 18, ignoreX: true, ignoreY: true },
    ];
    expect(bandReservationX(rs)).toBe(16);
  });

  it('is undefined when no band was reserved', () => {
    expect(bandReservationX([{ x: 1, y: 0, width: 2, height: 2 }])).toBeUndefined();
  });
});

function chromeOf(name: string): { band: number[]; dividers: readonly number[] } {
  const c = censusOf(renderFixtureActivity(readFileSync(join(DIR, name), 'utf8'), new DeterministicMeasurer()));
  const b = c.bandRect!;
  return { band: [b.x, b.width], dividers: c.dividerXs };
}

describe('swimlaneWidth fixtures — band and dividers vs the jar', () => {
  it.each(['swimw-100.puml', 'swimw-400.puml', 'swimw-9000.puml', 'swimw-same.puml', 'swimw-block-same.puml'])(
    '%s: floored lanes put the band at 16 and the first divider at 33',
    (name) => {
      expect(chromeOf(name)).toEqual({ band: [16, 302.5], dividers: [33, 80.675, 272.5, 319.5] });
    },
  );

  it.each(['swimw-absent.puml', 'swimw-0.puml'])('%s: unfloored, band == first divider', (name) => {
    expect(chromeOf(name)).toEqual({ band: [20, 256.163], dividers: [20, 58.338, 239.163, 277.163] });
  });

  it('wide titles: band == first divider', () => {
    expect(chromeOf('swimw-wide-titles.puml')).toEqual({
      band: [20, 520.188],
      dividers: [20, 296.288, 332.963, 541.188],
    });
  });
});
