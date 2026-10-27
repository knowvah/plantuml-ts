import { describe, expect, it } from 'vitest';
import { HColorSet } from '../../../../src/core/klimt/color/HColorSet.js';
import { HorizontalAlignment } from '../../../../src/core/klimt/geom/HorizontalAlignment.js';
import { MeasurerStringBounder } from '../../../../src/core/measurer-bounder.js';
import { RealUtils } from '../../../../src/core/real/RealUtils.js';
import { DayOfWeek } from '../../../../src/core/time/DayOfWeek.js';
import { LocalDate } from '../../../../src/core/time/LocalDate.js';
import { Url } from '../../../../src/core/url/Url.js';
import { GArrowType } from '../../../../src/diagrams/gantt/core/GArrowType.js';
import { GSide } from '../../../../src/diagrams/gantt/core/GSide.js';
import { LabelPosition } from '../../../../src/diagrams/gantt/LabelPosition.js';
import { LabelStrategy } from '../../../../src/diagrams/gantt/LabelStrategy.js';
import { DayCalendarData } from '../../../../src/diagrams/gantt/data/DayCalendarData.js';
import { TaskDrawRegistryData } from '../../../../src/diagrams/gantt/data/TaskDrawRegistryData.js';
import { TaskDrawRegular } from '../../../../src/diagrams/gantt/draw/TaskDrawRegular.js';
import { CenterBorderColor } from '../../../../src/diagrams/gantt/lang/CenterBorderColor.js';
import type { TimePoint } from '../../../../src/diagrams/gantt/time/TimePoint.js';
import { Display } from '../../../../src/core/klimt/creole/Display.js';
import { Pragma } from '../../../../src/core/skin/Pragma.js';
import { placed, recorded } from './header/helpers/header-fixture.js';
import {
  DAY_PX,
  day,
  measurer,
  skinParam,
  styleBuilder,
  taskOf,
  TASK_FONT_SIZE,
  TASK_MARGIN,
  timeScale,
} from './helpers/draw-fixture.js';

// Expected values: ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawRegular.java
// (line numbers cited per test). Style (plantuml.skin ganttDiagram): task Margin 2, Padding 0, RoundCorner 0,
// FontSize 11. The time scale is 10 px per day from 2024-03-01, so day(4) sits at x = 30 and day(7) at x = 60.

const sb = new MeasurerStringBounder(measurer);
const SANS = { family: 'SansSerif', size: TASK_FONT_SIZE };
const TEXT_H = measurer.measure('Task', SANS).height;
/** The UText baseline `DeterministicMeasurer` gives 11pt: 0.7777... * 11 (header-fixture.ts BASELINE_DAY at 10pt). */
const BASELINE = 8.555555555555555;
const START = 30; // day(4)
const END = 60; // day(7)
const FIRST_COLUMN_LEFT = new LabelStrategy(LabelPosition.FIRST_COLUMN, HorizontalAlignment.LEFT);
const FIRST_COLUMN_RIGHT = new LabelStrategy(LabelPosition.FIRST_COLUMN, HorizontalAlignment.RIGHT);
const LAST_COLUMN = new LabelStrategy(LabelPosition.LAST_COLUMN, HorizontalAlignment.LEFT);
const LEGACY = new LabelStrategy(LabelPosition.LEGACY, HorizontalAlignment.LEFT);

function make(
  opts: {
    label?: string;
    start?: TimePoint;
    end?: TimePoint;
    oddStart?: boolean;
    oddEnd?: boolean;
    constraints?: readonly GanttConstraint[];
    task?: ReturnType<typeof taskOf>;
  } = {},
): TaskDrawRegular {
  const label = opts.label ?? 'Task';
  return new TaskDrawRegular(
    HColorSet.instance(),
    timeScale,
    RealUtils.createOrigin(),
    label,
    opts.start ?? day(4),
    opts.end ?? day(7),
    opts.oddStart ?? false,
    opts.oddEnd ?? false,
    skinParam(),
    opts.task ?? taskOf(label),
    new TaskDrawRegistryData(),
    opts.constraints ?? [],
    styleBuilder,
  );
}

