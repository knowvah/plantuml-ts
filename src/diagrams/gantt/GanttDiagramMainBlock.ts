import { Back } from '../../core/klimt/Back.js';
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import { HColorGradient } from '../../core/klimt/color/HColorGradient.js';
import type { HColorSimple } from '../../core/klimt/color/HColorSimple.js';
import type { StringBounder } from '../../core/klimt/font/StringBounder.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import { XDimension2D } from '../../core/klimt/geom/XDimension2D.js';
import { TextBlockMemoized } from '../../core/klimt/shape/TextBlockMemoized.js';
import { URectangle } from '../../core/klimt/shape/URectangle.js';
import { StyleSignatureBasic } from '../../core/style/StyleSignatureBasic.js';
import type { Locale } from '../../core/utils/I18nTimeData.js';
import type { DisplayConfigData } from './data/DisplayConfigData.js';
import type { GanttModelData } from './data/GanttModelData.js';
import type { TaskDrawRegistryData } from './data/TaskDrawRegistryData.js';
import type { TimeBoundsData } from './data/TimeBoundsData.js';
import type { TimelineStyleData } from './data/TimelineStyleData.js';
import { paintOf } from './draw/header/TimeHeader.js';
import type { TimeHeader } from './draw/header/TimeHeader.js';
import type { GanttDiagram } from './GanttDiagram.js';
import { GanttLayout } from './GanttLayout.js';
import { currentStyleBuilder, GanttTaskTable } from './GanttTaskTable.js';
import { LabelPosition } from './LabelPosition.js';
import { LabelStrategy } from './LabelStrategy.js';
import { TimePoint } from './time/TimePoint.js';
import type { TimeScale } from './timescale/TimeScale.js';

/**
 * `HColor#isTransparent` (HColor.java:137); a gradient answers for its first colour.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/HColorLinearGradient.java:341-343
 */
function isTransparent(color: HColorSimple | HColorGradient): boolean {
  return color instanceof HColorGradient ? color.getColor1().isTransparent() : color.isTransparent();
}

/** `margin` of `calculateDimensionSlow`. @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttDiagramMainBlock.java:153 */
const MARGIN = 20;

/**
 * GanttDiagramMainBlock -- the whole Gantt diagram as one `TextBlock`: task table, time header, constraints,
 * task bars, titles and resources.
 *
 * `drawU`'s `catch (Throwable e)` (java:137-149) draws upstream's crash report (`Logme.error`, `ReportLog`,
 * `CrashImage`), none of which is ported: the `try` body is ported unchanged and not caught, so the exception
 * reaches `src/index.ts`'s error page (the existing ruling for upstream crash reports, `src/core/UgDiagram.ts:22-24`).
 * That catch is the only reader of Java's `diagram` field, so the constructor reads `diagram` and does not keep it.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttDiagramMainBlock.java:77-207
 */
export class GanttDiagramMainBlock extends TextBlockMemoized {
  readonly #timeHeader: TimeHeader;
  readonly #layout: GanttLayout;
  readonly #modelData: GanttModelData;
  readonly #timeBounds: TimeBoundsData;

