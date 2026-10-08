/**
 * add4-T1b: each `LaneDivider`'s `UEmpty(x1+x2, 1)` is drawn at the
 * lane's CONTENT left minus the divider width (`Swimlanes.java:331,
 * 345-346`), not at the origin loop's running `xpos`.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/Swimlanes.java:396-431
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/LaneDivider.java:91
 */
import { describe, it, expect } from 'vitest';
import { computeLaneOrigins } from '../../../../src/diagrams/activity/layout/swimlane-lane-origins.js';
import type { LaneWidth } from '../../../../src/diagrams/activity/layout/swimlane-context.js';

const LANES = ['A', 'B'];

function lane(contentWidth: number, width: number): LaneWidth {
  return { contentWidth, contentMinX: 0, titleWidth: 0, width };
}

describe('computeLaneOrigins — divider UEmpty anchoring', () => {
  it('content-wide lanes: the UEmpty starts at the running xpos', () => {
    const widths = new Map([
      ['A', lane(30, 30)],
      ['B', lane(50, 50)],
    ]);
    const { dividerReservations } = computeLaneOrigins(LANES, widths, 0, 0);
    expect(dividerReservations).toEqual([
      { x: 0, width: 10 },
      { x: 40, width: 10 },
      { x: 100, width: 10 },
    ]);
  });

  it('a swimlaneWidth floor leaves the padding to the RIGHT of each UEmpty', () => {
    // min 100: A pads 35 per side, B 25 per side; the trailing special
    // lane is `max(100, 0)` wide, so its content-left is xpos + 10 + 50.
    const widths = new Map([
      ['A', lane(30, 100)],
      ['B', lane(50, 100)],
    ]);
    const { dividerReservations, origins } = computeLaneOrigins(LANES, widths, 100, 0);
    expect(dividerReservations).toEqual([
      { x: 35, width: 10 },
      { x: 135, width: 10 },
      { x: 270, width: 10 },
    ]);
    expect(origins.get('A')!.geo.contentX).toBe(45);
    expect(origins.get('B')!.geo.contentX).toBe(145);
    expect(origins.get('A')!.geo.x).toBe(40);
  });
});
