/**
 * Shared fixture for the `TimeHeader` family tests: the real style / calendar / config data objects over
 * the built-in `plantuml.skin` ganttDiagram block, a fixed 3-week range (2020-07-06 .. 2020-07-26, Monday to
 * Sunday), and a recording `UGraphic`. The bounds are the real `TimeBoundsData`.
 */
import { expect } from 'vitest';
import type { ISkinParam } from '../../../../../../src/core/abel/ISkinParam.js';
import { HColorSet } from '../../../../../../src/core/klimt/color/HColorSet.js';
import { DeterministicMeasurer } from '../../../../../../src/core/measurer-deterministic.js';
import { Pragma } from '../../../../../../src/core/skin/Pragma.js';
import { LocalDate } from '../../../../../../src/core/time/LocalDate.js';
import { PrintScale } from '../../../../../../src/diagrams/gantt/core/PrintScale.js';
import { DayCalendarData } from '../../../../../../src/diagrams/gantt/data/DayCalendarData.js';
import { TimeBoundsData } from '../../../../../../src/diagrams/gantt/data/TimeBoundsData.js';
import { TimeScaleConfigData } from '../../../../../../src/diagrams/gantt/data/TimeScaleConfigData.js';
import { TimelineStyleData } from '../../../../../../src/diagrams/gantt/data/TimelineStyleData.js';
import { WeekConfigData } from '../../../../../../src/diagrams/gantt/data/WeekConfigData.js';
import { TimePoint } from '../../../../../../src/diagrams/gantt/time/TimePoint.js';
import { TimeScaleCompressed } from '../../../../../../src/diagrams/gantt/timescale/TimeScaleCompressed.js';
import { TimeScaleDaily } from '../../../../../../src/diagrams/gantt/timescale/TimeScaleDaily.js';
import { record, type RecordedEvent } from '../../../../../helpers/recording-ugraphic.js';
import { skinGanttStyle } from '../../../helpers/gantt-style.js';

/** Monday 2020-07-06 .. Sunday 2020-07-26: three whole ISO weeks. */
export const MIN_DAY = LocalDate.of(2020, 7, 6);
export const MAX_DAY = LocalDate.of(2020, 7, 26);

/** The skin's `timeline day/month/year` font sizes (plantuml.skin ganttDiagram timeline block). */
export const FONT_SIZE_DAY = 10;
export const FONT_SIZE_MONTH = 12;
export const FONT_SIZE_YEAR = 14;

export const measurer = new DeterministicMeasurer();

export interface HeaderData {
  readonly weekConfig: WeekConfigData;
  readonly dayCalendar: DayCalendarData;
  readonly timeBounds: TimeBoundsData;
  readonly scaleConfig: TimeScaleConfigData;
  readonly timelineStyle: TimelineStyleData;
}

/** The real `TimeBoundsData` (java:gantt/data/TimeBoundsData.java) over `[min, max]`. */
export function boundsOf(min: LocalDate, max: LocalDate, printStart?: LocalDate): TimeBoundsData {
  const bounds = new TimeBoundsData();
  bounds.setMinDay(min);
  bounds.setMaxDay(max);
  bounds.setPrintStart(printStart);
  return bounds;
}

/** The data objects a header is built from, for `printScale` over `[min, max]`. */
export function headerData(
  printScale: PrintScale = PrintScale.DAILY,
  min: LocalDate = MIN_DAY,
  max: LocalDate = MAX_DAY,
): HeaderData {
  const scaleConfig = new TimeScaleConfigData();
  scaleConfig.setPrintScale(printScale);
  const skinParam = { getPragma: () => Pragma.createEmpty() } as unknown as ISkinParam;
  return {
    weekConfig: new WeekConfigData(),
    dayCalendar: new DayCalendarData(),
    timeBounds: boundsOf(min, max),
    scaleConfig,
    timelineStyle: new TimelineStyleData(skinParam, skinGanttStyle(), HColorSet.instance()),
  };
}

