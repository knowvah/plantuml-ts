import { describe, expect, it, vi } from 'vitest';
import type { UGraphic } from '../../../src/core/klimt/UGraphic.js';
import { UTranslate } from '../../../src/core/klimt/UTranslate.js';
import { HColorSet } from '../../../src/core/klimt/color/HColorSet.js';
import { HorizontalAlignment } from '../../../src/core/klimt/geom/HorizontalAlignment.js';
import { newLocale } from '../../../src/core/utils/I18nTimeData.js';
import { TaskAttribute } from '../../../src/diagrams/gantt/core/TaskAttribute.js';
import { TaskInstant } from '../../../src/diagrams/gantt/core/TaskInstant.js';
import type { TaskImpl } from '../../../src/diagrams/gantt/core/TaskImpl.js';
import { GanttConstraint } from '../../../src/diagrams/gantt/GanttConstraint.js';
import type { GanttDiagram } from '../../../src/diagrams/gantt/GanttDiagram.js';
import { GanttDiagramMainBlock } from '../../../src/diagrams/gantt/GanttDiagramMainBlock.js';
import { GanttTaskTable } from '../../../src/diagrams/gantt/GanttTaskTable.js';
import { GanttTaskTableColumn } from '../../../src/diagrams/gantt/GanttTaskTableColumn.js';
import { LabelPosition } from '../../../src/diagrams/gantt/LabelPosition.js';
import { LabelStrategy } from '../../../src/diagrams/gantt/LabelStrategy.js';
import { changeLabel, type RecordedEvent } from '../../helpers/recording-ugraphic.js';
import { placed, recorded } from './draw/header/helpers/header-fixture.js';
import { day, resourceOf, styleBuilder, taskOf } from './draw/helpers/draw-fixture.js';
import { partsOf, sb, withTimelineBackground, type Parts, type SceneOptions } from './helpers/gantt-scene.js';
import { TimePoint } from '../../../src/diagrams/gantt/time/TimePoint.js';
import { StyleBuilder } from '../../../src/core/style/StyleBuilder.js';
import { Back } from '../../../src/core/klimt/Back.js';
import { paintOf } from '../../../src/diagrams/gantt/draw/header/TimeHeader.js';

// Expected values: ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttDiagramMainBlock.java:77-207.
// The expected drawing is the concatenation of the parts the Java draws, in the order of java:107-136, each
// under the translate the Java applies; the parts are the real components, so this pins order and offsets.

const EN = newLocale('en');
const SET = HColorSet.instance();
const COLUMNS = [GanttTaskTableColumn.TASK, GanttTaskTableColumn.START];
/** `margin` (java:153). */
const MARGIN = 20;
const diagram = { getDisplayedColumn: () => COLUMNS } as unknown as GanttDiagram;
const LEGACY_LEFT = new LabelStrategy(LabelPosition.LEGACY, HorizontalAlignment.LEFT);

interface Built {
  readonly parts: Parts;
  readonly main: GanttDiagramMainBlock;
  readonly table: GanttTaskTable;
  readonly tasks: readonly TaskImpl[];
}

function build(tasks: readonly TaskImpl[], options: SceneOptions = {}): Built {
  const parts = partsOf(tasks, options);
  const main = new GanttDiagramMainBlock(
    parts.timeBounds,
    parts.modelData,
    parts.registry,
    parts.displayConfig,
    parts.timelineStyle,
    diagram,
    parts.header,
    EN,
    sb,
  );
  // the table the main block built, rebuilt over the now-built registry (java:101-103)
  const table = new GanttTaskTable(
    parts.modelData,
    parts.timeBounds,
    parts.registry,
    parts.timelineStyle,
    parts.header.getFullHeaderHeight(sb),
    EN,
    sb,
    COLUMNS,
  );
  return { parts, main, table, tasks };
}

const total = (b: Built): number => b.parts.registry.getTotalHeightWithoutFooter();

function log(draw: (ug: UGraphic) => void): RecordedEvent[] {
  return recorded(draw);
}

