/**
 * Shared scene for the `GanttLayout` / `GanttTaskTable` / `GanttDiagramMainBlock` tests: the real daily
 * `TimeHeader`, the real data objects over the built-in `plantuml.skin`, 2024-03-04 .. 2024-03-10 and the
 * real task draws built by `GanttLayout` the way `GanttDiagramMainBlock`'s constructor builds them
 * (GanttDiagramMainBlock.java:99-100).
 */
import type { ISkinParam } from '../../../../src/core/abel/ISkinParam.js';
import { HColorSet } from '../../../../src/core/klimt/color/HColorSet.js';
import { MeasurerStringBounder } from '../../../../src/core/measurer-bounder.js';
import { Style } from '../../../../src/core/style/Style.js';
import type { StyleBuilder } from '../../../../src/core/style/StyleBuilder.js';
import { StyleSignatureBasic } from '../../../../src/core/style/StyleSignatureBasic.js';
import { ValueImpl } from '../../../../src/core/style/ValueImpl.js';
import type { PName } from '../../../../src/core/style/PName.js';
import type { Value } from '../../../../src/core/style/Value.js';
import { LocalDate } from '../../../../src/core/time/LocalDate.js';
import type { Resource } from '../../../../src/diagrams/gantt/core/Resource.js';
import type { TaskImpl } from '../../../../src/diagrams/gantt/core/TaskImpl.js';
import { DisplayConfigData } from '../../../../src/diagrams/gantt/data/DisplayConfigData.js';
import { GanttModelData } from '../../../../src/diagrams/gantt/data/GanttModelData.js';
import { TaskDrawRegistryData } from '../../../../src/diagrams/gantt/data/TaskDrawRegistryData.js';
import type { TimeBoundsData } from '../../../../src/diagrams/gantt/data/TimeBoundsData.js';
import { TimelineStyleData } from '../../../../src/diagrams/gantt/data/TimelineStyleData.js';
import { TimeHeaderDaily } from '../../../../src/diagrams/gantt/draw/header/TimeHeaderDaily.js';
import type { GanttConstraint } from '../../../../src/diagrams/gantt/GanttConstraint.js';
import { GanttLayout } from '../../../../src/diagrams/gantt/GanttLayout.js';
import { boundsOf, dailyScale, headerData, measurer } from '../draw/header/helpers/header-fixture.js';
import { skinParam, styleBuilder as skinStyleBuilder } from '../draw/helpers/draw-fixture.js';
import { skinGanttStyle } from './gantt-style.js';

export const MIN_DAY = LocalDate.of(2024, 3, 4);
export const MAX_DAY = LocalDate.of(2024, 3, 10);

export const sb = new MeasurerStringBounder(measurer);

/** `timeline { BackgroundColor <colour> }` with a priority no skin value can beat (Style#mergeWith: higher wins). */
export function withTimelineBackground(colour: string): StyleBuilder {
  const map = new Map<PName, Value>([['BackGroundColor', ValueImpl.regular(colour, 2147483647)]]);
  const timeline = new Style(StyleSignatureBasic.of('root', 'element', 'ganttDiagram', 'timeline'), map);
  return skinStyleBuilder.muteStyle([timeline]);
}

export interface Parts {
  readonly modelData: GanttModelData;
  readonly timeBounds: TimeBoundsData;
  readonly displayConfig: DisplayConfigData;
  readonly timelineStyle: TimelineStyleData;
  readonly registry: TaskDrawRegistryData;
  readonly header: TimeHeaderDaily;
}

export interface Scene extends Parts {
  readonly layout: GanttLayout;
}

export interface SceneOptions {
  readonly printStart?: LocalDate;
  readonly styleBuilder?: StyleBuilder;
  readonly showFootbox?: boolean;
  readonly hideResourceFootbox?: boolean;
  /** Added to the model before any draw is built: `TaskDrawRegistryData` hands them to each task draw. */
  readonly constraints?: readonly GanttConstraint[];
  readonly resources?: readonly Resource[];
}

/** The data objects and the header over `tasks`; no draw is built yet. */
export function partsOf(tasks: readonly TaskImpl[], options: SceneOptions = {}): Parts {
  const builder = options.styleBuilder ?? skinStyleBuilder;
  const skin = { ...skinParam(), getCurrentStyleBuilder: () => builder } as unknown as ISkinParam;
  const timelineStyle = new TimelineStyleData(skin, skinGanttStyle(), HColorSet.instance());
  const timeBounds = boundsOf(MIN_DAY, MAX_DAY, options.printStart);
  const data = { ...headerData(), timeBounds, timelineStyle };
  const header = new TimeHeaderDaily(
    dailyScale(data),
    data.weekConfig,
    data.dayCalendar,
    timeBounds,
    data.scaleConfig,
    timelineStyle,
  );
  const modelData = new GanttModelData();
  for (const task of tasks) modelData.putTask(task.getCode(), task);
  const displayConfig = new DisplayConfigData();
  if (options.showFootbox !== undefined) displayConfig.setShowFootbox(options.showFootbox);
  if (options.hideResourceFootbox !== undefined) displayConfig.setHideResourceFootbox(options.hideResourceFootbox);
  for (const constraint of options.constraints ?? []) modelData.addConstraint(constraint);
  for (const resource of options.resources ?? []) modelData.putResource(resource.getName(), resource);
  return { modelData, timeBounds, displayConfig, timelineStyle, registry: new TaskDrawRegistryData(), header };
}

/** The scene over `tasks`, with every task draw built (a `GanttLayout` is constructed). */
export function sceneOf(tasks: readonly TaskImpl[], options: SceneOptions = {}): Scene {
  const parts = partsOf(tasks, options);
  const { modelData, displayConfig, timeBounds, timelineStyle, registry, header } = parts;
  const layout = new GanttLayout(modelData, displayConfig, timeBounds, timelineStyle, registry, sb, header);
  return { ...parts, layout };
}
