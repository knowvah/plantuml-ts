import type { UGraphic } from '../../../../core/klimt/UGraphic.js';
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
 * TimeHeaderYearly -- the `printscale yearly` header: the year row.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderYearly.java:53-124
 */
export class TimeHeaderYearly extends TimeHeaderCalendar {
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

  /** @see TimeHeaderYearly.java:61 */
  public getTimeHeaderHeight(_stringBounder: StringBounder): number {
    const h1 = this.timelineStyle.getFontSizeYear();
    return h1 + 3;
  }

  /** @see TimeHeaderYearly.java:67 */
  public getTimeFooterHeight(_stringBounder: StringBounder): number {
    const h1 = this.timelineStyle.getFontSizeYear();
    return h1 + 3;
  }

  /** @see TimeHeaderYearly.java:73 */
  public getFullHeaderHeight(stringBounder: StringBounder): number {
    return this.getTimeHeaderHeight(stringBounder);
  }

  /** @see TimeHeaderYearly.java:78 */
  public drawTimeHeaderInternal(ug: UGraphic, totalHeightWithoutFooter: number): void {
    this.#drawYears(ug);
    this.printVerticalSeparators(ug, totalHeightWithoutFooter);
    this.drawHline(ug, 0);
    this.drawHline(ug, this.getFullHeaderHeight(ug.getStringBounder()));
  }

  /** @see TimeHeaderYearly.java:86 */
  public drawTimeFooter(ug: UGraphic): void {
    // ug = ug.apply(UTranslate.dy(3));
    this.#drawYears(ug);
    this.drawHline(ug, 0);
    this.drawHline(ug, this.getTimeFooterHeight(ug.getStringBounder()));
  }

  /** @see TimeHeaderYearly.java:93 */
  #drawYears(ug: UGraphic): void {
    const h1 = this.timelineStyle.getFontSizeYear();

    const fc = this.getFontConfigurationSLOW('year', true, this.openFontColor());

    let last: TimePoint | undefined;
    let lastChange = -1;
    for (let day = this.getMinDay(); day.compareTo(this.getMaxDay()) <= 0; day = day.plusDays(1)) {
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

  /** @see TimeHeaderYearly.java:120 */
  #printYear(ug: UGraphic, monthYear: TimePoint, start: number, end: number, fc: FontConfiguration): void {
    this.printCentered(ug, true, start, end, monthYear, fc, TimePointFormat.YEAR);
  }
}
