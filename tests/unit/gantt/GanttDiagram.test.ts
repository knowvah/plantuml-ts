/**
 * GanttDiagram (gantt/GanttDiagram.java) and its config half (GanttDiagramConfig.ts). The diagram is built
 * programmatically (no parser yet, T7c). Drawing is compared with the jar oracles under `tests/fixtures/gantt/`
 * element by element (`elementsOf`): every `line`/`text`/`rect`/`polygon`/`path` in document order.
 */
import { describe, expect, it, vi } from 'vitest';
import type { Clock } from '../../../src/core/clock.js';
import { HColorSet } from '../../../src/core/klimt/color/HColorSet.js';
import { Display } from '../../../src/core/klimt/creole/Display.js';
import { Pragma } from '../../../src/core/skin/Pragma.js';
import { DayOfWeek } from '../../../src/core/time/DayOfWeek.js';
import { Duration } from '../../../src/core/time/Duration.js';
import { StyleSignatureBasic } from '../../../src/core/style/StyleSignatureBasic.js';
import { LocalDate } from '../../../src/core/time/LocalDate.js';
import { LocalDateTime } from '../../../src/core/time/LocalDateTime.js';
import { StyleBuilder } from '../../../src/core/style/StyleBuilder.js';
import { TimeRange } from '../../../src/diagrams/gantt/core/TimeRange.js';
import { WeeklyHeaderStrategy } from '../../../src/diagrams/gantt/draw/WeeklyHeaderStrategy.js';
import { TimeDirection } from '../../../src/diagrams/gantt/ngm/math/TimeDirection.js';
import { ImpossibleSolvingException } from '../../../src/diagrams/gantt/solver/ImpossibleSolvingException.js';
import { PrintScale } from '../../../src/diagrams/gantt/core/PrintScale.js';
import { TaskCode } from '../../../src/diagrams/gantt/core/TaskCode.js';
import type { TaskImpl } from '../../../src/diagrams/gantt/core/TaskImpl.js';
import { TaskDrawRegular } from '../../../src/diagrams/gantt/draw/TaskDrawRegular.js';
import type { GanttDiagram } from '../../../src/diagrams/gantt/GanttDiagram.js';
import { GanttTaskTableColumn } from '../../../src/diagrams/gantt/GanttTaskTableColumn.js';
import { Load } from '../../../src/diagrams/gantt/ngm/Load.js';
import { TimePoint } from '../../../src/diagrams/gantt/time/TimePoint.js';
import { drawSvg, elementsOf, newGantt, oracleSvg } from './helpers/gantt-diagram-fixture.js';

const START = LocalDate.of(2020, 7, 1);
const COLORS = HColorSet.instance();

/** `[name] lasts <days> days` (SubjectTask.java:91-98 with ComplementDuration.java:73-88). */
function lasts(d: GanttDiagram, name: string, days: number): TaskImpl {
  const task = d.getOrCreateTask(TaskCode.fromId(name), false);
  task.setLoad(Load.of(d.durationOfDaysHoursMinutesSeconds(days, 0, 0, 0)));
  return task as TaskImpl;
}

function started(): GanttDiagram {
  const d = newGantt();
  d.updateStartingPoint(START);
  return d;
}

