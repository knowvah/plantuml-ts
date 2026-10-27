import { describe, expect, it } from 'vitest';
import type { ISkinParam } from '../../../../src/core/abel/ISkinParam.js';
import { Fore } from '../../../../src/core/klimt/Fore.js';
import type { UGraphic } from '../../../../src/core/klimt/UGraphic.js';
import { UStroke } from '../../../../src/core/klimt/UStroke.js';
import type { UChange } from '../../../../src/core/klimt/UChange.js';
import { HColorSet as KlimtHColorSet } from '../../../../src/core/klimt/color/HColorSet.js';
import { HColorSimple } from '../../../../src/core/klimt/color/HColorSimple.js';
import { NoSuchColorException } from '../../../../src/core/klimt/color/NoSuchColorException.js';
import { Pragma } from '../../../../src/core/skin/Pragma.js';
import type { HColor, HColorSet } from '../../../../src/core/style/Value.js';
import { TimelineStyleData } from '../../../../src/diagrams/gantt/data/TimelineStyleData.js';
import { TestHColor, TestHColorSet } from '../../core/style/helpers/hcolor-set.js';
import { skinGanttStyle } from '../helpers/gantt-style.js';

// Expected values: the built-in plantuml.skin ganttDiagram block (jar 1.2026.8beta1) and
// ~/git/plantuml/src/main/java/net/sourceforge/plantuml/gantt/data/TimelineStyleData.java:45-125.
const PRAGMA = Pragma.createEmpty();
const SKIN_PARAM = { getPragma: () => PRAGMA } as unknown as ISkinParam;

/** A colour set that yields real `HColorSimple`s, as the jar's does. */
class SimpleHColorSet implements HColorSet {
  getColorOrWhite(s: string): HColor {
    const hex = s.replace('#', '');
    const n = s === 'black' ? 0 : Number.parseInt(hex, 16);
    return HColorSimple.create({ r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 255 });
  }
}

/** Records every `apply` in order; `draw` is never reached here. */
class RecordingUGraphic {
  constructor(readonly changes: UChange[] = []) {}
  apply(change: UChange): UGraphic {
    return new RecordingUGraphic([...this.changes, change]) as unknown as UGraphic;
  }
}

function make(colorSet: HColorSet = new TestHColorSet()): TimelineStyleData {
  // The fakes implement only the style-layer slice; the ctor takes the klimt class (TimelineStyleData.java:50).
  return new TimelineStyleData(SKIN_PARAM, skinGanttStyle(), colorSet as unknown as KlimtHColorSet);
}

describe('TimelineStyleData', () => {
  it('exposes the skin param, pragma and colour set it was built with (java:56-62,96-98)', () => {
    const colorSet = new TestHColorSet();
    const d = make(colorSet);
    expect(d.getSkinParam()).toBe(SKIN_PARAM);
    expect(d.getPragma()).toBe(PRAGMA);
    expect(d.getColorSet()).toBe(colorSet);
  });

  it('font sizes equal the skin: day 10, month 12, year 14 (java:64-74)', () => {
    const d = make();
    expect(d.getFontSizeDay()).toBe(10);
    expect(d.getFontSizeMonth()).toBe(12);
    expect(d.getFontSizeYear()).toBe(14);
  });

  it('getFont reads the timeline/<param> font (java:76-78)', () => {
    const d = make();
    expect(d.getFont('month').getSize()).toBe(12);
    expect(d.getFont('day').getSize()).toBe(10);
  });

  it('cell width is 1.6 x the day font size (java:108-111)', () => {
    expect(make().getCellWidth()).toBe(16);
  });

  it.each([
    ['getClosedBackgroundColor', '#F1E5E5', '#1f1f1f'],
    ['getClosedFontColor', '#989898', '#676767'],
    ['getOpenFontColor', 'black', 'white'],
    ['getLineColor', '#C0C0C0', '#3f3f3f'],
  ] as const)('%s asks the colour set for the skin light %s then dark %s value (java:80-94)', (method, light, dark) => {
    const colorSet = new TestHColorSet();
    const d = make(colorSet);
    const color = d[method]();
    expect(color).toBeInstanceOf(TestHColor);
    expect(colorSet.requested).toEqual([light, dark]);
  });

  it('applyVerticalSeparatorStyle applies the line colour then the stroke (java:100-106)', () => {
    const d = make(new SimpleHColorSet());
    const out = d.applyVerticalSeparatorStyle(new RecordingUGraphic() as unknown as UGraphic);
    const [fore, stroke] = (out as unknown as RecordingUGraphic).changes;
    expect(fore).toBeInstanceOf(Fore);
    expect((fore as Fore).getColor()).toBeInstanceOf(HColorSimple);
    expect(stroke).toBeInstanceOf(UStroke);
    expect(stroke).toEqual(new UStroke(2, 2, 2));
  });

  it('a non-HColorSimple line colour is a ClassCastException', () => {
    expect(() => make().applyVerticalSeparatorStyle(new RecordingUGraphic() as unknown as UGraphic)).toThrow(
      'ClassCastException',
    );
  });

  it('the real klimt HColorSet is accepted and getColor throws NoSuchColorException (HColorSet.java:69-76)', () => {
    const set = KlimtHColorSet.instance();
    const d = new TimelineStyleData(SKIN_PARAM, skinGanttStyle(), set);
    expect(d.getColorSet()).toBe(set);
    expect(() => d.getColorSet().getColor('#nope')).toThrow(NoSuchColorException);
    expect(d.getColorSet().getColor('#FF0000')).toBeInstanceOf(HColorSimple);
  });
});
