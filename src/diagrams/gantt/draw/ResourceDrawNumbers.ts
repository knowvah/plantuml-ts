import { FontConfiguration } from '../../../core/abel/FontConfiguration.js';
import { Fore } from '../../../core/klimt/Fore.js';
import type { UGraphic } from '../../../core/klimt/UGraphic.js';
import { UStroke } from '../../../core/klimt/UStroke.js';
import { UTranslate } from '../../../core/klimt/UTranslate.js';
import { HColorSet } from '../../../core/klimt/color/HColorSet.js';
import { HColors } from '../../../core/klimt/color/HColors.js';
import { Display } from '../../../core/klimt/creole/Display.js';
import type { StringBounder } from '../../../core/klimt/font/StringBounder.js';
import { UFontFactory } from '../../../core/klimt/font/UFontFactory.js';
import type { TextBlock } from '../../../core/klimt/shape/TextBlock.js';
import { ULine } from '../../../core/klimt/shape/ULine.js';
import type { Resource } from '../core/Resource.js';
import type { GanttModelData } from '../data/GanttModelData.js';
import type { TimelineStyleData } from '../data/TimelineStyleData.js';
import type { TimePoint } from '../time/TimePoint.js';
import type { TimeScale } from '../timescale/TimeScale.js';
import type { ResourceDraw } from './ResourceDraw.js';
import { createLeftTextBlock, emojiStoreOf } from './header/TimeHeader.js';

/** The font size of the resource name (`ResourceDrawNumbers.java:80`). */
const NAME_FONT_SIZE = 13;
/** The font size of a load figure (`ResourceDrawNumbers.java:128`). */
const LOAD_FONT_SIZE = 9;
/** The y of the load figures under the name line (`ResourceDrawNumbers.java:109`). */
const LOAD_Y = 16;
/** Two rows of `LOAD_Y` (`getHeight`, java:142). */
const HEIGHT = LOAD_Y * 2;
/** An overloaded resource is drawn in `HColors.RED` (`HColors.java:90`). */
const RED = '#FF0000';
/** A load above this percentage turns the figure red (java:93). */
const FULL_LOAD = 100;

/**
 * ResourceDrawNumbers -- the footer row of one resource: its name, a rule, and the average load
 * per printed period.
 *
 * `Math.round` on the (non-negative) average is Java's `Math.round` there. The Java `null`
 * hyperlink stroke of `FontConfiguration.create(font, color, color, null)` is `UStroke.simple()`
 * (the abel `create` requires one; no link is drawn in a figure).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/ResourceDrawNumbers.java:57-150
 */
export class ResourceDrawNumbers implements ResourceDraw {
  readonly #res: Resource;
  readonly #timeScale: TimeScale;
  readonly #y: number;
  readonly #min: TimePoint;
  readonly #maxTimePointPrintedEndOfDay: TimePoint;
  readonly #ganttModelData: GanttModelData;
  readonly #timelineStyleData: TimelineStyleData;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/ResourceDrawNumbers.java:67-76 */
  public constructor(
    ganttModelData: GanttModelData,
    timelineStyleData: TimelineStyleData,
    res: Resource,
    timeScale: TimeScale,
    y: number,
    min: TimePoint,
    maxTimePointPrintedEndOfDay: TimePoint,
  ) {
    this.#res = res;
    this.#timeScale = timeScale;
    this.#y = y;
    this.#min = min;
    this.#maxTimePointPrintedEndOfDay = maxTimePointPrintedEndOfDay;
    this.#ganttModelData = ganttModelData;
    this.#timelineStyleData = timelineStyleData;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/ResourceDrawNumbers.java:78-119 */
  public drawU(ug: UGraphic): void {
    const title = createLeftTextBlock(
      Display.getWithNewlines(this.#timelineStyleData.getPragma(), this.#res.getName()),
      this.#getFontConfiguration(NAME_FONT_SIZE),
      emojiStoreOf(this.#timelineStyleData.getSkinParam()),
    );
    title.drawU(ug);
    const line = ULine.hline(
      this.#timeScale.getPosition(this.#maxTimePointPrintedEndOfDay) - this.#timeScale.getPosition(this.#min),
    );
    ug.apply(new Fore(HColors.BLACK))
      .apply(UTranslate.dy(title.calculateDimension(ug.getStringBounder()).getHeight()))
      .draw(line);

    let startingPosition = -1;
    let totalLoad = 0;
    let activeDays = 0;
    let isRed = false;
    for (let i = this.#min; i.compareTo(this.#maxTimePointPrintedEndOfDay) <= 0; i = i.increment()) {
      const isBreaking = this.#timeScale.isBreaking(i);
      const load = this.#ganttModelData.getLoadForResource(this.#res, i);
      if (load > FULL_LOAD) isRed = true;
      totalLoad += load;
      if (load > 0) activeDays++;
      if (isBreaking) {
        if (totalLoad > 0) {
          const displayedLoad = Math.round(totalLoad / activeDays);
          const value = this.#getTextBlock(displayedLoad, isRed);
          if (startingPosition === -1) startingPosition = this.#timeScale.getPosition(i);
          const endingPosition = this.#timeScale.getPosition(i) + this.#timeScale.getWidth(i);
          const start =
            (startingPosition + endingPosition) / 2 - value.calculateDimension(ug.getStringBounder()).getWidth() / 2;
          value.drawU(ug.apply(new UTranslate(start, LOAD_Y)));
        }
        startingPosition = -1;
        totalLoad = 0;
        activeDays = 0;
        isRed = false;
      } else if (startingPosition === -1) startingPosition = this.#timeScale.getPosition(i);
    }
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/ResourceDrawNumbers.java:121-125 */
  #getTextBlock(totalLoad: number, isRed: boolean): TextBlock {
    const display = Display.getWithNewlines(this.#timelineStyleData.getSkinParam().getPragma(), String(totalLoad));
    const fontConfiguration = this.#getFontConfigurationRed(isRed);
    return createLeftTextBlock(display, fontConfiguration);
  }

  /** `getFontConfiguration(boolean)`. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/ResourceDrawNumbers.java:127-129 */
  #getFontConfigurationRed(isRed: boolean): FontConfiguration {
    return this.#getFontConfiguration(
      LOAD_FONT_SIZE,
      isRed ? HColorSet.instance().getColorOrWhite(RED) : HColors.BLACK,
    );
  }

  /**
   * `getFontConfiguration(int)` (java:131-133, black) and `getFontConfiguration(int, HColor)` (java:135-139).
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/ResourceDrawNumbers.java:131-139
   */
  #getFontConfiguration(size: number, color: object = HColors.BLACK): FontConfiguration {
    const font = UFontFactory.serif(size);
    return FontConfiguration.create(font, color, color, UStroke.simple());
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/ResourceDrawNumbers.java:141-144 */
  public getHeight(_stringBounder: StringBounder): number {
    return HEIGHT;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/ResourceDrawNumbers.java:146-149 */
  public getY(): number {
    return this.#y;
  }
}
