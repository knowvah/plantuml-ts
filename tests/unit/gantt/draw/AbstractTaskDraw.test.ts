import { describe, expect, it } from 'vitest';
import { HColorSet } from '../../../../src/core/klimt/color/HColorSet.js';
import { HColorSimple } from '../../../../src/core/klimt/color/HColorSimple.js';
import { Display } from '../../../../src/core/klimt/creole/Display.js';
import { MeasurerStringBounder } from '../../../../src/core/measurer-bounder.js';
import { RealUtils } from '../../../../src/core/real/RealUtils.js';
import { Pragma } from '../../../../src/core/skin/Pragma.js';
import { StyleBuilder } from '../../../../src/core/style/StyleBuilder.js';
import { GSide } from '../../../../src/diagrams/gantt/core/GSide.js';
import { TaskDrawRegistryData } from '../../../../src/diagrams/gantt/data/TaskDrawRegistryData.js';
import { mergedStyleOf } from '../../../../src/diagrams/gantt/draw/AbstractTaskDraw.js';
import { TaskDrawRegular } from '../../../../src/diagrams/gantt/draw/TaskDrawRegular.js';
import { CenterBorderColor } from '../../../../src/diagrams/gantt/lang/CenterBorderColor.js';
import { StyleSignatureBasic } from '../../../../src/core/style/StyleSignatureBasic.js';
import { skinStorageDump, styleFromDump } from '../../core/style/helpers/style-fixture.js';
import { placed, recorded } from './header/helpers/header-fixture.js';
import {
  day,
  measurer,
  skinParam,
  styleBuilder,
  taskOf,
  TASK_FONT_SIZE,
  TASK_MARGIN,
  timeScale,
} from './helpers/draw-fixture.js';

// Expected values: ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/AbstractTaskDraw.java
// (line numbers cited per test), driven through TaskDrawRegular, its simplest concrete subclass.
// Style (plantuml.skin ganttDiagram): task Margin 2, Padding 0, RoundCorner 0, FontSize 11;
// line #181818, background #E2E2F0 (probed from the dumped skin storage); note FontSize 9, background #FEFFDD.

const sb = new MeasurerStringBounder(measurer);
const TEXT_H = measurer.measure('X', { family: 'SansSerif', size: TASK_FONT_SIZE }).height;
// AtomText.java:180: a text atom is at least 10 high (`if (h < 10) h = 10`), so the 9pt note is 10.
const NOTE_H = Math.max(measurer.measure('a note', { family: 'SansSerif', size: 9 }).height, 10);
const LINE = '#181818';
const BACK = '#E2E2F0';
// Opale.java:57-58: marginX1 6 + marginX2 15 wide, 2 * marginY 5 high
const OPALE_MARGIN_W = 21;
const OPALE_MARGIN_H = 10;

function regular(
  label = 'Task',
  opts: { builder?: StyleBuilder; registry?: TaskDrawRegistryData; task?: ReturnType<typeof taskOf> } = {},
): TaskDrawRegular {
  return new TaskDrawRegular(
    HColorSet.instance(),
    timeScale,
    RealUtils.createOrigin(),
    label,
    day(4),
    day(7),
    false,
    false,
    skinParam(),
    opts.task ?? taskOf(label),
    opts.registry ?? new TaskDrawRegistryData(),
    [],
    opts.builder ?? styleBuilder,
  );
}

/** The draws' only coloured shapes, as `shape fore back` triples of their paint chain. */
function paints(draw: TaskDrawRegular): string[][] {
  return placed(recorded((ug) => draw.drawU(ug))).map((p) => [...p.paint]);
}

describe('AbstractTaskDraw sizes (AbstractTaskDraw.java:145-163)', () => {
  it('getFullHeightTask = margin.top + shape height + margin.bottom (java:155-159)', () => {
    expect(regular().getFullHeightTask(sb)).toBe(TASK_MARGIN + TEXT_H + TASK_MARGIN);
  });

  it('getTitleWidth = margin.left + title width + margin.right (java:145-149)', () => {
    const textW = measurer.measure('Task', { family: 'SansSerif', size: TASK_FONT_SIZE }).width;
    expect(regular().getTitleWidth(sb)).toBeCloseTo(TASK_MARGIN + textW + TASK_MARGIN, 9);
  });
});

