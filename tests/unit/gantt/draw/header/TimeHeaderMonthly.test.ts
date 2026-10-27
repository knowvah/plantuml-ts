import { describe, expect, it } from 'vitest';
import { LocalDate } from '../../../../../src/core/time/LocalDate.js';
import { MeasurerStringBounder } from '../../../../../src/core/measurer-bounder.js';
import { PrintScale } from '../../../../../src/diagrams/gantt/core/PrintScale.js';
import { TimeHeaderMonthly } from '../../../../../src/diagrams/gantt/draw/header/TimeHeaderMonthly.js';
import { TimePoint } from '../../../../../src/diagrams/gantt/time/TimePoint.js';
import {
  BASELINE_DAY,
  BASELINE_MONTH,
  FONT_SIZE_DAY,
  FONT_SIZE_MONTH,
  FONT_SIZE_YEAR,
  LONG_MAX,
  LONG_MIN,
  compressedScale,
  expectClose,
  headerData,
  measurer,
  placedOf,
  recorded,
  textOf,
} from './helpers/header-fixture.js';

// Heights (TimeHeaderMonthly.java:61-86): h1 = year + 2 = 16, h2 = h1 + month + 2 = 30, footer = year + month + 5.
const H1 = FONT_SIZE_YEAR + 2;
const H2 = H1 + FONT_SIZE_MONTH + 2;
const DAY_PX = 16 / 15; // cellWidth 16 x default monthly scale 1/15
const WIDTH = 70 * DAY_PX;
const MONTH_STARTS = [0, 5 * DAY_PX, 34 * DAY_PX, 65 * DAY_PX, WIDTH];
const bounder = new MeasurerStringBounder(measurer);
/** The width of a bold 12pt four-digit year under the deterministic measurer: the first test above centres "2020" at x = 23.983332951862394 in a column of WIDTH. */
const YEAR_TEXT_WIDTH = WIDTH - 2 * 23.983332951862394;

function make() {
  const d = headerData(PrintScale.MONTHLY, LONG_MIN, LONG_MAX);
  const h = new TimeHeaderMonthly(
    compressedScale(d),
    d.weekConfig,
    d.dayCalendar,
    d.timeBounds,
    d.scaleConfig,
    d.timelineStyle,
  );
  return { d, h };
}

