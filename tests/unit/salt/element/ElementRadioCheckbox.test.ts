/**
 * `ElementRadioCheckbox` (ElementRadioCheckbox.java:56-120) against the
 * 1.2026.8beta1 jar. The factories hand it the trimmed text after the
 * `)`/`]` (e.g. ElementFactoryCheckboxOn.java:57-60):
 *
 * - `fixtures/widget-radio-off.puml` / `widget-radio-on.puml` — a 10 px
 *   circle at (2, (12 - 10) / 2) (java:113), and when checked a 4 px dot
 *   at (2 + 3, (12 - 4) / 2) filled with the ink (java:115-117).
 * - `fixtures/widget-checkbox-off.puml` / `widget-checkbox-on.puml` — a
 *   10 px square at the same place (java:99), and when checked the tick
 *   polygon at (3, 6) (java:101-108).
 * - The text sits at `margin` = 20 (java:85); preferred = text + 20 by the
 *   text height (java:75-78).
 */
import { describe, expect, it } from 'vitest';
import { ElementRadioCheckbox } from '../../../../src/diagrams/salt/element/ElementRadioCheckbox.js';
import { SaltDictionary } from '../../../../src/diagrams/salt/SaltDictionary.js';
import { FONT_12, stringBounder } from '../salt-test-support.js';
import { drawAt, jarElements } from './widget-test-support.js';

function widget(text: string, radio: boolean, checked: boolean): ElementRadioCheckbox {
  return new ElementRadioCheckbox([text], FONT_12, radio, checked, new SaltDictionary());
}

describe('ElementRadioCheckbox#getPreferredDimension (java:75-78)', () => {
  it('is the text width + margin 20 by the text height: 110.075 x 12', () => {
    const dim = widget('Unchecked radio', true, false).getPreferredDimension(stringBounder, 0, 0);
    expect(dim.getWidth()).toBeCloseTo(110.075, 3);
    expect(dim.getHeight()).toBe(12);
  });

  it('stacks a multi-line text (Display.create(list), java:70)', () => {
    const dim = new ElementRadioCheckbox(['a', 'b'], FONT_12, false, false, new SaltDictionary());
    expect(dim.getPreferredDimension(stringBounder, 3, 4).getHeight()).toBe(24);
  });
});

describe('ElementRadioCheckbox#drawU (java:80-119)', () => {
  it.each([
    ['widget-radio-off', 'Unchecked radio', true, false],
    ['widget-radio-on', 'Checked radio', true, true],
    ['widget-checkbox-off', 'Unchecked box', false, false],
    ['widget-checkbox-on', 'Checked box', false, true],
  ])('draws the jar shapes for %s at z-index 0', (fixture, text, radio, checked) => {
    expect(drawAt(widget(text, radio, checked), 0)).toEqual(jarElements(fixture));
  });

  it('centres the glyph on a two-line text: (24 - 10) / 2 = 7', () => {
    const two = new ElementRadioCheckbox(['a', 'b'], FONT_12, false, false, new SaltDictionary());
    const square = drawAt(two, 0).find((e) => e.startsWith('<rect'));
    expect(square).toMatch(/^<rect x="8" y="13" width="10" height="10"/);
  });

  it('draws nothing at z-index 1 (java:81-82)', () => {
    expect(drawAt(widget('Checked radio', true, true), 1)).toEqual([]);
  });
});
