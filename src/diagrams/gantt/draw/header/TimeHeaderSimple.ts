import type { UGraphic } from '../../../../core/klimt/UGraphic.js';
import { UTranslate } from '../../../../core/klimt/UTranslate.js';
import type { StringBounder } from '../../../../core/klimt/font/StringBounder.js';
import { Display } from '../../../../core/klimt/creole/Display.js';
import { ULine } from '../../../../core/klimt/shape/ULine.js';
import type { LocalDate } from '../../../../core/time/LocalDate.js';
import type { HColor } from '../../../../core/style/Value.js';
import type { DayCalendarData } from '../../data/DayCalendarData.js';
import type { TimeBoundsData } from '../../data/TimeBoundsData.js';
import type { TimeScaleConfigData } from '../../data/TimeScaleConfigData.js';
import type { TimelineStyleData } from '../../data/TimelineStyleData.js';
import type { WeekConfigData } from '../../data/WeekConfigData.js';
import { PrintScale } from '../../core/PrintScale.js';
import { TimePoint } from '../../time/TimePoint.js';
import type { TimeScale } from '../../timescale/TimeScale.js';
import { TimeHeader, applyForeColor, createLeftTextBlock, hColorEquals, type Pending } from './TimeHeader.js';

/**
 * TimeHeaderSimple -- the header of a diagram without calendar dates: a running day/week counter.
 *
 * `increment` and `initDelta` keep their Java overloads (`TimePoint` / `LocalDate`, and the
 * `(LocalDate, PrintScale)` form).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderSimple.java:61-239
 */
export class TimeHeaderSimple extends TimeHeader {
  #delta = 0;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderSimple.java:63 */
  public constructor(
    timeScale: TimeScale,
    weekConfigData: WeekConfigData,
    dayCalendar: DayCalendarData,
    timeBounds: TimeBoundsData,
    scaleConfig: TimeScaleConfigData,
    timelineStyle: TimelineStyleData,
  ) {
    super(timeScale, weekConfigData, dayCalendar, timeBounds, scaleConfig, timelineStyle);
  }

  /** @see TimeHeaderSimple.java:69 */
  public getFullHeaderHeight(stringBounder: StringBounder): number {
    return this.getTimeHeaderHeight(stringBounder) + this.#getHeaderNameDayHeight();
  }

  /** @see TimeHeaderSimple.java:74 */
  public getTimeHeaderHeight(_stringBounder: StringBounder): number {
    const h = this.timelineStyle.getFontSizeDay();
    return h + 6;
  }

  /** @see TimeHeaderSimple.java:80 */
  public getTimeFooterHeight(_stringBounder: StringBounder): number {
    const h = this.timelineStyle.getFontSizeDay();
    return h + 6;
  }

