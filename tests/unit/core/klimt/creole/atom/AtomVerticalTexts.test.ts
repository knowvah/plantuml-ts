/**
 * AtomVerticalTexts.test.ts — pins the port of
 * `klimt/creole/atom/AtomVerticalTexts.java` (`calculateDimensionSlow`
 * :54-64, `getStartingAltitude` :67-69, `drawU` :71-78) and of the
 * `AtomHorizontalTexts` line it stacks for a multi-piece line
 * (`AtomHorizontalTexts.java:52-82`). Expected values are computed from the
 * Java formulae over a fixed-size `AtomOps`, never measured.
 */
import { describe, expect, it } from 'vitest';
import {
  drawVerticalTexts,
  verticalTextsDimension,
  verticalTextsStartingAltitude,
} from '../../../../../../src/core/klimt/creole/atom/AtomVerticalTexts.js';
import type { CreoleAtom } from '../../../../../../src/core/klimt/creole/atom/Atom.js';
import type { AtomOps } from '../../../../../../src/core/klimt/creole/Sea.js';
import type { StringBounder } from '../../../../../../src/core/klimt/font/StringBounder.js';
import { XDimension2D } from '../../../../../../src/core/klimt/geom/XDimension2D.js';
import type { UChange } from '../../../../../../src/core/klimt/UChange.js';
import type { UGraphic } from '../../../../../../src/core/klimt/UGraphic.js';
import { UTranslate } from '../../../../../../src/core/klimt/UTranslate.js';

const SB: StringBounder = { calculateDimension: () => new XDimension2D(0, 0) };

class RecordingUGraphic implements UGraphic {
  constructor(private readonly translate: UTranslate = UTranslate.none()) {}
  apply(change: UChange): UGraphic {
    return change instanceof UTranslate ? new RecordingUGraphic(this.translate.compose(change)) : this;
  }
  draw(): void {
    throw new Error('not needed');
  }
  getParam(): never {
    throw new Error('not needed');
  }
  getTranslate(): UTranslate {
    return this.translate;
  }
  getStringBounder(): StringBounder {
    return SB;
  }
}

const FONT = { family: 'sans-serif', size: 14, color: '#00F', styles: new Set<never>() };
const text = (label: string): CreoleAtom => ({ kind: 'text', text: label, font: FONT });

interface Box {
  readonly width: number;
  readonly height: number;
  readonly altitude: number;
}

function opsFor(boxes: Map<CreoleAtom, Box>): AtomOps & { drawn: { atom: CreoleAtom; at: UTranslate }[] } {
  const drawn: { atom: CreoleAtom; at: UTranslate }[] = [];
  const box = (atom: CreoleAtom): Box => {
    const found = boxes.get(atom);
    if (found === undefined) throw new Error('unexpected atom');
    return found;
  };
  return {
    drawn,
    calculateDimension: (atom) => new XDimension2D(box(atom).width, box(atom).height),
    getStartingAltitude: (atom) => box(atom).altitude,
    drawU: (atom, ug) => {
      drawn.push({ atom, at: (ug as RecordingUGraphic).getTranslate() });
    },
  };
}

describe('verticalTextsDimension (AtomVerticalTexts.java:54-64)', () => {
  it('is the widest line wide and the sum of the line heights tall', () => {
    const a = text('Line 3');
    const b = text('Line 4');
    const ops = opsFor(
      new Map([
        [a, { width: 38, height: 16, altitude: 0 }],
        [b, { width: 41, height: 17, altitude: 0 }],
      ]),
    );
    expect(verticalTextsDimension([[a], [b]], ops, SB)).toEqual(new XDimension2D(41, 33));
  });

  it('measures a multi-piece line as AtomHorizontalTexts: summed width, maxed height', () => {
    const a = text('a');
    const b = text('b');
    const c = text('c');
    const ops = opsFor(
      new Map([
        [a, { width: 10, height: 16, altitude: 0 }],
        [b, { width: 20, height: 30, altitude: 0 }],
        [c, { width: 5, height: 12, altitude: 0 }],
      ]),
    );
    expect(verticalTextsDimension([[a, b], [c]], ops, SB)).toEqual(new XDimension2D(30, 42));
  });

  it('measures an empty line as 0 x 0 (AtomHorizontalTexts over no pieces)', () => {
    const a = text('a');
    const ops = opsFor(new Map([[a, { width: 10, height: 16, altitude: 0 }]]));
    expect(verticalTextsDimension([[a], []], ops, SB)).toEqual(new XDimension2D(10, 16));
  });
});

describe('verticalTextsStartingAltitude (AtomVerticalTexts.java:67-69)', () => {
  it('is the first line starting altitude', () => {
    const a = text('a');
    const b = text('b');
    const ops = opsFor(
      new Map([
        [a, { width: 1, height: 1, altitude: 3 }],
        [b, { width: 1, height: 1, altitude: 9 }],
      ]),
    );
    expect(verticalTextsStartingAltitude([[a], [b]], ops, SB)).toBe(3);
  });

  it('an empty first line answers 0 (AtomHorizontalTexts.java:64-66)', () => {
    const b = text('b');
    const ops = opsFor(new Map([[b, { width: 1, height: 1, altitude: 9 }]]));
    expect(verticalTextsStartingAltitude([[], [b]], ops, SB)).toBe(0);
  });
});

describe('verticalTextsStartingAltitude over no lines (all.get(0), AtomVerticalTexts.java:67-69)', () => {
  it('throws, as ArrayList#get(0) does on an empty list', () => {
    const ops = opsFor(new Map());
    expect(() => verticalTextsStartingAltitude([], ops, SB)).toThrow('IndexOutOfBoundsException');
  });
});

describe('drawVerticalTexts (AtomVerticalTexts.java:71-78)', () => {
  it('draws each one-piece line at dy = the heights of the lines above, untouched in x', () => {
    const a = text('Line 3');
    const b = text('Line 4');
    const ops = opsFor(
      new Map([
        [a, { width: 38, height: 16, altitude: 0 }],
        [b, { width: 41, height: 17, altitude: 0 }],
      ]),
    );
    drawVerticalTexts([[a], [b]], ops, new RecordingUGraphic());
    expect(ops.drawn.map((d) => [d.atom, d.at.getDx(), d.at.getDy()])).toEqual([
      [a, 0, 0],
      [b, 0, 16],
    ]);
  });

  it('draws a multi-piece line at dx = running width, dy = lineAltitude - pieceAltitude (AtomHorizontalTexts.java:71-82)', () => {
    const a = text('a');
    const b = text('b');
    const ops = opsFor(
      new Map([
        [a, { width: 10, height: 16, altitude: 4 }],
        [b, { width: 20, height: 30, altitude: 1 }],
      ]),
    );
    drawVerticalTexts([[a, b]], ops, new RecordingUGraphic());
    expect(ops.drawn.map((d) => [d.atom, d.at.getDx(), d.at.getDy()])).toEqual([
      [a, 0, 0],
      [b, 10, 3],
    ]);
  });
});