type GanttConstraint = ConstructorParameters<typeof TaskDrawRegular>[11][number];

const rightArrow = (value: boolean): GanttConstraint =>
  ({ isThereRightArrow: () => value }) as unknown as GanttConstraint;

describe('TaskDrawRegular sizes (java:101-106, 213-229)', () => {
  it('shape height = padding + title height + padding (java:101-106)', () => {
    expect(make().getShapeHeight(sb)).toBe(TEXT_H);
  });

  it('fingerprint = (start, y, end - start, full height) (java:213-217)', () => {
    expect(make().getFingerPrint(sb).toString()).toBe('X=(30.0->60.0) Y=(0.0 ->15.0)');
  });

  it('getHeightMax without a note is the full height; with one it adds the note below (java:206-210)', () => {
    const draw = make();
    expect(draw.getHeightMax(sb)).toBe(TEXT_H + 2 * TASK_MARGIN);
    draw.setColorsAndCompletion(
      undefined,
      100,
      undefined,
      Display.getWithNewlines(Pragma.createEmpty(), 'n'),
      undefined,
    );
    // yNote 15 + Opale height (AtomText.java:180 min text height 10, + 2 * marginY 5)
    expect(draw.getHeightMax(sb)).toBe(15 + 20);
  });

  it('no fingerprint for a missing note (java:220-222)', () => {
    expect(make().getFingerPrintNote(sb)).toBeUndefined();
  });
});

describe('TaskDrawRegular.drawU / drawShape (java:192-196, 271-306)', () => {
  it('draws the bar inside the margins: x = start + margin.left, y = margin.top, width = end - start - 2 margins', () => {
    const log = placed(recorded((ug) => make().drawU(ug)));
    const bars = log.filter((p) => p.shape.startsWith('URectangle'));
    expect(bars.length).toBeGreaterThan(0);
    for (const bar of bars) {
      expect(bar.shape).toBe(`URectangle(${END - START - 2 * TASK_MARGIN},${TEXT_H})`);
      expect([bar.x, bar.y]).toEqual([START + TASK_MARGIN, TASK_MARGIN]);
    }
  });

  it('a paused day splits the bar into two segments around it (java:287-293)', () => {
    const task = taskOf('Task');
    task.addPause(LocalDate.of(2024, 3, 5));
    const log = placed(recorded((ug) => make({ task }).drawU(ug)));
    const bars = log.filter((p) => p.shape.startsWith('URectangle'));
    // pause = day 5 -> [40, 50]; bar [32, 58] -> segments [32, 40] and [50, 58]; the background rect of every
    // segment but the last is one wider (RectangleTask.java:190-192 `widthBack++`)
    expect(bars.map((b) => [b.x, b.shape])).toEqual([
      [32, 'URectangle(9,11)'],
      [50, 'URectangle(8,11)'],
    ]);
  });

  it('a closed weekday of the default plan is a pause too (java:94-97)', () => {
    const calendar = new DayCalendarData();
    calendar.getOpenClose().close(DayOfWeek.SUNDAY); // 2024-03-03 is a Sunday
    const task = taskOf('Task', day(1), calendar);
    const draw = make({ task, start: day(1), end: day(5) });
    const bars = placed(recorded((ug) => draw.drawU(ug))).filter((p) => p.shape.startsWith('URectangle'));
    // Sunday day 3 -> [20, 30]; bar [2, 38] -> segments [2, 20] and [30, 38]; the first is one wider (RectangleTask.java:190-192)
    expect(bars.map((b) => `${b.x}:${b.shape}`)).toEqual(['2:URectangle(19,11)', '30:URectangle(8,11)']);
  });

  it('wraps the bar in startUrl / closeUrl when the task has a link (java:276-278, 304-305)', () => {
    const draw = make();
    draw.setColorsAndCompletion(undefined, 100, new Url('http://x.test/', null, null), undefined, undefined);
    const log = recorded((ug) => draw.drawU(ug));
    expect(log[0]).toEqual({ startUrl: 'http://x.test/' });
    expect(log.at(-1)).toEqual({ closeUrl: true });
  });

  it('explicit colours apply to the bar (java:231-235)', () => {
    const draw = make();
    const set = HColorSet.instance();
    draw.setColorsAndCompletion(
      new CenterBorderColor(set.getColorOrWhite('#00FF00'), undefined),
      100,
      undefined,
      undefined,
      undefined,
    );
    const [bar] = placed(recorded((ug) => draw.drawU(ug)));
    expect(bar?.paint[0]).toBe('back(#00FF00)');
    expect(bar?.paint[1]).toBe('fore(#00FF00)');
  });
});