/** The `TimeScaleDaily` the factory builds for the data (TimeHeaderFactory.java:123-131). */
export function dailyScale(data: HeaderData): TimeScaleDaily {
  return new TimeScaleDaily(
    data.timelineStyle.getCellWidth(),
    TimePoint.ofStartOfDay(data.timeBounds.getMinDay()),
    data.scaleConfig.getEffectiveScale(),
    undefined,
  );
}

/** The `TimeScaleCompressed` the factory builds for the data (TimeHeaderFactory.java:133-135). */
export function compressedScale(data: HeaderData): TimeScaleCompressed {
  return new TimeScaleCompressed(
    data.timelineStyle.getCellWidth(),
    TimePoint.ofStartOfDay(data.timeBounds.getMinDay()),
    data.scaleConfig.getEffectiveScale(),
    undefined,
  );
}

/** Run `draw` on a fresh recorder. */
export function recorded(draw: Parameters<typeof record>[1]): RecordedEvent[] {
  return record(measurer, draw);
}

/** Only the line draws: `[dx, dy]` of each `ULine`, with the chain's translate sum. */
export function lineDraws(log: readonly RecordedEvent[]): string[] {
  return log.flatMap((e) => ('draw' in e && e.draw.startsWith('ULine') ? [`${e.draw} ${e.chain.join(' ')}`] : []));
}

/** Only the text draws: the text with the chain. */
export function textDraws(log: readonly RecordedEvent[]): string[] {
  return log.flatMap((e) => ('draw' in e && e.draw.startsWith('UText') ? [`${e.draw} ${e.chain.join(' ')}`] : []));
}

/** A recorded draw reduced to its shape and its absolute position (the sum of the chain's translates). */
export interface Placed {
  readonly shape: string;
  readonly x: number;
  readonly y: number;
  /** The non-translate part of the chain, in order (`fore(..)`, `back(..)`, `stroke(..)`). */
  readonly paint: readonly string[];
}

const TRANSLATE = /^translate\(([^,]+),([^)]+)\)$/;

/** Every draw of the log with its absolute position. */
export function placed(log: readonly RecordedEvent[]): Placed[] {
  return log.flatMap((e) => {
    if (!('draw' in e)) return [];
    let x = 0;
    let y = 0;
    const paint: string[] = [];
    for (const token of e.chain) {
      const m = TRANSLATE.exec(token);
      if (m === null) paint.push(token);
      else {
        x += Number(m[1]);
        y += Number(m[2]);
      }
    }
    return [{ shape: e.draw, x, y, paint }];
  });
}

/** `placed` restricted to the shapes whose label starts with `prefix`. */
export function placedOf(log: readonly RecordedEvent[], prefix: string): Placed[] {
  return placed(log).filter((p) => p.shape.startsWith(prefix));
}

/** `'UText(abc)'` -> `'abc'`. */
export function textOf(p: Placed): string {
  return p.shape.slice('UText('.length, -1);
}

/** The ascent offset `DeterministicMeasurer` gives a 10pt / 12pt / 14pt text row (UText baseline). */
export const BASELINE_DAY = 7.777777777777778;
export const BASELINE_MONTH = 9.333333333333334;
export const BASELINE_YEAR = 10.88888888888889;

/** A 10-week range 2020-01-27 (Monday) .. 2020-04-05 (Sunday) spanning four months and two quarters. */
export const LONG_MIN = LocalDate.of(2020, 1, 27);
export const LONG_MAX = LocalDate.of(2020, 4, 5);

/** Element-wise `toBeCloseTo` (9 digits): positions that come out of `TimeScaleCompressed` division. */
export function expectClose(actual: readonly number[], expected: readonly number[]): void {
  expect(actual).toHaveLength(expected.length);
  actual.forEach((value, i) => {
    expect(value).toBeCloseTo(expected[i] as number, 9);
  });
}
