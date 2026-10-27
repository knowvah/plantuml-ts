import { describe, expect, it } from 'vitest';
import { LocalDate } from '../../../../../src/core/time/LocalDate.js';
import { MeasurerStringBounder } from '../../../../../src/core/measurer-bounder.js';
import { PrintScale } from '../../../../../src/diagrams/gantt/core/PrintScale.js';
import { TimeHeaderQuarterly } from '../../../../../src/diagrams/gantt/draw/header/TimeHeaderQuarterly.js';
import {
  BASELINE_DAY,
  BASELINE_MONTH,
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

// Heights (TimeHeaderQuarterly.java:62-78): year + month + 5 for header, footer and full.
const H1 = FONT_SIZE_YEAR + 2;
const H2 = FONT_SIZE_MONTH + 2;
const DAY_PX = 16 / 40; // cellWidth 16 x default quarterly scale 1/40 = 0.4
const bounder = new MeasurerStringBounder(measurer);
/** A bold 12pt four-digit year under the deterministic measurer: the monthly test centres "2020" at x = 23.983332951862394 in 70 * 16 / 15 px. */
const YEAR_TEXT_WIDTH = (70 * 16) / 15 - 2 * 23.983332951862394;

function make() {
  const d = headerData(PrintScale.QUARTERLY, LONG_MIN, LONG_MAX);
  const h = new TimeHeaderQuarterly(
    compressedScale(d),
    d.weekConfig,
    d.dayCalendar,
    d.timeBounds,
    d.scaleConfig,
    d.timelineStyle,
  );
  return { d, h };
}

describe('TimeHeaderQuarterly (TimeHeaderQuarterly.java:54-171)', () => {
  it('heights are all year + month + 5 (java:62-78)', () => {
    const { h } = make();
    expect(h.getTimeHeaderHeight(bounder)).toBe(FONT_SIZE_YEAR + FONT_SIZE_MONTH + 5);
    expect(h.getTimeFooterHeight(bounder)).toBe(31);
    expect(h.getFullHeaderHeight(bounder)).toBe(31);
  });

  it('header: year vlines, quarter vlines under the year row, hlines at 0, h1+2 and h1+2+h2+2 (java:80-90)', () => {
    const { h } = make();
    const log = recorded((ug) => h.drawTimeHeader(ug, 100));
    const width = 70 * DAY_PX;
    const years = placedOf(log, `ULine(0,${String(H1)})`);
    expect(years.map((p) => [p.x, p.y])).toEqual([
      [0, 0],
      [width, 0],
    ]);
    const quarters = placedOf(log, `ULine(0,${String(H2)})`);
    expect(quarters.map((p) => [p.x, p.y])).toEqual([
      [0, H1],
      [65 * DAY_PX, H1],
      [width, H1],
    ]);
    expect(placedOf(log, `ULine(${String(width)},0)`).map((p) => p.y)).toEqual([0, H1, H1 + H2]);
  });

  it('header: the year centred in the year row, Q1 and Q2 in the quarter row (java:105-163)', () => {
    const { h } = make();
    const texts = placedOf(
      recorded((ug) => h.drawTimeHeader(ug, 100)),
      'UText',
    );
    expect(texts.map((p) => [textOf(p), p.y])).toEqual([
      ['2020', BASELINE_MONTH],
      ['Q1', H1 + BASELINE_DAY],
      ['Q2', H1 + BASELINE_DAY],
    ]);
    expect(texts.map((p) => p.x)).toEqual([0.6499996185302734, 6.34375, 26]);
  });

  it('footer: quarters first, then the year at month + 2 (java:92-103)', () => {
    const { h } = make();
    const log = recorded((ug) => h.drawTimeFooter(ug));
    expect(placedOf(log, 'UText').map((p) => [textOf(p), p.y])).toEqual([
      ['Q1', BASELINE_DAY],
      ['Q2', BASELINE_DAY],
      ['2020', H2 + BASELINE_MONTH],
    ]);
    expect(placedOf(log, 'ULine(28,0)').map((p) => p.y)).toEqual([0, H2, H1 + H2]);
  });

  it('header: year changes inside the range close each year at its vline and centre it in its own span (java:106-124)', () => {
    // 2018-10-01 (Monday) .. 2020-09-30: 92 days of 2018, 365 of 2019, 274 of 2020
    const d = headerData(PrintScale.QUARTERLY, LocalDate.of(2018, 10, 1), LocalDate.of(2020, 9, 30));
    const h = new TimeHeaderQuarterly(
      compressedScale(d),
      d.weekConfig,
      d.dayCalendar,
      d.timeBounds,
      d.scaleConfig,
      d.timelineStyle,
    );
    const log = recorded((ug) => h.drawTimeHeader(ug, 100));
    const edges = [0, 92 * DAY_PX, 457 * DAY_PX, 731 * DAY_PX];
    expectClose(
      placedOf(log, `ULine(0,${String(H1)})`).map((p) => p.x),
      edges,
    );
    const years = placedOf(log, 'UText').filter((p) => /^\d{4}$/.test(textOf(p)));
    expect(years.map((p) => [textOf(p), p.y])).toEqual([
      ['2018', BASELINE_MONTH],
      ['2019', BASELINE_MONTH],
      ['2020', BASELINE_MONTH],
    ]);
    // printCentered (TimeHeader.java:247-253): start + (available - width) / 2
    [0, 1, 2].forEach((i) => {
      const start = edges[i]!;
      const available = edges[i + 1]! - start;
      expect(years[i]!.x).toBeCloseTo(start + (available - YEAR_TEXT_WIDTH) / 2, 6);
    });
  });

  it('header: an empty range (min after max) prints no year and no quarter (java:123)', () => {
    const d = headerData(PrintScale.QUARTERLY, LocalDate.of(2021, 7, 10), LocalDate.of(2020, 7, 5));
    const h = new TimeHeaderQuarterly(
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
