import type { UGraphic } from '../../../../core/klimt/UGraphic.js';
import { UTranslate } from '../../../../core/klimt/UTranslate.js';
import type { Locale } from '../../../../core/utils/I18nTimeData.js';
import type { DayCalendarData } from '../../data/DayCalendarData.js';
import type { TimeBoundsData } from '../../data/TimeBoundsData.js';
import type { TimeScaleConfigData } from '../../data/TimeScaleConfigData.js';
import type { TimelineStyleData } from '../../data/TimelineStyleData.js';
import type { WeekConfigData } from '../../data/WeekConfigData.js';
import { PiecewiseConstantUtils } from '../../ngm/math/PiecewiseConstantUtils.js';
import { TimePoint } from '../../time/TimePoint.js';
import type { TimeScale } from '../../timescale/TimeScale.js';
import { TimeHeader } from './TimeHeader.js';

/**
 * TimeHeaderCalendar -- the base of the calendar-driven headers (daily .. yearly, variant).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderCalendar.java:55-99
 */
export abstract class TimeHeaderCalendar extends TimeHeader {
  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderCalendar.java:57 */
  public constructor(
    weekConfigData: WeekConfigData,
    dayCalendar: DayCalendarData,
    timeBounds: TimeBoundsData,
    scaleConfig: TimeScaleConfigData,
    timelineStyle: TimelineStyleData,
    timeScale: TimeScale,
  ) {
    super(timeScale, weekConfigData, dayCalendar, timeBounds, scaleConfig, timelineStyle);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderCalendar.java:63 */
  protected override locale(): Locale {
    return this.weekConfigData.getLocale();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderCalendar.java:68 */
  protected isZeroOnDay(instant: TimePoint): boolean {
    return PiecewiseConstantUtils.isZeroOnDay(this.dayCalendar.getOpenClose().asPiecewiseConstant(), instant.toDay());
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderCalendar.java:73 */
  public drawTimeHeader(ug: UGraphic, totalHeightWithoutFooter: number): void {
    this.drawColorsBackground(ug, totalHeightWithoutFooter);
    this.drawTimeHeaderInternal(ug, totalHeightWithoutFooter);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderCalendar.java:78 */
  public abstract drawTimeHeaderInternal(ug: UGraphic, totalHeightWithoutFooter: number): void;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderCalendar.java:80 */
  protected printNamedDays(ug: UGraphic): void {
    if (this.dayCalendar.getNameDays().size > 0) {
      let last: string | undefined;
      const fc = this.getFontConfigurationSLOW('month', false, this.openFontColor());
      for (let day = this.getMinDay(); day.compareTo(this.getMaxDay()) <= 0; day = day.plusDays(1)) {
        const wink = TimePoint.ofStartOfDay(day);
        const name = this.dayCalendar.getDayName(wink);
        if (name !== undefined && name !== last) {
          const x1 = this.getTimeScale().getPosition(wink);
          const label = this.getTextBlockSLOW(name, fc);

          const position = this.getTimeHeaderHeight(ug.getStringBounder());
          label.drawU(ug.apply(new UTranslate(x1, position)));
        }
        last = name;
      }
    }
  }
}