describe('AbstractTaskDraw colours (AbstractTaskDraw.java:123-135, 94-101)', () => {
  /** An `unstarted` task style with a red line and background, so the completion shading is visible. */
  function withUnstarted(): StyleBuilder {
    const unstarted = styleFromDump({
      snames: ['root', 'element', 'ganttDiagram', 'task', 'unstarted'],
      level: -1,
      star: false,
      stereotypes: [],
      values: { LineColor: ['#FF0000', null, 1000], BackGroundColor: ['#FF0000', null, 1000] },
    });
    return new StyleBuilder().muteStyle([...skinStorageDump().map(styleFromDump), unstarted]);
  }

  it('completion 100 paints the regular style colours (HColors.unlinear -> color2, HColors.java:156-167)', () => {
    const draw = regular('Task', { builder: withUnstarted() });
    draw.setColorsAndCompletion(undefined, 100, undefined, undefined, undefined);
    const [first] = paints(draw);
    expect(first).toEqual([`fore(${LINE})`, `back(${BACK})`, 'fore(#00000000)']);
  });

  it('completion 0 paints the unstarted style colours (HColors.unlinear -> color1)', () => {
    const draw = regular('Task', { builder: withUnstarted() });
    draw.setColorsAndCompletion(undefined, 0, undefined, undefined, undefined);
    const [first] = paints(draw);
    // then RectangleTask paints the undone bar with `back(documentBackground)` (RectangleTask.java, completion 0)
    expect(first).toEqual(['fore(#FF0000)', 'back(#FF0000)', 'fore(#00000000)', 'back(#FFFFFF)']);
  });

  it('completion 40 shades between the unstarted and the regular colour (java:123-128)', () => {
    const draw = regular('Task', { builder: withUnstarted() });
    draw.setColorsAndCompletion(undefined, 40, undefined, undefined, undefined);
    const set = HColorSet.instance();
    const shaded = HColorSimple.unlinear(
      set.getColorOrWhite('#FF0000') as HColorSimple,
      set.getColorOrWhite(BACK) as HColorSimple,
      40,
    );
    const [first] = paints(draw);
    expect(first?.[1]).toBe(`back(${shaded.asString()})`);
    expect(first?.[1]).not.toBe(`back(${BACK})`);
  });

  it('explicit colours win over the style colours, the border defaulting to the centre (java:229-235 of Regular)', () => {
    const draw = regular();
    const set = HColorSet.instance();
    draw.setColorsAndCompletion(
      new CenterBorderColor(set.getColorOrWhite('#00FF00'), set.getColorOrWhite('#0000FF')),
      100,
      undefined,
      undefined,
      undefined,
    );
    const [first] = paints(draw);
    expect(first).toEqual(['back(#00FF00)', 'fore(#0000FF)', 'fore(#00000000)']);
  });

  it('colours that are not ok (no centre) fall back to the style colours (java:231-235 of Regular)', () => {
    const draw = regular();
    draw.setColorsAndCompletion(new CenterBorderColor(undefined, undefined), 100, undefined, undefined, undefined);
    const [first] = paints(draw);
    expect(first).toEqual([`fore(${LINE})`, `back(${BACK})`, 'fore(#00000000)']);
  });
});

