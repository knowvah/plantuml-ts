/**
 * `ElementButton` (ElementButton.java:47-75) against the 1.2026.8beta1 jar:
 *
 * - `fixtures/widget-button.puml` — `[This is my button]`: 17 chars x 8
 *   (AbstractElementText.java:92) = 136 beats the 90.6 text, so the
 *   preferred size is 136 + 4 + 5 = 145 by 12 + 4 + 5 = 21 (java:57-61);
 *   the jar's rounded rect is that less 2 x 2.5 (140 x 16, java:70-71) and
 *   the text sits centred at 6 + (145 - 90.6) / 2 = 33.2 (java:73).
 * - `fixtures/widget-button-wide.puml` — `[<size:20>W]`: one purged char
 *   (8 px) loses to the 20 pt glyph, so the pure text width wins and the
 *   text sits at the rect's own inset.
 */
import { describe, expect, it } from 'vitest';
import { ElementButton } from '../../../../src/diagrams/salt/element/ElementButton.js';
import { SaltDictionary } from '../../../../src/diagrams/salt/SaltDictionary.js';
import { FONT_12, stringBounder } from '../salt-test-support.js';
import { drawAt, jarElements } from './widget-test-support.js';

function button(text: string): ElementButton {
  return new ElementButton(text, FONT_12, new SaltDictionary());
}

describe('ElementButton#getPreferredDimension (java:57-61)', () => {
  it('is the reserved text width + 2 x marginX + 2 x stroke: 145 x 21', () => {
    const dim = button('This is my button').getPreferredDimension(stringBounder, 0, 0);
    expect(dim.getWidth()).toBe(145);
    expect(dim.getHeight()).toBe(21);
  });

  it('ignores x and y (getTextDimensionAt ignores its x, AbstractElementText.java:82)', () => {
    const dim = button('This is my button').getPreferredDimension(stringBounder, 40, 17);
    expect(dim.getWidth()).toBe(145);
    expect(dim.getHeight()).toBe(21);
  });

  it('uses the pure text width when it beats the reserved length (widget-button-wide: 27.875 x 29)', () => {
    const dim = button('<size:20>W').getPreferredDimension(stringBounder, 0, 0);
    expect(dim.getWidth()).toBeCloseTo(27.875, 3);
    expect(dim.getHeight()).toBe(29);
  });
});

describe('ElementButton#drawU (java:63-74)', () => {
  it('draws the jar rounded rect and centred text at z-index 0 (widget-button)', () => {
    expect(drawAt(button('This is my button'), 0)).toEqual(jarElements('widget-button'));
  });

  it('draws the jar shapes when the glyph is wider than the reserved length (widget-button-wide)', () => {
    expect(drawAt(button('<size:20>W'), 0)).toEqual(jarElements('widget-button-wide'));
  });

  it('draws nothing at z-index 1 (java:64-65)', () => {
    expect(drawAt(button('This is my button'), 1)).toEqual([]);
  });
});
