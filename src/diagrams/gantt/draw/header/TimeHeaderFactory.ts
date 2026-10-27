import type { DayCalendarData } from '../../data/DayCalendarData.js';
import type { TimeBoundsData } from '../../data/TimeBoundsData.js';
import type { TimeScaleConfigData } from '../../data/TimeScaleConfigData.js';
import type { TimelineStyleData } from '../../data/TimelineStyleData.js';
import type { WeekConfigData } from '../../data/WeekConfigData.js';
import { PrintScale } from '../../core/PrintScale.js';
import { TimePoint } from '../../time/TimePoint.js';
import type { TimeScale } from '../../timescale/TimeScale.js';
import { TimeScaleCompressed } from '../../timescale/TimeScaleCompressed.js';
import { TimeScaleDaily } from '../../timescale/TimeScaleDaily.js';
import { TimeScaleDailyHideClosed } from '../../timescale/TimeScaleDailyHideClosed.js';
import { TimeScaleWink } from '../../timescale/TimeScaleWink.js';
import { VariantTimeScale } from '../../timescale/VariantTimeScale.js';
import type { TimeHeader } from './TimeHeader.js';
import { TimeHeaderDaily } from './TimeHeaderDaily.js';
import { TimeHeaderMonthly } from './TimeHeaderMonthly.js';
import { TimeHeaderQuarterly } from './TimeHeaderQuarterly.js';
import { TimeHeaderSimple } from './TimeHeaderSimple.js';
import { TimeHeaderVariant } from './TimeHeaderVariant.js';
import { TimeHeaderWeekly } from './TimeHeaderWeekly.js';
import { TimeHeaderYearly } from './TimeHeaderYearly.js';

/** `closeFactor` (TimeHeaderFactory.java:54). */
const CLOSE_FACTOR = 0.2;
/** `dayWidth` (TimeHeaderFactory.java:55). */
const DAY_WIDTH = 120;

/**
 * TimeHeaderFactory -- picks the header (and its time scale) for the `printscale` and calendar in force.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderFactory.java:52-151
 */
export class TimeHeaderFactory {
  readonly #timeBounds: TimeBoundsData;
  readonly #dayCalendar: DayCalendarData;
  readonly #timelineStyle: TimelineStyleData;
  readonly #scaleConfig: TimeScaleConfigData;
  readonly #weekConfig: WeekConfigData;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderFactory.java:63 */
  public constructor(
    weekConfig: WeekConfigData,
    dayCalendar: DayCalendarData,
    timeBounds: TimeBoundsData,
    scaleConfig: TimeScaleConfigData,
    timelineStyle: TimelineStyleData,
  ) {
    this.#weekConfig = weekConfig;
    this.#timeBounds = timeBounds;
    this.#dayCalendar = dayCalendar;
    this.#scaleConfig = scaleConfig;
    this.#timelineStyle = timelineStyle;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderFactory.java:76 */
  public createTimeHeader(): TimeHeader {
    if (this.#timeBounds.getMinDay().equals(TimePoint.epoch()))
      return new TimeHeaderSimple(
        this.#createSimpleScale(),
        this.#weekConfig,
        this.#dayCalendar,
        this.#timeBounds,
        this.#scaleConfig,
        this.#timelineStyle,
      );

    if (this.#dayCalendar.hasWorkingTimeRanges()) {
      const workingHours = this.#dayCalendar.buildWorkingHours(DAY_WIDTH, CLOSE_FACTOR);
      return new TimeHeaderVariant(
        new VariantTimeScale(
          this.#timeBounds.getMinDay(),
          this.#timeBounds.getMaxDay(),
          workingHours,
          this.#dayCalendar.getOpenClose(),
        ),
        this.#weekConfig,
        this.#dayCalendar,
        this.#timeBounds,
        this.#scaleConfig,
        this.#timelineStyle,
        workingHours,
      );
    }

    switch (this.#scaleConfig.getPrintScale()) {
      case PrintScale.DAILY:
        return new TimeHeaderDaily(
          this.#createDailyScale(),
          this.#weekConfig,
          this.#dayCalendar,
          this.#timeBounds,
          this.#scaleConfig,
          this.#timelineStyle,
        );

      case PrintScale.WEEKLY:
        return new TimeHeaderWeekly(
          this.#createCompressedScale(),
          this.#weekConfig,
          this.#dayCalendar,
          this.#timeBounds,
          this.#scaleConfig,
          this.#timelineStyle,
        );

      case PrintScale.MONTHLY:
        return new TimeHeaderMonthly(
          this.#createCompressedScale(),
          this.#weekConfig,
          this.#dayCalendar,
          this.#timeBounds,
          this.#scaleConfig,
          this.#timelineStyle,
        );

      case PrintScale.QUARTERLY:
        return new TimeHeaderQuarterly(
          this.#createCompressedScale(),
          this.#weekConfig,
          this.#dayCalendar,
          this.#timeBounds,
          this.#scaleConfig,
          this.#timelineStyle,
        );

      case PrintScale.YEARLY:
        return new TimeHeaderYearly(
          this.#createCompressedScale(),
          this.#weekConfig,
          this.#dayCalendar,
          this.#timeBounds,
          this.#scaleConfig,
          this.#timelineStyle,
        );

      default:
        throw new Error('IllegalStateException: Unsupported print scale: ' + String(this.#scaleConfig.getPrintScale()));
    }
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderFactory.java:119 */
  #createSimpleScale(): TimeScale {
    return new TimeScaleWink(this.#getCellWidth(), this.#getEffectiveScale(), this.#scaleConfig.getPrintScale());
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderFactory.java:123 */
  #createDailyScale(): TimeScale {
    if (this.#scaleConfig.isHideClosed())
      return new TimeScaleDailyHideClosed(
        this.#getCellWidth(),
        this.#getStart(),
        this.#getEffectiveScale(),
        this.#dayCalendar.getOpenClose(),
      );

    return new TimeScaleDaily(
      this.#getCellWidth(),
      this.#getStart(),
      this.#getEffectiveScale(),
      this.#timeBounds.getPrintStart(),
    );
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderFactory.java:131 */
  #createCompressedScale(): TimeScale {
    return new TimeScaleCompressed(
      this.#getCellWidth(),
      this.#getStart(),
      this.#getEffectiveScale(),
      this.#timeBounds.getPrintStart(),
    );
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderFactory.java:139 */
  #getStart(): TimePoint {
    return TimePoint.ofStartOfDay(this.#timeBounds.getMinDay());
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderFactory.java:143 */
  #getEffectiveScale(): number {
    return this.#scaleConfig.getEffectiveScale();
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/header/TimeHeaderFactory.java:147 */
  #getCellWidth(): number {
    return this.#timelineStyle.getCellWidth();
  }
}