describe('GanttDiagram drawing equals the jar', () => {
  it('two tasks with the duration column hidden (columns-hide-duration.svg; GanttDiagram.java:675-682)', () => {
    const d = started();
    lasts(d, 'Task A', 5);
    lasts(d, 'Task B', 3);
    expect(d.hideOrShowColumn(false, GanttTaskTableColumn.DURATION).isOk()).toBe(true);
    const jar = elementsOf(oracleSvg('columns-hide-duration'));
    expect(jar.filter((e) => e.startsWith('<rect')).length).toBeGreaterThanOrEqual(4);
    expect(elementsOf(drawSvg(d))).toEqual(jar);
  });

  it('two tasks with the task column shown (columns-show-task.svg)', () => {
    const d = started();
    d.hideOrShowColumn(true, GanttTaskTableColumn.TASK);
    lasts(d, 'Task A', 5);
    lasts(d, 'Task B', 3);
    expect(elementsOf(drawSvg(d))).toEqual(elementsOf(oracleSvg('columns-show-task')));
  });

  it('resources with and without a percentage, names hidden (hide-resource-names.svg; GanttDiagram.java:378-392, 515-518)', () => {
    const d = started();
    d.hideResourceName();
    const a = lasts(d, 'Task A', 5);
    d.affectResource(a, 'Alice');
    const b = lasts(d, 'Task B', 3);
    d.affectResource(b, 'Bob:50');
    expect(elementsOf(drawSvg(d))).toEqual(elementsOf(oracleSvg('hide-resource-names')));
  });

  it('a milestone, coloured days and a language (language-de.svg; GanttDiagram.java:129-132, 437-443)', () => {
    const d = newGantt();
    d.changeLanguage('de');
    d.updateStartingPoint(LocalDate.of(2020, 6, 25));
    lasts(d, 'Task A', 12);
    const milestone = d.getOrCreateTask(TaskCode.fromId('Milestone'), false);
    milestone.setStart(TimePoint.ofStartOfDay(LocalDate.of(2020, 7, 3)));
    milestone.setDiamond(true);
    for (const day of [30, 1, 2]) {
      const date = day === 30 ? LocalDate.of(2020, 6, 30) : LocalDate.of(2020, 7, day);
      d.colorDay(date, COLORS.getColorOrWhite('lightblue'));
    }
    expect(elementsOf(drawSvg(d))).toEqual(elementsOf(oracleSvg('language-de')));
  });
});

describe('GanttDiagram framework members', () => {
  it('describes itself, answers 96 dpi and no margins (GanttDiagram.java:134-136, 159-161, 501-504)', () => {
    const d = newGantt();
    expect(d.getDescription()).toBe('(Gantt)');
    expect(d.getDpi()).toBe(96);
    const margins = d.getDefaultMargins();
    expect([margins.getTop(), margins.getRight(), margins.getBottom(), margins.getLeft()]).toEqual([0, 0, 0, 0]);
    expect(d.getDiagramType()).toBe('GANTT');
  });

  it('getStyle merges root.element.ganttDiagram.<param>[.<param2>] (GanttDiagram.java:206-216)', () => {
    const d = newGantt();
    expect(d.getStyle('timeline', 'day').value('FontSize').asDouble()).toBe(10);
    expect(d.getStyle('timeline', 'year').value('FontSize').asDouble()).toBe(14);
    expect(d.getDefaultStyleDefinitionArrow().toString()).toBe(
      StyleSignatureBasic.of('root', 'element', 'ganttDiagram', 'arrow').toString(),
    );
    expect(d.getDefaultStyleDefinitionArrow().toString()).toContain('ganttDiagram');
  });

  it('getIHtmlColorSet is the timeline style colour set (GanttDiagram.java:568-570)', () => {
    expect(newGantt().getIHtmlColorSet()).toBe(COLORS);
  });

  it('checkFinalError is null for a short project and names the 20-year limit past it (GanttDiagram.java:171-181)', () => {
    const d = started();
    lasts(d, 'A', 10);
    expect(d.checkFinalError()).toBeUndefined();
    lasts(d, 'B', 365 * 20 + 10);
    expect(d.checkFinalError()).toBe('Gantt diagrams cannot last more than 20 years');
  });
});

