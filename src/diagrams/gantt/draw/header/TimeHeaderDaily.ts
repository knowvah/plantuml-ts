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
 * TimeHeaderDaily -- the `printscale daily` header: month, day of week, day of month.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderDaily.java:54-220
 */
export class TimeHeaderDaily extends TimeHeaderCalendar {
  #fc1: FontConfiguration | undefined;
  #fc2: FontConfiguration | undefined;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderDaily.java:56 */
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

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderDaily.java:61 */
  #getH1(): number {
    return this.timelineStyle.getFontSizeMonth() + 2;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderDaily.java:65 */
  #getH2(): number {
    return this.#getH1() + this.timelineStyle.getFontSizeDay() + 2;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderDaily.java:69 */
  #getH3(): number {
    return this.#getH2() + this.timelineStyle.getFontSizeDay() + 3;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderDaily.java:74 */
  public getTimeHeaderHeight(_stringBounder: StringBounder): number {
    return this.#getH3();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderDaily.java:79 */
  public getTimeFooterHeight(_stringBounder: StringBounder): number {
    const h1 = this.timelineStyle.getFontSizeDay();
    const h2 = this.timelineStyle.getFontSizeDay();
    const h3 = this.timelineStyle.getFontSizeMonth();
    return h1 + h2 + h3 + 8;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderDaily.java:86 */
  #getHeaderNameDayHeight(): number {
    if (this.dayCalendar.getNameDays().size > 0) {
      const h = this.timelineStyle.getFontSizeDay() + 6;
      return h;
    }

    return 0;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderDaily.java:96 */
  public getFullHeaderHeight(stringBounder: StringBounder): number {
    return this.getTimeHeaderHeight(stringBounder) + this.#getHeaderNameDayHeight();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderDaily.java:101 */
  public drawTimeHeaderInternal(ug: UGraphic, totalHeightWithoutFooter: number): void {
    this.#drawMonths(ug);
    this.#drawTextsDayOfWeek(ug.apply(UTranslate.dy(this.#getH1())));
    this.#drawTextDayOfMonth(ug.apply(UTranslate.dy(this.#getH2())));
    this.printVerticalSeparators(ug, totalHeightWithoutFooter);

    this.printNamedDays(ug);

    this.drawHline(ug, this.getFullHeaderHeight(ug.getStringBounder()));
    this.drawHline(ug, totalHeightWithoutFooter);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderDaily.java:114 */
  protected override printVerticalSeparators(ug: UGraphic, totalHeightWithoutFooter: number): void {
    const ugVerticalSeparator = this.timelineStyle.applyVerticalSeparatorStyle(ug);
    const ugLineColor = applyForeColor(ug, this.getLineColor());
    for (let day = this.getMinDay(); day.compareTo(this.getMaxDay()) <= 0; day = day.plusDays(1)) {
      const wink = TimePoint.ofStartOfDay(day);
      if (this.isBold(day) || this.getTimeScale().getWidth(wink.decrement()) === 0)
        this.drawVline(
          ugVerticalSeparator,
          this.getTimeScale().getPosition(wink),
          this.getFullHeaderHeight(ug.getStringBounder()),
          totalHeightWithoutFooter,
        );
      else
        this.drawVline(
          ugLineColor,
          this.getTimeScale().getPosition(wink),
          this.getFullHeaderHeight(ug.getStringBounder()),
          totalHeightWithoutFooter,
        );
    }

    const end = this.getTimeScale().getPosition(TimePoint.ofStartOfDay(this.getMaxDay().plusDays(1)));

    this.drawVline(ugLineColor, end, this.getFullHeaderHeight(ug.getStringBounder()), totalHeightWithoutFooter);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderDaily.java:133 */
  public drawTimeFooter(ug: UGraphic): void {
    const h = this.timelineStyle.getFontSizeDay() + 2;
    this.#drawTextsDayOfWeek(ug);
    this.#drawTextDayOfMonth(ug.apply(UTranslate.dy(h + 2)));
    this.#drawMonths(ug.apply(UTranslate.dy(2 * h + 3)));
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderDaily.java:140 */
  #drawTextsDayOfWeek(ug: UGraphic): void {
    for (let day = this.getMinDay(); day.compareTo(this.getMaxDay()) <= 0; day = day.plusDays(1)) {
      const wink = TimePoint.ofStartOfDay(day);

      if (this.#isHidden(wink)) continue;
      const x1 = this.getTimeScale().getPosition(wink);
      const x2 = this.getTimeScale().getPosition(wink.increment());
      const fc = this.#getFc(wink);

      this.printCentered(ug, false, x1, x2, wink, fc, TimePointFormat.DAY_OF_WEEK_SHORT);
    }
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderDaily.java:155 */
  #drawTextDayOfMonth(ug: UGraphic): void {
    for (let day = this.getMinDay(); day.compareTo(this.getMaxDay()) <= 0; day = day.plusDays(1)) {
      const wink = TimePoint.ofStartOfDay(day);

      if (this.#isHidden(wink)) continue;
      const x1 = this.getTimeScale().getPosition(wink);
      const x2 = this.getTimeScale().getPosition(wink.increment());
      const fc = this.#getFc(wink);

      this.printCentered(ug, false, x1, x2, wink, fc, TimePointFormat.DAY_OF_MONTH);
    }
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderDaily.java:169 */
  #isHidden(wink: TimePoint): boolean {
    if (this.scaleConfig.isHideClosed() && this.dayCalendar.getOpenClose().isClosed(wink.toDay())) return true;
    return false;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderDaily.java:178 */
  #getFc(wink: TimePoint): FontConfiguration {
    if (this.isZeroOnDay(wink)) {
      this.#fc1 ??= this.getFontConfigurationSLOW('day', false, this.closedFontColor());
      return this.#fc1;
    }

    this.#fc2 ??= this.getFontConfigurationSLOW('day', false, this.openFontColor());
    return this.#fc2;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderDaily.java:190 */
  #drawMonths(ug: UGraphic): void {
    const fc = this.getFontConfigurationSLOW('month', true, this.openFontColor());

    let last: TimePoint | undefined;
    let lastChangeMonth = -1;
    for (let day = this.getMinDay(); day.compareTo(this.getMaxDay()) <= 0; day = day.plusDays(1)) {
      const wink = TimePoint.ofStartOfDay(day);
      if (this.#isHidden(wink)) continue;
      const x1 = this.getTimeScale().getPosition(wink);
      if (last === undefined || wink.monthYear().equals(last.monthYear()) === false) {
        if (last !== undefined) this.#printMonth(ug, last, lastChangeMonth, x1, fc);

        lastChangeMonth = x1;
        last = wink;
      }
    }
    const x1 = this.getTimeScale().getPosition(TimePoint.ofStartOfDay(this.getMaxDay().plusDays(1)));
    if (x1 > lastChangeMonth) this.#printMonth(ug, last as TimePoint, lastChangeMonth, x1, fc);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderDaily.java:215 */
  #printMonth(ug: UGraphic, monthYear: TimePoint, start: number, end: number, fc: FontConfiguration): void {
    this.printCentered(
      ug,
      false,
      start,
      end,
      monthYear,
      fc,
      TimePointFormat.MONTH_SHORT,
      TimePointFormat.MONTH_LONG,
      TimePointFormat.MONTH_YEAR_LONG,
    );
  }
}
