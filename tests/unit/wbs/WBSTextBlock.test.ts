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
import { Stereotype } from '../../../src/core/stereo/Stereotype.js';
import { Pragma } from '../../../src/core/skin/Pragma.js';
import type { Style } from '../../../src/core/style/Style.js';
import type { StyleBuilder } from '../../../src/core/style/StyleBuilder.js';
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
  readonly level?: number;
  readonly stereotype?: string;
  readonly withBackColor?: (skin: ISkinParamWithSimple) => ISkinParamWithSimple;
}

function fakeIdea(skin: SkinParam, spec: IdeaSpec = {}): WElementSlice {
  const shape = spec.shape ?? IdeaShape.BOX;
  const names = shape === IdeaShape.NONE ? (['leafNode', 'boxless'] as const) : (['leafNode'] as const);
  const level = spec.level ?? 2;
  const stereotype = Stereotype.build(spec.stereotype);
  const signature = StyleSignatureBasic.of('root', 'element', 'wbsDiagram', 'node', ...names).addLevel(level);
  return {
    getLevel: () => level,
    getLabel: () => Display.getWithNewlines(Pragma.createEmpty(), spec.text ?? 'Line 1'),
    getShape: () => shape,
    getStereotype: () => stereotype,
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

  line(ug: UGraphic, x1: number, y1: number, x2: number, y2: number): void {
    this.drawLine(ug, x1, y1, x2, y2);
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

/**
 * `drawLine` against the jar's `<line>`s. `BIKOPA` is the `<style>` of
 * `test-results/dot-cache/wbs/bikopa-92-joza078` (arrow green, `:depth(0)`
 * red, `arrow :depth(2)` blue 0.5 dashed 4). `HOT` is an authored probe
 * (`scripts/oracle-render.sh`): `* R <<hot>>` / `** b <<hot>>` / `*** c`
 * under `wbsDiagram { .hot { arrow { LineColor red } } }`, whose `b`
 * links are drawn `<line x1="80.013" y1="155" x2="90.013" y2="155"
 * style="stroke:#F00;stroke-width:1.5;"/>`.
 */
describe('WBSTextBlock.drawLine / getStyleUsed (WBSTextBlock.java:86-100)', () => {
  const LINE = /<line\b[^>]*\/>/g;
  const BIKOPA = `<style>
wbsDiagram {
  Linecolor black
  arrow {
    LineColor green
  }
  :depth(0) {
      BackgroundColor White
      RoundCorner 10
      LineColor red
  }
  arrow {
    :depth(2) {
      LineColor blue
      LineStyle 4
      LineThickness .5
    }
  }
  node {
    :depth(2) {
      LineStyle 2
      LineThickness 2.5
    }
  }
}
</style>`;
  const HOT = `<style>
wbsDiagram {
  .hot {
    arrow {
      LineColor red
    }
  }
}
</style>`;

  function lines(spec: IdeaSpec, style: string, x1: number, y1: number, x2: number, y2: number): string[] {
    const { probe: p } = probe(spec, style);
    const ug = svgGraphic();
    p.line(ug, x1, y1, x2, y2);
    return ug.getSvgString().match(LINE) ?? [];
  }

  it('drawLine(ug, 30, 5, 10, 5) starts at x=10 under the default arrow style', () => {
    expect(lines({}, '', 30, 5, 10, 5)).toEqual([
      '<line x1="10" y1="5" x2="30" y2="5" style="stroke:#181818;stroke-width:1.5;"/>',
    ]);
  });

  it('y1 stays with the smaller x and y2 with the larger, whichever end each came from', () => {
    expect(lines({}, '', 30, 5, 10, 20)).toEqual([
      '<line x1="10" y1="5" x2="30" y2="20" style="stroke:#181818;stroke-width:1.5;"/>',
    ]);
  });

  it.each([
    [
      'level 0: :depth(0) red',
      0,
      [105.35, 72, 105.35, 92],
      '<line x1="105.35" y1="72" x2="105.35" y2="92" style="stroke:#F00;stroke-width:1.5;"/>',
    ],
    [
      'level 1, a LEFT link (x1 > x2): arrow green',
      1,
      [105.35, 155, 95.35, 155],
      '<line x1="95.35" y1="155" x2="105.35" y2="155" style="stroke:#008000;stroke-width:1.5;"/>',
    ],
    [
      'level 2: arrow :depth(2) blue, 0.5, dashed 4',
      2,
      [144.362, 218, 144.362, 249],
      '<line x1="144.362" y1="218" x2="144.362" y2="249" style="stroke:#00F;stroke-width:0.5;stroke-dasharray:4,4;"/>',
    ],
  ] as const)('bikopa-92-joza078 %s', (_what, level, [x1, y1, x2, y2], expected) => {
    expect(lines({ level }, BIKOPA, x1, y1, x2, y2)).toEqual([expected]);
  });

  it('the stereotype reaches the arrow signature (withTOBECHANGED): <<hot>> is red', () => {
    expect(lines({ level: 1, stereotype: '<<hot>>' }, HOT, 80.013, 155, 90.013, 155)).toEqual([
      '<line x1="80.013" y1="155" x2="90.013" y2="155" style="stroke:#F00;stroke-width:1.5;"/>',
    ]);
  });

  it('without the stereotype the .hot arrow style does not apply', () => {
    expect(lines({ level: 1 }, HOT, 80.013, 155, 90.013, 155)).toEqual([
      '<line x1="80.013" y1="155" x2="90.013" y2="155" style="stroke:#181818;stroke-width:1.5;"/>',
    ]);
  });

  it('no merged arrow style (null upstream) is the NPE Java hits in drawLine', () => {
    const skin = skinParam();
    // StyleSignatureBasic.getMergedStyle(null) is null (StyleSignatureBasic.java:253-259).
    const idea = { ...fakeIdea(skin), getStyleBuilder: () => undefined as unknown as StyleBuilder };
    const p = new Probe(skin, idea, skin.atomOps);
    expect(() => p.line(svgGraphic(), 0, 0, 1, 0)).toThrow(/NullPointerException/);
  });
});
