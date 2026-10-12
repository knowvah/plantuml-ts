/**
 * `PSystemSalt` (PSystemSalt.java:87-246): `add`'s `expandsNewline` split,
 * `manageSprite`'s line filter (`hide stereotype`, `skinparam `, `scale `,
 * `sprite $`), `createElement`'s first-ready root factory and its
 * `IllegalArgumentException`, `getTextBlock`'s preferred dimension and its
 * two z-index passes, `getDefaultMargins()` and the `document` background.
 */
import { describe, expect, it, vi } from 'vitest';
import { ClockwiseTopRightBottomLeft } from '../../../src/core/klimt/geom/ClockwiseTopRightBottomLeft.js';
import { buildMindmapStyleBuilder } from '../../../src/core/style/mindmap-style-builder.js';
import { PreprocessingArtifact } from '../../../src/core/tim/PreprocessingArtifact.js';
import { VERSION_PLACEHOLDER } from '../../../src/core/klimt/document-shell.js';
import { basicSvgOption } from '../../../src/core/klimt/drawing/svg/svg-graphics-core.js';
import { UGraphicSvg } from '../../../src/core/klimt/drawing/svg/u-graphic-svg.js';
import type { UGraphic } from '../../../src/core/klimt/UGraphic.js';
import { HorizontalAlignment } from '../../../src/core/klimt/geom/HorizontalAlignment.js';
import { ElementPyramid } from '../../../src/diagrams/salt/element/ElementPyramid.js';
import { PSystemSalt } from '../../../src/diagrams/salt/PSystemSalt.js';
import { measurer, stringBounder } from './salt-test-support.js';

const EMPTY_STYLE: { skinparam: Map<string, string>; styles: string[] } = { skinparam: new Map(), styles: [] };

function salt(lines: readonly string[], style = EMPTY_STYLE): PSystemSalt {
  const diagram = new PSystemSalt({ lines: [] }, new PreprocessingArtifact(), {
    styleBuilder: buildMindmapStyleBuilder(style),
    skinparam: style.skinparam,
  });
  for (const line of lines) diagram.add(line);
  return diagram;
}

function dimensionOf(diagram: PSystemSalt): [number, number] {
  const dim = diagram.getTextBlock(stringBounder).calculateDimension(stringBounder);
  return [dim.getWidth(), dim.getHeight()];
}

describe('PSystemSalt#add — StringLocated.expandsNewline (StringLocated.java:141-143)', () => {
  it('splits on Jaws.BLOCK_E1_NEWLINE (U+E100)', () => {
    expect(salt(['ab']).size()).toBe(2);
  });

  it("drops trailing empty strings like Java's String#split", () => {
    expect(salt(['a']).size()).toBe(1);
    expect(salt(['']).size()).toBe(0);
  });

  it('keeps a line with no separator, even an empty one', () => {
    expect(salt(['']).size()).toBe(1);
    expect(salt(['a']).size()).toBe(2);
  });
});

describe('PSystemSalt#getTextBlock — createElement(manageSprite())', () => {
  it('a pyramid of A | B measures as its root element (dimension 20.x by 14.x, jar canvas 31x25)', () => {
    const [w, h] = dimensionOf(salt(['{', 'A | B', '}']));
    // The jar's canvas is (int)(dim + 2 * 5 + 1): tests/fixtures/salt/hide-stereotype-dropped.svg.
    expect(Math.trunc(w + 10 + 1)).toBe(31);
    expect(Math.trunc(h + 10 + 1)).toBe(25);
  });

  it('drops `hide stereotype` and `skinparam …` lines (PSystemSalt.java:149-152)', () => {
    expect(dimensionOf(salt(['hide stereotype', 'skinparam foo bar', '{', 'A | B', '}']))).toEqual(
      dimensionOf(salt(['{', 'A | B', '}'])),
    );
  });

  it('applies `scale N` reaching the data as ScaleSimple (PSystemSalt.java:153-156)', () => {
    const diagram = salt(['scale 1.5', '{', 'A', '}']);
    expect(diagram.scale).toBeUndefined();
    diagram.getTextBlock(stringBounder);
    expect(diagram.scale).toEqual({ kind: 'simple', factor: 1.5 });
  });

  it('a non-numeric `scale ` is Double.parseDouble’s NumberFormatException', () => {
    expect(() => salt(['scale abc', '{', 'A', '}']).getTextBlock(stringBounder)).toThrow(/NumberFormatException/);
  });

  it('runs a `sprite $` block through the sprite command into the dictionary (PSystemSalt.java:157-166)', () => {
    const diagram = salt(['sprite $dot [2x2/16] {', 'FF', 'FF', '}', '{', 'A', '}']);
    diagram.getTextBlock(stringBounder);
    expect(diagram.getSpriteRegistry().byName.has('dot')).toBe(true);
  });

  it('a `sprite $` first line the multiline regex rejects is executeInternal’s NullPointerException on a null line0', () => {
    expect(() => salt(['sprite $dot nodim {', 'FF', '}', '{', 'A', '}']).getTextBlock(stringBounder)).toThrow(
      /^NullPointerException/,
    );
  });

  it('… unless no data line is left between the first and last ("No sprite defined.", ignored)', () => {
    const diagram = salt(['sprite $dot nodim {', '', '}', '{', 'A', '}']);
    expect(dimensionOf(diagram)).toEqual(dimensionOf(salt(['{', 'A', '}'])));
  });

  it('an unterminated `sprite $` block is the iterator’s NoSuchElementException', () => {
    expect(() => salt(['sprite $dot [2x2/16] {', 'FF']).getTextBlock(stringBounder)).toThrow(/NoSuchElementException/);
  });

  it('no ready root factory is IllegalArgumentException (PSystemSalt.java:214-215)', () => {
    expect(() => salt(['Hello']).getTextBlock(stringBounder)).toThrow(/^IllegalArgumentException/);
  });

  it('empty data never reaches the IAE: ElementFactoryPyramid#ready peeks token 0 (DataSourceImpl.java:116-118)', () => {
    expect(() => salt([]).getTextBlock(stringBounder)).toThrow(/^IndexOutOfBoundsException/);
  });

  it('a bare tree table is a root candidate (PSystemSalt.java:194-198, issue #2730)', () => {
    const [w] = dimensionOf(salt(['{T', '+ a', '}']));
    expect(w).toBeGreaterThan(0);
  });

  it('draws the root element at z-index 0, then 1, at its preferred dimension (PSystemSalt.java:118-122)', () => {
    const block = salt(['{', 'A', '}']).getTextBlock(stringBounder);
    const spy = vi.spyOn(ElementPyramid.prototype, 'drawU');
    try {
      block.drawU(svgUGraphic());
      const dim = block.calculateDimension(stringBounder);
      expect(spy.mock.calls.map((c) => c[1])).toEqual([0, 1]);
      for (const call of spy.mock.calls) expect(call[2]).toEqual(dim);
    } finally {
      spy.mockRestore();
    }
  });
});

