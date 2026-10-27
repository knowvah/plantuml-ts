import { describe, expect, it } from 'vitest';
import { Back } from '../../../src/core/klimt/Back.js';
import { Fore } from '../../../src/core/klimt/Fore.js';
import type { UChange } from '../../../src/core/klimt/UChange.js';
import type { UGraphic } from '../../../src/core/klimt/UGraphic.js';
import { UStroke } from '../../../src/core/klimt/UStroke.js';
import type { UShape } from '../../../src/core/klimt/UShape.js';
import { HColorSet } from '../../../src/core/klimt/color/HColorSet.js';
import type { StringBounder } from '../../../src/core/klimt/font/StringBounder.js';
import { UPath } from '../../../src/core/klimt/shape/UPath.js';
import type { UPolygon } from '../../../src/core/klimt/shape/UPolygon.js';
import { MeasurerStringBounder } from '../../../src/core/measurer-bounder.js';
import { RealUtils } from '../../../src/core/real/RealUtils.js';
import { StyleSignatureBasic } from '../../../src/core/style/StyleSignatureBasic.js';
import type { GArrowType } from '../../../src/diagrams/gantt/core/GArrowType.js';
import type { GSide } from '../../../src/diagrams/gantt/core/GSide.js';
import { TaskAttribute } from '../../../src/diagrams/gantt/core/TaskAttribute.js';
import { TaskInstant } from '../../../src/diagrams/gantt/core/TaskInstant.js';
import { MomentImpl } from '../../../src/diagrams/gantt/core/MomentImpl.js';
import { TaskDrawRegistryData } from '../../../src/diagrams/gantt/data/TaskDrawRegistryData.js';
import type { TaskDraw } from '../../../src/diagrams/gantt/draw/TaskDraw.js';
import { GanttArrow } from '../../../src/diagrams/gantt/GanttArrow.js';
import { day, measurer, styleBuilder, taskOf, timeScale } from './draw/helpers/draw-fixture.js';

// Expected values: ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttArrow.java:63-168.
// The task draws are stand-ins answering fixed numbers per (side, arrow type), so every expected point is
// the number the Java reads at that call.

const START = TaskAttribute.START;
const END = TaskAttribute.END;
const SET = HColorSet.instance();
const style = StyleSignatureBasic.of('root', 'element', 'ganttDiagram', 'arrow').getMergedStyle(styleBuilder)!;
/** plantuml.skin:402-405 `ganttDiagram { arrow { LineThickness 1.5 } }`. */
const ARROW_THICKNESS = 1.5;

interface Drawn {
  changes: UChange[];
  shape: UShape;
}

class Recorder {
  constructor(
    readonly drawn: Drawn[],
    readonly changes: UChange[] = [],
  ) {}
  apply(change: UChange): UGraphic {
    return new Recorder(this.drawn, [...this.changes, change]) as unknown as UGraphic;
  }
  draw(shape: UShape): void {
    this.drawn.push({ changes: this.changes, shape });
  }
  getStringBounder(): StringBounder {
    return new MeasurerStringBounder(measurer);
  }
}

interface Spec {
  /** `getX(side, type)`. */
  readonly x: Record<string, number>;
  /** `getY(side)`. */
  readonly y: Record<string, number>;
  /** `getY(sb).getCurrentValue()`. */
  readonly row: number;
}

/** A `TaskDraw` that answers `spec` and logs every `getX` / `getY(side)` request. */
function fakeDraw(spec: Spec, calls: string[], name: string): TaskDraw {
  return {
    getX: (_sb: StringBounder, side: GSide, type: GArrowType) => {
      calls.push(`${name}.getX(${side.name()},${type})`);
      return spec.x[`${side.name()}:${type}`] ?? 0;
    },
    getY: (_sb: StringBounder, side?: GSide) => {
      if (side === undefined) return RealUtils.createOrigin().addFixed(spec.row);
      calls.push(`${name}.getY(${side.name()})`);
      return spec.y[side.name()] ?? 0;
    },
  } as unknown as TaskDraw;
}