  readonly #displayConfig: DisplayConfigData;
  readonly #timelineStyle: TimelineStyleData;
  readonly #drawRegistry: TaskDrawRegistryData;
  readonly #taskTable: GanttTaskTable;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttDiagramMainBlock.java:89-105 */
  public constructor(
    timeBounds: TimeBoundsData,
    modelData: GanttModelData,
    drawRegistry: TaskDrawRegistryData,
    displayConfig: DisplayConfigData,
    timelineStyle: TimelineStyleData,
    diagram: GanttDiagram,
    timeHeader: TimeHeader,
    locale: Locale,
    stringBounder: StringBounder,
  ) {
    super();
    this.#timeBounds = timeBounds;
    this.#modelData = modelData;
    this.#drawRegistry = drawRegistry;
    this.#displayConfig = displayConfig;
    this.#timelineStyle = timelineStyle;
    this.#timeHeader = timeHeader;
    this.#layout = new GanttLayout(
      modelData,
      displayConfig,
      timeBounds,
      timelineStyle,
      drawRegistry,
      stringBounder,
      timeHeader,
    );
    this.#taskTable = new GanttTaskTable(
      modelData,
      timeBounds,
      drawRegistry,
      timelineStyle,
      timeHeader.getFullHeaderHeight(stringBounder),
      locale,
      stringBounder,
      diagram.getDisplayedColumn(),
    );
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttDiagramMainBlock.java:107-150 */
  public drawU(ug: UGraphic): void {
    const tableWidth = this.#taskTable.getWidth();
    this.#taskTable.drawU(ug, this.#drawRegistry.getTotalHeightWithoutFooter());
    ug = ug.apply(UTranslate.dx(tableWidth));

    const ugOrig = ug;

    // if (displayConfig.getLabelStrategy().titleInFirstColumn()) ug = ug.apply(UTranslate.dx(layout.getTitlesWidth()));
    // (commented out upstream, java:115-116)

    const merged = StyleSignatureBasic.of('root', 'element', 'ganttDiagram', 'timeline').getMergedStyle(
      currentStyleBuilder(this.#timelineStyle.getSkinParam()),
    );
    if (merged === undefined) throw new Error('NullPointerException: no style for gantt timeline');

    const back = paintOf(merged.value('BackGroundColor').asColor(this.#timelineStyle.getColorSet()));
    if (isTransparent(back) === false) {
      const fullWidth = this.#layout.getTitlesWidth() + this.#layout.getTimelineWidth();

      const rect1 = URectangle.build(fullWidth, this.#layout.getHeaderHeight());
      ug.apply(new Back(back)).draw(rect1);
      if (this.#displayConfig.isShowFootbox()) {
        const rect2 = URectangle.build(fullWidth, this.#layout.getFooterHeight());
        ug.apply(new Back(back)).apply(UTranslate.dy(this.#drawRegistry.getTotalHeightWithoutFooter())).draw(rect2);
      }
    }

    this.#timeHeader.drawTimeHeader(ug, this.#drawRegistry.getTotalHeightWithoutFooter());

    this.#drawConstraints(ug, this.#timeHeader.getTimeScale());
    this.#drawTasksRect(ug);
    this.#drawTasksTitle(ugOrig, this.#layout.getTitlesWidth(), this.#layout.getBarsWidth());

    if (this.#displayConfig.isHideResourceFootbox() === false) this.#drawResources(ug);

    if (this.#displayConfig.isShowFootbox())
      this.#timeHeader.drawTimeFooter(ug.apply(UTranslate.dy(this.#drawRegistry.getTotalHeightWithoutFooter())));
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttDiagramMainBlock.java:152-158 */
  protected calculateDimensionSlow(_stringBounder: StringBounder): XDimension2D {
    const width = this.#taskTable.getWidth() + this.#layout.getTitlesWidth() + this.#layout.getBarsWidth() + MARGIN;
    const height = this.#layout.getTotalHeight();
    return new XDimension2D(width, height);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttDiagramMainBlock.java:160-169 */
  #drawTasksRect(ug: UGraphic): void {
    for (const task of this.#modelData.getTasks()) {
      if (this.#timeBounds.isHidden(task)) continue;

      const draw = this.#drawRegistry.getTaskDraw(task);
      if (draw === undefined) throw new Error('NullPointerException: no TaskDraw for a visible task');
      const move = UTranslate.dy(draw.getY(ug.getStringBounder()).getCurrentValue());
      draw.drawU(ug.apply(move));
    }
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttDiagramMainBlock.java:171-182 */
  #drawConstraints(ug: UGraphic, timeScale: TimeScale): void {
    for (const constraint of this.#modelData.getConstraints()) {
      if (
        this.#timeBounds.getPrintStart() !== undefined &&
        constraint.isHidden(
          TimePoint.ofStartOfDay(this.#timeBounds.getMinDay()),
          TimePoint.ofEndOfDayMinusOneSecond(this.#timeBounds.getMaxDay()),
        )
      )
        continue;

      constraint.getUDrawable(timeScale, this.#drawRegistry).drawU(ug);
    }
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttDiagramMainBlock.java:184-196 */
  #drawTasksTitle(ug: UGraphic, colTitles: number, colBars: number): void {
    for (const task of this.#modelData.getTasks()) {
      if (this.#timeBounds.isHidden(task)) continue;

      const draw = this.#drawRegistry.getTaskDraw(task);
      if (draw === undefined) throw new Error('NullPointerException: no TaskDraw for a visible task');
      const move = UTranslate.dy(draw.getY(ug.getStringBounder()).getCurrentValue());
      // draw.drawTitle(ug.apply(move), displayConfig.getLabelStrategy(), colTitles, colBars);   (java:190-191)
      const labelStrategy = new LabelStrategy(LabelPosition.LEGACY, HorizontalAlignment.LEFT);
      draw.drawTitle(ug.apply(move), labelStrategy, colTitles, colBars);
    }
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttDiagramMainBlock.java:198-205 */
  #drawResources(ug: UGraphic): void {
    for (const res of this.#modelData.getResources()) {
      const draw = res.getResourceDraw();
      if (draw === undefined) throw new Error('NullPointerException: no ResourceDraw');
      const move = UTranslate.dy(draw.getY());
      draw.drawU(ug.apply(move));
    }
  }
}
