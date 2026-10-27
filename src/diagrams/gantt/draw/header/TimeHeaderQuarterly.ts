import type { UGraphic } from '../../../../core/klimt/UGraphic.js';
import { UTranslate } from '../../../../core/klimt/UTranslate.js';
import type { FontConfiguration } from '../../../../core/abel/FontConfiguration.js';
import type { StringBounder } from '../../../../core/klimt/font/StringBounder.js';
import type { DayCalendarData } from '../../data/DayCalendarData.js';
import type { TimeBoundsData } from '../../data/TimeBoundsData.js';
import type { TimeScaleConfigData } from '../../data/TimeScaleConfigData.js';
import type { TimelineStyleData } from '../../data/TimelineStyleData.js';
import type { WeekConfigData } from '../../data/WeekConfigData.js';
import { TimePoint } from '../../time/TimePoint.js';
import { TimePointFormat } from '../../time/TimePointFormat.js';
import type { TimeScale } from '../../timescale/TimeScale.js';
import { applyForeColor } from './TimeHeader.js';
import { TimeHeaderCalendar } from './TimeHeaderCalendar.js';

/**
 * TimeHeaderQuarterly -- the `printscale quarterly` header: year row, then the quarters.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderQuarterly.java:54-171
 */
export class TimeHeaderQuarterly extends TimeHeaderCalendar {
  public constructor(
    timeScale: TimeScale,
    weekConfigData: WeekConfigData,
    dayCalendar: DayCalendarData,
    timeBounds: TimeBoundsData,
    scaleConfig: TimeScaleConfigData,
    timelineStyle: TimelineStyleData,
  ) {
    super(weekConfigData, dayCalendar, timeBounds, scaleConfig, timelineStyle, timeScale);
  }

  /** @see TimeHeaderQuarterly.java:62 */
  public getTimeHeaderHeight(_stringBounder: StringBounder): number {
    const h1 = this.timelineStyle.getFontSizeYear();
    const h2 = this.timelineStyle.getFontSizeMonth();
    return h1 + h2 + 5;
  }

  /** @see TimeHeaderQuarterly.java:69 */
  public getTimeFooterHeight(_stringBounder: StringBounder): number {
    const h1 = this.timelineStyle.getFontSizeYear();
    const h2 = this.timelineStyle.getFontSizeMonth();
    return h1 + h2 + 5;
  }

  /** @see TimeHeaderQuarterly.java:76 */
  public getFullHeaderHeight(stringBounder: StringBounder): number {
    return this.getTimeHeaderHeight(stringBounder);
  }

  /** @see TimeHeaderQuarterly.java:81 */
  public drawTimeHeaderInternal(ug: UGraphic, totalHeightWithoutFooter: number): void {
    this.#drawYears(ug);
    const h1 = this.timelineStyle.getFontSizeYear();
    const h2 = this.timelineStyle.getFontSizeMonth();
    this.#drawQuarters(ug.apply(UTranslate.dy(h1 + 2)));
    this.printVerticalSeparators(ug, totalHeightWithoutFooter);
    this.drawHline(ug, 0);
    this.drawHline(ug, h1 + 2);
    this.drawHline(ug, h1 + 2 + h2 + 2);
    // drawHline(ug, getFullHeaderHeight(ug.getStringBounder()));
  }

  /** @see TimeHeaderQuarterly.java:94 */
  public drawTimeFooter(ug: UGraphic): void {
    const h1 = this.timelineStyle.getFontSizeYear();
    const h2 = this.timelineStyle.getFontSizeMonth();
    // ug = ug.apply(UTranslate.dy(3));
    this.#drawQuarters(ug);
    this.#drawYears(ug.apply(UTranslate.dy(h2 + 2)));
    this.drawHline(ug, 0);
    this.drawHline(ug, h2 + 2);
    this.drawHline(ug, h1 + 2 + h2 + 2);
    //		drawHline(ug, getTimeFooterHeight(ug.getStringBounder()));
  }

  /** @see TimeHeaderQuarterly.java:106 */
  #drawYears(ug: UGraphic): void {
    const fcMonth = this.getFontConfigurationSLOW('month', true, this.openFontColor());

    const h1 = this.timelineStyle.getFontSizeYear();
    let last: TimePoint | undefined;
    let lastChange = -1;
    for (let day = this.getMinDay(); day.compareTo(this.getMaxDay()) < 0; day = day.plusDays(1)) {
      const wink = TimePoint.ofStartOfDay(day);
      const x1 = this.getTimeScale().getPosition(wink);
      if (last === undefined || wink.monthYear().getYear() !== last.monthYear().getYear()) {
        this.drawVline(applyForeColor(ug, this.getLineColor()), x1, 0, h1 + 2);
        if (last !== undefined) this.#printYear(ug, last, lastChange, x1, fcMonth);

        lastChange = x1;
        last = wink;
      }
    }
    const x1 = this.getTimeScale().getPosition(TimePoint.ofStartOfDay(this.getMaxDay().plusDays(1)));
    if (x1 > lastChange) this.#printYear(ug, last as TimePoint, lastChange, x1, fcMonth);

    const end = x1;
    this.drawVline(applyForeColor(ug, this.getLineColor()), end, 0, h1 + 2);
  }

  /** @see TimeHeaderQuarterly.java:132 */
  #drawQuarters(ug: UGraphic): void {
    const h2 = this.timelineStyle.getFontSizeMonth();

    const fcDay = this.getFontConfigurationSLOW('day', false, this.openFontColor());

    let last: TimePoint | undefined;
    let lastChange = -1;
    for (let day = this.getMinDay(); day.compareTo(this.getMaxDay()) < 0; day = day.plusDays(1)) {
      const wink = TimePoint.ofStartOfDay(day);
      const x1 = this.getTimeScale().getPosition(wink);
      if (last === undefined || wink.quarter() !== last.quarter()) {
        this.drawVline(applyForeColor(ug, this.getLineColor()), x1, 0, h2 + 2);
        if (last !== undefined) this.#printQuarter(ug, last, lastChange, x1, fcDay);

        lastChange = x1;
        last = wink;
      }
    }
    const x1 = this.getTimeScale().getPosition(TimePoint.ofStartOfDay(this.getMaxDay().plusDays(1)));
    if (x1 > lastChange) this.#printQuarter(ug, last as TimePoint, lastChange, x1, fcDay);

    const end = x1;
    this.drawVline(applyForeColor(ug, this.getLineColor()), end, 0, h2 + 2);
  }

  /** @see TimeHeaderQuarterly.java:159 */
  #printYear(ug: UGraphic, monthYear: TimePoint, start: number, end: number, fc: FontConfiguration): void {
    this.printCentered(ug, false, start, end, monthYear, fc, TimePointFormat.YEAR);
  }

  /** @see TimeHeaderQuarterly.java:163 */
  #printQuarter(ug: UGraphic, quarter: TimePoint, start: number, end: number, fc: FontConfiguration): void {
    this.printCentered(ug, false, start, end, quarter, fc, TimePointFormat.QUARTER);
  }
}
