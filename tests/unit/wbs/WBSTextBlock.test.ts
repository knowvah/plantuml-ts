/**
 * `WBSTextBlock` (wbs/WBSTextBlock.java) -- `buildMain`, `isAutoWidth`,
 * `getIdea` -- through a minimal concrete subclass.
 *
 * Jar values: `test-results/dot-cache/wbs/WBS-monoline-def-0-5/in.svg`,
 * where the boxed `Line 1` is `<rect width="52.7" height="32">` and the
 * boxless `L22` is 23.025 x 14 (derivation in `ITFLeaf.test.ts`).
 *
 * `WElement` is T1a's (batch 1, parallel); {@link fakeIdea} is a minimal
 * double: the `WElement.java:14-35` node signature merged on its own.
 */
import { describe, expect, it } from 'vitest';
import { ColorType } from '../../../src/core/abel/ColorType.js';
import { Colors } from '../../../src/core/abel/Colors.js';
import type { ISkinParamWithSimple } from '../../../src/core/abel/ISkinParam.js';
import { UTranslate } from '../../../src/core/klimt/UTranslate.js';
import type { UGraphic } from '../../../src/core/klimt/UGraphic.js';
import { HColorSet } from '../../../src/core/klimt/color/HColorSet.js';
import { Display } from '../../../src/core/klimt/creole/Display.js';
import type { StringBounder } from '../../../src/core/klimt/font/StringBounder.js';
import { Rankdir } from '../../../src/core/klimt/geom/Rankdir.js';
import { XDimension2D } from '../../../src/core/klimt/geom/XDimension2D.js';
import type { TextBlock } from '../../../src/core/klimt/shape/TextBlock.js';
import { TextBlockUtils } from '../../../src/core/klimt/shape/TextBlockUtils.js';
import { SkinParamColors } from '../../../src/core/skin/SkinParamColors.js';
import { Pragma } from '../../../src/core/skin/Pragma.js';
import type { Style } from '../../../src/core/style/Style.js';
import { StyleSignatureBasic } from '../../../src/core/style/StyleSignatureBasic.js';
import { FtileBoxOld } from '../../../src/diagrams/activity/ftile/vertical/FtileBoxOld.js';
import { IdeaShape } from '../../../src/diagrams/mindmap/IdeaShape.js';
import type { SkinParam } from '../../../src/diagrams/mindmap/mindmap-skin-param.js';
import { WBSTextBlock, type WElementSlice } from '../../../src/diagrams/wbs/WBSTextBlock.js';
import { parseMindMap, stringBounder, svgGraphic } from '../mindmap/helpers/mindmap-skin.js';

/**
 * The jar prints every length to 3 decimals (`SvgGraphics#format`); widths
 * are float32 text widths (`DeterministicMeasurer`), so a dimension is
 * compared at that precision.
 */
function svgNumber(n: number): number {
  return Number(n.toFixed(3));
}

const RECT = /<rect\b[^>]*\/>/g;

function skinParam(style = ''): SkinParam {
  return parseMindMap(`@startmindmap\n${style}\n* r\n@endmindmap`, Rankdir.LEFT_TO_RIGHT).getSkinParam();
}

function widthStyle(value: string): string {
  return `<style>\nwbsDiagram {\n  node {\n    width ${value}\n  }\n}\n</style>`;
}

interface IdeaSpec {
  readonly text?: string;
  readonly shape?: IdeaShape;
  readonly withBackColor?: (skin: ISkinParamWithSimple) => ISkinParamWithSimple;
}

function fakeIdea(skin: SkinParam, spec: IdeaSpec = {}): WElementSlice {
  const shape = spec.shape ?? IdeaShape.BOX;
  const names = shape === IdeaShape.NONE ? (['leafNode', 'boxless'] as const) : (['leafNode'] as const);
  const signature = StyleSignatureBasic.of('root', 'element', 'wbsDiagram', 'node', ...names).addLevel(2);
  return {
    getLevel: () => 2,
    getLabel: () => Display.getWithNewlines(Pragma.createEmpty(), spec.text ?? 'Line 1'),
    getShape: () => shape,
    getStereotype: () => undefined,
    getStyle: (): Style => signature.getMergedStyle(skin.getCurrentStyleBuilder())!,
    getStyleBuilder: () => skin.getCurrentStyleBuilder(),
    withBackColor: spec.withBackColor ?? ((s) => s),
    setGeometry: () => undefined,
  };
}