/** What `drawU` must draw, part by part (java:107-136). */
function expectedLog(b: Built, barsWidth: number): RecordedEvent[] {
  const { parts, table } = b;
  const { registry, header, modelData, timeBounds, displayConfig } = parts;
  const t = total(b);
  return log((origin) => {
    table.drawU(origin, t);
    const ug = origin.apply(UTranslate.dx(table.getWidth()));
    header.drawTimeHeader(ug, t);
    for (const constraint of modelData.getConstraints()) {
      if (
        timeBounds.getPrintStart() !== undefined &&
        constraint.isHidden(
          TimePoint.ofStartOfDay(timeBounds.getMinDay()),
          TimePoint.ofEndOfDayMinusOneSecond(timeBounds.getMaxDay()),
        )
      )
        continue;
      constraint.getUDrawable(header.getTimeScale(), registry).drawU(ug);
    }
    for (const task of modelData.getTasks()) {
      if (timeBounds.isHidden(task)) continue;
      const draw = registry.getTaskDraw(task)!;
      draw.drawU(ug.apply(UTranslate.dy(draw.getY(sb).getCurrentValue())));
    }
    for (const task of modelData.getTasks()) {
      if (timeBounds.isHidden(task)) continue;
      const draw = registry.getTaskDraw(task)!;
      draw.drawTitle(ug.apply(UTranslate.dy(draw.getY(sb).getCurrentValue())), LEGACY_LEFT, 0, barsWidth);
    }
    if (!displayConfig.isHideResourceFootbox())
      for (const res of modelData.getResources()) {
        const draw = res.getResourceDraw()!;
        draw.drawU(ug.apply(UTranslate.dy(draw.getY())));
      }
    if (displayConfig.isShowFootbox()) header.drawTimeFooter(ug.apply(UTranslate.dy(t)));
  });
}

function scene(options: SceneOptions = {}) {
  const a = taskOf('A', day(4));
  const b = taskOf('B', day(6));
  const res = resourceOf('R');
  a.addResource(res, 100);
  const link = new GanttConstraint(
    SET,
    styleBuilder,
    new TaskInstant(a, TaskAttribute.END),
    new TaskInstant(b, TaskAttribute.START),
  );
  const built = build([a, b], { ...options, constraints: [link], resources: [res] });
  return { ...built, a, b, res, link };
}

const BARS = 7 * 16; // 7 day cells of 16 px (timeline day FontSize 10 * 1.6); no task label overflows
/** The header/footer band rectangles are as wide as the bars column (java:122-123). */
const FULL_BAND = `URectangle(${String(BARS)},`;

describe('GanttDiagramMainBlock.calculateDimension (java:152-158)', () => {
  it('width = table + titles (0) + bars + the 20 px margin; height = the layout total', () => {
    const { main, table, parts } = scene();
    const dim = main.calculateDimension(sb);
    expect(dim.getWidth()).toBe(table.getWidth() + 0 + BARS + MARGIN);
    expect(dim.getHeight()).toBe(parts.registry.getTotalHeightWithoutFooter() + parts.header.getTimeFooterHeight(sb));
  });

  it('without the footbox the height has no footer', () => {
    const { main, parts } = scene({ showFootbox: false });
    expect(main.calculateDimension(sb).getHeight()).toBe(parts.registry.getTotalHeightWithoutFooter());
  });

  it('the dimension is memoized per StringBounder class (TextBlockMemoized)', () => {
    const { main } = scene();
    expect(main.calculateDimension(sb)).toBe(main.calculateDimension(sb));
  });
});