describe('GanttDiagram tasks and groups', () => {
  it('updateStartingPoint is refused once a task exists (GanttDiagram.java:340-346)', () => {
    const d = newGantt();
    expect(d.updateStartingPoint(START).isOk()).toBe(true);
    expect(d.getMinDay().equals(START)).toBe(true);
    lasts(d, 'A', 1);
    const refused = d.updateStartingPoint(LocalDate.of(2021, 1, 1));
    expect(refused.getError()).toBe('Starting point must be set before task definition');
    expect(d.getMinDay().equals(START)).toBe(true);
  });

  it('getOrCreateTask returns the existing task for a known code and starts new ones at the minimum day (GanttDiagram.java:277-294)', () => {
    const d = started();
    const a = d.getOrCreateTask(TaskCode.fromId('A'), false);
    expect(d.getOrCreateTask(TaskCode.fromId('A'), false)).toBe(a);
    expect(a.getStart().equals(TimePoint.ofStartOfDay(START))).toBe(true);
    expect(d.getExistingTask('A')).toBe(a);
    expect(d.getExistingTask('Z')).toBeUndefined();
  });

  it('a task linked to the previous one starts at its end, through a constraint (GanttDiagram.java:267-275, 277-294, 301-308)', () => {
    const d = started();
    const a = lasts(d, 'A', 3);
    d.addSeparator('sep');
    const b = d.getOrCreateTask(TaskCode.fromId('B'), true);
    expect(b.getStart().equals(a.getEnd())).toBe(true);
    expect(
      b
        .getStart()
        .toDay()
        .equals(LocalDate.of(2020, 7, 4)),
    ).toBe(true);
  });

  it('groups nest and close, and closing with none open is an error (GanttDiagram.java:316-334)', () => {
    const d = started();
    expect(d.endGroup().getError()).toBe('No group to be closed');
    expect(d.addGroup(TaskCode.fromId('G1')).isOk()).toBe(true);
    expect(d.addGroup(TaskCode.fromId('G2')).isOk()).toBe(true);
    const inner = d.getOrCreateTask(TaskCode.fromId('T'), false);
    expect(d.endGroup().isOk()).toBe(true);
    expect(d.endGroup().isOk()).toBe(true);
    expect(d.endGroup().isOk()).toBe(false);
    expect(inner.getStart().equals(TimePoint.ofStartOfDay(START))).toBe(true);
  });

  it('addNote needs a task (GanttDiagram.java:486-495)', () => {
    const d = started();
    const note = Display.getWithNewlines(Pragma.createEmpty(), 'hello');
    expect(d.addNote(note, undefined).getError()).toBe('No task defined');
    lasts(d, 'A', 1);
    expect(d.addNote(note, undefined).isOk()).toBe(true);
  });

  it('deleteTask recolours the task white on black (GanttDiagram.java:476-479)', () => {
    const d = started();
    const a = lasts(d, 'A', 2);
    const before = drawSvg(d);
    expect(d.deleteTask(a).isOk()).toBe(true);
    const after = drawSvg(d);
    expect(after).not.toEqual(before);
    expect(after).toContain('fill="#FFF" style="stroke:none;"'); // HColors.WHITE centre
    expect(after).toContain('style="stroke:#000;stroke-width:1;"'); // HColors.BLACK border
  });

  it('getMaxDay and getMaxTimePoint run initMinMax (GanttDiagram.java:352-364)', () => {
    const d = started();
    lasts(d, 'A', 5);
    expect(d.getMinTimePoint().toDay().equals(START)).toBe(true);
    expect(d.getMaxDay().equals(LocalDate.of(2020, 7, 5))).toBe(true);
    expect(
      d
        .getMaxTimePoint()
        .toDay()
        .equals(LocalDate.of(2020, 7, 5)),
    ).toBe(true);
  });
});

