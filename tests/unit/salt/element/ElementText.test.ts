/**
 * `ElementText` (ElementText.java:50-80) against the 1.2026.8beta1 jar,
 * deterministic text on (`scripts/oracle-render.sh`):
 *
 * - `fixtures/text-two.puml` — `Login` / `Password` in a borderless grid.
 *   `Login` draws `textLength="29.4"` (also `vizono-80-vipa581/in.svg`); the
 *   rows' baselines sit 14 apart (15.333 → 29.333), and a pyramid row is the
 *   cell's preferred height + 2 (ElementPyramid.java:146) with no title
 *   (`TextBlockUtils.empty(0, 0)`, java:82), so the preferred height is 12.
 * - `fixtures/text-creole.puml` — creole in a text cell drawn at the cell
 *   origin (6, 6): bold, `<color:red>`, italic runs.
 * - `fixtures/text-dot.puml` — `.` measures but draws nothing (java:60, 72).
 */
import { describe, expect, it } from 'vitest';
import { ElementText } from '../../../../src/diagrams/salt/element/ElementText.js';
import { SaltDictionary } from '../../../../src/diagrams/salt/SaltDictionary.js';
import { drawElement, FONT_12, jarTextElements, stringBounder, textElements } from '../salt-test-support.js';

/** The pyramid's cell origin in every fixture: margin 5 + 1. */
const CELL = { dx: 6, dy: 6 };

function text(...lines: string[]): ElementText {
  return new ElementText(lines, FONT_12, new SaltDictionary());
}

describe('ElementText#getPreferredDimension (java:64-66)', () => {
  it('measures "Login" as the jar does: 29.4 x 12', () => {
    const dim = text('Login').getPreferredDimension(stringBounder, 0, 0);
    expect(dim.getWidth()).toBeCloseTo(29.4, 3);
    expect(dim.getHeight()).toBe(12);
  });

  it('ignores x and y', () => {
    const dim = text('Password').getPreferredDimension(stringBounder, 40, 17);
    expect(dim.getWidth()).toBeCloseTo(52.725, 3);
    expect(dim.getHeight()).toBe(12);
  });

  it('stacks one line per list entry', () => {
    const dim = text('Login', 'Password').getPreferredDimension(stringBounder, 0, 0);
    expect(dim.getWidth()).toBeCloseTo(52.725, 3);
    expect(dim.getHeight()).toBe(24);
  });
});

describe('ElementText#drawU (java:68-75)', () => {
  it('draws the jar <text> for "Login" at the cell origin', () => {
    expect(textElements(drawElement(text('Login'), CELL))).toEqual([jarTextElements('text-two')[0]]);
  });

  it('draws the jar <text> runs for creole markup', () => {
    const svg = drawElement(text('**Bold** <color:red>red</color> //it//'), CELL);
    expect(textElements(svg)).toEqual(jarTextElements('text-creole'));
  });

  it('draws nothing at z-index 1', () => {
    expect(textElements(drawElement(text('Login'), CELL, 1))).toEqual([]);
  });

  it('draws nothing for "." but still measures it (text-dot: no <text>)', () => {
    const dot = text('.');
    expect(jarTextElements('text-dot')).toEqual([]);
    expect(textElements(drawElement(dot, CELL))).toEqual([]);
    expect(dot.getPreferredDimension(stringBounder, 0, 0).getHeight()).toBe(12);
  });
});

describe('ElementText#getText (java:77-79)', () => {
  it('is the first line', () => {
    expect(text('first', 'second').getText()).toBe('first');
  });

  it('throws on an empty list, as text.get(0) does (java:60)', () => {
    expect(() => new ElementText([], FONT_12, new SaltDictionary())).toThrow(/IndexOutOfBoundsException/);
  });
});
