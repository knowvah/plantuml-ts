/**
 * cdd2-T17 (Q-11) — the `UEmpty` reservations `LimitFinder` sees inside an
 * `EntityImageClass` (`src/diagrams/class/class-classifier-ink-reservation.ts`).
 *
 * Canvas expectations are the jar's, read off each fixture's cached `in.svg`
 * (`test-results/dot-cache/class/<slug>/in.svg`); markup is inlined.
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import {
  headerInkReservation,
  compartmentReservationWidth,
} from '../../../src/diagrams/class/class-classifier-ink-reservation.js';

function svgWidth(body: string[]): string | undefined {
  const svg = renderSync(['@startuml', ...body, '@enduml'].join('\n'), { measurer: new WidthTableMeasurer() });
  return /<svg[^>]*\bwidth="([^"]+)"/.exec(svg)?.[1];
}

const HEADER = {
  circleWidth: 26,
  circleHeight: 32,
  stereoWidth: 0,
  stereoHeight: 0,
  nameWidth: 40,
  nameHeight: 16,
  genericWidth: 0,
};

describe('headerInkReservation — HeaderLayout#drawU placement (HeaderLayout.java:81-110)', () => {
  it('reaches exactly the box width when the header drove it (suppWith = 0)', () => {
    expect(headerInkReservation(HEADER, 66, 32)).toEqual({ maxX: 66, maxY: 32 });
  });

  it('stops h1 short of the box width when the box was widened (suppWith > 0)', () => {
    // suppWith = 100 - 66 = 34; h2 = min(26 / 4, 3.4) = 3.4 (:93);
    // h1 = (34 - 3.4) / 2 = 15.3 (:94); xName = 26 + 0 + 15.3 + 3.4 (:107).
    const r = headerInkReservation(HEADER, 100, 32);
    expect(r.maxX).toBeCloseTo(100 - 15.3, 12);
    // circle: yCircle = (32 - 32) / 2, bottom 32 (:99); name bottom 8 + 16.
    expect(r.maxY).toBe(32);
  });

  it('draws no reservation for a hidden circle (TextBlockEmpty, width 0)', () => {
    const r = headerInkReservation({ ...HEADER, circleWidth: 0, circleHeight: 0 }, 40, 26);
    // name: diffHeight = 26 - 16 = 10, yName = 5, bottom 21 (:102,108).
    expect(r).toEqual({ maxX: 40, maxY: 21 });
  });
});

describe('compartmentReservationWidth — MethodsOrFieldsArea.java:83-86', () => {
  it('reserves the 12px margin for an EMPTY shown compartment', () => {
    expect(compartmentReservationWidth({ members: [], texts: [], builds: [] }, false, 14)).toBe(12);
  });
});

describe('Q-11: a widened class box is bounded by its rect corner x + w - 1', () => {
  // `getKalWidth() * 1.3` (`EntityImageClass.java:113`) leaves the header
  // spare width; the name's `UEmpty` ends at x + w - h1.
  it('goloxu-09-nero458: jar width 238', () => {
    const body = [
      'class top',
      'class class2',
      'class class3',
      '',
      'top [Qualifier2] -- [Qualifier2] class2',
      'top [Qualifier3] -- [Qualifier3] class3',
    ];
    expect(svgWidth(body)).toBe('238px');
  });

  it('rilali-81-gifu188: jar width 372', () => {
    const body = ['class top', 'class class2', 'class class3', 'class class4', ''];
    for (const n of [2, 3, 4]) body.push(`top [Qualifier${n}] -- [Qualifier${n}] class${n}`);
    expect(svgWidth(body)).toBe('372px');
  });

  it('xoxega-30-vuju324: jar width 373', () => {
    const body = ['class top', 'class class2', 'class class3', 'class class4', ''];
    for (const n of [2, 3, 4]) body.push(`top [long Qualifier${n}] -- [Qualifier${n}] class${n}`);
    expect(svgWidth(body)).toBe('373px');
  });
});
