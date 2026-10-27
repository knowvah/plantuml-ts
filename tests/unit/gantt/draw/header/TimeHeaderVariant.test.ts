import { describe, expect, it, vi } from 'vitest';
import { MeasurerStringBounder } from '../../../../../src/core/measurer-bounder.js';
import type { UGraphic } from '../../../../../src/core/klimt/UGraphic.js';
import { svgGraphic } from '../../helpers/gantt-diagram-fixture.js';
import { LocalDate } from '../../../../../src/core/time/LocalDate.js';
import { HColorSet } from '../../../../../src/core/klimt/color/HColorSet.js';
import { PrintScale } from '../../../../../src/diagrams/gantt/core/PrintScale.js';
import { TimeRange } from '../../../../../src/diagrams/gantt/core/TimeRange.js';
import { TimeHeaderFactory } from '../../../../../src/diagrams/gantt/draw/header/TimeHeaderFactory.js';
import { TimeHeaderVariant } from '../../../../../src/diagrams/gantt/draw/header/TimeHeaderVariant.js';
import { VariantTimeScale } from '../../../../../src/diagrams/gantt/timescale/VariantTimeScale.js';
import { TimePoint } from '../../../../../src/diagrams/gantt/time/TimePoint.js';
import {
  BASELINE_DAY,
  BASELINE_MONTH,
  FONT_SIZE_DAY,
  FONT_SIZE_MONTH,
  MIN_DAY,
  headerData,
  measurer,
  placedOf,
  recorded,
  textOf,
} from './helpers/header-fixture.js';

// Heights (TimeHeaderVariant.java:74-99): h1 = month + 2, h2 = h1 + day + 2, h3 = h2 + day + 3; footer 0.
const H1 = FONT_SIZE_MONTH + 2;
const H2 = H1 + FONT_SIZE_DAY + 2;
const H3 = H2 + FONT_SIZE_DAY + 3;
const DAY_PX = 40; // VariantTimeScale: 08:00-12:00 working, dayWidth 120 with closeFactor 0.2 (TimeHeaderFactory.java:54-55)
const TOTAL = 100;
const bounder = new MeasurerStringBounder(measurer);

function make(min: LocalDate = MIN_DAY, max: LocalDate = MIN_DAY.plusDays(2)) {
  const d = headerData(PrintScale.DAILY, min, max);
  d.dayCalendar.addWorkingTimeRange(new TimeRange('08:00', '12:00'));
  const h = new TimeHeaderFactory(
    d.weekConfig,
    d.dayCalendar,
    d.timeBounds,
    d.scaleConfig,
    d.timelineStyle,
  ).createTimeHeader();
  if (!(h instanceof TimeHeaderVariant)) throw new Error('expected a TimeHeaderVariant');
  return { d, h };
}

/** Exposes the protected `drawTextsBackground` (java:188-221), which nothing in the header itself calls. */
class WithBackground extends TimeHeaderVariant {
  textsBackground(ug: UGraphic, total: number): void {
    this.drawTextsBackground(ug, total);
  }
}

