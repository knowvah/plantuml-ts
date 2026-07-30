/**
 * Sea.test.ts — T8: unit coverage for `Sea` (klimt/creole/Sea.java), the
 * atom-altitude engine `SheetBlock1#initMap` lays each word-wrapped line
 * out with. Operates on `CreoleAtom` + an injected `AtomOps` bundle rather
 * than upstream's OOP `Atom` dispatch -- see `Sea.ts`'s own doc comment for
 * why.
 */
import { describe, expect, it } from 'vitest';
import { Sea, type AtomOps } from '../../../../../src/core/klimt/creole/Sea.js';
import type { Position } from '../../../../../src/core/klimt/creole/Position.js';
import { XDimension2D } from '../../../../../src/core/klimt/geom/XDimension2D.js';
import { MinMax } from '../../../../../src/core/klimt/geom/MinMax.js';
import type { CreoleAtom } from '../../../../../src/core/klimt/creole/atom/Atom.js';
import type { StringBounder } from '../../../../../src/core/klimt/font/StringBounder.js';

const stubStringBounder: StringBounder = { calculateDimension: () => new XDimension2D(0, 0) };

/** A distinct 'text' atom fixture, identified by `label`. Actual
 *  dimensions/altitude come from the injected `AtomOps` (`fixedOps`,
 *  below), not from measuring this label. */
function textAtom(label: string): CreoleAtom {
  return { kind: 'text', text: label, font: { family: 'sans-serif', size: 12, color: '#000', styles: new Set() } };
}

/** Fixed-size ops: every atom's dimension/altitude/draw is looked up by
 *  IDENTITY in a Map supplied by the test -- this exercises Sea's OWN
 *  stacking math without needing a real font measurer. */
function fixedOps(dims: Map<CreoleAtom, { width: number; height: number; altitude: number }>): AtomOps & {
  drawn: CreoleAtom[];
} {
  const drawn: CreoleAtom[] = [];
  return {
    drawn,
    calculateDimension: (atom) => {
      const d = dims.get(atom);
      if (d === undefined) throw new Error('unexpected atom');
      return new XDimension2D(d.width, d.height);
    },
    getStartingAltitude: (atom) => {
      const d = dims.get(atom);
      if (d === undefined) throw new Error('unexpected atom');
      return d.altitude;
    },
    drawU: (atom) => {
      drawn.push(atom);
    },
  };
}

describe('Sea.add / getPosition / getWidth', () => {
  it('accumulates atoms left to right (x-cursor sum), y always starts at 0 (Java:60-66)', () => {
    const a = textAtom('a');
    const b = textAtom('b');
    const dims = new Map([
      [a, { width: 10, height: 5, altitude: 0 }],
      [b, { width: 20, height: 8, altitude: 0 }],
    ]);
    const sea = new Sea(stubStringBounder, fixedOps(dims));
    sea.add(a);
    sea.add(b);

    expect(sea.getPosition(a)?.getMinY()).toBe(0);
    expect(sea.getPosition(a)?.getWidth()).toBe(10);
    expect(sea.getPosition(b)?.getWidth()).toBe(20);
    // b's x offset is a's width (10) -- Position has no getX accessor, so
    // read it back off getTranslate().
    expect(sea.getPosition(a)?.getTranslate().getDx()).toBe(0);
    expect(sea.getPosition(b)?.getTranslate().getDx()).toBe(10);
    expect(sea.getWidth()).toBe(30);
  });
});

describe('Sea.doAlign', () => {
  it('translates each atom by (-height + startingAltitude) (Java:76-77)', () => {
    const a = textAtom('a');
    const dims = new Map([[a, { width: 10, height: 5, altitude: 2 }]]);
    const sea = new Sea(stubStringBounder, fixedOps(dims));
    sea.add(a);
    sea.doAlign();
    // dy = -height + altitude = -5 + 2 = -3
    expect(sea.getPosition(a)?.getMinY()).toBe(-3);
  });
});

describe('Sea.translateMinYto', () => {
  it('shifts every position so the current minimum Y becomes newValue', () => {
    const a = textAtom('a');
    const b = textAtom('b');
    const dims = new Map([
      [a, { width: 10, height: 5, altitude: 0 }],
      [b, { width: 10, height: 8, altitude: -3 }],
    ]);
    const sea = new Sea(stubStringBounder, fixedOps(dims));
    sea.add(a);
    sea.add(b);
    sea.doAlign(); // a.y = -5, b.y = -8 + -3 = -11 -> minY = -11
    sea.translateMinYto(100);
    expect(sea.getMinY()).toBe(100);
  });
});

describe('Sea.getMinY / getMaxY / getHeight — empty Sea throws (Java:161-163, 173-174)', () => {
  it('getMinY throws IllegalStateException-equivalent on an empty Sea', () => {
    const sea = new Sea(stubStringBounder, fixedOps(new Map()));
    expect(() => sea.getMinY()).toThrow('IllegalStateException');
  });

  it('getMaxY throws IllegalStateException-equivalent on an empty Sea', () => {
    const sea = new Sea(stubStringBounder, fixedOps(new Map()));
    expect(() => sea.getMaxY()).toThrow('IllegalStateException');
  });

  it('getHeight is getMaxY - getMinY for a populated Sea', () => {
    const a = textAtom('a');
    const dims = new Map([[a, { width: 10, height: 5, altitude: 0 }]]);
    const sea = new Sea(stubStringBounder, fixedOps(dims));
    sea.add(a);
    expect(sea.getHeight()).toBe(5); // minY=0, maxY=5
  });
});

describe('Sea.exportAllPositions', () => {
  it('copies every atom -> position pair into the destination map', () => {
    const a = textAtom('a');
    const dims = new Map([[a, { width: 10, height: 5, altitude: 0 }]]);
    const sea = new Sea(stubStringBounder, fixedOps(dims));
    sea.add(a);
    const destination = new Map<CreoleAtom, Position>();
    sea.exportAllPositions(destination);
    expect(destination.has(a)).toBe(true);
    expect(destination.get(a)).toBe(sea.getPosition(a));
  });
});

describe('Sea.update', () => {
  it('folds every position into the given MinMax accumulator', () => {
    const a = textAtom('a');
    const b = textAtom('b');
    const dims = new Map([
      [a, { width: 10, height: 5, altitude: 0 }],
      [b, { width: 10, height: 8, altitude: 0 }],
    ]);
    const sea = new Sea(stubStringBounder, fixedOps(dims));
    sea.add(a);
    sea.add(b);
    const result = sea.update(MinMax.getEmpty(true));
    // b sits at x=10..20, y=0..8 (widest/tallest contributor)
    expect(result.getMaxX()).toBe(20);
    expect(result.getMaxY()).toBe(8);
  });
});
