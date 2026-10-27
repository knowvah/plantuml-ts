import type { UGraphic } from '../../../../core/klimt/UGraphic.js';
import { Back } from '../../../../core/klimt/Back.js';
import { UTranslate } from '../../../../core/klimt/UTranslate.js';
import type { FontConfiguration } from '../../../../core/abel/FontConfiguration.js';
import type { StringBounder } from '../../../../core/klimt/font/StringBounder.js';
import { ULine } from '../../../../core/klimt/shape/ULine.js';
import type { LocalDate } from '../../../../core/time/LocalDate.js';
import type { HColor } from '../../../../core/style/Value.js';
import type { DayCalendarData } from '../../data/DayCalendarData.js';
import type { TimeBoundsData } from '../../data/TimeBoundsData.js';
import type { TimeScaleConfigData } from '../../data/TimeScaleConfigData.js';
import type { TimelineStyleData } from '../../data/TimelineStyleData.js';
import type { WeekConfigData } from '../../data/WeekConfigData.js';
import type { WorkingHours } from '../../data/WorkingHours.js';
import { TimePoint } from '../../time/TimePoint.js';
import { TimePointFormat } from '../../time/TimePointFormat.js';
import type { VariantTimeScale } from '../../timescale/VariantTimeScale.js';
import { TimeHeaderCalendar } from './TimeHeaderCalendar.js';
import { applyForeColor, hColorEquals, paintOf, type Pending } from './TimeHeader.js';

/**
 * TimeHeaderVariant -- the header of a diagram with working-time ranges (hours inside the day).
 *
 * The Java file's commented-out blocks (`increment`/`initDelta`, the `isZeroOnDay` and
 * `drawTimeHeader` overrides) are dead upstream and are not ported.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderVariant.java:58-334
 */
export class TimeHeaderVariant extends TimeHeaderCalendar {
  readonly #workingHours: WorkingHours;
  #fc1: FontConfiguration | undefined;
  #fc2: FontConfiguration | undefined;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderVariant.java:62 */
  public constructor(
    timeScale: VariantTimeScale,
    weekConfigData: WeekConfigData,
    dayCalendar: DayCalendarData,
    timeBounds: TimeBoundsData,
    scaleConfig: TimeScaleConfigData,
    timelineStyle: TimelineStyleData,
    workingHours: WorkingHours,
  ) {
    super(weekConfigData, dayCalendar, timeBounds, scaleConfig, timelineStyle, timeScale);
    this.#workingHours = workingHours;
  }

  /** @see TimeHeaderVariant.java:70 */
  public getFullHeaderHeight(stringBounder: StringBounder): number {
    return this.getTimeHeaderHeight(stringBounder) + this.#getHeaderNameDayHeight();
  }

