import { describe, expect, it } from 'vitest';
import { DayOfWeek } from '../../../../../src/core/time/DayOfWeek.js';
import { TimeHeaderDaily } from '../../../../../src/diagrams/gantt/draw/header/TimeHeaderDaily.js';
import { TimePoint } from '../../../../../src/diagrams/gantt/time/TimePoint.js';
import {
  BASELINE_DAY,
  BASELINE_MONTH,
  FONT_SIZE_DAY,
  FONT_SIZE_MONTH,
  MIN_DAY,
  dailyScale,
  headerData,
  measurer,
  placedOf,
  recorded,
  textOf,
} from './helpers/header-fixture.js';
import { MeasurerStringBounder } from '../../../../../src/core/measurer-bounder.js';

// Heights (TimeHeaderDaily.java:61-84): h1 = month + 2, h2 = h1 + day + 2, h3 = h2 + day + 3,
// footer = day + day + month + 8. Skin font sizes: day 10, month 12 -> h1 14, h2 26, h3 39, footer 40.
const H1 = FONT_SIZE_MONTH + 2;
const H2 = H1 + FONT_SIZE_DAY + 2;
const H3 = H2 + FONT_SIZE_DAY + 3;
const CELL = FONT_SIZE_DAY * 1.6;
const DAYS = 21;
const TOTAL = 100;
const bounder = new MeasurerStringBounder(measurer);

function make() {
  const d = headerData();
  const h = new TimeHeaderDaily(
    dailyScale(d),
    d.weekConfig,
    d.dayCalendar,
    d.timeBounds,
    d.scaleConfig,
    d.timelineStyle,
  );
  return { d, h };
}

