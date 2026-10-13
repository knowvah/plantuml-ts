/**
 * `ITFLeaf` (wbs/ITFLeaf.java) against the 1.2026.8beta1 jar.
 *
 * Jar values:
 * - `test-results/dot-cache/wbs/WBS-monoline-def-0-5/in.svg`: boxed leaf
 *   `L11` is `<rect width="40.025" height="32">`; boxless leaf `L22` hangs
 *   off its link at y=146 (= top + h/2) with its text baseline at 149.333
 *   (= top + 1 + 9.333, the box text's own `111.333 - 92 - 10`), so its top
 *   is 139 and h = 14; its LEFT twin `L21` (same text width) starts at
 *   116.375 and ends at its link 139.4, so w = 23.025.
 * - `test-results/dot-cache/wbs/mogume-53-tuxe939/in.svg` (`node { width
 *   auto }`): every level-2 boxed leaf under `Implementation` is drawn
 *   199.325 wide, the widest sibling `Deploy to production environment`
 *   (`textLength 179.325` + 2 * Padding 10); `Code` is drawn at
 *   (280.675, 139).
 * - `BOXLESS_AUTO` (authored, `scripts/oracle-render.sh`): the boxless
 *   `a` is drawn at x=74.35 under a leaf whose link ends at 44.65, centred
 *   in the 69.075 forced width of `Longer label` (`textLength 66.075` + 3).
 *
 * `WElement` is T1a's (batch 1, parallel); {@link fakeIdea} is a minimal
 * double: the leaf signature of `WElement.java:14-35` merged on its own
 * (no ancestor `addStar` merges -- the default skin and these `<style>`
 * blocks carry no starred/level rule they would add).
 */
import { describe, expect, it } from 'vitest';
import { UTranslate } from '../../../src/core/klimt/UTranslate.js';
import type { UGraphic } from '../../../src/core/klimt/UGraphic.js';
import { Display } from '../../../src/core/klimt/creole/Display.js';
import { Rankdir } from '../../../src/core/klimt/geom/Rankdir.js';
import type { XDimension2D } from '../../../src/core/klimt/geom/XDimension2D.js';
import { XPoint2D } from '../../../src/core/klimt/geom/XPoint2D.js';
import { Pragma } from '../../../src/core/skin/Pragma.js';
import type { Style } from '../../../src/core/style/Style.js';
import { StyleSignatureBasic } from '../../../src/core/style/StyleSignatureBasic.js';
import { IdeaShape } from '../../../src/diagrams/mindmap/IdeaShape.js';
import type { SkinParam } from '../../../src/diagrams/mindmap/mindmap-skin-param.js';
import { ITFLeaf } from '../../../src/diagrams/wbs/ITFLeaf.js';
import type { WElementSlice } from '../../../src/diagrams/wbs/WBSTextBlock.js';
import { parseMindMap, stringBounder, svgGraphic } from '../mindmap/helpers/mindmap-skin.js';

/**
 * The jar prints every length to 3 decimals (`SvgGraphics#format`); widths
 * are float32 text widths (`DeterministicMeasurer`), so a dimension is
 * compared at that precision.
 */
function svgNumber(n: number): number {
  return Number(n.toFixed(3));
}

const DRAWN = /<rect\b[^>]*\/>|<text\b[^>]*>[^<]*<\/text>/g;

const WIDTH_AUTO = `<style>
wbsDiagram {
  node {
    width auto
  }
}
</style>`;

/** The production `SkinParam` (style builder + `atomOps`) over `style`. */
function skinParam(style = ''): SkinParam {
  return parseMindMap(`@startmindmap\n${style}\n* r\n@endmindmap`, Rankdir.LEFT_TO_RIGHT).getSkinParam();
}

interface FakeIdea extends WElementSlice {
  readonly geometry: { position: UTranslate; dimension: XDimension2D }[];
}

