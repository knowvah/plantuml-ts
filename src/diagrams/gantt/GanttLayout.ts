import type { StringBounder } from '../../core/klimt/font/StringBounder.js';
import type { DisplayConfigData } from './data/DisplayConfigData.js';
import type { GanttModelData } from './data/GanttModelData.js';
import type { TaskDrawRegistryData } from './data/TaskDrawRegistryData.js';
import type { TimeBoundsData } from './data/TimeBoundsData.js';
import type { TimelineStyleData } from './data/TimelineStyleData.js';
import { taskDrawLabelOverflow } from './draw/TaskDraw.js';
import type { TimeHeader } from './draw/header/TimeHeader.js';

/**
 * GanttLayout -- the widths and heights of the three bands of a Gantt diagram.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttLayout.java:49-129
 */
export class GanttLayout {
  readonly #titlesWidth: number;
  readonly #barsWidth: number;
  readonly #timelineWidth: number;
  readonly #totalHeight: number;
  readonly #headerHeight: number;
  readonly #footerHeight: number;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttLayout.java:58-103 */
  public constructor(
    modelData: GanttModelData,
    displayConfig: DisplayConfigData,
    timeBounds: TimeBoundsData,
    timelineStyle: TimelineStyleData,
    drawRegistry: TaskDrawRegistryData,
    stringBounder: StringBounder,
    timeHeader: TimeHeader,
  ) {
    drawRegistry.buildTaskAndResourceDraws(
      stringBounder,
      timeHeader,
      modelData,
      displayConfig,
      timeBounds,
      timelineStyle,
    );

    // The `titleInside()` branches (java:66-81, :86, :99-101) are commented out upstream; only this value survives.
    const computedTitlesWidth = 0;

    this.#titlesWidth = computedTitlesWidth;

    this.#timelineWidth = timeBounds.getBarsColumnWidth(timeHeader);
    let maxLabelOverflow = 0;
    for (const task of modelData.getTasks()) {
      if (timeBounds.isHidden(task)) continue;

      const draw = drawRegistry.getTaskDraw(task);
      if (draw === undefined) continue;

      maxLabelOverflow = Math.max(maxLabelOverflow, taskDrawLabelOverflow(draw, stringBounder, this.#timelineWidth));
    }
    this.#barsWidth = this.#timelineWidth + maxLabelOverflow;
    this.#headerHeight = timeHeader.getTimeHeaderHeight(stringBounder);
    this.#footerHeight = displayConfig.isShowFootbox() ? timeHeader.getTimeFooterHeight(stringBounder) : 0;
    this.#totalHeight = drawRegistry.getTotalHeightWithoutFooter() + this.#footerHeight;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttLayout.java:105-107 */
  public getTitlesWidth(): number {
    return this.#titlesWidth;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttLayout.java:109-111 */
  public getBarsWidth(): number {
    return this.#barsWidth;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttLayout.java:113-115 */
  public getTimelineWidth(): number {
    return this.#timelineWidth;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttLayout.java:117-119 */
  public getTotalHeight(): number {
    return this.#totalHeight;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttLayout.java:121-123 */
  public getHeaderHeight(): number {
    return this.#headerHeight;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttLayout.java:125-127 */
  public getFooterHeight(): number {
    return this.#footerHeight;
  }
}
