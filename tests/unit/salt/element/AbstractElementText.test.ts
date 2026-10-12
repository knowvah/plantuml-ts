/**
 * `AbstractElementText` (AbstractElementText.java:51-115) against the
 * 1.2026.8beta1 jar (`scripts/oracle-render.sh`, deterministic text):
 *
 * - `fixtures/field-creole.puml` — a text field (`ElementTextField`, which
 *   draws through `drawText(ug, 3, 0)`, ElementTextField.java:64) holding
 *   creole markup; its cell origin is (6, 6), so every run starts at x = 9.
 *
 * - `fixtures/field-length-*.puml` — one text field each, with
 *   `manageLength`: the jar's underline runs from x = 7 to
 *   `10 + getTextDimensionAt(...).width` (cell origin 6 plus
 *   ElementTextField.java:53-54, 62-64), and every case is long enough that
 *   `charLength * 8` wins the `max` (java:92).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { StringBounder } from '../../../../src/core/klimt/font/StringBounder.js';
import type { UFont } from '../../../../src/core/klimt/font/UFont.js';
import type { XDimension2D } from '../../../../src/core/klimt/geom/XDimension2D.js';
import type { UGraphic } from '../../../../src/core/klimt/UGraphic.js';
import type { ISkinSimple } from '../../../../src/core/style/ISkinSimple.js';
import { AbstractElementText } from '../../../../src/diagrams/salt/element/AbstractElementText.js';
import { SaltDictionary } from '../../../../src/diagrams/salt/SaltDictionary.js';
import { drawElement, FIXTURES, FONT_12, jarTextElements, stringBounder, textElements } from '../salt-test-support.js';

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

/** `ElementTextField`'s underline end in the jar SVG, less its 10 px offset:
 *  the reserved text width (`getTextDimensionAt(...).getWidth()`). */
function jarReservedWidth(name: string): number {
  const svg = readFileSync(`${FIXTURES}/${name}.jar.svg`, 'utf8');
  const m = /<line x1="7" y1="[\d.]+" x2="([\d.]+)"/.exec(svg);
  if (m === null) throw new Error(`no text-field underline in ${name}.jar.svg`);
  return Number(m[1]) - 10;
}

/** The quoted text of a one-field `@startsalt` fixture. */
function fixtureText(name: string): string {
  const m = /^"(.*)"$/m.exec(readFileSync(`${FIXTURES}/${name}.puml`, 'utf8'));
  if (m === null) throw new Error(`no quoted field in ${name}.puml`);
  return m[1]!;
}

function managed(text: string): TextProbe {
  return new TextProbe(text, FONT_12, true, new SaltDictionary());
}

describe('AbstractElementText manageLength (java:59-61, 68-72, 82-93)', () => {
  it.each([
    // [fixture, charLength] — jar width / 8 (SINGLE_SPACE, java:108).
    ['field-length-myname', 9],
    ['field-length-strike-s', 25],
    ['field-length-strike-word', 30],
    ['field-length-upper-color', 41],
    ['field-length-color-space', 34],
    ['field-length-nbsp-size', 32],
    ['field-length-sprite', 28],
    ['field-length-icon', 24],
    ['field-length-link', 22],
    ['field-length-img-src', 22],
    ['field-length-qrcode', 22],
    ['field-length-text-attr', 22],
  ])('%s reserves the jar width, %i chars of 8 px', (name, chars) => {
    const width = jarReservedWidth(name);
    expect(width).toBe(chars * 8);
    expect(managed(fixtureText(name)).getPreferredDimension(stringBounder, 0, 0).getWidth()).toBe(width);
  });

  it('field-creole: getCharNumber purges <color:red>/</color> but keeps ** and // (19 chars, 152 px)', () => {
    expect(managed(CREOLE).getPreferredDimension(stringBounder, 0, 0).getWidth()).toBe(152);
  });

  it('counts each <&icon> as two characters (java:69)', () => {
    expect(managed('<&star><&x-y>').getPreferredDimension(stringBounder, 0, 0).getWidth()).toBe(32);
  });

  it('draws the trimmed text (StringUtils.trin, java:61)', () => {
    const p = managed('  ab  ');
    expect(p.pure(stringBounder).getWidth()).toBe(probe('ab').pure(stringBounder).getWidth());
    expect(p.getPreferredDimension(stringBounder, 0, 0).getWidth()).toBe(48);
  });

  it('keeps the text width when it exceeds charLength * 8 (Math.max, java:92)', () => {
    const p = managed('<size:40>W');
    const pure = p.pure(stringBounder);
    expect(pure.getWidth()).toBeGreaterThan(8);
    expect(p.getPreferredDimension(stringBounder, 0, 0).getWidth()).toBe(pure.getWidth());
  });

  it('an empty managed text has charLength 0: the pure dimension (java:86-88)', () => {
    const p = managed('');
    expect(p.getPreferredDimension(stringBounder, 0, 0).getWidth()).toBe(p.pure(stringBounder).getWidth());
  });
});
