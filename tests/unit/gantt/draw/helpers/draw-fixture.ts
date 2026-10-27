/**
 * Shared fixture for the task-draw tests (`TaskDrawRegular` / `Diamond` / `Group`, `AbstractTaskDraw`,
 * `ResourceDrawNumbers`, `TaskDrawRegistryData`): the built-in `plantuml.skin` style storage, a 10 px-per-day
 * `TimeScale`, a skin param whose `sheet(..)` is the creole parser (a note needs it), and a real `TaskImpl`.
 */
import type { ISkinParamWithSimple } from '../../../../../src/core/abel/ISkinParam.js';
import type { UChange } from '../../../../../src/core/klimt/UChange.js';
import type { UGraphic } from '../../../../../src/core/klimt/UGraphic.js';
import type { UParam } from '../../../../../src/core/klimt/UParam.js';
import type { UShape } from '../../../../../src/core/klimt/UShape.js';
import { UTranslate } from '../../../../../src/core/klimt/UTranslate.js';
import type { StringBounder } from '../../../../../src/core/klimt/font/StringBounder.js';
import { MeasurerStringBounder } from '../../../../../src/core/measurer-bounder.js';
import { HColorSet } from '../../../../../src/core/klimt/color/HColorSet.js';
import { SpriteContainerEmpty } from '../../../../../src/core/klimt/sprite/SpriteContainerEmpty.js';
import { Pragma } from '../../../../../src/core/skin/Pragma.js';
import { StyleBuilder } from '../../../../../src/core/style/StyleBuilder.js';
import { Resource } from '../../../../../src/diagrams/gantt/core/Resource.js';
import { TaskCode } from '../../../../../src/diagrams/gantt/core/TaskCode.js';
import { TaskImpl } from '../../../../../src/diagrams/gantt/core/TaskImpl.js';
import { DayCalendarData } from '../../../../../src/diagrams/gantt/data/DayCalendarData.js';
import { TimePoint } from '../../../../../src/diagrams/gantt/time/TimePoint.js';
import type { TimeScale } from '../../../../../src/diagrams/gantt/timescale/TimeScale.js';
import { skinStorageDump, styleFromDump } from '../../../core/style/helpers/style-fixture.js';

import { measurer } from '../header/helpers/header-fixture.js';

export { measurer };

/** Pixels per day of {@link timeScale}. */
export const DAY_PX = 10;

/** `ganttDiagram { task { Margin 2 2 2 2, Padding 0, RoundCorner 0 }, FontSize 11 }` (plantuml.skin:409-440). */
export const TASK_MARGIN = 2;
/** `milestone { Margin 2, Padding 3 }` (plantuml.skin). */
export const MILESTONE_PADDING = 3;
/** The task / milestone font size the skin resolves (11). */
export const TASK_FONT_SIZE = 11;

export const styleBuilder: StyleBuilder = new StyleBuilder().muteStyle(skinStorageDump().map(styleFromDump));

/** Day `d` of March 2024 at 00:00. */
export const day = (d: number): TimePoint => TimePoint.ofStartOfDay(2024, 3, d);

const BASE = day(1).getAbsoluteDayNum();

/** `DAY_PX` px per day from 2024-03-01, each day `DAY_PX` wide, never breaking. */
export const timeScale: TimeScale = {
  getPosition: (t: TimePoint) => (t.getAbsoluteDayNum() - BASE) * DAY_PX,
  getWidth: () => DAY_PX,
  isBreaking: () => false,
};

/** An `ISkinParamWithSimple` carrying the two members the draws read: `getPragma` and `sheet`. */
export function skinParam(): ISkinParamWithSimple {
  return {
    getPragma: () => Pragma.createEmpty(),
    getIHtmlColorSet: () => HColorSet.instance(),
    sheet: (
      fc: Parameters<SpriteContainerEmpty['sheet']>[0],
      align: Parameters<SpriteContainerEmpty['sheet']>[1],
      mode: Parameters<SpriteContainerEmpty['sheet']>[2],
    ) => new SpriteContainerEmpty().sheet(fc, align, mode, fc),
  } as unknown as ISkinParamWithSimple;
}

type Gantt = ConstructorParameters<typeof TaskImpl>[0];

/** The two GanttDiagram members TaskImpl calls (same stand-in as `TaskImpl.test.ts`). */
function ganttOver(calendar: DayCalendarData): Gantt {
  return {
    durationOfDays: (n: number) => calendar.durationOfDays(n),
    getLoadPlanableForTask: (id: string) =>
      calendar.getOpenClose().mutateMe(calendar.getOpenCloseForTask(id)).asPiecewiseConstant(),
  } as unknown as Gantt; // the two members above are all TaskImpl reads
}

/** A real task `code` starting at `start`, one day long by default, over the default calendar. */
export function taskOf(
  code: string,
  start: TimePoint = day(4),
  calendar: DayCalendarData = new DayCalendarData(),
): TaskImpl {
  return new TaskImpl(ganttOver(calendar), styleBuilder, TaskCode.fromIdAndDisplay(code, code), start, 0);
}

export function resourceOf(name: string): Resource {
  return new Resource(name);
}

/** One drawn shape with the sum of the translates that were applied before it. */
export interface Drawn {
  readonly shape: UShape;
  readonly x: number;
  readonly y: number;
}

/** A `UGraphic` that keeps the drawn shape objects (the recording one only keeps their labels). */
export class ShapeCapture implements UGraphic {
  constructor(
    readonly drawn: Drawn[] = [],
    private readonly dx = 0,
    private readonly dy = 0,
  ) {}
  apply(change: UChange): UGraphic {
    if (change instanceof UTranslate)
      return new ShapeCapture(this.drawn, this.dx + change.getDx(), this.dy + change.getDy());
    return this;
  }
  draw(shape: UShape): void {
    this.drawn.push({ shape, x: this.dx, y: this.dy });
  }
  getParam(): UParam {
    throw new Error('unused');
  }
  getTranslate(): UTranslate {
    return new UTranslate(this.dx, this.dy);
  }
  getStringBounder(): StringBounder {
    return new MeasurerStringBounder(measurer);
  }
}