interface Scene {
  readonly calls: string[];
  readonly drawn: Drawn[];
}

function drawArrow(sourceAttr: TaskAttribute, destAttr: TaskAttribute, from: Spec, to: Spec, sameRow = false): Scene {
  const a = taskOf('A', day(4));
  const b = taskOf('B', day(10));
  if (sameRow) b.putInSameRowAs(a);
  const registry = new TaskDrawRegistryData();
  const calls: string[] = [];
  registry.putTaskDraw(a, fakeDraw(from, calls, 'A'));
  registry.putTaskDraw(b, fakeDraw(to, calls, 'B'));
  const arrow = new GanttArrow(
    SET,
    style,
    timeScale,
    new TaskInstant(a, sourceAttr),
    new TaskInstant(b, destAttr),
    registry,
    styleBuilder,
  );
  const drawn: Drawn[] = [];
  arrow.drawU(new Recorder(drawn) as unknown as UGraphic);
  return { calls, drawn };
}

/** The `[x, y]` operands of the path's move/line segments, without the final close. */
function pathPoints(scene: Scene): number[][] {
  const path = scene.drawn[0]?.shape as UPath;
  expect(path).toBeInstanceOf(UPath);
  return [...path].filter((s) => s.coord.length === 2).map((s) => [...s.coord]);
}

function headPoints(scene: Scene): { x: number; y: number }[] {
  return [...(scene.drawn[1]?.shape as UPolygon).getPoints()];
}

describe('GanttArrow constructor sides (java:73-92)', () => {
  const none: Spec = { x: {}, y: {}, row: 0 };

  it('END -> START on different rows: BOTTOM_RIGHT then LEFT (java:73-75)', () => {
    const { calls } = drawArrow(END, START, none, none);
    expect(calls).toEqual([
      'A.getX(BOTTOM_RIGHT,OUTGOING)',
      'A.getY(BOTTOM_RIGHT)',
      'B.getX(LEFT,INCOMING)',
      'B.getY(LEFT)',
      // every number is 0: y2 < y1 is false (no reverse) and `x2 > x1 + 6` is false (the detour branch, java:136)
      'A.getX(RIGHT,OUTGOING)',
      'A.getY(RIGHT)',
    ]);
  });

  it('END -> START in the same row: RIGHT then LEFT (java:74)', () => {
    const { calls } = drawArrow(END, START, none, none, true);
    expect(calls.slice(0, 4)).toEqual([
      'A.getX(RIGHT,OUTGOING)',
      'A.getY(RIGHT)',
      'B.getX(LEFT,INCOMING)',
      'B.getY(LEFT)',
    ]);
  });

  it('END -> END: RIGHT then RIGHT (java:76-78)', () => {
    const { calls } = drawArrow(END, END, none, none);
    expect(calls).toEqual(['A.getX(RIGHT,OUTGOING)', 'A.getY(RIGHT)', 'B.getX(RIGHT,INCOMING)', 'B.getY(RIGHT)']);
  });

  it('START -> START: LEFT then LEFT (java:79-81)', () => {
    const { calls } = drawArrow(START, START, none, none);
    expect(calls).toEqual(['A.getX(LEFT,OUTGOING)', 'A.getY(LEFT)', 'B.getX(LEFT,INCOMING)', 'B.getY(LEFT)']);
  });

  it('START -> END on different rows: BOTTOM_LEFT then RIGHT (java:82-84)', () => {
    const { calls } = drawArrow(START, END, none, none);
    expect(calls).toEqual([
      'A.getX(BOTTOM_LEFT,OUTGOING)',
      'A.getY(BOTTOM_LEFT)',
      'B.getX(RIGHT,INCOMING)',
      'B.getY(RIGHT)',
    ]);
  });

  it('START -> END in the same row: LEFT then RIGHT (java:83)', () => {
    const { calls } = drawArrow(START, END, none, none, true);
    expect(calls.slice(0, 2)).toEqual(['A.getX(LEFT,OUTGOING)', 'A.getY(LEFT)']);
  });

  it('an attribute that is neither START nor END is an IllegalArgumentException (java:85-87)', () => {
    const odd = { getAttribute: () => 'MIDDLE' } as unknown as TaskInstant;
    expect(() => new GanttArrow(SET, style, timeScale, odd, odd, new TaskDrawRegistryData(), styleBuilder)).toThrow(
      'IllegalArgumentException',
    );
  });
});