  /** @see TimeHeaderVariant.java:74 */
  #getH1(): number {
    return this.timelineStyle.getFontSizeMonth() + 2;
  }

  /** @see TimeHeaderVariant.java:78 */
  #getH2(): number {
    return this.#getH1() + this.timelineStyle.getFontSizeDay() + 2;
  }

  /** @see TimeHeaderVariant.java:82 */
  #getH3(): number {
    return this.#getH2() + this.timelineStyle.getFontSizeDay() + 3;
  }

  /** @see TimeHeaderVariant.java:87 */
  public getTimeHeaderHeight(_stringBounder: StringBounder): number {
    return this.#getH3();
  }

  /** @see TimeHeaderVariant.java:92 */
  public getTimeFooterHeight(_stringBounder: StringBounder): number {
    return 0;
  }

  /** @see TimeHeaderVariant.java:98 */
  #getHeaderNameDayHeight(): number {
    return 0;
  }

  /** @see TimeHeaderVariant.java:124 */
  #increment(day: LocalDate): LocalDate {
    return day.plusDays(1);
  }

  /** @see TimeHeaderVariant.java:156 */
  #drawSmallVlinesDay(ug: UGraphic, totalHeightWithoutFooter: number): void {
    ug = applyForeColor(ug, this.getLineColor());
    const vbar = ULine.vline(totalHeightWithoutFooter);
    for (let day = this.getMinDay(); day.compareTo(this.getMaxDay().plusDays(1)) <= 0; day = this.#increment(day)) {
      const wink = TimePoint.ofStartOfDay(day);
      const x1 = this.getTimeScale().getPosition(wink);
      ug.apply(UTranslate.dx(x1)).draw(vbar);
    }
  }

  /** @see TimeHeaderVariant.java:183 */
  public drawTimeFooter(ug: UGraphic): void {
    ug.apply(UTranslate.dy(3));
    // drawSimpleDayCounter(ug);
  }

  /** @see TimeHeaderVariant.java:188 */
  protected drawTextsBackground(ug: UGraphic, totalHeightWithoutFooter: number): void {
    const height = totalHeightWithoutFooter - this.getFullHeaderHeight(ug.getStringBounder());
    let pending: Pending | undefined;

    for (let day = this.getMinDay(); day.compareTo(this.getMaxDay()) <= 0; day = day.plusDays(1)) {
      const wink = TimePoint.ofStartOfDay(day);
      const x1 = this.getTimeScale().getPosition(wink);
      const x2 = this.getTimeScale().getPosition(wink) + this.getTimeScale().getWidth(wink);
      const back: HColor | undefined = this.getColor(wink);
      if (back === undefined) {
        if (pending !== undefined) pending.draw(ug, height);
        pending = undefined;
      } else {
        if (pending !== undefined && hColorEquals(pending.color, back) === false) {
          pending.draw(ug, height);
          pending = undefined;
        }
        if (pending === undefined) pending = this.newPending(back, x1, x2);
        else pending.x2 = x2;
      }
    }
  }

  /** @see TimeHeaderVariant.java:224 */
  #drawTextsDayOfWeek(ug: UGraphic): void {
    for (let day = this.getMinDay(); day.compareTo(this.getMaxDay()) <= 0; day = day.plusDays(1)) {
      const wink = TimePoint.ofStartOfDay(day);

      if (this.#isHidden(wink)) continue;
      const x1 = this.getTimeScale().getPosition(wink);
      const x2 = this.getTimeScale().getPosition(wink.increment());
      const fc = this.#getFc(wink);

      this.printCentered(
        ug,
        false,
        x1,
        x2,
        wink,
        fc,
        TimePointFormat.DAY_OF_WEEK_SHORT,
        TimePointFormat.DAY_OF_WEEK_LONG,
      );
    }
  }

  /** @see TimeHeaderVariant.java:244 */
  #getFc(wink: TimePoint): FontConfiguration {
    if (this.isZeroOnDay(wink)) {
      this.#fc1 ??= this.getFontConfigurationSLOW('day', false, this.closedFontColor());
      return this.#fc1;
    }

    this.#fc2 ??= this.getFontConfigurationSLOW('day', false, this.openFontColor());
    return this.#fc2;
  }

  /** @see TimeHeaderVariant.java:256 */
  #isHidden(wink: TimePoint): boolean {
    if (this.scaleConfig.isHideClosed() && this.dayCalendar.getOpenClose().isClosed(wink.toDay())) return true;
    return false;
  }

  /** @see TimeHeaderVariant.java:263 */
  public drawTimeHeaderInternal(ug: UGraphic, totalHeightWithoutFooter: number): void {
    this.#drawNonWorkingPeriod(ug, totalHeightWithoutFooter);
    this.#drawMonths(ug);
    this.#drawTextsDayOfWeek(ug.apply(UTranslate.dy(this.#getH1())));
    this.#drawTextDayOfMonth(ug.apply(UTranslate.dy(this.#getH2())));
    //		// drawColorsBackground(ug, totalHeightWithoutFooter);
    this.#drawSmallVlinesDay(ug.apply(UTranslate.dy(this.#getH1())), totalHeightWithoutFooter);
    // printVerticalSeparators(ug, totalHeightWithoutFooter);
    //		drawSimpleDayCounter(ug);
  }

  /** @see TimeHeaderVariant.java:275 */
  #drawNonWorkingPeriod(ug: UGraphic, height: number): void {
    // double height = timelineStyle.getFontSizeDay() * 2 + 6;
    const backColor = this.closedBackgroundColor();

    ug = applyForeColor(ug, backColor).apply(new Back(paintOf(backColor)));
    ug = ug.apply(UTranslate.dy(this.#getH3()));
    for (let day = this.getMinDay(); day.compareTo(this.getMaxDay()) <= 0; day = day.plusDays(1)) {
      const wink = TimePoint.ofStartOfDay(day);
      const x1 = this.getTimeScale().getPosition(wink);

      this.#workingHours.drawOneDay(ug.apply(UTranslate.dx(x1)), height);
    }
  }

  /** @see TimeHeaderVariant.java:290 */
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

  /** @see TimeHeaderVariant.java:304 */
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

  /** @see TimeHeaderVariant.java:329 */
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