describe('GanttDiagram resources', () => {
  it('affectResource parses name[:percentage]; 0 percent assigns nothing (GanttDiagram.java:378-392)', () => {
    const d = started();
    const a = lasts(d, 'A', 2);
    expect(d.affectResource(a, 'Bob:0')).toBe(false);
    expect(a.isAssignedTo(d.getResource('Bob'))).toBe(false);
    expect(d.affectResource(a, 'Bob:50')).toBe(true);
    expect(a.isAssignedTo(d.getResource('Bob'))).toBe(true);
    expect(d.affectResource(a, 'Alice')).toBe(true);
    expect(() => d.affectResource(a, ':')).toThrow('IllegalArgumentException');
  });

  it('getResource creates once and returns the registered one after (GanttDiagram.java:394-401)', () => {
    const d = started();
    const bob = d.getResource('Bob');
    expect(bob.getName()).toBe('Bob');
    expect(d.getResource('Bob')).toBe(bob);
  });

  it('getAllTasksForResource lists the draws of the tasks assigned to it (GanttDiagram.java:533-542)', () => {
    const d = started();
    const a = lasts(d, 'A', 2);
    lasts(d, 'B', 2);
    d.affectResource(a, 'Bob');
    // before drawing no TaskDraw is registered: Java's cast of null, rejected here
    expect(() => d.getAllTasksForResource(d.getResource('Bob'))).toThrow('ClassCastException');
    drawSvg(d);
    const draws = d.getAllTasksForResource(d.getResource('Bob'));
    expect(draws).toHaveLength(1);
    expect(draws[0]).toBeInstanceOf(TaskDrawRegular);
  });

  it('it/they are plain pointers (GanttDiagram.java:544-558)', () => {
    const d = started();
    const a = lasts(d, 'A', 2);
    expect(d.getIt()).toBeUndefined();
    d.setIt(a);
    expect(d.getIt()).toBe(a);
    const bob = d.getResource('Bob');
    d.setThey(bob);
    expect(d.getThey()).toBe(bob);
  });
});

describe('GanttDiagram calendar', () => {
  it('closeDayOfWeek / openDayOfWeek / closeDayAsDate / openDayAsDate, global and per task (GanttDiagram.java:222-247)', () => {
    const d = started();
    expect(d.daysInWeek()).toBe(7);
    d.closeDayOfWeek(DayOfWeek.SATURDAY, '');
    d.closeDayOfWeek(DayOfWeek.SUNDAY, '');
    expect(d.daysInWeek()).toBe(5);
    expect(d.isOpen(LocalDate.of(2020, 7, 4))).toBe(false);
    d.openDayOfWeek(DayOfWeek.SATURDAY, '');
    expect(d.isOpen(LocalDate.of(2020, 7, 4))).toBe(true);
    d.closeDayAsDate(LocalDate.of(2020, 7, 6), '');
    expect(d.isOpen(LocalDate.of(2020, 7, 6))).toBe(false);
    d.openDayAsDate(LocalDate.of(2020, 7, 6), '');
    expect(d.isOpen(LocalDate.of(2020, 7, 6))).toBe(true);
    d.closeDayAsDate(LocalDate.of(2020, 7, 7), 'T');
    d.openDayAsDate(LocalDate.of(2020, 7, 7), 'T');
    d.openDayOfWeek(DayOfWeek.SUNDAY, 'T');
    expect(d.isOpen(LocalDate.of(2020, 7, 7))).toBe(true);
  });

  it('getLoadPlanableForTask is the global plan mutated by the task plan (GanttDiagram.java:296-299)', () => {
    const d = started();
    d.closeDayOfWeek(DayOfWeek.SATURDAY, '');
    const plan = d.getLoadPlanableForTask('T');
    const at = (day: number): number =>
      plan
        .segmentAt(
          TimePoint.ofStartOfDay(LocalDate.of(2020, 7, day))
            .toLocalDateTime()
            .plusSeconds(1),
          'FORWARD',
        )
        .getValue()
        .getNumerator();
    expect(at(4)).toBe(0); // Saturday, closed
    expect(at(6)).toBeGreaterThan(0); // Monday, open
  });

  it('getExistingMoment falls back to the named days, case-insensitively, ending after the last (GanttDiagram.java:403-421)', () => {
    const d = started();
    expect(d.getExistingMoment('Holiday')).toBeUndefined();
    d.nameDay(LocalDate.of(2020, 7, 10), 'Holiday');
    d.nameDay(LocalDate.of(2020, 7, 8), 'holiday');
    d.nameDay(LocalDate.of(2020, 7, 9), 'Other');
    const moment = d.getExistingMoment('HOLIDAY')!;
    expect(
      moment
        .getStart()
        .toDay()
        .equals(LocalDate.of(2020, 7, 8)),
    ).toBe(true);
    expect(
      moment
        .getEnd()
        .toDay()
        .equals(LocalDate.of(2020, 7, 11)),
    ).toBe(true);
    const a = lasts(d, 'Holiday', 1);
    expect(d.getExistingMoment('Holiday')).toBe(a);
  });

  it('getThenDate is the latest of the start, the coloured days and the named days (GanttDiagram.java:249-260)', () => {
    const d = started();
    expect(d.getThenDate().toDay().equals(START)).toBe(true);
    d.colorDay(LocalDate.of(2020, 7, 12), COLORS.getColorOrWhite('red'));
    d.colorDay(DayOfWeek.MONDAY, COLORS.getColorOrWhite('red'));
    d.nameDay(LocalDate.of(2020, 7, 20), 'x');
    expect(
      d
        .getThenDate()
        .toDay()
        .equals(LocalDate.of(2020, 7, 20)),
    ).toBe(true);
  });

  it('durations add hours, minutes and seconds to the calendar day length (GanttDiagram.java:577-591)', () => {
    const d = started();
    expect(d.durationOfDays(2).getSeconds()).toBe(2 * 86_400);
    expect(d.durationOfDaysAndHours(1, 3).getSeconds()).toBe(86_400 + 3 * 3600);
    expect(d.durationOfDaysHoursMinutesSeconds(1, 2, 3, 4).getSeconds()).toBe(86_400 + 7200 + 180 + 4);
    expect(d.durationOfDays(0).equals(Duration.ZERO)).toBe(true);
    expect(d.daysInMonth()).toBe(30);
  });
});