describe('GanttArrow.drawU paths (java:109-168)', () => {
  it('bottom start + LEFT end, far enough: down then right, head on the left side (java:131-135)', () => {
    const from: Spec = { x: { 'BOTTOM_RIGHT:OUTGOING': 100 }, y: { BOTTOM_RIGHT: 50 }, row: 0 };
    const to: Spec = { x: { 'LEFT:INCOMING': 150 }, y: { LEFT: 80 }, row: 0 };
    const scene = drawArrow(END, START, from, to);
    // x2 (150) > x1 + 6 (106): (x1,y1) (x1,y2) (x2,y2), the last pulled 3 px short by GArrows (GArrows.java:72-79)
    expect(pathPoints(scene)).toEqual([
      [100, 50],
      [100, 80],
      [147, 80],
    ]);
    expect(headPoints(scene)).toEqual([
      { x: 146, y: 76 },
      { x: 150, y: 80 },
      { x: 146, y: 84 },
      { x: 146, y: 76 },
    ]);
  });

  it('bottom start + LEFT end, too close: the six-point detour around the start (java:136-146)', () => {
    const from: Spec = {
      x: { 'BOTTOM_RIGHT:OUTGOING': 100, 'RIGHT:OUTGOING': 110 },
      y: { BOTTOM_RIGHT: 50, RIGHT: 45 },
      row: 0,
    };
    const to: Spec = { x: { 'LEFT:INCOMING': 104 }, y: { LEFT: 80 }, row: 70 };
    const scene = drawArrow(END, START, from, to);
    // x2 (104) <= x1 + 6 (106): x1 = RIGHT.x (110), y1 = RIGHT.y (45), y1b = end row (70)
    expect(pathPoints(scene)).toEqual([
      [110, 45],
      [116, 45],
      [116, 70],
      [96, 70],
      [96, 80],
      [101, 80],
    ]);
  });

  it('bottom start going up: y1 is read again from the reversed side (java:123-124)', () => {
    const from: Spec = { x: { 'BOTTOM_RIGHT:OUTGOING': 100 }, y: { BOTTOM_RIGHT: 50, TOP_RIGHT: 20 }, row: 0 };
    const to: Spec = { x: { 'LEFT:INCOMING': 150 }, y: { LEFT: 30 }, row: 0 };
    const scene = drawArrow(END, START, from, to);
    expect(scene.calls).toContain('A.getY(TOP_RIGHT)');
    expect(pathPoints(scene)).toEqual([
      [100, 20],
      [100, 30],
      [147, 30],
    ]);
  });

  it('RIGHT to RIGHT: out to max(x1, x2) + 8 and back (java:147-152)', () => {
    const from: Spec = { x: { 'RIGHT:OUTGOING': 100 }, y: { RIGHT: 50 }, row: 0 };
    const to: Spec = { x: { 'RIGHT:INCOMING': 130 }, y: { RIGHT: 80 }, row: 0 };
    const scene = drawArrow(END, END, from, to);
    expect(pathPoints(scene)).toEqual([
      [100, 50],
      [138, 50],
      [138, 80],
      [133, 80],
    ]);
    // atEnd RIGHT: the head points left at the unpatched end (GArrows.java:94-100)
    expect(headPoints(scene)[1]).toEqual({ x: 130, y: 80 });
  });

  it('LEFT to LEFT: out to min(x1, x2) - 8 and back (java:153-158)', () => {
    const from: Spec = { x: { 'LEFT:OUTGOING': 60 }, y: { LEFT: 50 }, row: 0 };
    const to: Spec = { x: { 'LEFT:INCOMING': 40 }, y: { LEFT: 80 }, row: 0 };
    const scene = drawArrow(START, START, from, to);
    expect(pathPoints(scene)).toEqual([
      [60, 50],
      [32, 50],
      [32, 80],
      [37, 80],
    ]);
  });

  it('every other pairing is the plain L: (x1,y1) (x1,y2) (x2,y2) (java:159-163)', () => {
    const from: Spec = { x: { 'LEFT:OUTGOING': 60 }, y: { LEFT: 50 }, row: 0 };
    const to: Spec = { x: { 'RIGHT:INCOMING': 120 }, y: { RIGHT: 80 }, row: 0 };
    const scene = drawArrow(START, END, from, to, true);
    expect(pathPoints(scene)).toEqual([
      [60, 50],
      [60, 80],
      [123, 80],
    ]);
  });

  it('applies the style stroke and line colour before drawing (java:110, GArrows.java:57-70)', () => {
    const from: Spec = { x: { 'RIGHT:OUTGOING': 100 }, y: { RIGHT: 50 }, row: 0 };
    const to: Spec = { x: { 'RIGHT:INCOMING': 130 }, y: { RIGHT: 80 }, row: 0 };
    const scene = drawArrow(END, END, from, to);
    const [fore, stroke] = scene.drawn[0]!.changes;
    expect(fore).toBeInstanceOf(Fore);
    expect(stroke).toBeInstanceOf(UStroke);
    expect((stroke as UStroke).getThickness()).toBe(ARROW_THICKNESS);
    // the head is filled with the style's LineColor (java:118)
    const headChanges = scene.drawn[1]!.changes;
    const back = headChanges[headChanges.length - 1] as Back;
    expect(back).toBeInstanceOf(Back);
    expect(back.getBackColor()).toEqual((fore as Fore).getColor());
  });

  it('draws nothing when an end has no TaskDraw (java:112-113)', () => {
    const a = taskOf('A', day(4));
    const b = taskOf('B', day(10));
    const registry = new TaskDrawRegistryData();
    const arrow = new GanttArrow(
      SET,
      style,
      timeScale,
      new TaskInstant(a, END),
      new TaskInstant(b, START),
      registry,
      styleBuilder,
    );
    const drawn: Drawn[] = [];
    arrow.drawU(new Recorder(drawn) as unknown as UGraphic);
    expect(drawn).toEqual([]);
  });

  it('draws nothing when an end is not a Task (java:95-107)', () => {
    const a = taskOf('A', day(4));
    const registry = new TaskDrawRegistryData();
    registry.putTaskDraw(a, fakeDraw({ x: {}, y: {}, row: 0 }, [], 'A'));
    const moment = new MomentImpl(day(5), day(6));
    const arrow = new GanttArrow(
      SET,
      style,
      timeScale,
      new TaskInstant(a, END),
      new TaskInstant(moment, START),
      registry,
      styleBuilder,
    );
    const drawn: Drawn[] = [];
    arrow.drawU(new Recorder(drawn) as unknown as UGraphic);
    expect(drawn).toEqual([]);
  });

  it('draws nothing when the source is not a Task (java:95-100)', () => {
    const b = taskOf('B', day(10));
    const registry = new TaskDrawRegistryData();
    registry.putTaskDraw(b, fakeDraw({ x: {}, y: {}, row: 0 }, [], 'B'));
    const moment = new MomentImpl(day(5), day(6));
    const arrow = new GanttArrow(
      SET,
      style,
      timeScale,
      new TaskInstant(moment, END),
      new TaskInstant(b, START),
      registry,
      styleBuilder,
    );
    const drawn: Drawn[] = [];
    arrow.drawU(new Recorder(drawn) as unknown as UGraphic);
    expect(drawn).toEqual([]);
  });
});
