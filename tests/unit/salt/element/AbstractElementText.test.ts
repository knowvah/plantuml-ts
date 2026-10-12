/**
 * `AbstractElementText` (AbstractElementText.java:51-115) against the
 * 1.2026.8beta1 jar (`scripts/oracle-render.sh`, deterministic text):
 *
 * - `fixtures/field-creole.puml` — a text field (`ElementTextField`, which
 *   draws through `drawText(ug, 3, 0)`, ElementTextField.java:64) holding
 *   creole markup; its cell origin is (6, 6), so every run starts at x = 9.
 *
 * `manageLength = true` needs `Splitter.purgeAllTag` (java:70), which the
 * port does not have (stop 10); the constructor names it.
 */
import { describe, expect, it } from 'vitest';
import type { StringBounder } from '../../../../src/core/klimt/font/StringBounder.js';
import type { UFont } from '../../../../src/core/klimt/font/UFont.js';
import type { XDimension2D } from '../../../../src/core/klimt/geom/XDimension2D.js';
import type { UGraphic } from '../../../../src/core/klimt/UGraphic.js';
import type { ISkinSimple } from '../../../../src/core/style/ISkinSimple.js';
import { AbstractElementText } from '../../../../src/diagrams/salt/element/AbstractElementText.js';
import { SaltDictionary } from '../../../../src/diagrams/salt/SaltDictionary.js';
import { drawElement, FONT_12, jarTextElements, stringBounder, textElements } from '../salt-test-support.js';

const CREOLE = '**Bold** <color:red>red</color> //it//';

/** `ElementTextField`'s draw offset, without its rules; exposes the
 *  protected members. */
class TextProbe extends AbstractElementText {
  constructor(text: string, font: UFont, manageLength: boolean, spriteContainer: ISkinSimple) {
    super(text, font, manageLength, spriteContainer);
  }

  getPreferredDimension(sb: StringBounder, x: number, _y: number): XDimension2D {
    return this.getTextDimensionAt(sb, x);
  }

  drawU(ug: UGraphic, _zIndex: number, _dimToUse: XDimension2D): void {
    this.drawText(ug, 3, 0);
  }

  pure(sb: StringBounder): XDimension2D {
    return this.getPureTextDimension(sb);
  }

  configuration(): ReturnType<AbstractElementText['getConfig']> {
    return this.getConfig();
  }
}

function probe(text: string): TextProbe {
  return new TextProbe(text, FONT_12, false, new SaltDictionary());
}

describe('AbstractElementText#drawText (java:74-76)', () => {
  it('draws the jar <text> runs for creole markup, translated by (x, y)', () => {
    expect(textElements(drawElement(probe(CREOLE), { dx: 6, dy: 6 }))).toEqual(jarTextElements('field-creole'));
  });
});

describe('AbstractElementText dimensions (java:78-93)', () => {
  it('without manageLength, getTextDimensionAt is the pure text dimension', () => {
    const p = probe(CREOLE);
    const pure = p.pure(stringBounder);
    // 24.075 + 3.3 + 17.325 + 3.3 + 6: the five jar runs of field-creole.
    expect(pure.getWidth()).toBeCloseTo(54, 3);
    expect(pure.getHeight()).toBe(12);
    const at = p.getPreferredDimension(stringBounder, 37, 0);
    expect(at.getWidth()).toBe(pure.getWidth());
    expect(at.getHeight()).toBe(pure.getHeight());
  });
});

describe('AbstractElementText#getConfig (java:111-113)', () => {
  it('is blackBlueTrue(font)', () => {
    const fc = probe('x').configuration();
    expect(fc.family).toBe('SansSerif');
    expect(fc.size).toBe(12);
    expect(fc.color).toBe('#000000');
  });
});

describe('AbstractElementText manageLength (java:59-61, 68-72)', () => {
  it('names the missing Splitter.purgeAllTag port', () => {
    expect(() => new TextProbe('MyName   ', FONT_12, true, new SaltDictionary())).toThrow(/Splitter\.purgeAllTag/);
  });
});