describe('GanttDiagram today (clock seam, D3a)', () => {
  const noonJuly15: Clock = { nowMillis: () => Date.UTC(2020, 6, 15, 12), zone: 'UTC' };
  const lateChicago: Clock = { nowMillis: () => Date.UTC(2020, 6, 15, 3), zone: 'America/Chicago' };

  it('getToday is the clock local date at midnight, cached (GanttDiagram.java:455-461)', () => {
    expect(
      newGantt(noonJuly15)
        .getToday()
        .equals(LocalDate.of(2020, 7, 15)),
    ).toBe(true);
    expect(
      newGantt(lateChicago)
        .getToday()
        .equals(LocalDate.of(2020, 7, 14)),
    ).toBe(true);
  });

  it('setToday overrides the clock (GanttDiagram.java:471-474)', () => {
    const d = newGantt(noonJuly15);
    expect(d.setToday(LocalDate.of(2021, 1, 2)).isOk()).toBe(true);
    expect(d.getToday().equals(LocalDate.of(2021, 1, 2))).toBe(true);
  });

  it('setTodayColors falls back to the clock date when today is unset (GanttDiagram.java:463-469)', () => {
    const d = newGantt(noonJuly15);
    d.setTodayColors({ getCenter: () => COLORS.getColorOrWhite('red') } as never);
    expect(d.getToday().equals(LocalDate.of(2020, 7, 15))).toBe(true);
  });
});