describe('AbstractTaskDraw rows (AbstractTaskDraw.java:161-193)', () => {
  it('getY answers its own Real when the task has no row (java:166-170)', () => {
    const y = RealUtils.createOrigin();
    const draw = new TaskDrawRegular(
      HColorSet.instance(),
      timeScale,
      y,
      'A',
      day(4),
      day(7),
      false,
      false,
      skinParam(),
      taskOf('A'),
      new TaskDrawRegistryData(),
      [],
      styleBuilder,
    );
    expect(draw.getY(sb)).toBe(y);
    expect(draw.getTrueRow()).toBeUndefined();
  });

  it("a task put in the row of another takes that draw's Real (java:161-170)", () => {
    const registry = new TaskDrawRegistryData();
    const taskA = taskOf('A');
    const drawA = regular('A', { registry, task: taskA });
    registry.putTaskDraw(taskA, drawA);
    const taskB = taskOf('B');
    taskB.putInSameRowAs(taskA);
    const drawB = regular('B', { registry, task: taskB });

    expect(drawB.getTrueRow()).toBe(drawA);
    expect(drawB.getY(sb)).toBe(drawA.getY(sb));
  });

  it('getY(side): top, bottom, and the middle of the shape, past the top margin (java:178-193)', () => {
    const draw = regular();
    const y1 = TASK_MARGIN; // margin.top + y.getCurrentValue() (0)
    const y2 = y1 + TEXT_H;
    expect(draw.getY(sb, GSide.TOP_LEFT)).toBe(y1);
    expect(draw.getY(sb, GSide.TOP_RIGHT)).toBe(y1);
    expect(draw.getY(sb, GSide.BOTTOM_LEFT)).toBe(y2);
    expect(draw.getY(sb, GSide.BOTTOM_RIGHT)).toBe(y2);
    expect(draw.getY(sb, GSide.LEFT)).toBe((y1 + y2) / 2);
    expect(draw.getY(sb, GSide.RIGHT)).toBe((y1 + y2) / 2);
  });

  it('getTask answers the task (java:173-175) and toString names it (java:90-92)', () => {
    const task = taskOf('Named');
    const draw = regular('Named', { task });
    expect(draw.getTask()).toBe(task);
    expect(draw.toString()).toContain(String(task));
    expect(draw.toString().startsWith('TaskDrawRegular ')).toBe(true);
  });
});

describe('AbstractTaskDraw notes (AbstractTaskDraw.java:215-239)', () => {
  const noted = (): TaskDrawRegular => {
    const draw = regular();
    draw.setColorsAndCompletion(
      undefined,
      100,
      undefined,
      Display.getWithNewlines(Pragma.createEmpty(), 'a note'),
      undefined,
    );
    return draw;
  };

  it('without a note drawNote draws nothing (java:233-237)', () => {
    const draw = regular();
    expect(placed(recorded((ug) => draw.drawU(ug))).map((p) => p.shape)).not.toContain('UPath');
  });

  it('the note is an Opale at (start, margin.top + shape + margin.bottom) filled with the note style (java:215-231)', () => {
    const draw = noted();
    const log = placed(recorded((ug) => draw.drawU(ug)));
    const outline = log.find((p) => p.shape === 'UPath');
    expect(outline).toMatchObject({ x: 30, y: 2 * TASK_MARGIN + TEXT_H });
    expect(outline?.paint).toEqual(['back(#FEFFDD)', `fore(${LINE})`, 'stroke(0,0,0.5)']);
    const text = log.find((p) => p.shape === 'UText(a note)');
    // text at (marginX1 6, marginY 5) inside the Opale (Opale.java:56,58,134)
    expect(text?.x).toBe(30 + 6);
  });

  it('the note block is sized by its text plus the Opale margins (Opale.java:90-98)', () => {
    const draw = noted();
    const textW = measurer.measure('a note', { family: 'SansSerif', size: 9 }).width;
    const print = draw.getFingerPrintNote(sb);
    expect(print?.toString()).toBe(
      `X=(30.0->${String(30 + textW + OPALE_MARGIN_W).replace(/^(\d+)$/, '$1.0')}) Y=(${String(2 * TASK_MARGIN + TEXT_H).replace(/^(\d+)$/, '$1.0')} ->${String(2 * TASK_MARGIN + TEXT_H + NOTE_H + OPALE_MARGIN_H).replace(/^(\d+)$/, '$1.0')})`,
    );
  });

  it('mergedStyleOf throws when no style matches the signature (java NullPointerException)', () => {
    const empty = new StyleBuilder();
    expect(() => mergedStyleOf(StyleSignatureBasic.of('root', 'element', 'ganttDiagram', 'task'), empty)).toThrow(
      'NullPointerException',
    );
  });
});