describe('TimeHeaderMonthly (TimeHeaderMonthly.java:54-186)', () => {
  it('heights (java:61-86, 177-185)', () => {
    const { d, h } = make();
    expect(h.getTimeHeaderHeight(bounder)).toBe(H2);
    expect(h.getTimeFooterHeight(bounder)).toBe(FONT_SIZE_YEAR + FONT_SIZE_MONTH + 5);
    expect(h.getFullHeaderHeight(bounder)).toBe(H2);
    d.dayCalendar.putNameDay(TimePoint.ofStartOfDay(LONG_MIN), 'N');
    expect(h.getFullHeaderHeight(bounder)).toBe(H2 + FONT_SIZE_DAY + 6);
  });

  it('header: year row (0..h1) bounded by two vlines, month vlines below it (java:89-101, 116-163)', () => {
    const { h } = make();
    const log = recorded((ug) => h.drawTimeHeader(ug, 100));
    const years = placedOf(log, `ULine(0,${String(H1)})`);
    expectClose(
      years.map((p) => p.x),
      [0, WIDTH],
    );
    expect(years.map((p) => p.y)).toEqual([0, 0]);
    const months = placedOf(log, `ULine(0,${String(FONT_SIZE_MONTH + 2)})`);
    expectClose(
      months.map((p) => p.x),
      MONTH_STARTS,
    );
    expect(months.every((p) => p.y === H1)).toBe(true);
  });

  it('header: hlines at 0, h1 and h2 (java:97-99)', () => {
    const { h } = make();
    const hlines = placedOf(
      recorded((ug) => h.drawTimeHeader(ug, 100)),
      'ULine(74.66',
    );
    expect(hlines.map((p) => p.y)).toEqual([0, H1, H2]);
  });

  it('header: the year in bold month font, then the months at h1 (java:115-172)', () => {
    const { h } = make();
    const texts = placedOf(
      recorded((ug) => h.drawTimeHeader(ug, 100)),
      'UText',
    );
    expect(texts.map((p) => [textOf(p), p.y])).toEqual([
      ['2020', BASELINE_MONTH],
      ['Jan', H1 + BASELINE_DAY],
      ['Feb', H1 + BASELINE_DAY],
      ['March', H1 + BASELINE_DAY],
      ['Apr', H1 + BASELINE_DAY],
    ]);
    expectClose(
      texts.map((p) => p.x),
      [23.983332951862394, 0, 12.174999999999272, 38.92499999999927, 69.33333333333212],
    );
  });

  it('footer: months first, the year under them, hlines at 0, h2+2... (java:103-113)', () => {
    const { h } = make();
    const log = recorded((ug) => h.drawTimeFooter(ug));
    const m = FONT_SIZE_MONTH + 2;
    expect(placedOf(log, 'UText').map((p) => [textOf(p), p.y])).toEqual([
      ['Jan', BASELINE_DAY],
      ['Feb', BASELINE_DAY],
      ['March', BASELINE_DAY],
      ['Apr', BASELINE_DAY],
      ['2020', m + BASELINE_MONTH],
    ]);
    const hlines = placedOf(log, 'ULine(74.66');
    expect(hlines.map((p) => p.y)).toEqual([0, m, FONT_SIZE_YEAR + 2 + m]);
  });

  it('header: a year change inside the range closes the first year at the vline and centres each year in its own span (java:116-136)', () => {
    // 2019-06-03 (Monday) .. 2020-03-01: 212 days of 2019 (Jun 3 -> Jan 1), then 61 days of 2020 (Jan 1 -> Mar 2)
    const d = headerData(PrintScale.MONTHLY, LocalDate.of(2019, 6, 3), LocalDate.of(2020, 3, 1));
    const h = new TimeHeaderMonthly(
      compressedScale(d),
      d.weekConfig,
      d.dayCalendar,
      d.timeBounds,
      d.scaleConfig,
      d.timelineStyle,
    );
    const log = recorded((ug) => h.drawTimeHeader(ug, 100));
    const change = 212 * DAY_PX;
    const end = 273 * DAY_PX;
    expectClose(
      placedOf(log, `ULine(0,${String(H1)})`).map((p) => p.x),
      [0, change, end],
    );
    const years = placedOf(log, 'UText').filter((p) => /^\d{4}$/.test(textOf(p)));
    expect(years.map((p) => [textOf(p), p.y])).toEqual([
      ['2019', BASELINE_MONTH],
      ['2020', BASELINE_MONTH],
    ]);
    // printCentered (TimeHeader.java:247-253): start + (available - width) / 2
    expect(years[0]!.x).toBeCloseTo((change - YEAR_TEXT_WIDTH) / 2, 6);
    expect(years[1]!.x).toBeCloseTo(change + (end - change - YEAR_TEXT_WIDTH) / 2, 6);
  });

  it('header: an empty range (min after max) prints no year and no month, only the closing vline (java:133-134)', () => {
    // the last position, one day after max, lies left of the origin (x1 <= lastChange = -1), so nothing is printed
    const d = headerData(PrintScale.MONTHLY, LocalDate.of(2021, 7, 10), LocalDate.of(2020, 7, 5));
    const h = new TimeHeaderMonthly(
      compressedScale(d),
      d.weekConfig,
      d.dayCalendar,
      d.timeBounds,
      d.scaleConfig,
      d.timelineStyle,
    );
    const log = recorded((ug) => h.drawTimeHeader(ug, 100));
    expect(placedOf(log, 'UText')).toEqual([]);
    // 2021-07-10 back to 2020-07-06 (the day after max) is 369 days
    expectClose(
      placedOf(log, `ULine(0,${String(H1)})`).map((p) => p.x),
      [-369 * DAY_PX],
    );
  });
});