describe('GanttDiagram display configuration', () => {
  it('shows start, end and duration by default and keeps ordinal order (GanttDiagram.java:672-686)', () => {
    const d = newGantt();
    expect(d.getDisplayedColumn()).toEqual([
      GanttTaskTableColumn.START,
      GanttTaskTableColumn.END,
      GanttTaskTableColumn.DURATION,
    ]);
    d.hideOrShowColumn(true, GanttTaskTableColumn.TASK);
    expect(d.getDisplayedColumn()[0]).toBe(GanttTaskTableColumn.TASK);
    d.hideOrShowColumn(false, GanttTaskTableColumn.END);
    expect(d.getDisplayedColumn()).toEqual([
      GanttTaskTableColumn.TASK,
      GanttTaskTableColumn.START,
      GanttTaskTableColumn.DURATION,
    ]);
    expect(d.hideOrShowColumn(true, undefined).isOk()).toBe(true);
    expect(d.getDisplayedColumn()).toHaveLength(3);
  });

  it('setters reach the drawing: print interval, footbox, vertical separator, hide closed (GanttDiagram.java:481-531, 560-562)', () => {
    const plain = started();
    lasts(plain, 'A', 20);
    const noFootbox = started();
    lasts(noFootbox, 'A', 20);
    noFootbox.setShowFootbox(false); // default true, DisplayConfigData.java:44
    expect(elementsOf(drawSvg(noFootbox)).length).toBeLessThan(elementsOf(drawSvg(plain)).length);

    const interval = started();
    lasts(interval, 'A', 20);
    interval.setPrintInterval(LocalDate.of(2020, 7, 5), LocalDate.of(2020, 7, 9));
    interval.setPrintScale(PrintScale.DAILY);
    expect(elementsOf(drawSvg(interval)).length).toBeLessThan(elementsOf(drawSvg(plain)).length);

    const separated = started();
    lasts(separated, 'A', 20);
    separated.addVerticalSeparatorBefore(LocalDate.of(2020, 7, 10));
    expect(drawSvg(separated)).not.toEqual(drawSvg(plain));
  });

  it('setTaskDefaultCompletion applies to tasks created after it (GanttDiagram.java:529-531, 277-294)', () => {
    const d = started();
    d.setTaskDefaultCompletion(40);
    const a = lasts(d, 'A', 2);
    expect(a.getCompletion()).toBe(40);
  });

  it('week number strategy, weekly header strategy and factor scale are accepted (GanttDiagram.java:138-140, 163-169, 510-513)', () => {
    const d = started();
    d.setWeekNumberStrategy(DayOfWeek.SUNDAY, 1);
    d.setHideClosed(true);
    lasts(d, 'A', 14);
    expect(elementsOf(drawSvg(d)).length).toBeGreaterThan(10);
  });
});

/** The protected halves of the diagram, reached through a cast (the Java fields are private to the class). */
interface Halves {
  timeBounds: { initMinMax: (...args: unknown[]) => void };
  weekConfig: { getWeeklyHeaderStrategy: () => string | undefined; getWeekStartingNumber: () => number };
  displayConfig: { isHideResourceFootbox: () => boolean };
}
const halves = (d: GanttDiagram): Halves => d as unknown as Halves;

