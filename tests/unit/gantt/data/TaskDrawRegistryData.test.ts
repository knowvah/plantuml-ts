import { describe, expect, it } from 'vitest';
import { HColorSet } from '../../../../src/core/klimt/color/HColorSet.js';
import { Display } from '../../../../src/core/klimt/creole/Display.js';
import { MeasurerStringBounder } from '../../../../src/core/measurer-bounder.js';
import { Duration } from '../../../../src/core/time/Duration.js';
import { Load } from '../../../../src/diagrams/gantt/ngm/Load.js';
import { HorizontalAlignment } from '../../../../src/core/klimt/geom/HorizontalAlignment.js';
import { LabelPosition } from '../../../../src/diagrams/gantt/LabelPosition.js';
import { LabelStrategy } from '../../../../src/diagrams/gantt/LabelStrategy.js';
import { Pragma } from '../../../../src/core/skin/Pragma.js';
import { LocalDate } from '../../../../src/core/time/LocalDate.js';
import { TaskGroup } from '../../../../src/diagrams/gantt/core/TaskGroup.js';
import { TaskCode } from '../../../../src/diagrams/gantt/core/TaskCode.js';
import { TaskSeparator } from '../../../../src/diagrams/gantt/core/TaskSeparator.js';
import { DisplayConfigData } from '../../../../src/diagrams/gantt/data/DisplayConfigData.js';
import { GanttModelData } from '../../../../src/diagrams/gantt/data/GanttModelData.js';
import { TaskDrawRegistryData } from '../../../../src/diagrams/gantt/data/TaskDrawRegistryData.js';
import { TimeBoundsData } from '../../../../src/diagrams/gantt/data/TimeBoundsData.js';
import { TimelineStyleData } from '../../../../src/diagrams/gantt/data/TimelineStyleData.js';
import { ResourceDrawNumbers } from '../../../../src/diagrams/gantt/draw/ResourceDrawNumbers.js';
import { TaskDrawDiamond } from '../../../../src/diagrams/gantt/draw/TaskDrawDiamond.js';
import { TaskDrawGroup } from '../../../../src/diagrams/gantt/draw/TaskDrawGroup.js';
import { TaskDrawRegular } from '../../../../src/diagrams/gantt/draw/TaskDrawRegular.js';
import { TaskDrawSeparator } from '../../../../src/diagrams/gantt/draw/TaskDrawSeparator.js';
import type { TimeHeader } from '../../../../src/diagrams/gantt/draw/header/TimeHeader.js';
import { placed, recorded } from '../draw/header/helpers/header-fixture.js';
import { day, measurer, resourceOf, skinParam, styleBuilder, taskOf, timeScale } from '../draw/helpers/draw-fixture.js';
import { skinGanttStyle } from '../helpers/gantt-style.js';

// Expected values: ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/TaskDrawRegistryData.java
// (line numbers cited per test). 10 px per day from 2024-03-01; the header is a stub 20 high.

const sb = new MeasurerStringBounder(measurer);
const HEADER_HEIGHT = 20;
const header = { getTimeScale: () => timeScale, getFullHeaderHeight: () => HEADER_HEIGHT } as unknown as TimeHeader;

function bounds(printStart?: LocalDate): TimeBoundsData {
  const result = new TimeBoundsData();
  result.setMinDay(LocalDate.of(2024, 3, 4));
  result.setMaxDay(LocalDate.of(2024, 3, 10));
  result.setPrintStart(printStart);
  return result;
}

const timelineStyle = (): TimelineStyleData =>
  new TimelineStyleData(skinParam(), skinGanttStyle(), HColorSet.instance());

function build(
  model: GanttModelData,
  opts: { display?: DisplayConfigData; bounds?: TimeBoundsData } = {},
): TaskDrawRegistryData {
  const registry = new TaskDrawRegistryData();
  registry.buildTaskAndResourceDraws(
    sb,
    header,
    model,
    opts.display ?? new DisplayConfigData(),
    opts.bounds ?? bounds(),
    timelineStyle(),
  );
  return registry;
}

function modelOf(...tasks: ReturnType<typeof taskOf>[]): GanttModelData {
  const model = new GanttModelData();
  for (const t of tasks) model.putTask(t.getCode(), t);
  return model;
}

