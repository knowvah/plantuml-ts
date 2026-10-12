/**
 * `ElementTextField` (ElementTextField.java:46-70) against the
 * 1.2026.8beta1 jar:
 *
 * - `fixtures/widget-textfield.puml` — `"Enter text here "`: 16 chars x 8
 *   (trailing blank included, AbstractElementText.java:59-61) = 128
 *   reserved, + 6 by 12 + 2 = 134 x 14 (java:52-55). The trimmed text
 *   draws at (3, 0) (java:61); the underline runs from x 1 for
 *   134 - 3 = 131 at the text height (java:64); the two 2 px ticks stand at
 *   y 12 - 3 = 9, x 1 and x 3 + 128 + 1 = 132 (java:65-67).
 * - The `field-length-*` fixtures (AbstractElementText.test.ts) pin the
 *   reserved width over twelve more texts.
 */
import { describe, expect, it } from 'vitest';
import { ElementTextField } from '../../../../src/diagrams/salt/element/ElementTextField.js';
import { SaltDictionary } from '../../../../src/diagrams/salt/SaltDictionary.js';
import { FONT_12, stringBounder } from '../salt-test-support.js';
import { drawAt, jarElements } from './widget-test-support.js';

function field(text: string): ElementTextField {
  return new ElementTextField(text, FONT_12, new SaltDictionary());
}

describe('ElementTextField#getPreferredDimension (java:52-55)', () => {
  it('is the reserved text width + 6 by the text height + 2: 134 x 14', () => {
    const dim = field('Enter text here ').getPreferredDimension(stringBounder, 0, 0);
    expect(dim.getWidth()).toBe(134);
    expect(dim.getHeight()).toBe(14);
  });

  it('ignores x and y', () => {
    const dim = field('Enter text here ').getPreferredDimension(stringBounder, 25, 9);
    expect(dim.getWidth()).toBe(134);
    expect(dim.getHeight()).toBe(14);
  });
});

describe('ElementTextField#drawU (java:57-68)', () => {
  it('draws the jar text, underline and ticks at z-index 0 (widget-textfield)', () => {
    expect(drawAt(field('Enter text here '), 0)).toEqual(jarElements('widget-textfield'));
  });

  it('draws nothing at z-index 1 (java:58-60)', () => {
    expect(drawAt(field('Enter text here '), 1)).toEqual([]);
  });
});
