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
 * TimeHeaderMonthly -- the `printscale monthly` header: year row, then the months.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderMonthly.java:54-186
 */
export class TimeHeaderMonthly extends TimeHeaderCalendar {
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

  /** @see TimeHeaderMonthly.java:61 */
  #getH1(): number {
    const h = this.timelineStyle.getFontSizeYear() + 2;
    return h;
  }

  /** @see TimeHeaderMonthly.java:66 */
  #getH2(): number {
    const h = this.timelineStyle.getFontSizeMonth() + 2;
    return this.#getH1() + h;
  }

  /** @see TimeHeaderMonthly.java:72 */
  public getTimeHeaderHeight(_stringBounder: StringBounder): number {
    return this.#getH2();
  }

  /** @see TimeHeaderMonthly.java:77 */
  public getTimeFooterHeight(_stringBounder: StringBounder): number {
    const h1 = this.timelineStyle.getFontSizeYear();
    const h2 = this.timelineStyle.getFontSizeMonth();
    return h1 + h2 + 5;
  }

  /** @see TimeHeaderMonthly.java:84 */
  public getFullHeaderHeight(stringBounder: StringBounder): number {
    return this.getTimeHeaderHeight(stringBounder) + this.#getHeaderNameDayHeight();
  }

  /** @see TimeHeaderMonthly.java:89 */
  public drawTimeHeaderInternal(ug: UGraphic, totalHeightWithoutFooter: number): void {
    this.#drawYears(ug);
    const h1 = this.#getH1();
    const h2 = this.#getH2();
    this.#drawMonths(ug.apply(UTranslate.dy(h1)));
    this.printVerticalSeparators(ug, totalHeightWithoutFooter);

    this.printNamedDays(ug);

    this.drawHline(ug, 0);
    this.drawHline(ug, h1);
    this.drawHline(ug, h2);
  }

  /** @see TimeHeaderMonthly.java:104 */
  public drawTimeFooter(ug: UGraphic): void {
    const h1 = this.timelineStyle.getFontSizeYear();
    const h2 = this.timelineStyle.getFontSizeMonth();
    // ug = ug.apply(UTranslate.dy(3));
    this.#drawMonths(ug);
    this.#drawYears(ug.apply(UTranslate.dy(h2 + 2)));
    this.drawHline(ug, 0);
    this.drawHline(ug, h2 + 2);
    this.drawHline(ug, h1 + 2 + h2 + 2);
    //		drawHline(ug, getTimeFooterHeight(ug.getStringBounder()));
  }

  /** @see TimeHeaderMonthly.java:116 */
  #drawYears(ug: UGraphic): void {
    const fc = this.getFontConfigurationSLOW('month', true, this.openFontColor());

    const h1 = this.timelineStyle.getFontSizeYear();
    let last: TimePoint | undefined;
    let lastChange = -1;
    for (let day = this.getMinDay(); day.compareTo(this.getMaxDay()) < 0; day = day.plusDays(1)) {
      const wink = TimePoint.ofStartOfDay(day);
      const x1 = this.getTimeScale().getPosition(wink);
      if (last === undefined || wink.monthYear().getYear() !== last.monthYear().getYear()) {
        this.drawVline(applyForeColor(ug, this.getLineColor()), x1, 0, h1 + 2);
        if (last !== undefined) this.#printYear(ug, last, lastChange, x1, fc);

        lastChange = x1;
        last = wink;
      }
    }
    const x1 = this.getTimeScale().getPosition(TimePoint.ofStartOfDay(this.getMaxDay().plusDays(1)));
    if (x1 > lastChange) this.#printYear(ug, last as TimePoint, lastChange, x1, fc);

    const end = x1;
    this.drawVline(applyForeColor(ug, this.getLineColor()), end, 0, h1 + 2);
  }

  /** @see TimeHeaderMonthly.java:143 */
  #drawMonths(ug: UGraphic): void {
    const fc = this.getFontConfigurationSLOW('day', false, this.openFontColor());

    const h2 = this.timelineStyle.getFontSizeMonth();
    let last: TimePoint | undefined;
    let lastChange = -1;
    for (let day = this.getMinDay(); day.compareTo(this.getMaxDay()) < 0; day = day.plusDays(1)) {
      const wink = TimePoint.ofStartOfDay(day);
      const x1 = this.getTimeScale().getPosition(wink);
      if (last === undefined || wink.monthYear().equals(last.monthYear()) === false) {
        this.drawVline(applyForeColor(ug, this.getLineColor()), x1, 0, h2 + 2);
        if (last !== undefined) this.#printMonth(ug, last, lastChange, x1, fc);

        lastChange = x1;
        last = wink;
      }
    }
    const x1 = this.getTimeScale().getPosition(TimePoint.ofStartOfDay(this.getMaxDay().plusDays(1)));
    if (x1 > lastChange) this.#printMonth(ug, last as TimePoint, lastChange, x1, fc);

    const end = x1;
    this.drawVline(applyForeColor(ug, this.getLineColor()), end, 0, h2 + 2);
  }

  /** @see TimeHeaderMonthly.java:169 */
  #printYear(ug: UGraphic, monthYear: TimePoint, start: number, end: number, fc: FontConfiguration): void {
    this.printCentered(ug, false, start, end, monthYear, fc, TimePointFormat.YEAR);
  }

  /** @see TimeHeaderMonthly.java:173 */
  #printMonth(ug: UGraphic, monthYear: TimePoint, start: number, end: number, fc: FontConfiguration): void {
    this.printCentered(ug, false, start, end, monthYear, fc, TimePointFormat.MONTH_SHORT, TimePointFormat.MONTH_LONG);
  }

  /** @see TimeHeaderMonthly.java:177 */
  #getHeaderNameDayHeight(): number {
    if (this.dayCalendar.getNameDays().size > 0) {
      const h = this.timelineStyle.getFontSizeDay() + 6;
      return h;
    }

    return 0;
  }
}
