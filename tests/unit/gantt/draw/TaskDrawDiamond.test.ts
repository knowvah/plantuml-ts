import { describe, expect, it } from 'vitest';
import { HColorSet } from '../../../../src/core/klimt/color/HColorSet.js';
import { StyleBuilder } from '../../../../src/core/style/StyleBuilder.js';
import { CenterBorderColor } from '../../../../src/diagrams/gantt/lang/CenterBorderColor.js';
import { skinStorageDump, styleFromDump } from '../../core/style/helpers/style-fixture.js';
import { Display } from '../../../../src/core/klimt/creole/Display.js';
import { HorizontalAlignment } from '../../../../src/core/klimt/geom/HorizontalAlignment.js';
import type { UPolygon } from '../../../../src/core/klimt/shape/UPolygon.js';
import { MeasurerStringBounder } from '../../../../src/core/measurer-bounder.js';
import { RealUtils } from '../../../../src/core/real/RealUtils.js';
import { Pragma } from '../../../../src/core/skin/Pragma.js';
import { Url } from '../../../../src/core/url/Url.js';
import { GArrowType } from '../../../../src/diagrams/gantt/core/GArrowType.js';
import { GSide } from '../../../../src/diagrams/gantt/core/GSide.js';
import { LabelPosition } from '../../../../src/diagrams/gantt/LabelPosition.js';
import { LabelStrategy } from '../../../../src/diagrams/gantt/LabelStrategy.js';
import { TaskDrawRegistryData } from '../../../../src/diagrams/gantt/data/TaskDrawRegistryData.js';
import { TaskDrawDiamond } from '../../../../src/diagrams/gantt/draw/TaskDrawDiamond.js';
import { placed, recorded } from './header/helpers/header-fixture.js';
import {
  MILESTONE_PADDING,
  ShapeCapture,
  TASK_FONT_SIZE,
  TASK_MARGIN,
  day,
  measurer,
  skinParam,
  styleBuilder,
  taskOf,
  timeScale,
} from './helpers/draw-fixture.js';

// Expected values: ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/draw/TaskDrawDiamond.java
// (line numbers cited per test). Style (plantuml.skin ganttDiagram): milestone Margin 2, Padding 3, FontSize 11,
// line and background black. 10 px per day from 2024-03-01: day(4) is at x = 30 and one day is 10 wide.

const sb = new MeasurerStringBounder(measurer);
const SANS = { family: 'SansSerif', size: TASK_FONT_SIZE };
const TEXT_H = measurer.measure('Done', SANS).height;
const TEXT_W = measurer.measure('Done', SANS).width;
// java:103-108: (int) 11.0 = 11, odd -> 10
const DIAMOND = 10;
const BASELINE = 8.555555555555555; // 11pt UText baseline, see TaskDrawRegular.test.ts
const START = 30;

function make(display?: string): TaskDrawDiamond {
  const task = taskOf('Done');
  task.setDisplay(display);
  return new TaskDrawDiamond(
    HColorSet.instance(),
    timeScale,
    RealUtils.createOrigin(),
    'Done',
    day(4),
    task,
    new TaskDrawRegistryData(),
    styleBuilder,
    skinParam(),
  );
}