describe('TaskDrawRegistryData', () => {
  it('putTaskDraw / getTaskDraw round-trip by task identity (java:78-90)', () => {
    const registry = new TaskDrawRegistryData();
    const task = taskOf('A');
    const other = taskOf('A'); // same code, another object: no equals on Task, so another key
    const draw = new TaskDrawRegular(
      HColorSet.instance(),
      timeScale,
      registry.getOrigin(),
      'A',
      day(4),
      day(5),
      false,
      false,
      skinParam(),
      task,
      registry,
      [],
      styleBuilder,
    );
    expect(registry.getTaskDraw(task)).toBeUndefined();
    registry.putTaskDraw(task, draw);
    expect(registry.getTaskDraw(task)).toBe(draw);
    expect(registry.getTaskDraw(other)).toBeUndefined();
  });

  it('getOrigin is a real origin and getTotalHeightWithoutFooter starts at 0 (java:70-76)', () => {
    const registry = new TaskDrawRegistryData();
    expect(registry.getTotalHeightWithoutFooter()).toBe(0);
    expect(registry.getOrigin().getCurrentValue()).toBe(0);
    expect(registry.getOrigin()).toBe(registry.getOrigin());
  });

  it('buildTaskAndResourceDraws places a TaskSeparator, TaskGroup, diamond and regular task draw (java:144-184)', () => {
    const separator = new TaskSeparator(styleBuilder, 'Phase one', 1);
    const regular = taskOf('Regular');
    const milestone = taskOf('Milestone');
    milestone.setDiamond(true);
    const group = new TaskGroup(undefined, styleBuilder, TaskCode.fromIdAndDisplay('Group', 'Group'));
    group.addTask(regular);
    const model = new GanttModelData();
    for (const t of [separator, group, regular, milestone]) model.putTask(t.getCode(), t);

    const registry = build(model);
    const draws = [separator, group, regular, milestone].map((t) => registry.getTaskDraw(t));
    expect(draws[0]).toBeInstanceOf(TaskDrawSeparator);
    expect(draws[1]).toBeInstanceOf(TaskDrawGroup);
    expect(draws[2]).toBeInstanceOf(TaskDrawRegular);
    expect(draws[3]).toBeInstanceOf(TaskDrawDiamond);

    // each draw starts under the previous one: y += full height (java:177-178), from the header height (:147)
    let y = HEADER_HEIGHT;
    for (const draw of draws) {
      expect(draw?.getY(sb).getCurrentValue()).toBe(y);
      y += draw?.getFullHeightTask(sb) ?? Number.NaN;
    }
    // the footer is empty (no resource): the total is the bottom of the last draw (java:200)
    expect(registry.getTotalHeightWithoutFooter()).toBe(y);
  });

  it('the label is the code display, or the pretty display with its resources unless hidden (java:168-171)', () => {
    const task = taskOf('Job');
    task.addResource(resourceOf('Alice'), 50);
    const labelOf = (hide: boolean): string => {
      const display = new DisplayConfigData();
      display.setHideResourceName(hide);
      const draw = build(modelOf(task), { display }).getTaskDraw(task) as TaskDrawRegular;
      return placed(
        recorded((ug) =>
          draw.drawTitle(ug, new LabelStrategy(LabelPosition.FIRST_COLUMN, HorizontalAlignment.LEFT), 0, 0),
        ),
      )
        .map((p) => p.shape)
        .join('');
    };
    expect(labelOf(false)).toBe('UText(Job {Alice:50%})');
    expect(labelOf(true)).toBe('UText(Job)');
  });

  it('colours, completion, link and note reach the draw (java:173-180)', () => {
    const task = taskOf('Noted');
    task.setCompletion(40);
    task.setNote(Display.getWithNewlines(Pragma.createEmpty(), 'n'), undefined);
    const draw = build(modelOf(task)).getTaskDraw(task);
    // the note exists, so the draw reports a note fingerprint (java:173-180 -> setColorsAndCompletion)
    expect(draw?.getFingerPrintNote(sb)).toBeDefined();
  });

  it('a task with no colours reaches the draw as undefined, not a cast null (java:173-174)', () => {
    const task = taskOf('Plain');
    expect(task.getColors()).toBeUndefined();
    const [bar] = placed(
      recorded((ug) => {
        build(modelOf(task)).getTaskDraw(task)?.drawU(ug);
      }),
    );
    // style colours (the skin's task style), the regular bar
    expect(bar?.paint[0]).toBe('fore(#181818)');
  });

  it('a task in the same row does not advance y (java:177-178)', () => {
    const first = taskOf('First');
    const second = taskOf('Second');
    const third = taskOf('Third');
    second.putInSameRowAs(first);
    const registry = build(modelOf(first, second, third));
    const y = (t: typeof first): number => registry.getTaskDraw(t)?.getY(sb).getCurrentValue() ?? Number.NaN;
    expect(y(second)).toBe(y(first));
    expect(y(third)).toBe(y(first) + (registry.getTaskDraw(first)?.getFullHeightTask(sb) ?? Number.NaN));
  });

  it('createRegularTaskDraw: oddStart / oddEnd only when printStart is set (java:125-142)', () => {
    // RectangleTask draws a bar as one URectangle when neither end is cut (oddStart = oddEnd = false) and as
    // path / line pieces otherwise (RectangleTask.java:149-162, drawWithoutRound).
    const shapesOf = (task: ReturnType<typeof taskOf>, printStart?: LocalDate): string[] => {
      const draw = build(modelOf(task), { bounds: bounds(printStart) }).getTaskDraw(task);
      return [...new Set(placed(recorded((ug) => draw?.drawU(ug))).map((p) => p.shape.replace(/\(.*/, '')))].sort();
    };
    const printStart = LocalDate.of(2024, 3, 4);

    const fromMin = taskOf('FromMin', day(4)); // startForDrawing = minDay -> oddStart
    expect(shapesOf(fromMin)).toEqual(['URectangle']);
    expect(shapesOf(fromMin, printStart)).toEqual(['UPath', 'URectangle']);

    const inside = taskOf('Inside', day(5)); // neither end on the window edge
    expect(shapesOf(inside, printStart)).toEqual(['URectangle']);

    const spanning = taskOf('Spanning', day(4));
    spanning.setLoad(Load.of(Duration.ofDays(7))); // 4..11: both ends on the window edges
    expect(shapesOf(spanning)).toEqual(['URectangle']);
    expect(shapesOf(spanning, printStart)).toEqual(['ULine', 'URectangle']);
  });

  it('resolveNoteOverlaps pushes an overlapping task below the earlier note (java:102-123)', () => {
    const first = taskOf('First', day(4));
    first.setNote(Display.getWithNewlines(Pragma.createEmpty(), 'a note'), undefined);
    const second = taskOf('Second', day(4)); // same columns: its bar is under the first note
    const registry = build(modelOf(first, second));
    const drawFirst = registry.getTaskDraw(first);
    const drawSecond = registry.getTaskDraw(second);
    const bottomOfNote =
      (drawFirst?.getY(sb).getCurrentValue() ?? Number.NaN) + (drawFirst?.getHeightMax(sb) ?? Number.NaN);
    expect(drawSecond?.getY(sb).getCurrentValue()).toBe(bottomOfNote);
    // without the note the second row would sit right under the first bar
    expect(bottomOfNote).toBeGreaterThan(
      (drawFirst?.getY(sb).getCurrentValue() ?? Number.NaN) + (drawFirst?.getFullHeightTask(sb) ?? Number.NaN),
    );
  });

  it('buildResourceDraws: empty chart uses the header height (java:189-191)', () => {
    const registry = build(new GanttModelData());
    expect(registry.getTotalHeightWithoutFooter()).toBe(HEADER_HEIGHT);
  });

  it('buildResourceDraws: one footer per resource under the bars, 32 high each (java:192-202)', () => {
    const alice = resourceOf('Alice');
    const bob = resourceOf('Bob');
    const task = taskOf('Job');
    task.addResource(alice, 100);
    const model = modelOf(task);
    model.putResource('Alice', alice);
    model.putResource('Bob', bob);
    const registry = build(model);
    const bottom =
      (registry.getTaskDraw(task)?.getY(sb).getCurrentValue() ?? Number.NaN) +
      (registry.getTaskDraw(task)?.getHeightMax(sb) ?? Number.NaN);
    expect(alice.getResourceDraw()).toBeInstanceOf(ResourceDrawNumbers);
    expect(alice.getResourceDraw()?.getY()).toBe(bottom);
    expect(bob.getResourceDraw()?.getY()).toBe(bottom + 32);
    expect(registry.getTotalHeightWithoutFooter()).toBe(bottom + 64);
  });

  it('buildResourceDraws: hideResourceFootbox skips the footers (java:193)', () => {
    const alice = resourceOf('Alice');
    const task = taskOf('Job');
    task.addResource(alice, 100);
    const model = modelOf(task);
    model.putResource('Alice', alice);
    const display = new DisplayConfigData();
    display.setHideResourceFootbox(true);
    const registry = build(model, { display });
    expect(alice.getResourceDraw()).toBeUndefined();
    const draw = registry.getTaskDraw(task);
    expect(registry.getTotalHeightWithoutFooter()).toBe(
      (draw?.getY(sb).getCurrentValue() ?? Number.NaN) + (draw?.getHeightMax(sb) ?? Number.NaN),
    );
  });
});