/** The smallest concrete `WBSTextBlock`: exposes the protected members. */
class Probe extends WBSTextBlock {
  protected calculateDimensionSlow(): XDimension2D {
    return new XDimension2D(0, 0);
  }

  drawU(_ug: UGraphic): void {}

  main(idea: WElementSlice): TextBlock {
    return this.buildMain(idea);
  }

  autoWidth(): boolean {
    return this.isAutoWidth();
  }

  exposedIdea(): WElementSlice {
    return this.getIdea();
  }
}

function probe(spec: IdeaSpec = {}, style = ''): { probe: Probe; idea: WElementSlice } {
  const skin = skinParam(style);
  const idea = fakeIdea(skin, spec);
  return { probe: new Probe(skin, idea, skin.atomOps), idea };
}

function dim(block: TextBlock, sb: StringBounder = stringBounder()): [number, number] {
  const d = block.calculateDimension(sb);
  return [svgNumber(d.getWidth()), svgNumber(d.getHeight())];
}

describe('WBSTextBlock.buildMain (WBSTextBlock.java:102-114)', () => {
  it('BOX: FtileBoxOld.createWbs, Line 1 of WBS-monoline-def-0-5 is 52.7 x 32', () => {
    const { probe: p, idea } = probe();
    const main = p.main(idea);
    expect(main).toBeInstanceOf(FtileBoxOld);
    expect(dim(main)).toEqual([52.7, 32]);
  });

  it('BOX: the box is built over idea.withBackColor(skinParam)', () => {
    const red = HColorSet.instance().getColorOrWhite('red');
    const seen: ISkinParamWithSimple[] = [];
    const { probe: p, idea } = probe({
      withBackColor: (s) => {
        seen.push(s);
        return new SkinParamColors(s, Colors.empty().add(ColorType.BACK, red));
      },
    });
    const ug = svgGraphic();
    p.main(idea).drawU(ug.apply(new UTranslate(0, 0)));
    expect(seen).toHaveLength(1);
    expect(ug.getSvgString().match(RECT)).toEqual([
      '<rect x="0" y="0" width="52.7" height="32" fill="#F00" style="stroke:#181818;stroke-width:1.5;"/>',
    ]);
  });

  it('NONE: creole text with withMargin(0, 3, 1, 1), L22 is 23.025 x 14', () => {
    const { probe: p, idea } = probe({ text: 'L22', shape: IdeaShape.NONE });
    expect(dim(p.main(idea))).toEqual([23.025, 14]);
  });

  it('NONE with an unparsable HorizontalAlignment (null upstream) lays out LEFT', () => {
    const style = '<style>\nwbsDiagram {\n  node {\n    HorizontalAlignment nowhere\n  }\n}\n</style>';
    const { probe: p, idea } = probe({ text: 'L22', shape: IdeaShape.NONE }, style);
    expect(idea.getStyle().getHorizontalAlignment()).toBeUndefined();
    expect(dim(p.main(idea))).toEqual([23.025, 14]);
  });

  it('PSEUDO: TextBlockUtils.EMPTY_TEXT_BLOCK itself', () => {
    const { probe: p, idea } = probe({ shape: IdeaShape.PSEUDO });
    expect(p.main(idea)).toBe(TextBlockUtils.EMPTY_TEXT_BLOCK);
  });

  it('reads the idea it is given, not the one it was built over', () => {
    const skin = skinParam();
    const p = new Probe(skin, fakeIdea(skin), skin.atomOps);
    expect(dim(p.main(fakeIdea(skin, { text: 'L22', shape: IdeaShape.NONE })))).toEqual([23.025, 14]);
  });
});

describe('WBSTextBlock.isAutoWidth (WBSTextBlock.java:77-80)', () => {
  it.each([
    ['no Width', '', false],
    ['width auto', widthStyle('auto'), true],
    ['width AUTO (equalsIgnoreCase)', widthStyle('AUTO'), true],
    ['width 100', widthStyle('100'), false],
  ])('%s', (_what, style, expected) => {
    expect(probe({}, style).probe.autoWidth()).toBe(expected);
  });
});

describe('WBSTextBlock.getIdea (WBSTextBlock.java:82-84)', () => {
  it('is the idea the block was built over', () => {
    const { probe: p, idea } = probe();
    expect(p.exposedIdea()).toBe(idea);
  });
});