describe('PSystemSalt — TitledDiagram members', () => {
  it('getDefaultMargins() is same(5) (PSystemSalt.java:237-240)', () => {
    expect(salt([]).getDefaultMargins()).toEqual(ClockwiseTopRightBottomLeft.same(5));
  });

  it('getDescription() is "(Salt)" (PSystemSalt.java:134-136)', () => {
    expect(salt([]).getDescription()).toBe('(Salt)');
  });

  it('the document background is the default skin’s white', () => {
    expect(salt([]).calculateBackColor().asPaint()).toBe('#FFFFFF');
  });

  it('`root { BackGroundColor }` in a <style> reaches the document background (TitledDiagram.java:279-289)', () => {
    const style = { skinparam: new Map<string, string>(), styles: ['root {\n BackGroundColor #pink\n}'] };
    expect(salt([], style).calculateBackColor().asPaint()).toBe('#FFC0CB');
  });

  it('getDpi: `skinparam dpi` when all digits and positive, else 96 (SkinParam.java:650-656)', () => {
    const dpi = (value: string): number =>
      salt([], { skinparam: new Map([['dpi', value]]), styles: [] })
        .getSkinParam()
        .getDpi();
    expect(dpi('192')).toBe(192);
    expect(dpi('0')).toBe(96);
    expect(dpi('1.5')).toBe(96);
    expect(salt([]).getSkinParam().getDpi()).toBe(96);
  });

  it('the SkinParam members salt never reaches throw rather than guess', () => {
    const skinParam = salt([]).getSkinParam();
    const calls: (() => unknown)[] = [
      () => skinParam.getFontHtmlColor(undefined),
      () => skinParam.getFont(undefined, false),
      () => skinParam.getHyperlinkColor(),
      () => skinParam.useUnderlineForHyperlink(),
      () => skinParam.getTabSize(),
      () => skinParam.getDefaultTextAlignment(HorizontalAlignment.LEFT),
      () => skinParam.strictUmlStyle(),
    ];
    for (const call of calls) expect(call).toThrow(/^unported: SkinParam#/);
  });

  it('addSprite puts the sprite in the dictionary (PSystemSalt.java:138-140)', () => {
    const diagram = salt([]);
    const sprite = salt(['sprite $dot [2x2/16] {', 'FF', 'FF', '}', '{', 'A', '}']);
    sprite.getTextBlock(stringBounder);
    diagram.addSprite('copy', sprite.getSpriteRegistry().byName.get('dot')!);
    expect(diagram.getSpriteRegistry().byName.has('copy')).toBe(true);
  });

  it('getValue reads the skinparam map through cleanForKey', () => {
    const style = { skinparam: new Map([['Handwritten', ' true ']]), styles: [] };
    expect(salt([], style).getSkinParam().getValue('handwritten')).toBe('true');
    expect(salt([], style).getSkinParam().getValue('monochrome')).toBeNull();
  });
});

function svgUGraphic(): UGraphic {
  return UGraphicSvg.build(
    0,
    basicSvgOption(),
    VERSION_PLACEHOLDER,
    { calculateDimension: (font, text) => ({ width: measurer.measure(text, font).width }) },
    measurer,
  );
}