describe('TaskDrawDiamond sizes (java:93-113)', () => {
  it('shape height is the larger of the title and the diamond (java:93-101)', () => {
    // shape height = full height without the two margins (AbstractTaskDraw.java:155-159)
    expect(make().getFullHeightTask(sb) - 2 * TASK_MARGIN).toBe(Math.max(TEXT_H, DIAMOND));
  });

  it('full height adds the milestone margins (AbstractTaskDraw.java:155-159)', () => {
    expect(make().getFullHeightTask(sb)).toBe(TASK_MARGIN + TEXT_H + TASK_MARGIN);
  });

  it('fingerprint mirrors the Java argument order: (start, y, start + h, y + h) as (x, y, width, height) (java:228-233)', () => {
    // h = 15: width = 30 + 15, height = 0 + 15
    expect(make().getFingerPrint(sb).toString()).toBe('X=(30.0->75.0) Y=(0.0 ->15.0)');
  });

  it('a milestone has no note fingerprint, even with a note (java:223-226)', () => {
    const draw = make();
    draw.setColorsAndCompletion(
      undefined,
      100,
      undefined,
      Display.getWithNewlines(Pragma.createEmpty(), 'n'),
      undefined,
    );
    expect(draw.getFingerPrintNote(sb)).toBeUndefined();
  });

  it('getHeightMax: the full height, or down to the bottom of the note (java:85-91)', () => {
    const draw = make();
    expect(draw.getHeightMax(sb)).toBe(15);
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
});

describe('TaskDrawDiamond.drawU (java:178-208, 235-244)', () => {
  it('without a display string draws the diamond polygon at (start, margin.top) (java:187-197, 235-244)', () => {
    const capture = new ShapeCapture();
    make().drawU(capture);
    expect(capture.drawn).toHaveLength(1);
    const [diamond] = capture.drawn;
    expect([diamond?.x, diamond?.y]).toEqual([START, TASK_MARGIN]);
    const polygon = diamond?.shape as UPolygon;
    expect(polygon.getPoints().map((p) => [p.x, p.y])).toEqual([
      [5, 0],
      [10, 5],
      [5, 10],
      [0, 5],
    ]);
  });

  it('the diamond is filled with the milestone colours (java:210-216)', () => {
    const [diamond] = placed(recorded((ug) => make().drawU(ug)));
    expect(diamond?.paint).toEqual(['fore(#000000)', 'back(#000000)']);
  });

  it('with a display string draws that text instead of the diamond (java:198-203)', () => {
    const log = placed(recorded((ug) => make('Shipped').drawU(ug)));
    expect(log.map((p) => p.shape)).toEqual(['UText(Shipped)']);
    expect([log[0]?.x, log[0]?.y]).toEqual([START, TASK_MARGIN + BASELINE]);
  });

  it('wraps the shape in startUrl / closeUrl (java:181-182, 205-206)', () => {
    const draw = make();
    draw.setColorsAndCompletion(undefined, 100, new Url('http://x.test/', null, null), undefined, undefined);
    const log = recorded((ug) => draw.drawU(ug));
    expect(log[0]).toEqual({ startUrl: 'http://x.test/' });
    expect(log.at(-1)).toEqual({ closeUrl: true });
  });

  it('draws the note under the milestone at (start, margin + shape + margin) (java:180)', () => {
    const draw = make();
    draw.setColorsAndCompletion(
      undefined,
      100,
      undefined,
      Display.getWithNewlines(Pragma.createEmpty(), 'n'),
      undefined,
    );
    const outline = placed(recorded((ug) => draw.drawU(ug))).find((p) => p.shape === 'UPath');
    expect([outline?.x, outline?.y]).toEqual([START, 15]);
  });
});

describe('TaskDrawDiamond.drawTitle (java:111-143)', () => {
  const titleAt = (strategy: LabelStrategy, colTitles = 200, colBars = 400): [number, number] => {
    const log = placed(recorded((ug) => make().drawTitle(ug, strategy, colTitles, colBars)));
    const text = log.find((p) => p.shape.startsWith('UText'));
    return [text?.x ?? Number.NaN, text?.y ?? Number.NaN];
  };

  it('legacy: right of the diamond, x = x2 - delta / 2 + padding.left (java:134-139)', () => {
    // x2 = 40, delta = 40 - 30 - 10 = 0
    expect(titleAt(new LabelStrategy(LabelPosition.LEGACY, HorizontalAlignment.LEFT))).toEqual([
      START + 10 + MILESTONE_PADDING,
      TASK_MARGIN + BASELINE,
    ]);
  });

  it('first column, left: margin.left (java:127-129)', () => {
    expect(titleAt(new LabelStrategy(LabelPosition.FIRST_COLUMN, HorizontalAlignment.LEFT))[0]).toBe(TASK_MARGIN);
  });

  it('first column, right: colTitles - width - margin.right (java:125-126)', () => {
    expect(titleAt(new LabelStrategy(LabelPosition.FIRST_COLUMN, HorizontalAlignment.RIGHT))[0]).toBeCloseTo(
      200 - TEXT_W - TASK_MARGIN,
      9,
    );
  });

  it('last column: colBars + margin.left (java:130-131)', () => {
    expect(titleAt(new LabelStrategy(LabelPosition.LAST_COLUMN, HorizontalAlignment.LEFT))[0]).toBe(402);
  });
});

describe('TaskDrawDiamond.getLabelOverflow / getTitleWidth (java:151-176, AbstractTaskDraw.java:145-149)', () => {
  it('the label starts at x2 + padding.left and overflows barsWidth by its end (java:160-169)', () => {
    // labelStart = 40 + 3 = 43
    expect(make().getLabelOverflow(sb, 50)).toBeCloseTo(43 + TEXT_W - 50, 9);
    expect(make().getLabelOverflow(sb, 1000)).toBe(0);
  });

  it('a note wider than barsWidth widens the overflow (java:171-175)', () => {
    const draw = make();
    draw.setColorsAndCompletion(
      undefined,
      100,
      undefined,
      Display.getWithNewlines(Pragma.createEmpty(), 'a note'),
      undefined,
    );
    const noteW = measurer.measure('a note', { family: 'SansSerif', size: 9 }).width + 21;
    expect(draw.getLabelOverflow(sb, 40)).toBeCloseTo(START + noteW - 40, 9);
  });

  it('title width adds the margins (AbstractTaskDraw.java:145-149)', () => {
    expect(make().getTitleWidth(sb)).toBeCloseTo(TASK_MARGIN + TEXT_W + TASK_MARGIN, 9);
  });
});

describe('TaskDrawDiamond, colours and fonts (java:103-108, 210-216)', () => {
  it('explicit colours apply to the diamond (java:211-212)', () => {
    const draw = make();
    const set = HColorSet.instance();
    draw.setColorsAndCompletion(
      new CenterBorderColor(set.getColorOrWhite('#00FF00'), undefined),
      100,
      undefined,
      undefined,
      undefined,
    );
    const [diamond] = placed(recorded((ug) => draw.drawU(ug)));
    expect(diamond?.paint).toEqual(['back(#00FF00)', 'fore(#00FF00)']);
  });

  it('an even font size is the diamond height as is (java:104-107)', () => {
    const even = styleFromDump({
      snames: ['root', 'element', 'ganttDiagram', 'milestone'],
      level: -1,
      star: false,
      stereotypes: [],
      values: { FontSize: ['12', null, 1000] },
    });
    const builder = new StyleBuilder().muteStyle([...skinStorageDump().map(styleFromDump), even]);
    const task = taskOf('Done');
    const draw = new TaskDrawDiamond(
      HColorSet.instance(),
      timeScale,
      RealUtils.createOrigin(),
      'Done',
      day(4),
      task,
      new TaskDrawRegistryData(),
      builder,
      skinParam(),
    );
    const capture = new ShapeCapture();
    draw.drawU(capture);
    expect((capture.drawn[0]?.shape as UPolygon).getPoints().map((p) => [p.x, p.y])).toEqual([
      [6, 0],
      [12, 6],
      [6, 12],
      [0, 6],
    ]);
  });

  it('a note inside the bars does not widen the overflow (java:171-175)', () => {
    const draw = make();
    draw.setColorsAndCompletion(
      undefined,
      100,
      undefined,
      Display.getWithNewlines(Pragma.createEmpty(), 'n'),
      undefined,
    );
    expect(draw.getLabelOverflow(sb, 10_000)).toBe(0);
  });
});

describe('TaskDrawDiamond.getX (java:246-264)', () => {
  const x = (side: GSide, arrow: GArrowType = GArrowType.INCOMING): number => make().getX(sb, side, arrow);

  it('LEFT, RIGHT and the middle of the day (java:248-254)', () => {
    expect(x(GSide.LEFT)).toBe(START);
    expect(x(GSide.RIGHT)).toBe(START + 10);
    expect(x(GSide.TOP_LEFT)).toBe(START + 5);
    expect(x(GSide.BOTTOM_RIGHT)).toBe(START + 5);
  });

  it('an outgoing arrow is pulled half a diamond in (java:256-262)', () => {
    expect(x(GSide.LEFT, GArrowType.OUTGOING)).toBe(START + DIAMOND / 2);
    expect(x(GSide.RIGHT, GArrowType.OUTGOING)).toBe(START + 10 - DIAMOND / 2);
    expect(x(GSide.TOP_LEFT, GArrowType.OUTGOING)).toBe(START + 5);
  });
});

describe('TaskDrawDiamond.getY (java:266-281)', () => {
  it('the 1-argument overload is the row Real (AbstractTaskDraw.java:166-170)', () => {
    expect(make().getY(sb).getCurrentValue()).toBe(0);
  });

  it('without a display string every side is the middle of the diamond: y1 + diamond / 2 (java:277-278)', () => {
    expect(make().getY(sb, GSide.TOP_LEFT)).toBe(TASK_MARGIN + DIAMOND / 2);
    expect(make().getY(sb, GSide.BOTTOM_LEFT)).toBe(TASK_MARGIN + DIAMOND / 2);
  });

  it('with a display string it is the middle of the shape: (y1 + y2) / 2 (java:280)', () => {
    expect(make('Shipped').getY(sb, GSide.LEFT)).toBe((TASK_MARGIN + TASK_MARGIN + TEXT_H) / 2);
  });
});
