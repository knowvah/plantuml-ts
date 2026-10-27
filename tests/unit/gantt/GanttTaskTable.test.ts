import { describe, expect, it } from 'vitest';
import { Fore } from '../../../src/core/klimt/Fore.js';
import type { UGraphic } from '../../../src/core/klimt/UGraphic.js';
import { newLocale } from '../../../src/core/utils/I18nTimeData.js';
import { TaskCode } from '../../../src/diagrams/gantt/core/TaskCode.js';
import { TaskGroup } from '../../../src/diagrams/gantt/core/TaskGroup.js';
import { TaskSeparator } from '../../../src/diagrams/gantt/core/TaskSeparator.js';
import { GanttTaskTable, currentStyleBuilder } from '../../../src/diagrams/gantt/GanttTaskTable.js';
import { GanttTaskTableColumn } from '../../../src/diagrams/gantt/GanttTaskTableColumn.js';
import { Context } from '../../../src/diagrams/gantt/GanttTaskTableColumn.js';
import { paintOf } from '../../../src/diagrams/gantt/draw/header/TimeHeader.js';
import { TimePoint } from '../../../src/diagrams/gantt/time/TimePoint.js';
import { LocalDate } from '../../../src/core/time/LocalDate.js';
import { changeLabel } from '../../helpers/recording-ugraphic.js';
import { placed, placedOf, recorded } from './draw/header/helpers/header-fixture.js';
import { day, measurer, styleBuilder, taskOf } from './draw/helpers/draw-fixture.js';
import { sceneOf, sb, type Scene } from './helpers/gantt-scene.js';

// Expected values: ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttTaskTable.java:71-206.
// The `timeline` style the table reads is SansSerif 10 (plantuml.skin:421-423 `timeline { FontSize 10 }`).

const EN = newLocale('en');
const SANS = { family: 'SansSerif', size: 10 };
/** `CELL_PADDING` (java:77). */
const PADDING = 5;
const HEADER_HEIGHT = 20;
const TOTAL = 90;

const widthOf = (text: string): number => measurer.measure(text, SANS).width;

function tableOf(scene: Scene, columns: readonly GanttTaskTableColumn[], headerHeight = HEADER_HEIGHT): GanttTaskTable {
  return new GanttTaskTable(
    scene.modelData,
    scene.timeBounds,
    scene.registry,
    scene.timelineStyle,
    headerHeight,
    EN,
    sb,
    columns,
  );
}

describe('GanttTaskTable widths (java:94-126)', () => {
  it('a column is its widest cell (header included) plus a padding on each side (java:114-122)', () => {
    const scene = sceneOf([taskOf('A', day(4))]);
    const table = tableOf(scene, [GanttTaskTableColumn.TASK]);
    // header "Task" is wider than the code "A"
    expect(GanttTaskTableColumn.TASK.header(EN)).toBe('Task');
    expect(table.getWidth()).toBe(widthOf('Task') + 2 * PADDING);
  });

  it('a long task code widens its column (java:119)', () => {
    const scene = sceneOf([taskOf('A', day(4)), taskOf('a rather long task code', day(5))]);
    const table = tableOf(scene, [GanttTaskTableColumn.TASK]);
    expect(table.getWidth()).toBe(widthOf('a rather long task code') + 2 * PADDING);
  });

  it('the table width is the right edge of the last column: the sum of the column widths (java:96-111, :124-126)', () => {
    const scene = sceneOf([taskOf('A', day(4))]);
    const one = tableOf(scene, [GanttTaskTableColumn.TASK]).getWidth();
    const two = tableOf(scene, [GanttTaskTableColumn.START]).getWidth();
    expect(tableOf(scene, [GanttTaskTableColumn.TASK, GanttTaskTableColumn.START]).getWidth()).toBe(one + two);
  });

  it('no displayed column is a zero-width table (java:104-110)', () => {
    expect(tableOf(sceneOf([taskOf('A', day(4))]), []).getWidth()).toBe(0);
  });

  it('tasks that are not TaskImpl are not measured (java:173-175)', () => {
    const scene = sceneOf([taskOf('A', day(4))]);
    const group = new TaskGroup(undefined, styleBuilder, TaskCode.fromIdAndDisplay('G', 'a group name far too wide'));
    const separator = new TaskSeparator(styleBuilder, 'a separator name far too wide', 1);
    scene.modelData.putTask(group.getCode(), group);
    scene.modelData.putTask(separator.getCode(), separator);
    expect(tableOf(scene, [GanttTaskTableColumn.TASK]).getWidth()).toBe(widthOf('Task') + 2 * PADDING);
  });

  it('hidden tasks are not measured (java:177-178)', () => {
    const hidden = taskOf('a hidden task with a very long code', day(1));
    const scene = sceneOf([taskOf('A', day(4)), hidden], { printStart: day(4).toDay() });
    expect(scene.timeBounds.isHidden(hidden)).toBe(true);
    expect(tableOf(scene, [GanttTaskTableColumn.TASK]).getWidth()).toBe(widthOf('Task') + 2 * PADDING);
  });

  it('tasks without a TaskDraw are not measured (java:180-181)', () => {
    const scene = sceneOf([taskOf('A', day(4))]);
    const late = taskOf('a task never drawn with a long code', day(5));
    scene.modelData.putTask(late.getCode(), late);
    expect(scene.registry.getTaskDraw(late)).toBeUndefined();
    expect(tableOf(scene, [GanttTaskTableColumn.TASK]).getWidth()).toBe(widthOf('Task') + 2 * PADDING);
  });

  it('the date columns use the day numbers in relative mode: minDay equals the epoch (java:185-187)', () => {
    const scene = sceneOf([taskOf('A', day(4))]);
    const a = scene.modelData.getTasks()[0]!;
    const absolute = new Context(EN, false, LocalDate.of(2024, 3, 4));
    const relative = new Context(EN, true, LocalDate.of(2024, 3, 4));
    expect(GanttTaskTableColumn.START.valueOf(a, absolute)).not.toBe(GanttTaskTableColumn.START.valueOf(a, relative));
    // minDay 2024-03-04 is not the epoch: the table formats real dates
    expect(tableOf(scene, [GanttTaskTableColumn.START]).getWidth()).toBe(
      Math.max(widthOf('Start'), widthOf(GanttTaskTableColumn.START.valueOf(a, absolute))) + 2 * PADDING,
    );
    expect(TimePoint.epoch().equals(LocalDate.of(2024, 3, 4))).toBe(false);
  });
});