describe('GanttDiagramMainBlock.drawU (java:107-136)', () => {
  it('draws table, header, constraints, task bars, titles, resources and footer in that order', () => {
    const b = scene();
    const actual = log((ug) => {
      b.main.drawU(ug);
    });
    expect(actual).toEqual(expectedLog(b, BARS));
    const texts = placed(actual)
      .filter((p) => p.shape.startsWith('UText'))
      .map((p) => p.shape);
    for (const cell of ['UText(Task)', 'UText(Start)', 'UText(A)', 'UText(B)']) expect(texts).toContain(cell);
  });

  it('the body is shifted right by the table width: the header starts there (java:109-110)', () => {
    const b = scene();
    const headerOnly = log((ug) => {
      b.parts.header.drawTimeHeader(ug.apply(UTranslate.dx(b.table.getWidth())), total(b));
    });
    const actual = log((ug) => {
      b.main.drawU(ug);
    });
    const first = placed(headerOnly)[0]!;
    expect(placed(actual).some((p) => p.shape === first.shape && p.x === first.x && p.y === first.y)).toBe(true);
    expect(b.table.getWidth()).toBeGreaterThan(0);
  });

  it('a transparent timeline background draws no band rectangles (java:121)', () => {
    const b = scene();
    const actual = placed(
      log((ug) => {
        b.main.drawU(ug);
      }),
    );
    expect(actual.filter((p) => p.paint.some((t) => t.startsWith('back(#ABCDEF')))).toEqual([]);
  });

  it('an opaque timeline background fills the header band, and the footer band under the footbox (java:121-130)', () => {
    const b = scene({ styleBuilder: withTimelineBackground('#ABCDEF') });
    const actual = placed(
      log((ug) => {
        b.main.drawU(ug);
      }),
    );
    const backLabel = changeLabel(new Back(paintOf(SET.getColorOrWhite('#ABCDEF'))));
    const bands = actual.filter((p) => p.paint.includes(backLabel) && p.shape.startsWith('URectangle'));
    const fullWidth = BARS;
    expect(bands.map((p) => [p.shape, p.x, p.y])).toEqual([
      [`URectangle(${String(fullWidth)},${String(b.parts.header.getTimeHeaderHeight(sb))})`, b.table.getWidth(), 0],
      [
        `URectangle(${String(fullWidth)},${String(b.parts.header.getTimeFooterHeight(sb))})`,
        b.table.getWidth(),
        total(b),
      ],
    ]);
  });

  it('an opaque background has no footer band when the footbox is off (java:125)', () => {
    const b = scene({ styleBuilder: withTimelineBackground('#ABCDEF'), showFootbox: false });
    const actual = placed(
      log((ug) => {
        b.main.drawU(ug);
      }),
    );
    const backLabel = changeLabel(new Back(paintOf(SET.getColorOrWhite('#ABCDEF'))));
    expect(actual.filter((p) => p.paint.includes(backLabel) && p.shape.startsWith('URectangle'))).toHaveLength(1);
  });

  it('no footbox: the footer is not drawn (java:134-135)', () => {
    const b = scene({ showFootbox: false });
    const actual = log((ug) => {
      b.main.drawU(ug);
    });
    expect(actual).toEqual(expectedLog(b, BARS));
    const withFooter = scene({ showFootbox: true });
    const footerLog = log((ug) => {
      withFooter.main.drawU(ug);
    });
    expect(footerLog.length).toBeGreaterThan(actual.length);
  });

  it('hideResourceFootbox: the resource rows are not drawn (java:132-133)', () => {
    const shown = scene();
    const hidden = scene({ hideResourceFootbox: true });
    const hiddenLog = log((ug) => {
      hidden.main.drawU(ug);
    });
    const shownLog = log((ug) => {
      shown.main.drawU(ug);
    });
    expect(hiddenLog).toEqual(expectedLog(hidden, BARS));
    expect(shownLog.length).toBeGreaterThan(hiddenLog.length);
  });

  it('with a printStart, a constraint outside [min, max] is not drawn; without one it always is (java:173-177)', () => {
    const early = taskOf('E', day(1)); // March 1: before the minimum day (March 4)
    const b = taskOf('B', day(6));
    const link = new GanttConstraint(
      SET,
      styleBuilder,
      new TaskInstant(early, TaskAttribute.END),
      new TaskInstant(b, TaskAttribute.START),
    );
    const noPrintStart = build([early, b], { constraints: [link] });
    const withPrintStart = build([early, b], { constraints: [link], printStart: day(4).toDay() });
    const arrowPaths = (blt: Built): number =>
      placed(
        log((ug) => {
          blt.main.drawU(ug);
        }),
      ).filter((p) => p.shape === 'UPath').length;
    // the arrow is one UPath; each task bar draws its own UPath-free rectangles, so the difference is the arrow
    expect(arrowPaths(noPrintStart) - arrowPaths(withPrintStart)).toBeGreaterThanOrEqual(1);
  });

  it('hidden tasks have neither bar nor title (java:164-165, :188-189)', () => {
    const early = taskOf('E', day(1));
    const b = taskOf('B', day(6));
    const built = build([early, b], { printStart: day(4).toDay() });
    expect(built.parts.timeBounds.isHidden(early)).toBe(true);
    const actual = log((ug) => {
      built.main.drawU(ug);
    });
    expect(actual).toEqual(expectedLog(built, BARS));
  });

  it('an exception in the body is not caught: it reaches the error page (java:137-149 not ported)', () => {
    const b = scene();
    vi.spyOn(b.parts.header, 'drawTimeHeader').mockImplementation(() => {
      throw new Error('boom');
    });
    expect(() =>
      log((ug) => {
        b.main.drawU(ug);
      }),
    ).toThrow('boom');
  });

  it('a visible task with no TaskDraw is a NullPointerException in the bars pass (java:164-168)', () => {
    const b = scene();
    const late = taskOf('late', day(5));
    b.parts.modelData.putTask(late.getCode(), late);
    expect(() =>
      log((ug) => {
        b.main.drawU(ug);
      }),
    ).toThrow('NullPointerException');
  });

  it('a resource with no ResourceDraw is a NullPointerException in the resource pass (java:198-205)', () => {
    const b = scene({ showFootbox: false });
    const lone = resourceOf('lone');
    b.parts.modelData.putResource('lone', lone);
    expect(lone.getResourceDraw()).toBeUndefined();
    expect(() =>
      log((ug) => {
        b.main.drawU(ug);
      }),
    ).toThrow('NullPointerException');
  });

  it('a gradient timeline background is opaque when its first colour is: both bands are filled (java:121, HColorLinearGradient.java:341-343)', () => {
    const b = scene({ styleBuilder: withTimelineBackground('#ABCDEF-#123456') });
    const actual = placed(
      log((ug) => {
        b.main.drawU(ug);
      }),
    );
    const bands = actual.filter((p) => p.paint.some((t) => t.startsWith('back(')) && p.shape.startsWith(FULL_BAND));
    expect(bands.map((p) => [p.shape, p.x, p.y])).toEqual([
      [`URectangle(${String(BARS)},${String(b.parts.header.getTimeHeaderHeight(sb))})`, b.table.getWidth(), 0],
      [`URectangle(${String(BARS)},${String(b.parts.header.getTimeFooterHeight(sb))})`, b.table.getWidth(), total(b)],
    ]);
  });

  it('no timeline style left to merge, after the table drew, is a NullPointerException (java:112-113 via getMergedStyle)', () => {
    // the table resolves the same style while drawing, so count the skin-param reads the table makes first
    const probe = scene();
    const real = probe.parts.timelineStyle.getSkinParam.bind(probe.parts.timelineStyle);
    const counting = vi.spyOn(probe.parts.timelineStyle, 'getSkinParam').mockImplementation(real);
    probe.table.getWidth();
    log((ug) => {
      probe.table.drawU(ug, total(probe));
    });
    const tableReads = counting.mock.calls.length;

    const b = scene();
    const skin = b.parts.timelineStyle.getSkinParam();
    const empty = { ...skin, getCurrentStyleBuilder: () => new StyleBuilder() } as unknown as typeof skin;
    let reads = 0;
    vi.spyOn(b.parts.timelineStyle, 'getSkinParam').mockImplementation(() => (++reads > tableReads ? empty : skin));
    expect(() =>
      log((ug) => {
        b.main.drawU(ug);
      }),
    ).toThrow('NullPointerException: no style for gantt timeline');
    expect(reads).toBe(tableReads + 1);
  });

  it('a task whose draw vanishes between the bars pass and the titles pass is a NullPointerException (java:184-188)', () => {
    const b = scene();
    let barsDrawn = 0;
    let vanished = false;
    for (const task of [b.a, b.b]) {
      const draw = b.parts.registry.getTaskDraw(task)!;
      const original = draw.drawU.bind(draw);
      vi.spyOn(draw, 'drawU').mockImplementation((ug) => {
        original(ug);
        // both bars are drawn: the titles pass (java:184-196) is next
        vanished = ++barsDrawn === 2;
      });
    }
    const lookup = b.parts.registry.getTaskDraw.bind(b.parts.registry);
    vi.spyOn(b.parts.registry, 'getTaskDraw').mockImplementation((task) => (vanished ? undefined : lookup(task)));
    expect(() =>
      log((ug) => {
        b.main.drawU(ug);
      }),
    ).toThrow('NullPointerException: no TaskDraw for a visible task');
  });
});