function fakeIdea(skin: SkinParam, text: string, shape: IdeaShape, level = 2): FakeIdea {
  const names = shape === IdeaShape.NONE ? (['leafNode', 'boxless'] as const) : (['leafNode'] as const);
  const signature = StyleSignatureBasic.of('root', 'element', 'wbsDiagram', 'node', ...names).addLevel(level);
  const geometry: { position: UTranslate; dimension: XDimension2D }[] = [];
  return {
    geometry,
    getLevel: () => level,
    getLabel: () => Display.getWithNewlines(Pragma.createEmpty(), text),
    getShape: () => shape,
    getStereotype: () => undefined,
    getStyle: (): Style => signature.getMergedStyle(skin.getCurrentStyleBuilder())!,
    getStyleBuilder: () => skin.getCurrentStyleBuilder(),
    withBackColor: (s) => s,
    setGeometry: (position, dimension) => geometry.push({ position, dimension }),
  };
}

function leaf(text: string, shape: IdeaShape, style = ''): { leaf: ITFLeaf; idea: FakeIdea } {
  const skin = skinParam(style);
  const idea = fakeIdea(skin, text, shape);
  return { leaf: new ITFLeaf(idea, skin, skin.atomOps), idea };
}

function drawnAt(block: ITFLeaf, x: number, y: number): string[] {
  const ug = svgGraphic();
  block.drawU(ug.apply(new UTranslate(x, y)));
  return ug.getSvgString().match(DRAWN) ?? [];
}

function dim(block: ITFLeaf): [number, number] {
  const d = block.calculateDimension(stringBounder());
  return [svgNumber(d.getWidth()), svgNumber(d.getHeight())];
}

describe('ITFLeaf box per shape (ITFLeaf.java:64-81)', () => {
  it('BOX: the FtileBoxOld, L11 of WBS-monoline-def-0-5 is 40.025 x 32', () => {
    expect(dim(leaf('L11', IdeaShape.BOX).leaf)).toEqual([40.025, 32]);
  });

  it('NONE: creole text with withMargin(0, 3, 1, 1), L22 of WBS-monoline-def-0-5 is 23.025 x 14', () => {
    expect(dim(leaf('L22', IdeaShape.NONE).leaf)).toEqual([23.025, 14]);
  });

  it('PSEUDO: EMPTY_TEXT_BLOCK, 0 x 0, draws nothing', () => {
    const { leaf: block } = leaf('ignored', IdeaShape.PSEUDO);
    expect(dim(block)).toEqual([0, 0]);
    expect(drawnAt(block, 0, 0)).toEqual([]);
  });

  it('BOX draws the jar rect and text of L11 at its jar position', () => {
    expect(drawnAt(leaf('L11', IdeaShape.BOX).leaf, 56.35, 139)).toEqual([
      '<rect x="56.35" y="139" width="40.025" height="32" fill="#F1F1F1" style="stroke:#181818;stroke-width:1.5;"/>',
      '<text x="66.35" y="158.333" fill="#000" font-size="12" textLength="20.025">L11</text>',
    ]);
  });

  it('NONE draws the jar text of L22 at its jar position (left margin 0, top margin 1)', () => {
    expect(drawnAt(leaf('L22', IdeaShape.NONE).leaf, 159.4, 139)).toEqual([
      '<text x="159.4" y="149.333" fill="#000" font-size="12" textLength="20.025">L22</text>',
    ]);
  });
});