describe('GanttTaskTable.drawU (java:128-171)', () => {
  const scene = sceneOf([taskOf('A', day(4)), taskOf('B', day(5))]);
  const columns = [GanttTaskTableColumn.TASK, GanttTaskTableColumn.START];
  const table = tableOf(scene, columns);
  const log = recorded((ug: UGraphic) => {
    table.drawU(ug, TOTAL);
  });
  const edges = [0, tableOf(scene, [columns[0]!]).getWidth(), table.getWidth()];

  it('draws three horizontal rules (top, below the header, bottom) in the timeline line colour (java:145-149)', () => {
    const lines = placedOf(log, 'ULine').filter((p) => p.shape === `ULine(${String(table.getWidth())},0)`);
    expect(lines.map((p) => [p.x, p.y])).toEqual([
      [0, 0],
      [0, HEADER_HEIGHT],
      [0, TOTAL],
    ]);
    const fore = changeLabel(new Fore(paintOf(scene.timelineStyle.getLineColor())));
    for (const p of lines) expect(p.paint).toEqual([fore]);
  });

  it('draws one vertical rule per column edge, N + 1 of them (java:151-152)', () => {
    const vlines = placedOf(log, 'ULine').filter((p) => p.shape === `ULine(0,${String(TOTAL)})`);
    expect(vlines.map((p) => [p.x, p.y])).toEqual(edges.map((x) => [x, 0]));
  });

  it('draws the header cells centred on half the header height, then each task row (java:133-143, :166-171)', () => {
    const texts = placedOf(log, 'UText');
    const draws = scene.modelData.getTasks().map((t) => scene.registry.getTaskDraw(t)!);
    const startText = (i: number): string =>
      GanttTaskTableColumn.START.valueOf(
        scene.modelData.getTasks()[i]!,
        new Context(EN, false, scene.timeBounds.getMinDay()),
      );
    // order: header row (all columns), then row by row
    expect(texts.map((p) => p.shape)).toEqual([
      'UText(Task)',
      'UText(Start)',
      'UText(A)',
      `UText(${startText(0)})`,
      'UText(B)',
      `UText(${startText(1)})`,
    ]);
    // x = column edge + padding (java:170)
    expect(texts.map((p) => p.x)).toEqual([
      edges[0]! + PADDING,
      edges[1]! + PADDING,
      edges[0]! + PADDING,
      edges[1]! + PADDING,
      edges[0]! + PADDING,
      edges[1]! + PADDING,
    ]);
    // y: a cell is centred, so its y is the centre minus half the block height; same height for every row, so
    // rows differ by their centres: draw.getY + fullHeightTask / 2 (java:139-140)
    const centre = (i: number): number => draws[i]!.getY(sb).getCurrentValue() + draws[i]!.getFullHeightTask(sb) / 2;
    expect(texts[2]!.y - texts[0]!.y).toBeCloseTo(centre(0) - HEADER_HEIGHT / 2, 9);
    expect(texts[4]!.y - texts[2]!.y).toBeCloseTo(centre(1) - centre(0), 9);
    expect(texts[3]!.y).toBe(texts[2]!.y);
  });

  it('skips tasks that are not drawable (java:136-137)', () => {
    const only = sceneOf([taskOf('A', day(4))]);
    const group = new TaskGroup(undefined, styleBuilder, TaskCode.fromIdAndDisplay('G', 'group'));
    only.modelData.putTask(group.getCode(), group);
    const texts = placedOf(
      recorded((ug) => {
        tableOf(only, [GanttTaskTableColumn.TASK]).drawU(ug, TOTAL);
      }),
      'UText',
    );
    expect(texts.map((p) => p.shape)).toEqual(['UText(Task)', 'UText(A)']);
  });

  it('draws nothing but the rules for an empty column list (java:156-164)', () => {
    const empty = recorded((ug) => {
      tableOf(scene, []).drawU(ug, TOTAL);
    });
    expect(placed(empty).map((p) => p.shape)).toEqual([
      'ULine(0,0)',
      'ULine(0,0)',
      'ULine(0,0)',
      `ULine(0,${String(TOTAL)})`,
    ]);
  });
});

describe('currentStyleBuilder (abel seam)', () => {
  it('answers the real StyleBuilder', () => {
    const skin = { getCurrentStyleBuilder: () => styleBuilder } as never;
    expect(currentStyleBuilder(skin)).toBe(styleBuilder);
  });

  it('a non-StyleBuilder is a ClassCastException', () => {
    const skin = { getCurrentStyleBuilder: () => ({}) } as never;
    expect(() => currentStyleBuilder(skin)).toThrow('ClassCastException');
  });
});
