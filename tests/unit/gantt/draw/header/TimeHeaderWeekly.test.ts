import { describe, expect, it } from 'vitest';
import { MeasurerStringBounder } from '../../../../../src/core/measurer-bounder.js';
import { PrintScale } from '../../../../../src/diagrams/gantt/core/PrintScale.js';
import { TimeHeaderWeekly } from '../../../../../src/diagrams/gantt/draw/header/TimeHeaderWeekly.js';
import { WeeklyHeaderStrategy } from '../../../../../src/diagrams/gantt/draw/WeeklyHeaderStrategy.js';
import { TimePoint } from '../../../../../src/diagrams/gantt/time/TimePoint.js';
import {
  BASELINE_DAY,
  BASELINE_MONTH,
  FONT_SIZE_DAY,
  FONT_SIZE_MONTH,
  LONG_MAX,
  LONG_MIN,
  compressedScale,
  headerData,
  measurer,
  placedOf,
  recorded,
  textOf,
} from './helpers/header-fixture.js';

// Heights (TimeHeaderWeekly.java:63-83): h1 = month + 4 = 16, h2 = h1 + day + 1 = 27, footer = month + 4.
const H1 = FONT_SIZE_MONTH + 4;
const H2 = H1 + FONT_SIZE_DAY + 1;
const DAY_PX = 4; // cellWidth 16 x default weekly scale 1/4
const TOTAL = 100;
const bounder = new MeasurerStringBounder(measurer);

function make() {
  const d = headerData(PrintScale.WEEKLY, LONG_MIN, LONG_MAX);
  const h = new TimeHeaderWeekly(
    compressedScale(d),
    d.weekConfig,
    d.dayCalendar,
    d.timeBounds,
    d.scaleConfig,
    d.timelineStyle,
  );
  return { d, h };
}

describe('TimeHeaderWeekly (TimeHeaderWeekly.java:56-188)', () => {
  it('heights (java:63-97)', () => {
    const { d, h } = make();
    expect(h.getTimeHeaderHeight(bounder)).toBe(27);
    expect(h.getTimeFooterHeight(bounder)).toBe(16);
    expect(h.getFullHeaderHeight(bounder)).toBe(27);
    d.dayCalendar.putNameDay(TimePoint.ofStartOfDay(LONG_MIN), 'N');
    expect(h.getFullHeaderHeight(bounder)).toBe(27 + FONT_SIZE_DAY + 6);
  });

  it('header: hlines at 0, h1 and the full height across the 70 days (java:104-108)', () => {
    const { h } = make();
    const hlines = placedOf(
      recorded((ug) => h.drawTimeHeader(ug, TOTAL)),
      'ULine(280,0)',
    );
    expect(hlines.map((p) => p.y)).toEqual([0, H1, H2]);
  });

  it('header: a vline at every Monday from h1 down, then the end (java:145-156)', () => {
    const { h } = make();
    const log = recorded((ug) => h.drawTimeHeader(ug, TOTAL));
    const weeks = placedOf(log, `ULine(0,${String(TOTAL - H1)})`);
    expect(weeks.map((p) => p.x)).toEqual(Array.from({ length: 11 }, (_, i) => i * 7 * DAY_PX));
    expect(weeks.every((p) => p.y === H1)).toBe(true);
  });

  it('header: month boundary vlines in the month row, 0..h1 (java:118-139)', () => {
    const { h } = make();
    const months = placedOf(
      recorded((ug) => h.drawTimeHeader(ug, TOTAL)),
      `ULine(0,${String(H1)})`,
    );
    expect(months.map((p) => p.x)).toEqual([0, 5 * DAY_PX, 34 * DAY_PX, 65 * DAY_PX, 70 * DAY_PX]);
    expect(months.every((p) => p.y === 0)).toBe(true);
  });

  it('header: ISO week numbers under h1, month names in the month row (java:118-177)', () => {
    const { h } = make();
    const texts = placedOf(
      recorded((ug) => h.drawTimeHeader(ug, TOTAL)),
      'UText',
    );
    const weeks = texts.filter((p) => p.y > H1);
    expect(weeks.map(textOf)).toEqual(['5', '6', '7', '8', '9', '10', '11', '12', '13', '14']);
    expect(weeks.map((p) => p.x)).toEqual(Array.from({ length: 10 }, (_, i) => i * 7 * DAY_PX + 5));
    expect(weeks.every((p) => p.y === H1 + BASELINE_DAY)).toBe(true);
    const months = texts.filter((p) => p.y < H1);
    expect(months.map((p) => [textOf(p), p.y])).toEqual([
      ['Jan', BASELINE_MONTH],
      ['Feb 2020', BASELINE_MONTH],
      ['Mar 2020', BASELINE_MONTH],
      ['Apr', BASELINE_MONTH],
    ]);
  });

  it('FROM_N numbers the weeks from weekStartingNumber (java:162-168)', () => {
    const { d, h } = make();
    d.weekConfig.setWeeklyHeaderStrategy(WeeklyHeaderStrategy.FROM_N);
    d.weekConfig.setWeekStartingNumber(3);
    const weeks = placedOf(
      recorded((ug) => h.drawTimeHeader(ug, TOTAL)),
      'UText',
    ).filter((p) => p.y > H1);
    expect(weeks.map(textOf)).toEqual(['3', '4', '5', '6', '7', '8', '9', '10', '11', '12']);
  });

  it('DAY_OF_MONTH prints the Monday dates (java:164-166)', () => {
    const { d, h } = make();
    d.weekConfig.setWeeklyHeaderStrategy(WeeklyHeaderStrategy.DAY_OF_MONTH);
    const weeks = placedOf(
      recorded((ug) => h.drawTimeHeader(ug, TOTAL)),
      'UText',
    ).filter((p) => p.y > H1);
    expect(weeks.map(textOf)).toEqual(['27', '3', '10', '17', '24', '2', '9', '16', '23', '30']);
  });

  it('footer: hlines at 0 and the footer height, month boundaries and names (java:111-116)', () => {
    const { h } = make();
    const log = recorded((ug) => h.drawTimeFooter(ug));
    expect(placedOf(log, 'ULine(280,0)').map((p) => p.y)).toEqual([0, H1]);
    expect(placedOf(log, `ULine(0,${String(H1)})`).map((p) => p.x)).toEqual([
      0,
      5 * DAY_PX,
      34 * DAY_PX,
      65 * DAY_PX,
      70 * DAY_PX,
    ]);
    expect(placedOf(log, 'UText').map(textOf)).toEqual(['Jan', 'Feb 2020', 'Mar 2020', 'Apr']);
  });
});