describe('TimeHeaderDaily (TimeHeaderDaily.java:54-220)', () => {
  it('heights: header h3, footer day+day+month+8, full = header without named days (java:73-98)', () => {
    const { h } = make();
    expect(h.getTimeHeaderHeight(bounder)).toBe(39);
    expect(h.getTimeFooterHeight(bounder)).toBe(40);
    expect(h.getFullHeaderHeight(bounder)).toBe(39);
  });

  it('named days add day + 6 to the full header height (java:86-98)', () => {
    const { d, h } = make();
    d.dayCalendar.putNameDay(TimePoint.ofStartOfDay(MIN_DAY), 'Kickoff');
    expect(h.getFullHeaderHeight(bounder)).toBe(39 + FONT_SIZE_DAY + 6);
  });

  it('header: one vline per day plus the end, h3 down to the total (java:113-131)', () => {
    const { h } = make();
    const log = recorded((ug) => h.drawTimeHeader(ug, TOTAL));
    const vlines = placedOf(log, `ULine(0,${String(TOTAL - H3)})`);
    expect(vlines.map((p) => p.x)).toEqual(Array.from({ length: DAYS + 1 }, (_, i) => i * CELL));
    expect(vlines.every((p) => p.y === H3 && p.paint.join() === 'fore(#C0C0C0)')).toBe(true);
  });

  it('header: hlines under the header and at the total height, as wide as the 21 days (java:107-108)', () => {
    const { h } = make();
    const log = recorded((ug) => h.drawTimeHeader(ug, TOTAL));
    const hlines = placedOf(log, 'ULine(336,0)');
    expect(hlines.map((p) => [p.x, p.y])).toEqual([
      [0, H3],
      [0, TOTAL],
    ]);
  });

  it('header: month name, then the day-of-week row at h1 and the day-of-month row at h2 (java:101-106)', () => {
    const { h } = make();
    const texts = placedOf(
      recorded((ug) => h.drawTimeHeader(ug, TOTAL)),
      'UText',
    );
    expect(texts.filter((p) => p.y < H1).map((p) => [textOf(p), p.x, p.y])).toEqual([
      ['July 2020', 142.3125, BASELINE_MONTH],
    ]);
    const dow = texts.filter((p) => p.y > H1 && p.y < H2);
    expect(dow.map(textOf)).toEqual(
      Array.from({ length: DAYS }, (_, i) => ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'][i % 7]),
    );
    expect(dow.slice(0, 3).map((p) => [p.x, p.y])).toEqual([
      [1.0625, H1 + BASELINE_DAY],
      [18.15625, H1 + BASELINE_DAY],
      [32.5, H1 + BASELINE_DAY],
    ]);
    const dom = texts.filter((p) => p.y > H2);
    expect(dom.map(textOf)).toEqual(Array.from({ length: DAYS }, (_, i) => String(6 + i)));
    expect(dom[0]).toMatchObject({ x: 5.21875, y: H2 + BASELINE_DAY });
  });

  it('footer: day of week at 0, day of month at h+2, months at 2h+3 with h = day + 2 (java:133-138)', () => {
    const { h } = make();
    const texts = placedOf(
      recorded((ug) => h.drawTimeFooter(ug)),
      'UText',
    );
    const f = FONT_SIZE_DAY + 2;
    expect(texts.filter((p) => p.y < f).map(textOf)).toHaveLength(DAYS);
    expect(texts.filter((p) => p.y > f && p.y < 2 * f + 3).map(textOf)).toEqual(
      Array.from({ length: DAYS }, (_, i) => String(6 + i)),
    );
    expect(texts.filter((p) => p.y > 2 * f + 3).map((p) => [textOf(p), p.y])).toEqual([
      ['July 2020', 2 * f + 3 + BASELINE_MONTH],
    ]);
  });

  it('a bold (separator) day draws its vline with the vertical-separator style, not the line colour (java:118-123)', () => {
    const { d, h } = make();
    d.dayCalendar.addSeparatorBefore(MIN_DAY.plusDays(7));
    const log = recorded((ug) => h.drawTimeHeader(ug, TOTAL));
    const bold = placedOf(log, `ULine(0,${String(TOTAL - H3)})`).filter((p) => p.x === 7 * CELL);
    expect(bold).toHaveLength(1);
    expect(bold[0]?.paint.some((t) => t.startsWith('stroke('))).toBe(true);
    expect(bold[0]?.paint).not.toEqual(['fore(#C0C0C0)']);
  });

  it('hideClosed drops the texts of closed days, nothing else moves (java:169-177)', () => {
    const { d, h } = make();
    d.scaleConfig.setHideClosed(true);
    d.dayCalendar.getOpenClose().close(DayOfWeek.SUNDAY);
    const texts = placedOf(
      recorded((ug) => h.drawTimeHeader(ug, TOTAL)),
      'UText',
    );
    expect(texts.filter((p) => textOf(p) === 'Su')).toHaveLength(0);
    expect(texts.filter((p) => textOf(p) === 'Mo')).toHaveLength(3);
    expect(texts.filter((p) => p.y > H2)).toHaveLength(DAYS - 3);
  });

  it('closed days use the closed font colour for their texts and a closed-background rectangle (java:178-188)', () => {
    const { d, h } = make();
    d.dayCalendar.getOpenClose().close(DayOfWeek.SUNDAY);
    const log = recorded((ug) => h.drawTimeHeader(ug, TOTAL));
    const rects = placedOf(log, 'URectangle');
    expect(rects.map((p) => [p.shape, p.x, p.y])).toEqual([
      [`URectangle(${String(CELL)},${String(TOTAL - H3)})`, 6 * CELL, H3],
      [`URectangle(${String(CELL)},${String(TOTAL - H3)})`, 13 * CELL, H3],
      [`URectangle(${String(CELL)},${String(TOTAL - H3)})`, 20 * CELL, H3],
    ]);
  });

  it('named days are drawn once per run at the header height (TimeHeaderCalendar.java:80-98, month font)', () => {
    const { d, h } = make();
    for (const i of [1, 2]) d.dayCalendar.putNameDay(TimePoint.ofStartOfDay(MIN_DAY.plusDays(i)), 'Kickoff');
    const log = recorded((ug) => h.drawTimeHeader(ug, TOTAL));
    const names = placedOf(log, 'UText(Kickoff)');
    expect(names).toHaveLength(1);
    expect(names[0]).toMatchObject({ x: CELL, y: H3 + BASELINE_MONTH });
  });
});
