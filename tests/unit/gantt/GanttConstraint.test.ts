import { describe, expect, it } from 'vitest';
import { Fore } from '../../../src/core/klimt/Fore.js';
import type { UChange } from '../../../src/core/klimt/UChange.js';
import type { UGraphic } from '../../../src/core/klimt/UGraphic.js';
import { UStroke } from '../../../src/core/klimt/UStroke.js';
import type { UShape } from '../../../src/core/klimt/UShape.js';
import { HColorSimple } from '../../../src/core/klimt/color/HColorSimple.js';
import { HColorSet } from '../../../src/core/klimt/color/HColorSet.js';
import type { StringBounder } from '../../../src/core/klimt/font/StringBounder.js';
import { MeasurerStringBounder } from '../../../src/core/measurer-bounder.js';
import { RealUtils } from '../../../src/core/real/RealUtils.js';
import { LinkDecor } from '../../../src/core/decoration/LinkDecor.js';
import { TaskAttribute } from '../../../src/diagrams/gantt/core/TaskAttribute.js';
import { TaskInstant } from '../../../src/diagrams/gantt/core/TaskInstant.js';
import { TaskDrawRegistryData } from '../../../src/diagrams/gantt/data/TaskDrawRegistryData.js';
import type { TaskDraw } from '../../../src/diagrams/gantt/draw/TaskDraw.js';
import { GanttArrow } from '../../../src/diagrams/gantt/GanttArrow.js';
import { GanttConstraint } from '../../../src/diagrams/gantt/GanttConstraint.js';
import { day, measurer, styleBuilder, taskOf, timeScale } from './draw/helpers/draw-fixture.js';

// Expected values: ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/GanttConstraint.java:55-131.

const SET = HColorSet.instance();
const START = TaskAttribute.START;
const END = TaskAttribute.END;

const a = taskOf('A', day(4)); // start day(4), end day(5): one day long
const b = taskOf('B', day(10));
const c = taskOf('C', day(12));

function constraint(source: TaskInstant, dest: TaskInstant, forced?: ReturnType<typeof SET.getColorOrWhite>) {
  return new GanttConstraint(SET, styleBuilder, source, dest, forced);
}

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

/** Draw `link` over two stand-in task draws (every side at x = 10 + side-independent, y = 5). */
function drawn(link: GanttConstraint, from: ReturnType<typeof taskOf>, to: ReturnType<typeof taskOf>): Drawn[] {
  const registry = new TaskDrawRegistryData();
  const fake = {
    getX: () => 10,
    getY: (_sb: StringBounder, side?: unknown) => (side === undefined ? RealUtils.createOrigin().addFixed(5) : 5),
  } as unknown as TaskDraw;
  registry.putTaskDraw(from, fake);
  registry.putTaskDraw(to, fake);
  const out: Drawn[] = [];
  link.getUDrawable(timeScale, registry).drawU(new Recorder(out) as unknown as UGraphic);
  return out;
}

describe('GanttConstraint', () => {
  it('starts as a LinkType with no decor on either end (java:67)', () => {
    const link = constraint(new TaskInstant(a, END), new TaskInstant(b, START));
    expect(link.getType().getDecor1()).toBe(LinkDecor.NONE);
    expect(link.getType().getDecor2()).toBe(LinkDecor.NONE);
  });

  it('keeps the forced colour as the specific link colour, and none when absent (java:68, :75-77)', () => {
    const red = SET.getColorOrWhite('red');
    expect(constraint(new TaskInstant(a, END), new TaskInstant(b, START), red).getSpecificColor()).toBe(red);
    expect(constraint(new TaskInstant(a, END), new TaskInstant(b, START)).getSpecificColor()).toBeUndefined();
  });

  it('isOn: the source or the destination moment, by identity (java:79-81)', () => {
    const link = constraint(new TaskInstant(a, END), new TaskInstant(b, START));
    expect(link.isOn(a)).toBe(true);
    expect(link.isOn(b)).toBe(true);
    expect(link.isOn(c)).toBe(false);
  });

  it('isThereRightArrow: the destination end of the task (java:84-85)', () => {
    const link = constraint(new TaskInstant(a, START), new TaskInstant(b, END));
    expect(link.isThereRightArrow(b)).toBe(true);
    expect(link.isThereRightArrow(a)).toBe(false);
  });

  it('isThereRightArrow: a destination START is not a right arrow (java:84)', () => {
    const link = constraint(new TaskInstant(a, END), new TaskInstant(b, START));
    expect(link.isThereRightArrow(b)).toBe(false);
    expect(link.isThereRightArrow(a)).toBe(false);
  });

  it('isThereRightArrow: END -> END also marks the source (java:87-89)', () => {
    const link = constraint(new TaskInstant(a, END), new TaskInstant(b, END));
    expect(link.isThereRightArrow(a)).toBe(true);
    expect(link.isThereRightArrow(b)).toBe(true);
    expect(link.isThereRightArrow(c)).toBe(false);
  });

  it('isThereRightArrow: START -> END does not mark the source (java:87-88)', () => {
    const link = constraint(new TaskInstant(a, START), new TaskInstant(b, END));
    expect(link.isThereRightArrow(a)).toBe(false);
  });

  it('toString is "source --> dest" (java:94-97)', () => {
    const s = new TaskInstant(a, END);
    const d = new TaskInstant(b, START);
    expect(constraint(s, d).toString()).toBe(s.toString() + ' --> ' + d.toString());
    expect(constraint(s, d).toString()).toContain(' --> START of ');
  });

  it('style signature is the names root, element, ganttDiagram, arrow (java:99-101)', () => {
    const link = constraint(new TaskInstant(a, END), new TaskInstant(b, START));
    expect(link.getStyleSignature().toString()).toBe('[arrow, element, ganttDiagram, root]  []');
  });

  it('goNorank does nothing (java:130-131)', () => {
    const link = constraint(new TaskInstant(a, END), new TaskInstant(b, START));
    link.goNorank();
    expect(link.getType().getDecor1()).toBe(LinkDecor.NONE);
  });
});