  /** @see TimeHeaderSimple.java:85 */
  #getHeaderNameDayHeight(): number {
    return 0;
  }

  /** `increment(TimePoint)` (java:91-99), `increment(LocalDate)` (java:101-109), `increment(LocalDate, PrintScale)` (java:111-115). */
  #increment(day: TimePoint): TimePoint;
  #increment(day: LocalDate): LocalDate;
  #increment(day: LocalDate, printScale: PrintScale): LocalDate;
  #increment(day: TimePoint | LocalDate, printScale?: PrintScale): TimePoint | LocalDate {
    if (printScale !== undefined) {
      if (printScale === PrintScale.WEEKLY) return (day as LocalDate).plusDays(7);
      return (day as LocalDate).plusDays(1);
    }

    if (this.#delta === 0) this.#initDelta(day);

    if (day instanceof TimePoint) {
      for (let i = 0; i < this.#delta; i++) day = day.increment(this.scaleConfig.getPrintScale());
      return day;
    }
    for (let i = 0; i < this.#delta; i++) day = this.#increment(day, this.scaleConfig.getPrintScale());
    return day;
  }

  /** `initDelta(LocalDate)` (java:117-128) and `initDelta(TimePoint)` (java:130-141). */
  #initDelta(day: TimePoint | LocalDate): void {
    if (this.scaleConfig.getPrintScale() === PrintScale.DAILY) {
      if (day instanceof TimePoint) {
        const x1 = this.getTimeScale().getPosition(day);
        do {
          this.#delta++;
          day = day.increment();
        } while (this.getTimeScale().getPosition(day) < x1 + 16);
      } else {
        const x1 = this.getTimeScale().getPosition(TimePoint.ofStartOfDay(day));
        do {
          this.#delta++;
          day = day.plusDays(1);
        } while (this.getTimeScale().getPosition(TimePoint.ofStartOfDay(day)) < x1 + 16);
      }
    } else {
      this.#delta = 1;
    }
  }

  /** @see TimeHeaderSimple.java:143 */
  #drawSmallVlinesDay(ug: UGraphic, totalHeightWithoutFooter: number): void {
    ug = applyForeColor(ug, this.getLineColor());
    ug = ug.apply(UTranslate.dy(6));
    const vbar = ULine.vline(totalHeightWithoutFooter + 2);
    for (let day = this.getMinDay(); day.compareTo(this.getMaxDay().plusDays(1)) <= 0; day = this.#increment(day)) {
      const wink = TimePoint.ofStartOfDay(day);
      const x1 = this.getTimeScale().getPosition(wink);
      ug.apply(UTranslate.dx(x1)).draw(vbar);
    }
  }

  /** @see TimeHeaderSimple.java:154 */
  #drawSimpleDayCounter(ug: UGraphic): void {
    const font = this.timelineStyle.getFont('day');
    const fontConfiguration = this.getFontConfiguration(font, false, this.openFontColor());

    for (let day = this.getMinDay(); day.compareTo(this.getMaxDay().plusDays(1)) <= 0; day = this.#increment(day)) {
      const wink = TimePoint.ofStartOfDay(day);
      let value: number;
      // `getAbsoluteDayNum() / 7` is Java int division.
      if (this.scaleConfig.getPrintScale() === PrintScale.WEEKLY) value = Math.trunc(wink.getAbsoluteDayNum() / 7) + 1;
      else value = wink.getAbsoluteDayNum() + 1;
      const num = createLeftTextBlock(Display.getWithNewlines(this.getPragma(), '' + String(value)), fontConfiguration);
      const x1 = this.getTimeScale().getPosition(wink);
      let x2: number;
      if (this.scaleConfig.getPrintScale() === PrintScale.WEEKLY)
        x2 = this.getTimeScale().getPosition(wink.addDays(6)) + this.getTimeScale().getWidth(wink.addDays(6));
      else x2 = this.getTimeScale().getPosition(this.#increment(wink));
      const width = num.calculateDimension(ug.getStringBounder()).getWidth();
      const delta = x2 - x1 - width;

      if (wink.compareTo(TimePoint.ofStartOfDay(this.getMaxDay().plusDays(1))) < 0)
        num.drawU(ug.apply(UTranslate.dx(x1 + delta / 2)));
    }
  }

  /** @see TimeHeaderSimple.java:184 */
  protected isZeroOnDay(_instant: TimePoint): boolean {
    return false;
  }

  /** @see TimeHeaderSimple.java:189 */
  public drawTimeHeader(ug: UGraphic, totalHeightWithoutFooter: number): void {
    this.drawColorsBackground(ug, totalHeightWithoutFooter);
    this.#drawSmallVlinesDay(ug, totalHeightWithoutFooter);
    this.printVerticalSeparators(ug, totalHeightWithoutFooter);
    this.#drawSimpleDayCounter(ug);
  }

  /** @see TimeHeaderSimple.java:198 */
  public drawTimeFooter(ug: UGraphic): void {
    ug = ug.apply(UTranslate.dy(3));
    this.#drawSimpleDayCounter(ug);
  }

  /** @see TimeHeaderSimple.java:203 */
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
}