describe('TaskDrawRegular.drawTitle (java:108-139)', () => {
  const titleAt = (
    draw: TaskDrawRegular,
    strategy: LabelStrategy,
    colTitles = 200,
    colBars = 400,
  ): [number, number] => {
    const log = placed(recorded((ug) => draw.drawTitle(ug, strategy, colTitles, colBars)));
    const text = log.find((p) => p.shape.startsWith('UText'));
    return [text?.x ?? Number.NaN, text?.y ?? Number.NaN];
  };
  const textW = measurer.measure('Task', SANS).width;

  it('first column, left aligned: x = margin.left (java:119-121)', () => {
    expect(titleAt(make(), FIRST_COLUMN_LEFT)).toEqual([TASK_MARGIN, TASK_MARGIN + BASELINE]);
  });

  it('first column, right aligned: x = colTitles - width - margin.right (java:117-118)', () => {
    const [x] = titleAt(make(), FIRST_COLUMN_RIGHT, 200);
    expect(x).toBeCloseTo(200 - textW - TASK_MARGIN, 9);
  });

  it('last column: x = colBars + margin.left (java:123-125)', () => {
    expect(titleAt(make(), LAST_COLUMN, 200, 400)[0]).toBe(402);
  });

  it('inside the bar when it is wide enough: x = start + 6 (java:130-136)', () => {
    // bar [30, 190]: pos1 = 36, pos2 = 184; 148 > text width
    expect(titleAt(make({ end: day(20) }), LEGACY)[0]).toBe(START + 6);
  });

  it('past the bar end when it is too narrow: x = end - 6 + 8 (java:134, getOutPosition :145-151)', () => {
    // bar [30, 60]: pos2 = 54; 24 < text width -> 54 + 8
    expect(titleAt(make(), LEGACY)[0]).toBe(END - 6 + 8);
  });

  it("18 past pos2 when an arrow leaves the bar's right end (java:147-148)", () => {
    expect(titleAt(make({ constraints: [rightArrow(true)] }), LEGACY)[0]).toBe(END - 6 + 18);
  });

  it('only a constraint answering true counts (java:152-158)', () => {
    expect(titleAt(make({ constraints: [rightArrow(false), rightArrow(false)] }), LEGACY)[0]).toBe(END - 6 + 8);
  });
});

