import { describe, expect, it } from 'vitest';
import { LocalDate } from '../../../../../src/core/time/LocalDate.js';
import { MeasurerStringBounder } from '../../../../../src/core/measurer-bounder.js';
import { PrintScale } from '../../../../../src/diagrams/gantt/core/PrintScale.js';
import { TimeHeaderYearly } from '../../../../../src/diagrams/gantt/draw/header/TimeHeaderYearly.js';
import {
  BASELINE_YEAR,
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

// Heights (TimeHeaderYearly.java:61-74): year + 3. Year row bound = year + 2 (java:97-114).
const HEIGHT = FONT_SIZE_YEAR + 3;
const bounder = new MeasurerStringBounder(measurer);

function make(factor = 1) {
  const d = headerData(PrintScale.YEARLY, LONG_MIN, LONG_MAX);
  d.scaleConfig.setFactorScale(factor);
  const h = new TimeHeaderYearly(
    compressedScale(d),
    d.weekConfig,
    d.dayCalendar,
    d.timeBounds,
    d.scaleConfig,
    d.timelineStyle,
  );
  return { d, h };
}

describe('TimeHeaderYearly (TimeHeaderYearly.java:53-124)', () => {
  it('heights are year + 3 (java:61-74)', () => {
    const { h } = make();
    expect(h.getTimeHeaderHeight(bounder)).toBe(HEIGHT);
    expect(h.getTimeFooterHeight(bounder)).toBe(HEIGHT);
    expect(h.getFullHeaderHeight(bounder)).toBe(HEIGHT);
  });

  it('header: two year vlines (0..year+2) and hlines at 0 and the height (java:78-82, 97-114)', () => {
    const { h } = make();
    const log = recorded((ug) => h.drawTimeHeader(ug, 100));
    const width = (70 * 16) / 60;
    const vlines = placedOf(log, `ULine(0,${String(FONT_SIZE_YEAR + 2)})`);
    expectClose(
      vlines.map((p) => p.x),
      [0, width],
    );
    expect(placedOf(log, 'ULine(18.66').map((p) => p.y)).toEqual([0, HEIGHT]);
  });

  it('a year too wide for its column is hidden (hideIfTooBig, java:120-122)', () => {
    const { h } = make();
    expect(
      placedOf(
        recorded((ug) => h.drawTimeHeader(ug, 100)),
        'UText',
      ),
    ).toEqual([]);
  });

  it('a year that fits is drawn in the bold year row (java:92-116)', () => {
    const { h } = make(20);
    const texts = placedOf(
      recorded((ug) => h.drawTimeHeader(ug, 100)),
      'UText',
    );
    expect(texts.map((p) => [textOf(p), p.y])).toEqual([['2020', BASELINE_YEAR]]);
  });

  it('footer: the same row, hlines at 0 and the footer height (java:84-90)', () => {
    const { h } = make(20);
    const log = recorded((ug) => h.drawTimeFooter(ug));
    expect(placedOf(log, 'UText').map(textOf)).toEqual(['2020']);
    expect(placedOf(log, 'ULine(373.33').map((p) => p.y)).toEqual([0, HEIGHT]);
  });

  it('an empty range (min after max) prints no year, only the closing vline (java:85)', () => {
    const d = headerData(PrintScale.YEARLY, LocalDate.of(2021, 7, 10), LocalDate.of(2020, 7, 5));
    d.scaleConfig.setFactorScale(20);
    const h = new TimeHeaderYearly(
      compressedScale(d),
      d.weekConfig,
      d.dayCalendar,
      d.timeBounds,
      d.scaleConfig,
      d.timelineStyle,
    );
    const log = recorded((ug) => h.drawTimeHeader(ug, 100));
    expect(placedOf(log, 'UText')).toEqual([]);
    // 2021-07-10 back to 2020-07-06 (the day after max) is 369 days, each 16 * 20 / 60 px (yearly 1/60, factor 20)
    expectClose(
      placedOf(log, `ULine(0,${String(FONT_SIZE_YEAR + 2)})`).map((p) => p.x),
      [(-369 * 16 * 20) / 60],
    );
  });
});