describe('GanttDiagram residual branches (T5f)', () => {
  it('checkFinalError returns the message of an ImpossibleSolvingException and rethrows anything else (GanttDiagram.java:174-181)', () => {
    const d = started();
    const spy = vi.spyOn(halves(d).timeBounds, 'initMinMax').mockImplementation(() => {
      throw new ImpossibleSolvingException('no solution');
    });
    expect(d.checkFinalError()).toBe('no solution');
    spy.mockImplementation(() => {
      throw new Error('boom');
    });
    expect(() => d.checkFinalError()).toThrow('boom');
  });

  it('a task linked to the previous one with no task before it is created alone at the minimum day (GanttDiagram.java:277-294, 301-308)', () => {
    const d = started();
    const first = d.getOrCreateTask(TaskCode.fromId('First'), true);
    expect(first.getStart().equals(TimePoint.ofStartOfDay(START))).toBe(true);
    const second = d.getOrCreateTask(TaskCode.fromId('Second'), true);
    expect(second.getStart().equals(first.getEnd())).toBe(true);
  });

  it('getExistingMoment spans the min and max of every day carrying the name, whatever the HashMap order (GanttDiagram.java:403-436)', () => {
    const d = started();
    // sixty weekly days: past the HashMap's first resize the iteration order wraps around, so min/max see both
    // comparison outcomes (the order itself is TimePointHashMap's emulation of java.util.HashMap)
    const first = LocalDate.of(2020, 7, 1);
    for (let week = 0; week < 60; week++) d.nameDay(first.plusDays(7 * week), 'Holiday');
    d.nameDay(LocalDate.of(2020, 7, 2), 'Other');
    const moment = d.getExistingMoment('holiday')!;
    expect(moment.getStart().toDay().equals(first)).toBe(true);
    // end.increment(): the day after the last named day, 2020-07-01 + 413 days (GanttDiagram.java:416)
    expect(
      moment
        .getEnd()
        .toDay()
        .equals(first.plusDays(7 * 59 + 1)),
    ).toBe(true);
  });

  it('getExistingMoment compares names character by character: same length, other letters, no match (String.equalsIgnoreCase)', () => {
    const d = started();
    d.nameDay(LocalDate.of(2020, 7, 9), 'Hellday');
    expect(d.getExistingMoment('Holiday')).toBeUndefined();
    expect(
      d
        .getExistingMoment('HELLDAY')!
        .getStart()
        .toDay()
        .equals(LocalDate.of(2020, 7, 9)),
    ).toBe(true);
  });

  it('getThenDate ignores coloured and named days that are not after the current result (GanttDiagram.java:249-260)', () => {
    const d = started();
    d.colorDay(LocalDate.of(2020, 6, 20), COLORS.getColorOrWhite('red'));
    d.nameDay(LocalDate.of(2020, 6, 25), 'early');
    expect(d.getThenDate().toDay().equals(START)).toBe(true);
    d.colorDay(LocalDate.of(2020, 7, 12), COLORS.getColorOrWhite('red'));
    d.nameDay(LocalDate.of(2020, 7, 5), 'between');
    expect(
      d
        .getThenDate()
        .toDay()
        .equals(LocalDate.of(2020, 7, 12)),
    ).toBe(true);
  });

  it('getStyle of a parameter with no style is the NullPointerException of getMergedStyle (GanttDiagram.java:206-216)', () => {
    const d = started();
    // an empty builder matches nothing: StyleBuilder.getMergedStyle answers null
    vi.spyOn(d.getSkinParam(), 'getCurrentStyleBuilder').mockReturnValue(new StyleBuilder());
    expect(() => d.getStyle('task')).toThrow('NullPointerException: no style for root.element.ganttDiagram.task');
    expect(() => d.getStyle('task', 'line')).toThrow('root.element.ganttDiagram.task.line');
  });

  it('setWeeklyHeaderStrategy stores the strategy and the starting number (GanttDiagram.java:510-513)', () => {
    const d = started();
    d.setWeeklyHeaderStrategy(WeeklyHeaderStrategy.FROM_N, 5);
    expect(halves(d).weekConfig.getWeeklyHeaderStrategy()).toBe('FROM_N');
    expect(halves(d).weekConfig.getWeekStartingNumber()).toBe(5);
  });

  it('hideResourceFootbox succeeds and sets the flag (GanttDiagram.java:520-523)', () => {
    const d = started();
    expect(halves(d).displayConfig.isHideResourceFootbox()).toBe(false);
    expect(d.hideResourceFootbox().isOk()).toBe(true);
    expect(halves(d).displayConfig.isHideResourceFootbox()).toBe(true);
  });

  it('addWorkingTimeRange succeeds and shows up in the default plan (GanttDiagram.java:564-566, 572-575)', () => {
    const d = started();
    expect(d.addWorkingTimeRange(new TimeRange('08:00', '12:00')).isOk()).toBe(true);
    const s = d.getDefaultPlan().segmentAt(LocalDateTime.of(2020, 7, 1, 10, 0), TimeDirection.FORWARD);
    expect([s.startExclusive().toString(), s.endExclusive().toString(), s.getValue().toString()]).toEqual([
      '2020-07-01T08:00',
      '2020-07-01T12:00',
      '1',
    ]);
  });
});
