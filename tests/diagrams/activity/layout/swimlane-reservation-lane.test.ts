/**
 * add4-T2f (LANE-RESERVATION): a connection's `UEmpty` is drawn inside the
 * lane pass that draws it (`Swimlanes.java:342-343`), so it moves with its
 * lane, and the per-lane `LimitFinder` measures it (`LimitFinder.java:159-162`,
 * `Swimlanes.java:379-395`). Fixture goldens via `scripts/oracle-render.sh`;
 * `lane-res-while` is the `gesogi-81-xoma900` markup.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import type { Reservation } from '../../../../src/diagrams/activity/layout/hexagon-reservations.js';
import {
  laneReservationItems,
  pushLaneReservation,
  shiftLaneReservations,
} from '../../../../src/diagrams/activity/layout/swimlane-reservation-lane.js';
import { renderActivityFixture } from '../../../helpers/activity-text-position.js';
import { compareSvg } from '../../../oracle/svg-conformance/compare.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = join(HERE, '../../../fixtures/activity/add4-T2f');

describe('lane-tagged reservations', () => {
  const tagged: Reservation = { x: 10, y: 5, width: 5, height: 12 };
  const untagged: Reservation = { x: 30, y: 5, width: 5, height: 12 };
  const list: Reservation[] = [];
  pushLaneReservation(list, tagged, 'B');
  pushLaneReservation(list, untagged, undefined);

  it('pushes both, in order', () => {
    expect(list).toEqual([tagged, untagged]);
  });

  it('shifts only a tagged reservation, by its own lane delta', () => {
    const shifted = shiftLaneReservations(list, new Map([['B', 100]]));
    expect(shifted).toEqual([{ x: 110, y: 5, width: 5, height: 12 }, untagged]);
  });

  it('measures only a tagged reservation, unfudged, in its lane', () => {
    expect(laneReservationItems(list)).toEqual([{ swimlane: 'B', x: 10, width: 5 }]);
  });

  it.each([
    'lane-res-while',
    'lane-res-while-empty',
    'lane-res-while-backward',
    'lane-res-fork-label',
    'lane-res-if-down',
  ])('%s renders equal to the jar', (name) => {
    const { ours, golden } = renderActivityFixture(FIXTURE_ROOT, name);
    expect(compareSvg(ours, golden, 'deterministic').diffs).toEqual([]);
  });

  // A same-lane arrow label's reservation is drawn and measured in its lane.
  // add4-T3a (R2): the label baseline (+3.278 before) is placed on the raw
  // worm and mapped through compression (`compress/edge-label-anchor.ts`).
  it('lane-res-inlabel renders equal to the jar', () => {
    const { ours, golden } = renderActivityFixture(FIXTURE_ROOT, 'lane-res-inlabel');
    expect(compareSvg(ours, golden, 'deterministic').diffs).toEqual([]);
  });
});
