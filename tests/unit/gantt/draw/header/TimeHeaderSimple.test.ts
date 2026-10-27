import { describe, expect, it } from 'vitest';
import { MeasurerStringBounder } from '../../../../../src/core/measurer-bounder.js';
import { HColorSet } from '../../../../../src/core/klimt/color/HColorSet.js';
import type { UGraphic } from '../../../../../src/core/klimt/UGraphic.js';
import { PrintScale } from '../../../../../src/diagrams/gantt/core/PrintScale.js';
import { TimeHeaderSimple } from '../../../../../src/diagrams/gantt/draw/header/TimeHeaderSimple.js';
import { TimePoint } from '../../../../../src/diagrams/gantt/time/TimePoint.js';
import { TimeScaleWink } from '../../../../../src/diagrams/gantt/timescale/TimeScaleWink.js';
import {
  BASELINE_DAY,
  FONT_SIZE_DAY,
  headerData,
  measurer,
  placedOf,
  recorded,
  textOf,
} from './helpers/header-fixture.js';

// Heights (TimeHeaderSimple.java:69-83): day + 6 for header, footer and full header.
const HEIGHT = FONT_SIZE_DAY + 6;
const CELL = FONT_SIZE_DAY * 1.6;
const EPOCH = TimePoint.epoch();
const TOTAL = 100;
const bounder = new MeasurerStringBounder(measurer);

function make(printScale: PrintScale, days: number, factor = 1) {
  const d = headerData(printScale, EPOCH, EPOCH.plusDays(days - 1));
  d.scaleConfig.setFactorScale(factor);
  const scale = new TimeScaleWink(CELL, d.scaleConfig.getEffectiveScale(), printScale);
  const h = new TimeHeaderSimple(scale, d.weekConfig, d.dayCalendar, d.timeBounds, d.scaleConfig, d.timelineStyle);
  return { d, h };
}

/** Exposes the protected `drawTextsBackground` (java:203-237), which nothing in the header itself calls. */
class WithBackground extends TimeHeaderSimple {
  textsBackground(ug: UGraphic, total: number): void {
    this.drawTextsBackground(ug, total);
  }
}