describe('GanttConstraint.isHidden (java:110-128)', () => {
  const link = constraint(new TaskInstant(a, END), new TaskInstant(b, START));
  // the source instant is the END of A (day 5), the destination the START of B (day 10)

  it('visible when both instants lie inside [min, max]', () => {
    expect(link.isHidden(day(1), day(20))).toBe(false);
  });

  it('hidden when the source is before min (java:121-122)', () => {
    expect(link.isHidden(day(6), day(20))).toBe(true);
  });

  it('hidden when the destination is after max (java:124-125)', () => {
    expect(link.isHidden(day(1), day(8))).toBe(true);
  });

  it('hidden when the destination is before min (java:117-118)', () => {
    const back = constraint(new TaskInstant(b, START), new TaskInstant(a, START));
    expect(back.isHidden(day(5), day(20))).toBe(true);
  });

  it('a bound equal to an instant does not hide it (java:121, :124 are strict)', () => {
    expect(link.isHidden(day(5), day(10))).toBe(false);
  });
});

describe('GanttConstraint.getUDrawable (java:103-108)', () => {
  it('answers a GanttArrow', () => {
    const link = constraint(new TaskInstant(a, END), new TaskInstant(b, START));
    expect(link.getUDrawable(timeScale, new TaskDrawRegistryData())).toBeInstanceOf(GanttArrow);
  });

  it('a plain link draws with the style stroke: the skin arrow LineThickness 1.5 (plantuml.skin:404)', () => {
    const out = drawn(constraint(new TaskInstant(a, END), new TaskInstant(b, START)), a, b);
    const stroke = out[0]!.changes.find((ch) => ch instanceof UStroke) as UStroke;
    expect([stroke.getDashVisible(), stroke.getDashSpace(), stroke.getThickness()]).toEqual([0, 0, 1.5]);
  });

  it('a dashed link overrides LineThickness / LineStyle through Style#eventuallyOverride(UStroke) (java:107, LinkStyle.java:99-100)', () => {
    const link = constraint(new TaskInstant(a, END), new TaskInstant(b, START));
    link.goDashed();
    const out = drawn(link, a, b);
    const stroke = out[0]!.changes.find((ch) => ch instanceof UStroke) as UStroke;
    expect([stroke.getDashVisible(), stroke.getDashSpace(), stroke.getThickness()]).toEqual([7, 7, 1.5]);
  });

  it('a bold link is thickness 2 (LinkStyle.java:105-106)', () => {
    const link = constraint(new TaskInstant(a, END), new TaskInstant(b, START));
    link.goBold();
    const out = drawn(link, a, b);
    const stroke = out[0]!.changes.find((ch) => ch instanceof UStroke) as UStroke;
    expect([stroke.getDashVisible(), stroke.getDashSpace(), stroke.getThickness()]).toEqual([0, 0, 2]);
  });

  it('the forced colour overrides the style LineColor (java:105-106)', () => {
    const red = SET.getColorOrWhite('#FF0000');
    const out = drawn(constraint(new TaskInstant(a, END), new TaskInstant(b, START), red), a, b);
    const fore = out[0]!.changes.find((ch) => ch instanceof Fore) as Fore;
    expect(fore.getColor()).toBe(red);
  });

  it('without a forced colour the style LineColor stays', () => {
    const out = drawn(constraint(new TaskInstant(a, END), new TaskInstant(b, START)), a, b);
    const fore = out[0]!.changes.find((ch) => ch instanceof Fore) as Fore;
    expect(fore.getColor()).not.toBe(SET.getColorOrWhite('#FF0000'));
  });

  it('a bare XColor record (the `-[#012]->` colour) is wrapped to an HColorSimple, as HColorSet.getColorOrWhite returns', () => {
    // Oracle mexito-28-toli086: `-[#012]->` strokes `stroke:#012;stroke-width:1.5` (HColorSet.java:58-63).
    const link = constraint(new TaskInstant(a, END), new TaskInstant(b, START));
    link.setSpecificColor({ r: 0, g: 17, b: 34, a: 255 });
    const out = drawn(link, a, b);
    const fore = out[0]!.changes.find((ch) => ch instanceof Fore) as Fore;
    expect(fore.getColor()).toBeInstanceOf(HColorSimple);
    expect((fore.getColor() as HColorSimple).getAwtColor()).toEqual({ r: 0, g: 17, b: 34, a: 255 });
  });

  it('an object that is no colour is not narrowed at construction: the failure is at draw time (GanttArrow.java:105)', () => {
    const link = constraint(new TaskInstant(a, END), new TaskInstant(b, START));
    link.setSpecificColor({ r: 1 });
    const arrow = link.getUDrawable(timeScale, new TaskDrawRegistryData());
    expect(arrow).toBeInstanceOf(GanttArrow);
    expect(() => drawn(link, a, b)).toThrow('ClassCastException');
  });
});