describe('TaskDrawRegular.getLabelOverflow (java:161-185)', () => {
  const textW = measurer.measure('Task', SANS).width;

  it('0 when the label fits inside the bar', () => {
    expect(make({ end: day(20) }).getLabelOverflow(sb, 100)).toBe(0);
  });

  it('the label end past barsWidth when it sits after a narrow bar (java:168-175)', () => {
    // bar [30, 60]: label out at 54 + 8, ends at 62 + width
    expect(make().getLabelOverflow(sb, 70)).toBeCloseTo(62 + textW - 70, 9);
    expect(make().getLabelOverflow(sb, 1000)).toBe(0);
  });

  it('the arrow pushes the label 10 px further (java:147-148)', () => {
    expect(make({ constraints: [rightArrow(true)] }).getLabelOverflow(sb, 70)).toBeCloseTo(72 + textW - 70, 9);
  });

  it('a note wider than the bars widens the overflow (java:177-182)', () => {
    const draw = make({ end: day(20) });
    draw.setColorsAndCompletion(
      undefined,
      100,
      undefined,
      Display.getWithNewlines(Pragma.createEmpty(), 'a note'),
      undefined,
    );
    const noteW = measurer.measure('a note', { family: 'SansSerif', size: 9 }).width + 21;
    // noteEnd = start + note width; barsWidth 40 < that
    expect(draw.getLabelOverflow(sb, 40)).toBeCloseTo(START + noteW - 40, 9);
  });
});

describe('TaskDrawRegular.getX (java:239-269)', () => {
  const x = (side: GSide, arrow: GArrowType = GArrowType.INCOMING, draw = make()): number => draw.getX(sb, side, arrow);

  it('LEFT / RIGHT are the bar ends (java:243-246)', () => {
    expect(x(GSide.LEFT)).toBe(START);
    expect(x(GSide.RIGHT)).toBe(END);
  });

  it('TOP_LEFT / BOTTOM_LEFT are 8 in from the start (java:247)', () => {
    expect(x(GSide.TOP_LEFT)).toBe(START + 8);
    expect(x(GSide.BOTTOM_LEFT)).toBe(START + 8);
  });

  it('TOP_LEFT falls back to the middle of the start day when 8 in is past the end (java:248-249)', () => {
    const narrow = make({ end: day(4) }); // end = start = 30
    expect(x(GSide.TOP_LEFT, GArrowType.INCOMING, narrow)).toBe((START + START + DAY_PX) / 2);
  });

  it('TOP_RIGHT / BOTTOM_RIGHT are 8 in from the end (java:251-253)', () => {
    expect(x(GSide.TOP_RIGHT)).toBe(END - 8);
    expect(x(GSide.BOTTOM_RIGHT)).toBe(END - 8);
  });

  it('an outgoing arrow moves LEFT in and RIGHT in by margin.left (java:258-266)', () => {
    expect(x(GSide.LEFT, GArrowType.OUTGOING)).toBe(START + TASK_MARGIN);
    expect(x(GSide.RIGHT, GArrowType.OUTGOING)).toBe(END - TASK_MARGIN);
    expect(x(GSide.TOP_LEFT, GArrowType.OUTGOING)).toBe(START + 8);
  });
});

describe('TaskDrawRegular.getX, other sides (java:243-269)', () => {
  it('TOP_RIGHT keeps end - 8 on a bar narrower than 8 (java:251-254)', () => {
    // end = start = 30: end - 8 = 22 < start + width (40) -> the same 22 again
    expect(make({ end: day(4) }).getX(sb, GSide.TOP_RIGHT, GArrowType.INCOMING)).toBe(START - 8);
  });

  it('an unknown side is an IllegalArgumentException (java:268)', () => {
    expect(() => make().getX(sb, {} as GSide, GArrowType.INCOMING)).toThrow('IllegalArgumentException');
  });
});

describe('TaskDrawRegular constructor (java:84-99)', () => {
  it('needs a TaskImpl: Java casts the task (java:93-94)', () => {
    const other = { getAllPaused: () => [] } as unknown as ConstructorParameters<typeof TaskDrawRegular>[9];
    expect(
      () =>
        new TaskDrawRegular(
          HColorSet.instance(),
          timeScale,
          RealUtils.createOrigin(),
          'x',
          day(4),
          day(5),
          false,
          false,
          skinParam(),
          other,
          new TaskDrawRegistryData(),
          [],
          styleBuilder,
        ),
    ).toThrow('ClassCastException');
  });
});