describe('ITFLeaf.setForcedMinWidth (ITFLeaf.java:91-105, 112-119)', () => {
  it('BOX: setMinimumWidth widens the FtileBoxOld -- mogume-53-tuxe939 Code drawn 199.325 wide', () => {
    const { leaf: block } = leaf('Code', IdeaShape.BOX, WIDTH_AUTO);
    block.setForcedMinWidth(199.325);
    expect(dim(block)).toEqual([199.325, 32]);
    expect(drawnAt(block, 280.675, 139)).toEqual([
      '<rect x="280.675" y="139" width="199.325" height="32" fill="#F1F1F1" style="stroke:#181818;stroke-width:1.5;"/>',
      '<text x="290.675" y="158.333" fill="#000" font-size="12" textLength="28.725">Code</text>',
    ]);
  });

  it('NONE: the dimension widens and drawU centres the text by (forced - width) / 2 (BOXLESS_AUTO a)', () => {
    const { leaf: block } = leaf('a', IdeaShape.NONE, WIDTH_AUTO);
    block.setForcedMinWidth(69.075);
    expect(dim(block)).toEqual([69.075, 14]);
    expect(drawnAt(block, 44.65, 139)).toEqual(['<text x="74.35" y="149.333" fill="#000" font-size="12">a</text>']);
  });

  it('NONE: a forced width at or below the box width changes nothing', () => {
    const { leaf: block } = leaf('L22', IdeaShape.NONE);
    block.setForcedMinWidth(10);
    expect(dim(block)).toEqual([23.025, 14]);
    expect(drawnAt(block, 159.4, 139)).toEqual([
      '<text x="159.4" y="149.333" fill="#000" font-size="12" textLength="20.025">L22</text>',
    ]);
  });

  it('PSEUDO: no fbox, so the empty block widens like a boxless one', () => {
    const { leaf: block } = leaf('ignored', IdeaShape.PSEUDO);
    block.setForcedMinWidth(12);
    expect(dim(block)).toEqual([12, 0]);
  });

  it('getMainBoxWidth is the ITF default: the dimension width', () => {
    const { leaf: block } = leaf('L22', IdeaShape.NONE);
    expect(svgNumber(block.getMainBoxWidth(stringBounder()))).toBe(23.025);
    block.setForcedMinWidth(40);
    expect(block.getMainBoxWidth(stringBounder())).toBe(40);
  });
});

describe('ITFLeaf.drawU records the geometry (ITFLeaf.java:107-111)', () => {
  it('an AbstractCommonUGraphic: setGeometry(its translate, the dimension)', () => {
    const { leaf: block, idea } = leaf('L11', IdeaShape.BOX);
    drawnAt(block, 56.35, 139);
    expect(idea.geometry).toHaveLength(1);
    expect([idea.geometry[0]!.position.getDx(), idea.geometry[0]!.position.getDy()]).toEqual([56.35, 139]);
    const recorded = idea.geometry[0]!.dimension;
    expect([svgNumber(recorded.getWidth()), recorded.getHeight()]).toEqual([40.025, 32]);
  });

  it('the widened boxless dimension is the one recorded', () => {
    const { leaf: block, idea } = leaf('a', IdeaShape.NONE, WIDTH_AUTO);
    block.setForcedMinWidth(69.075);
    drawnAt(block, 44.65, 139);
    expect(idea.geometry[0]!.dimension.getWidth()).toBe(69.075);
  });

  it('any other UGraphic: no geometry is recorded, the box still draws', () => {
    const { leaf: block, idea } = leaf('ignored', IdeaShape.PSEUDO);
    const bounder = stringBounder();
    const drawn: unknown[] = [];
    const ug: UGraphic = {
      apply: () => ug,
      draw: (shape) => drawn.push(shape),
      getParam: () => {
        throw new Error('unreached');
      },
      getTranslate: () => new UTranslate(0, 0),
      getStringBounder: () => bounder,
    };
    block.drawU(ug);
    expect(idea.geometry).toEqual([]);
  });
});

describe('ITFLeaf anchors (ITFLeaf.java:123-141)', () => {
  const { leaf: block } = leaf('L11', IdeaShape.BOX);
  const sb = stringBounder();

  it.each([
    ['T1', block.getT1(sb), new XPoint2D(20.0125, 0)],
    ['T2', block.getT2(sb), new XPoint2D(20.0125, 32)],
    ['F1', block.getF1(sb), new XPoint2D(0, 16)],
    ['F2', block.getF2(sb), new XPoint2D(40.025, 16)],
  ])('%s', (_name, actual, expected) => {
    expect(actual.getX()).toBeCloseTo(expected.getX(), 3);
    expect(actual.getY()).toBe(expected.getY());
  });

  it('a widened boxless leaf anchors on the forced width', () => {
    const { leaf: wide } = leaf('L22', IdeaShape.NONE);
    wide.setForcedMinWidth(50);
    expect([wide.getF2(sb).getX(), wide.getT1(sb).getX(), wide.getT2(sb).getY()]).toEqual([50, 25, 14]);
  });
});