describe('TimeHeaderSimple (TimeHeaderSimple.java:61-239)', () => {
  it('heights are day + 6, with no named-day band (java:69-87)', () => {
    const { h } = make(PrintScale.DAILY, 7);
    expect(h.getTimeHeaderHeight(bounder)).toBe(HEIGHT);
    expect(h.getTimeFooterHeight(bounder)).toBe(HEIGHT);
    expect(h.getFullHeaderHeight(bounder)).toBe(HEIGHT);
  });

  it('daily: a small vline per day plus the end, 6 down and total + 2 long (java:143-152)', () => {
    const { h } = make(PrintScale.DAILY, 7);
    const vlines = placedOf(
      recorded((ug) => h.drawTimeHeader(ug, TOTAL)),
      `ULine(0,${String(TOTAL + 2)})`,
    );
    expect(vlines.map((p) => [p.x, p.y])).toEqual(Array.from({ length: 8 }, (_, i) => [i * CELL, 6]));
    expect(vlines[0]?.paint).toEqual(['fore(#C0C0C0)']);
  });

  it('daily: the day counter is absoluteDayNum + 1, centred in its cell (java:154-182)', () => {
    const { h } = make(PrintScale.DAILY, 7);
    const texts = placedOf(
      recorded((ug) => h.drawTimeHeader(ug, TOTAL)),
      'UText',
    );
    expect(texts.map(textOf)).toEqual(['1', '2', '3', '4', '5', '6', '7']);
    expect(texts.map((p) => p.x)).toEqual(Array.from({ length: 7 }, (_, i) => 5.21875 + i * CELL));
    expect(texts.every((p) => p.y === BASELINE_DAY)).toBe(true);
  });

  it('footer: the same counter moved down by 3 (java:198-202)', () => {
    const { h } = make(PrintScale.DAILY, 7);
    const texts = placedOf(
      recorded((ug) => h.drawTimeFooter(ug)),
      'UText',
    );
    expect(texts.map(textOf)).toEqual(['1', '2', '3', '4', '5', '6', '7']);
    expect(texts.every((p) => p.y === 3 + BASELINE_DAY)).toBe(true);
  });

  it('weekly: lines every 7 days, the counter is absoluteDayNum / 7 + 1 (java:107-111, 163-170)', () => {
    const { h } = make(PrintScale.WEEKLY, 21);
    const log = recorded((ug) => h.drawTimeHeader(ug, TOTAL));
    expect(placedOf(log, `ULine(0,${String(TOTAL + 2)})`).map((p) => p.x)).toEqual([0, 28, 56, 84]);
    const texts = placedOf(log, 'UText');
    expect(texts.map(textOf)).toEqual(['1', '2', '3']);
    expect(texts.map((p) => p.x)).toEqual([11.21875, 39.21875, 67.21875]);
  });

  it('daily with narrow cells steps several days at once until 16px apart (initDelta, java:117-141)', () => {
    // cell 16 x 0.25 = 4px per day -> delta 4 days (16px)
    const { h } = make(PrintScale.DAILY, 12, 0.25);
    const log = recorded((ug) => h.drawTimeHeader(ug, TOTAL));
    expect(placedOf(log, `ULine(0,${String(TOTAL + 2)})`).map((p) => p.x)).toEqual([0, 16, 32, 48]);
    expect(placedOf(log, 'UText').map(textOf)).toEqual(['1', '5', '9']);
  });

  it('isZeroOnDay is false: no closed-day background (java:184-187)', () => {
    const { d, h } = make(PrintScale.DAILY, 3);
    const log = recorded((ug) => h.drawTimeHeader(ug, TOTAL));
    expect(placedOf(log, 'URectangle')).toEqual([]);
    d.dayCalendar.putColorDay(
      TimePoint.ofStartOfDay(EPOCH.plusDays(1)),
      HColorSet.instance().getColorOrWhite('#00FF00'),
    );
    const coloured = recorded((ug) => h.drawTimeHeader(ug, TOTAL));
    expect(placedOf(coloured, 'URectangle').map((p) => [p.shape, p.x, p.y, p.paint[0]])).toEqual([
      [`URectangle(${String(CELL)},${String(TOTAL - HEIGHT)})`, CELL, HEIGHT, 'back(#00FF00)'],
    ]);
  });

  it('drawTextsBackground fills runs of day colours and stops at an uncoloured day (java:203-237)', () => {
    const d = headerData(PrintScale.DAILY, EPOCH, EPOCH.plusDays(4));
    const green = HColorSet.instance().getColorOrWhite('#00FF00');
    const red = HColorSet.instance().getColorOrWhite('#FF0000');
    for (const [i, c] of [
      [0, green],
      [1, green],
      [2, red],
    ] as const)
      d.dayCalendar.putColorDay(TimePoint.ofStartOfDay(EPOCH.plusDays(i)), c);
    const h = new WithBackground(
      new TimeScaleWink(CELL, 1, PrintScale.DAILY),
      d.weekConfig,
      d.dayCalendar,
      d.timeBounds,
      d.scaleConfig,
      d.timelineStyle,
    );
    const rects = placedOf(
      recorded((ug) => h.textsBackground(ug, TOTAL)),
      'URectangle',
    );
    expect(rects.map((p) => [p.shape, p.x, p.paint[0]])).toEqual([
      [`URectangle(${String(2 * CELL)},${String(TOTAL - HEIGHT)})`, 0, 'back(#00FF00)'],
      [`URectangle(${String(CELL)},${String(TOTAL - HEIGHT)})`, 2 * CELL, 'back(#FF0000)'],
    ]);
  });
});
