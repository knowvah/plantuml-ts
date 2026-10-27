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
import { applyForeColor } from './TimeHeader.js';
import { TimeHeaderCalendar } from './TimeHeaderCalendar.js';

import type { TimeScale } from '../../timescale/TimeScale.js';
import { WeeklyHeaderStrategy } from '../WeeklyHeaderStrategy.js';
import type { TextBlock } from '../../../../core/klimt/shape/TextBlock.js';

/**
 * TimeHeaderWeekly -- the `printscale weekly` header: month row, then the week numbers.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderWeekly.java:56-188
 */
export class TimeHeaderWeekly extends TimeHeaderCalendar {
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

  /** @see TimeHeaderWeekly.java:63 */
  #getH1(): number {
    const h = this.timelineStyle.getFontSizeMonth() + 4;
    return h;
  }

  /** @see TimeHeaderWeekly.java:68 */
  #getH2(): number {
    const h = this.timelineStyle.getFontSizeDay() + 1;
    return this.#getH1() + h;
  }

  /** @see TimeHeaderWeekly.java:74 */
  public getTimeHeaderHeight(_stringBounder: StringBounder): number {
    return this.#getH2();
  }

  /** @see TimeHeaderWeekly.java:79 */
  public getTimeFooterHeight(_stringBounder: StringBounder): number {
    const h = this.timelineStyle.getFontSizeMonth() + 4;
    return h;
  }

  /** @see TimeHeaderWeekly.java:84 */
  #getHeaderNameDayHeight(): number {
    if (this.dayCalendar.getNameDays().size > 0) {
      const h = this.timelineStyle.getFontSizeDay() + 6;
      return h;
    }

    return 0;
  }

  /** @see TimeHeaderWeekly.java:94 */
  public getFullHeaderHeight(stringBounder: StringBounder): number {
    return this.getTimeHeaderHeight(stringBounder) + this.#getHeaderNameDayHeight();
  }

  /** @see TimeHeaderWeekly.java:99 */
  public drawTimeHeaderInternal(ug: UGraphic, totalHeightWithoutFooter: number): void {
    this.#printDaysOfMonth(ug);
    this.printVerticalSeparators(ug, totalHeightWithoutFooter);
    this.#printMonths(ug);

    this.printNamedDays(ug);

    this.drawHline(ug, 0);
    this.drawHline(ug, this.#getH1());
    this.drawHline(ug, this.getFullHeaderHeight(ug.getStringBounder()));
  }

  /** @see TimeHeaderWeekly.java:112 */
  public drawTimeFooter(ug: UGraphic): void {
    this.drawHline(ug, 0);
    this.#printMonths(ug);
    this.drawHline(ug, this.getTimeFooterHeight(ug.getStringBounder()));
  }

  /** @see TimeHeaderWeekly.java:118 */
  #printMonths(ug: UGraphic): void {
    const fc = this.getFontConfigurationSLOW('month', true, this.openFontColor());

    let last: TimePoint | undefined;
    let lastChangeMonth = -1;

    for (let day = this.getMinDay(); day.compareTo(this.getMaxDay()) <= 0; day = day.plusDays(1)) {
      const wink = TimePoint.ofStartOfDay(day);
      const x1 = this.getTimeScale().getPosition(wink);
      if (last === undefined || wink.monthYear().equals(last.monthYear()) === false) {
        this.drawVline(applyForeColor(ug, this.getLineColor()), x1, 0, this.#getH1());
        if (last !== undefined) this.#printMonth(ug, last, lastChangeMonth, x1, fc);

        lastChangeMonth = x1;
        last = wink;
      }
    }
    const end = this.getTimeScale().getPosition(TimePoint.ofStartOfDay(this.getMaxDay().plusDays(1)));
    this.drawVline(applyForeColor(ug, this.getLineColor()), end, 0, this.#getH1());
    const x1 = end;
    if (last !== undefined && x1 > lastChangeMonth) this.#printMonth(ug, last, lastChangeMonth, x1, fc);
  }

  /** @see TimeHeaderWeekly.java:145 */
  protected override printVerticalSeparators(ug: UGraphic, totalHeightWithoutFooter: number): void {
    for (let day = this.getMinDay(); day.compareTo(this.getMaxDay()) <= 0; day = day.plusDays(1)) {
      const wink = TimePoint.ofStartOfDay(day);
      if (wink.toDayOfWeek() === this.weekConfigData.getWeekNumberStrategy().getFirstDayOfWeek())
        this.drawVline(
          applyForeColor(ug, this.getLineColor()),
          this.getTimeScale().getPosition(wink),
          this.#getH1(),
          totalHeightWithoutFooter,
        );
    }

    const end = this.getTimeScale().getPosition(TimePoint.ofStartOfDay(this.getMaxDay().plusDays(1)));
    this.drawVline(applyForeColor(ug, this.getLineColor()), end, this.#getH1(), totalHeightWithoutFooter);
    super.printVerticalSeparators(ug, totalHeightWithoutFooter);
  }

  /** @see TimeHeaderWeekly.java:158 */
  #printDaysOfMonth(ug: UGraphic): void {
    const fc = this.getFontConfigurationSLOW('day', false, this.openFontColor());

    let counter = this.weekConfigData.getWeekStartingNumber();
    for (let day = this.getMinDay(); day.compareTo(this.getMaxDay().plusDays(-1)) < 0; day = day.plusDays(1)) {
      const wink = TimePoint.ofStartOfDay(day);
      if (wink.toDayOfWeek() === this.weekConfigData.getWeekNumberStrategy().getFirstDayOfWeek()) {
        let num: string;
        if (this.weekConfigData.getWeeklyHeaderStrategy() === WeeklyHeaderStrategy.FROM_N) num = '' + String(counter++);
        else if (this.weekConfigData.getWeeklyHeaderStrategy() === WeeklyHeaderStrategy.DAY_OF_MONTH)
          num = '' + String(wink.getDayOfMonth());
        else num = '' + String(wink.getWeekOfYear(this.weekConfigData.getWeekNumberStrategy()));
        const textBlock = this.getTextBlockSLOW(num, fc);
        this.#printLeft(ug.apply(UTranslate.dy(this.#getH1())), textBlock, this.getTimeScale().getPosition(wink) + 5);
      }
    }
  }

  /** @see TimeHeaderWeekly.java:179 */
  #printMonth(ug: UGraphic, monthYear: TimePoint, start: number, end: number, fc: FontConfiguration): void {
    this.printCentered(
      ug,
      false,
      start,
      end,
      monthYear,
      fc,
      TimePointFormat.MONTH_SHORT,
      TimePointFormat.MONTH_YEAR_SHORT,
    );
  }

  /** @see TimeHeaderWeekly.java:184 */
  #printLeft(ug: UGraphic, text: TextBlock, start: number): void {
    text.drawU(ug.apply(UTranslate.dx(start)));
  }
}
