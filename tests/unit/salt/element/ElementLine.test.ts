/**
 * `ElementLine` (ElementLine.java:45-82) against the 1.2026.8beta1 jar.
 *
 * `fixtures/widget-lines.puml` — `foo1 / -- / foo2 / == / foo3 / .. / foo4 /
 * ~~ / foo5` in one borderless column. The column is the 23.325 text + 2
 * wide (ElementPyramid.java:139) and a line row is 6 + 2 high (java:146),
 * so every line cell gets `dimToUse` = 24.325 x 7 (span - 1,
 * ElementPyramid.java:113-114) at x 6. The rows start at 5, 19, 27, 41,
 * 49, 63, 71, 85, 93: the line cells' origins are y 20, 42, 64, 86, and
 * each line is at y + 7 / 2 (java:62), `=` one higher with a twin 2 below
 * (java:63-65, 71-72).
 */
import { describe, expect, it } from 'vitest';
import { ElementLine } from '../../../../src/diagrams/salt/element/ElementLine.js';
import { stringBounder } from '../salt-test-support.js';
import { dimension, drawAt, jarElements } from './widget-test-support.js';

/** The jar's line cell: 24.325 x 7 (see header). */
const LINE_CELL = dimension(24.325, 7);

/** The fixture's `<line>`s, in order: `--`, `==` (two), `..`, `~~`. */
function jarLines(): string[] {
  return jarElements('widget-lines').filter((e) => e.startsWith('<line'));
}

/** `svg` with each `y1`/`y2` shifted by `dy` — the jar draws each line cell
 *  at its own row, the test at {@link CELL}'s y 6. */
function shiftY(svg: string, dy: number): string {
  return svg.replace(/ (y[12])="([\d.]+)"/g, (_m, attr: string, v: string) => ` ${attr}="${Number(v) + dy}"`);
}

describe('ElementLine#getPreferredDimension (java:53-55)', () => {
  it('is always 10 x 6', () => {
    for (const c of ['-', '=', '.', '~']) {
      const dim = new ElementLine(c).getPreferredDimension(stringBounder, 3, 4);
      expect(dim.getWidth()).toBe(10);
      expect(dim.getHeight()).toBe(6);
    }
  });
});

describe('ElementLine#drawU (java:57-80)', () => {
  it('draws "--" as the jar: one simple #AAA line (cell y 20)', () => {
    expect(drawAt(new ElementLine('-'), 0, LINE_CELL).map((e) => shiftY(e, 14))).toEqual(jarLines().slice(0, 1));
  });

  it('draws "==" as the jar: two simple lines 2 apart, one higher (cell y 42)', () => {
    expect(drawAt(new ElementLine('='), 0, LINE_CELL).map((e) => shiftY(e, 36))).toEqual(jarLines().slice(1, 3));
  });

  it('draws ".." as the jar: dashed 1,2 (cell y 64)', () => {
    expect(drawAt(new ElementLine('.'), 0, LINE_CELL).map((e) => shiftY(e, 58))).toEqual(jarLines().slice(3, 4));
  });

  it('draws "~~" as the jar: 1.5 thick (cell y 86)', () => {
    expect(drawAt(new ElementLine('~'), 0, LINE_CELL).map((e) => shiftY(e, 80))).toEqual(jarLines().slice(4, 5));
  });

  it('spans the whole dimToUse, not the preferred width', () => {
    const [only] = drawAt(new ElementLine('-'), 0, dimension(50, 10));
    expect(only).toMatch(/^<line x1="6" y1="11" x2="56" y2="11"/);
  });

  it('draws nothing at z-index 1 (java:58-60)', () => {
    expect(drawAt(new ElementLine('='), 1, LINE_CELL)).toEqual([]);
  });
});