describe('TimeHeaderVariant (TimeHeaderVariant.java:58-334)', () => {
  it('heights: header h3, footer 0, no named-day band (java:70-99)', () => {
    const { h } = make();
    expect(h.getTimeHeaderHeight(bounder)).toBe(H3);
    expect(h.getTimeFooterHeight(bounder)).toBe(0);
    expect(h.getFullHeaderHeight(bounder)).toBe(H3);
  });

  it('header: month, then weekday names that fit (long before short) and the day numbers (java:263-329)', () => {
    const { h } = make();
    const texts = placedOf(
      recorded((ug) => h.drawTimeHeader(ug, TOTAL)),
      'UText',
    );
    expect(texts.map((p) => [textOf(p), p.y])).toEqual([
      ['July 2020', BASELINE_MONTH],
      ['Monday', H1 + BASELINE_DAY],
      ['Tuesday', H1 + BASELINE_DAY],
      ['We', H1 + BASELINE_DAY], // "Wednesday" does not fit the 40px column, so the short form is chosen
      ['6', H2 + BASELINE_DAY],
      ['7', H2 + BASELINE_DAY],
      ['8', H2 + BASELINE_DAY],
    ]);
  });

  it('header: a vline per day boundary from h1, total long (java:166-174, 263-273)', () => {
    const { h } = make();
    const vlines = placedOf(
      recorded((ug) => h.drawTimeHeader(ug, TOTAL)),
      `ULine(0,${String(TOTAL)})`,
    );
    expect(vlines.map((p) => [p.x, p.y])).toEqual([0, 1, 2, 3].map((i) => [i * DAY_PX, H1]));
  });

  it('header: the non-working hours of every day are filled with the closed background below h3 (java:275-288)', () => {
    const { h } = make();
    const rects = placedOf(
      recorded((ug) => h.drawTimeHeader(ug, TOTAL)),
      'URectangle',
    );
    expect(rects).toHaveLength(6); // before 08:00 and after 12:00, three days
    expect(rects.map((p) => p.x).filter((x, i) => i % 2 === 0)).toEqual([0, DAY_PX, 2 * DAY_PX]);
    expect(rects.every((p) => p.y === H3 && p.paint.join() === 'fore(#F1E5E5),back(#F1E5E5)')).toBe(true);
  });

  it('footer draws nothing (java:183-187)', () => {
    const { h } = make();
    expect(recorded((ug) => h.drawTimeFooter(ug))).toEqual([]);
  });

  it('drawTextsBackground fills runs of equal day colours (java:188-221)', () => {
    const { d } = make();
    const green = HColorSet.instance().getColorOrWhite('#00FF00');
    for (const i of [0, 1]) d.dayCalendar.putColorDay(TimePoint.ofStartOfDay(MIN_DAY.plusDays(i)), green);
    const workingHours = d.dayCalendar.buildWorkingHours(120, 0.2);
    const h = new WithBackground(
      new VariantTimeScale(MIN_DAY, MIN_DAY.plusDays(2), workingHours, d.dayCalendar.getOpenClose()),
      d.weekConfig,
      d.dayCalendar,
      d.timeBounds,
      d.scaleConfig,
      d.timelineStyle,
      workingHours,
    );
    const rects = placedOf(
      recorded((ug) => h.textsBackground(ug, TOTAL)),
      'URectangle',
    );
    expect(rects.map((p) => [p.shape, p.x, p.paint[0]])).toEqual([
      [`URectangle(${String(2 * DAY_PX)},${String(TOTAL - H3)})`, 0, 'back(#00FF00)'],
    ]);
  });

  it('hideClosed skips the texts of closed days (java:264-268)', () => {
    const { d, h } = make();
    d.scaleConfig.setHideClosed(true);
    d.dayCalendar.getOpenClose().close(MIN_DAY);
    const texts = placedOf(
      recorded((ug) => h.drawTimeHeader(ug, TOTAL)),
      'UText',
    ).map(textOf);
    expect(texts).not.toContain('Monday');
    expect(texts).toContain('Tuesday');
    expect(texts).not.toContain('6');
  });

  /** A `WithBackground` over MIN_DAY .. +2 with `colours[i]` on day i (undefined: no colour). */
  function backgroundOver(colours: readonly (string | undefined)[]) {
    const { d } = make();
    colours.forEach((colour, i) => {
      if (colour !== undefined)
        d.dayCalendar.putColorDay(
          TimePoint.ofStartOfDay(MIN_DAY.plusDays(i)),
          HColorSet.instance().getColorOrWhite(colour),
        );
    });
    const workingHours = d.dayCalendar.buildWorkingHours(120, 0.2);
    return new WithBackground(
      new VariantTimeScale(MIN_DAY, MIN_DAY.plusDays(2), workingHours, d.dayCalendar.getOpenClose()),
      d.weekConfig,
      d.dayCalendar,
      d.timeBounds,
      d.scaleConfig,
      d.timelineStyle,
      workingHours,
    );
  }
  const bandsOf = (h: WithBackground): [string, number, string | undefined][] =>
    placedOf(
      recorded((ug) => h.textsBackground(ug, TOTAL)),
      'URectangle',
    ).map((p) => [p.shape, p.x, p.paint[0]]);
  const BAND = `URectangle(${String(DAY_PX)},${String(TOTAL - H3)})`;

  it('drawTextsBackground flushes a run when the next day has another colour (java:208-213)', () => {
    // green, red, none: green is flushed by the colour change, red by the uncoloured day
    expect(bandsOf(backgroundOver(['#00FF00', '#FF0000', undefined]))).toEqual([
      [BAND, 0, 'back(#00FF00)'],
      [BAND, DAY_PX, 'back(#FF0000)'],
    ]);
  });

  it('drawTextsBackground starts no run on an uncoloured first day, and never flushes a run still open after the last day (java:204-218)', () => {
    // none, green, red: green is flushed by the colour change; red is still pending when the loop ends and is dropped
    expect(bandsOf(backgroundOver([undefined, '#00FF00', '#FF0000']))).toEqual([[BAND, DAY_PX, 'back(#00FF00)']]);
  });

  it('a closed day (open/close calendar) has its day names in the closed font colour (java:244-251)', () => {
    const { d, h } = make();
    d.dayCalendar.getOpenClose().close(MIN_DAY.plusDays(1));
    const ug = svgGraphic();
    h.drawTimeHeader(ug, TOTAL);
    const svg = ug.getSvgString();
    const fillOf = (text: string): string | undefined =>
      new RegExp(`<text[^>]*fill="(#[0-9A-Fa-f]{3,6})"[^>]*>${text}</text>`).exec(svg)?.[1];
    // plantuml.skin:432-435 `closed { FontColor #989898 }`; Tuesday is closed, so only "Tu" (the 24 px closed column)
    // and "7" take it, while the open Monday and the 6th keep the timeline's black font colour
    expect(fillOf('Tu')).toBe('#989898');
    expect(fillOf('7')).toBe('#989898');
    expect(fillOf('Monday')).toBe('#000');
    expect(fillOf('6')).toBe('#000');
  });

  it('months: a month change inside the range prints the finished month at its vline (java:313-319)', () => {
    // Wed 2020-07-29 .. Mon 2020-08-03: three July days then three August days, 40 px each
    const { h } = make(LocalDate.of(2020, 7, 29), LocalDate.of(2020, 8, 3));
    const texts = placedOf(
      recorded((ug) => h.drawTimeHeader(ug, TOTAL)),
      'UText',
    );
    const months = texts.filter((p) => p.y === BASELINE_MONTH);
    expect(months.map(textOf)).toEqual(['July 2020', 'August 2020']);
    expect(months[0]!.x).toBeLessThan(3 * DAY_PX);
    expect(months[1]!.x).toBeGreaterThanOrEqual(3 * DAY_PX);
  });

  it('months: a closing position left of the last month change prints no month (java:324-325)', () => {
    // min after max: no day is visited, lastChangeMonth stays -1; a scale answering -5 puts the closing x1 left of it
    const d = headerData(PrintScale.DAILY, LocalDate.of(2021, 7, 10), LocalDate.of(2020, 7, 5));
    const workingHours = d.dayCalendar.buildWorkingHours(120, 0.2);
    const leftOfOrigin = new VariantTimeScale(
      LocalDate.of(2021, 7, 10),
      LocalDate.of(2020, 7, 5),
      workingHours,
      d.dayCalendar.getOpenClose(),
    );
    vi.spyOn(leftOfOrigin, 'getPosition').mockReturnValue(-5);
    const h = new TimeHeaderVariant(
      leftOfOrigin,
      d.weekConfig,
      d.dayCalendar,
      d.timeBounds,
      d.scaleConfig,
      d.timelineStyle,
      workingHours,
    );
    const texts = placedOf(
      recorded((ug) => h.drawTimeHeader(ug, TOTAL)),
      'UText',
    );
    expect(texts).toEqual([]);
  });
});
